'use strict'

const { spawn } = require('child_process')
const path = require('path')

const DEFAULT_LINK = require('../../package.json').upgrade

/**
 * Run `pear stage` to sync local project changes to the Pear link.
 * Cloud agents can run this once; live seeding needs a human machine.
 */
async function stage(link = DEFAULT_LINK, dir = process.cwd(), opts = {}) {
  if (!link || !link.startsWith('pear://')) {
    throw new Error('stage requires a valid pear:// link')
  }

  const args = ['stage']
  if (opts.dryRun) args.push('--dry-run')
  if (opts.json) args.push('--json')
  args.push(link, dir)

  return runPear(args, { cwd: dir })
}

/**
 * Run `pear seed` to announce the project link on the network.
 * This is a long-lived process — intended for human machines during judging.
 */
function seed(link = DEFAULT_LINK, opts = {}) {
  if (!link || !link.startsWith('pear://')) {
    throw new Error('seed requires a valid pear:// link')
  }

  const args = ['seed', link]
  if (opts.noTty) args.push('--no-tty')
  if (opts.json) args.push('--json')

  return runPear(args, { cwd: process.cwd(), inherit: true })
}

function runPear(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const pearBin = process.env.PEAR_BIN || (process.platform === 'win32' ? findWindowsPear() : 'pear')
    const child = spawn(pearBin, args, {
      cwd: opts.cwd || process.cwd(),
      stdio: opts.inherit ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        PATH: process.env.PATH || ''
      }
    })

    let stdout = ''
    let stderr = ''

    if (!opts.inherit) {
      child.stdout?.on('data', (chunk) => {
        stdout += chunk
        if (opts.onStdout) opts.onStdout(chunk)
      })
      child.stderr?.on('data', (chunk) => {
        stderr += chunk
        if (opts.onStderr) opts.onStderr(chunk)
      })
    }

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ code, stdout, stderr })
      } else {
        const err = new Error(`pear ${args[0]} exited with code ${code}`)
        err.code = code
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
      }
    })
  })
}

function findWindowsPear() {
  const fs = require('fs')
  const os = require('os')
  const candidates = [
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'pear', 'pear.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'pear', 'pear.cmd')
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return 'pear'
}

module.exports = { stage, seed, runPear, DEFAULT_LINK }
