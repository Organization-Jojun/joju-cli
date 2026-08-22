'use strict'

const stdio = require('bare-stdio')

function writeStdout(bytes) {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, 'utf8')
  stdio.out.write(buf)
}

module.exports = { writeStdout }
