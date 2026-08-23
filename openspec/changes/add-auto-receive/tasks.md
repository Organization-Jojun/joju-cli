## 1. Message state in the contracts seam

- [ ] 1.1 Add a bounded history to `src/contracts/swarm.js`: an append-only array of `{ direction, bytes, at }` capped at the 50 most recent entries, oldest dropped first
- [ ] 1.2 Tag outgoing messages: `send()` appends an entry with direction `out`, leaving its existing `lastBlob` write and return shape untouched
- [ ] 1.3 Tag inbound messages: the `hookMessages()` handler appends an entry with direction `in`, leaving its existing `lastBlob` write untouched
- [ ] 1.4 Expose read accessors — the received-only history and the most recent received entry — without changing `getLastBlob()` or `waitForBlob()`
- [ ] 1.5 Clear history in `leave()` and in `_resetForTests()` alongside the existing `lastBlob` reset
- [ ] 1.6 Mirror the same history behavior through `src/p2p/mock.js` so practice mode and the mock-based tests exercise the real code path

## 2. Preference

- [ ] 2.1 Add `autoReceive` to `DEFAULTS` in `src/cli/prefs.js`, defaulting to enabled
- [ ] 2.2 Confirm the existing merge-over-`DEFAULTS` read path gives an older `ui.json` the default with no migration and no rewrite

## 3. Subscription lifecycle in the session

- [ ] 3.1 On successful connect in `src/cli/session.js`, subscribe via `contracts.onMessage()` and retain the returned unsubscribe function
- [ ] 3.2 Dispose any existing subscription before creating a new one, so a second connect without a disconnect cannot double-render
- [ ] 3.3 Call the unsubscribe function on disconnect/leave and on quit, before `contracts.leave()` resets `messageHooked`
- [ ] 3.4 Verify no handler survives a leave by asserting that a message sent after leaving produces no session output

## 4. Rendering and the sub-prompt queue

- [ ] 4.1 Add a session flag that marks a multi-step sub-prompt as open, set and cleared around every `promptLine()` call site (room name, send text, settings prompt, settings wait, language, setup)
- [ ] 4.2 Add a pending queue: while the sub-prompt flag is set, inbound messages are appended instead of printed
- [ ] 4.3 Flush the queue in arrival order when the sub-prompt resolves or is cancelled, then clear it
- [ ] 4.4 Render an inbound message at the main prompt immediately: print the received marker, byte count, and truncated payload using the existing `truncateBlob` helper, then re-write the prompt
- [ ] 4.5 Gate rendering — not the subscription — on the `autoReceive` preference, so history keeps filling while the preference is off

## 5. Receive becomes replay

- [ ] 5.1 Rework `doReceive()` so that with auto-receive on it reads the most recent received entry from history and returns immediately without calling `runYank()`
- [ ] 5.2 With an empty received history, report that nothing has been received yet and point the user at `w` / `/wait`, then return to the prompt without erroring
- [ ] 5.3 With auto-receive off, keep the existing blocking path through `runYank()` including the configured wait timeout and its timeout message
- [ ] 5.4 Confirm the `r`, `3`, `/receive`, `/recibir`, and `/yank` entry points all route through the reworked `doReceive()`

## 6. Settings and strings

- [ ] 6.1 Add an auto-receive toggle to the `/settings` menu that takes effect immediately with no reconnect and persists via `savePrefs`
- [ ] 6.2 Add the new strings to `src/cli/i18n/en.js` — inbound message marker, replay result, empty-history message pointing at `wait`, settings toggle label and on/off states
- [ ] 6.3 Add the same keys to `src/cli/i18n/es.js` in Colombian Spanish, using `tú`, matching the existing register
- [ ] 6.4 Update `src/cli/help.js` and `src/cli/menu.js` so Receive is described as replay rather than receive-and-wait

## 7. Tests

- [ ] 7.1 History ordering: three received messages replay in arrival order and the cap drops the oldest past 50
- [ ] 7.2 Self-echo: a local `send()` produces no received entry, and replay after a send-only sequence reports nothing received
- [ ] 7.3 Mixed direction: after a local send followed by a peer message, only the peer message appears in the received history
- [ ] 7.4 Replay on empty history returns immediately and does not throw
- [ ] 7.5 Auto-receive off still records history, and the blocking Receive path still resolves and still times out as configured
- [ ] 7.6 Leaving clears history and unsubscribes; a message after leave produces nothing
- [ ] 7.7 Regression: `getLastBlob()` and `waitForBlob()` behave exactly as before, including the short-circuit when `lastBlob` is already set

## 8. Compatibility check and docs

- [ ] 8.1 Run `npm test` and confirm the pre-existing one-shot assertions still pass unmodified
- [ ] 8.2 Run `scripts/smoke-windows.ps1` (or its join/paste/yank sequence) and confirm the one-shot surface and `--json` shapes are unchanged
- [ ] 8.3 Update the README key table: Receive maps to replay, and `w` / `wait` is the action that blocks for a peer
- [ ] 8.4 Note the practical payload size limit in the README, since fragmented large messages now render as several separate received messages
- [ ] 8.5 Run `npm run lint` and `npm run format`
