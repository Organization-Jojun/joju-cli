#!/usr/bin/env node
'use strict'

/** Ad-hoc sign the darwin binaries. Only works on macOS. */
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

if (os.platform() !== 'darwin') {
  console.log('sign-macos: skip (not darwin)')
  process.exit(0)
}

const root = path.resolve(__dirname, '..')
const bins = [
  path.join(root, 'out', 'darwin-arm64', 'jojun'),
  path.join(root, 'out', 'darwin-x64', 'jojun')
].filter((p) => fs.existsSync(p))

if (!bins.length) {
  console.error('sign-macos: no out/darwin-*/jojun — run npm run make first')
  process.exit(1)
}

for (const bin of bins) {
  const sign = spawnSync(
    '/usr/bin/codesign',
    ['--force', '--sign', '-', bin],
    { stdio: 'inherit' }
  )
  if (sign.status !== 0) process.exit(sign.status || 1)
  const verify = spawnSync('/usr/bin/codesign', ['--verify', '--verbose', bin], {
    encoding: 'utf8'
  })
  process.stdout.write(verify.stderr || '')
  process.stdout.write(verify.stdout || '')
  if (verify.status !== 0) {
    console.error('sign-macos: codesign -v failed for', bin)
    process.exit(verify.status || 1)
  }
  console.log('signed', bin)
}
