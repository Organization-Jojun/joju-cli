#!/usr/bin/env node
'use strict'

/**
 * Pack out/<host>/jojun[.exe] into release assets:
 *   dist-release/jojun_<ver>_<host>.zip|tar.gz
 *   dist-release/checksums.txt
 * Darwin: wrap Mach-O with scripts/darwin-wrap.js before packing.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawnSync } = require('child_process')
const { wrapDarwinBin } = require('./darwin-wrap')

const root = path.resolve(__dirname, '..')
const pkg = require(path.join(root, 'package.json'))
const version = String(pkg.version).replace(/^v/, '')
const outRoot = path.join(root, 'out')
const dist = path.join(root, 'dist-release')

const hosts = [
  { host: 'win32-x64', file: 'jojun.exe', archive: 'zip' },
  { host: 'win32-arm64', file: 'jojun.exe', archive: 'zip' },
  { host: 'darwin-arm64', file: 'jojun', archive: 'tar.gz', wrap: true },
  { host: 'darwin-x64', file: 'jojun', archive: 'tar.gz', wrap: true },
  { host: 'linux-x64', file: 'jojun', archive: 'tar.gz' },
  { host: 'linux-arm64', file: 'jojun', archive: 'tar.gz' }
]

fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })

const checksumLines = []
const packed = []

for (const { host, file, archive, wrap } of hosts) {
  const src = path.join(outRoot, host, file)
  if (!fs.existsSync(src)) continue

  const stage = path.join(dist, '_stage', host)
  fs.mkdirSync(stage, { recursive: true })
  const stagedBin = path.join(stage, file)

  if (wrap) {
    const wrapped = wrapDarwinBin(fs.readFileSync(src))
    fs.writeFileSync(stagedBin, wrapped.buf)
    try {
      fs.chmodSync(stagedBin, 0o755)
    } catch {
      // windows staging
    }
  } else {
    fs.copyFileSync(src, stagedBin)
    if (!file.endsWith('.exe')) {
      try {
        fs.chmodSync(stagedBin, 0o755)
      } catch {
        // ignore
      }
    }
  }

  const assetName = 'jojun_' + version + '_' + host + '.' + archive
  const assetPath = path.join(dist, assetName)

  if (archive === 'zip') {
    if (process.platform === 'win32') {
      const ps =
        "Compress-Archive -LiteralPath '" +
        stagedBin.replace(/'/g, "''") +
        "' -DestinationPath '" +
        assetPath.replace(/'/g, "''") +
        "' -Force"
      const r = spawnSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps],
        { stdio: 'inherit' }
      )
      if (r.status !== 0) process.exit(r.status || 1)
    } else {
      const r = spawnSync('zip', ['-j', assetPath, stagedBin], { stdio: 'inherit' })
      if (r.status !== 0) process.exit(r.status || 1)
    }
  } else {
    const r = spawnSync('tar', ['-czf', assetPath, '-C', stage, file], { stdio: 'inherit' })
    if (r.status !== 0) process.exit(r.status || 1)
  }

  const hash = crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex')
  checksumLines.push(hash + '  ' + assetName)
  packed.push(assetName + ' (' + fs.statSync(assetPath).size + ' bytes)')
}

fs.rmSync(path.join(dist, '_stage'), { recursive: true, force: true })

if (!packed.length) {
  console.error('No binaries in out/. Run npm run make first.')
  process.exit(1)
}

fs.writeFileSync(path.join(dist, 'checksums.txt'), checksumLines.join('\n') + '\n')
console.log('Packed into', dist)
for (const line of packed) console.log('  ' + line)
console.log('  checksums.txt')
