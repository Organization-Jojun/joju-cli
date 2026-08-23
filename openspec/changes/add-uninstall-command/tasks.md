## 1. PATH removal as a pure transform

- [x] 1.1 Add `removeFromPathValue(pathValue, dir)` to `src/core/path-install.js`, returning the new value and whether an entry was removed, reusing the existing `normalizeDir` for comparison
- [x] 1.2 Preserve every non-matching entry and their relative order; remove all entries matching `dir`, not just the first
- [x] 1.3 Return the input value unchanged, byte for byte, when no entry matches
- [x] 1.4 Handle empty, single-entry, trailing-separator, and mixed-case PATH values, using the platform separator the file already selects via `isWindows`
- [x] 1.5 Add `removeWindowsUserPath(dir)` that reads the user `Path`, applies the transform, and writes it back through the same PowerShell `SetEnvironmentVariable` route as `ensureWindowsUserPath()` — never `setx`
- [x] 1.6 Return `{ removed: false, reason }` on non-Windows, on missing spawn, and on PowerShell failure, matching the shapes `ensureOnPath()` already returns

## 2. Discovery

- [x] 2.1 Create `src/commands/uninstall.js` with a `discover()` that returns facts only and mutates nothing
- [x] 2.2 Resolve the storage directory by calling the existing `resolveStorage()` from `src/core/updater.js` so the `--storage` override and the dev-runtime path are honoured, not reimplemented
- [x] 2.3 Report whether the storage directory exists and list its contents (`session.json`, `last.blob`, `ui.json`, `updates.log`, and anything else present) so the confirmation is informed
- [x] 2.4 On Windows, detect whether the user `Path` holds an entry for Jojun's directory using the existing `pathHasDir`
- [x] 2.5 Locate the executable at the documented install location and record whether it equals `os.execPath()`
- [x] 2.6 Record whether the installation appears to have come from Pear, for the reporting requirement

## 3. Planning

- [x] 3.1 Add a `plan(facts)` that is a pure function of discovery output, returning targets tagged `remove`, `skip`, or `needs-opt-in`, each with a reason
- [x] 3.2 Tag the storage directory and the Windows PATH entry as `remove`; tag an absent target as `skip`
- [x] 3.3 Tag an executable Jojun did not place as `needs-opt-in`, and promote it to `remove` only when the opt-in flag is set
- [x] 3.4 Tag the running executable as requiring manual removal on a platform that locks it, without removing it from the plan
- [x] 3.5 Include the Pear-installation notice as a report-only entry that is never actionable

## 4. Execution and reporting

- [x] 4.1 Add `execute(plan)` that acts only on entries tagged `remove` and never re-derives a target
- [x] 4.2 Leave the room and call the existing `session.clear()` before deleting the storage directory
- [x] 4.3 Remove the storage directory recursively, then the PATH entry, then any opted-in executable
- [x] 4.4 Catch per-target failures, record the reason, and continue with the remaining targets
- [x] 4.5 Emit a per-target outcome — removed, skipped, failed with reason, or manual — for every planned target
- [x] 4.6 Exit non-zero if any target that was planned as `remove` and confirmed did not succeed
- [x] 4.7 Emit the plan and outcomes through the existing `emit()` helper so `--json` matches the other one-shot commands

## 5. Command wiring and safety gates

- [x] 5.1 Register the `uninstall` command in `src/cli/index.js` with `--yes` and `--dry-run` flags, and add it to `ACTIONS`
- [x] 5.2 Route the new subcommand in `bin.mjs` so it parses and exits like the other one-shot commands
- [x] 5.3 Set `flags.noUpdates` for this command before `onBeforeAction` runs, so `spawnUpdaterIfEnabled()` cannot start a daemon that recreates the storage directory
- [x] 5.4 Print the discovery report, then require an interactive confirmation before calling `execute()`
- [x] 5.5 Honour `--yes` as non-interactive confirmation, and make `--dry-run` take precedence over `--yes`
- [x] 5.6 When stdin is not a TTY (via the existing `isInteractive()`) and `--yes` was not given, change nothing and exit non-zero with an explanation
- [x] 5.7 Exit successfully without prompting when discovery finds nothing
- [x] 5.8 Confirm uninstall is reachable only as a one-shot command and is not added to the interactive session's main menu

## 6. Strings and docs

- [x] 6.1 Add the command to `src/cli/help.js` and the static help output
- [x] 6.2 Add strings to `src/cli/i18n/en.js` — report headings, confirmation prompt, per-outcome lines, opt-in notice, manual-removal notice, Pear notice
- [x] 6.3 Add the same keys to `src/cli/i18n/es.js` in Colombian Spanish using `tú`, matching the existing register
- [x] 6.4 Document `jojun uninstall` in the README's one-shot command table, with `--dry-run` as the suggested first step
- [x] 6.5 Replace the ad-hoc removal instructions in `docs/AGENT-PROMPT.md` with the supported command

## 7. Tests

- [x] 7.1 `removeFromPathValue`: multi-entry values, duplicates, trailing separators, mixed case, empty value, single entry, and no-match returning the input unchanged
- [x] 7.2 Order preservation: every surviving entry keeps its relative position
- [x] 7.3 Discovery against a temporary storage directory reports the directory and its contents
- [x] 7.4 Storage resolution: an explicit override targets the override, and the dev-runtime branch resolves under `os.tmpdir()` and never the persistent location
- [x] 7.5 Dry run: the plan lists the storage directory and the directory still exists after the command returns
- [x] 7.6 Confirmation gating: non-interactive without `--yes` changes nothing and exits non-zero; `--dry-run` with `--yes` still changes nothing
- [x] 7.7 Provenance: an executable at an undocumented location is planned as `needs-opt-in` and is not removed by a default confirmed run
- [x] 7.8 Partial failure: one failing target is reported as failed while the others are reported as removed, and the exit status is non-zero
- [x] 7.9 Empty machine: discovery finds nothing, no prompt is issued, exit status is zero

## 8. Verification

- [x] 8.1 Run `npm test` and confirm the existing suite is unaffected
- [x] 8.2 Dry-run the command on a real macOS install and confirm the reported paths match the actual footprint
- [ ] 8.3 On Windows, verify a real `--dry-run`, then a confirmed run: PATH keeps every other entry, storage is gone, and the running `.exe` is reported for manual removal
- [x] 8.4 Confirm the storage directory does not reappear after the command exits, proving no updater daemon was started
- [x] 8.5 Run `npm run lint` and `npm run format`

> 8.3 is not done: it needs a Windows machine. Everything it covers is exercised elsewhere — the PATH transform is unit-tested cross-platform (group 7.1/7.2), and the running-executable rule is unit-tested via `plan()` — but the real PowerShell read/modify/write in `removeWindowsUserPath()` has never been executed. Run it on Windows before release.
> Pre-existing on `main`, not introduced here: test 21 (`pathHasDir` fed Windows-shaped PATH strings) fails on macOS, and `prettier . --check` fails repo-wide.
