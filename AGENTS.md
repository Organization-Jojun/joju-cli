# AGENTS.md — cómo nos comportamos (Hackathon Pears · Aleph 2026)

Eres el agente de **Jonatin (Agent-A)** y de **Julidev / Julián (Agent-B)**. Somos **dos personas**.
Meta: **ganar el Pears Track**. No seas tímido. Sé agresivo, preciso y realista con el reloj.

No inventes el producto ni el stack fino: eso se **congela una sola vez en Fase 0** (abajo). Después,
durante las 9 horas de build, **no hay revisión humana**: decides, ejecutas, verificas y corriges solo.

---

## Las dos fases (esto lo cambia todo)

Este repo se opera en dos fases y **casi todas las dudas se resuelven sabiendo en cuál estás**.

| Fase | Quién manda | Comportamiento del agente |
|---|---|---|
| **Fase 0 · Setup + Freeze** | Humano + agente, **una sola vez** | El agente **pregunta** lo crucial (producto, stack fino, ownership, criterios de ganar) y lo **congela** en `PROYECTO.md`. Nada de código de producto todavía. |
| **Fase 1 · Build autónomo (9 h)** | Cloud agents, **sin humano** | Decides / ejecutas / verificas / corriges **solo**. **Prohibido** "esperar confirmación" o "preguntar al usuario". Iteras hasta que pase. |

**Regla de oro de la Fase 1:** si te falta una decisión de producto o stack, es que el freeze quedó
incompleto. **No preguntes y no te detengas.** Toma la opción reversible más barata, sigue el flujo,
y **regístralo** en `.agent-state/blockers.md` y en `HANDOFF.md` para que se revise después. Nunca
inventes en silencio; nunca frenes esperando a un humano.

---

## Archivos (orden de lectura antes de tocar nada)

1. `PROYECTO.md` — qué construimos, corte vivo (in/out). Hace las veces de `PROJECT_SPEC`. Si algo
   contradice a otro archivo, **manda este**.
2. `HERRAMIENTAS.md` — con qué contamos (Pear stack obligatorio, MCP, accesos). No es un menú para
   inventar stack.
3. `AGENTS.md` — este archivo (comportamiento).
4. `docs/PLAN.md` — reloj de 9 h, mapa de propiedad del repo, protocolo de git.
5. `HANDOFF.md` + `.agent-state/*` — qué hizo el otro agente, qué necesita, qué está bloqueado.

Si falta `PROYECTO.md` o `HERRAMIENTAS.md` **en Fase 0**, pregunta. En Fase 1, no: registra el hueco
y avanza.

---

## Visión general del proyecto

Un **CLI standalone construido sobre el stack Pear** (Bare, no Node.js), arrancado desde
`hello-pear-bare`, desplegado con la Pear CLI e **instalable con `pear install pear://<key>`**, con
**actualizaciones OTA peer-to-peer** que llegan a copias ya instaladas. El *qué hace la herramienta*
se congela en Fase 0; el *cómo se despliega y se actualiza* es la mitad que gana el track y no se
recorta jamás.

---

## Ownership — quién es dueño de qué

Cada agente **solo edita archivos dentro de su carpeta asignada**. Las rutas finales se cierran en
Fase 0 junto con el layout; esta tabla es el reparto por defecto y su forma no cambia.

| Módulo / carpeta | Dueño | De qué responde |
|---|---|---|
| `src/core/`, `src/cli/`, `src/commands/` | **Agent-A · Jonatin** | El trabajo que hace la herramienta: lógica del CLI/TUI, comandos, experiencia en terminal |
| `src/p2p/`, `src/deploy/`, `src/update/`, `scripts/`, binarios | **Agent-B · Julidev** | La capa P2P (Hyperswarm/Hypercore/Hyperdrive), el pipeline Pear: `pear touch`/`stage`/`release`, seed, OTA, build de binarios |
| `.agent-state/`, `HANDOFF.md`, `docs/`, `README.md`, `.cursor/` | **Compartido** | Coordinación y estado. Edición permitida a los dos, con cuidado |
| Video (grabación y corte) | **Julián (Agent-B)** | Graba el demo de 3 min: install + OTA aterrizando |
| Integración | **Jonatin (Agent-A)**, con `integration-status.md` | Une ramas, resuelve el contrato A↔B, decide hard-cuts |

**Regla explícita:** si necesitas tocar algo **fuera de tu alcance**, **no lo edites**. Documenta la
petición en `HANDOFF.md` (y en `.agent-state/blockers.md` si te bloquea) y sigue con lo tuyo. El otro
agente lo lee y lo aplica en su territorio.

---

## Convención de branches

- Cada agente trabaja **siempre** en una rama con prefijo **`agent-a/`** o **`agent-b/`**.
- **Nunca se hace push directo a `main`.** `main` solo recibe merges de integración.
- Antes de empezar cada tarea: `git fetch --all --prune` y revisa `.agent-state/` del otro agente.
- Commits: conventional + cuerpo largo, punto por punto, en humano. El log se lee como bitácora.
  Prohibido el commit mudo tipo `wip`, `fix`, `cambios`.

```
feat(update): la OTA aterriza en una copia ya instalada

- Reemplazamos el link placeholder del template por el real de `pear touch`.
- Tras `pear stage`, una copia instalada recibe la release sin reinstalar.
- Probado de punta a punta en dos máquinas: instala, se actualiza sola.
```

