'use strict'

const path = require('bare-path')
const env = require('bare-env')
const stdio = require('bare-stdio')
const coreSession = require('../core/session')
const swarm = require('../contracts')
const { resolveStorage } = require('../core/updater')
const { FIXTURE_TOPIC_HEX } = require('../p2p/topic')
const { isInteractive, readLine, write } = require('../core/readline')
const { runJoin } = require('../commands/join')
const { runPaste } = require('../commands/paste')
const { runYank } = require('../commands/yank')
const { runWait, DEFAULT_TIMEOUT_MS } = require('../commands/wait')
const { runLeave } = require('../commands/leave')
const { renderBanner } = require('./banner')
const { helpPanel, keysPanel, emptyRoomHint } = require('./help')
const { parseSlash, formatSuggestions, suggest } = require('./slash')
const { humanError } = require('./human-error')

function useColor() {
  return !!(stdio.out && stdio.out.isTTY)
}

function isMock() {
  return env.JOJUN_USE_MOCK_P2P === '1' || env.JOJUN_USE_MOCK_P2P === 'true'
}

function formatStatus() {
  const st = swarm.getStatus()
  const topic = st.topic ? st.topic.slice(0, 8) : '--------'
  const room = st.joined ? 'joined' : 'sin room'
  const net = isMock() ? 'mock' : 'live'
  const line = `  ${room}  ·  topic ${topic}  ·  peers ${st.peers}  ·  ${net}`
  if (!useColor()) return line
  return `\x1b[36m${line}\x1b[0m`
}

function log(text) {
  write(String(text).endsWith('\n') ? text : text + '\n')
}

function note(text) {
  if (useColor()) log(`\x1b[2m${text}\x1b[0m`)
  else log(text)
}

function errLine(text) {
  if (useColor()) log(`\x1b[33m${text}\x1b[0m`)
  else log(text)
}

function splash(version) {
  write(renderBanner({ version, color: useColor() }))
  log(formatStatus())
  const st = swarm.getStatus()
  if (!st.joined) note(emptyRoomHint())
  log('')
}

function clearScreen(version) {
  write('\x1b[2J\x1b[H')
  splash(version)
}

function trySetRaw(enabled) {
  try {
    if (stdio.in && typeof stdio.in.setRawMode === 'function') {
      stdio.in.setRawMode(enabled)
      return true
    }
  } catch {
    return false
  }
  return false
}

function readRawChunk() {
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      cleanup()
      resolve(chunk)
    }
    const onError = (err) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      stdio.in.removeListener('data', onData)
      stdio.in.removeListener('error', onError)
    }
    stdio.in.on('data', onData)
    stdio.in.on('error', onError)
  })
}

async function promptLine(label) {
  const wasRaw = trySetRaw(false)
  write(label)
  const text = await readLine()
  if (wasRaw) trySetRaw(true)
  return text
}

function truncateBlob(buf) {
  const text = buf.toString('utf8')
  if (text.length <= 2000) return text
  return text.slice(0, 2000) + '\n… (truncado)'
}

async function safe(fn) {
  try {
    await fn()
  } catch (err) {
    errLine(humanError(err))
  }
}

async function doJoin(arg) {
  let topic = (arg || '').trim()
  if (!topic) {
    topic = await promptLine('Topic (Enter = el de prueba): ')
  }
  if (!topic) topic = FIXTURE_TOPIC_HEX
  await safe(async () => {
    await runJoin(topic, { json: false })
    log(formatStatus())
  })
}

async function doPaste(arg) {
  let text = arg
  if (text === undefined || text === '') {
    text = await promptLine('Texto a enviar (Enter vacío cancela): ')
    if (!text) {
      note('Paste cancelado.')
      return
    }
  }
  await safe(async () => {
    note('esperando peer…')
    await runPaste({
      json: false,
      timeout: 30_000,
      bytes: Buffer.from(text, 'utf8')
    })
    log(formatStatus())
  })
}

async function doYank() {
  await safe(async () => {
    note('yank…')
    const blob = await runYank({ timeout: DEFAULT_TIMEOUT_MS, toStdout: false })
    if (!blob || blob.length === 0) {
      note('No hay blob todavía.')
      return
    }
    log(`yank ${blob.length} bytes`)
    log(truncateBlob(blob))
  })
}

async function doWait() {
  await safe(async () => {
    note('esperando peer…')
    await runWait(DEFAULT_TIMEOUT_MS, { json: false })
    log(formatStatus())
  })
}

async function doLeave() {
  await safe(async () => {
    await runLeave({ json: false })
    log(formatStatus())
  })
}

