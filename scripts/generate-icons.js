/**
 * Generates PNG icons from icon.svg using sharp.
 * Run: node scripts/generate-icons.js
 * Requires: npm install -D sharp
 */
const sharp = require('sharp');
const path = require('path');

const sizes = [16, 48, 128];
const src = path.resolve(__dirname, '../public/icons/icon.svg');

(async () => {
  for (const size of sizes) {
    const dest = path.resolve(__dirname, `../public/icons/icon${size}.png`);
    await sharp(src).resize(size, size).png().toFile(dest);
    console.log(`✓ icon${size}.png`);
  }
})();
