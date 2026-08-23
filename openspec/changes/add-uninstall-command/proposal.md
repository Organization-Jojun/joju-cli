## Why

Jojun can install itself but cannot remove itself. It creates a persistent storage directory (`session.json`, `last.blob`, `ui.json`, `updates.log`), and on Windows `ensureOnPath()` writes an entry into the user's `Path` environment variable on first run. Nothing in the product undoes either.

Today the only way out is to hand someone a list of `rm -rf` commands against paths they have to work out for themselves — and those paths differ per platform, shift if `--storage` was used, and include a Windows registry-backed PATH edit that is genuinely risky to do by hand. A user who wants Jojun gone is currently asked to guess, with `rm -rf` in the guess.

The removal is also not symmetric with the install. On macOS and Linux `ensureOnPath()` returns early and does nothing, so the `~/.local/bin/jojun` a user is likely to have came from `docs/AGENT-PROMPT.md` telling them to "copy the binary to a folder on PATH and rename to jojun" — a copy Jojun never made and cannot assume the location of. Uninstall therefore has to **discover** what is on the machine and show it, not delete a hardcoded list.

## What Changes

- New one-shot command `jojun uninstall` that removes Jojun's own footprint and exits, following the same `variant/daemon` shape as the existing `join` / `paste` / `yank` / `wait` / `leave` commands.
- The command first **discovers and reports** what it found on this machine before removing anything: the resolved storage directory and its contents, the Windows user-PATH entry if Jojun added one, and any Jojun binary it can locate.
- Removal requires explicit confirmation. `--yes` skips the prompt for scripted use; `--dry-run` reports the full plan and removes nothing; `--json` emits the plan and the outcome in the machine-readable shape the other commands already use.
- Binaries found on PATH that Jojun did not place — the manual `~/.local/bin/jojun` copy, for one — are **reported but not deleted by default**, because Jojun has no record of creating them. Removing them requires the user to opt in.
- The command leaves the room and clears local session state before deleting, so no live subscription or in-flight write races the removal.
- The command must not spawn the OTA updater daemon, which would otherwise recreate the storage directory and write `updates.log` into it moments after deletion.
- Uninstall reports partial success honestly: each target is reported as removed, skipped, or failed with a reason, and the command exits non-zero if any requested removal failed.
- **Out of scope by decision**: the Pear runtime and Pear's own installed-app entry are never touched. Uninstall removes Jojun's footprint, not Pear. If the app was installed via `pear install`, the command says so and prints what Pear still holds, without acting on it.

## Capabilities

### New Capabilities
- `install-lifecycle`: What Jojun installs on a machine and how it is removed — footprint discovery, the confirmation and dry-run contract, what may and may not be deleted automatically, per-target outcome reporting, and the boundary between Jojun's own footprint and the Pear runtime.

### Modified Capabilities
<!-- None. openspec/specs/ is currently empty, so the existing PATH-registration
     behavior in src/core/path-install.js has no spec to modify; this change
     specifies it as part of the new capability rather than altering it. -->

## Impact

**Code**
- `src/commands/uninstall.js` — new; discovery, planning, confirmation, removal, reporting
- `src/core/path-install.js` — a removal counterpart to `ensureWindowsUserPath()` that strips exactly Jojun's entry from the user `Path` via PowerShell, reusing the existing `normalizeDir` / `pathHasDir` comparison and, as that file already warns, never `setx`
- `src/cli/index.js` — register the command and its `--yes` / `--dry-run` flags
- `bin.mjs` — route the new subcommand, and ensure the `onBeforeAction` hook does not spawn the updater for it
- `src/core/session.js` — reuse the existing `clear()` in the removal path
- `src/cli/help.js`, `src/cli/i18n/en.js`, `src/cli/i18n/es.js` — command listing and strings
- `README.md`, `docs/AGENT-PROMPT.md` — document the supported way to remove Jojun, replacing the ad-hoc `rm -rf` instructions

**Behavior this depends on**
- `resolveStorage()` in `src/core/updater.js` resolves the target directory, including the `--storage` override and the dev-runtime path under `os.tmpdir()`. Uninstall must resolve the same way so a dev checkout cannot delete a real user's storage.

**Platform risk**
- Windows cannot delete a running executable, so a self-uninstall started from the installed binary cannot remove that binary in-place. This is a correctness constraint on the design, not an edge case.
- The PATH edit is the highest-consequence operation in the product. It writes a value that persists outside the app and, done wrong, damages the user's shell environment.

**Tests**
- `test/index.js` — discovery against a temporary storage directory, dry-run removes nothing, confirmation gating, per-target outcome reporting, PATH-string removal logic tested as a pure string transform
