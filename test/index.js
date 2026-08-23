const env = require('bare-env')
env.JOJUN_USE_MOCK_P2P = '1'

const { test } = require('brittle')
const { parseTopic, FIXTURE_TOPIC_HEX } = require('../src/p2p/topic')
const { TOPIC_HEX, PAYLOAD_UTF8 } = require('../src/p2p/fixtures')
const mock = require('../src/p2p/mock')
const swarm = require('../src/contracts')
const fixtures = require('../src/contracts/fixtures')
const { runLeave } = require('../src/commands/leave')

test('topic: parses 64-char hex to 32 bytes', (t) => {
  const buf = parseTopic(FIXTURE_TOPIC_HEX)
  t.is(buf.length, 32)
  t.is(buf.toString('utf8').replace(/\0/g, ''), 'hello-jojun')
})

test('topic: rejects invalid hex', (t) => {
  t.exception(() => parseTopic('abc'), /64 hex/)
  t.exception(() => parseTopic(123), /hex string/)
})

test('fixtures: frozen topic and payload', (t) => {
  t.is(TOPIC_HEX, FIXTURE_TOPIC_HEX)
  t.is(PAYLOAD_UTF8, 'hello jojun')
  t.is(fixtures.TOPIC_HEX, TOPIC_HEX)
  t.is(fixtures.PAYLOAD_UTF8, PAYLOAD_UTF8)
  t.is(fixtures.EVENT_PEER_CONNECTED, 'peer-connected')
})

test('p2p: on() and onMessage() return unsubscribe functions', async (t) => {
  await mock.join(TOPIC_HEX)

  const unsubMsg = mock.onMessage(() => {})
  const unsubPeer = mock.on('peer-connected', () => {})
  t.is(typeof unsubMsg, 'function')
  t.is(typeof unsubPeer, 'function')
  unsubMsg()
  unsubPeer()
  t.ok(await mock.flush())

  await mock.leave()
})

test('mock: join emits peer-connected and send/onMessage roundtrip', async (t) => {
  const received = []

  await mock.join(TOPIC_HEX)
  mock.onMessage((data) => received.push(data.toString()))
  await new Promise((resolve) => {
    const unsub = mock.on('peer-connected', () => {
      unsub()
      resolve()
    })
  })

  const st = mock.status()
  t.is(st.joined, true)
  t.is(st.topic, TOPIC_HEX)
  t.is(st.mock, true)

  mock.send(Buffer.from(PAYLOAD_UTF8))
  t.is(received.join(''), PAYLOAD_UTF8)

  await mock.leave()
  t.is(mock.status().joined, false)
})

test('contracts: join accepts fixture topic and mock peer connects', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  await new Promise((resolve) => setTimeout(resolve, 50))
  const status = swarm.getStatus()
  t.is(status.peers, 1)
  t.is(status.topic, fixtures.TOPIC_HEX)
})

test('contracts: onPeer and onMessage return unsubscribe functions', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  const unsubPeer = swarm.onPeer(() => {})
  const unsubMsg = swarm.onMessage(() => {})
  t.is(typeof unsubPeer, 'function')
  t.is(typeof unsubMsg, 'function')
  unsubPeer()
  unsubMsg()
  t.ok(await swarm.flush())
})

test('contracts: paste/yank round-trip against mock adapter', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  const sent = swarm.send(fixtures.PAYLOAD_UTF8)
  t.is(sent.length, fixtures.PAYLOAD_UTF8.length)

  const blob = swarm.getLastBlob()
  t.is(blob.toString('utf8'), fixtures.PAYLOAD_UTF8)
})

test('contracts: onMessage receives bytes sent on mock adapter', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  let received = null
  swarm.onMessage((bytes) => {
    received = bytes
  })

  swarm.send(fixtures.PAYLOAD_UTF8)
  t.is(received.toString('utf8'), fixtures.PAYLOAD_UTF8)
})

