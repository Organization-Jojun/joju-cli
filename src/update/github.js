'use strict'

const fs = require('bare-fs')
const path = require('bare-path')
const os = require('bare-os')
const { RELEASE_API } = require('./release-config')
const {
  assetFileName,
  checksumsFileName,
  parseChecksums,
  pickAsset,
  normalizePlatform,
  normalizeArch
} = require('./assets')
const { verifySha256, sha256Buffer } = require('./checksum')
const { getJson, getBuffer } = require('./http')
const { extractArchive } = require('./extract')
const { replaceBinary } = require('./replace-binary')
const { resolveInstallPath } = require('./install-target')

function compareSemver(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  const pb = String(b).replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d > 0 ? 1 : -1
  }
  return 0
}

async function fetchLatestRelease({ apiBase = RELEASE_API } = {}) {
  const { json } = await getJson(apiBase + '/latest')
  return json
}

async function fetchReleaseByTag(tag, { apiBase = RELEASE_API } = {}) {
  const t = String(tag).replace(/^v/, '')
  const { json } = await getJson(apiBase + '/tags/v' + t)
  return json
}

function releaseVersion(release) {
  return String(release.tag_name || release.name || '').replace(/^v/, '')
}

function findChecksumAsset(release) {
  const name = checksumsFileName()
  const assets = release.assets || []
  return assets.find((a) => a.name === name) || null
}

async function loadChecksumMap(release) {
  const asset = findChecksumAsset(release)
  if (!asset || !asset.browser_download_url) {
    throw new Error('release is missing checksums.txt')
  }
  const { body } = await getBuffer(asset.browser_download_url)
  return parseChecksums(body.toString('utf8'))
}

/**
 * Check whether a newer release exists for this host.
 */
async function checkForUpdate({
  currentVersion,
  platform = os.platform(),
  arch = os.arch(),
  apiBase = RELEASE_API,
  release = null
} = {}) {
  const rel = release || (await fetchLatestRelease({ apiBase }))
  const latest = releaseVersion(rel)
  const asset = pickAsset(rel.assets, latest, platform, arch)
  const newer = compareSemver(latest, currentVersion) > 0
  return {
    currentVersion: String(currentVersion).replace(/^v/, ''),
    latestVersion: latest,
    newer,
    assetName: asset ? asset.name : assetFileName(latest, platform, arch),
    assetUrl: asset ? asset.browser_download_url : null,
    release: rel
  }
}

/**
 * Download, verify, extract, and replace the installed binary.
 */
async function applyUpdate({
  currentVersion,
  platform = os.platform(),
  arch = os.arch(),
  apiBase = RELEASE_API,
  targetPath = null,
  isDev = false,
  execPath = null,
  workDir = null,
  release = null
} = {}) {
  const check = await checkForUpdate({
    currentVersion,
    platform,
    arch,
    apiBase,
    release
  })

  if (!check.newer && release === null) {
    return { updated: false, reason: 'up-to-date', ...check }
  }

  if (!check.assetUrl) {
    throw new Error('no release asset for ' + normalizePlatform(platform) + '-' + normalizeArch(arch))
  }

  const checksums = await loadChecksumMap(check.release)
  const expected = checksums.get(check.assetName)
  if (!expected) {
    throw new Error('checksums.txt has no entry for ' + check.assetName)
  }

  const { body } = await getBuffer(check.assetUrl)
  verifySha256(body, expected)

  const base =
    workDir ||
    path.join(os.tmpdir(), 'jojun-update-' + Date.now() + '-' + Math.random().toString(16).slice(2))
  fs.mkdirSync(base, { recursive: true })
  const archivePath = path.join(base, check.assetName)
  fs.writeFileSync(archivePath, body)

  const extractDir = path.join(base, 'out')
  const extracted = extractArchive(archivePath, extractDir, platform)

  const dest =
    targetPath ||
    resolveInstallPath({
      platform,
      execPath: execPath || (typeof os.execPath === 'function' ? os.execPath() : null),
      isDev
    })

  replaceBinary(extracted, dest)

  return {
    updated: true,
    path: dest,
    fromVersion: String(currentVersion).replace(/^v/, ''),
    toVersion: check.latestVersion,
    sha256: sha256Buffer(body),
    assetName: check.assetName
  }
}

module.exports = {
  compareSemver,
  fetchLatestRelease,
  fetchReleaseByTag,
  releaseVersion,
  checkForUpdate,
  applyUpdate,
  loadChecksumMap
}
