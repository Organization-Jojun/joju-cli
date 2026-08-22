# HANDOFF

Canal de comunicación entre agentes **sin humano en el loop**. Si necesitas algo fuera de tu
ownership, **no edites ese archivo**: pídelo aquí. El otro agente lo lee y lo aplica en su territorio.

Cómo se usa:
- **Agente:** quién pide (Agent-A / Agent-B / Integrador).
- **Archivo/Módulo:** la ruta ajena que necesitas tocar o el módulo del que dependes.
- **Qué necesita:** el cambio concreto, en una línea.
- **Estado:** `pendiente` · `en curso` · `hecho` · `bloqueado`.

| Agente | Archivo/Módulo | Qué necesita | Estado |
|---|---|---|---|
| Integrador | `src/contracts/` | Contrato congelado: `join(topic)` / `send(bytes)` / `onMessage` / `leave` / status. Fixtures primer commit de producto: topic hex, payload utf8, mock `peer-connected`. Hook: `src/contracts` es **SHARED**. | hecho (docs) |
| Integrador | Lock Windows | Pear CLI v3.2.0 + template `variant/daemon` + `pear touch` `pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo`. | hecho |
| **Agent-A** | `src/contracts/` | Crear `index.js` que re-exporte `../p2p` (prod) o `../p2p/mock` (dev/tests). Copiar fixtures de `src/p2p/fixtures.js`. API congelada abajo — **no renombrar**. | pendiente |
| **Agent-A** | `bin.mjs`, `src/commands/` | Importar contrato y cablear paste/yank/wait/leave/help. `wait` escucha `peer-connected` vía `on('peer-connected', fn)`. | pendiente |
| Agent-B | Máquina real (Mac · Julián) | `npm install`, `npm run make` darwin-arm64 o darwin-x64. No otro `pear touch`. | pendiente |
| Agent-B | Máquina real (Windows · Jonatin) | `npm run make` win32 + `npm run stage` + `npm run seed` durante juzgamiento (dom 13:00–17:00 ARG). | pendiente |
| Integrador | `docs/PLAN.md` | Reloj anclado: 8h desde 14:26 UTC-5. Producto **Jojun**. Cloud agents en bloque Build (~minuto 60), no ahora. | hecho |

---

## Contrato P2P implementado (Agent-B · `src/p2p/`)

**API congelada** — Agent-A importa vía `src/contracts/`:

```js
const p2p = require('../contracts') // o '../p2p' hasta que exista contracts

await p2p.join(topicHex)           // topic = 64-char hex (32 bytes)
p2p.send(bytes)                    // Buffer o convertible
p2p.onMessage(fn)                  // fn(data: Buffer)
p2p.on('peer-connected', fn)       // fn({ publicKey })
p2p.on('update', fn)               // fn(status)
await p2p.leave()
p2p.status()                       // { joined, topic, peers, connecting }
```

**Fixtures** (`src/p2p/fixtures.js` — copiar a `src/contracts/fixtures.js`):

| Constante | Valor |
|---|---|
| `TOPIC_HEX` | `68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000` |
| `PAYLOAD_UTF8` | `hello jojun` |

**Mock offline:** `require('../p2p/mock')` — misma API, emite `peer-connected` a los 10 ms.

---

## Pipeline deploy (Agent-B · listo en cloud)

```bash
export PATH="$HOME/.pear/bin:$PATH"
npm run stage              # pear stage → pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo
npm run stage -- --dry-run # diff sin escribir
npm run seed               # proceso vivo — solo máquina humana en juzgamiento
npm run make               # out/<platform>-<arch>
```

**Límite cloud:** `pear stage` dry-run OK; stage real falla si destino no es writable. `pear seed` y `pear install` desde máquina limpia = **Jonatin (Windows)** en juzgamiento.

**Binarios:**

| Plataforma | Quién | Estado |
|---|---|---|
| linux-x64 | Cloud (dev) | `out/linux-x64/jojun` compilado |
| darwin-* | Julián (Mac) | pendiente |
| win32-* | Jonatin (Windows) | pendiente |

---

## OTA / variant/daemon

- Errores de update → `<storage>/updates.log` (ya en `bin.mjs` + `app.js`).
- `src/update/logger.js` — helper reutilizable si Agent-A quiere unificar logging.
- Link upgrade **no regenerar**: `pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo`.