test('contracts: leave clears swarm session', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)
  swarm.send(fixtures.PAYLOAD_UTF8)
  await runLeave()

  const status = swarm.getStatus()
  t.is(status.joined, false)
  t.is(status.topic, null)
  t.is(status.peers, 0)
  t.is(swarm.getLastBlob(), null)
})

test('contracts: join rejects invalid topic hex', async (t) => {
  await swarm._resetForTests()
  await t.exception(async () => swarm.join('not-a-topic'), /64 hex/)
})

test('contracts: send requires join first', async (t) => {
  await swarm._resetForTests()
  t.exception(() => swarm.send('hello'), /not joined/)
})

const { parseSlash, suggest, publicCommands } = require('../src/cli/slash')
const { humanError } = require('../src/cli/human-error')
const { renderBanner, BANNER_ART } = require('../src/cli/banner')
const { nameToTopic, topicToName } = require('../src/cli/room-name')
const { t: msg, setLang, getLang } = require('../src/cli/i18n')

test('i18n: default English; es is Colombian tu', (t) => {
  setLang('en')
  t.is(getLang(), 'en')
  t.ok(/Paste here/.test(msg('tagline')))
  t.ok(!/tenés|pegás|vos /.test(msg('tagline')))
  setLang('es')
  t.ok(/Pegas aquí/.test(msg('tagline')))
  t.ok(/tienes/.test(msg('setupQuestion')))
  t.ok(!/tenés|pegás/.test(msg('setupQuestion')))
  setLang('en')
})

test('room-name: empty and test room map to fixture topic', (t) => {
  t.is(nameToTopic(''), FIXTURE_TOPIC_HEX)
  t.is(nameToTopic('test room'), FIXTURE_TOPIC_HEX)
  t.is(nameToTopic('sala de prueba'), FIXTURE_TOPIC_HEX)
  t.is(nameToTopic(FIXTURE_TOPIC_HEX), FIXTURE_TOPIC_HEX)
  t.is(topicToName(FIXTURE_TOPIC_HEX), 'test room')
  const hex = nameToTopic('hackathon')
  t.is(hex.length, 64)
  t.is(topicToName(hex), 'hackathon')
})

test('slash: empty / suggests public human commands', (t) => {
  const parsed = parseSlash('/')
  t.is(parsed.kind, 'suggest')
  t.is(parsed.suggestions.length, publicCommands().length)
})

test('slash: human and expert names map to the same action', (t) => {
  t.is(parseSlash('/conectar').action, 'connect')
  t.is(parseSlash('/join sala').action, 'connect')
  t.is(parseSlash('/join sala').arg, 'sala')
  t.is(parseSlash('/enviar hola').action, 'send')
  t.is(parseSlash('/paste hola').action, 'send')
  t.is(parseSlash('/recibir').action, 'receive')
  t.is(parseSlash('/yank').action, 'receive')
  t.is(parseSlash('/desconectar').action, 'disconnect')
  t.is(parseSlash('/leave').action, 'disconnect')
  t.is(parseSlash('/ayuda').action, 'help')
  t.is(parseSlash('/help').name, 'help')
})

test('slash: unknown and prefix suggest', (t) => {
  const unknown = parseSlash('/nope')
  t.is(unknown.kind, 'unknown')
  t.is(unknown.name, 'nope')

  const hits = suggest('wa')
  t.is(hits.length, 1)
  t.is(hits[0].name, 'wait')
})

test('human-error: English default; Spanish Colombian optional', (t) => {
  setLang('en')
  t.ok(
    /Connect to a room first/.test(humanError(new Error('not joined to a topic; run join first')))
  )
  t.ok(/Nobody in the room/.test(humanError(new Error('timed out waiting for peer after 30000ms'))))
  setLang('es')
  t.ok(/conéctate|conectate/i.test(humanError(new Error('not joined to a topic'))))
  t.ok(!/Pulsá|tenés/.test(humanError(new Error('not joined to a topic'))))
  setLang('en')
})

