'use strict'

const fs = require('bare-fs')
const os = require('bare-os')
const { emit } = require('../core/output')
const { resolveStorage } = require('../core/updater')
const { checkForUpdate, applyUpdate } = require('../update/github')
const { createUpdateLogger } = require('../update/logger')

async function runUpdate(opts = {}) {
  const {
    flags = {},
    appName = 'Jojun',
    isDev = false,
    json = false,
    checkOnly = false,
    pkg = { version: '0.0.0' },
    apiBase,
    platform,
    arch,
    targetPath = null
  } = opts

  const currentVersion = pkg.version
  const storageDir = resolveStorage(flags, appName, isDev)

  try {
    const info = await checkForUpdate({
      currentVersion,
      platform: platform || os.platform(),
      arch: arch || os.arch(),
      apiBase
    })

    if (checkOnly) {
      emit(
        json,
        {
          ok: true,
          action: 'update-check',
          currentVersion: info.currentVersion,
          latestVersion: info.latestVersion,
          newer: info.newer,
          assetName: info.assetName
        },
        info.newer
          ? `Update available: ${info.currentVersion} → ${info.latestVersion} (${info.assetName})`
          : `Already up to date (${info.currentVersion})`
      )
      return { ok: true, exitCode: 0, newer: info.newer }
    }

    if (!info.newer) {
      emit(
        json,
        {
          ok: true,
          action: 'update',
          updated: false,
          currentVersion: info.currentVersion,
          latestVersion: info.latestVersion
        },
        `Already up to date (${info.currentVersion})`
      )
      return { ok: true, exitCode: 0, updated: false }
    }

    const result = await applyUpdate({
      currentVersion,
      platform: platform || os.platform(),
      arch: arch || os.arch(),
      apiBase,
      isDev,
      execPath: isDev ? null : os.execPath(),
      targetPath,
      release: info.release
    })

    emit(
      json,
      {
        ok: true,
        action: 'update',
        updated: true,
        fromVersion: result.fromVersion,
        toVersion: result.toVersion,
        path: result.path
      },
      `Updated ${result.fromVersion} → ${result.toVersion}\nInstalled: ${result.path}\nOpen a new terminal if PATH was just set.`
    )
    return { ok: true, exitCode: 0, updated: true, result }
  } catch (err) {
    try {
      fs.mkdirSync(storageDir, { recursive: true })
      const logger = createUpdateLogger(storageDir)
      logger.error(err, '[update:error]')
      logger.close()
    } catch {
      // ignore log failures
    }
    emit(
      json,
      { ok: false, action: 'update', error: err.message },
      'Update failed: ' + err.message
    )
    return { ok: false, exitCode: 1, error: err }
  }
}

module.exports = { runUpdate }
