## Context

See proposal.md — Why, for motivation. The constraints that shape the approach:

**The install side is asymmetric.** `ensureOnPath()` in `src/core/path-install.js` returns `{ added: false, reason: 'not-windows' }` on every non-Windows platform. So on macOS and Linux Jojun has *never* placed a binary or touched PATH — the `~/.local/bin/jojun` a user is likely to have came from `docs/AGENT-PROMPT.md:47` telling an agent to copy it there. Uninstall cannot delete from a list of paths it assumes it wrote, because on two of three platforms it wrote none of them.

**Storage resolution already has three cases.** `resolveStorage()` in `src/core/updater.js` returns `flags.storage` if given, `os.tmpdir()/pear/<appName>` under a dev runtime, and `persistent()/<appName>` otherwise. Uninstall must go through the same function rather than reimplementing it; the dev case in particular is what stops `npm start`-style invocation from deleting a real user's data.

**The updater races the deletion.** `spawnUpdaterIfEnabled()` is called from the `onBeforeAction` hook wired in `bin.mjs` for every command. It calls `App.spawnUpdater(dir, …)` with the storage dir, and `src/update/logger.js` writes `updates.log` there. Left alone, uninstall would delete the directory and have a detached daemon recreate it moments later.

**The PATH write is the sharpest edge in the product.** `ensureWindowsUserPath()` builds a PowerShell script that reads the user `Path`, appends, and writes it back with `SetEnvironmentVariable`. The file already carries the warning about never using `setx` because it truncates. Removal writes the same value with one entry taken out — same blast radius, and unlike the append, a bug here deletes entries rather than adding one.

## Goals / Non-Goals

**Goals:**
- Discovery and reporting that is truthful about what Jojun actually created versus what it merely found
- A plan/confirm/execute split, so that the destructive step operates on an already-printed list
- PATH removal whose string logic is testable without touching a real environment
- Honest partial failure — never abandon the remaining targets because one failed

**Non-Goals:**
- Uninstalling Pear, or calling the `pear` CLI at all. Decided with the user; the command reports Pear's involvement and stops there.
- Scheduling a delayed self-delete on Windows via a helper process or a reboot-time queue. Reporting the path for manual removal is the accepted behavior.
- Exposing uninstall in the interactive session's main menu. It is a one-shot command only — a destructive action does not belong one keypress away from `Send` and `Receive`.

## Decisions

### Three phases, with the destructive one operating only on the plan

`discover()` → `plan()` → `execute()`, as separate functions in `src/commands/uninstall.js`.

`discover()` does pure filesystem and environment inspection and returns facts. `plan()` turns facts into a list of targets, each tagged with an action (`remove`, `skip`, `needs-opt-in`) and a reason. `execute()` walks the plan and does nothing that is not already in it.

This is what makes the spec's dry-run and confirmation requirements structural rather than a matter of remembering an `if`. Dry-run is `execute()` never being called; the confirmation prompt prints the same plan object that `execute()` will consume, so what the user is shown and what is acted on cannot drift. It also makes the interesting logic testable without deleting anything: `plan()` is a pure function of `discover()`'s output.

*Alternative considered:* a single pass that checks and deletes as it goes. Rejected — the user would be confirming a prediction rather than a plan, and each new target would be another place to remember the dry-run check.

### Provenance decides what may be deleted, and it is inferred, not recorded

A target is auto-removable only if Jojun created it. Jojun keeps no install manifest, so provenance is inferred from what the code is known to do:

| Target | Provenance | Default action |
|---|---|---|
| Storage directory | Always Jojun's — created by `session.ensureDir()` / prefs / updater log | remove |
| Windows user-PATH entry matching Jojun's directory | Written by `ensureWindowsUserPath()` | remove |
| Executable at `os.execPath()`'s directory on Windows under `%LOCALAPPDATA%\Programs\Jojun` | Placed by Pear install or by the documented copy step | remove, subject to the running-executable rule |
| Any other `jojun` found on PATH | Unknown — the manual copy from the agent prompt | needs-opt-in |

The honest position is that Jojun does not know it created the last row, so it does not delete it. Writing an install manifest at first run would give real provenance, but it only helps installs that happen *after* this change ships — every machine Jojun is on today would still need the inference path. Not worth two mechanisms.

*Alternative considered:* delete any `jojun` found on PATH. Rejected — it deletes a file the product never created, on a guess, with no undo.

### PATH removal is a pure string transform, executed separately

