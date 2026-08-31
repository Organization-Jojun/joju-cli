import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/jojun-banner.svg'));

const ogWidth = 1200;
const ogHeight = 630;
const bannerWidth = 976;
const bannerHeight = 256;
const left = Math.round((ogWidth - bannerWidth) / 2);
const top = Math.round((ogHeight - bannerHeight) / 2);

const bannerPng = await sharp(svg).png().toBuffer();

await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 4,
    background: '#08080b'
  }
})
  .composite([{ input: bannerPng, left, top }])
  .png()
  .toFile(join(root, 'public/og-image.png'));

console.log('wrote public/og-image.png');
