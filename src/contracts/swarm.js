'use strict'

/**
 * Adapter: Agent-A command surface → Agent-B `src/p2p` (Hyperswarm) o `src/p2p/mock`.
 * Set `JOJUN_USE_MOCK_P2P=1` para tests/dev sin DHT.
 */
const env = require('bare-env')
const { parseTopic } = require('../p2p/topic')
const { EVENT_PEER_CONNECTED } = require('./fixtures')

const p2p =
  env.JOJUN_USE_MOCK_P2P === '1' || env.JOJUN_USE_MOCK_P2P === 'true'
    ? require('../p2p/mock')
    : require('../p2p')

let lastBlob = null

function toBuffer(bytes) {
  if (typeof bytes === 'string') return Buffer.from(bytes, 'utf8')
  if (Buffer.isBuffer(bytes)) return bytes
  throw new Error('payload must be a string or buffer')
}

async function join(topicHex) {
  parseTopic(topicHex)
  await p2p.join(topicHex)
  p2p.onMessage((data) => {
    lastBlob = Buffer.isBuffer(data) ? data : Buffer.from(data)
  })
  const st = p2p.status()
  return { topic: st.topic, joined: st.joined }
}

function send(bytes) {
  const buf = toBuffer(bytes)
  lastBlob = buf
  p2p.send(buf)
  return buf.length
}

function onMessage(handler) {
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
}

function getStatus() {
  const st = p2p.status()
  return {
    joined: st.joined,
    topic: st.topic,
    peers: st.peers
  }
}

function getLastBlob() {
  return lastBlob
}

async function _resetForTests() {
  await p2p.leave()
  lastBlob = null
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