`src/core/path-install.js` gains `removeFromPathValue(pathValue, dir)` — a pure function returning the new value and whether anything was removed — plus a thin `removeWindowsUserPath(dir)` that reads the user `Path`, applies the transform, and writes it back through the same PowerShell/`SetEnvironmentVariable` route `ensureWindowsUserPath()` already uses.

Splitting them is the whole point. The spec's requirements about preserving other entries, preserving order, and matching case- and trailing-separator-insensitively are all properties of the string transform, and as a pure function they are testable in `test/index.js` on any platform, including the macOS and Linux machines where the PowerShell path never runs. The existing `normalizeDir` and `pathHasDir` helpers already implement exactly the comparison semantics the removal needs, so the transform reuses them rather than writing a second notion of "same directory".

The read-modify-write is not atomic — another process could write `Path` in between. Accepted: this is a manual, user-initiated, once-in-a-lifetime operation, and the existing append has the identical exposure.

### Uninstall opts out of the updater explicitly

`bin.mjs` must not call `spawnUpdaterIfEnabled()` for this command. Rather than adding a special case inside the shared `onBeforeAction` hook, uninstall sets `flags.noUpdates` before the hook runs, reusing the `ensureUpdatesFlag()` path that `--no-updates` already goes through.

Same effect, but it travels the route the codebase already has for "this invocation must not spawn a daemon", instead of adding a second, command-specific one that a future command would have to know to imitate.

### Leave the room before deleting, and reuse `session.clear()`

`execute()` calls the existing leave path first — `contracts.leave()` tears down the swarm and `session.clear()` unlinks `session.json` and `last.blob` — and only then removes the directory itself. Deleting the directory out from under a live swarm risks a write recreating it, and `session.clear()` already swallows missing-file errors, so it is safe to call unconditionally.

### Windows cannot delete its own running executable

On Windows the file is locked while it runs, so a self-uninstall started from `jojun.exe` cannot remove that `jojun.exe`.

The command detects the case by comparing the target against `os.execPath()` and reports it as requiring manual removal, with the absolute path printed — while still removing storage and the PATH entry. The user ends up with an orphaned `.exe` in a folder no longer on PATH, which is inert.

*Alternative considered:* spawn a detached helper that waits for the process to exit and then deletes, or queue a reboot-time delete. Both are how real installers do it. Rejected here: a detached process that deletes a file after the user's uninstall has apparently finished is exactly the shape of thing that is hard to reason about when it goes wrong, and the payoff is removing one inert file.

## Risks / Trade-offs

**Corrupting the user's Windows PATH** → The highest-consequence failure in the change. Mitigated by making the transform pure and testing it directly against multi-entry values, duplicate entries, empty values, trailing separators, and mixed case; by reusing the existing comparison helpers rather than writing new ones; by leaving the value byte-for-byte untouched when no entry matches; and by never using `setx`.

**Deleting data a user still wanted** → `last.blob` may hold the only copy of something they just received. Mitigated by discovery reporting the storage directory's contents before the prompt, so the confirmation is informed rather than blind.

**Inferred provenance is wrong in both directions** → It can flag a Jojun-placed binary as needing opt-in, or auto-remove one at the expected Windows location that the user actually put there. The first is merely conservative. The second is bounded by only auto-removing at the one location the install path documents, and by the plan being printed before confirmation.

**A dev-runtime invocation targeting real storage** → Would delete a user's data from a source checkout. Mitigated by routing through the existing `resolveStorage()` rather than recomputing the path, and by a test asserting the dev branch resolves under `os.tmpdir()`.

**Partial failure leaving a confusing half-state** → Mitigated by the per-target outcome reporting the spec requires, a non-zero exit when any confirmed target failed, and printing the remaining paths so a user can finish by hand.

## Migration Plan

Additive: a new command, no change to existing command behavior, nothing new written to disk. Rollback is reverting the change.

Sequencing note — `docs/AGENT-PROMPT.md` and the README currently teach the ad-hoc `rm -rf` approach. Those should be updated in the same release that ships the command, so the documented removal path and the supported one do not disagree.

## Open Questions

- Whether the discovery step should also search the directories on `PATH` for stray `jojun` executables, or only check the documented install locations. Searching finds more and is friendlier; it also means scanning arbitrary user directories. This affects only how many entries appear in the `needs-opt-in` row of the plan — none of them are deleted by default, so the specs, the phase split, and the task breakdown hold either way.
