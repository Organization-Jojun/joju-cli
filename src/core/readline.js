'use strict'

const stdio = require('bare-stdio')

function isInteractive() {
  return stdio.in && stdio.in.isTTY === true
}

function readLine() {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0)
    const onData = (chunk) => {
      buf = Buffer.concat([buf, chunk])
      if (buf.includes(10) || buf.includes(13)) {
        cleanup()
        const text = buf.toString('utf8').replace(/\r?\n/g, '').trim()
        resolve(text)
      }
    }
    const onError = (err) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      stdio.in.removeListener('data', onData)
      stdio.in.removeListener('error', onError)
    }
    stdio.in.on('data', onData)
    stdio.in.on('error', onError)
  })
}

function write(text) {
  stdio.out.write(text)
}

module.exports = { isInteractive, readLine, write }