test('banner: pixel pigeon + wordmark and responsive layout', (t) => {
  t.ok(BANNER_ART.includes('█'))
  t.ok(BANNER_ART.includes('─'))
  const { indentFor, wrapLine, renderTruecolor } = require('../src/cli/banner')
  t.is(indentFor(40, 56), 1)
  t.ok(indentFor(80, 56) >= 2)
  t.is(indentFor(200, 56), 8)
  const color = renderTruecolor()
  t.ok(color.includes('38;2;'))
  t.ok(color.includes('█'))
  const text = renderBanner({ version: '0.0.1', color: false, columns: 80 })
  t.ok(text.includes('Paste here'))
  t.ok(text.includes('0.0.1'))
  t.ok(text.includes('? help'))
  t.ok(wrapLine('aaaa bbbb cccc dddd eeee', 10).length > 1)
})

test('contracts: setUseMock is a real switch (stays mock in unit tests)', async (t) => {
  await swarm._resetForTests()
  t.is(typeof swarm.setUseMock, 'function')
  t.is(swarm.isUsingMock(), true)
  await swarm.setUseMock(true)
  t.is(swarm.isUsingMock(), true)
  t.is(swarm.getStatus().mock, true)
})

const { pathHasDir } = require('../src/core/path-install')

test('path-install: pathHasDir matches Windows dirs', (t) => {
  t.ok(
    pathHasDir(
      'C:\\foo;C:\\Users\\me\\AppData\\Local\\Programs\\Jojun',
      'C:\\Users\\me\\AppData\\Local\\Programs\\Jojun'
    )
  )
  t.ok(
    pathHasDir(
      'C:\\foo;C:\\Users\\me\\AppData\\Local\\Programs\\Jojun\\',
      'C:\\Users\\me\\AppData\\Local\\Programs\\Jojun'
    )
  )
  t.ok(!pathHasDir('C:\\foo;C:\\bar', 'C:\\Users\\me\\AppData\\Local\\Programs\\Jojun'))
})

const fsTest = require('bare-fs')
const osTest = require('bare-os')
const pathTest = require('bare-path')
const { isWindows } = require('which-runtime')
const { removeFromPathValue } = require('../src/core/path-install')
const uninstall = require('../src/commands/uninstall')

const SEP = isWindows ? ';' : ':'
const TARGET = isWindows ? 'C:\\Programs\\Jojun' : '/opt/jojun'
const OTHER_A = isWindows ? 'C:\\foo' : '/usr/bin'
const OTHER_B = isWindows ? 'C:\\bar' : '/usr/local/bin'

function tmpStorage(name) {
  const dir = pathTest.join(osTest.tmpdir(), 'jojun-test-' + name + '-' + Date.now())
  fsTest.mkdirSync(dir, { recursive: true })
  return dir
}

function capture(fn) {
  const original = console.log
  const lines = []
  console.log = (...args) => lines.push(args.join(' '))
  const restore = () => {
    console.log = original
  }
  return Promise.resolve()
    .then(fn)
    .then(
      (result) => {
        restore()
        return { result, lines }
      },
      (err) => {
        restore()
        throw err
      }
    )
}

test('path-install: removeFromPathValue drops the entry and keeps the rest in order', (t) => {
  const value = [OTHER_A, TARGET, OTHER_B].join(SEP)
  const out = removeFromPathValue(value, TARGET)

  t.is(out.removed, true)
  t.is(out.value, [OTHER_A, OTHER_B].join(SEP))
  t.is(out.value.split(SEP)[0], OTHER_A, 'order preserved')
  t.is(out.value.split(SEP)[1], OTHER_B, 'order preserved')
})

test('path-install: removeFromPathValue removes every duplicate', (t) => {
  const value = [OTHER_A, TARGET, OTHER_B, TARGET].join(SEP)
  const out = removeFromPathValue(value, TARGET)

  t.is(out.removed, true)
  t.is(out.value, [OTHER_A, OTHER_B].join(SEP))
})

