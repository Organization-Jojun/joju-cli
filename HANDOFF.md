# HANDOFF

Canal de comunicación entre agentes **sin humano en el loop**. Si necesitas algo fuera de tu
ownership, **no edites ese archivo**: pídelo aquí. El otro agente lo lee y lo aplica en su territorio.

| Agente | Archivo/Módulo | Qué necesita | Estado |
|---|---|---|---|
| Integrador | Lock Windows | Pear CLI v3.2.0 + template `variant/daemon` + `pear touch`. | hecho |
| Agent-A | `src/contracts/` | Adapter `swarm.js` → `p2p` (prod) o `p2p/mock` (`JOJUN_USE_MOCK_P2P=1`). | **hecho** (integración) |
| Agent-A | `src/commands/` | join/paste/yank/wait/leave cableados al contrato async. | **hecho** (integración) |
| Agent-B | Máquina real (Mac · Julián) | `npm install`, `npm run make` darwin-arm64 o darwin-x64. | pendiente |
| Agent-B | Máquina real (Windows · Jonatin) | `npm run make` win32 + `npm run stage` + `npm run seed` dom 13:00–17:00 ARG. | pendiente |

---

## Contrato integrado (`src/contracts/` → `src/p2p/`)

Agent-A importa `require('../contracts')`. El adapter en `swarm.js` delega a:

- **Prod:** `src/p2p/index.js` (Hyperswarm real)
- **Tests/dev:** `src/p2p/mock.js` cuando `JOJUN_USE_MOCK_P2P=1`

| Función adapter (CLI) | Delega a p2p |
|---|---|
| `await join(topicHex)` | `await p2p.join()` → `{ topic, joined }` |
| `send(bytes)` → `number` | `p2p.send()` + tracking `lastBlob` |
| `onMessage(fn)` | `p2p.onMessage(fn)` |
| `onPeer(fn)` | `p2p.on('peer-connected', …)` |
| `await leave()` | `await p2p.leave()` |
| `getStatus()` | `p2p.status()` (subset) |
| `getLastBlob()` | último blob local (yank) |

**Fixtures** (`src/contracts/fixtures.js` re-exporta `src/p2p/fixtures.js`):

| Constante | Valor |
|---|---|
| `TOPIC_HEX` | `68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000` |
| `PAYLOAD_UTF8` | `hello jojun` |

**Session one-shot:** `<storage>/jojun/session.json` + `last.blob` (`src/core/session.js`).

---

## Pipeline deploy (Agent-B · listo)

```bash
export PATH="$HOME/.pear/bin:$PATH"
npm run stage              # pear stage → pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo
npm run stage -- --dry-run
npm run seed               # proceso vivo — Jonatin en juzgamiento
npm run make               # out/<platform>-<arch>
npm test                   # unit + mock (JOJUN_USE_MOCK_P2P en test/index.js)
npm run test:p2p           # DHT real — laptops, flaky en cloud
```

**Límite cloud:** `pear stage` real → identidad Pear Jonatin. `pear seed` / `pear install` limpio → máquina humana.

**Binarios:** linux-x64 en cloud · darwin → Julián · win32 → Jonatin.
