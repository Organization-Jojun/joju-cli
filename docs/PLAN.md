# PLAN.md — cómo trabajamos las 8 horas

Somos **dos personas** más sus cloud agents, metiendo commits al mismo repo. Este archivo existe para
una cosa: **que Agent-A y Agent-B no se pisen**, y que la máquina siga corriendo sola cuando nadie
esté mirando. Léelo entero una vez. Después es consulta.

Congelado en Fase 0: **sáb 22.ago 2026**. Producto: **Jojun** (`PROYECTO.md`).

**Inicio absoluto:** sáb 22.ago 2026, **14:26 UTC-5** (16:26 ARG). **8 h** de build. Hito ~4:00
relativo. Feature freeze **7:00**. Cierre **8:00**.

**Cloud agents:** Lock de Windows **hecho**. Se prenden al bloque **Build**, cuando vos lo
pidás, **después** de commit+push a GitHub (el cloud clona el remote).

---

## 1. Quién es quién

| Rol | Persona | Agente | De qué es dueño |
|---|---|---|---|
| **Lógica del CLI** | **Jonatin** | **Agent-A** | `src/core/`, `src/cli/`, `src/commands/` — comandos de Jojun (paste/yank/wait/help). También **integración** |
| **P2P + deploy/OTA** | **Julián (Julidev)** | **Agent-B** | `src/p2p/`, `src/deploy/`, `src/update/`, `scripts/`, `out/`, build, seed. **Graba el video** |

La **forma** (A = qué hace / B = cómo se despliega y habla P2P) no cambia.

**Los dos hablan con el agente y los dos leen el mismo `AGENTS.md`.**

---

## 2. Mapa de propiedad del repo

Regla: **nadie edita un archivo que no le pertenece.** Si necesitas un cambio en territorio ajeno,
lo pides en `HANDOFF.md` (y en `.agent-state/blockers.md` si te bloquea). Hook:
`.cursor/hooks/audit-ownership.mjs` → `.agent-state/ownership-audit.log` (no bloquea).

| Ruta | Dueño |
|---|---|
| `bin.mjs`, `src/core/`, `src/cli/`, `src/commands/` | Agent-A · Jonatin |
| `app.js`, `src/p2p/`, `src/deploy/`, `src/update/`, `scripts/`, `out/` | Agent-B · Julián |
| `src/contracts/` | **Compartido** (contrato A↔B). Si cambia, se anuncia en `HANDOFF.md` **antes** de pushear |
| `package.json` (campo `upgrade`, deps de deploy) | **Agent-B** |
| `.agent-state/`, `HANDOFF.md`, `docs/`, `README.md`, `.cursor/`, `AGENTS.md`, `PROYECTO.md`, `HERRAMIENTAS.md` | Compartido |

### Contrato A↔B (congelado)

Interfaz: `join(topic)` · `send(bytes)` · `onMessage` · `leave` · status swarm.

**Fixtures (primer commit de producto, dueño de la interfaz = quien abre el archivo en
`src/contracts/`):** topic hex, payload utf8, evento mock `peer-connected`. Agent-A implementa
comandos contra el mock. Agent-B reemplaza el mock por Hyperswarm sin cambiar nombres de la API
salvo anuncio.

Añadir un campo opcional es barato; renombrar o quitar, no.

**`package.json`:** dueño único Agent-B. Agent-A pide deps en `HANDOFF.md`.

---

## 3. Protocolo de git — ramas, NO push a main

```bash
git fetch --all --prune
git switch -c agent-a/<tarea>      # Agent-B: agent-b/<tarea>
git add <rutas>                    # NUNCA "git add ."
git commit                         # conventional + cuerpo largo
git push -u origin agent-a/<tarea>
```

- **Nunca push directo a `main`.** Integración: Jonatin/Agent-A.
- Cadencia: push de tu rama al menos cada 30 min + `.agent-state/agent-<x>-status.md`.
- Integración: Agent-A trae `agent-b/*`, corre `verifier`, registra
  `.agent-state/integration-status.md`.

---

## 4. Coordinación autónoma (sin humano en el loop) — **solo Fase 1**

- Agent-A: `.agent-state/agent-a-status.md`
- Agent-B: `.agent-state/agent-b-status.md`
- Integración: `.agent-state/integration-status.md`
- Bloqueos: `.agent-state/blockers.md` + `HANDOFF.md`

Antes de cada tarea: `git fetch --all --prune` y leés el estado del otro. Al terminar: validar,
estado, commit, push. **No esperás confirmación.**

---

## 5. El reloj — 8 horas (relativo al 14:26 UTC-5)

Arranque de código en repo: `hello-pear-bare` **`variant/daemon`**. Pear CLI en Lock (aún no
instalada al freeze).

| Bloque | Ventana | Agent-A · Jonatin | Agent-B · Julián |
|---|---|---|---|
| **Lock** | 0:00–0:30 | Humanos: Pear CLI Win. **Sin cloud agents** | Humanos: Pear CLI Mac. `pear touch` → `upgrade`. Meter template `variant/daemon` en el repo |
| **Plan** | 0:30–1:00 | Fixtures (topic hex, payload, `peer-connected`) | Esqueleto `stage`/`seed` a mano una vez |
| **Build** | **1:00–5:00** | **Prender Agent-A (cloud).** CLI Bare (`paparam`) contra fixtures | **Prender Agent-B (cloud).** Hyperswarm · primer `pear stage` · install desde otra máquina |
| **Hito** | **~4:00** | **¿`pear install pear://<key>` desde máquina limpia? Sí/No. Si no, hard-cuts** | |
| **Polish** | 5:00–6:45 | `--help`/`keys` · `--json` si hay tiempo · README | **OTA aterrizando** · `updates.log` |
| **Cierre** | 6:45–8:00 | Submit del `pear://` link | Video 3 min. Seed juzgamiento = **Jonatin (Windows)** |
| **Freeze features** | **7:00** | Lo que no exista, no existe | |

**Binarios:** `npm run make` en **Windows (Jonatin)** y **darwin (Julián)**. No cruzar hosts.

---

## 6. Hard-cuts (orden, sin abrir debate)

El install + la OTA **nunca** se cortan.

1. `--json`, help extra, segundo comando de lujo.
2. TUI / overlay tipo Herdr.
3. Hypercore, Hyperdrive, BLE, multi-peer avanzado.
4. Reducir a **una** cosa: paste **o** yank, no las dos, si hace falta.
5. **Nunca:** `pear install` + OTA + seed en juzgamiento (Jonatin).

El dueño del hito ~4:00 (Jonatin) recorre el flujo **como usuario**. Feo cuenta.

---

## 7. Entorno y secretos

```bash
# Windows (Jonatin)
irm https://install.pears.com/pear.ps1 | iex

# macOS (Julián)
curl -fsSL https://install.pears.com/pear.sh | sh
export PATH="$HOME/.pear/bin:$PATH"

git clone -b variant/daemon https://github.com/holepunchto/hello-pear-bare
# (integrar en ESTE repo; no inventar un segundo producto)

npm install
pear touch                    # link real -> package.json "upgrade"
npm start                     # one-shot; daemon updater. logs: <storage>/updates.log
npm run make                  # out/<platform>-<arch> en el host matching
```

**Secretos:** repo público. Nada de keys en el árbol. Si se cuela y ya se pusheó: avisar y rotar.
El historial también es público.
