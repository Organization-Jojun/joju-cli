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

function unixExportLine(dir, isFish) {
  return isFish ? '\nfish_add_path ' + dir : '\nexport PATH="$PATH:' + dir + '"'
}

function unixShellConfig(shellPath) {
  const shell = path.basename(String(shellPath || ''))
  const candidates = {
    zsh: '.zshrc',
    bash: '.bash_profile',
    fish: '.config/fish/config.fish',
    ksh: '.kshrc',
    sh: '.profile'
  }
  return {
    isFish: shell === 'fish',
    rel: candidates[shell] || '.profile'
  }
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

function ensureUnixUserPath(dir) {
  if (alreadyOnPath(dir)) return { added: false, reason: 'session-path' }

  let fs
  try {
    fs = require('bare-fs')
  } catch {
    return { added: false, reason: 'no-fs' }
  }

  const home = os.homedir()
  const { isFish, rel } = unixShellConfig(env.SHELL)
  const configFile = path.join(home, rel)
  const exportLine = unixExportLine(dir, isFish)
  const marker = exportLine.trim()

  let content = ''
  try {
    content = fs.readFileSync(configFile, 'utf8')
  } catch {
    content = ''
  }
  if (content.includes(marker)) return { added: false, reason: 'already-rc' }

  try {
    fs.mkdirSync(path.dirname(configFile), { recursive: true })
    fs.appendFileSync(configFile, exportLine.endsWith('\n') ? exportLine : exportLine + '\n')
  } catch (err) {
    return { added: false, reason: 'write', detail: String(err && err.message) }
  }
  return { added: true }
}

/**
 * Standalone binary: put its folder on the user PATH.
 * Windows: user PATH via PowerShell (never setx).
 * macOS/Linux: append to zshrc / bash_profile / fish when ~/.local/bin is missing.
 * install.sh places jojun in ~/.local/bin; if that dir is already on PATH, this is a no-op.
 */
function ensureOnPath() {
  const exe = os.execPath()
  const dir = path.dirname(exe)
  const base = path.basename(exe, path.extname(exe)).toLowerCase()
  if (base === 'bare' || base === 'node') return { added: false, reason: 'dev-runtime' }

  const platform = os.platform()
  if (platform === 'win32') return ensureWindowsUserPath(dir)
  if (platform === 'darwin' || platform === 'linux') return ensureUnixUserPath(dir)
  return { added: false, reason: 'unsupported' }
}

function readWindowsUserPath(spawnSync) {
  const script = [
    `$user = [Environment]::GetEnvironmentVariable('Path', 'User')`,
    `if ($null -eq $user) { $user = '' }`,
    `[Console]::Out.Write($user)`
  ].join('; ')

  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { windowsHide: true }
  )

  if (result.status !== 0) return null
  return result.stdout ? result.stdout.toString() : ''
}

function writeWindowsUserPath(spawnSync, value) {
  const script = [
    `[Environment]::SetEnvironmentVariable('Path', ${psQuote(value)}, 'User')`,
    `Write-Output 'WRITTEN'`
  ].join('; ')

  return spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { windowsHide: true }
  )
}

/**
 * Pure counterpart to the append in ensureWindowsUserPath: drop every entry that
 * names `dir`, keep everything else byte-identical and in order. Returns the
 * input untouched when nothing matches, so a no-op never rewrites the user PATH.
 */
function removeFromPathValue(pathValue, dir) {
  const value = pathValue === null || pathValue === undefined ? '' : String(pathValue)
  const target = normalizeDir(dir)
  if (!target) return { value, removed: false }

  const separator = isWindows ? ';' : ':'
  const parts = value.split(separator)
  const kept = parts.filter((part) => normalizeDir(part) !== target)

  if (kept.length === parts.length) return { value, removed: false }
  return { value: kept.join(separator), removed: true }
}

/**
 * Remove Jojun's own entry from the user PATH (Windows).
 * Reads the stored value, applies removeFromPathValue, writes it back through
 * SetEnvironmentVariable. Never uses setx (it truncates PATH).
 */
