'use strict'

const { COMMANDS, formatSuggestions } = require('./slash')

function helpPanel() {
  return [
    'Jojun — clipboard P2P (no es un chat con agentes).',
    '',
    'Flujo de 2 PCs (mismo topic las dos):',
    '  1. Ambas: j  o  /join   (Enter = topic de prueba)',
    '  2. Receptor: y  o  /yank   (espera el blob)',
    '  3. Emisor:   p  o  /paste  (escribí el texto)',
    '  4. El receptor ve el mismo blob. Sin Discord, USB ni servidor.',
    '',
    'Si no hay join: no estás en ninguna habitación. El status dice “sin room”.',
    '',
    'Slash commands:',
    formatSuggestions(COMMANDS),
    '',
    'One-shot (scripts / daemon):  jojun join <topic>  ·  echo hola | jojun paste  ·  jojun yank'
  ].join('\n')
}

function keysPanel() {
  return [
    'Atajos (esta sesión — no son secretos)',
    '',
    '  ?           esta ayuda / panel help',
    '  q  Ctrl+C   salir limpio (leave swarm)',
    '  j           join — prompt de topic (Enter = fixture)',
    '  p           paste — una línea',
    '  y           yank — dump del último blob',
    '  w           wait — esperar peer',
    '  l           leave',
    '  s           status',
    '  1–5         join paste yank wait leave (menú clásico)',
    '  /           slash command  ·  Tab sugiere',
    '',
    'Fixture topic:',
    '  68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000'
  ].join('\n')
}

function emptyRoomHint() {
  return 'Todavía no hay habitación — j o /join (Enter = fixture).'
}

module.exports = { helpPanel, keysPanel, emptyRoomHint }
