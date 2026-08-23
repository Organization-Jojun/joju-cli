'use strict'

/**
 * Adapter: CLI → `src/p2p` (Hyperswarm) o `src/p2p/mock`.
 * Env `JOJUN_USE_MOCK_P2P=1` elige el default. `setUseMock` cambia en caliente (tutorial).
 */
const env = require('bare-env')
const { parseTopic } = require('../p2p/topic')
const { EVENT_PEER_CONNECTED } = require('./fixtures')

const RECEIVED_LIMIT = 50
const HISTORY_LIMIT = 200

let useMock = env.JOJUN_USE_MOCK_P2P === '1' || env.JOJUN_USE_MOCK_P2P === 'true'
let p2p = loadP2p(useMock)
let lastBlob = null
let messageHooked = false
let history = []
// Set for the duration of a local send, so the sender does not see its own
// paste come back as if a peer had sent it. Skipped on a transport that
// declares loopsBack: there the echo IS the simulated peer (practice mode).
// Identity, not content: a peer may legitimately send back the same bytes.
let selfSend = null

function isSelfEcho(data) {
  return !p2p.loopsBack && selfSend !== null && data === selfSend
}

function loadP2p(mock) {
  return mock ? require('../p2p/mock') : require('../p2p')
}

function toBuffer(bytes) {
  if (typeof bytes === 'string') return Buffer.from(bytes, 'utf8')
  if (Buffer.isBuffer(bytes)) return bytes
  throw new Error('payload must be a string or buffer')
}

function record(direction, bytes) {
  history.push({ direction, bytes, at: Date.now() })
  trimHistory()
}

/**
 * Received messages are the contract (the 50 most recent are guaranteed);
 * outgoing entries exist only so a local send is never mistaken for one, so
 * they are what gets evicted when the total needs capping.
 */
function trimHistory() {
  let received = 0
  for (const entry of history) if (entry.direction === 'in') received++

  while (received > RECEIVED_LIMIT) {
    if (history.shift().direction === 'in') received--
  }

  while (history.length > HISTORY_LIMIT) {
    const oldestOut = history.findIndex((entry) => entry.direction === 'out')
    if (oldestOut === -1) break
    history.splice(oldestOut, 1)
  }
}

function hookMessages() {
  if (messageHooked) return
  messageHooked = true
  p2p.onMessage((data) => {
    lastBlob = Buffer.isBuffer(data) ? data : Buffer.from(data)
    if (isSelfEcho(data)) return
    record('in', lastBlob)
  })
}

function getHistory() {
  return history.slice()
}

function getReceived() {
  return history.filter((entry) => entry.direction === 'in')
}

function getLastReceived() {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].direction === 'in') return history[i]
  }
  return null
}

async function setUseMock(mock) {
  const next = !!mock
  if (next === useMock) return useMock
  await leave()
  useMock = next
  p2p = loadP2p(useMock)
  return useMock
}

function isUsingMock() {
  return useMock
}

async function join(topicHex) {
  parseTopic(topicHex)
  await p2p.join(topicHex)
  messageHooked = false
  hookMessages()
  const st = p2p.status()
  return { topic: st.topic, joined: st.joined }
}

function send(bytes) {
  const buf = toBuffer(bytes)
  lastBlob = buf
  record('out', buf)
  selfSend = buf
  try {
    const ok = p2p.send(buf)
    return { length: buf.length, delivered: ok !== false }
  } finally {
    selfSend = null
  }
}

async function flush() {
  return p2p.flush()
}

function onMessage(handler) {
  hookMessages()
  return p2p.onMessage(handler)
}

/**
 * Messages that count as having come from a peer.
 *
 * onMessage() stays the raw transport hook — the round-trip tests rely on it
 * seeing everything. Subscribers that render to the user want this one, or on
 * the real network the sender sees their own message come back as received.
 * On a loopsBack transport nothing is filtered: that echo is the simulated PC.
 */
function onReceived(handler) {
  hookMessages()
  return p2p.onMessage((data) => {
    if (isSelfEcho(data)) return
    handler(Buffer.isBuffer(data) ? data : Buffer.from(data))
  })
}

function onPeer(handler) {
  return p2p.on('peer-connected', (event) => {
    const st = p2p.status()
    handler({
      type: EVENT_PEER_CONNECTED,
      peers: st.peers,
      publicKey: event.publicKey
    })
  })
}

async function leave() {
  await p2p.leave()
  lastBlob = null
  messageHooked = false
  history = []
}

function getStatus() {
  const st = p2p.status()
  return {
    joined: st.joined,
    topic: st.topic,
    peers: st.peers,
    mock: useMock
  }
}

function getLastBlob() {
  return lastBlob
}

function waitForBlob(timeoutMs) {
  if (lastBlob !== null) return Promise.resolve(lastBlob)

  hookMessages()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`timed out waiting for blob after ${timeoutMs}ms`))
    }, timeoutMs)

    const onData = (data) => {
      cleanup()
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
      lastBlob = buf
      resolve(buf)
    }

    const cleanup = () => {
      clearTimeout(timer)
      if (typeof unsubscribe === 'function') unsubscribe()
    }

    const unsubscribe = p2p.onMessage(onData)
  })
}

async function _resetForTests() {
  await p2p.leave()
  lastBlob = null
  messageHooked = false
  history = []
  selfSend = null
}

module.exports = {
  join,
  send,
  flush,
  onMessage,
  onReceived,
  onPeer,
  leave,
  getStatus,
  getLastBlob,
  getHistory,
  getReceived,
  getLastReceived,
  waitForBlob,
  setUseMock,
  isUsingMock,
  _resetForTests
}