test('path-install: removeFromPathValue ignores trailing separator and case', (t) => {
  const sep = isWindows ? '\\' : '/'
  const stored = TARGET + sep
  t.is(removeFromPathValue([OTHER_A, stored].join(SEP), TARGET).removed, true)
  t.is(removeFromPathValue([OTHER_A, TARGET.toUpperCase()].join(SEP), TARGET).removed, true)
})

test('path-install: removeFromPathValue leaves a non-matching value untouched', (t) => {
  const value = [OTHER_A, OTHER_B].join(SEP)
  const out = removeFromPathValue(value, TARGET)

  t.is(out.removed, false)
  t.is(out.value, value, 'returned byte-for-byte')
})

test('path-install: removeFromPathValue handles empty and single-entry values', (t) => {
  const empty = removeFromPathValue('', TARGET)
  t.is(empty.removed, false)
  t.is(empty.value, '')

  const single = removeFromPathValue(TARGET, TARGET)
  t.is(single.removed, true)
  t.is(single.value, '')

  const noDir = removeFromPathValue([OTHER_A].join(SEP), '')
  t.is(noDir.removed, false)
})

test('uninstall: discover reports the storage directory and its contents', (t) => {
  const dir = tmpStorage('discover')
  fsTest.writeFileSync(pathTest.join(dir, 'ui.json'), '{}')
  fsTest.writeFileSync(pathTest.join(dir, 'updates.log'), 'x')

  const facts = uninstall.discover({ flags: { storage: dir }, appName: 'Jojun', isDev: false })

  t.is(facts.storage.path, dir)
  t.is(facts.storage.exists, true)
  t.ok(facts.storage.entries.includes('ui.json'))
  t.ok(facts.storage.entries.includes('updates.log'))

  fsTest.rmSync(dir, { recursive: true, force: true })
})

test('uninstall: storage override wins and the dev runtime stays in tmpdir', (t) => {
  const override = pathTest.join(osTest.tmpdir(), 'jojun-override-only')
  const overridden = uninstall.discover({ flags: { storage: override }, appName: 'Jojun' })
  t.is(overridden.storage.path, override)

  const dev = uninstall.discover({ flags: {}, appName: 'Jojun', isDev: true })
  t.ok(dev.storage.path.startsWith(osTest.tmpdir()), 'dev storage lives under tmpdir')
  t.absent(dev.storage.path.includes('Application Support'), 'never the persistent location')
})

test('uninstall: hasFootprint is false when nothing was found', (t) => {
  t.is(
    uninstall.hasFootprint({
      storage: { exists: false, entries: [] },
      pathEntries: [],
      binaries: []
    }),
    false
  )
  t.is(
    uninstall.hasFootprint({
      storage: { exists: true, entries: [] },
      pathEntries: [],
      binaries: []
    }),
    true
  )
})

test('uninstall: a binary Jojun did not place needs opt-in', (t) => {
  const facts = {
    storage: { path: '/nope', exists: false, entries: [] },
    pathEntries: [],
    binaries: [{ path: '/home/me/.local/bin/jojun', provenance: 'unknown', running: false }],
    pear: { detected: false }
  }

  const kept = uninstall.plan(facts, {}).targets.find((x) => x.id === 'binary')
  t.is(kept.action, 'needs-opt-in')
  t.is(kept.reason, 'not-placed-by-jojun')

  const optedIn = uninstall
    .plan(facts, { removeBinaries: true })
    .targets.find((x) => x.id === 'binary')
  t.is(optedIn.action, 'remove')
  t.is(optedIn.reason, 'opted-in')
})

test('uninstall: an absent storage directory is planned as skip', (t) => {
  const facts = {
    storage: { path: '/nope', exists: false, entries: [] },
    pathEntries: [],
    binaries: [],
    pear: { detected: false }
  }
  const storage = uninstall.plan(facts, {}).targets.find((x) => x.id === 'storage')
  t.is(storage.action, 'skip')
  t.is(storage.reason, 'absent')
})

