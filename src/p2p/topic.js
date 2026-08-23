'use strict'

/**
 * Parse a 64-char hex topic string into a 32-byte Buffer for Hyperswarm.
 */
function parseTopic(topicHex) {
  if (typeof topicHex !== 'string') {
    throw new Error('topic must be a hex string')
  }

  const hex = topicHex.replace(/^0x/i, '').toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error('topic must be 64 hex characters (32 bytes)')
  }

  return Buffer.from(hex, 'hex')
}

/**
 * Shared fixture topic for smoke tests and Agent-A dev (see src/contracts/fixtures.js).
 */
const FIXTURE_TOPIC_HEX = '68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000'

module.exports = { parseTopic, FIXTURE_TOPIC_HEX }
