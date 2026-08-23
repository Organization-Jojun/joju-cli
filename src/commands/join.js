'use strict'

const swarm = require('../contracts')
const session = require('../core/session')

async function runJoin(topic) {
  const result = await swarm.join(topic)
  session.saveJoin(result.topic)
  console.log(`joined topic ${result.topic.slice(0, 8)}…`)
}

module.exports = { runJoin }
