'use strict'

const fs = require('bare-fs')
const path = require('bare-path')

const DEFAULTS = { lang: 'en', timeoutMs: 30_000, mock: null, roomName: '', autoReceive: true }

function prefsPath(storageDir) {
  return path.join(storageDir, 'ui.json')
}

function loadPrefs(storageDir) {
  try {
    const data = JSON.parse(fs.readFileSync(prefsPath(storageDir), 'utf8'))
    return { ...DEFAULTS, ...data }
  } catch {
    return { ...DEFAULTS }
  }
}

function savePrefs(storageDir, prefs) {
  fs.mkdirSync(storageDir, { recursive: true })
  fs.writeFileSync(prefsPath(storageDir), JSON.stringify({ ...DEFAULTS, ...prefs }))
}

module.exports = { loadPrefs, savePrefs, DEFAULTS }
