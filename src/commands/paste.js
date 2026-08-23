'use strict'

const swarm = require('../contracts')
const session = require('../core/session')
const { readStdin } = require('../core/stdin')

async function ensureJoined() {
  const topic = session.loadTopic()
  if (!topic) throw new Error('not joined to a topic; run join first')
  const status = swarm.getStatus()
  if (!status.joined || status.topic !== topic) await swarm.join(topic)
  return topic
}

async function runPaste() {
  await ensureJoined()
  const bytes = await readStdin()
  const sent = swarm.send(bytes)
  session.saveBlob(bytes)
  console.log(`pasted ${sent} bytes`)
}

module.exports = { runPaste, ensureJoined }
