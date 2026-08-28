'use strict'

const fs = require('bare-fs')
const os = require('bare-os')
const path = require('bare-path')
const env = require('bare-env')
const { isWindows } = require('which-runtime')

const swarm = require('../contracts')
const session = require('../core/session')
const { emit } = require('../core/output')
const { resolveStorage } = require('../core/updater')
const { normalizeDir, pathHasDir, removeWindowsUserPath, removeUnixShellRcPath, readUnixShellRc, unixRcHasPathExport } = require('../core/path-install')
const { isInteractive, readLine, write } = require('../core/readline')
const { t } = require('../cli/i18n')

const EXE_NAME = isWindows ? 'jojun.exe' : 'jojun'
const YES = new Set(['y', 'yes', 's', 'si', 'sí'])

function statOrNull(target) {
  try {
    return fs.statSync(target)
  } catch {
    return null
  }
}

function exists(target) {
  return statOrNull(target) !== null
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir)
  } catch {
    return []
  }
}

function isDevRuntime() {
  const exe = os.execPath()
  const base = path.basename(exe, path.extname(exe)).toLowerCase()
  return base === 'bare' || base === 'node'
}

/**
 * Locations the install path documents:
 * - Windows: %LOCALAPPDATA%\Programs\Jojun
 * - macOS/Linux: ~/.local/bin (install.sh / GitHub Releases)
 */
function documentedBinaryDir() {
  if (isWindows) {
    const local = env.LOCALAPPDATA
    if (!local) return null
    return path.join(local, 'Programs', 'Jojun')
  }
  const home = os.homedir()
  if (!home) return null
  return path.join(home, '.local', 'bin')
}

function pathDirs() {
  const raw = env.PATH || env.Path || ''
  return String(raw)
    .split(isWindows ? ';' : ':')
    .filter(Boolean)
}

function classify(file, documentedDir) {
  if (!documentedDir) return 'unknown'
  return normalizeDir(path.dirname(file)) === normalizeDir(documentedDir)
    ? 'jojun-placed'
    : 'unknown'
}

function findBinaries(documentedDir) {
  const found = []
  const seen = new Set()
  const running = isDevRuntime() ? null : os.execPath()

  const consider = (file) => {
    if (!file || !exists(file)) return
    const key = normalizeDir(file)
    if (seen.has(key)) return
    seen.add(key)
    found.push({
      path: file,
      provenance: classify(file, documentedDir),
      running: running !== null && normalizeDir(running) === key
    })
  }

  if (documentedDir) consider(path.join(documentedDir, EXE_NAME))
  consider(running)
  for (const dir of pathDirs()) consider(path.join(dir, EXE_NAME))

  return found
}

function pathEntryCandidates(documentedDir) {
  const dirs = []
  const add = (dir) => {
    if (!dir) return
    if (dirs.some((existing) => normalizeDir(existing) === normalizeDir(dir))) return
    dirs.push(dir)
  }

  add(documentedDir)
  if (!isDevRuntime()) add(path.dirname(os.execPath()))

  if (isWindows) {
    const current = env.PATH || env.Path || ''
    return dirs.map((dir) => ({
      dir,
      present: pathHasDir(current, dir),
      kind: 'path-entry'
    }))
  }

  // Unix: only reverse the exact shell-rc line Jojun may have appended.
  const { content, configFile, isFish } = readUnixShellRc()
  return dirs.map((dir) => ({
    dir,
    present: unixRcHasPathExport(content, dir, isFish),
    kind: 'shell-rc',
    configFile
  }))
}

/**
 * Facts only — this function never mutates anything.
 */
function discover({ flags = {}, appName = 'Jojun', isDev = false } = {}) {
  const storagePath = resolveStorage(flags, appName, isDev)
  const storageExists = exists(storagePath)
  const documentedDir = documentedBinaryDir()
  const binaries = findBinaries(documentedDir)

  return {
    storage: {
      path: storagePath,
      exists: storageExists,
      entries: storageExists ? listDir(storagePath) : []
    },
    pathEntries: pathEntryCandidates(documentedDir),
    binaries,
    pear: {
      detected: false
    }
  }
}

