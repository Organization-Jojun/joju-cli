'use strict'

/**
 * Dedicated Hyperswarm *server* for the Jojun drive.
 * pear install joins discoveryKey with { server: false, client: true }
 * so a seeder that never announces as server is invisible — Network Timeout.
 */
const Corestore = require('corestore')
const Hyperdrive = require('hyperdrive')
const Hyperswarm = require('hyperswarm')
const DHT = require('hyperdht')
const idenc = require('hypercore-id-encoding')

const LINK =
  process.env.JOJUN_LINK || 'pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo'
const key = idenc.decode(LINK.replace(/^pear:\/\//, ''))
const storePath =
  process.env.JOJUN_STORE || '/home/ubuntu/.config/pear/corestores/platform-next'

async function main() {
  const store = new Corestore(storePath)
  await store.ready()
  const drive = new Hyperdrive(store, key)
  await drive.ready()
  console.log(
    JSON.stringify({
      event: 'drive',
      length: drive.core.length,
      writable: drive.core.writable,
      discovery: idenc.normalize(drive.discoveryKey)
    })
  )

  const dht = new DHT({
    port: Number(process.env.JOJUN_DHT_PORT || 49737),
    ephemeral: false,
    firewalled: false
  })
  await dht.ready()
  const swarm = new Hyperswarm({ dht })
  swarm.on('connection', (conn, info) => {
    console.log(
      JSON.stringify({
        event: 'peer',
        who: idenc.normalize(info.publicKey)
      })
    )
    store.replicate(conn)
  })

  // Pear sidecar logs the project key; pear-runtime joins core.discoveryKey.
  // Announce on both so installers and the Windows writer can find this node.
  const topics = [drive.discoveryKey, drive.core.discoveryKey, key]
  const seen = new Set()
  for (const t of topics) {
    const hex = Buffer.from(t).toString('hex')
    if (seen.has(hex)) continue
    seen.add(hex)
    await swarm.join(t, { server: true, client: true }).flushed()
  }
  const addr = dht.address()
  console.log(
    JSON.stringify({
      event: 'announced',
      host: addr.host,
      port: addr.port,
      firewalled: dht.firewalled,
      dht: idenc.normalize(dht.defaultKeyPair.publicKey),
      topics: [...seen]
    })
  )

  const needed = [
    '/package.json',
    '/by-arch/win32-x64/app/jojun.exe',
    '/by-arch/darwin-arm64/app/jojun'
  ]

  let haveBlobs = false
  let prefetching = false

  async function prefetch() {
    if (haveBlobs || prefetching) return
    prefetching = true
    let ok = true
    try {
      for (const p of needed) {
        const t0 = Date.now()
        try {
          const buf = await Promise.race([
            drive.get(p),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('prefetch-timeout')), 120000)
            )
          ])
          const bytes = buf ? buf.byteLength : 0
          if (!bytes) ok = false
          console.log(JSON.stringify({ event: 'prefetch', path: p, bytes, ms: Date.now() - t0 }))
        } catch (err) {
          ok = false
          console.log(JSON.stringify({ event: 'prefetch-error', path: p, err: String(err) }))
        }
      }
      if (ok) {
        haveBlobs = true
        console.log(JSON.stringify({ event: 'prefetch-ready', length: drive.core.length }))
      }
    } finally {
      prefetching = false
    }
  }

  swarm.on('connection', () => {
    prefetch().catch((err) => console.error(err))
  })

  setInterval(() => {
    const prev = drive.core.length
    drive.core
      .update({ wait: true })
      .then(() => {
        if (drive.core.length !== prev) {
          haveBlobs = false
          console.log(JSON.stringify({ event: 'updated', length: drive.core.length }))
          prefetch().catch((err) => console.error(err))
        }
      })
      .catch((err) => console.error(JSON.stringify({ event: 'update-error', err: String(err) })))
  }, 15000)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
