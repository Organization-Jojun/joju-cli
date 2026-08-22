'use strict'

/** 32-byte Hyperswarm topic as 64-char hex (deterministic test fixture). */
const TOPIC_HEX =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

/** UTF-8 payload used in contract/command smoke tests. */
const PAYLOAD_UTF8 = 'paste me across the swarm'

/** Mock swarm event name when a peer connects. */
const EVENT_PEER_CONNECTED = 'peer-connected'

module.exports = {
  TOPIC_HEX,
  PAYLOAD_UTF8,
  EVENT_PEER_CONNECTED
}
