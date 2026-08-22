# PLAN.md — cómo trabajamos las 9 horas

Somos **dos personas** más sus cloud agents, metiendo commits al mismo repo. Este archivo existe para
una cosa: **que Agent-A y Agent-B no se pisen**, y que la máquina siga corriendo sola cuando nadie
esté mirando. Léelo entero una vez. Después es consulta.

Congelado en Fase 0: `[FECHA/HORA]`.

---

## 1. Quién es quién

| Rol | Persona | Agente | De qué es dueño |
|---|---|---|---|
| **Lógica del CLI** | **Jonatin** | **Agent-A** | `src/core/`, `src/cli/`, `src/commands/` — el trabajo que hace la herramienta. También **integración** (une ramas, decide hard-cuts) |
| **P2P + deploy/OTA** | **Julián (Julidev)** | **Agent-B** | `src/p2p/`, `src/deploy/`, `src/update/`, `scripts/`, build de binarios, seed. También **graba el video** |

> Rutas por defecto — se cierran en Fase 0 con el layout real. La **forma** (A = qué hace / B = cómo
> se despliega y habla P2P) no cambia.

**Los dos hablan con el agente y los dos leen el mismo `AGENTS.md`.** No hay un "dueño del chat"
único: hay dos módulos y dos ramas.

---

## 2. Mapa de propiedad del repo

Regla: **nadie edita un archivo que no le pertenece.** Si necesitas un cambio en territorio ajeno,
lo pides en `HANDOFF.md` (y en `.agent-state/blockers.md` si te bloquea). Cuesta un minuto y ahorra
un conflicto. Un hook de auditoría (`.cursor/hooks/audit-ownership.mjs`) registra cualquier edición
fuera de tu carpeta en `.agent-state/ownership-audit.log` — no bloquea, pero queda para revisar.

| Ruta | Dueño |
|---|---|
| `src/core/`, `src/cli/`, `src/commands/` | Agent-A · Jonatin |
| `src/p2p/`, `src/deploy/`, `src/update/`, `scripts/`, `out/` | Agent-B · Julián |
| `package.json` (campo `upgrade`, deps de deploy) | **Agent-B** (dueño del pipeline) |
| `.agent-state/`, `HANDOFF.md`, `docs/`, `README.md`, `.cursor/` | Compartido |

### Los sitios donde dos agentes chocan de verdad

- **El contrato A↔B** (la interfaz entre la lógica del CLI y la capa P2P/deploy). Vive en
  `src/contracts/` o donde se decida en Fase 0. **Si cambia, se anuncia en `HANDOFF.md` antes de
  pushear.** Añadir un campo opcional es barato; renombrar o quitar, no.
- **`package.json`** — dueño único: Agent-B. Si Agent-A necesita una dependencia, la pide.
- **Fixtures** — un ejemplo por interfaz; lo escribe el dueño de esa interfaz. El otro construye
  contra eso sin esperar.

---

## 3. Protocolo de git — ramas, NO push a main

Distinto de un equipo de una sola rama: aquí cada agente vive en **su** rama y `main` es sagrado.

```bash
git fetch --all --prune            # SIEMPRE antes de cada tarea; mira .agent-state/ del otro
git switch -c agent-a/<tarea>      # Agent-A   (Agent-B: agent-b/<tarea>)
git add <rutas>                    # NUNCA "git add ." — el repo es público
git commit                         # conventional + cuerpo largo (ver AGENTS.md)
git push -u origin agent-a/<tarea> # push de TU rama, jamás a main
```

- **Nunca push directo a `main`.** `main` solo recibe merges de integración (dueño: Jonatin/Agent-A).
- **Cadencia:** pusheas tu rama al menos cada 30 min, aunque esté a medias. Y actualizas tu
  `.agent-state/agent-<x>-status.md` en cada bloque.
