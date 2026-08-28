# Jojun

<p align="center">
  <img src="docs/banner-cli/jojun-banner.svg" alt="Jojun CLI splash: pixel pigeon and JOJUN wordmark" width="720" />
</p>

<p align="center"><strong>Paste here. Receive there. Same room. No Discord, USB, or server.</strong></p>

Jojun is a **room clipboard** for two laptops: you **Connect** to a shared name, **Send** a snippet on one PC, **Receive** it on the other. Under the hood that is Hyperswarm `join` / `paste` / `yank`. Binaries ship via **GitHub Releases**.

---

## Install

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/scripts/install.ps1 | iex
```

Binary: `%LOCALAPPDATA%\Programs\Jojun\jojun.exe`. Run it once so Jojun can append that folder to your **user PATH** (it does not use `setx`, which truncates PATH). Open a **new** terminal, then:

```powershell
jojun
```

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/scripts/install.sh | bash
```

Binary: `~/.local/bin/jojun`. Open a new terminal if PATH was just updated. On Apple Silicon the release file is a small launcher that ad-hoc `codesign`s the Mach-O on first run.

### Coding agent

Paste [docs/AGENT-PROMPT.md](docs/AGENT-PROMPT.md) into Cursor / Claude. Agree a **room name** first.

### Update

```bash
jojun update --check
jojun update
```

---

## Use it (interactive)

Default language is **English**. Colombian Spanish: `/language es` or `/idioma es`. Stored in `ui.json`.

| You see | Key | Slash | Technical |
|---|---|---|---|
| Connect | `c` / `1` | `/connect` `/conectar` | `join` |
| Send message | `e` / `2` | `/send` `/enviar` | `paste` |
| Receive (replay) | `r` / `3` | `/receive` `/recibir` | `yank` |
| Wait for the other | `w` / `4` | `/wait` `/esperar` | `wait` |
| Disconnect | `d` / `5` | `/disconnect` `/desconectar` | `leave` |

`?` help · `q` / Ctrl+C quit · `/settings` · `/advanced`.

Two PCs: both **Connect** to the **same room name**, then **Send**. Messages can appear automatically on the other PC. Keep pastes to a snippet (one write on the wire).

---

## Scripts (one-shot)

| Command | What it does |
|---|---|
| `jojun join <topic>` | Join a 64-hex Hyperswarm topic |
| `echo hello \| jojun paste` | Send stdin (waits for a peer) |
| `jojun yank` | Last blob to **stdout** |
| `jojun wait` | Block until a peer |
| `jojun leave` | Leave and clear local session |
| `jojun keys` | Print: join paste yank wait leave |
| `jojun update` | Install latest GitHub Release for this OS |
| `jojun uninstall` | Remove Jojun from this machine (asks first) |
| `jojun --menu` | Numbered 1–5 menu, then exit |

Flags: `--no-updates` · `--storage <dir>` · `--json` · `--timeout` / `-t` · `--help` · `--version`.

```bash
jojun uninstall --dry-run
jojun uninstall
```

Test room hex (Enter in the UI):

```
68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000
```

---

## Team

| Person | Role |
|---|---|
| **Jonatin** ([Jonathanrbt](https://github.com/Jonathanrbt)) | Product, CLI, Windows binary |
| **Julián (Julidev)** | Hyperswarm layer, packaging |

Repo: [Organization-Jojun/joju-cli](https://github.com/Organization-Jojun/joju-cli) (Apache-2.0).

---

## Stack

| Piece | What we use |
|---|---|
| Runtime | [Bare](https://docs.pears.com/) (`bare-build` standalone binary) |
| Parser | [`paparam`](https://github.com/holepunchto/paparam) |
| Product P2P | [Hyperswarm](https://docs.pears.com/how-to/connect-to-peers/) topic |
| Distribute | GitHub Releases + `scripts/install.sh` / `install.ps1` |
| Self-update | `jojun update` (GitHub Releases API + SHA-256) |
| Banner | Pixel grid from [`docs/banner-cli`](docs/banner-cli) |
| Tests | `brittle` via `bare-runtime` |

---

## Develop from source

```bash
git clone https://github.com/Organization-Jojun/joju-cli.git
cd joju-cli
npm install
npm test
npm start          # TTY session, updates off
```

```powershell
node .\node_modules\bare-runtime\bin\bare bin.mjs --no-updates
```

Local binary: `npm run make` → `out/<platform>-<arch>/jojun[.exe]`.

Smoke: `powershell -File scripts\smoke-windows.ps1`  
DHT test (can flake): `npm run test:p2p`

---

## Release (maintainers / agents)

Full checklist (bump → tag → verify update): **[docs/RELEASE.md](docs/RELEASE.md)**. Short guide: [guia-despliegue-cli.md](guia-despliegue-cli.md).

```bash
# bump package.json version, merge to main, then:
git tag -a v0.1.2 -m "v0.1.2 — …"
git push origin v0.1.2
# GitHub Actions builds, packs, and publishes the Release
```

Local pack (after `npm run make` on each host you have):

```bash
npm run pack-release   # → dist-release/
```

---

## Layout

```
bin.mjs                 entry (session vs one-shot)
src/cli/                splash, i18n, slash, tutorial, session
src/commands/           join paste yank wait leave uninstall update
src/core/               session files, PATH helper, update glue
src/contracts/          CLI ↔ P2P (setUseMock)
src/p2p/                Hyperswarm + mock
src/update/             GitHub Releases client, checksums, install targets
scripts/install.sh      Unix installer
scripts/install.ps1     Windows installer
scripts/pack-release-asset.js
docs/AGENT-PROMPT.md    paste into a coding agent to install Jojun
docs/RELEASE.md         how to ship a new version
```
