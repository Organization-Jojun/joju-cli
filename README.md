# Jojun

CLI Pear/Bare: pegás un blob en una máquina (`paste`) y lo sacás en la otra (`yank`) por un topic de Hyperswarm. El binario se actualiza solo (OTA P2P).

Salimos de [`hello-pear-bare`](https://github.com/holepunchto/hello-pear-bare) rama **`variant/daemon`**.

## Instalar

```bash
pear install pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo
```

> El link debe estar **sembrado** (`npm run seed`) durante el juzgamiento. Seed = Jonatin (Windows).

## Dev

```bash
npm install
npm start                    # one-shot CLI, updates off
npm test                     # unit + mock P2P
npm run test:p2p             # Hyperswarm integration (needs DHT)
npm run make                 # out/<platform>-<arch>
```

## Deploy

```bash
export PATH="$HOME/.pear/bin:$PATH"
npm run stage                # sync cambios al pear:// link
npm run seed                 # mantener vivo durante juzgamiento
```

Errores de OTA → `<storage>/updates.log` (no en la terminal).

## P2P (contrato A↔B)

```js
const p2p = require('./src/p2p')   // prod
// const p2p = require('./src/p2p/mock')  // offline dev

await p2p.join(topicHex)
p2p.send(bytes)
p2p.onMessage(fn)
p2p.on('peer-connected', fn)
await p2p.leave()
p2p.status()
```

Fixtures: `src/p2p/fixtures.js`.

Corte vivo: [`PROYECTO.md`](PROYECTO.md). Reloj y ownership: [`docs/PLAN.md`](docs/PLAN.md).
