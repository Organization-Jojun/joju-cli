const { test } = require('brittle')
const Room = require('../src/p2p/room')
const { TOPIC_HEX, PAYLOAD_UTF8 } = require('../src/p2p/fixtures')

test('p2p: two rooms exchange bytes on fixture topic', async (t) => {
  t.timeout(45_000)

  const roomA = new Room()
  const roomB = new Room()
  const received = []

  const unsub = roomB.onMessage((data) => received.push(data.toString()))
  t.is(typeof unsub, 'function')

  await roomA.join(TOPIC_HEX)
  await roomB.join(TOPIC_HEX)

  await waitFor(() => roomA.status().peers > 0 && roomB.status().peers > 0, 20_000)

  roomA.send(Buffer.from(PAYLOAD_UTF8))
  await roomA.flush()

  await waitFor(() => received.length > 0, 10_000)
  t.is(received[0], PAYLOAD_UTF8)

  await roomA.leave().catch(() => {})
  await roomB.leave().catch(() => {})
  await new Promise((resolve) => setTimeout(resolve, 200))
})

function waitFor(fn, ms) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = () => {
      if (fn()) return resolve()
      if (Date.now() - start > ms) return reject(new Error('waitFor timeout'))
      setTimeout(tick, 200)
    }
    tick()
  })
}
