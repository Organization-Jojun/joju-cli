'use strict'
const Corestore = require('corestore')
const Hyperdrive = require('hyperdrive')
const idenc = require('hypercore-id-encoding')

const KEY = idenc.decode('ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo')
const STORE = '/home/ubuntu/.config/pear/corestores/platform-next'

function getTimeout(drive, path, ms) {
  return Promise.race([
    drive.get(path).then((buf) => buf),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout ' + ms + 'ms ' + path)), ms)
    )
  ])
}

async function main() {
  const store = new Corestore(STORE)
  await store.ready()
  const drive = new Hyperdrive(store, KEY)
  await drive.ready()
  const out = { length: drive.core.length, files: {} }
  for (const p of [
    '/package.json',
    '/by-arch/win32-x64/app/jojun.exe',
    '/by-arch/darwin-arm64/app/jojun'
  ]) {
    try {
      const buf = await getTimeout(drive, p, 8000)
      out.files[p] = {
        bytes: buf ? buf.byteLength : 0,
        head: buf ? buf.subarray(0, 8).toString('hex') : null
      }
    } catch (err) {
      out.files[p] = { error: String(err.message || err) }
    }
  }
  console.log(JSON.stringify(out, null, 2))
  await drive.close()
  await store.close()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
