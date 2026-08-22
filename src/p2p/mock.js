'use strict'

const EventEmitter = require('bare-events')
const { FIXTURE_TOPIC_HEX } = require('./topic')
const { PAYLOAD_UTF8 } = require('./fixtures')

/**
 * In-process mock for Agent-A CLI dev/tests without DHT.
 * Same API surface as src/p2p/index.js — emits peer-connected after join.
 */
class MockRoom extends EventEmitter {
  constructor() {
    super()
    this.topic = null
    this._messages = []
    this._peerTimer = null
  }

  async join(topicHex) {
    await this.leave()
    this.topic = topicHex

    this._peerTimer = setTimeout(() => {
      this.emit('peer-connected', { publicKey: 'mock-peer' })
      this.emit('update', this.status())
    }, 10)
  }

  send(bytes) {
    const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
    this._messages.push(buf)
    this.emit('message', buf)
    return true
  }

  onMessage(fn) {
    return this.on('message', fn)
  }

  async leave() {
    if (this._peerTimer !== null) {
      clearTimeout(this._peerTimer)
      this._peerTimer = null
    }
    this.topic = null
    this.emit('update', this.status())
  }

  status() {
    return {
      joined: this.topic !== null,
      topic: this.topic,
      peers: this.topic !== null ? 1 : 0,
      connecting: 0,
      mock: true
    }
  }
}

let active = null

async function join(topic) {
  if (active !== null) await active.leave()
  active = new MockRoom()
  await active.join(topic)
  return active
}

function send(bytes) {
  if (active === null) throw new Error('not joined to a topic')
  return active.send(bytes)
}

function onMessage(fn) {
  if (active === null) throw new Error('not joined to a topic')
  return active.onMessage(fn)
}

function on(event, fn) {
  if (active === null) throw new Error('not joined to a topic')
  return active.on(event, fn)
}

async function leave() {
  if (active === null) return
  const room = active
  active = null
  await room.leave()
}

function status() {
  return active !== null
    ? active.status()
    : { joined: false, topic: null, peers: 0, connecting: 0, mock: true }
}

function getRoom() {
  return active
}

module.exports = {
  join,
  send,
  onMessage,
  on,
  leave,
  status,
  getRoom,
  MockRoom,
  FIXTURE_TOPIC_HEX,
  PAYLOAD_UTF8
}
