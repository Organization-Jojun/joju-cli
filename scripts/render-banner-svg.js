'use strict'

const fs = require('fs')
const path = require('path')
const { WIDTH, HEIGHT, CELLS } = require('../src/cli/banner-cells')

const S = 16
const padX = 40
const padY = 32
const w = padX * 2 + WIDTH * S
const h = padY * 2 + HEIGHT * S

let body = ''
for (const [key, cell] of Object.entries(CELLS)) {
  const [x, y] = key.split(',').map(Number)
  const px = padX + x * S
  const py = padY + y * S
  if (cell.ch === '─') {
    body += `<rect x="${px}" y="${py + S * 0.42}" width="${S}" height="${S * 0.22}" rx="1" fill="${cell.fg}"/>\n`
  } else {
    body += `<rect x="${px}" y="${py}" width="${S}" height="${S}" fill="${cell.fg}"/>\n`
  }
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Jojun CLI splash: pixel pigeon and JOJUN wordmark">
  <rect width="100%" height="100%" rx="16" fill="#0c1014"/>
${body}</svg>
`

const out = path.join(__dirname, '..', 'docs', 'banner-cli', 'jojun-banner.svg')
fs.writeFileSync(out, svg)
console.log('wrote', out, w, 'x', h)
