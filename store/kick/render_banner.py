from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

here = Path(__file__).parent
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome")
    pg = b.new_page(device_scale_factor=2, viewport={"width": 1200, "height": 200})  # 2400x400 output
    pg.goto((here / "banner.html").as_uri(), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.locator("#banner").screenshot(path=str(here / "banner.png"))
    b.close()

# preview what Kick shows: a 1537x134 cover crop (wide desktop) and a 3:1 crop (narrow screens)
im = Image.open(here / "banner.png")
w, h = im.size
for name, ratio in {"wide": 1537 / 134, "narrow": 3}.items():
    if w / h < ratio:
        ch = round(w / ratio); box = (0, (h - ch) // 2, w, (h - ch) // 2 + ch)
    else:
        cw = round(h * ratio); box = ((w - cw) // 2, 0, (w - cw) // 2 + cw, h)
    im.crop(box).save(here / f"banner-crop-{name}.png")
print(im.size)
