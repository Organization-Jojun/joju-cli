# Prompt for your coding agent

Copy the fenced block below into Cursor, Claude, Copilot, etc. Fill `ROOM` if you already agreed a room name with the other person. Leave it as `aleph` if you did not.

The agent should **install Jojun on this machine and leave it runnable**. It should not redesign the product.

---

```
Install and launch Jojun on THIS computer. Do not wait for a human. Do not invent a different app.

## What Jojun is
A room clipboard: two laptops Connect to the same room name, one Sends, the other Receives. No Discord, USB, or server.
Repo: https://github.com/Organization-Jojun/joju-cli
Install is from GitHub Releases (no Pear, no seed window).

Room name to use with the other PC (same spelling and case on both sides):
ROOM=aleph

## Constraints
- Do NOT set JOJUN_USE_MOCK_P2P. That is practice-on-one-PC and will not talk to a friend.
- Interactive UI must show “two PCs (network)” / “dos PCs (red)”, never “this PC only”.
- Need a real terminal (TTY) to run `jojun` interactively.

## 1. Detect OS
Print: OS, arch (arm64 vs x64), whether `jojun` is already on PATH.

## 2. Install from GitHub Releases

### Windows (PowerShell)
  irm https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/scripts/install.ps1 | iex
  Binary: %LOCALAPPDATA%\Programs\Jojun\jojun.exe
  Run that exe once so it can append its folder to user PATH (never uses setx). Open a NEW terminal.

### macOS / Linux
  curl -fsSL https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/scripts/install.sh | bash
  Binary: ~/.local/bin/jojun
  Open a new terminal if that folder was just added to PATH.
  First run on Apple Silicon may ad-hoc codesign the Mach-O then exec it.

### Fallback (no release yet / network blocked)
  git clone https://github.com/Organization-Jojun/joju-cli.git
  cd joju-cli && npm install && npm run make
  Windows: copy out\win32-x64\jojun.exe to %LOCALAPPDATA%\Programs\Jojun\
  macOS: copy out/darwin-arm64/jojun to ~/.local/bin/jojun
  Linux: copy out/linux-x64/jojun to ~/.local/bin/jojun

## 3. Smoke (must pass)
  jojun --no-updates --help
  jojun --no-updates
Tell the user: new terminal, type jojun.
First-run: choose B tutorial, pick 2 = two PCs, room = ROOM (or Enter only if the friend also uses test room). Skip remaining tutorial if they already know c / e / r.

## 4. How two people talk (tell the human this, then stop)
Both PCs: Connect (c) to the SAME room name (ROOM).
Receiver: Receive (r) and wait.
Sender: Send message (e), type text.
Status line: “in room”, room name, peers ≥ 1, “two PCs (network)”.
Quit: q. Help: ?
Spanish UI: /language es
There is no server and no history. If nobody is Receiving, Send can be lost.

## 5. Updates
  jojun update --check
  jojun update

## 6. Removing it again
  jojun uninstall --dry-run
  jojun uninstall
It deletes its storage dir and, on Windows, only its own user PATH entry.
A binary not in the documented install location is reported but kept; add --binaries to remove it too.

Do not open a PR. Do not change product code unless install is broken on this machine.
```

---

Maintainers / release agents: see [RELEASE.md](RELEASE.md) for how to ship a new version so `jojun update` keeps working.
