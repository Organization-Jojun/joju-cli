'use strict'

const path = require('bare-path')
const FileLog = require('bare-file-logger')
const Console = require('bare-console')

/**
 * Create a file logger for OTA errors at <storage>/updates.log (variant/daemon contract).
 */
function createUpdateLogger(storageDir) {
  const logPath = path.join(storageDir, 'updates.log')
  const output = new FileLog(logPath, { maxSize: 1024 * 1024 })
  const log = new Console(output)

  return {
    path: logPath,
    log,
    output,
    error(err, prefix = '[app:error]') {
      if (err instanceof Error) log.error(prefix, err.message, err.stack || '')
      else log.error(prefix, String(err))
    },
    info(...args) {
      log.log(...args)
    },
    close() {
      output.close()
    }
  }
}

module.exports = { createUpdateLogger }
