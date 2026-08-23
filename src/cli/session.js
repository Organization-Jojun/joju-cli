'use strict'

const path = require('bare-path')
const stdio = require('bare-stdio')
const coreSession = require('../core/session')
const swarm = require('../contracts')
const { resolveStorage } = require('../core/updater')
const { isInteractive, readLine, write } = require('../core/readline')
const { runJoin } = require('../commands/join')
const { runPaste } = require('../commands/paste')
const { runYank } = require('../commands/yank')
const { runWait } = require('../commands/wait')
const { runLeave } = require('../commands/leave')
const { renderBanner } = require('./banner')
const { helpPanel, keysPanel, menuPanel, emptyRoomHint } = require('./help')
const { parseSlash, formatSuggestions, suggest } = require('./slash')
const { humanError } = require('./human-error')
const { t, setLang, getLang, normalizeLang } = require('./i18n')
const { nameToTopic, topicToName } = require('./room-name')
const { loadPrefs, savePrefs } = require('./prefs')
const { runTutorial } = require('./tutorial')

let prefs = { lang: 'en', timeoutMs: 30_000, mock: null, roomName: '', autoReceive: true }
let storageDir = null
let unsubscribeReceived = null
// Depth, not a boolean: doSettings() and the tutorial nest prompts inside a
// prompt, and an inner one finishing must not unblock output for the outer.
let canonicalReads = 0
let pendingIncoming = []
let atPrompt = false

function persist(patch) {
  prefs = { ...prefs, ...patch }
  if (storageDir) savePrefs(storageDir, prefs)
}

function useColor() {
  return !!(stdio.out && stdio.out.isTTY)
}

function timeoutMs() {
  return Number(prefs.timeoutMs) > 0 ? Number(prefs.timeoutMs) : 30_000
}

