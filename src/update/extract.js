'use strict'

const fs = require('bare-fs')
const path = require('bare-path')
const os = require('bare-os')
const { spawnSync } = require('bare-subprocess')
const { binaryName, archiveExt } = require('./assets')

/**
 * Extract jojun binary from a zip (Windows) or tar.gz (Unix) into destDir.
 * Uses built-in OS tools so we do not pull archive deps into Bare.
 * @returns {string} path to extracted binary
 */
function extractArchive(archivePath, destDir, platform = os.platform()) {
  fs.mkdirSync(destDir, { recursive: true })
  const name = binaryName(platform)
  const ext = archiveExt(platform)

  if (ext === 'zip') {
    extractZip(archivePath, destDir)
  } else {
    extractTarGz(archivePath, destDir)
  }

  const candidates = [
    path.join(destDir, name),
    path.join(destDir, 'jojun', name),
    path.join(destDir, path.basename(archivePath, '.' + ext), name)
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }

  // search one level deep
  let entries = []
  try {
    entries = fs.readdirSync(destDir)
  } catch {
    entries = []
  }
  for (const ent of entries) {
    const p = path.join(destDir, ent)
    try {
      const st = fs.statSync(p)
      if (st.isDirectory()) {
        const nested = path.join(p, name)
        if (fs.existsSync(nested)) return nested
      } else if (ent === name || ent.toLowerCase() === name.toLowerCase()) {
        return p
      }
    } catch {
      // skip
    }
  }

  throw new Error('archive did not contain ' + name)
}

function extractZip(archivePath, destDir) {
  if (os.platform() === 'win32') {
    const script =
      "Expand-Archive -LiteralPath '" +
      String(archivePath).replace(/'/g, "''") +
      "' -DestinationPath '" +
      String(destDir).replace(/'/g, "''") +
      "' -Force"
    const result = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
      { windowsHide: true }
    )
    if (result.status !== 0) {
      throw new Error(
        'Expand-Archive failed: ' + (result.stderr && result.stderr.toString())
      )
    }
    return
  }
  const result = spawnSync('unzip', ['-o', archivePath, '-d', destDir])
  if (result.status !== 0) {
    throw new Error('unzip failed: ' + (result.stderr && result.stderr.toString()))
  }
}

function extractTarGz(archivePath, destDir) {
  const result = spawnSync('tar', ['-xzf', archivePath, '-C', destDir])
  if (result.status !== 0) {
    throw new Error('tar extract failed: ' + (result.stderr && result.stderr.toString()))
  }
}

module.exports = { extractArchive }
