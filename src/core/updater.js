'use strict'

const path = require('bare-path')
const os = require('bare-os')
const { persistent } = require('bare-storage')
const { isWindows } = require('which-runtime')
const App = require('../../app.js')

function resolveStorage(flags, appName, isDev) {
  if (flags.storage) return flags.storage
  if (isDev) return path.join(os.tmpdir(), 'pear', appName)
  return path.join(persistent(), appName)
}

function spawnUpdaterIfEnabled({ flags, appName, isDev, pkg }) {
  if (flags.updates === false || flags.updater) return

  const dir = resolveStorage(flags, appName, isDev)
  const entrypoint = isDev ? Bare.argv[1] : null
  const wait = parseUpdateWindow(flags.updateWindow)

  App.spawnUpdater(dir, os.execPath(), entrypoint, wait)
}

function parseUpdateWindow(value) {
  if (value === undefined) return undefined
  const wait = Number(value)
  if (!Number.isSafeInteger(wait) || wait < 0) {
    throw new Error('--update-window must be a non-negative integer')
  }
  return wait
}

async function runUpdaterDaemon({ flags, appName, isDev, pkg }) {
  const dir = resolveStorage(flags, appName, isDev)
  const wait = parseUpdateWindow(flags.updateWindow)
  const name = isWindows ? appName + '.exe' : appName

  const app = new App({
    dir,
    app: isDev ? null : os.execPath(),
    updates: true,
    version: pkg.version,
    upgrade: pkg.upgrade,
    name
  })

  const FileLog = require('bare-file-logger')
  const Console = require('bare-console')
  const output = new FileLog(path.join(dir, 'updates.log'), { maxSize: 1024 * 1024 })
  const log = new Console(output)

  app.on('updating', () => log.log('[updater] getting new update'))
  app.on('updating-delta', (delta) => log.log('[updater]', delta))
  app.on('updated', () => log.log('[updater] update complete... applying'))
  app.on('update-applied', () => log.log('[updater] applied update, restart to run latest version'))
  app.on('error', (err) => log.error('[app:error]', err))

  const process = require('bare-process')
  process.on('SIGHUP', () => app.exit(129))
  process.on('SIGINT', () => app.exit(130))
  process.on('SIGQUIT', () => app.exit(131))
  process.on('SIGTERM', () => app.exit(143))

  let code = 0
  try {
    await app.updater(wait)
  } catch (err) {
    log.error('[app:error]', err)
    code = 1
  }
  code = Bare.exitCode || code
  try {
    await app.exit(code)
  } finally {
    output.close()
  }
}

module.exports = {
  resolveStorage,
  spawnUpdaterIfEnabled,
  parseUpdateWindow,
  runUpdaterDaemon
}
