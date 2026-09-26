"""Which t() strings in the source are missing from the canonical key list.

The suite already checks every catalog against keys.json. Nothing checked the
source against it, so a new t('...') silently rendered its English key in all
nine languages.
"""
import os
import re
import json

BS = chr(92)
keys = set(json.load(open('src/shared/i18n/keys.json', encoding='utf-8')))

# Built from pieces: a literal backslash does not survive this file's own
# round trip through the shell.
PAT = (r"\bt\(\s*(['" + '"' + r"])((?:[^'" + '"' + BS + BS + r"]|" + BS + BS + r".)*?)" + BS + "1")
pat = re.compile(PAT)

found = {}
for root, _, fs in os.walk('src'):
    if 'i18n' in root:
        continue
    for f in fs:
        if not f.endswith(('.ts', '.tsx')) or '.test.' in f:
            continue
        p = os.path.join(root, f).replace(BS, '/')
        for m in pat.finditer(open(p, encoding='utf-8').read()):
            found.setdefault(m.group(2).replace(BS + "'", "'"), []).append(p)

missing = sorted(k for k in found if k not in keys)
print('t() dans le code :', len(found), '| keys.json :', len(keys), '| absentes :', len(missing))
for k in missing:
    print('  -', repr(k), ' <-', found[k][0])

orphan = sorted(keys - set(found))
print()
print('cles jamais utilisees :', len(orphan))
for k in orphan[:15]:
    print('  -', repr(k))
