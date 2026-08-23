'use strict'

const { FIXTURE_TOPIC_HEX } = require('../p2p/topic')

const TEST_NAMES = new Set([
  '',
  'test',
  'test room',
  'test-room',
  'sala de prueba',
  'sala',
  'demo',
  'hello-jojun',
  'hello jojun'
])

function isHexTopic(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{64}$/.test(value.trim())
}

function nameToTopic(input) {
  const raw = String(input || '').trim()
  if (TEST_NAMES.has(raw.toLowerCase()) || raw === '') return FIXTURE_TOPIC_HEX
  if (isHexTopic(raw)) return raw.toLowerCase()

  const buf = Buffer.alloc(32)
  const src = Buffer.from(raw, 'utf8')
  src.copy(buf, 0, 0, Math.min(32, src.length))
  return buf.toString('hex')
}

function topicToName(topicHex, savedName) {
  if (savedName) return savedName
  if (!topicHex) return null
  if (topicHex === FIXTURE_TOPIC_HEX) return 'test room'
  const buf = Buffer.from(topicHex, 'hex')
  const text = buf.toString('utf8').replace(/\0/g, '')
  if (text && /^[\x20-\x7e]+$/.test(text)) return text
  return topicHex.slice(0, 8) + '…'
}

module.exports = { nameToTopic, topicToName, isHexTopic, FIXTURE_TOPIC_HEX, TEST_NAMES }
