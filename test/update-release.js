'use strict'

const { test } = require('brittle')
const fs = require('bare-fs')
const path = require('bare-path')
const os = require('bare-os')
const http = require('bare-http1')
const { spawnSync } = require('bare-subprocess')
const {
  assetFileName,
  archiveExt,
  binaryName,
  hostKey,
  normalizeArch,
  parseChecksums,
  pickAsset
} = require('../src/update/assets')
const { sha256Buffer, sha256File, verifySha256 } = require('../src/update/checksum')
const { documentedBinaryDir, documentedBinaryPath, resolveInstallPath } = require('../src/update/install-target')
const { replaceBinary } = require('../src/update/replace-binary')
const { applyUpdate, checkForUpdate, compareSemver } = require('../src/update/github')
const { getBuffer } = require('../src/update/http')
const uninstall = require('../src/commands/uninstall')

const FIX = path.join(__dirname, 'fixtures', 'update')

test('assets: host and archive naming', (t) => {
  t.is(hostKey('win32', 'x64'), 'win32-x64')
  t.is(hostKey('windows', 'amd64'), 'win32-x64')
  t.is(hostKey('darwin', 'aarch64'), 'darwin-arm64')
  t.is(normalizeArch('x86_64'), 'x64')
  t.is(archiveExt('win32'), 'zip')
  t.is(archiveExt('darwin'), 'tar.gz')
  t.is(binaryName('win32'), 'jojun.exe')
  t.is(binaryName('linux'), 'jojun')
  t.is(assetFileName('0.1.0', 'win32', 'x64'), 'jojun_0.1.0_win32-x64.zip')
  t.is(assetFileName('v0.1.0', 'darwin', 'arm64'), 'jojun_0.1.0_darwin-arm64.tar.gz')
})

