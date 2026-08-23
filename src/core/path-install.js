'use strict'

const os = require('bare-os')
const path = require('bare-path')
const env = require('bare-env')
const { isWindows } = require('which-runtime')

function normalizeDir(dir) {
  return String(dir || '')
    .replace(/[/\\]+$/, '')
    .replace(/\\/g, '/')
    .toLowerCase()
}

function pathHasDir(pathEnv, dir) {
  const n = normalizeDir(dir)
  if (!n) return false
  return String(pathEnv || '')
    .split(isWindows ? ';' : ':')
    .some((part) => normalizeDir(part) === n)
}

function alreadyOnPath(dir) {
  return pathHasDir(env.PATH || env.Path || '', dir)
}

function psQuote(value) {
  return "'" + String(value).replace(/'/g, "''") + "'"
}

function ensureWindowsUserPath(dir) {
  if (alreadyOnPath(dir)) return { added: false, reason: 'session-path' }

  let spawnSync
  try {
    spawnSync = require('bare-subprocess').spawnSync
  } catch {
    return { added: false, reason: 'no-spawn' }
  }

  const script = [
    `$dir = ${psQuote(dir)}`,
    `$user = [Environment]::GetEnvironmentVariable('Path', 'User')`,
    `if ($null -eq $user) { $user = '' }`,
    `$hit = $false`,
    `foreach ($p in ($user -split ';')) {`,
    `  if ($p.TrimEnd('\\').ToLowerInvariant() -eq $dir.TrimEnd('\\').ToLowerInvariant()) { $hit = $true }`,
    `}`,
    `if ($hit) { Write-Output 'ALREADY'; exit 0 }`,
    `$new = if ([string]::IsNullOrWhiteSpace($user)) { $dir } else { $user.TrimEnd(';') + ';' + $dir }`,
    `[Environment]::SetEnvironmentVariable('Path', $new, 'User')`,
    `Write-Output 'ADDED'`
  ].join('; ')

  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { windowsHide: true }
  )

  const out = result.stdout ? result.stdout.toString() : ''
  if (result.status !== 0) {
    return { added: false, reason: 'powershell', detail: result.stderr && result.stderr.toString() }
  }
  if (/ADDED/.test(out)) return { added: true }
  return { added: false, reason: 'already-user' }
}

/**
 * Standalone binary: put its folder on the user PATH (Windows).
 * Pear install usually does this; this covers first-run if it did not.
 * Never uses setx (it truncates PATH).
 */
function ensureOnPath() {
  if (os.platform() !== 'win32') return { added: false, reason: 'not-windows' }

  const exe = os.execPath()
  const dir = path.dirname(exe)
  const base = path.basename(exe, path.extname(exe)).toLowerCase()
  if (base === 'bare' || base === 'node') return { added: false, reason: 'dev-runtime' }

  return ensureWindowsUserPath(dir)
}

module.exports = { ensureOnPath, pathHasDir, alreadyOnPath, normalizeDir }
