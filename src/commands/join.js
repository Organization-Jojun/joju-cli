'use strict'

const swarm = require('../contracts')
const session = require('../core/session')

function runJoin(topic) {
  const result = swarm.join(topic)
  session.saveJoin(result.topic)
  console.log(`joined topic ${result.topic.slice(0, 8)}…`)
}

module.exports = { runJoin }
