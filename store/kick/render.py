from pathlib import Path
from playwright.sync_api import sync_playwright

here = Path(__file__).parent
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome")
    pg = b.new_page(device_scale_factor=2)  # 640px wide, panels display at 320
    pg.goto((here / "panels.html").as_uri(), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    for el in ["en", "es", "pt", "fr", "tr", "ru", "ja", "ar"]:
        box = pg.locator("#" + el).bounding_box()
        print(el, box["height"], "OK" if box["height"] <= 2 * box["width"] else "TOO TALL")
        pg.locator("#" + el).screenshot(path=str(here / f"kct-{el}.png"))
    b.close()
