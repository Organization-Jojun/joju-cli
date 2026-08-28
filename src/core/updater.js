'use strict'

const path = require('bare-path')
const os = require('bare-os')
const { persistent } = require('bare-storage')
const { scheduleSilentUpdateCheck } = require('../update/silent-check')

function resolveStorage(flags, appName, isDev) {
  if (flags.storage) return flags.storage
  if (isDev) return path.join(os.tmpdir(), 'jojun', appName)
  return path.join(persistent(), appName)
}

/**
 * Fire-and-forget GitHub release check (no Pear daemon).
 * Interactive sessions should set updates=false before calling.
 */
function spawnUpdaterIfEnabled({ flags, appName, isDev, pkg }) {
  const storageDir = resolveStorage(flags, appName, isDev)
  scheduleSilentUpdateCheck({ flags, storageDir, isDev, pkg })
}

function parseUpdateWindow(value) {
  if (value === undefined) return undefined
  const wait = Number(value)
  if (!Number.isSafeInteger(wait) || wait < 0) {
    throw new Error('--update-window must be a non-negative integer')
  }
  return wait
}

/** Pear daemon removed; old --updater argv exits with a clear message. */
async function runUpdaterDaemon() {
  console.error('jojun: Pear updater daemon removed. Use: jojun update')
  Bare.exitCode = 1
}

module.exports = {
  resolveStorage,
  spawnUpdaterIfEnabled,
  parseUpdateWindow,
  runUpdaterDaemon
}
