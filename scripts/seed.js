#!/usr/bin/env node
'use strict'

const { seed, DEFAULT_LINK } = require('../src/deploy')

const link = process.argv[2] || DEFAULT_LINK

console.log(`Seeding ${link}`)
console.log('Keep this process running during judging. Ctrl+C to stop.')

seed(link, { noTty: !process.stdout.isTTY })
  .then(() => {
    console.log('Seed exited.')
  })
  .catch((err) => {
    console.error('Seed failed:', err.message)
    if (err.stderr) process.stderr.write(err.stderr)
    process.exit(err.code || 1)
  })
