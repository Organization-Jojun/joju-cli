'use strict'

/**
 * Map Bare/Node platform+arch to release asset names.
 * Assets: jojun_<version>_<platform>-<arch>.zip|tar.gz
 */

function normalizeArch(arch) {
  const a = String(arch || '').toLowerCase()
  if (a === 'x64' || a === 'amd64' || a === 'x86_64') return 'x64'
  if (a === 'arm64' || a === 'aarch64') return 'arm64'
  return a
}

function normalizePlatform(platform) {
  const p = String(platform || '').toLowerCase()
  if (p === 'win32' || p === 'windows') return 'win32'
  if (p === 'darwin' || p === 'macos' || p === 'mac') return 'darwin'
  if (p === 'linux') return 'linux'
  return p
}

function hostKey(platform, arch) {
  return normalizePlatform(platform) + '-' + normalizeArch(arch)
}

function archiveExt(platform) {
  return normalizePlatform(platform) === 'win32' ? 'zip' : 'tar.gz'
}

function binaryName(platform) {
  return normalizePlatform(platform) === 'win32' ? 'jojun.exe' : 'jojun'
}

/**
 * @param {string} version semver with or without leading v
 * @param {string} platform
 * @param {string} arch
 */
function assetFileName(version, platform, arch) {
  const ver = String(version || '').replace(/^v/, '')
  const host = hostKey(platform, arch)
  return 'jojun_' + ver + '_' + host + '.' + archiveExt(platform)
}

function checksumsFileName() {
  return 'checksums.txt'
}

/**
 * Parse a checksums.txt body (sha256sum style: "<hash>  <filename>" or "<hash> <filename>").
 * @returns {Map<string, string>} filename → lowercase hex digest
 */
function parseChecksums(text) {
  const map = new Map()
  const lines = String(text || '').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const m = trimmed.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/)
    if (!m) continue
    map.set(m[2].trim(), m[1].toLowerCase())
  }
  return map
}

function pickAsset(assets, version, platform, arch) {
  const want = assetFileName(version, platform, arch)
  const list = Array.isArray(assets) ? assets : []
  return list.find((a) => a && a.name === want) || null
}

module.exports = {
  normalizeArch,
  normalizePlatform,
  hostKey,
  archiveExt,
  binaryName,
  assetFileName,
  checksumsFileName,
  parseChecksums,
  pickAsset
}
