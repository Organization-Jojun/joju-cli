'use strict'

const Hyperswarm = require('hyperswarm')
const EventEmitter = require('bare-events')
const { parseTopic } = require('./topic')

class Room extends EventEmitter {
  constructor() {
    super()
    this.swarm = null
    this.topic = null
    this.topicBuffer = null
    this.connections = new Set()
  }

  async join(topicHex) {
    if (this.swarm !== null) await this.leave()

    this.topic = topicHex
    this.topicBuffer = parseTopic(topicHex)
    this.swarm = new Hyperswarm()

    this.swarm.on('connection', (conn, info) => {
      this.connections.add(conn)

      conn.on('close', () => {
        this.connections.delete(conn)
        this.emit('update', this.status())
      })

      conn.on('error', () => {
        // peer may reset during leave — ignore
      })

      conn.on('data', (data) => {
        this.emit('message', data)
      })

      this.emit('peer-connected', {
        publicKey: info?.publicKey ? info.publicKey.toString('hex') : null
      })
      this.emit('update', this.status())
    })

    this.swarm.on('update', () => {
      this.emit('update', this.status())
    })

    const discovery = this.swarm.join(this.topicBuffer, {
      server: true,
      client: true
    })
    await discovery.flushed()
    await this.swarm.flush()
    this.emit('update', this.status())
  }

  send(bytes) {
    if (this.swarm === null) throw new Error('not joined to a topic')

    const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
    if (this.connections.size === 0) return false

    for (const conn of this.connections) {
      conn.write(buf)
    }
    return true
  }

  onMessage(fn) {
    return this.on('message', fn)
  }

  async leave() {
    if (this.swarm === null) return

    const swarm = this.swarm
    const topicBuffer = this.topicBuffer

    this.swarm = null
    this.topic = null
    this.topicBuffer = null

    if (topicBuffer !== null) {
      try {
        await swarm.leave(topicBuffer)
      } catch {
        // topic may already be left during teardown
      }
    }

    for (const conn of this.connections) {
      try {
        conn.destroy()
      } catch {
        // ignore
      }
    }
    this.connections.clear()

    await swarm.destroy()
    this.emit('update', this.status())
  }

  status() {
    if (this.swarm === null) {
      return {
        joined: false,
        topic: null,
        peers: 0,
        connecting: 0
      }
    }

    return {
      joined: true,
      topic: this.topic,
      peers: this.connections.size,
      connecting: this.swarm.connecting
    }
  }
}

module.exports = Room
