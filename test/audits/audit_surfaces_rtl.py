"""Physical direction utilities in the popup and the options page.

`audit_rtl.py` covers the injected stylesheet. Nothing covered these two, and
Arabic is a shipped interface language.

Two things this probe got wrong before they were fixed, both of the kind that
reads as good news:

  - scanning whole lines counted the words "left" and "right" out of two
    sentences of prose and reported 15 physical utilities where there are 6;
  - scanning line by line missed the switch knob entirely, because its `class`
    is a template literal that opens on one line and carries its ternary on the
    next. The whole file is one string here, and the line number is derived from
    the offset.

Only utilities with a logical equivalent are counted. `top`/`bottom` and the
`x`/`y` axes are direction-neutral.
"""
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
BS = chr(92)

PHYSICAL = re.compile(
    r'(?<![a-zA-Z0-9-])'
    r'(-?(?:ml|mr|pl|pr|left|right|border-l|border-r'
    r'|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br'
    r'|text-left|text-right)'
    r'(?:-[a-zA-Z0-9./%\[\]-]+)?)'
    r'(?![a-zA-Z0-9-])'
)
CSS_PHYSICAL = re.compile(
    r'(?<![a-z-])(margin-left|margin-right|padding-left|padding-right'
    r'|border-left|border-right|text-align)\s*:'
)
# A class attribute, quoted or braced, however many lines it spans.
CLASS_ATTR = re.compile(r'class=(?:"([^"]*)"|\{`([^`]*)`\s*\})', re.S)

ROOTS = ['src/popup', 'src/options']
hits = {}
scanned = 0
attributes = 0

for root in ROOTS:
    for base, _dirs, files in os.walk(root):
        for name in files:
            if '.test.' in name or not name.endswith(('.tsx', '.ts', '.css')):
                continue
            path = os.path.join(base, name).replace(BS, '/')
            scanned += 1
            text = open(path, encoding='utf-8').read()
            line_of = lambda off: text.count('\n', 0, off) + 1

            if name.endswith('.css'):
                for m in CSS_PHYSICAL.finditer(text):
                    hits.setdefault(m.group(1), []).append(f'{path}:{line_of(m.start())}')
                continue

            for attr in CLASS_ATTR.finditer(text):
                body = next((g for g in attr.groups() if g), '')
                attributes += 1
                for m in PHYSICAL.finditer(body):
                    hits.setdefault(m.group(1), []).append(
                        f'{path}:{line_of(attr.start() + (attr.group(0).index(body) if body else 0) + m.start())}'
                    )

total = sum(len(v) for v in hits.values())
print(f'fichiers scannes : {scanned} | attributs class lus : {attributes}')
print(f'utilitaires physiques : {total} sur {len(hits)} formes')
for key in sorted(hits, key=lambda k: (-len(hits[k]), k)):
    print(f'  {key:18} x{len(hits[key]):3}  {", ".join(hits[key][:3])}')

# A probe that reads nothing passes trivially.
if scanned == 0 or attributes < 50:
    print(f'la sonde n a lu que {attributes} attributs, elle ne mesure rien')
    sys.exit(1)
sys.exit(1 if total else 0)