function hasFootprint(facts) {
  return (
    facts.storage.exists ||
    facts.pathEntries.some((entry) => entry.present) ||
    facts.binaries.length > 0
  )
}

function planBinary(binary, opts) {
  let action
  let reason

  if (binary.provenance === 'jojun-placed') {
    action = 'remove'
    reason = 'installed-location'
  } else if (opts.removeBinaries) {
    action = 'remove'
    reason = 'opted-in'
  } else {
    action = 'needs-opt-in'
    reason = 'not-placed-by-jojun'
  }

  // Windows locks a running executable; report it instead of failing the run.
  if (action === 'remove' && binary.running && isWindows) {
    action = 'manual'
    reason = 'running-executable-locked'
  }

  return {
    id: 'binary',
    kind: 'file',
    path: binary.path,
    provenance: binary.provenance,
    running: binary.running,
    action,
    reason
  }
}

/**
 * Pure function of discover()'s output. Everything destructive downstream reads
 * this plan and never re-derives a target, so what the user is shown and what
 * gets removed cannot drift apart.
 */
function plan(facts, opts = {}) {
  const targets = []

  targets.push({
    id: 'storage',
    kind: 'directory',
    path: facts.storage.path,
    entries: facts.storage.entries,
    action: facts.storage.exists ? 'remove' : 'skip',
    reason: facts.storage.exists ? 'created-by-jojun' : 'absent'
  })

  for (const entry of facts.pathEntries) {
    const kind = entry.kind || 'path-entry'
    targets.push({
      id: kind === 'shell-rc' ? 'shell-rc' : 'path-entry',
      kind,
      path: kind === 'shell-rc' ? entry.configFile || entry.dir : entry.dir,
      dir: entry.dir,
      action: entry.present ? 'remove' : 'skip',
      reason: entry.present ? 'added-by-jojun' : 'absent'
    })
  }

  for (const binary of facts.binaries) targets.push(planBinary(binary, opts))

  return { targets }
}

function removeTree(target) {
  fs.rmSync(target, { recursive: true, force: true })
}

function removePathEntry(target) {
  if (target.kind === 'shell-rc') {
    const result = removeUnixShellRcPath(target.dir)
    if (result.removed) return { outcome: 'removed', reason: target.reason }
    if (result.reason === 'not-present') return { outcome: 'skipped', reason: 'absent' }
    const detail = result.detail ? `${result.reason}: ${result.detail}` : result.reason
    throw new Error(detail)
  }

  const result = removeWindowsUserPath(target.path)
  if (result.removed) return { outcome: 'removed', reason: target.reason }
  if (result.reason === 'not-present') return { outcome: 'skipped', reason: 'absent' }

  const detail = result.detail ? `${result.reason}: ${result.detail}` : result.reason
  throw new Error(detail)
}

/**
 * Acts only on entries the plan tagged `remove`, in plan order: storage, then
 * the PATH entry, then any opted-in binary. One failure never abandons the rest.
 */
async function execute(planned) {
  const outcomes = []
  let failed = false

  if (planned.targets.some((target) => target.id === 'storage' && target.action === 'remove')) {
    try {
      await swarm.leave()
    } catch {
      // nothing joined, or already torn down
    }
    session.clear()
  }

  for (const target of planned.targets) {
    if (target.action !== 'remove') {
      const outcome =
        target.action === 'manual'
          ? 'manual'
          : target.action === 'notice'
            ? 'notice'
            : target.action === 'needs-opt-in'
              ? 'needs-opt-in'
              : 'skipped'
      outcomes.push({ ...target, outcome })
      continue
    }

    try {
      if (target.kind === 'path-entry' || target.kind === 'shell-rc') {
        outcomes.push({ ...target, ...removePathEntry(target) })
        continue
      }
      if (target.kind === 'directory') removeTree(target.path)
      else fs.unlinkSync(target.path)
      outcomes.push({ ...target, outcome: 'removed' })
    } catch (err) {
      failed = true
      outcomes.push({ ...target, outcome: 'failed', error: err.message })
    }
  }

  return { outcomes, failed }
}

