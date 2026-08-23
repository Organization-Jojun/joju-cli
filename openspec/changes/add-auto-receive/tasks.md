## 1. Message state in the contracts seam

- [x] 1.1 Add a bounded history to `src/contracts/swarm.js`: an append-only array of `{ direction, bytes, at }` capped at the 50 most recent entries, oldest dropped first
- [x] 1.2 Tag outgoing messages: `send()` appends an entry with direction `out`, leaving its existing `lastBlob` write and return shape untouched
- [x] 1.3 Tag inbound messages: the `hookMessages()` handler appends an entry with direction `in`, leaving its existing `lastBlob` write untouched
- [x] 1.4 Expose read accessors — the received-only history and the most recent received entry — without changing `getLastBlob()` or `waitForBlob()`
- [x] 1.5 Clear history in `leave()` and in `_resetForTests()` alongside the existing `lastBlob` reset
- [x] 1.6 History sits above both transports in `contracts/`, so the mock exercises it unchanged and no `src/p2p/mock.js` edit was needed. What the mock did require: it echoes its own send to its listeners, so add `onReceived()` — `onMessage()` keeps the raw echo the round-trip tests assert on

## 2. Preference

- [x] 2.1 Add `autoReceive` to `DEFAULTS` in `src/cli/prefs.js`, defaulting to enabled
- [x] 2.2 Confirm the existing merge-over-`DEFAULTS` read path gives an older `ui.json` the default with no migration and no rewrite

## 3. Subscription lifecycle in the session

- [x] 3.1 On successful connect in `src/cli/session.js`, subscribe via `contracts.onMessage()` and retain the returned unsubscribe function
- [x] 3.2 Dispose any existing subscription before creating a new one, so a second connect without a disconnect cannot double-render
- [x] 3.3 Call the unsubscribe function on disconnect/leave and on quit, before `contracts.leave()` resets `messageHooked`
- [x] 3.4 Verify no handler survives a leave by asserting that a message sent after leaving produces no session output

## 4. Rendering and the sub-prompt queue

- [x] 4.1 Add a session depth counter for canonical line reads, incremented and decremented inside `promptLine()` and around the `/` branch of `loopRawMode()`; a counter, not a boolean, because settings and the tutorial nest prompts
- [x] 4.2 Add a pending queue: while the sub-prompt flag is set, inbound messages are appended instead of printed
- [x] 4.3 Flush the queue in arrival order when the sub-prompt resolves or is cancelled, then clear it
- [x] 4.4 Render an inbound message at the main prompt immediately: print the received marker, byte count, and truncated payload using the existing `truncateBlob` helper, then re-write the prompt
- [x] 4.5 Gate rendering — not the subscription — on the `autoReceive` preference, so history keeps filling while the preference is off

## 5. Receive becomes replay

- [x] 5.1 Rework `doReceive()` so that with auto-receive on it reads the most recent received entry from history and returns immediately without calling `runYank()`
- [x] 5.2 With an empty received history, report that nothing has been received yet and point the user at `w` / `/wait`, then return to the prompt without erroring
- [x] 5.3 With auto-receive off, keep the existing blocking path through `runYank()` including the configured wait timeout and its timeout message
- [x] 5.4 Confirm the `r`, `3`, `/receive`, `/recibir`, and `/yank` entry points all route through the reworked `doReceive()`

## 6. Settings and strings

- [x] 6.1 Add an auto-receive toggle to the `/settings` menu that takes effect immediately with no reconnect and persists via `savePrefs`
- [x] 6.2 Add the new strings to `src/cli/i18n/en.js` — inbound message marker, replay result, empty-history message pointing at `wait`, settings toggle label and on/off states
- [x] 6.3 Add the same keys to `src/cli/i18n/es.js` in Colombian Spanish, using `tú`, matching the existing register
- [x] 6.4 Update `src/cli/help.js` and `src/cli/menu.js` so Receive is described as replay rather than receive-and-wait

## 7. Tests

- [x] 7.1 History ordering: three received messages replay in arrival order and the cap drops the oldest past 50
- [x] 7.2 Self-echo: direction tagging records the send as outgoing; suppression is keyed on the transport's `loopsBack`, so practice mode still shows the simulated peer's delivery (decided with the user mid-implementation) and the real transport still filters
- [x] 7.3 Mixed direction: after a local send followed by a peer message, only the peer message appears in the received history
- [x] 7.4 Replay on empty history returns immediately and does not throw
- [x] 7.5 Auto-receive off still records history, and the blocking Receive path still resolves and still times out as configured
- [x] 7.6 Leaving clears history and unsubscribes; a message after leave produces nothing
- [x] 7.7 Regression: `getLastBlob()` and `waitForBlob()` behave exactly as before, including the short-circuit when `lastBlob` is already set

## 8. Compatibility check and docs

- [x] 8.1 Run `npm test` and confirm the pre-existing one-shot assertions still pass unmodified
- [x] 8.2 Run `scripts/smoke-windows.ps1` (or its join/paste/yank sequence) and confirm the one-shot surface and `--json` shapes are unchanged
- [x] 8.3 Update the README key table: Receive maps to replay, and `w` / `wait` is the action that blocks for a peer
- [x] 8.4 Note the practical payload size limit in the README, since fragmented large messages now render as several separate received messages
- [x] 8.5 Run `npm run lint` and `npm run format`

> 8.5: `lunte` output is byte-identical to `main` (2 errors, 14 warnings, all pre-existing in files this change does not touch). Added code is prettier-clean; `prettier . --check` still fails repo-wide because it already failed on `main`, so no blanket reformat was run.
> Design correction made during implementation: design.md originally said the session never enters raw mode. It does — `loopRawMode()` dispatches one keystroke at a time, so the main prompt has no half-typed line and printing there is safe. The queue now guards canonical reads specifically, and the residual interleave is limited to the fallback `loopLineMode()`.
> Practice-mode conflict found while implementing and resolved with the user: suppressing self-echo everywhere broke the tutorial, which sends then receives in one process. Transports now declare `loopsBack`; the mock is exempt, Hyperswarm is not. spec.md and design.md were updated to match.
