'use strict'

const { t } = require('./i18n')

/**
 * Visible names + expert aliases. `action` is what the session executes.
 */
const COMMANDS = [
  { names: ['connect', 'conectar'], action: 'connect', public: true, summaryKey: 'slash_connect' },
  { names: ['send', 'enviar'], action: 'send', public: true, summaryKey: 'slash_send' },
  { names: ['receive', 'recibir'], action: 'receive', public: true, summaryKey: 'slash_receive' },
  { names: ['wait', 'esperar'], action: 'wait', public: true, summaryKey: 'slash_wait' },
  {
    names: ['disconnect', 'desconectar'],
    action: 'disconnect',
    public: true,
    summaryKey: 'slash_disconnect'
  },
  { names: ['status', 'estado'], action: 'status', public: true, summaryKey: 'slash_status' },
  { names: ['settings', 'ajustes'], action: 'settings', public: true, summaryKey: 'slash_settings' },
  { names: ['help', 'ayuda'], action: 'help', public: true, summaryKey: 'slash_help' },
  {
    names: ['shortcuts', 'keys', 'atajos'],
    action: 'shortcuts',
    public: true,
    summaryKey: 'slash_shortcuts'
  },
  { names: ['quit', 'salir'], action: 'quit', public: true, summaryKey: 'slash_quit' },
  {
    names: ['language', 'idioma'],
    action: 'language',
    public: true,
    summaryKey: 'slash_language'
  },
  { names: ['clear'], action: 'clear', public: true, summaryKey: 'slash_clear' },
  { names: ['topic'], action: 'topic', public: true, summaryKey: 'slash_topic' },
  { names: ['advanced', 'avanzado'], action: 'advanced', public: true, summaryKey: 'slash_advanced' },
  { names: ['join'], action: 'connect', public: false, summaryKey: 'slash_connect' },
  { names: ['paste'], action: 'send', public: false, summaryKey: 'slash_send' },
  { names: ['yank'], action: 'receive', public: false, summaryKey: 'slash_receive' },
  { names: ['leave'], action: 'disconnect', public: false, summaryKey: 'slash_disconnect' }
]

function allNames() {
  const out = []
  for (const c of COMMANDS) {
    for (const n of c.names) out.push({ name: n, cmd: c })
  }
  return out
}

function findByName(name) {
  return allNames().find((row) => row.name === name)
}

function publicCommands() {
  const seen = new Set()
  const list = []
  for (const c of COMMANDS) {
    if (!c.public) continue
    if (seen.has(c.action)) continue
    seen.add(c.action)
    list.push(c)
  }
  return list
}

function suggest(prefix) {
  const p = (prefix || '').replace(/^\//, '').toLowerCase()
  const rows = allNames()
  if (!p) {
    return publicCommands().map((c) => ({ name: c.names[0], action: c.action, summaryKey: c.summaryKey }))
  }
  const hits = rows.filter((row) => row.name.startsWith(p))
  const seen = new Set()
  const out = []
  for (const h of hits) {
    if (seen.has(h.cmd.action + h.name)) continue
    seen.add(h.cmd.action + h.name)
    out.push({ name: h.name, action: h.cmd.action, summaryKey: h.cmd.summaryKey })
  }
  return out
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

  const exact = findByName(name)
  if (exact) {
    return { kind: 'command', action: exact.cmd.action, name, arg }
  }

  const hits = suggest(name)
  if (hits.length === 1) {
    return { kind: 'command', action: hits[0].action, name: hits[0].name, arg }
  }
  if (hits.length > 1) {
    return { kind: 'suggest', prefix: name, suggestions: hits }
  }
  return { kind: 'unknown', name }
}

function formatSuggestions(suggestions) {
  return suggestions
    .map((c) => `  /${String(c.name).padEnd(14)} ${t(c.summaryKey)}`)
    .join('\n')
}

module.exports = {
  COMMANDS,
  suggest,
  parseSlash,
  formatSuggestions,
  publicCommands
}