function describe(target) {
  if (target.kind === 'shell-rc') {
    return `${t('uninstallShellRc')} ${target.path} (${target.dir})`
  }
  if (target.kind === 'path-entry') return `${t('uninstallPathEntry')} ${target.path}`
  if (target.kind === 'directory') {
    const entries = target.entries && target.entries.length ? ` (${target.entries.join(', ')})` : ''
    return `${t('uninstallStorage')} ${target.path}${entries}`
  }
  return `${t('uninstallBinary')} ${target.path}`
}

function renderPlan(planned) {
  const lines = [t('uninstallHeader'), '']

  for (const target of planned.targets) {
    if (target.action === 'skip') continue
    const mark =
      target.action === 'remove'
        ? t('uninstallMarkRemove')
        : target.action === 'needs-opt-in'
          ? t('uninstallMarkOptIn')
          : target.action === 'manual'
            ? t('uninstallMarkManual')
            : t('uninstallMarkNotice')
    lines.push(`  ${mark} ${describe(target)}`)
  }

  if (planned.targets.some((target) => target.action === 'needs-opt-in')) {
    lines.push('', t('uninstallOptInHint'))
  }
  if (planned.targets.some((target) => target.action === 'manual')) {
    lines.push('', t('uninstallManualHint'))
  }

  return lines.join('\n')
}

const OUTCOME_KEYS = {
  removed: 'uninstallOutcomeRemoved',
  skipped: 'uninstallOutcomeSkipped',
  failed: 'uninstallOutcomeFailed',
  manual: 'uninstallOutcomeManual',
  notice: 'uninstallOutcomeNotice',
  'needs-opt-in': 'uninstallOutcomeOptIn'
}

function renderOutcomes(outcomes) {
  const lines = []
  for (const target of outcomes) {
    if (target.outcome === 'skipped') continue
    const label = t(OUTCOME_KEYS[target.outcome])
    const detail = target.error ? ` — ${target.error}` : ''
    lines.push(`  ${label} ${describe(target)}${detail}`)
  }
  return lines.join('\n')
}

async function confirm(opts) {
  if (opts.yes) return true

  if (!isInteractive()) {
    emit(
      opts.json,
      { ok: false, action: 'uninstall', error: 'confirmation-required' },
      t('uninstallNeedsYes')
    )
    return null
  }

  write(t('uninstallConfirm'))
  const answer = (await readLine()).trim().toLowerCase()
  return YES.has(answer)
}

async function runUninstall(opts = {}) {
  const facts = discover(opts)
  const planned = plan(facts, { removeBinaries: !!opts.removeBinaries })

  if (!hasFootprint(facts)) {
    emit(
      opts.json,
      { ok: true, action: 'uninstall', found: false, changed: false, targets: [] },
      t('uninstallNothing')
    )
    return { ok: true, changed: false, exitCode: 0 }
  }

  if (!opts.json) console.log(renderPlan(planned))

  // Dry run wins over --yes: it must never change anything.
  if (opts.dryRun) {
    emit(
      opts.json,
      { ok: true, action: 'uninstall', dryRun: true, changed: false, targets: planned.targets },
      t('uninstallDryRun')
    )
    return { ok: true, changed: false, exitCode: 0 }
  }

  if (!planned.targets.some((target) => target.action === 'remove')) {
    emit(
      opts.json,
      { ok: true, action: 'uninstall', changed: false, targets: planned.targets },
      t('uninstallNothingToRemove')
    )
    return { ok: true, changed: false, exitCode: 0 }
  }

  const confirmed = await confirm(opts)
  if (confirmed === null) return { ok: false, changed: false, exitCode: 1 }
  if (!confirmed) {
    emit(
      opts.json,
      { ok: true, action: 'uninstall', confirmed: false, changed: false, targets: planned.targets },
      t('uninstallAborted')
    )
    return { ok: true, changed: false, exitCode: 0 }
  }

  const { outcomes, failed } = await execute(planned)
  emit(
    opts.json,
    { ok: !failed, action: 'uninstall', changed: true, targets: outcomes },
    renderOutcomes(outcomes)
  )

  return { ok: !failed, changed: true, exitCode: failed ? 1 : 0 }
}

module.exports = {
  runUninstall,
  discover,
  plan,
  execute,
  hasFootprint,
  renderPlan,
  renderOutcomes
}
