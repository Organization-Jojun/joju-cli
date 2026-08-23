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

const TAGLINE = 'pegás acá, yankéas allá — mismo topic, dos PCs, cero servidor'
const HINT = '? help   / comandos   q salir   j join   p paste   y yank'

function renderBanner({ version, color } = {}) {
  const v = version ? `v${version}` : ''
  const dim = (s) => (color ? `\x1b[2m${s}\x1b[0m` : s)
  const bold = (s) => (color ? `\x1b[1m${s}\x1b[0m` : s)
  const lines = [
    BANNER_ART.trimEnd(),
    '',
    bold(TAGLINE),
    dim(v ? `${v}  ·  ${HINT}` : HINT),
    ''
  ]
  return lines.join('\n')
}

module.exports = { renderBanner, BANNER_ART, TAGLINE, HINT }
