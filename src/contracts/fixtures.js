'use strict'

const { TOPIC_HEX, PAYLOAD_UTF8 } = require('../p2p/fixtures')

/** Mock swarm event name when a peer connects. */
const EVENT_PEER_CONNECTED = 'peer-connected'

module.exports = {
  TOPIC_HEX,
  PAYLOAD_UTF8,
  EVENT_PEER_CONNECTED
}
