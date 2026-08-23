#!/usr/bin/env node
'use strict'

const { stage, DEFAULT_LINK } = require('../src/deploy')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const link = args.find((a) => !a.startsWith('--')) || DEFAULT_LINK

console.log(`Staging ${process.cwd()} → ${link}${dryRun ? ' (dry-run)' : ''}`)

stage(link, process.cwd(), { dryRun })
  .then(({ stdout }) => {
    if (stdout) process.stdout.write(stdout)
    console.log('Stage complete.')
  })
  .catch((err) => {
    console.error('Stage failed:', err.message)
    if (err.stderr) process.stderr.write(err.stderr)
    process.exit(err.code || 1)
  })
