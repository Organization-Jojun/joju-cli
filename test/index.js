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

test('mock: join emits peer-connected and send/onMessage roundtrip', async (t) => {
  const received = []

  await mock.join(TOPIC_HEX)
  mock.onMessage((data) => received.push(data.toString()))
  await new Promise((resolve) => mock.on('peer-connected', resolve))

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
  t.ok(/Connect to a room first/.test(humanError(new Error('not joined to a topic; run join first'))))
  t.ok(/Nobody in the room/.test(humanError(new Error('timed out waiting for peer after 30000ms'))))
  setLang('es')
  t.ok(/conéctate|conectate/i.test(humanError(new Error('not joined to a topic'))))
  t.ok(!/Pulsá|tenés/.test(humanError(new Error('not joined to a topic'))))
  setLang('en')
})

test('banner: original pigeon splash names JoJun', (t) => {
  t.ok(BANNER_ART.includes('JOJUN'))
  t.ok(/pigeon|carrier/i.test(BANNER_ART))
  const text = renderBanner({ version: '0.0.1', color: false })
  t.ok(text.includes('Paste here'))
  t.ok(text.includes('0.0.1'))
  t.ok(text.includes('? help'))
})

test('contracts: setUseMock is a real switch (stays mock in unit tests)', async (t) => {
  await swarm._resetForTests()
  t.is(typeof swarm.setUseMock, 'function')
  t.is(swarm.isUsingMock(), true)
  await swarm.setUseMock(true)
  t.is(swarm.isUsingMock(), true)
  t.is(swarm.getStatus().mock, true)
})
