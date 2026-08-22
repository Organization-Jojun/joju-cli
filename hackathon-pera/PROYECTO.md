# PROYECTO.md — [NOMBRE DEL PRODUCTO · POR CONGELAR EN FASE 0]

**Hackathon Aleph 2026 · 🍐 Pears Track (sponsor Tether)**
Abre: sáb 22.ago 12:00 (ARG) · Cierra: **dom 23.ago 12:00 (ARG), sin prórroga.**
Juzgamiento: dom 13:00 (ARG), ~4 h, online, demo async. Premio: 1º $1.000 · 2º $500 USDt.

> **Documento fuente:** [`brief_pears_track_aleph_hackathon_2026.md`](brief_pears_track_aleph_hackathon_2026.md).
> Este archivo es el **resumen operativo** y el **corte vivo**. Si algo contradice al brief, este
> recoge la decisión del equipo. Hace las veces de `PROJECT_SPEC`.

---

## Estado: FASE 0 (setup). El producto NO está congelado.

Este repo se opera en dos fases (ver `AGENTS.md`). Ahora mismo estamos en **Fase 0**: el agente
**pregunta y congela** producto, stack fino y ownership **una sola vez**. En cuanto esto quede
cerrado, arranca la **Fase 1**: 9 horas de build autónomo, sin revisión humana.

**Lo que el agente debe preguntar y dejar congelado aquí antes de escribir código de producto:**

1. **Qué CLI construimos** (la idea concreta). Direcciones del track: herramienta de sistema, juego
   de terminal, TUI de mensajería, herramienta de dev, o la dirección bonus **BLE-Swarm** (P2P por
   Bluetooth, sin internet — "apagá el wifi y sigue funcionando", un demo que aterriza en la sala).
2. **La *process shape*:** `main` (updater en worker thread), `variant/single-thread`, o
   `variant/daemon` (one-shot que sale mientras el daemon actualiza). Elegir bien esto **es parte de
   hacerlo bien** según el brief.
3. **Cuánto P2P de verdad** entra al MVP (Hyperswarm/Hypercore/Hyperdrive) vs. qué queda en roadmap.
4. **El layout de carpetas** (cierra las rutas de ownership de `AGENTS.md` y del hook de auditoría).
5. **El contrato A↔B:** la interfaz entre el módulo de Jonatin (lógica del CLI) y el de Julián (P2P +
   deploy/OTA). Se acuerda **antes** de escribir lógica; los fixtures van en el primer commit.

Hasta que estén los cinco puntos, esto queda como `[POR CONGELAR]`. No inventes en silencio.

---

## Para quién es · qué resuelve — `[POR CONGELAR EN FASE 0]`

> Regla del brief: **"build whatever you'd actually use"**. El criterio de corte es que sea algo que
> una persona **de verdad usaría**, no una demo de laboratorio. Rellena aquí en una frase el dolor y
> el usuario cuando se congele la idea.

---

## Qué es (una vez congelado)

Un **CLI standalone** sobre el stack Pear (Bare), arrancado desde `hello-pear-bare`, desplegado con
la Pear CLI, **instalable con `pear install pear://<key>`**, con **OTA updates P2P** que llegan a
copias ya instaladas sin que el usuario haga nada.

**Pitch de una frase:** `[POR CONGELAR]`

---

## Cómo se gana (rúbrica del track)

| Criterio (del brief) | Qué lo defiende en nuestro caso |
|---|---|
| **Instala limpio** con `pear install pear://<key>` | Requisito duro. Si no corre, la entrada **no cuenta**. Es la prioridad #1, por encima de cualquier feature |
| **La OTA update funciona de punta a punta** | Demostrar una release real aterrizando en una copia ya instalada. Esto **es** el track |
| **La *process shape* encaja** con lo que hace la herramienta | `main` / `single-thread` / `daemon` elegido a conciencia, no por defecto |
| **Es algo que alguien usaría de verdad** | El producto tiene un dolor real y un usuario real |
| **P2P connectivity** | Hyperswarm/Hypercore/Hyperdrive donde suma, no de adorno |

> Bonus opcional: **BLE-Swarm** (descubrimiento por Bluetooth, sin internet). Alto riesgo, alto
> impacto en demo. Solo si el flujo feliz ya está cerrado.

---

## Entregable (lo que se sube)

- **Repo público** con README: qué construimos y de qué branch/variant de `hello-pear-bare` salimos.
- **El `pear://` link**, sembrado y vivo **durante todo el juzgamiento** (dom 13:00–~17:00 ARG). Si
  los jueces no lo pueden instalar, no lo pueden puntuar.
- **Video demo grabado (async, 3 min)** — lo graba **Julián** — mostrando el install y una OTA
  aterrizando.
- **En qué plataformas** compilamos el binario.

---

## Reloj (9 horas) — detalle por bloque en [`docs/PLAN.md`](docs/PLAN.md)

| Bloque | Ventana | Qué pasa |
|---|---|---|
| **Lock** | 0:00–0:45 | Congelar producto+stack+ownership · `pear install` del template corriendo en máquina real · `pear touch` link en package.json |
| **Plan** | 0:45–1:15 | Plan bite-sized · contrato A↔B + fixtures · elegir process shape |
| **Build** | 1:15–5:30 | Flujo feliz e2e: el CLI hace su trabajo + P2P + primer `pear stage` + install desde otra máquina |
| **Polish** | 5:30–7:30 | **OTA update real aterrizando** (esto es el criterio) · README · UX del CLI |
| **Cierre** | 7:30–9:00 | Seed estable · Julián graba el 3-min · submit del `pear://` link · silencio de features |

**Hito crítico (~4:30):** ¿`pear install pear://<key>` corre desde una máquina limpia? Si no, cortar
todo lo secundario y decirlo en voz alta.

---

## In / Out (congelar aquí)

**Dentro (MVP):** `[POR CONGELAR]` — pero el install + la OTA **siempre están dentro**.

**Fuera (hard-cuts, en orden):** `[POR CONGELAR]` — lo primero que se corta es cualquier feature que
no sea el install + OTA. Nunca se corta el pipeline de deploy.

---

## No tocar (una vez congelado)

- El requisito duro: `pear install pear://<key>` instalable + OTA aterrizando.
- El stack Pear/Bare (no es Node.js).
- El video como especificación del entregable, no como adorno.