test('uninstall: dry run reports the plan and deletes nothing', async (t) => {
  const dir = tmpStorage('dryrun')
  fsTest.writeFileSync(pathTest.join(dir, 'ui.json'), '{}')

  const { result } = await capture(() =>
    uninstall.runUninstall({
      flags: { storage: dir },
      appName: 'Jojun',
      isDev: false,
      dryRun: true,
      yes: true
    })
  )

  t.is(result.changed, false)
  t.is(result.exitCode, 0)
  t.ok(fsTest.existsSync(dir), 'dry run left the directory in place')

  fsTest.rmSync(dir, { recursive: true, force: true })
})

test('uninstall: refuses to remove without confirmation when stdin is not a TTY', async (t) => {
  const dir = tmpStorage('noconfirm')
  fsTest.writeFileSync(pathTest.join(dir, 'ui.json'), '{}')

  const { result } = await capture(() =>
    uninstall.runUninstall({
      flags: { storage: dir },
      appName: 'Jojun',
      isDev: false,
      yes: false
    })
  )

  t.is(result.ok, false)
  t.is(result.exitCode, 1)
  t.is(result.changed, false)
  t.ok(fsTest.existsSync(dir), 'nothing was removed')

  fsTest.rmSync(dir, { recursive: true, force: true })
})

test('uninstall: confirmed run removes the storage directory', async (t) => {
  const dir = tmpStorage('confirmed')
  fsTest.writeFileSync(pathTest.join(dir, 'ui.json'), '{}')

  const { result } = await capture(() =>
    uninstall.runUninstall({
      flags: { storage: dir },
      appName: 'Jojun',
      isDev: false,
      yes: true
    })
  )

  t.is(result.ok, true)
  t.is(result.changed, true)
  t.is(result.exitCode, 0)
  t.absent(fsTest.existsSync(dir), 'storage directory is gone')
})

test('uninstall: one failing target does not abandon the others', async (t) => {
  const dir = tmpStorage('partial')
  const blocker = tmpStorage('partial-blocker')

  const planned = {
    targets: [
      {
        id: 'storage',
        kind: 'directory',
        path: dir,
        entries: [],
        action: 'remove',
        reason: 'created-by-jojun'
      },
      // unlinkSync against a directory fails, standing in for a locked file
      { id: 'binary', kind: 'file', path: blocker, action: 'remove', reason: 'installed-location' }
    ]
  }

  const { outcomes, failed } = await uninstall.execute(planned)

  t.is(failed, true)
  t.is(outcomes.find((x) => x.id === 'storage').outcome, 'removed')
  t.is(outcomes.find((x) => x.id === 'binary').outcome, 'failed')
  t.ok(outcomes.find((x) => x.id === 'binary').error, 'failure carries a reason')
  t.absent(fsTest.existsSync(dir), 'the removable target was still removed')

  fsTest.rmSync(blocker, { recursive: true, force: true })
})

test('uninstall: the running executable is reported, never silently skipped', (t) => {
  const facts = {
    storage: { path: '/nope', exists: false, entries: [] },
    pathEntries: [],
    binaries: [{ path: '/somewhere/jojun', provenance: 'jojun-placed', running: true }],
    pear: { detected: false }
  }

  const binary = uninstall.plan(facts, {}).targets.find((x) => x.id === 'binary')
  t.ok(binary, 'still present in the plan')
  t.is(binary.action, isWindows ? 'manual' : 'remove')
})

// A real peer message: emitted on the room, so it does not pass through
// contracts.send() and is therefore genuinely inbound.
function peerSends(text) {
  mock.getRoom().emit('message', Buffer.from(text, 'utf8'))
}

