'use strict'

const swarm = require('../contracts')
const { EVENT_PEER_CONNECTED } = require('../contracts/fixtures')
const { emit } = require('../core/output')
const { ensureJoined } = require('../core/ensure-joined')

const DEFAULT_TIMEOUT_MS = 30_000

async function runWait(timeoutMs = DEFAULT_TIMEOUT_MS, opts = {}) {
  await ensureJoined()

  const status = swarm.getStatus()
  if (status.peers > 0) {
    if (!opts.silent) {
      emit(
        opts.json,
        { ok: true, action: 'wait', peers: status.peers },
        `peer connected (${status.peers})`
      )
    }
    return
  }

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`timed out waiting for peer after ${timeoutMs}ms`))
    }, timeoutMs)

    const onPeer = (event) => {
      if (event.type !== EVENT_PEER_CONNECTED) return
      cleanup()
      if (!opts.silent) {
        emit(
          opts.json,
          { ok: true, action: 'wait', peers: event.peers },
          `peer connected (${event.peers})`
        )
      }
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
