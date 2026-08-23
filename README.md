# Jojun

<p align="center">
  <img src="docs/banner-cli/jojun-banner.svg" alt="Jojun CLI splash: pixel pigeon and JOJUN wordmark" width="720" />
</p>

<p align="center"><strong>Paste here. Receive there. Same room. No Discord, USB, or server.</strong></p>

Jojun is a **room clipboard** for two laptops: you **Connect** to a shared name, **Send** a snippet on one PC, **Receive** it on the other. Under the hood that is Hyperswarm `join` / `paste` / `yank`. The binary is a Pear app (`hello-pear-bare` **`variant/daemon`**): install with `pear install pear://…`, keep it current with P2P OTA.

Built for the **[Aleph 2026 Pears Track](https://docs.pears.com/)** (sponsor Tether).

---

## Install (this is the product)

1. Install the [Pear CLI](https://install.pears.com) if you do not have `pear`.
2. Someone must be **seeding** the link (Jonatin, Windows, whole judging window).
3. Install the app:

```bash
pear install pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo
```

4. Open a **new** terminal (PATH changes do not apply to windows already open).
5. Type:

```bash
jojun
```

On Windows the binary lands at `%LOCALAPPDATA%\Programs\Jojun\jojun.exe`. Pear v3 should add that folder to your **user PATH**. If `jojun` is still unknown, run that `.exe` once: Jojun **appends its own folder** to the user PATH (it does not use `setx`, which truncates PATH). Then open another terminal.

You should see the pixel **pigeon + JOJUN** splash, then a setup question, then the menu. Interactive sessions **do not** spawn the OTA daemon (so it cannot paint over the TTY). One-shot commands still can.

OTA errors go to `<storage>/updates.log`, not the terminal.

### Install via your coding agent

Send someone [docs/AGENT-PROMPT.md](docs/AGENT-PROMPT.md) (or paste the fenced prompt in that file into Cursor / Claude). The agent installs Pear, puts `jojun` on the machine, and tells them Connect / Send / Receive. Agree a **room name** first (same spelling on both PCs). On **Windows**, `pear install` is enough while this link is seeded. On **Mac/Linux**, the agent builds the native binary from `main` (the seeded release is Windows x64).

---

## Use it (interactive)

Default language is **English**. Colombian Spanish: `/language es` or `/idioma es` (`tú`, not vos). Stored in `ui.json`.

First prompt: already set up, or start from scratch (6-step tutorial). Tutorial picks **this PC only** (practice) vs **two PCs** without asking you for env vars. Room **names** (Enter = test room); hex is Advanced only.

| You see | Key | Slash | Technical |
|---|---|---|---|
| Connect | `c` / `1` | `/connect` `/conectar` | `join` |
| Send message | `e` / `2` | `/send` `/enviar` | `paste` |
| Receive | `r` / `3` | `/receive` `/recibir` | `yank` |
| Wait for the other | `w` / `4` | `/wait` `/esperar` | `wait` |
| Disconnect | `d` / `5` | `/disconnect` `/desconectar` | `leave` |

`?` help · `q` / Ctrl+C quit (leaves the swarm) · `/settings` room, practice/network, wait, language · `/advanced` topic hex and script commands. Expert aliases: `/join` `/paste` `/yank` `/leave`.

Two PCs: both **Connect** to the **same room name**. Receiver: **Receive**. Sender: **Send message**.

---

## Scripts (one-shot)

Each of these does work and **exits** (Pear `variant/daemon` shape):

| Command | What it does |
|---|---|
| `jojun join <topic>` | Join a 64-hex Hyperswarm topic |
| `echo hello \| jojun paste` | Send stdin (waits for a peer) |
| `jojun yank` | Last blob to **stdout** |
| `jojun wait` | Block until a peer |
| `jojun leave` | Leave and clear local session |
| `jojun keys` | Print: join paste yank wait leave |
| `jojun --menu` | Numbered 1–5 menu, then exit |
| `jojun uninstall` | Remove Jojun from this machine (asks first) |

Flags: `--no-updates` · `--storage <dir>` · `--json` · `--timeout` / `-t` · `--help` · `--version`.
Root flags go **before** the subcommand: `jojun --json uninstall`.

### Removing Jojun

Always look before you delete:

```bash
jojun uninstall --dry-run   # report the plan, delete nothing
jojun uninstall             # same report, then asks y/N
```

It removes the storage directory (`session.json`, `last.blob`, `ui.json`, `updates.log`) and, on Windows, the user PATH entry Jojun added — every other PATH entry is preserved. A `jojun` binary Jojun did not place (the copy `docs/AGENT-PROMPT.md` suggests putting on your PATH by hand) is **reported but kept**; add `--binaries` to remove those too. `--yes` skips the prompt for scripts.

It never touches the Pear runtime or Pear's own app entry. On Windows a running `jojun.exe` cannot delete itself, so it is reported for manual removal after everything else is gone.

Test room hex (same as Enter in the UI):

```
68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000
```

---

## Why it exists

Hackathon laptops need a small blob moved without chat apps or USB. If the other peer is offline, the stream is gone (no Hypercore). **`pear install` + OTA landing is the hard requirement** of the track.

---

## Team

| Person | Role |
|---|---|
| **Jonatin** ([Jonathanrbt](https://github.com/Jonathanrbt)) | Product, CLI, Windows binary, seed during judging |
| **Julián (Julidev)** | Hyperswarm layer, Pear `stage` / `seed`, OTA daemon shape |

Repo: [Organization-Jojun/joju-cli](https://github.com/Organization-Jojun/joju-cli) (Apache-2.0).

---

## Stack

Runtime is **Bare + Pear**, not Node.js.

| Piece | What we use |
|---|---|
| Template | [`hello-pear-bare`](https://github.com/holepunchto/hello-pear-bare) **`variant/daemon`** |
| Parser | [`paparam`](https://github.com/holepunchto/paparam) |
| Product P2P | [Hyperswarm](https://docs.pears.com/how-to/connect-to-peers/) topic |
| OTA | `pear-runtime` · `package.json` `upgrade` |
| Banner | Pixel grid from [`docs/banner-cli`](docs/banner-cli) (truecolor; mono fallback) |
| Tests | `brittle` via `bare-runtime` |
| Binary | `bare-build` → `out/<platform>-<arch>/jojun` |

Out of MVP: Herdr, Hypercore, Hyperdrive, BLE-Swarm, Ink/React.

---

## Develop from source

```bash
git clone https://github.com/Organization-Jojun/joju-cli.git
cd joju-cli
npm install
npm test
npm start          # TTY session, updates off (not the PATH binary)
```

```powershell
node .\node_modules\bare-runtime\bin\bare bin.mjs --no-updates
```

That is **dev**. The installed product is `jojun` on PATH after `pear install` or after copying `out\win32-x64\jojun.exe` to `%LOCALAPPDATA%\Programs\Jojun\`.

One-shot mock (no DHT):

```powershell
$env:JOJUN_USE_MOCK_P2P = "1"
$storage = "$env:TEMP\jojun-dev"
$topic = "68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000"
$bare = ".\node_modules\bare-runtime\bin\bare"

node $bare bin.mjs --no-updates --storage $storage join $topic
"hello jojun" | node $bare bin.mjs --no-updates --storage $storage paste
node $bare bin.mjs --no-updates --storage $storage yank
```

Interactive practice mode does the same without env vars (`/settings` → mock). Two real PCs: do **not** use mock; same room name; different `--storage` if you run two one-shots on one disk.

Smoke: `powershell -File scripts\smoke-windows.ps1`  
DHT test (can flake): `npm run test:p2p`

### Local `.exe`

```bash
npm run make
```

Windows x64: `out/win32-x64/jojun.exe`. First run can register PATH. Rebuild + copy to `Programs\Jojun` when you want PATH `jojun` to match the repo.

---

## Release (maintainers)

Do **not** `pear stage` the git checkout (it would ship `.git` / `node_modules`). Ship a **pear build** of the standalone binary:

```bash
npm run make
# pear build --package package.json --target <deploy-dir> --win32-x64-app <folder named Jojun containing jojun.exe>
# pear stage pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo <deploy-dir>
npm run seed          # leave running while people pear install
```

Upgrade link (do not regenerate):

`pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo`

Windows Pear CLI: `%LOCALAPPDATA%\Programs\pear\pear.exe`

---

## Layout

```
bin.mjs                 entry (session vs one-shot vs updater)
app.js                  Pear updater daemon
src/cli/                splash, i18n, slash, tutorial, session
src/cli/banner-cells.js pixel art for the splash
src/commands/           join paste yank wait leave
src/core/               session files, PATH helper, updater
src/contracts/          CLI ↔ P2P (setUseMock)
src/p2p/                Hyperswarm + mock
src/deploy/             pear stage/seed wrappers
docs/banner-cli/        pixel splash (SVG for README + ansi / txt / go)
docs/AGENT-PROMPT.md    paste into a coding agent to install Jojun
```

Install-via-agent prompt: [`docs/AGENT-PROMPT.md`](docs/AGENT-PROMPT.md)
