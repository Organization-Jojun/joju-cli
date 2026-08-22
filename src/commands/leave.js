'use strict'

const swarm = require('../contracts')
const session = require('../core/session')

function runLeave() {
  swarm.leave()
  session.clear()
  console.log('left topic')
}

module.exports = { runLeave }
