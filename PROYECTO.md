# PROYECTO.md — Jojun

**Hackathon Aleph 2026 · 🍐 Pears Track (sponsor Tether)**
Abre: sáb 22.ago 12:00 (ARG) · Cierra: **dom 23.ago 12:00 (ARG), sin prórroga.**
Juzgamiento: dom 13:00 (ARG), ~4 h, online, demo async. Premio: 1º $1.000 · 2º $500 USDt.

> **Documento fuente:** [`brief_pears_track_aleph_hackathon_2026.md`](brief_pears_track_aleph_hackathon_2026.md).
> Este archivo es el **resumen operativo** y el **corte vivo**. Si algo contradice al brief, este
> recoge la decisión del equipo. Hace las veces de `PROJECT_SPEC`.

---

## Estado: CONGELADO (Fase 0 cerrada). Listo para Fase 1.

Congelado: **sáb 22.ago 2026** (docs). Producto, process shape, P2P de producto, layout y contrato
A↔B **no se reabren** salvo que Jonatin lo pida. En Fase 1 los cloud agents no preguntan: ejecutan
contra este corte.

Template de arranque (cuando se clone, **después** de este freeze): `hello-pear-bare`
rama **`variant/daemon`**.

---

## Para quién es · qué resuelve

Hackers en una sala (Aleph, o Jonatin y Julián en dos laptops): pasar un snippet o un blob chico
sin Discord, USB ni un servidor. `paste` en una máquina, `yank` en la otra, mismo topic de swarm.

---

## Qué es

Un **CLI standalone one-shot** llamado **Jojun**, sobre Pear (Bare), desde `hello-pear-bare`
`variant/daemon`, desplegado con la Pear CLI, **instalable con `pear install pear://<key>`**, con
**OTA P2P** a copias ya instaladas. El comando hace su trabajo y **sale**; el updater corre en un
daemon (errores de update en `<storage>/updates.log`, no en la terminal).

**Pitch de una frase:** Con Jojun pegás algo en una máquina, lo yankéas en la otra, por swarm, y el
binario se actualiza solo.

**Inspiración Herdr (craft, no producto):** cinco acciones en `--help` / `keys` (join, paste, yank,
wait, leave); `--json` e IDs de topic explícitos. **No** multiplexor, panes, agentes, plugins,
remote, worktrees, ni overlay `prefix+?` (no hay TUI en el MVP).

---

## Las cinco decisiones (cerradas)

1. **CLI:** **Jojun** — room paste/yank por topic.
2. **Process shape:** `variant/daemon` (como `swap`).
3. **P2P de producto (MVP):** **Hyperswarm topic** (join / send / recv). **Fuera del MVP:**
   Hypercore, Hyperdrive, BLE-Swarm. El OTA del pipeline Pear **siempre entra**.
4. **Layout:** ver `AGENTS.md` / `docs/PLAN.md`. A = `src/core|cli|commands`. B =
   `src/p2p|deploy|update` + `scripts/` + `out/`. Contrato = `src/contracts/`. `package.json`
   (campo `upgrade` y deps de deploy) = Agent-B.
5. **Contrato A↔B:** `join(topic)` · `send(bytes)` · `onMessage` · `leave` · status swarm.
   Fixtures del primer commit de producto: topic hex, payload utf8, mock `peer-connected`.
   Agent-A construye los comandos paste/yank contra fixtures. Agent-B cablea Hyperswarm de verdad.

---

## Cómo se gana (rúbrica del track)

| Criterio (del brief) | Qué lo defiende en nuestro caso |
|---|---|
| **Instala limpio** con `pear install pear://<key>` | Requisito duro. Prioridad #1 |
| **La OTA update funciona de punta a punta** | Release real aterrizando en copia instalada. Daemon: mirar `updates.log` |
| **La *process shape* encaja** | One-shot → `variant/daemon`, no TUI en `main` |
| **Es algo que alguien usaría de verdad** | Pegar/yankear un blob en la sala |
| **P2P connectivity** | Hyperswarm topic en el producto + swarm del OTA |

BLE-Swarm: **no en MVP.** Solo si el flujo feliz (install + OTA + paste/yank) ya cerró en el hito.

---

## Entregable (lo que se sube)

- **Repo público** (ya lo es) con README: qué es **Jojun** y que salimos de `variant/daemon`.
- **El `pear://` link**, sembrado **durante todo el juzgamiento** (dom 13:00–~17:00 ARG).
  **Quién siembra:** Jonatin (máquina Windows real).
- **Video demo (async, 3 min)** — **Julián** — install + OTA aterrizando. Hook: el paste/yank en
  dos máquinas, no un tour de flags.
- **Plataformas del binario:** **Windows** en la máquina de Jonatin (documentar ahí el `make`).
  **macOS** en el host de Julián (`make` darwin, no en Windows). Linux: cloud/VM si hace falta; no
  es el demo.

---

## Reloj (8 horas de build) — detalle en [`docs/PLAN.md`](docs/PLAN.md)

**Inicio anclado:** sáb 22.ago 2026, **14:26 UTC-5** (16:26 ARG). Duración: **8 h**. Feature freeze
relativo **7:00**. Cierre **8:00**.

| Bloque | Ventana | Qué pasa |
|---|---|---|
| **Lock** | 0:00–0:30 | Pear CLI + `pear touch` en máquina real. Clone `variant/daemon`. **Aún no cloud agents** |
| **Plan** | 0:30–1:00 | Fixtures del contrato · esqueleto `stage`/`seed` a mano |
| **Build** | 1:00–5:00 | **Aquí sí:** cloud agents codean. CLI + Hyperswarm + primer `pear stage` |
| **Polish** | 5:00–6:45 | **OTA real aterrizando** · help de 5 acciones · `--json` |
| **Cierre** | 6:45–8:00 | Seed (Jonatin en juzgamiento) · Julián graba · submit del link |

**Hito crítico (~4:00):** ¿`pear install pear://<key>` corre desde una máquina limpia? Si no, cortar
help/JSON/segundo comando. **Nunca** el pipeline.

---

## In / Out

**Dentro (MVP):**

- `pear install` + OTA aterrizando + seed en juzgamiento
- `variant/daemon`
- comandos: join topic, `paste` (stdin), `yank` (último blob a stdout), `wait` a peer, `leave`
- Hyperswarm topic (stream; sin persistencia si el peer no está)
- `--help` / `keys` con las cinco acciones; `--json` si el reloj da
- binario Windows (Jonatin) + Mac (Julián) si el reloj da

**Fuera (hard-cuts, en orden):**

1. `--json` / help extra / segundo comando de lujo
2. TUI, overlay tipo `prefix+?`
3. Hypercore, Hyperdrive, BLE-Swarm, multi-peer “bonito”
4. Cualquier clone de Herdr (mux, agentes, plugins, remote, worktrees)
5. **Nunca** se corta: install + OTA + seed

---

## No tocar (congelado)

- El requisito duro: `pear install pear://<key>` + OTA aterrizando.
- El stack Pear/Bare (no es Node.js).
- `variant/daemon`.
- El video como especificación del entregable.
- Reabrir este corte sin que Jonatin lo pida.
