'use strict'

const swarm = require('../contracts')
const session = require('../core/session')
const { writeStdout } = require('../core/stdout')
const { ensureJoined } = require('../core/ensure-joined')

async function runYank(opts = {}) {
  let blob = swarm.getLastBlob()
  if (blob === null) blob = session.loadBlob()
  if (blob === null) {
    await ensureJoined()
    blob = await swarm.waitForBlob(opts.timeout || 30_000)
    session.saveBlob(blob)
  }
  writeStdout(blob)
}

module.exports = { runYank }
