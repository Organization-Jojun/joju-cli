'use strict'

const BANNER_ART = [
  '',
  '          __',
  '        >(o )___     .-----.',
  '         (  ._>     /  msg  \\    JOJUN',
  '          `---\\    |________|    carrier pigeon',
  '           ^^  \\________________ Pears Track',
  ''
].join('\n')

function renderBanner({ version, color, tagline, hint } = {}) {
  const v = version ? `v${version}` : ''
  const line = tagline || 'Paste here, receive there — same room, two PCs, no server'
  const keys = hint || '? help   / commands   q quit   c connect   e send   r receive'
  const dim = (s) => (color ? `\x1b[2m${s}\x1b[0m` : s)
  const bold = (s) => (color ? `\x1b[1m${s}\x1b[0m` : s)
  const lines = [
    BANNER_ART.trimEnd(),
    '',
    bold(line),
    dim(v ? `${v}  ·  ${keys}` : keys),
    ''
  ]
  return lines.join('\n')
}

module.exports = { renderBanner, BANNER_ART }
