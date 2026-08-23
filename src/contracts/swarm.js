'use strict'

/**
 * Adapter: CLI → `src/p2p` (Hyperswarm) o `src/p2p/mock`.
 * Env `JOJUN_USE_MOCK_P2P=1` elige el default. `setUseMock` cambia en caliente (tutorial).
 */
const env = require('bare-env')
const { parseTopic } = require('../p2p/topic')
const { EVENT_PEER_CONNECTED } = require('./fixtures')

let useMock = env.JOJUN_USE_MOCK_P2P === '1' || env.JOJUN_USE_MOCK_P2P === 'true'
let p2p = loadP2p(useMock)
let lastBlob = null
let messageHooked = false

function loadP2p(mock) {
  return mock ? require('../p2p/mock') : require('../p2p')
}

function toBuffer(bytes) {
  if (typeof bytes === 'string') return Buffer.from(bytes, 'utf8')
  if (Buffer.isBuffer(bytes)) return bytes
  throw new Error('payload must be a string or buffer')
}

function hookMessages() {
  if (messageHooked) return
  messageHooked = true
  p2p.onMessage((data) => {
    lastBlob = Buffer.isBuffer(data) ? data : Buffer.from(data)
  })
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
  const ok = p2p.send(buf)
  return { length: buf.length, delivered: ok !== false }
}

async function flush() {
  return p2p.flush()
}

function onMessage(handler) {
  hookMessages()
  return p2p.onMessage(handler)
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
}

module.exports = {
  join,
  send,
  flush,
  onMessage,
  onPeer,
  leave,
  getStatus,
  getLastBlob,
  waitForBlob,
  setUseMock,
  isUsingMock,
  _resetForTests
}
