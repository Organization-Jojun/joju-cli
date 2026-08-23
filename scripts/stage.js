#!/usr/bin/env node
'use strict'

const { stage, DEFAULT_LINK } = require('../src/deploy')

const path = require('path')
const fs = require('fs')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const link = args.find((a) => !a.startsWith('--')) || DEFAULT_LINK
const bundle = path.resolve(__dirname, '..', 'release-bundle')
const dir = fs.existsSync(path.join(bundle, 'by-arch')) ? bundle : process.cwd()

if (dir === process.cwd()) {
  console.error(
    'Refusing to stage the git checkout. Run npm run package-release first (needs out/win32-x64/jojun.exe at by-arch/.../app/jojun.exe).'
  )
  process.exit(1)
}

console.log(`Staging ${dir} → ${link}${dryRun ? ' (dry-run)' : ''}`)

stage(link, dir, { dryRun })
  .then(({ stdout }) => {
    if (stdout) process.stdout.write(stdout)
    console.log('Stage complete.')
  })
  .catch((err) => {
    console.error('Stage failed:', err.message)
    if (err.stderr) process.stderr.write(err.stderr)
    process.exit(err.code || 1)
  })
