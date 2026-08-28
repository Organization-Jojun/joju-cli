'use strict'

const os = require('bare-os')
const path = require('bare-path')
const env = require('bare-env')
const { binaryName } = require('./assets')

/**
 * Documented install locations — must stay aligned with path-install + uninstall.
 * Windows: %LOCALAPPDATA%\Programs\Jojun\jojun.exe
 * macOS/Linux: ~/.local/bin/jojun
 */
function documentedBinaryDir(platform = os.platform()) {
  if (platform === 'win32') {
    const local = env.LOCALAPPDATA
    if (!local) return null
    return path.join(local, 'Programs', 'Jojun')
  }
  if (platform === 'darwin' || platform === 'linux') {
    const home = os.homedir()
    if (!home) return null
    return path.join(home, '.local', 'bin')
  }
  return null
}

function documentedBinaryPath(platform = os.platform()) {
  const dir = documentedBinaryDir(platform)
  if (!dir) return null
  return path.join(dir, binaryName(platform))
}

/**
 * Resolve where to place a freshly downloaded binary.
 * Prefers the running install path when not a dev runtime; else documented dir.
 */
function resolveInstallPath({ platform = os.platform(), execPath = null, isDev = false } = {}) {
  const name = binaryName(platform)
  if (!isDev && execPath) {
    const base = path.basename(execPath, path.extname(execPath)).toLowerCase()
    if (base === 'jojun') return execPath
  }
  const documented = documentedBinaryPath(platform)
  if (documented) return documented
  return path.join(os.tmpdir(), 'jojun-install', name)
}

module.exports = {
  documentedBinaryDir,
  documentedBinaryPath,
  resolveInstallPath
}