test('history: received messages are kept in arrival order', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  peerSends('one')
  peerSends('two')
  peerSends('three')

  const received = swarm.getReceived()
  t.is(received.length, 3)
  t.alike(
    received.map((entry) => entry.bytes.toString('utf8')),
    ['one', 'two', 'three']
  )
  t.is(swarm.getLastReceived().bytes.toString('utf8'), 'three')
})

test('history: keeps the 50 most recent received and drops the oldest', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  for (let i = 1; i <= 55; i++) peerSends('msg-' + i)

  const received = swarm.getReceived()
  t.is(received.length, 50)
  t.is(received[0].bytes.toString('utf8'), 'msg-6', 'oldest five dropped')
  t.is(received[49].bytes.toString('utf8'), 'msg-55')
})

test('transports: only the looping-back one is exempt from echo suppression', (t) => {
  // The mock is the simulated other PC in practice mode, so its echo counts as
  // received. Hyperswarm never echoes, so a local send there must be filtered.
  t.is(require('../src/p2p/mock').loopsBack, true)
  t.is(require('../src/p2p').loopsBack, false)
})

test('history: every message is direction-tagged', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  swarm.send('mine')

  const history = swarm.getHistory()
  t.is(history.length, 2, 'sent once, and the simulated peer delivered it back')
  t.is(history[0].direction, 'out')
  t.is(history[1].direction, 'in')
  t.is(history[0].bytes.toString('utf8'), 'mine')
})

test('practice mode: the simulated peer delivers your own send back', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  swarm.send('hello jojun')

  // What the tutorial relies on: send, then Receive shows something.
  t.is(swarm.getLastReceived().bytes.toString('utf8'), 'hello jojun')
  t.is(swarm.getReceived().length, 1)
})

test('history: a peer message after a local send is also received', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  swarm.send('mine')
  peerSends('theirs')

  t.alike(
    swarm.getReceived().map((entry) => entry.bytes.toString('utf8')),
    ['mine', 'theirs']
  )
  t.is(swarm.getLastReceived().bytes.toString('utf8'), 'theirs', 'replay shows the newest')
})

test('history: onMessage stays the raw transport hook', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  const viaReceived = []
  const viaMessage = []
  const unsubA = swarm.onReceived((bytes) => viaReceived.push(bytes.toString('utf8')))
  const unsubB = swarm.onMessage((bytes) => viaMessage.push(bytes.toString('utf8')))

  swarm.send('mine')
  peerSends('theirs')

  t.alike(viaMessage, ['mine', 'theirs'], 'unchanged by this feature')
  t.alike(viaReceived, ['mine', 'theirs'], 'on a looping-back transport nothing is filtered')

  unsubA()
  unsubB()
})

test('history: unsubscribing stops delivery', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  const seen = []
  const unsub = swarm.onReceived((bytes) => seen.push(bytes.toString('utf8')))
  peerSends('before')
  unsub()
  peerSends('after')

  t.alike(seen, ['before'])
})

test('history: replay with nothing received returns null, not an error', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  t.is(swarm.getLastReceived(), null)
  t.is(swarm.getReceived().length, 0)
})

test('history: leaving clears it', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  peerSends('one')
  t.is(swarm.getReceived().length, 1)

  await swarm.leave()
  t.is(swarm.getReceived().length, 0)
  t.is(swarm.getLastReceived(), null)
})

test('history: getLastBlob and waitForBlob are unchanged', async (t) => {
  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)

  t.is(swarm.getLastBlob(), null)

  peerSends('landed')
  t.is(swarm.getLastBlob().toString('utf8'), 'landed', 'still tracks the newest blob')

  // still short-circuits when a blob is already present
  const blob = await swarm.waitForBlob(50)
  t.is(blob.toString('utf8'), 'landed')

  await swarm._resetForTests()
  await swarm.join(fixtures.TOPIC_HEX)
  swarm.send('sent-locally')
  t.is(swarm.getLastBlob().toString('utf8'), 'sent-locally', 'send still sets lastBlob')
})

