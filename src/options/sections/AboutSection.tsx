export function AboutSection() {
  return (
    <section class="kt-card space-y-4">
      <div>
        <h2 class="text-sm font-semibold mb-1">About</h2>
        <p class="text-sm text-kick-muted leading-relaxed">
          Kick Chat Translator listens to chat in real time and translates non-English (or non-target-language)
          messages right under the original. No tracking, no account, fully open-source.
        </p>
      </div>
      <div>
        <h3 class="text-xs uppercase tracking-wider text-kick-muted mb-1">Links</h3>
        <ul class="text-sm space-y-1">
          <li>
            <a class="text-kick-primary underline" href="https://github.com/Pkkls/kick-chat-translator" target="_blank" rel="noreferrer">
              GitHub repository
            </a>
          </li>
          <li>
            <a class="text-kick-primary underline" href="https://github.com/Pkkls/kick-chat-translator/blob/master/PRIVACY.md" target="_blank" rel="noreferrer">
              Privacy policy
            </a>
          </li>
          <li>
            <a class="text-kick-primary underline" href="https://github.com/Pkkls/kick-chat-translator/issues" target="_blank" rel="noreferrer">
              Report an issue
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h3 class="text-xs uppercase tracking-wider text-kick-muted mb-1">How translation happens</h3>
        <ol class="list-decimal list-inside text-sm text-kick-muted space-y-1">
          <li>Your browser connects to Kick's public Pusher WebSocket — no auth needed.</li>
          <li>Each chat message is parsed; emotes and links are stripped before translation.</li>
          <li>The extension picks the first available provider in your chain.</li>
          <li>Translations are cached locally in IndexedDB to avoid duplicate calls.</li>
        </ol>
      </div>
    </section>
  );
}
