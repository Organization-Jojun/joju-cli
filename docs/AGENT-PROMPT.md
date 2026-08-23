# Prompt for your coding agent

Copy the fenced block below into Cursor, Claude, Copilot, etc. Fill `ROOM` if you already agreed a room name with the other person. Leave it as `aleph` if you did not.

The agent should **install Jojun on this machine and leave it runnable**. It should not redesign the product.

---

```
Install and launch Jojun on THIS computer. Do not wait for a human. Do not invent a different app. Do not regenerate any pear:// link.

## What Jojun is
A room clipboard: two laptops Connect to the same room name, one Sends, the other Receives. No Discord, USB, or server. Runtime is Bare + Pear, not Node.js for the app itself. Repo: https://github.com/Organization-Jojun/joju-cli
Pear link (do not change): pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo

Room name to use with the other PC (same spelling and case on both sides):
ROOM=aleph

## Constraints
- Do NOT set JOJUN_USE_MOCK_P2P. That is practice-on-one-PC and will not talk to a friend.
- Interactive UI must show “two PCs (network)” / “dos PCs (red)”, never “this PC only”.
- If Pear install hangs, the owner may not be seeding. Fall back to building from git (below). Do not loop forever.
- Need Node + git for the source fallback. Need a real terminal (TTY) to run `jojun` interactively.

## 1. Detect OS
Print: OS, arch (arm64 vs x64), whether `pear` and `jojun` are already on PATH.

## 2. Install Pear CLI if missing
- macOS / Linux: curl -fsSL https://install.pears.com/pear.sh | sh
  Then put pear on PATH (installer prints it; often ~/.local/bin or ~/.pear/bin). New shell. `pear -v` → v3.x
- Windows (PowerShell): irm https://install.pears.com/pear.ps1 | iex
  Binary is often %LOCALAPPDATA%\Programs\pear\pear.exe

## 3. Get a working `jojun` binary

### Windows (preferred: Pear)
  pear install pear://ta114oog37s3wfdwmp6wz7x4uucjoxckd7t4acxns7s33xbc7oeo
  Binary: %LOCALAPPDATA%\Programs\Jojun\jojun.exe
  If `jojun` is unknown: run that exe once (it can append its folder to user PATH without setx). Then open a NEW terminal.
  If pear install fails or times out: git clone the repo, npm install, npm run make, copy out\win32-x64\jojun.exe to that Programs\Jojun folder and run it.

### macOS / Linux (native build — the seeded Pear release is Windows x64)
  git clone https://github.com/Organization-Jojun/joju-cli.git
  cd joju-cli && git checkout main && git pull && npm install && npm test && npm run make
  Binary: ./out/darwin-arm64/jojun  or  ./out/darwin-x64/jojun  or  ./out/linux-arm64/jojun  or  ./out/linux-x64/jojun
  You may `pear install` the same link; it will not give a native Mac/Linux CLI until the owner restages those archs. Prefer the local `out/…/jojun`.
  Optional: copy the binary to a folder on PATH and rename to jojun.

## 4. Smoke (must pass)
Do not use mock env.
  <binary> --no-updates --help
  Then start interactive: <binary> --no-updates
Tell the user: new terminal, type jojun (Windows) or the path to the native binary (Mac/Linux).
First-run: choose B tutorial, pick 2 = two PCs, room = ROOM (or Enter only if the friend also uses test room). Skip remaining tutorial if they already know c / e / r.

## 5. How two people talk (tell the human this, then stop)
Both PCs: Connect (c) to the SAME room name (ROOM).
Receiver: Receive (r) and wait.
Sender: Send message (e), type text.
Status line: “in room”, room name, peers ≥ 1, “two PCs (network)”.
Quit: q. Help: ?
Spanish UI: /language es
There is no server and no history. If nobody is Receiving, Send can be lost.

## 6. If it fails
- Abort trap / crash on first real peer: old binary. Pull main and rebuild (unsubscribe + paste flush landed on main).
- paste delivered:true but the other side empty: old binary without flush, or Receive was not waiting.
- peers stuck at 0: both not on live mode, or different room names, or firewall; Wait (w) up to 30s.
- pear install never finishes: seed is down; use git+make.

Do not open a PR. Do not change product code unless install is broken on this machine.
```
