# HERRAMIENTAS.md — con qué contamos

Inventario de accesos y stack. **No es un menú para inventar stack.** Si algo no está aquí, no lo
tenemos; si está aquí y no lo usamos, es porque no hace falta.

Última verificación: `[FECHA · rellenar al arrancar Fase 0]`.

---

## 1. Stack obligatorio — el Pear stack (viene del brief §Tech requirements)

Esto **no se debate**: lo fija el track. Referencia completa en
[`brief_pears_track_aleph_hackathon_2026.md`](brief_pears_track_aleph_hackathon_2026.md) §🛠️ Tech
requirements.

**Must do:**

- **Construir sobre el stack Pear**, arrancando desde cualquier variante de `hello-pear-bare`.
- **Desplegar con la Pear CLI** y **sembrar (seed)**, para que sea instalable con
  `pear install pear://<key>`. Este es el requisito de entrada.
- **OTA updates P2P funcionando** — demostrar una update real llegando a una copia instalada.
- **Enviar el `pear://` link.** Sin él no se puede instalar ni juzgar.
- **Tener conectividad P2P.**
- Usar **Hyperswarm, Hypercore, Hyperdrive** y el resto del ecosistema está recomendado (no obligado).

> **Ojo capital: Pear y Bare NO son Node.js.** Los modelos asumen que sí y alucinan APIs de Node,
> nombres de módulo falsos y flags de CLI que no existen. **Aterriza siempre en los docs reales**
> (abajo) y prueba en una máquina limpia antes de enviar. Slop que no corre no pasa ni el install.

### Elegir la *process shape* (parte de hacerlo bien)

| Branch de `hello-pear-bare` | Forma | Para |
|---|---|---|
| `main` | Updater en un worker thread de Bare | Programas de vida larga (TUIs, REPLs, servicios) que mantienen la lógica P2P fuera del hilo principal |
| `variant/single-thread` | Updater en el proceso principal | Vida larga, sin hilo aparte |
| `variant/daemon` | Daemon separado actualiza en segundo plano; el comando retorna ya | One-shot cortos (tipo `git`): el comando sale mientras el daemon actualiza |

> En la variante `daemon`, los errores van a `<storage>/updates.log`, no a la terminal. Míralo ahí
> cuando las updates parezcan muertas.

### Comandos base

```bash
curl -fsSL https://install.pears.com/pear.sh | sh     # instalar Pear CLI (mac/linux)
# Windows: irm https://install.pears.com/pear.ps1 | iex

git clone https://github.com/holepunchto/hello-pear-bare
cd hello-pear-bare && npm install

pear touch          # genera tu link de upgrade -> pégalo en "upgrade" de package.json (si no, INVALID_URL)
npm start           # dev, updates desactivadas
npm run make        # binario standalone en out/<platform>-<arch>
pear --menu         # (3.2.0+) explorador de comandos con formulario de flags
```

---

## 2. Frontera dura: qué NO puede cerrar un cloud agent solo

Los cloud agents corren en VMs Ubuntu efímeras. **Pueden** escribir el código, la lógica P2P y el
pipeline, correr tests y compilar. **No pueden** cerrar de forma fiable:

- `pear stage` / `pear seed` — el seeding es un **proceso vivo** que hay que mantener encendido, con
  identidad y red reales.
- La verificación de `pear install pear://<key>` **desde una máquina limpia** distinta.
- Mantener el `pear://` link sembrado durante el juzgamiento.

**Esto lo hace una máquina real de Jonatin o Julián.** El cloud agent deja todo listo y probado hasta
donde la VM permite, y **anota en `HANDOFF.md`** el paso de deploy/seed que queda para la máquina
humana. Es el límite real del track, no un fallo. Ocultarlo = perder en el paso de install.

---

## 3. Cuentas y accesos

| Servicio | Estado | Quién lo tiene | Nota |
|---|---|---|---|
| **Pear CLI** | `[verificar en vivo]` | Jonatin / Julián | Instalada en una máquina real, `command -v pear` responde |
| **GitHub** | `[verificar]` | Repo público de la entrega | Público desde el primer commit. Cero secretos |
| **Cursor Cloud Agents** | `[verificar]` | Jonatin / Julián | Dos agentes en paralelo (Agent-A / Agent-B). Ver `.cursor/` |
| **Keet** (soporte Pear) | Canal oficial | — | Pear no tiene Discord. Mentores en la sala de Pear Development en Keet |
| **Máquina(s) para seed** | `[verificar]` | Jonatin / Julián | Al menos una encendida y sembrando durante el juzgamiento |

### Falta confirmar en Fase 0

- [ ] Pear CLI instalada y `pear touch` genera link real (no el placeholder).
- [ ] Cuál/es máquina/s quedan sembrando durante dom 13:00–17:00 (ARG).
- [ ] Repo público creado y con acceso para los dos.
- [ ] En qué plataformas compilamos el binario (mac/linux/win · arch).

---

## 4. MCP disponibles

`[VACÍO POR AHORA — rellenar en Fase 0 si se conecta alguno útil.]`

De momento no dependemos de ningún MCP para el producto. Si en Fase 0 se decide usar alguno, va aquí
con su para-qué, y solo se usa si está en esta tabla.

---

## 5. Herramientas locales — verificar antes de Fase 1

| Herramienta | Versión | Nota |
|---|---|---|
| Pear CLI | `[verificar]` | 3.2.0+ para `pear --menu` |
| Node / npm | `[verificar]` | Para el tooling (Bare ≠ Node, pero el toolchain usa npm) |
| git | `[verificar]` | |
| ffmpeg | `[verificar]` | Para cortar/comprimir el video de 3 min |

---

## 6. Documentación oficial de Pear (aterriza aquí, no en tu memoria)

- Docs home: https://docs.pears.com/
- Getting started: https://docs.pears.com/getting-started/
- **hello-pear-bare (guía):** https://docs.pears.com/getting-started/from-a-template/start-from-hello-pear-bare/
- **hello-pear-bare (repo):** https://github.com/holepunchto/hello-pear-bare
- Instalar Pear CLI: https://install.pears.com
- Release & distribute: https://docs.pears.com/how-to/operate-an-app/
- Manual deployment: https://docs.pears.com/how-to/operate-an-app/manual-deployment/
- Build & package: https://docs.pears.com/how-to/operate-an-app/build-and-package/
- Seeding / blind peering: https://docs.pears.com/explanation/availability-and-blind-peering/
- Release pipeline explicado: https://docs.pears.com/explanation/deployment-releasing-apps-p2p/
- Pear OTA / runtime API: https://docs.pears.com/reference/pear/runtime/
- Pear CLI reference: https://docs.pears.com/reference/pear/cli/
- Conectar a peers (HyperDHT, Hyperswarm): https://docs.pears.com/how-to/connect-to-peers/
- Store & replicate (Hypercore, Corestore, Hyperbee): https://docs.pears.com/how-to/store-and-replicate/
- Stream & share (Hyperdrive): https://docs.pears.com/how-to/stream-and-share-media/
- Bare runtime API: https://docs.pears.com/reference/bare/runtime/
- Módulos Pear: https://docs.pears.com/reference/modules/pear-modules/
- Módulos Bare: https://docs.pears.com/reference/modules/bare-modules/
- Troubleshooting: https://docs.pears.com/how-to/troubleshooting/
- **`swap`** (ejemplo de referencia del reto — evergreen one-shot CLI): https://github.com/holepunchto/swap
- **`ble-swarm`** (bonus, experimental): https://github.com/mafintosh/ble-swarm
