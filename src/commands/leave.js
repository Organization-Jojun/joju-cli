'use strict'

const swarm = require('../contracts')
const session = require('../core/session')
const { emit } = require('../core/output')

async function runLeave(opts = {}) {
  await swarm.leave()
  session.clear()
  emit(opts.json, { ok: true, action: 'leave' }, 'left topic')
}

module.exports = { runLeave }
