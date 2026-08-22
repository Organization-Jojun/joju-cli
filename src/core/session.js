'use strict'

const fs = require('bare-fs')
const path = require('bare-path')

let storageDir = null

function setStorageDir(dir) {
  storageDir = dir
}

function requireStorageDir() {
  if (!storageDir) throw new Error('internal error: storage directory not configured')
  return storageDir
}

function sessionPath() {
  return path.join(requireStorageDir(), 'session.json')
}

function blobPath() {
  return path.join(requireStorageDir(), 'last.blob')
}

function ensureDir() {
  fs.mkdirSync(requireStorageDir(), { recursive: true })
}

function saveJoin(topic) {
  ensureDir()
  fs.writeFileSync(sessionPath(), JSON.stringify({ topic }))
}

function loadTopic() {
  try {
    const raw = fs.readFileSync(sessionPath(), 'utf8')
    const data = JSON.parse(raw)
    return data.topic || null
  } catch {
    return null
  }
}

function saveBlob(bytes) {
  ensureDir()
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, 'utf8')
  fs.writeFileSync(blobPath(), buf)
}

function loadBlob() {
  try {
    return fs.readFileSync(blobPath())
  } catch {
    return null
  }
}

function clear() {
  try {
    fs.unlinkSync(sessionPath())
  } catch {}
  try {
    fs.unlinkSync(blobPath())
  } catch {}
}

module.exports = {
  setStorageDir,
  saveJoin,
  loadTopic,
  saveBlob,
  loadBlob,
  clear
}
