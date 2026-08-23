'use strict'

const { WIDTH, HEIGHT, CELLS, BANNER_TXT } = require('./banner-cells')

function fg(hex) {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return ''
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `\x1b[38;2;${r};${g};${b}m`
}

function reset() {
  return '\x1b[0m'
}

function indentFor(cols, artWidth) {
  const c = Number(cols) > 0 ? Number(cols) : 80
  if (c < artWidth + 2) return 1
  if (c > 110) return 8
  return Math.max(2, Math.floor((c - artWidth) / 2))
}

function wrapLine(text, width) {
  const w = Math.max(8, Number(width) || 40)
  const s = String(text || '')
  if (s.length <= w) return [s]
  const out = []
  let rest = s
  while (rest.length > w) {
    let cut = rest.lastIndexOf(' ', w)
    if (cut < 8) cut = w
    out.push(rest.slice(0, cut).trimEnd())
    rest = rest.slice(cut).trimStart()
  }
  if (rest) out.push(rest)
  return out
}

function visibleWidth(line) {
  return String(line).replace(/\x1b\[[0-9;]*m/g, '').length
}

function indentLines(block, pad) {
  const prefix = ' '.repeat(Math.max(0, pad))
  return String(block)
    .split('\n')
    .map((line) => (line.length ? prefix + line : line))
    .join('\n')
}

function cropEmptyRows(lines) {
  let start = 0
  let end = lines.length - 1
  while (start < lines.length && visibleWidth(lines[start].replace(/\x1b\[[0-9;]*m/g, '').trim()) === 0) {
    start++
  }
  while (end > start && visibleWidth(lines[end].replace(/\x1b\[[0-9;]*m/g, '').trim()) === 0) {
    end--
  }
  return lines.slice(start, end + 1)
}

function renderTruecolor() {
  const lines = []
  for (let y = 0; y < HEIGHT; y++) {
    let row = ''
    let last = ''
    for (let x = 0; x < WIDTH; x++) {
      const cell = CELLS[x + ',' + y]
      if (cell) {
        const seq = fg(cell.fg)
        if (seq !== last) {
          row += seq
          last = seq
        }
        row += cell.ch
      } else {
        if (last) {
          row += reset()
          last = ''
        }
        row += ' '
      }
    }
    if (last) row += reset()
    lines.push(row.replace(/[ \t]+$/g, ''))
  }
  return cropEmptyRows(lines).join('\n') + reset()
}

function renderMono() {
  return BANNER_TXT
}

function artWidth(block) {
  return block.split('\n').reduce((m, line) => Math.max(m, visibleWidth(line)), 0)
}

function renderBanner({ version, color, tagline, hint, columns } = {}) {
  const cols = Number(columns) > 0 ? Number(columns) : 80
  const usePixel = color !== false && cols >= 48
  const art = usePixel ? renderTruecolor() : renderMono()
  const width = artWidth(art)
  const pad = indentFor(cols, width)
  const textWidth = Math.max(20, cols - pad - 2)

  const v = version ? `v${version}` : ''
  const line = tagline || 'Paste here, receive there — same room, two PCs, no server'
  const keys = hint || '? help   / commands   q quit   c connect   e send   r receive'
  const meta = v ? `${v}  ·  ${keys}` : keys

  const dim = (s) => (color ? `\x1b[2m${s}${reset()}` : s)
  const body = (s) => (color ? `\x1b[38;2;201;210;220m${s}${reset()}` : s)

  const parts = ['']
  parts.push(indentLines(art, pad))
  parts.push('')
  for (const w of wrapLine(line, textWidth)) {
    parts.push(indentLines(body(w), pad))
  }
  for (const w of wrapLine(meta, textWidth)) {
    parts.push(indentLines(dim(w), pad))
  }
  parts.push('')
  return parts.join('\n')
}

const BANNER_ART = BANNER_TXT

module.exports = {
  renderBanner,
  BANNER_ART,
  BANNER_TXT,
  indentFor,
  wrapLine,
  renderTruecolor
}
