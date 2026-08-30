# -*- coding: utf-8 -*-
"""Selecteurs que les harnais interrogent et que le produit ne peut pas emettre.

Un harnais qui cherche une classe disparue ne casse pas : il trouve zero, et une
assertion du genre `if (n > 0) echec` devient vraie pour toujours. Elle passe, se
lit comme une couverture, et n'en est plus une.

Trouve deux fois le jour ou ce fichier a ete ecrit :

  - live-kick comptait `.kt-hover-placeholder`, retiree en 2.8.0 avec le libelle
    « hover to translate ». La ligne valait zero depuis, et l'assertion
    « aucun libelle de survol » ne pouvait plus echouer.
  - chip-live cherchait `.kt-chip-wrap` derriere un `?? chip.parentElement`. Le
    produit ecrit `.kt-chip-host`. Le repli faisait le travail en silence, donc
    rien n'a jamais signale la mort du selecteur.

Ne regarde QUE les chaines employees comme selecteur : querySelector, closest,
matches, classList.contains, et les litteraux `.kt-...` d'un appel de selection.
Une premiere version prenait toute chaine contenant `kt-`, et rapportait les
prefixes de dossiers temporaires (`kt-vierge-`, `kt-shots-`) comme des
selecteurs morts. Restreindre le contexte vaut mieux qu'une liste d'exceptions :
la liste, elle, aurait grandi a chaque nouveau harnais.
"""
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SRC = 'src'
HARNAIS = 'scratchpad/harness'

# Ce que le produit peut ecrire dans le DOM ou styler.
produit = ''
for root, _dirs, files in os.walk(SRC):
    for f in files:
        if f.endswith(('.ts', '.tsx', '.css', '.html')):
            produit += io.open(os.path.join(root, f), encoding='utf-8', errors='replace').read()
CONNUES = set(re.findall(r'kt-[a-z0-9-]+', produit))

# Les appels qui prennent un selecteur, et les classes testees une par une.
APPELS = re.compile(
    r'(?:querySelectorAll|querySelector|closest|matches|locator)\s*\(\s*([`\'"])(.*?)\1',
    re.S,
)
CLASSLIST = re.compile(r'classList\.(?:contains|toggle|add|remove)\s*\(\s*[\'"`]([a-zA-Z0-9_-]+)')

trouves = {}
for f in sorted(os.listdir(HARNAIS)):
    if not f.endswith('.mjs'):
        continue
    s = io.open(os.path.join(HARNAIS, f), encoding='utf-8', errors='replace').read()
    classes = set()
    for m in APPELS.finditer(s):
        classes.update(re.findall(r'\.(kt-[a-z0-9-]+)', m.group(2)))
    classes.update(c for c in CLASSLIST.findall(s) if c.startswith('kt-'))
    for c in classes:
        if c not in CONNUES:
            trouves.setdefault(c, set()).add(f)

print(f'classes kt-* que le produit peut emettre : {len(CONNUES)}')
print(f'selecteurs morts : {len(trouves)}')
for c, fichiers in sorted(trouves.items()):
    print(f'   .{c}   {" ".join(sorted(fichiers))}')

if trouves:
    print()
    print("Chacun trouve zero element pour toujours. Verifier ce que l'assertion")
    print('en dessous devient quand son compte est fige a zero.')
sys.exit(1 if trouves else 0)