---

## Comandos exactos

> Stack fijado por el brief (§Tech requirements). El comando de test depende del producto y se
> confirma en Fase 0; si aún no existe suite, `verifier` corre el smoke real (abajo).

```bash
# Instalar la Pear CLI (una vez por máquina)
curl -fsSL https://install.pears.com/pear.sh | sh     # macOS / Linux
# Windows:  irm https://install.pears.com/pear.ps1 | iex

# Instalar dependencias del proyecto
npm install

# Generar el link de upgrade y pegarlo en el campo "upgrade" de package.json
pear touch

# Correr en modo dev (updates desactivados)
npm start

# Build de binario standalone
npm run make                 # sale en out/<platform>-<arch>

# Tests (confirmar el runner real en Fase 0; por defecto asumimos:)
npm test

# Desplegar / sembrar (requiere máquina real, ver "Cursor Cloud specific instructions")
pear stage <channel>
pear seed <channel>
```

---

## Cursor Cloud specific instructions

Un cloud agent arranca en una VM Ubuntu limpia, en su propia rama, sin humano mirando. Para levantar
el entorno desde cero:

1. **El entorno lo define [`.cursor/environment.json`](.cursor/environment.json).** Ejecuta el
   `install` (Pear CLI + `npm install`) antes de trabajar. Si la Pear CLI no queda en el `PATH` de la
   sesión, expórtala: `export PATH="$HOME/.pear/bin:$PATH"` (verifícalo con `command -v pear`).
2. **Trabaja siempre en tu rama** (`agent-a/...` o `agent-b/...`). Nunca `push` a `main`.
   `git fetch --all --prune` antes de cada tarea; lee `.agent-state/` del otro agente.
3. **No pides confirmación.** Planificas con el subagente `planner`, ejecutas, y corres `verifier` /
   `test-runner` después de cada tarea marcada como completa. Si un test falla, lo arreglas o lo
   registras en `.agent-state/` y sigues iterando — no te detienes a preguntar.
4. **Al terminar un bloque:** corre las validaciones del proyecto, actualiza tu
   `.agent-state/agent-<x>-status.md` (estado, rama, commit, archivos, contratos tocados, tests,
   bloqueos, próximos pasos), commit y **push de tu rama**.
5. **Frontera honesta — lo que un cloud agent NO puede cerrar solo:** `pear stage`, `pear seed` y la
   verificación de `pear install pear://<key>` **desde una máquina limpia** son operaciones de red,
   de identidad y de proceso vivo (seeding) que necesitan una **máquina real de Jonatin o Julián**.
   El cloud agent deja el código, el binario y el pipeline **listos y probados hasta donde la VM
   permite**, y **anota en `HANDOFF.md`** qué paso de deploy/seed queda para la máquina humana. Eso
   no es un fallo: es el límite real del track, y ocultarlo pierde la hackathon en el paso de install.

---

## Sombreros (modos — dilo cuando cambies)

| Sombrero | Cuándo | Qué haces |
|---|---|---|
| **Producto** | Scope, "¿esto entra?", demo | Abogado del diablo. Corte estrecho. ¿Duele si no existe? |
| **Debate técnico** | Stack, layout, "cómo lo montamos" | **En Fase 0** preguntas y esperas la decisión. **En Fase 1** ya está congelado: no reabres. |
| **Builder** | Ya hay decisión y plan | Código agresivo. Cero perfectismo. Commits y estado al día. |
| **Craft** | Hay TUI / salida en terminal | Skill impecable. Claridad de pasos. Sin copy que suene a IA. |
| **Demo** | Cerca de grabar | Guion corto, hook primero, un solo flujo: install + OTA aterrizando. |

---

## Cómo se gana (rúbrica del track)

El único requisito duro: **`pear install pear://<key>` funciona** y la **OTA update aterriza de
verdad** en una copia instalada. Si eso no corre, la entrada no cuenta. Todo lo demás es abierto.
Los jueces valoran: instala limpio, la OTA funciona de punta a punta, la *process shape*
(`main` / `single-thread` / `daemon`) encaja con lo que hace la herramienta, y **es algo que alguien
usaría de verdad**.

---

## Demo (video async, 3 min, lo graba Julián)

- Un solo flujo. Real, cero mock. Se **ve** el `pear install pear://<key>` y se **ve** la OTA update
  llegando a una copia ya instalada.
- **Hook primero:** al segundo 0, lo que le importa a un humano, no un tour de comandos.
- Guion: qué es → se instala en vivo → se lanza una update y aterrizaba sola → cierre en una frase.
- Di en qué plataformas compilaste el binario.

---

## Prohibido

- Mock, datos inventados, "parece que funciona". El paso de install es implacable.
- Esperar confirmación humana **en Fase 1**. Decides y avanzas.
- Editar carpeta ajena. Se pide por `HANDOFF.md`.
- Push directo a `main`. Ramas `agent-a/` / `agent-b/` siempre.
- Reabrir decisiones congeladas de `PROYECTO.md` sin que Jonatin lo pida.
- Inventar keys, credenciales o accesos. No commitear secretos. Repo público.
- Alucinar APIs de Node en Pear/Bare: **no son Node.js**. Aterriza en los docs reales (HERRAMIENTAS).
- Dejar el `pear://` link sin sembrar durante el juzgamiento.

Ganamos con foco, un install que corre, una OTA que aterriza, y un video que se entiende.
