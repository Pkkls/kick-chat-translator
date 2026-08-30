# -*- coding: utf-8 -*-
"""Poids du script injecte dans chaque page Kick.

`assets/content.js` est le seul content_script du manifeste. Chaque page kick.com
le telecharge, l'analyse et l'execute, que le lecteur ouvre une liste de langues
ou non, et `inject.css` y est inline par `?inline`. C'est le seul cout que
l'extension impose a tout le monde tout le temps.

Mesure prise dans les archives publiees, pas dans un souvenir :

    2.7.0   199.5 Ko
    2.8.0   199.4 Ko   -0.1 %
    2.8.1   199.4 Ko    0.0 %
    2.9.0   224.3 Ko  +12.5 %   <- les drapeaux dessines et le panneau partage
    2.9.1   223.4 Ko   -0.4 %
    2.9.2   223.1 Ko   -0.2 %

Douze et demi pour cent en une version, et personne ne l'a vu pendant trois
jours parce que rien ne regardait. Ce fichier ne dit pas qu'un poids est trop
grand : il dit de combien il a bouge depuis une reference qu'on a choisie, pour
que la prochaine hausse soit une decision et pas un accident.

La reference vit ici, en clair, et pas dans un JSON a cote : `scratchpad/` ne
suit que `*.mjs` et `audit_*.py`, donc un fichier de donnees y serait ignore par
git et la reference ne survivrait pas a une machine. La changer est un diff
lisible dans un fichier suivi, avec sa raison a cote.
"""
import io
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CIBLE = 'dist/assets/content.js'
MANIFESTE = 'dist/manifest.json'

# Reference : 2.9.2, la derniere version publiee au moment ou cette porte a ete
# ecrite. Un instantane, pas un ideal. La marge laisse passer le bruit d'un
# build a l'autre sans laisser passer une fonctionnalite.
REFERENCE_OCTETS = 228_460
MARGE = 0.02

if not os.path.exists(CIBLE):
    print(f'{CIBLE} absent. Lancer `npm run build` avant.')
    sys.exit(2)

# Le build metriques embarque des compteurs que la release n'a pas : le mesurer
# comparerait deux choses differentes et rapporterait une hausse qui ne sera
# jamais livree.
source = io.open(CIBLE, encoding='utf-8', errors='replace').read()
if 'kt.metrics.v1' in source:
    print('dist/ porte les metriques : ce build ne part pas en release, poids non compare.')
    sys.exit(0)

octets = os.path.getsize(CIBLE)
version = json.load(io.open(MANIFESTE, encoding='utf-8'))['version'] if os.path.exists(MANIFESTE) else '?'
ecart = octets - REFERENCE_OCTETS
pourcent = 100.0 * ecart / REFERENCE_OCTETS

print(f'{CIBLE}  {octets / 1024:.1f} Ko   (manifeste {version})')
print(f'reference             {REFERENCE_OCTETS / 1024:.1f} Ko')
print(f'ecart                 {ecart / 1024:+.1f} Ko  {pourcent:+.2f} %   marge {MARGE * 100:.0f} %')

if pourcent > MARGE * 100:
    print()
    print(f'Le script injecte a grossi de {pourcent:.2f} % au-dela de la marge.')
    print('Soit la hausse est voulue, et REFERENCE_OCTETS se met a jour dans le')
    print("meme commit avec ce qui l'explique, soit elle ne l'est pas.")
    sys.exit(1)

sys.exit(0)
