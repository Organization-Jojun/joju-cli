'use strict'

const swarm = require('../contracts')
const session = require('../core/session')
const { writeStdout } = require('../core/stdout')

function runYank() {
  const blob = swarm.getLastBlob() || session.loadBlob()
  if (blob === null) {
    throw new Error('no blob received yet')
  }
  writeStdout(blob)
}

module.exports = { runYank }
