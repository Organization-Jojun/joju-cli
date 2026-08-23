# Jojun

**Paste on one machine. Yank on the other. No Discord, no USB, no server.**

Jojun is a CLI for a room full of laptops: you join a shared Hyperswarm topic, `paste` a snippet from stdin on one machine, and `yank` it to stdout on another. Run `jojun` in a TTY for a long-lived session (splash + slash commands). Scripts still use one-shot `join` / `paste` / `yank`. The binary is a Pear app (`variant/daemon`) so it installs with `pear install pear://…` and updates itself over P2P OTA.

Built for the **[Aleph 2026 Pears Track](https://docs.pears.com/)** (sponsor Tether).

---

## Why it exists

At a hackathon you constantly need to move a small blob — a key, a snippet, a log line — between two machines. Chat apps are noisy. USB is slow. A server is a single point of failure and extra accounts.

Jojun is a **room clipboard**: same 32-byte topic hex on both sides, paste here, yank there. If the other peer is not online, the stream is gone (no Hypercore disk). That is intentional for the MVP.

The Pear requirement is not decoration: **if `pear install` and OTA do not work, the entry does not count.** The CLI is the product; the pipeline is the ticket to judging.

### UI / UX / DX

The Pears template is **`variant/daemon`**: one-shot commands do one thing and **exit** (required for the updater sidecar). Interactive craft lives in a **separate session** that stays open until you quit.

- **`jojun`** / **`jojun ui`** / **`jojun tui`** in a TTY: splash (carrier pigeon), slash commands, keybindings. OTA daemon is **off** in that session so it does not paint over the TTY.
- **`--menu`**: old one-shot numbered menu (1–5) then exit.
- One-shot **`join` / `paste` / `yank` / `wait` / `leave`** for scripts and Pear process shape.
- `--help` / `keys` list the five actions.
- Windows launcher **`jojun.cmd`**.
- Pear 3.2+ also has `pear --menu`.

---

## Team

| Person | Role |
|---|---|
| **Jonatin** ([Jonathanrbt](https://github.com/Jonathanrbt)) | Product, CLI (`join` / `paste` / `yank` / `wait` / `leave`), Windows binary, seed during judging |
| **Julián (Julidev)** | P2P Hyperswarm layer, Pear `stage` / `seed` scripts, OTA daemon shape |

Repo: [Organization-Jojun/joju-cli](https://github.com/Organization-Jojun/joju-cli) (Apache-2.0).

---

## Stack

This is **not Node.js at runtime**. The CLI runs on **Bare** inside **Pear**.

| Piece | What we use |
|---|---|
| Runtime | [Pear](https://docs.pears.com/) + [Bare](https://docs.pears.com/reference/bare/runtime/) |
| Template | [`hello-pear-bare`](https://github.com/holepunchto/hello-pear-bare) branch **`variant/daemon`** (command exits; updater is a sidecar daemon) |
| CLI parser | [`paparam`](https://github.com/holepunchto/paparam) |
| Product P2P | [Hyperswarm](https://docs.pears.com/how-to/connect-to-peers/) topic (join / send / recv) |
| OTA | `pear-runtime` + `package.json` field `upgrade` |
| Bare modules | `bare-fs`, `bare-os`, `bare-path`, `bare-process`, `bare-stdio`, `bare-env`, `bare-storage`, `bare-daemon` |
| Tests | `brittle` via `bare-runtime` |
| Package | `bare-build` → `out/<platform>-<arch>/` |

**Out of MVP (on purpose):** Herdr clone, Hypercore, Hyperdrive, BLE-Swarm. Interactive mode is a scroll-log session (no Ink, no Node `fs`).

---

## What the CLI does

One-shot invocations do work and **exit**. Session (last topic + last blob) lives under `--storage`. The interactive mode is the exception: it stays open until `q` / `/quit`.

Shared fixture topic (64 hex chars = 32 bytes):

```
68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000
```

| Command | What it solves |
|---|---|
| `join <topic>` | Remember and join that Hyperswarm topic |
| `paste` | Read **stdin**, wait for a peer, broadcast the blob |
| `yank` | Write the last received blob to **stdout** (waits if needed) |
| `wait` | Block until another peer is on the topic |
| `leave` | Drop the topic and clear local session |
| `keys` | Print the five actions (join, paste, yank, wait, leave) |

Global flags:

| Flag | Meaning |
|---|---|
| `--no-updates` | Do not spawn the OTA daemon this run (use in dev) |
| `--storage <dir>` | Where session + updater state live |
| `--json` | Status as one JSON line (`yank` still prints raw bytes) |
| `--help` / `-h` | Help |
| `--version` / `-v` | Version |
| `--menu` | One-shot numbered menu (1–5), then exit |
| `--timeout` / `-t` | On `paste`, `yank`, `wait` — how long to wait (ms) |

Typical flow **two machines, same topic**:

1. Both: `join <topic>`
2. Receiver: `yank` (waits for bytes)
3. Sender: pipe something into `paste`
4. Receiver stdout is the blob

### Interactive mode

Default language is **English** (for judges). Colombian Spanish: `/language es` or `/idioma es` (tú, not vos). Persists in `ui.json`.

First question: already set up, or start from scratch (numbered tutorial). Tutorial can switch practice (this PC only) vs two PCs **without env vars**.

Room names (Enter = test room) map to the fixture topic under the hood. Hex is under `/advanced`.

```powershell
node .\node_modules\bare-runtime\bin\bare bin.mjs --no-updates ui
```

| You see | Runs |
|---|---|
| Connect / Conectar (`c`, `/connect`) | `join` |
| Send message / Enviar (`e`, `/send`) | `paste` |
| Receive / Recibir (`r`, `/receive`) | `yank` |
| Wait / Esperar (`w`) | `wait` |
| Disconnect / Desconectar (`d`) | `leave` |

`?` help · `q` quit · `1`–`5` same as the five actions · `/settings` room, mock/live, wait, language. Expert aliases: `/join` `/paste` `/yank` `/leave`.

---

## Install (judges / clean machine)

Pear CLI first: https://install.pears.com

```bash
pear install pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo
```

Someone must be **seeding** that link (`npm run seed`) for the whole judging window. Seed host: Jonatin (Windows).

OTA errors go to `<storage>/updates.log`, not the terminal (`variant/daemon`).

---

## Develop from source

```bash
git clone https://github.com/Organization-Jojun/joju-cli.git
cd joju-cli
npm install
npm test          # unit + mock swarm (no DHT)
npm start         # interactive session (TTY) with updates off
```

Run a command with Bare (updates off):

```bash
# macOS / Linux
node ./node_modules/bare-runtime/bin/bare bin.mjs --no-updates --help

# Windows (PowerShell)
node .\node_modules\bare-runtime\bin\bare bin.mjs --no-updates --help
```

### Mock (one terminal, no network)

```powershell
$env:JOJUN_USE_MOCK_P2P = "1"
$storage = "$env:TEMP\jojun-dev"
$topic = "68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000"
$bare = ".\node_modules\bare-runtime\bin\bare"

node $bare bin.mjs --no-updates --storage $storage join $topic
"hello jojun" | node $bare bin.mjs --no-updates --storage $storage paste
node $bare bin.mjs --no-updates --storage $storage yank
```

### Real Hyperswarm (two terminals)

Do **not** set `JOJUN_USE_MOCK_P2P`. Use **different** `--storage` dirs. Start `yank` on A, then `paste` on B.

Windows smoke script: `powershell -File scripts\smoke-windows.ps1`

P2P integration test (needs DHT; can flake on VMs):

```bash
npm run test:p2p
```

---

## Standalone binary

```bash
npm run make
```

Output: `out/<os>-<arch>/` — on Windows x64 that is `out/win32-x64/jojun.exe`.

```powershell
.\out\win32-x64\jojun.exe --no-updates --help
.\out\win32-x64\jojun.exe --no-updates join 68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000
```

---

## Release pipeline (Pear)

`upgrade` in `package.json` (do not regenerate unless you know why):

`pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo`

```bash
npm run stage -- --dry-run
npm run stage
npm run seed          # long-lived; keep running while people pear install
```

Windows Pear binary is typically:

`%LOCALAPPDATA%\Programs\pear\pear.exe`

---

## Layout

```
bin.mjs            entry (paparam + updater spawn)
app.js             Pear updater daemon (variant/daemon)
src/commands/      join paste yank wait leave
src/cli/           command tree
src/core/          stdin/stdout, session, updater helpers
src/contracts/     adapter CLI ↔ P2P
src/p2p/           Hyperswarm room + offline mock
src/deploy/        pear stage/seed wrappers
src/update/        updates.log helper
```

More product rules: [`PROYECTO.md`](PROYECTO.md). Clock / ownership: [`docs/PLAN.md`](docs/PLAN.md).
