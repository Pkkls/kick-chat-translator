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
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

s = io.open('store-listing.md', encoding='utf8').read()

LIMITES = [
    (r'^## Description \(([A-Z-]+)\)$', 16000, 'Chrome description'),
    (r'^## Short summary \(132 char limit\)$', 132, 'Chrome resume'),
    (r'^## AMO summary \(([A-Z-]+)(?:, 250 char limit)?\)$', 250, 'AMO resume'),
    (r'^## AMO description \(([A-Z-]+)\)$', 15000, 'AMO description'),
]

titres = [(m.start(), m.group(0)) for m in re.finditer(r'^## .*$', s, re.M)]
echecs = []
comptes = {}

for k, (pos, titre) in enumerate(titres):
    fin = titres[k + 1][0] if k + 1 < len(titres) else len(s)
    corps = s[pos + len(titre):fin].strip().rstrip('-').strip()
    for motif, limite, genre in LIMITES:
        if re.match(motif, titre):
            comptes[genre] = comptes.get(genre, 0) + 1
            if len(corps) > limite:
                echecs.append(f'{titre} : {len(corps)} caracteres pour {limite}')
            break

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
i = s.find('## Chrome dashboard: permission justifications')
j = s.find('## Chrome dashboard: data usage')
bloc = s[i:j] if i >= 0 and j > i else ''
if not bloc:
    echecs.append('la section des justifications de permissions est introuvable')
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

# Une version publiee doit apparaitre partout ou la fiche en cite une.
versions = set(re.findall(r'\b2\.\d+\.\d+\b', s))
print('versions citees :', ' '.join(sorted(versions)))

if echecs:
    print()
    for e in echecs:
        print('ECHEC:', e)
    sys.exit(1)
print('toutes les limites tiennent')