- **Nunca `git add .`** (es la forma #1 de commitear un secreto). El repo es público.
- **Integración:** Agent-A trae `agent-b/*` a una rama de integración, resuelve el contrato, corre
  `verifier`, y de ahí a `main`. Lo registra en `.agent-state/integration-status.md`.

---

## 4. Coordinación autónoma (sin humano en el loop)

Los agentes se hablan por archivos versionados, no por el chat:

- Agent-A escribe `.agent-state/agent-a-status.md`.
- Agent-B escribe `.agent-state/agent-b-status.md`.
- Integración: `.agent-state/integration-status.md`.
- Bloqueos y peticiones cruzadas: `.agent-state/blockers.md` + `HANDOFF.md`.

En cada actualización de estado: **estado actual, rama, commit, archivos modificados, contratos/
interfaces cambiadas, tests ejecutados, bloqueos y próximos pasos.** Antes de cada tarea:
`git fetch --all --prune` y revisa el estado del otro. **No esperas confirmación:** al terminar,
corres validaciones, actualizas estado, commit y push.

---

## 5. El reloj — 9 horas

Ajusta la hora de inicio real. El hito crítico no se mueve.

| Bloque | Ventana | Agent-A · Jonatin (lógica CLI + integración) | Agent-B · Julián (P2P + deploy/OTA + video) |
|---|---|---|---|
| **Lock** | 0:00–0:45 | Congelar producto+stack+ownership · elegir process shape · abrir contrato A↔B | `pear install` del template en máquina real · `pear touch` → link en package.json |
| **Plan** | 0:45–1:15 | Cerrar contrato A↔B + fixtures · plan bite-sized | Esqueleto del pipeline: `stage`/`seed` a mano una vez |
| **Build** | 1:15–5:30 | La lógica del CLI corriendo en local contra fixtures | Capa P2P (Hyperswarm) + primer `pear stage` + install desde OTRA máquina |
| **🚨 Hito** | **~4:30** | **¿`pear install pear://<key>` corre desde una máquina limpia? Sí/No en voz alta. Si no, hard-cuts sin debate** | |
| **Polish** | 5:30–7:30 | UX del CLI · README (qué es, qué branch/variant) | **OTA update real aterrizando en copia instalada** (esto es el criterio) |
| **Cierre** | 7:30–9:00 | Submit del `pear://` link · verificar entregables | **Seed estable + grabar el video de 3 min** (install + OTA landing) |
| **Freeze** | **8:00** | 🧊 **Congelación de features. Lo que no exista, no existe.** Solo lo necesario para grabar y enviar | |

---

## 6. Hard-cuts (orden, sin abrir debate)

Si a mitad de tiempo el flujo feliz no cierra, se corta en este orden. **El install + la OTA nunca
se cortan** — son el track.

1. Se corta cualquier feature secundaria del CLI.
2. Se corta el P2P "bonito" (BLE-Swarm, multi-peer avanzado) y se deja lo mínimo para tener
   conectividad P2P + OTA.
3. Se reduce el alcance del producto a "hace UNA cosa bien" y ya.
4. **Nunca** se corta: `pear install` instalable + OTA aterrizando + seed durante el juzgamiento.

El dueño del hito de las ~4:30 (Jonatin) recorre el flujo **como usuario**, sin codear, y dice si
existe o no. Feo cuenta. Si no existe, aplica los hard-cuts y no se extiende el horario.

---

## 7. Entorno y secretos

```bash
git clone <url> && cd <repo>
curl -fsSL https://install.pears.com/pear.sh | sh   # Pear CLI (Windows: irm ...ps1 | iex)
npm install
export PATH="$HOME/.pear/bin:$PATH"                 # si pear no queda en PATH
pear touch                                          # link real -> package.json campo "upgrade"
npm start                                           # dev, updates off
```

**Secretos:** el repo es público desde el commit 1. Nada de keys en el árbol. Si se cuela un secreto
y ya se pusheó, **no lo tapes con otro commit**: avísalo y rota la credencial. El historial también
es público.
