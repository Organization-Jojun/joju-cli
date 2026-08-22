'use strict'

const stdio = require('bare-stdio')

function readStdin() {
  const chunks = []
  return new Promise((resolve, reject) => {
    const onData = (chunk) => chunks.push(chunk)
    const onEnd = () => {
      cleanup()
      resolve(Buffer.concat(chunks))
    }
    const onError = (err) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      stdio.in.removeListener('data', onData)
      stdio.in.removeListener('end', onEnd)
      stdio.in.removeListener('error', onError)
    }

    stdio.in.on('data', onData)
    stdio.in.on('end', onEnd)
    stdio.in.on('error', onError)

    if (stdio.in.readableEnded) onEnd()
  })
}

module.exports = { readStdin }
