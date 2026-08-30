/**
 * Capture le harnais pour qu'il soit REGARDE. Les portes prouvent le contraste
 * et les roles, pas les pixels : un glyphe decale ou une rangee qui bave passe
 * toutes les portes du monde.
 *
 * Transitions coupees et pointeur gare hors du composant, sinon on juge une
 * demi-animation ou un survol involontaire.
 *
 *   node scratchpad/harness/lang-panel-shoot.mjs
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from './playwright.mjs';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = pathToFileURL(path.join(HERE, 'lang-panel.html')).href;

const browser = await chromium.launch();

for (const theme of ['dark', 'light']) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1100 },
    deviceScaleFactor: 2,
  });
  await page.goto(FILE);
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await page.mouse.move(2000, 2000);
  await page.screenshot({ path: path.join(HERE, `lang-panel-${theme}.png`), fullPage: true });

  // Le detail, la ou se voient les defauts de gabarit : glyphes centres,
  // colonnes alignees, rangees d'une seule hauteur.
  const zoom = await browser.newPage({
    viewport: { width: 300, height: 400 },
    deviceScaleFactor: 4,
  });
  await zoom.goto(FILE);
  await zoom.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
  await zoom.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await zoom.mouse.move(2000, 2000);
  await zoom.locator('#list-repos').locator('xpath=..').screenshot({
    path: path.join(HERE, `lang-panel-zoom-${theme}.png`),
  });
  await zoom.close();
  await page.close();
}

// Un survol et un focus reels, pas decrits : ils doivent se voir.
const live = await browser.newPage({ viewport: { width: 300, height: 400 }, deviceScaleFactor: 4 });
await live.goto(FILE);
await live.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
await live.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
const panel = live.locator('#list-repos').locator('xpath=..');
await panel.scrollIntoViewIfNeeded();
await panel.locator('.kt-lang-row').nth(3).hover();
await panel.screenshot({ path: path.join(HERE, 'lang-panel-hover.png') });

// focus-visible ne s'allume que sur une interaction clavier, pas sur un
// .focus() programme : c'est justement ce qu'on veut voir.
await panel.locator('.kt-lang-search input').click();
await live.keyboard.press('Tab');
await live.mouse.move(2000, 2000);
await panel.screenshot({ path: path.join(HERE, 'lang-panel-focus.png') });
await live.close();

await browser.close();
console.log('captures : lang-panel-{dark,light}.png, -zoom-{dark,light}.png, -hover.png, -focus.png');
