'use strict'

const fs = require('bare-fs')
const path = require('bare-path')
const os = require('bare-os')

/**
 * Replace the on-disk binary at targetPath with bytes from sourcePath.
 * Windows cannot overwrite a running .exe: rename to .old then move new in.
 */
function replaceBinary(sourcePath, targetPath) {
  const dir = path.dirname(targetPath)
  fs.mkdirSync(dir, { recursive: true })

  if (os.platform() === 'win32') {
    return replaceWindows(sourcePath, targetPath)
  }
  return replaceUnix(sourcePath, targetPath)
}

function replaceUnix(sourcePath, targetPath) {
  const tmp = targetPath + '.new'
  fs.copyFileSync(sourcePath, tmp)
  try {
    fs.chmodSync(tmp, 0o755)
  } catch {
    // best-effort
  }
  fs.renameSync(tmp, targetPath)
  return { path: targetPath, replaced: true }
}

function replaceWindows(sourcePath, targetPath) {
  const oldPath = targetPath + '.old'
  try {
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  } catch {
    // ignore
  }

  if (fs.existsSync(targetPath)) {
    try {
      fs.renameSync(targetPath, oldPath)
    } catch (err) {
      throw new Error(
        'cannot replace running binary; close other jojun processes and retry: ' +
          (err && err.message)
      )
    }
  }

  try {
    fs.copyFileSync(sourcePath, targetPath)
  } catch (err) {
    // roll back if we moved the old file
    if (fs.existsSync(oldPath) && !fs.existsSync(targetPath)) {
      try {
        fs.renameSync(oldPath, targetPath)
      } catch {
        // leave .old for the user
      }
    }
    throw err
  }

  try {
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  } catch {
    // locked .old is fine; next update cleans it
  }

  return { path: targetPath, replaced: true, oldPath }
}

module.exports = { replaceBinary }
