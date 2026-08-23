'use strict'

const swarm = require('../contracts')
const session = require('../core/session')

async function runLeave() {
  await swarm.leave()
  session.clear()
  console.log('left topic')
}

module.exports = { runLeave }