function removeWindowsUserPath(dir) {
  if (os.platform() !== 'win32') return { removed: false, reason: 'not-windows' }

  let spawnSync
  try {
    spawnSync = require('bare-subprocess').spawnSync
  } catch {
    return { removed: false, reason: 'no-spawn' }
  }

  const current = readWindowsUserPath(spawnSync)
  if (current === null) return { removed: false, reason: 'powershell' }

  const next = removeFromPathValue(current, dir)
  if (!next.removed) return { removed: false, reason: 'not-present' }

  const result = writeWindowsUserPath(spawnSync, next.value)
  if (result.status !== 0) {
    return {
      removed: false,
      reason: 'powershell',
      detail: result.stderr && result.stderr.toString()
    }
  }

  return { removed: true }
}

/**
 * Pure: drop every line whose trimmed text equals the export Jojun would write
 * for `dir`. Leaves unrelated PATH customizations alone.
 */
function stripUnixPathExport(content, dir, isFish) {
  const marker = unixExportLine(dir, isFish).trim()
  if (!marker) return { content: String(content || ''), removed: false }

  const raw = String(content || '')
  const endsWithNewline = raw.endsWith('\n')
  const lines = raw.split(/\r?\n/)
  // trailing empty from final newline is not a real line to keep counting
  const hadTrailingEmpty = endsWithNewline && lines.length > 0 && lines[lines.length - 1] === ''
  const body = hadTrailingEmpty ? lines.slice(0, -1) : lines
  const kept = body.filter((line) => line.trim() !== marker)

  if (kept.length === body.length) return { content: raw, removed: false }

  let next = kept.join('\n')
  if (endsWithNewline || next.length > 0) next = next.endsWith('\n') ? next : next + '\n'
  return { content: next, removed: true }
}

function unixRcHasPathExport(content, dir, isFish) {
  const marker = unixExportLine(dir, isFish).trim()
  if (!marker) return false
  return String(content || '')
    .split(/\r?\n/)
    .some((line) => line.trim() === marker)
}

/**
 * Remove the exact PATH export line Jojun appended to the user's shell rc.
 * Only touches lines matching unixExportLine(dir); never deletes other PATH edits.
 */
function removeUnixShellRcPath(dir, opts = {}) {
  let fs
  try {
    fs = require('bare-fs')
  } catch {
    return { removed: false, reason: 'no-fs' }
  }

  const home = opts.home || os.homedir()
  if (!home) return { removed: false, reason: 'no-home' }

  const { isFish, rel } = unixShellConfig(opts.shellPath || env.SHELL)
  const configFile = opts.configFile || path.join(home, rel)

  let content = ''
  try {
    content = fs.readFileSync(configFile, 'utf8')
  } catch {
    return { removed: false, reason: 'not-present', configFile }
  }

  const next = stripUnixPathExport(content, dir, isFish)
  if (!next.removed) return { removed: false, reason: 'not-present', configFile }

  try {
    fs.writeFileSync(configFile, next.content)
  } catch (err) {
    return { removed: false, reason: 'write', detail: String(err && err.message), configFile }
  }

  return { removed: true, configFile }
}

function readUnixShellRc(opts = {}) {
  let fs
  try {
    fs = require('bare-fs')
  } catch {
    return { content: '', configFile: null, isFish: false }
  }

  const home = opts.home || os.homedir()
  const { isFish, rel } = unixShellConfig(opts.shellPath || env.SHELL)
  const configFile = opts.configFile || (home ? path.join(home, rel) : null)
  if (!configFile) return { content: '', configFile: null, isFish }

  try {
    return { content: fs.readFileSync(configFile, 'utf8'), configFile, isFish }
  } catch {
    return { content: '', configFile, isFish }
  }
}

module.exports = {
  ensureOnPath,
  pathHasDir,
  alreadyOnPath,
  normalizeDir,
  removeFromPathValue,
  removeWindowsUserPath,
  removeUnixShellRcPath,
  stripUnixPathExport,
  unixRcHasPathExport,
  readUnixShellRc,
  unixExportLine,
  unixShellConfig
}
