# -*- coding: utf-8 -*-
"""Les limites de champ des deux stores, comptees plutot que supposees.

Chrome : description 16000, resume court 132. AMO : resume 250, description
15000. Le champ `description` du manifeste est plafonne a 132 par Chrome et il
est traduit, donc il se verifie dans `public/_locales/*/messages.json` et pas
dans la prose de la fiche.

Compte en caracteres UTF-16, qui est ce que comptent les formulaires web, et pas
en octets : une phrase japonaise ou arabe passerait pour deux fois trop longue
sinon.

Une premiere version comptait la section du champ manifeste en entier, prose
explicative comprise, et rapportait 376 caracteres pour une valeur qui en fait
90. Une sonde qui accuse un texte sain est pire qu'une sonde absente : la valeur
livree se lit maintenant a la source.
"""
import glob
import io
import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def lire(f):
    return io.open(f, encoding='utf8').read().strip()


# Un fichier par store, champ et langue, dans store/ (voir store/README.md).
FICHIERS = sorted(glob.glob('store/**/*.txt', recursive=True))
s = '\n'.join(lire(f) for f in FICHIERS)

LIMITES = [
    ('store/chrome/description/*.txt', 16000, 'Chrome description'),
    ('store/chrome/summary.txt', 132, 'Chrome resume'),
    ('store/amo/summary/*.txt', 250, 'AMO resume'),
    ('store/amo/description/*.txt', 15000, 'AMO description'),
]

echecs = []
comptes = {}

for motif, limite, genre in LIMITES:
    trouves = sorted(glob.glob(motif))
    if not trouves:
        echecs.append(f'{motif} : aucun fichier')
    for f in trouves:
        comptes[genre] = comptes.get(genre, 0) + 1
        n = len(lire(f))
        if n > limite:
            echecs.append(f'{f} : {n} caracteres pour {limite}')

# Le champ `description` tel qu'il est reellement livre, langue par langue.
livrees = 0
for f in sorted(glob.glob('public/_locales/*/messages.json')):
    langue = f.replace('\\', '/').split('/')[-2]
    data = json.load(io.open(f, encoding='utf8'))
    for cle, entree in data.items():
        if cle.lower() in ('extdescription', 'appdescription', 'description'):
            livrees += 1
            n = len(entree.get('message', ''))
            if n > 132:
                echecs.append(f'description livree ({langue}) : {n} caracteres pour 132')
comptes['description livree'] = livrees

# Chaque permission livree doit etre justifiee dans la fiche. Ajouter une
# permission et oublier sa justification est un motif de rejet, et cela se
# decouvre autrement une semaine plus tard.
manifeste = json.load(io.open('dist/manifest.json', encoding='utf8'))
JUSTIFS = 'store/chrome/dashboard/permission-justifications.txt'
bloc = lire(JUSTIFS) if os.path.exists(JUSTIFS) else ''
if not bloc:
    echecs.append(f'{JUSTIFS} : introuvable ou vide')
justifiees = 0
for perm in list(manifeste.get('permissions', [])) + list(manifeste.get('host_permissions', [])):
    cle = perm.replace('https://', '').replace('/*', '')
    if perm in bloc or cle in bloc:
        justifiees += 1
    else:
        echecs.append(f'permission livree sans justification dans la fiche : {perm}')
comptes['permission justifiee'] = justifiees

print('champs comptes :')
for genre, n in sorted(comptes.items()):
    print(f'  {genre.ljust(22)} {n}')
print('total :', sum(comptes.values()))


cadratins = s.count(chr(8212)) + s.count(chr(8211))
print('tirets cadratins ou demi-cadratins :', cadratins)
if cadratins:
    echecs.append(f'{cadratins} tiret(s) cadratin dans un texte destine au public')

# Aucune description ni aucun resume ne cite une version : la description Chrome
# ne se change qu'en la recollant a la main dans onze langues, donc elle ne porte
# rien qui vieillisse a chaque release. Les nouveautes vont dans store/notes/.
# Les notes pour les relecteurs AMO portent {{VERSION}}, rempli au build.
citees = set()
for f in FICHIERS:
    if '/notes/' in f.replace('\\', '/') or f.endswith('reviewer-notes.txt'):
        continue
    for v in re.findall(r'\b\d+\.\d+\.\d+\b', lire(f)):
        citees.add(v)
        echecs.append(f'{f} : cite la version {v}')
print('versions citees hors notes :', ' '.join(sorted(citees)) or 'aucune')

if echecs:
    print()
    for e in echecs:
        print('ECHEC:', e)
    sys.exit(1)
print('toutes les limites tiennent')
