/**
 * Runs in the PAGE's world (chrome.scripting, world: 'MAIN'), so it must stay
 * self-contained: no imports, no outer variables, it is sent as source text.
 *
 * Kick's composer is a Lexical editor, and its emotes are `custom-emote` nodes
 * that neither a pasted <img> nor typed [emote:id:name] text recreates, and
 * that a select-all replace deletes. Editing through DOM selections raced
 * Lexical's async selectionchange and wrote words in the wrong place, even
 * while the user was typing (measured on kick.com, 2026-10-16). So the editor
 * state is rewritten in one go through Lexical's public instance API: the text
 * nodes between emotes get the translated words, the emote nodes are kept as
 * they are.
 *
 * parts[i] is the text before emote i, the last part the text after the last.
 */
export function ecrireAutourDesEmotes(parts: string[]): boolean {
  type Node = { type: string; text?: string; children?: Node[] };
  type Editor = {
    getEditorState(): { toJSON(): { root: Node } };
    parseEditorState(json: unknown): unknown;
    setEditorState(state: unknown): void;
    focus(cb?: () => void, opts?: { defaultSelection: 'rootEnd' }): void;
  };
  const el = document.querySelector('[data-kt-composer]') as (Element & { __lexicalEditor?: Editor }) | null;
  const ed = el?.__lexicalEditor;
  if (!ed) return false;

  const json = ed.getEditorState().toJSON();
  const texte = (text: string): Node =>
    ({ detail: 0, format: 0, mode: 'normal', style: '', text, type: 'text', version: 1 }) as Node;
  let gap = 0;
  let emotes = 0;
  const ecrit = new Set<number>();
  let dernierParagraphe: Node[] | undefined;

  const parcourir = (enfants: Node[]): Node[] => {
    const out: Node[] = [];
    for (const n of enfants) {
      if (n.type === 'custom-emote') {
        // No text before this emote in the editor but some in the translation.
        const avant = parts[gap];
        if (!ecrit.has(gap) && avant?.trim()) out.push(texte(avant));
        ecrit.add(gap);
        gap++;
        emotes++;
        out.push(n);
      } else if (n.type === 'text' || n.type === 'custom-mention' || n.type === 'zeroWidth') {
        // First text node of a stretch takes its words, the others go. A picked
        // @mention is its own node, but its "@name" is already in the translated
        // words (kept by maskProtected): keeping the node too wrote it twice.
        const mots = parts[gap];
        if (!ecrit.has(gap) && mots) out.push(texte(mots));
        ecrit.add(gap);
      } else if (Array.isArray(n.children)) {
        const copie = { ...n, children: parcourir(n.children) };
        if (n.type === 'paragraph') dernierParagraphe = copie.children;
        out.push(copie);
      } else {
        out.push(n);
      }
    }
    return out;
  };

  json.root.children = parcourir(json.root.children ?? []);
  if (emotes !== parts.length - 1) return false; // not the composer we read: leave it
  const fin = parts[gap];
  if (!ecrit.has(gap) && fin?.trim() && dernierParagraphe) dernierParagraphe.push(texte(fin));

  ed.setEditorState(ed.parseEditorState(json));
  ed.focus(undefined, { defaultSelection: 'rootEnd' });
  return true;
}
