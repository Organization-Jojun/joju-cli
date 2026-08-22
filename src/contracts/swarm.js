'use strict'

const { EVENT_PEER_CONNECTED } = require('./fixtures')

let joined = false
let topic = null
let peerCount = 0
let lastBlob = null
const messageHandlers = new Set()
const peerHandlers = new Set()
let mockPeerTimer = null

function decodeTopic(topicHex) {
  if (typeof topicHex !== 'string') throw new Error('topic must be a hex string')
  const trimmed = topicHex.trim().toLowerCase()
  if (trimmed.length !== 64) {
    throw new Error('topic must be 64 hex characters (32 bytes)')
  }
  if (!/^[0-9a-f]+$/.test(trimmed)) {
    throw new Error('topic must contain only hex characters')
  }
  return trimmed
}

function toBuffer(bytes) {
  if (typeof bytes === 'string') return Buffer.from(bytes, 'utf8')
  if (Buffer.isBuffer(bytes)) return bytes
  throw new Error('payload must be a string or buffer')
}

function emitPeerConnected() {
  const event = { type: EVENT_PEER_CONNECTED, peers: peerCount }
  for (const handler of peerHandlers) handler(event)
}

function scheduleMockPeer() {
  clearTimeout(mockPeerTimer)
  mockPeerTimer = setTimeout(() => {
    if (!joined) return
    peerCount = 1
    emitPeerConnected()
  }, 10)
}

function join(topicHex) {
  topic = decodeTopic(topicHex)
  joined = true
  peerCount = 0
  scheduleMockPeer()
  return { topic, joined: true }
}

function send(bytes) {
  if (!joined) throw new Error('not joined to a topic; run join first')
  const buf = toBuffer(bytes)
  lastBlob = buf
  for (const handler of messageHandlers) handler(buf)
  return buf.length
}

function onMessage(handler) {
  if (typeof handler !== 'function') throw new Error('onMessage handler must be a function')
  messageHandlers.add(handler)
  return () => messageHandlers.delete(handler)
}

function onPeer(handler) {
  if (typeof handler !== 'function') throw new Error('onPeer handler must be a function')
  peerHandlers.add(handler)
  return () => peerHandlers.delete(handler)
}

function leave() {
  joined = false
  topic = null
  peerCount = 0
  lastBlob = null
  clearTimeout(mockPeerTimer)
  mockPeerTimer = null
  messageHandlers.clear()
  peerHandlers.clear()
}

function getStatus() {
  return {
    joined,
    topic,
    peers: peerCount
  }
}

function getLastBlob() {
  return lastBlob
}

/** Test-only reset — not part of the Agent-B wire-up surface. */
function _resetForTests() {
  leave()
}

module.exports = {
  join,
  send,
  onMessage,
  onPeer,
  leave,
  getStatus,
  getLastBlob,
  _resetForTests
}
