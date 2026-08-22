const { test } = require('brittle')
const { parseTopic, FIXTURE_TOPIC_HEX } = require('../src/p2p/topic')
const { TOPIC_HEX, PAYLOAD_UTF8 } = require('../src/p2p/fixtures')
const mock = require('../src/p2p/mock')

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
