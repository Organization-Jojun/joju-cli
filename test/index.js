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
