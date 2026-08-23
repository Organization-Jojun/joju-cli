'use strict'

const swarm = require('../contracts')
const session = require('./session')

async function ensureJoined() {
  const topic = session.loadTopic()
  if (!topic) throw new Error('not joined to a topic; run join first')
  const status = swarm.getStatus()
  if (!status.joined || status.topic !== topic) await swarm.join(topic)
  return topic
}

module.exports = { ensureJoined }