async function doStatus() {
  log(formatStatus())
  const st = swarm.getStatus()
  if (st.topic) log(`  full topic: ${st.topic}`)
  else note(emptyRoomHint())
}

async function doTopic() {
  const st = swarm.getStatus()
  if (st.topic) log(st.topic)
  else note(emptyRoomHint())
}

function showHelp() {
  log('')
  log(helpPanel())
  log('')
  log(keysPanel())
  log('')
}

function showKeys() {
  log('')
  log(keysPanel())
  log('')
}

function showSuggest(prefix) {
  const hits = suggest(prefix || '')
  if (!hits.length) {
    errLine('No hay comandos que coincidan. /help')
    return
  }
  log('Comandos:')
  log(formatSuggestions(hits))
}

async function runSlash(line) {
  const parsed = parseSlash(line)
  if (!parsed) return false

  if (parsed.kind === 'suggest') {
    showSuggest(parsed.prefix || '')
    return true
  }
  if (parsed.kind === 'unknown') {
    errLine(`No conozco /${parsed.name}. Tab o /help.`)
    return true
  }

  switch (parsed.name) {
    case 'help':
      showHelp()
      break
    case 'keys':
    case 'shortcuts':
      showKeys()
      break
    case 'status':
      await doStatus()
      break
    case 'join':
      await doJoin(parsed.arg)
      break
    case 'paste':
      await doPaste(parsed.arg)
      break
    case 'yank':
      await doYank()
      break
    case 'wait':
      await doWait()
      break
    case 'leave':
      await doLeave()
      break
    case 'topic':
      await doTopic()
      break
    case 'clear':
      return 'clear'
    case 'quit':
      return 'quit'
    default:
      errLine(`No conozco /${parsed.name}. /help`)
  }
  return true
}

async function dispatchIdle(token) {
  const t = String(token || '').trim().toLowerCase()
  if (!t) return null
  if (t === 'q' || t === 'quit') return 'quit'
  if (t === '?' || t === 'help') {
    showHelp()
    return null
  }
  if (t.startsWith('/')) return runSlash(t)
  if (t === 'j' || t === '1' || t === 'join') {
    await doJoin('')
    return null
  }
  if (t === 'p' || t === '2' || t === 'paste') {
    await doPaste('')
    return null
  }
  if (t === 'y' || t === '3' || t === 'yank') {
    await doYank()
    return null
  }
  if (t === 'w' || t === '4' || t === 'wait') {
    await doWait()
    return null
  }
  if (t === 'l' || t === '5' || t === 'leave') {
    await doLeave()
    return null
  }
  if (t === 's' || t === 'status') {
    await doStatus()
    return null
  }
  errLine('No entendí. ? o /help · j p y w l · q salir')
  return null
}

async function loopLineMode(version) {
  while (true) {
    write('jojun> ')
    const line = await readLine()
    const result = await dispatchIdle(line)
    if (result === 'quit') return
    if (result === 'clear') clearScreen(version)
  }
}

async function loopRawMode(version) {
  trySetRaw(true)
  write('jojun> ')
  while (true) {
    const chunk = await readRawChunk()
    const b = chunk[0]
    if (b === 3) return
    if (b === 9) {
      write('\n')
      showSuggest('')
      write('jojun> ')
      continue
    }
    if (b === 13 || b === 10) {
      write('\n')
      write('jojun> ')
      continue
    }
    if (b === 127 || b === 8) continue

    const ch = chunk.toString('utf8')
    if (ch === '/') {
      trySetRaw(false)
      write('/')
      const rest = await readLine()
      trySetRaw(true)
      const result = await runSlash('/' + rest)
      if (result === 'quit') return
      if (result === 'clear') clearScreen(version)
      write('jojun> ')
      continue
    }

    write('\n')
    const result = await dispatchIdle(ch)
    if (result === 'quit') return
    if (result === 'clear') clearScreen(version)
    write('jojun> ')
  }
}

async function runSession({ flags, appName, isDev, version }) {
  const dir = resolveStorage(flags, appName, isDev)
  coreSession.setStorageDir(path.join(dir, 'jojun'))

  if (!isInteractive()) {
    const { printStaticHelp } = require('./menu')
    printStaticHelp()
    return
  }

  splash(version)

  let raw = false
  try {
    raw = trySetRaw(true)
    if (raw) trySetRaw(false)
  } catch {
    raw = false
  }

  try {
    if (raw) await loopRawMode(version)
    else await loopLineMode(version)
  } finally {
    trySetRaw(false)
    try {
      await swarm.leave()
      coreSession.clear()
    } catch {
      // leave is best-effort on quit
    }
    note('Listo.')
  }
}

module.exports = { runSession, formatStatus }
