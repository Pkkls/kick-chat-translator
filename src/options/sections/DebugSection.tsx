import { useState } from 'preact/hooks';
import type { Decision } from '~/shared/messages';
import { useT } from '~/shared/i18nContext';

/**
 * The calls the extension just made, pulled from an open Kick tab.
 *
 * The decisions are made in the content script, which is another context, so
 * this asks for them when you press the button and never subscribes. They live
 * in that page's memory and are never written to storage.
 */
/**
 * Les decisions, comptees par raison, la plus frequente en tete.
 *
 * Le champ `outcome` porte le meme texte que l'infobulle de la ligne de chat,
 * donc les raisons se regroupent telles quelles sans table de correspondance a
 * tenir a jour.
 */
function resumer(rows: Decision[]): [string, number][] {
  const par = new Map<string, number>();
  for (const d of rows) par.set(d.outcome, (par.get(d.outcome) ?? 0) + 1);
  return [...par.entries()].sort((a, b) => b[1] - a[1]);
}

export function DebugSection() {
  const t = useT();
  const [rows, setRows] = useState<Decision[] | null>(null);
  const [note, setNote] = useState('');

  async function load(): Promise<void> {
    setNote('');
    const tabs = await chrome.tabs.query({ url: 'https://kick.com/*' });
    if (tabs.length === 0) {
      setRows([]);
      setNote(t('No Kick tab is open. Open a channel, let the chat run, then read again.'));
      return;
    }
    for (const tab of tabs) {
      if (tab.id === undefined) continue;
      try {
        const res = (await chrome.tabs.sendMessage(tab.id, { type: 'debug.decisions' })) as
          | { type: string; payload: Decision[] }
          | undefined;
        if (res?.type === 'debug.decisions') {
          setRows(res.payload);
          return;
        }
      } catch {
        // That tab has not loaded the content script yet. Try the next one.
      }
    }
    setRows([]);
    setNote(
      t('The open Kick tab has not loaded the extension yet. Reload the tab, then read again.'),
    );
  }

  return (
    <section class="kt-card space-y-3">
      <h2 class="kt-section">{t('Last decisions')}</h2>
      <p class="text-[12px] text-kick-muted">
        {t(
          'Why each recent message was translated or left alone. Read from an open Kick tab, kept in memory there, never saved to disk.',
        )}
      </p>
      <button class="kt-btn-ghost" onClick={() => void load()}>
        {t('Read decisions')}
      </button>

      {note !== '' && <p class="text-[12px] text-kick-muted">{note}</p>}

      {rows !== null && rows.length === 0 && note === '' && (
        <p class="text-[12px] text-kick-muted">
          {t('Nothing recorded yet. Let a chat run for a moment, then read again.')}
        </p>
      )}

      {/* LE COMPTE AVANT LA TABLE. Une liste de cinquante lignes repond
          "qu'est-il arrive a ce message la" ; elle ne repond pas "qu'est-ce
          que mes filtres font", qui est la question qu'on se pose en ouvrant
          cette page. Chaque ligne ici correspond a un reglage de l'onglet
          Filters : trop court vient de la longueur minimale, deja dans ta
          langue du saut, bot de la liste des comptes automatiques. */}
      {rows !== null && rows.length > 0 && (
        <ul class="space-y-1 border-t border-kick-border pt-3">
          {resumer(rows).map(([raison, n]) => (
            <li key={raison} class="flex items-baseline gap-2 text-[12px]">
              <span
                class={`tabular-nums ${raison === 'translated' ? 'text-kick-primary' : 'text-kick-text'}`}
              >
                {n}
              </span>
              <span class="min-w-0 truncate text-kick-muted">{raison}</span>
            </li>
          ))}
        </ul>
      )}

      {rows !== null && rows.length > 0 && (
        <div class="overflow-x-auto">
          <table class="w-full text-start text-[12px]">
            <tbody>
              {rows.map((d, i) => (
                <tr key={i} class="border-t border-kick-border align-top">
                  <td class="py-1 pe-3 whitespace-nowrap text-kick-muted">
                    {new Date(d.at).toLocaleTimeString()}
                  </td>
                  {/* One line, cut with an ellipsis at the column edge rather
                      than broken through the middle of a word. The whole
                      message is on the hover, same as the reason on a chat
                      line. max-w-0 with w-full is what lets a table cell
                      ellipsis at all. */}
                  <td class="py-1 pe-3 max-w-0 w-full truncate" title={d.text}>
                    {d.text}
                  </td>
                  <td
                    class={`py-1 whitespace-nowrap ${
                      d.outcome === 'translated' ? 'text-kick-primary' : 'text-kick-muted'
                    }`}
                  >
                    {d.outcome}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
