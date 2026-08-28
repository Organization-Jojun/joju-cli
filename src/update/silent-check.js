'use strict'

const fs = require('bare-fs')
const { checkForUpdate } = require('./github')
const { createUpdateLogger } = require('./logger')

/**
 * Non-blocking check for one-shot commands. Never applies; logs to updates.log.
 */
function scheduleSilentUpdateCheck({ flags, storageDir, isDev, pkg }) {
  if (!flags || flags.updates === false || flags.updater) return
  if (isDev) return
  if (!pkg || !pkg.version) return

  Promise.resolve()
    .then(async () => {
      const info = await checkForUpdate({ currentVersion: pkg.version })
      if (!info.newer) return
      fs.mkdirSync(storageDir, { recursive: true })
      const logger = createUpdateLogger(storageDir)
      logger.info(
        '[updater] update available:',
        info.currentVersion,
        '→',
        info.latestVersion,
        '(run: jojun update)'
      )
      logger.close()
    })
    .catch((err) => {
      try {
        fs.mkdirSync(storageDir, { recursive: true })
        const logger = createUpdateLogger(storageDir)
        logger.error(err, '[updater:check]')
        logger.close()
      } catch {
        // ignore
      }
    })
}

module.exports = { scheduleSilentUpdateCheck }
