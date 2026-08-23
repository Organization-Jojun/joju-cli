'use strict'

const COMMANDS = [
  { name: 'help', summary: 'Ayuda completa: flujo de 2 PCs y cada comando', example: '/help' },
  { name: 'keys', summary: 'Atajos de teclado visibles en esta sesión', example: '/keys' },
  { name: 'shortcuts', summary: 'Igual que /keys', example: '/shortcuts' },
  { name: 'status', summary: 'Habitación, topic corto, peers, mock vs live', example: '/status' },
  { name: 'join', summary: 'Entrar a un topic Hyperswarm (64 hex)', example: '/join 68656c6c6f2d…' },
  { name: 'paste', summary: 'Enviar texto a la otra PC', example: '/paste hola sala' },
  { name: 'yank', summary: 'Mostrar el último blob recibido', example: '/yank' },
  { name: 'wait', summary: 'Esperar a que llegue un peer', example: '/wait' },
  { name: 'leave', summary: 'Salir de la habitación', example: '/leave' },
  { name: 'topic', summary: 'Ver o pegar el topic actual', example: '/topic' },
  { name: 'clear', summary: 'Limpiar la pantalla y redibujar el splash', example: '/clear' },
  { name: 'quit', summary: 'Leave + salir de la sesión', example: '/quit' }
]

function suggest(prefix) {
  const p = (prefix || '').replace(/^\//, '').toLowerCase()
  if (!p) return COMMANDS.slice()
  return COMMANDS.filter((c) => c.name.startsWith(p))
}

function parseSlash(line) {
  const raw = String(line || '').trim()
  if (!raw.startsWith('/')) return null

  const body = raw.slice(1).trim()
  if (!body) {
    return { kind: 'suggest', suggestions: suggest('') }
  }

  const space = body.search(/\s/)
  const name = (space === -1 ? body : body.slice(0, space)).toLowerCase()
  const arg = space === -1 ? '' : body.slice(space + 1).trim()

  const exact = COMMANDS.find((c) => c.name === name)
  if (exact) {
    return { kind: 'command', name: exact.name, arg }
  }

  const hits = suggest(name)
  if (hits.length === 1) {
    return { kind: 'command', name: hits[0].name, arg }
  }
  if (hits.length > 1) {
    return { kind: 'suggest', prefix: name, suggestions: hits }
  }
  return { kind: 'unknown', name }
}

function formatSuggestions(suggestions) {
  return suggestions.map((c) => `  /${c.name.padEnd(12)} ${c.summary}`).join('\n')
}

module.exports = { COMMANDS, suggest, parseSlash, formatSuggestions }
