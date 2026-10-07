import { describe, expect, it } from 'vitest';
import { CHAT_MESSAGES } from './i18n';

/**
 * The chat and bar strings in fr, es, pt and tr were written without a single
 * accent: "Traduction desactivee", "Ceviri kapali", "Voce escreve", and French
 * elisions spelled "l envoyer". They are the strings a reader of those languages
 * sees most, on every line the extension skips and on the bar itself.
 *
 * Each pattern below is a form that only exists unaccented. A string matching
 * one is the defect coming back, not a judgement call.
 */
const BARE: Record<string, RegExp> = {
  fr: /\b(chaine|ecris|desactivee|echec|deja|a jour|modele|telecharg\w*|illimitee|depasse|meme|etre|inserer|entree|echap|expediteur|autorisee|identifiee|vide la)\b|\b[lnd] [aeiouhy]/i,
  es: /\b(traduccion|esta en|no esta|limite|ingles|ningun|simbolos|aun|tamano|conexion|cache)\b/i,
  pt: /\b(traducao|voce|nao|ja|usuario|indisponivel|opcoes|possivel|servico|ingles|glossario|simbolos|giria|ha modelo)\b/i,
  tr: /\b(ceviri\w*|cevir|icin|secmek|secenekler|kullanici\w*|basarisiz|sinir\w*|gonder\w*|gorunuyor|degil|onbellegi|yaziyorsun|tikla)\b/i,
};

describe('chat strings keep their accents', () => {
  for (const [lang, bare] of Object.entries(BARE)) {
    it(lang, () => {
      const table = CHAT_MESSAGES[lang];
      expect(table, `no chat table for ${lang}`).toBeDefined();
      const offenders = Object.entries(table!).filter(([, v]) => bare.test(v));
      expect(offenders).toEqual([]);
    });
  }
});
