'use strict'

const swarm = require('../contracts')
const session = require('../core/session')
const { readStdin } = require('../core/stdin')
const { emit } = require('../core/output')
const { ensureJoined } = require('../core/ensure-joined')
const { runWait } = require('./wait')

async function runPaste(opts = {}) {
  await ensureJoined()
  const bytes = await readStdin()
  const timeout = opts.timeout || 30_000
  await runWait(timeout, { json: false, silent: true })
  const sent = swarm.send(bytes)
  session.saveBlob(bytes)
  const human = sent.delivered
    ? `pasted ${sent.length} bytes`
    : `pasted ${sent.length} bytes (no peer yet — saved locally)`
  emit(
    opts.json,
    { ok: true, action: 'paste', bytes: sent.length, delivered: sent.delivered },
    human
  )
}

module.exports = { runPaste }
