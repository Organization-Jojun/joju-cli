const { test } = require('brittle')
const swarm = require('../src/contracts')
const fixtures = require('../src/contracts/fixtures')
const { runYank } = require('../src/commands/yank')
const { runLeave } = require('../src/commands/leave')

test('fixtures expose topic hex, payload utf8, and peer-connected event', (t) => {
  t.is(fixtures.TOPIC_HEX.length, 64)
  t.is(fixtures.PAYLOAD_UTF8, 'paste me across the swarm')
  t.is(fixtures.EVENT_PEER_CONNECTED, 'peer-connected')
})

test('join accepts fixture topic and mock peer connects', async (t) => {
  swarm._resetForTests()
  swarm.join(fixtures.TOPIC_HEX)

  await new Promise((resolve) => setTimeout(resolve, 50))
  const status = swarm.getStatus()
  t.is(status.peers, 1)
  t.is(status.topic, fixtures.TOPIC_HEX)
})

test('paste/yank round-trip against mock swarm', (t) => {
  swarm._resetForTests()
  swarm.join(fixtures.TOPIC_HEX)

  const sent = swarm.send(fixtures.PAYLOAD_UTF8)
  t.is(sent, fixtures.PAYLOAD_UTF8.length)

  const blob = swarm.getLastBlob()
  t.is(blob.toString('utf8'), fixtures.PAYLOAD_UTF8)

  runYank()
  t.pass('yank wrote stdout without error')
})

test('onMessage receives bytes sent on the mock swarm', (t) => {
  swarm._resetForTests()
  swarm.join(fixtures.TOPIC_HEX)

  let received = null
  swarm.onMessage((bytes) => {
    received = bytes
  })

  swarm.send(fixtures.PAYLOAD_UTF8)
  t.is(received.toString('utf8'), fixtures.PAYLOAD_UTF8)
})

test('leave clears swarm session', (t) => {
  swarm._resetForTests()
  swarm.join(fixtures.TOPIC_HEX)
  swarm.send(fixtures.PAYLOAD_UTF8)
  runLeave()

  const status = swarm.getStatus()
  t.is(status.joined, false)
  t.is(status.topic, null)
  t.is(status.peers, 0)
  t.is(swarm.getLastBlob(), null)
})

test('join rejects invalid topic hex', (t) => {
  swarm._resetForTests()
  t.exception(() => swarm.join('not-a-topic'), /64 hex characters/)
})

test('send requires join first', (t) => {
  swarm._resetForTests()
  t.exception(() => swarm.send('hello'), /not joined/)
})
