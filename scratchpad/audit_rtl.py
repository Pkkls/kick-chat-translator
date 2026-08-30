"""Physical properties in a stylesheet that has to mirror.

Arabic is one of the ten interface languages and a common chat language, and
inject.css already argues the point at .kt-chip-menu: "Logical, not physical: in
an Arabic interface the message box mirrors, and a menu pinned to the physical
right would hang off the wrong edge."

Everything under the chip section follows that. The chat lines, the floating bar
and the toast were written before it and mostly did not, and nothing renders
them mirrored: the chip harness runs an RTL pass, the chat harness never has.

Reads declarations from rule bodies, not lines.
"""
import io
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

CSS = 'src/content/inject.css'
src = io.open(CSS, encoding='utf-8').read()
clean = re.sub(r'/\*[\s\S]*?\*/', lambda m: '\n' * m.group(0).count('\n'), src)

PHYSICAL = re.compile(
    r'^(margin|padding|border)-(left|right)$'
    r'|^(left|right)$'
    r'|^border-(left|right)-(color|width|style)$'
)

def asymmetric(prop: str, value: str) -> bool:
    """A shorthand whose left and right differ is as physical as `margin-left`.

    Missed by a first version that only looked at property names: the
    translation block carries `padding: 2px 6px 2px 8px`, eight on the side the
    green bar is on, and `border-radius: 0 4px 4px 0`, flat on that same side.
    Both put the bar's side back on the left of a mirrored line.
    """
    parts = value.split()
    if prop in ('margin', 'padding') and len(parts) == 4:
        return parts[1] != parts[3]
    if prop == 'border-radius' and len(parts) == 4:
        # top-left / top-right / bottom-right / bottom-left
        return parts[0] != parts[1] or parts[3] != parts[2]
    return False


# The one place physical is correct, with the reason the stylesheet gives.
# placeMenu() writes viewport coordinates into this rule, and viewport
# coordinates are physical by definition; the logical property above it must not
# fight them.
ALLOWED = {
    ('.kt-chip-menu-fixed', 'right: auto'),
    # Same construct, same reason, in the float bar's panel: placeLangMenu()
    # writes viewport coordinates into .kt-lang-panel-fixed exactly as
    # placeMenu() does for the chip. The exception above was written when only
    # the chip had one, and the panel arrived later; the gate then failed from
    # the commit that introduced it, which is how it stayed red unnoticed.
    ('.kt-lang-panel-fixed', 'right: auto'),
}

rows = []
for rule in re.finditer(r'([^{}]+)\{([^{}]*)\}', clean):
    selector = ' '.join(rule.group(1).split())
    if selector.startswith('@'):
        continue
    for decl in re.finditer(r'([-a-z]+)\s*:\s*([^;]+);', rule.group(2)):
        prop, value = decl.group(1), ' '.join(decl.group(2).split())
        if not PHYSICAL.match(prop) and not asymmetric(prop, value):
            continue
        if (selector, f'{prop}: {value}') in ALLOWED:
            continue
        line = clean.count('\n', 0, rule.start(2) + decl.start()) + 1
        rows.append((line, selector[:52], f'{prop}: {value}'))

if not rows:
    print('aucune propriete physique')
    sys.exit(0)

print(len(rows), 'declarations physiques dans une feuille qui doit se refleter\n')
for line, selector, decl in rows:
    print(f'{CSS}:{line}: {decl:<28} {selector}')
sys.exit(1)
