'use strict'

const crypto = require('bare-crypto')
const fs = require('bare-fs')

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function sha256File(filePath) {
  const data = fs.readFileSync(filePath)
  return sha256Buffer(data)
}

/**
 * @param {Buffer|string} data file bytes or path
 * @param {string} expectedHex
 */
function verifySha256(data, expectedHex) {
  const expected = String(expectedHex || '')
    .trim()
    .toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error('invalid sha256 digest')
  }
  const actual =
    typeof data === 'string' ? sha256File(data) : sha256Buffer(Buffer.isBuffer(data) ? data : Buffer.from(data))
  if (actual !== expected) {
    throw new Error('checksum mismatch: expected ' + expected + ', got ' + actual)
  }
  return actual
}

module.exports = { sha256Buffer, sha256File, verifySha256 }
