/**
 * Compose preview controller — translates what the user types, live, before they
 * send it, and shows it in a floating panel above the chat box.
 *
 * Flow per settled keystroke: debounce → cheap gates (`decideComposeAction`) →
 * in-tab cache → DeepL-first cloud chain (same background path as incoming). A
 * monotonic sequencer drops stale responses so the preview never flickers, and a
 * rolling rate limiter caps network calls. The panel keeps the previous text
 * visible while a new one loads, so it never blanks. Typing is never blocked: the
 * input listener is passive and the heavy work is fully off the keystroke path.
 */
import type { Settings } from '~/shared/settings';
import { withFavorite } from '~/shared/languages';
import { rootLogger } from '~/shared/logger';
import { createMetrics } from '~/shared/metrics';
import { send } from '~/shared/messages';
import { confidentLanguage, detectLanguage } from './langDetect';
import { extractMessageText, findAllRows, findComposer } from './selectors';
import type { ChipHandlers, ChipState } from './langChip';
import { mountLangChip, unmountLangChip, updateLangChip } from './langChip';
import { memCache } from './memcache';
import {
  COMPOSE_DEBOUNCE_MS,
  COMPOSE_MAX_PER_MIN,
  RateLimiter,
  Sequencer,
  decideComposeAction,
  maskProtected,
  unmaskProtected,
} from './composeLogic';
import {
  insertIntoComposer,
  isComposePreviewMounted,
  isComposePreviewVisible,
  mountComposePreview,
  readComposerText,
  setComposeTargetLang,
  setComposeThrottle,
  unmountComposePreview,
  updateComposePreview,
} from './composeUi';

const log = rootLogger.child('compose');
const metrics = createMetrics('content');

/**
 * Last few channel chat lines (untranslated) → DeepL `context` so the outgoing
 * translation fits the conversation's topic/register. DeepL does NOT bill context
 * characters, so this is free quota-wise.
 */
function readRecentChatContext(): string {
  try {
    const container = document.querySelector('#channel-chatroom');
    if (!container) return '';
    return findAllRows(container)
      .slice(-4)
      .map((r) => extractMessageText(r))
      .filter((t) => t.length > 0)
      .join('\n');
  } catch {
    return '';
  }
}

export class ComposeController {
  private settings: Settings;
  private composer: HTMLElement | undefined;
  private readonly onInput = (): void => this.scheduleEvaluate();
  private readonly onKeydown = (e: KeyboardEvent): void => this.handleKeydown(e);
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private pollTimer: ReturnType<typeof setTimeout> | undefined;
  private polling = false;
  private guard: MutationObserver | undefined;
  private guardTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly seq = new Sequencer();
  private readonly limiter = new RateLimiter(COMPOSE_MAX_PER_MIN, 60_000);
  /** Source text we last produced a preview for — drives dedup. */
  private lastSource: string | undefined;
  /** Last translation shown — what a click inserts. */
  private lastTranslation = '';
  /** Channel's chat language (ISO-2) from Kick's API — the auto compose target. */
  private channelLang: string | undefined;
  private running = false;

  /** Persists a settings change made from the chip (favourites, target language). */
  private readonly persist: (patch: Partial<Settings>) => void;

  constructor(settings: Settings, persist: (patch: Partial<Settings>) => void = () => {}) {
    this.settings = settings;
    this.persist = persist;
  }

  /** What the chip in the message box should currently show. */
  private chipState(): ChipState {
    const favorites = this.settings.favoriteLangs;
    if (!this.settings.enabled) return { mode: 'off', code: '', favorites };
    const auto = this.settings.composeTargetLang === 'auto';
    return {
      mode: auto ? 'auto' : 'pinned',
      code: this.resolveTarget(),
      favorites,
    };
  }

  private syncChip(): void {
    if (this.settings.showComposerChip) updateLangChip(this.chipState());
  }

  private chipHandlers(): ChipHandlers {
    return {
      onPick: (code) => {
        this.persist({
          composeTargetLang: code,
          favoriteLangs: withFavorite(this.settings.favoriteLangs, code),
        });
      },
      onAuto: () => this.persist({ composeTargetLang: 'auto' }),
    };
  }

  start(): void {
    if (this.running) return;
    if (!this.settings.composeEnabled) return;
    this.running = true;
    this.attach();
    this.watch();
  }

