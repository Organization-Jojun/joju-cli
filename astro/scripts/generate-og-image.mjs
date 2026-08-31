import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/jojun-banner.svg'));

const ogWidth = 1200;
const ogHeight = 630;
const bg = '#08080b';

/** Pigeon mark from the CLI banner (left side of jojun-banner.svg). */
const pigeonCrop = { left: 56, top: 52, width: 208, height: 112 };
const logoSize = 256;

const bannerRaster = sharp(svg).png();
const pigeonPng = await bannerRaster
  .clone()
  .extract(pigeonCrop)
  .resize(logoSize, logoSize, { fit: 'contain', background: bg })
  .png()
  .toBuffer();

await sharp(pigeonPng).toFile(join(root, 'public/logoJojun.png'));

const wordmarkCrop = { left: 328, top: 64, width: 480, height: 96 };
const wordmarkPng = await bannerRaster
  .clone()
  .extract(wordmarkCrop)
  .png()
  .toBuffer();

const wordmarkMeta = await sharp(wordmarkPng).metadata();
const wordmarkWidth = Math.round((wordmarkMeta.width / wordmarkMeta.height) * 72);
const wordmarkHeight = 72;

const logoLeft = Math.round((ogWidth - logoSize) / 2);
const logoTop = Math.round(ogHeight * 0.28 - logoSize / 2);
const wordmarkLeft = Math.round((ogWidth - wordmarkWidth) / 2);
const wordmarkTop = logoTop + logoSize + 36;

await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 4,
    background: bg
  }
})
  .composite([
    { input: pigeonPng, left: logoLeft, top: logoTop },
    {
      input: await sharp(wordmarkPng).resize(wordmarkWidth, wordmarkHeight).png().toBuffer(),
      left: wordmarkLeft,
      top: wordmarkTop
    }
  ])
  .png()
  .toFile(join(root, 'public/og-image.png'));

console.log('wrote public/logoJojun.png');
console.log('wrote public/og-image.png');
