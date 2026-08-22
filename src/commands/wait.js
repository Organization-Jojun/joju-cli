'use strict'

const swarm = require('../contracts')
const session = require('../core/session')
const { EVENT_PEER_CONNECTED } = require('../contracts/fixtures')
const { ensureJoined } = require('./paste')

const DEFAULT_TIMEOUT_MS = 30_000

function runWait(timeoutMs = DEFAULT_TIMEOUT_MS) {
  ensureJoined()

  const status = swarm.getStatus()
  if (status.peers > 0) {
    console.log(`peer connected (${status.peers})`)
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`timed out waiting for peer after ${timeoutMs}ms`))
    }, timeoutMs)

    const onPeer = (event) => {
      if (event.type !== EVENT_PEER_CONNECTED) return
      cleanup()
      console.log(`peer connected (${event.peers})`)
      resolve()
    }

    const cleanup = () => {
      clearTimeout(timer)
      unsubscribe()
    }

    const unsubscribe = swarm.onPeer(onPeer)
  })
}

module.exports = { runWait, DEFAULT_TIMEOUT_MS }