  stop(): void {
    this.running = false;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.guardTimer) clearTimeout(this.guardTimer);
    this.guard?.disconnect();
    this.guard = undefined;
    this.polling = false;
    this.detachComposer();
    unmountComposePreview();
    unmountLangChip();
  }

  updateSettings(next: Settings): void {
    const wasEnabled = this.settings.composeEnabled;
    const prevTarget = this.settings.composeTargetLang;
    this.settings = next;

    if (next.composeEnabled && !wasEnabled) {
      this.start();
      return;
    }
    if (!next.composeEnabled && wasEnabled) {
      this.stop();
      return;
    }
    // Output language override changed (options) → re-sync the badge + re-translate.
    if (next.composeEnabled && next.composeTargetLang !== prevTarget) {
      setComposeTargetLang(this.resolveTarget());
      this.lastSource = undefined;
      void this.evaluate();
    }
    this.syncChip();
  }

  /**
   * The channel's chat language, set from Kick's API on each route change. When the
   * target is 'auto' (the default), this becomes the compose target — so the user
   * writes in whatever language the channel speaks, with zero configuration.
   */
  setChannelLang(lang: string | undefined): void {
    if (lang === this.channelLang) return;
    this.channelLang = lang;
    if (this.running && this.settings.composeTargetLang === 'auto') {
      setComposeTargetLang(this.resolveTarget());
      this.lastSource = undefined;
      void this.evaluate();
    }
    this.syncChip();
  }

  /** Effective output language: the detected channel language in 'auto' mode. */
  private resolveTarget(): string {
    return this.settings.composeTargetLang === 'auto'
      ? this.channelLang ?? 'en'
      : this.settings.composeTargetLang;
  }

  // ─── Attach / self-heal ────────────────────────────────────────────────────

  private attach(): void {
    if (!this.running) return;
    const composer = findComposer();
    if (!composer) {
      this.schedulePoll();
      return;
    }
    if (this.composer === composer && isComposePreviewMounted()) return;
    this.bindComposer(composer);
  }

  private schedulePoll(): void {
    if (this.polling) return;
    this.polling = true;
    let attempt = 0;
    const tick = (): void => {
      if (!this.running) {
        this.polling = false;
        return;
      }
      const composer = findComposer();
      if (composer) {
        this.polling = false;
        this.bindComposer(composer);
        return;
      }
      if (attempt++ < 40) this.pollTimer = setTimeout(tick, 500);
      else this.polling = false;
    };
    tick();
  }

  private bindComposer(composer: HTMLElement): void {
    this.detachComposer();
    this.composer = composer;
    composer.addEventListener('input', this.onInput);
    // Kick's Lexical composer does NOT fire a catchable `input` event on
    // delete-to-empty (it emits beforeinput/keyup only), so the preview used to
    // stay up after you cleared the box. `keyup` fires on every key release —
    // Backspace included, and after Enter sends — so re-evaluate there too: an
    // empty box then resolves to 'skip-empty' and the panel hides.
    composer.addEventListener('keyup', this.onInput);
    composer.addEventListener('keydown', this.onKeydown);
    mountComposePreview(composer, this.resolveTarget(), {
      onInsert: () => this.handleInsert(),
    });
    // The chip lives in Kick's message box, not above it: switching the language
    // you write in must never send the pointer to the top of the chat.
    if (this.settings.showComposerChip) {
      mountLangChip(composer, this.chipState(), this.chipHandlers());
    }
    this.lastSource = undefined;
    log.debug('bound to composer', composer.tagName);
    void this.evaluate();
  }

  private detachComposer(): void {
    unmountLangChip();
    this.composer?.removeEventListener('input', this.onInput);
    this.composer?.removeEventListener('keyup', this.onInput);
    this.composer?.removeEventListener('keydown', this.onKeydown);
    this.composer = undefined;
  }

  /**
   * Kick's SPA re-renders the chat subtree, which can swap the composer node or
   * wipe our panel. Re-attach when that happens (debounced, like the floating bar).
   */
  private watch(): void {
    if (this.guard) return;
    this.guard = new MutationObserver(() => {
      if (this.guardTimer) return;
      this.guardTimer = setTimeout(() => {
        this.guardTimer = undefined;
        if (!this.running) return;
        const live = findComposer();
        if (!live) return;
        if (live !== this.composer || !isComposePreviewMounted()) this.bindComposer(live);
      }, 500);
    });
    this.guard.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Translation pipeline ──────────────────────────────────────────────────

  private scheduleEvaluate(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => void this.evaluate(), COMPOSE_DEBOUNCE_MS);
  }

  private async evaluate(): Promise<void> {
    const composer = this.composer;
    if (!composer) return;

    const raw = readComposerText(composer);
    const trimmed = raw.trim();
    const target = this.resolveTarget();
    const detected = trimmed ? detectLanguage(trimmed) : undefined;
    // Looked up rather than guessed. `detected` may carry franc's answer, which is
    // measured at roughly a third correct on short text; this one is undefined
    // unless the language was actually established.
    const confident = trimmed ? confidentLanguage(trimmed) : undefined;

    const action = decideComposeAction(trimmed, this.lastSource, detected, target);
    if (__KT_METRICS__) metrics.count(`compose.action.${action}`);
    if (action === 'skip-same-lang') {
      // The number that decides whether this guard should trust `detected` at all.
      // A skip on a guess is a message silently left untranslated; a skip on a
      // lookup is the guard doing its job. Counting them apart is the only way to
      // tell those two apart after the fact.
      if (__KT_METRICS__) metrics.count(`compose.skipSameLang.${confident ? 'lookedUp' : 'guessed'}`);
    }
    if (action !== 'translate') {
      // 'skip-unchanged' → the panel already shows the right thing, leave it.
      if (action !== 'skip-unchanged') {
        updateComposePreview({ kind: 'hidden' });
        if (action === 'skip-empty') this.lastSource = undefined;
      }
      return;
    }

    // Instant path: in-tab cache hit, zero network, no spinner.
    const cached = memCache.get(trimmed, target);
    if (cached) {
      setComposeThrottle(false);
      this.lastSource = trimmed;
      this.lastTranslation = cached.translatedText;
      updateComposePreview({ kind: 'ready', text: cached.translatedText, provider: cached.provider });
      return;
    }

    if (!this.limiter.tryAcquire()) {
      log.debug('compose rate-limited, skipping network for now');
      setComposeThrottle(true);
      return; // keep last preview; next pause will retry as the window slides
    }

    const id = this.seq.next();
    // Protect @handles and URLs from being translated/mangled in your own message.
    const { masked, tokens } = maskProtected(trimmed);
    updateComposePreview({ kind: 'loading' });
    try {
      const res = await send({
        type: 'translate',
        payload: {
          messageId: `compose:${id}`,
          text: masked,
          targetLang: target,
          // Only a language that was looked up, never one franc guessed. Handing
          // the engine a wrong source makes it translate from a language the text
          // is not in: it either returns the text unchanged, so the preview shows
          // nothing useful, or returns something that is not what was typed.
          // Sending nothing lets the engine detect for itself, which it does well.
          // The incoming path has done this since it was written; this one had not.
          sourceLangHint: confident,
          // Recent channel lines → DeepL `context` (free, not billed) so the output
          // fits the conversation's topic/register.
          context: readRecentChatContext() || undefined,
          // Outgoing message → prefer the polite register where supported (keigo for JA).
          formal: true,
        },
      });
      // Drop stale responses (user kept typing) or ones for text that's since changed.
      if (!this.seq.isCurrent(id)) return;
      if (!this.composer || readComposerText(this.composer).trim() !== trimmed) return;

      if (res.type === 'translate.result' && res.payload.ok) {
        const r = res.payload.result;
        const finalText = unmaskProtected(r.translatedText, tokens);
        setComposeThrottle(false);
        memCache.set(trimmed, target, {
          translatedText: finalText,
          detectedLang: r.detectedLang,
          provider: r.provider,
        });
        this.lastSource = trimmed;
        this.lastTranslation = finalText;
        updateComposePreview({ kind: 'ready', text: finalText, provider: r.provider });
      } else {
        // No valid translation for the current text (provider failed, or a guard
        // rejected it) — hide rather than leave a stale result from earlier text.
        this.lastSource = undefined;
        updateComposePreview({ kind: 'hidden' });
      }
    } catch (err: unknown) {
      if (this.seq.isCurrent(id)) {
        this.lastSource = undefined;
        updateComposePreview({ kind: 'hidden' });
      }
      log.debug('compose translate failed', err);
    }
  }

  // ─── User actions ──────────────────────────────────────────────────────────

  private handleInsert(): void {
    if (!this.composer || !this.lastTranslation) return;
    insertIntoComposer(this.composer, this.lastTranslation, this.settings.composeInsertMode);
    // The preview did its job — hide it (the synthetic insert doesn't re-fire `input`).
    this.dismiss();
  }

  /** Keyboard: Ctrl/Cmd+Enter inserts the preview; Esc dismisses it — only while shown. */
  private handleKeydown(e: KeyboardEvent): void {
    if (!isComposePreviewVisible()) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      this.handleInsert();
    } else if (e.key === 'Escape') {
      this.dismiss();
    }
  }

  /** Hide the preview and mark the current text handled (re-shows when it changes). */
  private dismiss(): void {
    this.lastSource = this.composer ? readComposerText(this.composer).trim() : undefined;
    this.lastTranslation = '';
    updateComposePreview({ kind: 'hidden' });
  }
}