test('assets: parseChecksums and pickAsset', (t) => {
  const map = parseChecksums(
    '# comment\n' +
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa  jojun_0.1.0_win32-x64.zip\n' +
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb *jojun_0.1.0_linux-x64.tar.gz\n'
  )
  t.is(map.get('jojun_0.1.0_win32-x64.zip'), 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  t.is(map.get('jojun_0.1.0_linux-x64.tar.gz'), 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb')

  const asset = pickAsset(
    [{ name: 'jojun_0.1.0_win32-x64.zip', browser_download_url: 'http://x' }],
    '0.1.0',
    'win32',
    'x64'
  )
  t.is(asset.name, 'jojun_0.1.0_win32-x64.zip')
  t.is(pickAsset([], '0.1.0', 'win32', 'x64'), null)
})

test('checksum: sha256 of real fixture; corrupt byte fails', (t) => {
  const file = path.join(FIX, 'payload-v2.txt')
  const hex = sha256File(file)
  t.is(hex.length, 64)
  t.is(hex, sha256Buffer(fs.readFileSync(file)))
  verifySha256(file, hex)

  const buf = Buffer.from(fs.readFileSync(file))
  buf[0] = buf[0] ^ 0xff
  let threw = false
  try {
    verifySha256(buf, hex)
  } catch (err) {
    threw = /checksum mismatch/.test(err.message)
  }
  t.ok(threw)
})

test('install-target: documented dirs match Pear-era footprint', (t) => {
  const winDir = documentedBinaryDir('win32')
  if (os.platform() === 'win32') {
    t.ok(winDir.endsWith(path.join('Programs', 'Jojun')) || /Programs[/\\]Jojun$/i.test(winDir))
    t.ok(documentedBinaryPath('win32').endsWith('jojun.exe'))
  } else {
    t.ok(documentedBinaryDir('darwin').endsWith(path.join('.local', 'bin')))
    t.ok(documentedBinaryPath('linux').endsWith('jojun'))
  }
  const dest = resolveInstallPath({ platform: 'linux', isDev: true })
  t.ok(dest.includes('jojun'))
})

test('replace-binary: writes real bytes into a temp path', (t) => {
  const dir = path.join(os.tmpdir(), 'jojun-replace-' + Date.now())
  fs.mkdirSync(dir, { recursive: true })
  const src = path.join(FIX, 'payload-v2.txt')
  const name = os.platform() === 'win32' ? 'jojun.exe' : 'jojun'
  const target = path.join(dir, name)
  fs.writeFileSync(target, fs.readFileSync(path.join(FIX, 'payload-v1.txt')))
  replaceBinary(src, target)
  t.is(fs.readFileSync(target).toString(), fs.readFileSync(src).toString())
})

test('compareSemver', (t) => {
  t.is(compareSemver('0.1.0', '0.0.2'), 1)
  t.is(compareSemver('0.0.2', '0.1.0'), -1)
  t.is(compareSemver('v1.0.0', '1.0.0'), 0)
})

test('http+update: loopback release applies verified archive', async (t) => {
  const platform = os.platform()
  const arch = os.arch() === 'x64' || os.arch() === 'arm64' ? os.arch() : 'x64'
  const version = '9.9.9'
  const assetName = assetFileName(version, platform, arch)
  const bin = binaryName(platform)

  const work = path.join(os.tmpdir(), 'jojun-upd-test-' + Date.now())
  fs.mkdirSync(work, { recursive: true })
  const stage = path.join(work, 'stage')
  fs.mkdirSync(stage, { recursive: true })
  const payload = fs.readFileSync(path.join(FIX, 'payload-v2.txt'))
  fs.writeFileSync(path.join(stage, bin), payload)

  const archivePath = path.join(work, assetName)
  if (archiveExt(platform) === 'zip') {
    if (platform === 'win32') {
      const ps =
        "Compress-Archive -LiteralPath '" +
        path.join(stage, bin).replace(/'/g, "''") +
        "' -DestinationPath '" +
        archivePath.replace(/'/g, "''") +
        "' -Force"
      const r = spawnSync(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps],
        { windowsHide: true }
      )
      t.is(r.status, 0, r.stderr && r.stderr.toString())
    } else {
      const r = spawnSync('zip', ['-j', archivePath, path.join(stage, bin)])
      t.is(r.status, 0)
    }
  } else {
    const r = spawnSync('tar', ['-czf', archivePath, '-C', stage, bin])
    t.is(r.status, 0, r.stderr && r.stderr.toString())
  }

  const archiveBytes = fs.readFileSync(archivePath)
  const digest = sha256Buffer(archiveBytes)
  const checksumsBody = digest + '  ' + assetName + '\n'

  const files = new Map([
    ['/' + assetName, archiveBytes],
    ['/checksums.txt', Buffer.from(checksumsBody)],
    [
      '/repos/Organization-Jojun/joju-cli/releases/latest',
      Buffer.from(
        JSON.stringify({
          tag_name: 'v' + version,
          assets: [
            {
              name: assetName,
              browser_download_url: null // filled after listen
            },
            {
              name: 'checksums.txt',
              browser_download_url: null
            }
          ]
        })
      )
    ]
  ])

  const server = http.createServer((req, res) => {
    let key = req.url.split('?')[0]
    if (key.endsWith('/releases/latest')) {
      key = '/repos/Organization-Jojun/joju-cli/releases/latest'
    }
    const body = files.get(key)
    if (!body) {
      res.statusCode = 404
      res.end('missing ' + key)
      return
    }
    if (key.endsWith('/latest')) {
      const port = server.address().port
      const json = JSON.parse(body.toString())
      json.assets[0].browser_download_url = 'http://127.0.0.1:' + port + '/' + assetName
      json.assets[1].browser_download_url = 'http://127.0.0.1:' + port + '/checksums.txt'
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(json))
      return
    }
    res.statusCode = 200
    res.end(body)
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  const apiBase = 'http://127.0.0.1:' + port + '/repos/Organization-Jojun/joju-cli/releases'

  const installDir = path.join(work, 'install')
  fs.mkdirSync(installDir, { recursive: true })
  const target = path.join(installDir, bin)
  fs.writeFileSync(target, fs.readFileSync(path.join(FIX, 'payload-v1.txt')))

  const check = await checkForUpdate({
    currentVersion: '0.0.1',
    platform,
    arch,
    apiBase
  })
  t.ok(check.newer)
  t.is(check.latestVersion, version)

  const result = await applyUpdate({
    currentVersion: '0.0.1',
    platform,
    arch,
    apiBase,
    targetPath: target,
    workDir: path.join(work, 'dl')
  })
  t.ok(result.updated)
  t.is(fs.readFileSync(target).toString(), payload.toString())

  // corrupt checksum must fail
  let failed = false
  try {
    files.set('/checksums.txt', Buffer.from('0'.repeat(64) + '  ' + assetName + '\n'))
    await applyUpdate({
      currentVersion: '0.0.1',
      platform,
      arch,
      apiBase,
      targetPath: target,
      workDir: path.join(work, 'dl2'),
      release: check.release
    })
  } catch (err) {
    failed = /checksum/.test(err.message)
  }
  t.ok(failed)

  await new Promise((resolve) => server.close(resolve))
})

test('http: getBuffer against loopback', async (t) => {
  const server = http.createServer((req, res) => {
    res.end('hello-loopback')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  const res = await getBuffer('http://127.0.0.1:' + port + '/')
  t.is(res.body.toString(), 'hello-loopback')
  await new Promise((resolve) => server.close(resolve))
})

test('uninstall: documented ~/.local/bin is jojun-placed on unix platforms', (t) => {
  const facts = {
    storage: { path: '/tmp/x', exists: false, entries: [] },
    pathEntries: [],
    binaries: [
      {
        path: path.join('/home/me', '.local', 'bin', 'jojun'),
        provenance: 'jojun-placed',
        running: false
      }
    ],
    pear: { detected: false }
  }
  const binary = uninstall.plan(facts, {}).targets.find((x) => x.id === 'binary')
  t.is(binary.action, 'remove')
  t.is(binary.reason, 'installed-location')
})