function formatStatus() {
  const st = swarm.getStatus()
  const name = topicToName(st.topic, prefs.roomName)
  const room = st.joined ? t('statusJoined') : t('statusIdle')
  const net = swarm.isUsingMock() ? t('statusMock') : t('statusLive')
  const label = name && st.joined ? name : '—'
  const line = `  ${room}  ·  ${label}  ·  peers ${st.peers}  ·  ${net}`
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

function termColumns() {
  const n = stdio.out && stdio.out.columns
  return Number(n) > 0 ? Number(n) : 80
}

function splash(version) {
  const cols = termColumns()
  const { indentFor } = require('./banner')
  write(
    renderBanner({
      version,
      color: useColor(),
      tagline: t('tagline'),
      hint: t('hint'),
      columns: cols
    })
  )
  const pad = indentFor(cols, 56)
  const prefix = ' '.repeat(Math.max(0, pad))
  log(prefix + formatStatus().trim())
  const st = swarm.getStatus()
  if (!st.joined) note(prefix + emptyRoomHint())
  log('')
}

function showMenu() {
  log('')
  log(menuPanel())
  log('')
}

function clearScreen(version) {
  write('\x1b[2J\x1b[H')
  splash(version)
  showMenu()
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
  canonicalReads++
  try {
    return await readLine()
  } finally {
    canonicalReads--
    if (wasRaw) trySetRaw(true)
    flushIncoming()
  }
}

function autoReceiveOn() {
  return prefs.autoReceive !== false
}

function renderIncoming(bytes) {
  if (atPrompt) write('\n')
  log(`${t('received')} ${bytes.length} ${t('bytes')}`)
  log(truncateBlob(bytes))
  if (atPrompt) write(t('prompt'))
}

function flushIncoming() {
  if (canonicalReads > 0 || pendingIncoming.length === 0) return
  const queued = pendingIncoming
  pendingIncoming = []
  for (const bytes of queued) renderIncoming(bytes)
}

function onIncoming(bytes) {
  if (!autoReceiveOn()) return
  if (canonicalReads > 0) {
    pendingIncoming.push(bytes)
    return
  }
  renderIncoming(bytes)
}

function subscribeIncoming() {
  releaseIncoming()
  try {
    unsubscribeReceived = swarm.onReceived(onIncoming)
  } catch {
    // not joined; nothing to subscribe to yet
    unsubscribeReceived = null
  }
}

function releaseIncoming() {
  if (typeof unsubscribeReceived === 'function') unsubscribeReceived()
  unsubscribeReceived = null
  pendingIncoming = []
}

function truncateBlob(buf) {
  const text = buf.toString('utf8')
  if (text.length <= 2000) return text
  return text.slice(0, 2000) + '\n…'
}

async function safe(fn) {
  try {
    return await fn()
  } catch (err) {
    errLine(humanError(err))
    return null
  }
}

async function doConnect(arg, opts = {}) {
  let name = (arg || '').trim()
  if (!name && !opts.skipPrompt) {
    name = await promptLine(t('roomPrompt'))
  }
  const display = name || prefs.roomName || 'test room'
  const topic = nameToTopic(name || prefs.roomName || '')
  persist({ roomName: display })
  return safe(async () => {
    await runJoin(topic, { json: false })
    subscribeIncoming()
    log(formatStatus())
    return display
  })
}

async function doSend(arg, opts = {}) {
  if (!swarm.getStatus().joined && !coreSession.loadTopic()) {
    errLine(t('connectFirst'))
    return
  }
  let text = arg
  if ((text === undefined || text === '') && !opts.skipPrompt) {
    text = await promptLine(t('sendPrompt'))
    if (!text) {
      note(t('sendCancel'))
      return
    }
  }
  if (!text) return
  await safe(async () => {
    note(t('waitingPeer'))
    await runPaste({
      json: false,
      timeout: timeoutMs(),
      bytes: Buffer.from(String(text), 'utf8')
    })
    log(formatStatus())
  })
}

async function doReceive() {
  // With auto-receive on, messages have already been shown as they arrived, so
  // this replays the newest instead of blocking for one that is already here.
  if (autoReceiveOn()) {
    const entry = swarm.getLastReceived()
    if (entry === null) {
      note(t('noBlobYet'))
      return
    }
    log(`${t('received')} ${entry.bytes.length} ${t('bytes')}`)
    log(truncateBlob(entry.bytes))
    return
  }

  await safe(async () => {
    note(t('waitingMsg'))
    const blob = await runYank({ timeout: timeoutMs(), toStdout: false })
    if (!blob || blob.length === 0) {
      note(t('noBlob'))
      return
    }
    log(`${t('received')} ${blob.length} ${t('bytes')}`)
    log(truncateBlob(blob))
  })
}

async function doWait() {
  await safe(async () => {
    note(t('waitingPeer'))
    await runWait(timeoutMs(), { json: false })
    log(formatStatus())
  })
}

async function doDisconnect() {
  await safe(async () => {
    releaseIncoming()
    await runLeave({ json: false })
    log(formatStatus())
  })
}

async function doStatus() {
  log(formatStatus())
  const st = swarm.getStatus()
  if (!st.joined) note(emptyRoomHint())
}

async function doTopic() {
  const st = swarm.getStatus()
  log(t('advancedTitle'))
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

function showAdvanced() {
  log('')
  log(t('advancedTitle'))
  log(t('advancedBody'))
  const st = swarm.getStatus()
  if (st.topic) log(st.topic)
  log('')
}

function showSuggest(prefix) {
  const hits = suggest(prefix || '')
  if (!hits.length) {
    errLine(t('noMatch'))
    return
  }
  log(t('commandsHeader'))
  log(formatSuggestions(hits))
}

async function doLanguage(arg) {
  const next = normalizeLang(arg)
  if (!next) {
    log(t('languageNeed'))
    log(t('languageNow'))
    return
  }
  setLang(next)
  persist({ lang: next })
  log(t('languageSet'))
  log(t('hint'))
}

async function doSettings() {
  log(t('settingsTitle'))
  log(`  ${t('settingsRoom')}: ${prefs.roomName || 'test room'}`)
  log(`  ${t('settingsNet')}: ${swarm.isUsingMock() ? t('statusMock') : t('statusLive')}`)
  log(`  ${t('settingsWait')}: ${Math.round(timeoutMs() / 1000)}`)
  log(`  ${t('settingsLang')}: ${getLang()}`)
  log(`  ${t('settingsAuto')}: ${autoReceiveOn() ? t('settingsAutoOn') : t('settingsAutoOff')}`)
  const choice = (await promptLine(t('settingsPrompt'))).toLowerCase()
  if (choice === 'room' || choice === 'sala') {
    await doConnect('')
    return
  }
  if (choice === 'mock') {
    await swarm.setUseMock(true)
    persist({ mock: true })
    log(formatStatus())
    return
  }
  if (choice === 'live' || choice === 'red') {
    await swarm.setUseMock(false)
    persist({ mock: false })
    log(formatStatus())
    return
  }
  if (choice === 'wait' || choice === 'espera') {
    const sec = Number(await promptLine(t('settingsWaitPrompt')))
    if (sec > 0) persist({ timeoutMs: sec * 1000 })
    return
  }
  if (choice === 'auto' || choice === 'autorecibir') {
    // Only rendering is gated; the subscription stays up so history keeps
    // filling and Receive still has something to show when it is off.
    persist({ autoReceive: !autoReceiveOn() })
    log(autoReceiveOn() ? t('settingsAutoNowOn') : t('settingsAutoNowOff'))
    return
  }
  if (choice === 'language' || choice === 'idioma') {
    await doLanguage(await promptLine('en / es: '))
  }
}

async function runAction(action, arg) {
  switch (action) {
    case 'help':
      showHelp()
      return null
    case 'shortcuts':
      showKeys()
      return null
    case 'status':
      await doStatus()
      return null
    case 'connect':
      await doConnect(arg)
      return null
    case 'send':
      await doSend(arg)
      return null
    case 'receive':
      await doReceive()
      return null
    case 'wait':
      await doWait()
      return null
    case 'disconnect':
      await doDisconnect()
      return null
    case 'topic':
      await doTopic()
      return null
    case 'settings':
      await doSettings()
      return null
    case 'language':
      await doLanguage(arg)
      return null
    case 'advanced':
      showAdvanced()
      return null
    case 'clear':
      return 'clear'
    case 'quit':
      return 'quit'
    default:
      errLine(t('unknownSlash'))
      return null
  }
}

async function runSlash(line) {
  const parsed = parseSlash(line)
  if (!parsed) return false

  if (parsed.kind === 'suggest') {
    showSuggest(parsed.prefix || '')
    return true
  }
  if (parsed.kind === 'unknown') {
    errLine(t('unknownSlash'))
    return true
  }
  return runAction(parsed.action, parsed.arg)
}

async function dispatchIdle(token) {
  const raw = String(token || '').trim()
  const tkn = raw.toLowerCase()
  if (!tkn) return null
  if (tkn.startsWith('/')) return runSlash(tkn.startsWith('/') ? raw : tkn)
  if (tkn === 'q' || tkn === 'quit' || tkn === 'salir') return 'quit'
  if (tkn === '?' || tkn === 'help' || tkn === 'ayuda') {
    showHelp()
    return null
  }
  if (tkn === 'c' || tkn === '1' || tkn === 'connect' || tkn === 'conectar' || tkn === 'j' || tkn === 'join') {
    await doConnect('')
    return null
  }
  if (tkn === 'e' || tkn === '2' || tkn === 'send' || tkn === 'enviar' || tkn === 'p' || tkn === 'paste') {
    await doSend('')
    return null
  }
  if (tkn === 'r' || tkn === '3' || tkn === 'receive' || tkn === 'recibir' || tkn === 'y' || tkn === 'yank') {
    await doReceive()
    return null
  }
  if (tkn === 'w' || tkn === '4' || tkn === 'wait' || tkn === 'esperar') {
    await doWait()
    return null
  }
  if (
    tkn === 'd' ||
    tkn === '5' ||
    tkn === 'disconnect' ||
    tkn === 'desconectar' ||
    tkn === 'l' ||
    tkn === 'leave'
  ) {
    await doDisconnect()
    return null
  }
  if (tkn === 's' || tkn === 'status' || tkn === 'estado') {
    await doStatus()
    return null
  }
  errLine(t('unknownKey'))
  return null
}

async function loopLineMode(version) {
  while (true) {
    write(t('prompt'))
    // Deliberately NOT counted as a guarded read: this is the idle prompt, and
    // queueing here would hold a message back until the user pressed Enter,
    // which is the whole feature. Interleaving with a half-typed line is the
    // accepted trade-off on terminals without raw mode (see design.md).
    atPrompt = true
    let line
    try {
      line = await readLine()
    } finally {
      atPrompt = false
    }
    flushIncoming()
    const result = await dispatchIdle(line)
    if (result === 'quit') return
    if (result === 'clear') clearScreen(version)
  }
}

async function loopRawMode(version) {
  trySetRaw(true)
  write(t('prompt'))
  while (true) {
    atPrompt = true
    let chunk
    try {
      chunk = await readRawChunk()
    } finally {
      atPrompt = false
    }
    const b = chunk[0]
    if (b === 3) return
    if (b === 9) {
      write('\n')
      showSuggest('')
      write(t('prompt'))
      continue
    }
    if (b === 13 || b === 10) {
      write('\n')
      write(t('prompt'))
      continue
    }
    if (b === 127 || b === 8) continue

    const ch = chunk.toString('utf8')
    if (ch === '/') {
      trySetRaw(false)
      write('/')
      canonicalReads++
      let rest
      try {
        rest = await readLine()
      } finally {
        canonicalReads--
        trySetRaw(true)
      }
      flushIncoming()
      const result = await runSlash('/' + rest)
      if (result === 'quit') return
      if (result === 'clear') clearScreen(version)
      write(t('prompt'))
      continue
    }

    write('\n')
    const result = await dispatchIdle(ch)
    if (result === 'quit') return
    if (result === 'clear') clearScreen(version)
    write(t('prompt'))
  }
}

async function askSetup() {
  log(t('setupQuestion'))
  log(t('setupA'))
  log(t('setupB'))
  while (true) {
    const ans = (await promptLine(t('setupPrompt'))).toLowerCase()
    if (ans === 'a' || ans === '1') return 'ready'
    if (ans === 'b' || ans === '2') return 'scratch'
  }
}

async function runSession({ flags, appName, isDev, version }) {
  const dir = resolveStorage(flags, appName, isDev)
  storageDir = path.join(dir, 'jojun')
  coreSession.setStorageDir(storageDir)
  prefs = loadPrefs(storageDir)
  setLang(prefs.lang || 'en')
  if (prefs.mock === true) await swarm.setUseMock(true)
  if (prefs.mock === false) await swarm.setUseMock(false)

  if (!isInteractive()) {
    const { printStaticHelp } = require('./menu')
    printStaticHelp()
    return
  }

  splash(version)

  const pathChoice = await askSetup()
  if (pathChoice === 'scratch') {
    await runTutorial({
      promptLine,
      log,
      note,
      errLine,
      connect: doConnect,
      send: doSend,
      receive: doReceive,
      savePrefs: persist
    })
  }
  showMenu()

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
    releaseIncoming()
    try {
      await swarm.leave()
    } catch {
      // leave is best-effort on quit
    }
    note(t('ready'))
  }
}

module.exports = { runSession, formatStatus }
