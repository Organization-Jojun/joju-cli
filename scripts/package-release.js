#!/usr/bin/env node
'use strict'

/**
 * Layout pear-install actually reads (holepunchto/pear-install):
 *
 *   /package.json
 *   /by-arch/<platform>-<arch>/app/<name>[.exe]
 *
 * <name> comes from package.json "name" when "bin" is a string.
 * Windows required file: jojun.exe  (NOT Jojun/jojun.exe)
 *
 * `pear build --win32-x64-app <folder named Jojun>` nests the exe one
 * directory too deep. Do not use that for this Bare CLI.
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

const root = path.resolve(__dirname, '..')
const pkg = require(path.join(root, 'package.json'))
const dest = path.join(root, 'release-bundle')
const binName = pkg.name
const hosts = [
  { host: 'win32-x64', file: 'jojun.exe', staged: binName + '.exe' },
  { host: 'win32-arm64', file: 'jojun.exe', staged: binName + '.exe' },
  { host: 'darwin-arm64', file: 'jojun', staged: binName },
  { host: 'darwin-x64', file: 'jojun', staged: binName },
  { host: 'linux-x64', file: 'jojun', staged: binName },
  { host: 'linux-arm64', file: 'jojun', staged: binName }
]

fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })
fs.copyFileSync(path.join(root, 'package.json'), path.join(dest, 'package.json'))

const { wrapDarwinBin } = require('./darwin-wrap')

const copied = []
for (const { host, file, staged } of hosts) {
  const src = path.join(root, 'out', host, file)
  if (!fs.existsSync(src)) continue
  const dir = path.join(dest, 'by-arch', host, 'app')
  fs.mkdirSync(dir, { recursive: true })
  const outFile = path.join(dir, staged)
  if (host.startsWith('darwin-')) {
    const wrapped = wrapDarwinBin(fs.readFileSync(src))
    fs.writeFileSync(outFile, wrapped.buf)
    copied.push(
      `${host}/app/${staged} (launcher+macho ${wrapped.buf.length} bytes, codesign on first run)`
    )
  } else {
    fs.copyFileSync(src, outFile)
    copied.push(`${host}/app/${staged} (${fs.statSync(src).size} bytes)`)
  }
}

if (!copied.some((line) => line.startsWith(os.platform() + '-'))) {
  console.error(
    `No binary for this host (${os.platform()}-${os.arch()}). Run npm run make first.`
  )
  process.exit(1)
}

if (!copied.some((line) => line.startsWith('win32-x64/'))) {
  console.error('Windows x64 exe missing: run npm run make on Windows, then this script.')
  process.exit(1)
}

console.log('Release bundle:', dest)
for (const line of copied) console.log('  ' + line)
console.log('')
console.log('Next:')
console.log('  pear stage --dry-run ' + pkg.upgrade + ' ' + dest)
console.log('  pear stage ' + pkg.upgrade + ' ' + dest)
