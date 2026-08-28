'use strict'

const crypto = require('bare-crypto')
const { FIXTURE_TOPIC_HEX } = require('../p2p/topic')

function isHexTopic(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value.trim())
}

/**
 * Turn a human room name into a 32-byte Hyperswarm topic (64 hex chars).
 * Same trimmed name → same topic. Empty names are rejected (no public default).
 * A 64-char hex string is accepted as-is for advanced / script use.
 */
function nameToTopic(input) {
  const raw = String(input || '').trim()
  if (!raw) throw new Error('room name required')
  if (isHexTopic(raw)) return raw.toLowerCase()
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex')
}

function topicToName(topicHex, savedName) {
  if (savedName) return savedName
  if (!topicHex) return null
  return topicHex.slice(0, 8) + '…'
}

module.exports = { nameToTopic, topicToName, isHexTopic, FIXTURE_TOPIC_HEX }
