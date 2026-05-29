# GOAL — Extension fonctionnelle, ergonomique, sans pénurie de traduction (Brave/Chrome)

> Créer une extension Kick fonctionnelle et ergonomique sur Brave, en utilisant
> les contournements nécessaires pour ne jamais être à court de traduction.
> 100 % client-side, scalable par PC (chaque install = une IP = un quota).

## Constat (test utilisateur : tout cramé en < 15 min)

| Provider | Symptôme | Cause réelle |
|---|---|---|
| Google | "no segment" | Soft-ban IP : HTTP 200 + data `und`/vide au lieu de 429. Bloqué silencieusement après un burst. |
| MyMemory | rate-limited | Anonyme ≈ 5000 mots/jour. Cramé en minutes. |
| Lingva | HTTP 500 | Instances publiques surchargées / flaky. |

**Faille structurelle :** 1 message = 1 requête HTTP vers un endpoint gratuit,
depuis 1 IP. Un chat JP actif = des centaines de msg/min. Aucun gratuit ne tient.

## Stratégie retenue (cloud batché, 100 % client-side)

Ordre de la chaîne par défaut : **DeepL (si clé) → Google → Lingva (rotation) → MyMemory**.

L'objectif "jamais à court" est atteint par **réduction massive du volume**, pas par
empilement d'endpoints. Cinq leviers :

1. **Dédup + cache normalisé** — un chat répète énormément (emotes, `www`, `草`,
   réactions courtes). Normaliser (trim, casse, ponctuation/répétitions) pour
   maximiser les hits. Le cache IndexedDB persiste entre sessions.
2. **Coalescing + dédup in-flight** — fenêtre ~400 ms : messages identiques en vol
   partagent UNE promesse ; on ne lance jamais > `concurrency` requêtes.
3. **Batching natif DeepL** — jusqu'à 50 `text` par requête, ordre garanti,
   facturé aux chars. DeepL devient le cheval de trait quand la clé est présente.
4. **Backoff adaptatif par provider** — "no segment" Google traité comme
   rate-limit → cooldown exponentiel, on répartit la charge.
5. **Skip agressif** — emote-only, < 2 chars, chiffres seuls, langue déjà cible.

**Saturation (pire cas) = skip silencieux.** Si aucun moteur dispo dans le délai,
on laisse la VO sans spinner orphelin. Chat fluide, certains msg non traduits.

## Échappatoire optionnelle : traduction on-device

Chromium ≥ 138 expose `Translator` + `LanguageDetector` (modèles locaux, illimité,
gratuit, privé). C'est la SEULE source vraiment sans plafond. **Implémentée comme
provider optionnel auto-détecté, hors chaîne par défaut** (Brave la bloque souvent).
Un user Chrome peut l'activer → traduction illimitée locale.

## Robustesse 7TV

7TV change le DOM du chat :
- Container : `.seventv-chat-observer` ; tokens texte : `span.seventv-text-token`.
- Sans 7TV : `span.font-normal.leading-[1.55]`.
- **Bug observé** : double texte (`いいねいいね`) = natif + 7TV rendus ensemble.
- 7TV **re-render** les messages → peut effacer nos traductions injectées.

Fix : détecter 7TV (`platform.ts`), extraire depuis UNE source (priorité 7TV si
présent, sinon natif), dédup, et garder une sentinelle de ré-injection.

## Hors-scope (assumé)

- **Lichee Nano** : pas utilisée. 128 Mo RAM ne fait pas tourner LibreTranslate ;
  IP unique résidentielle = ban si proxy partagé. L'extension reste autonome.
- **Backend central** : aucun. Pas de "nous", pas de serveur (cf. PRIVACY).

## Definition of Done

- [ ] Chat JP actif traduit en continu > 30 min sans tout passer en rouge.
- [ ] Cache hit-rate élevé visible dans le popup (chat répétitif).
- [ ] 7TV ON et OFF : extraction correcte, pas de double texte, pas d'effacement.
- [ ] DeepL clé → batché, compteur chars cohérent.
- [ ] Saturation → skip silencieux, zéro spinner orphelin.
- [ ] On-device détecté et activable (badge "dispo sur ce navigateur ✓/✗").
- [ ] typecheck + lint + tests verts, build OK.