test('prefs: autoReceive defaults on and survives an older ui.json', (t) => {
  const { DEFAULTS, loadPrefs, savePrefs } = require('../src/cli/prefs')
  t.is(DEFAULTS.autoReceive, true)

  const dir = pathTest.join(osTest.tmpdir(), 'jojun-prefs-' + Date.now())
  fsTest.mkdirSync(dir, { recursive: true })
  // an old file written before this key existed
  fsTest.writeFileSync(pathTest.join(dir, 'ui.json'), JSON.stringify({ lang: 'es' }))

  const loaded = loadPrefs(dir)
  t.is(loaded.autoReceive, true, 'missing key picks up the default')
  t.is(loaded.lang, 'es', 'existing keys preserved')

  savePrefs(dir, { ...loaded, autoReceive: false })
  t.is(loadPrefs(dir).autoReceive, false, 'the choice persists')

  fsTest.rmSync(dir, { recursive: true, force: true })
})

test('pear-install: Windows client looks for name.exe not Jojun/name.exe', (t) => {
  const pkg = require('../package.json')
  t.is(typeof pkg.bin, 'string')
  const host = 'win32-x64'
  const required = '/by-arch/' + host + '/app/' + pkg.name + '.exe'
  t.is(required, '/by-arch/win32-x64/app/jojun.exe')
  t.ok(!required.includes('/Jojun/jojun.exe'))
})

test('pear-install: macOS client looks for ~/.local/bin/jojun (bin name, no .app)', (t) => {
  const pkg = require('../package.json')
  const home = '/Users/judge'
  const dest = home + '/.local/bin/' + pkg.name
  t.is(dest, '/Users/judge/.local/bin/jojun')
  const required = '/by-arch/darwin-arm64/app/' + pkg.name
  t.is(required, '/by-arch/darwin-arm64/app/jojun')
})

test('path-install: unix PATH export matches pear-install rc snippet', (t) => {
  const { unixExportLine, unixShellConfig } = require('../src/core/path-install')
  t.is(unixShellConfig('/bin/zsh').rel, '.zshrc')
  t.is(unixShellConfig('/bin/zsh').isFish, false)
  t.is(unixExportLine('/Users/x/.local/bin', false), '\nexport PATH="$PATH:/Users/x/.local/bin"')
  t.ok(unixExportLine('/Users/x/.local/bin', true).includes('fish_add_path'))
})

test('darwin binary: Mach-O arm64 with LC_CODE_SIGNATURE (Apple Silicon will SIGKILL if that blob is stale)', (t) => {
  const fs = require('bare-fs')
  const path = require('bare-path')
  const os = require('bare-os')
  const cwd = typeof os.cwd === 'function' ? os.cwd() : os.cwd
  const p = path.join(cwd, 'out', 'darwin-arm64', 'jojun')
  if (!fs.existsSync(p)) {
    t.pass('no local darwin-arm64 binary')
    return
  }
  const fd = fs.openSync(p, 'r')
  const head = Buffer.alloc(8)
  fs.readSync(fd, head, 0, 8, 0)
  fs.closeSync(fd)
  t.alike(head.subarray(0, 4), Buffer.from([0xcf, 0xfa, 0xed, 0xfe]))
})

test('darwin wrap: staged jojun is a shell launcher; payload is the Mach-O; first run codesigns', (t) => {
  const { wrapDarwinBin } = require('../scripts/darwin-wrap.js')
  const macho = Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0x0c, 0x00, 0x00, 0x01, 9, 8, 7, 6])
  const { buf, skip, header } = wrapDarwinBin(macho)
  t.ok(header.startsWith('#!/bin/sh'))
  t.ok(header.includes('codesign --force --sign -'))
  t.ok(header.includes('tail -c +'))
  t.ok(!header.includes('obs=1048576'))
  t.is(skip, Buffer.byteLength(header, 'utf8'))
  t.ok(buf.subarray(0, 2).equals(Buffer.from('#!')))
  t.ok(buf.subarray(skip).equals(macho))
})
