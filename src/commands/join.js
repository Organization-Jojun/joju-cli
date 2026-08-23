'use strict'

const swarm = require('../contracts')
const session = require('../core/session')
const { emit } = require('../core/output')

async function runJoin(topic, opts = {}) {
  const result = await swarm.join(topic)
  session.saveJoin(result.topic)
  emit(
    opts.json,
    { ok: true, action: 'join', topic: result.topic },
    `joined topic ${result.topic.slice(0, 8)}…`
  )
}

module.exports = { runJoin }
