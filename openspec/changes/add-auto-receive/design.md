## Context

See proposal.md — Why, for motivation. The constraints that shape the approach:

**The push path already exists.** `src/p2p/room.js` emits `message` on every `conn.on('data')`, and `src/contracts/swarm.js` exposes `onMessage(handler)` returning an unsubscribe function. `src/cli/session.js` subscribes to none of it. This change is mostly wiring, not new transport.

**Input has two modes, and only one of them is exposed to async output.** `src/cli/session.js` calls `trySetRaw(true)` and, when the TTY supports it, runs `loopRawMode()`: it reads a single keystroke at a time via `readRawChunk()` and dispatches immediately. There is no partially typed line at the main prompt in raw mode, so printing there is safe.

Canonical mode is where the risk lives. The session drops back to it in three places — `promptLine()` (which does `trySetRaw(false)`, reads a line, restores), the `/` slash branch inside `loopRawMode()`, and the whole of `loopLineMode()` when raw mode is unavailable. In those, `src/core/readline.js` accumulates `stdio.in` chunks until CR or LF while the terminal driver echoes and buffers the line locally. The process **cannot see or repaint a partially typed line**, so anything printed asynchronously lands in the middle of it.

**Message boundaries are not guaranteed.** `room.js` treats one `data` event as one message. There is no length prefix. A payload larger than a stream chunk arrives as several `data` events and would surface as several separate "messages"; two rapid sends may coalesce into one. This is a pre-existing defect of the wire format, not something auto-receive introduces — but auto-receive makes it *visible*, because today's single-slot model quietly overwrites the fragments and shows only the last one.

**`lastBlob` is load-bearing for the one-shot commands.** `runYank()` reads it, `runPaste()` writes it, `waitForBlob()` short-circuits on it. The scripts and `scripts/smoke-windows.ps1` depend on that behavior, so it cannot simply be replaced.

## Goals / Non-Goals

**Goals:**
- Wire the existing `onMessage` push path into the session with a correct subscribe/unsubscribe lifecycle
- Add direction tagging so the sender's own paste stops echoing back
- Keep `lastBlob` and `waitForBlob()` behaving exactly as they do today for the one-shot commands
- Contain the async-output-versus-prompt problem well enough that it is not a routine annoyance, without rewriting the input layer

**Non-Goals:**
- Rewriting `src/core/readline.js` into a raw-mode line editor. That is the only complete fix for async output, and it is a larger change that should stand on its own.
- Fixing the wire format. Length-prefixed framing is a separate change with a compatibility story; see Risks.
- Persisting history to disk. Session-scoped only.

## Decisions

### History lives in `contracts/swarm.js`, not in the session

The history buffer and direction tagging go in `src/contracts/swarm.js`, beside the existing `lastBlob`, rather than in `src/cli/session.js`.

`contracts/` is already the seam that owns message state and the mock/real swap. Putting history there means the mock transport exercises the same code path, so the tutorial's practice mode and `test/index.js` (which runs entirely on the mock) can test history, ordering, and self-echo without a DHT. Putting it in the session would leave all of that reachable only through a TTY.

`lastBlob` stays exactly as it is. History is added alongside it — a bounded array of `{ direction, bytes, at }` — and `getLastBlob()` / `waitForBlob()` keep reading and writing `lastBlob` unchanged. This is deliberate duplication: the two consumers have genuinely different semantics (one-shot wants "the payload", session wants "what arrived, in order, from whom"), and collapsing them would force a behavior change on the scripted surface.

*Alternative considered:* replace `lastBlob` with `history[history.length - 1]`. Rejected — `runPaste()` writes `lastBlob` on the sending side, so a shared slot reintroduces the self-echo the change is meant to remove, and any divergence in `waitForBlob()`'s short-circuit is a silent behavior change for scripts.

### Direction is tagged at the point of send, not inferred

`send()` in `contracts/swarm.js` appends an outgoing entry; the `onMessage` hook appends an incoming one. Direction is recorded where it is known for certain rather than inferred later by comparing payloads.

*Alternative considered:* de-duplicate by comparing an inbound payload against the last sent bytes. Rejected — it misidentifies the legitimate case where a peer sends back the identical text, and it is guesswork where an explicit fact is available. The echo guard therefore compares object identity against the buffer currently being sent, not content.

### Whether an echo is suppressed is a property of the transport

`src/p2p/mock.js` delivers a sender its own messages so that one process can round-trip; Hyperswarm never does. Each transport module now declares this as `loopsBack`, and the echo guard consults that flag rather than asking whether the mock is selected.

This is what keeps practice mode working. The suppression exists to stop a user seeing their own paste come back as if a peer had sent it — but in practice mode the loopback *is* the peer, and it is the only inbound message that can exist. The tutorial sends and then receives; without the exemption its step 4 shows nothing and its own copy ("You already sent and received") becomes false.

Keying on `loopsBack` rather than on `useMock` states the actual reason at the point of decision, and it stays correct if another transport is ever added.

*Alternative considered:* keep suppression everywhere and rework the tutorial so practice mode never claims a message was received. Rejected — practice mode exists to demonstrate the product to someone with one laptop, and a demonstration where nothing ever arrives does not demonstrate it.

### Async output is suppressed during sub-prompts, allowed at the main prompt

The rule follows the input mode. A session-level counter marks whether the session is currently reading a line in canonical mode — every `promptLine()` call (room name, send text, settings answers, language, setup) and the `/` slash branch of `loopRawMode()`. While it is non-zero, inbound messages are appended to a pending queue rather than printed; when the read finishes the queue is flushed in order and cleared.

Everywhere else — which in practice means the raw-mode main prompt — inbound messages print immediately, followed by a re-written prompt. That is safe because `loopRawMode()` consumes each keystroke as it arrives, so there is no half-typed line on screen to corrupt.

A counter rather than a boolean because these nest: `doSettings()` is reached from the main loop and then itself calls `promptLine()` twice, and the tutorial drives `doConnect`/`doSend` — which prompt — from inside its own flow. A boolean would be cleared by the inner prompt while the outer one was still open.

This does not solve async output in the fallback `loopLineMode()`, used when the TTY does not support raw mode. There the main prompt is a canonical line read, and a message arriving mid-typing will interleave:

```
jojun › hel
  ← received 12 bytes: hello there
jojun › 
```

with `hel` still in the terminal's line buffer and only `lo` visibly following the new prompt. No input is lost — the full line `hello` is still delivered on Enter — but it reads as garbled. Accepted: it is the degraded path on terminals that already cannot do single-key dispatch.

*Alternatives considered:*
- *Queue everything and flush only after a command completes.* Safe, but it means a message sitting invisible while the user stares at an idle prompt — which is precisely the problem this change exists to fix.
- *Raw mode with a redrawable line buffer.* The correct fix: own the input buffer, and on inbound output erase the line, print the message, and repaint prompt plus buffer. Rejected for this change because it replaces `src/core/readline.js` wholesale, must handle backspace, arrows, Ctrl+C, and paste, and needs its own testing on all three platforms. It deserves to be its own change, and this design does not block it — the queue-and-flush seam is where the redraw would later hook in.

### Auto-receive is a preference, not a mode switch on the transport

The toggle only gates *rendering*. The subscription itself stays active whenever connected, and history keeps filling regardless.

This keeps behavior coherent: with auto-receive off, the Receive action still needs the message, and if the subscription had been torn down the message would be gone. It also means toggling mid-session takes effect immediately with no reconnect. The stored preference joins the existing `ui.json` shape used by `src/cli/prefs.js`, which already merges over `DEFAULTS`, so an older `ui.json` without the key picks up the default with no migration.

### Subscribe on connect, unsubscribe on leave

The session holds the unsubscribe function returned by `contracts.onMessage()` and calls it in the leave path and on quit. Connecting while already connected disposes the previous subscription before creating a new one, so a double connect cannot double-render.

This matters because `contracts.leave()` resets `messageHooked = false` and `src/p2p/index.js` throws `not joined to a topic` if `onMessage` is called with no active room. The lifecycle must be explicit; commit d0660e6 fixed the same class of bug for unsubscribe functions in the p2p layer.

## Risks / Trade-offs

**Interleaved output during a canonical line read** → Bounded by the queue, which covers every `promptLine()` and the `/` branch. The residual case is the main prompt of the fallback `loopLineMode()` only, on terminals without raw-mode support; it garbles the display but never loses input. The proper fix is a redrawable line editor, deliberately scoped out; the queue-and-flush seam is where it would hook in.

**Unframed messages become user-visible** → A large paste that arrives as several `data` events will now render as several separate received messages instead of being silently collapsed to the last fragment. This is arguably an improvement — the fragmentation stops being invisible — but it will look like a new bug to anyone who pastes something large. Mitigation: state the practical size limit in the README rather than implying arbitrary payloads work, and treat length-prefixed framing as the follow-up change this exposes the need for.

**`r` no longer waits** → Documented as BREAKING in the proposal. Mitigation: when replay is triggered with an empty history, the message that reports "nothing received yet" should point the user at `w` / `/wait`, which is the action that now does what `r` used to. Both i18n locales need that string.

**Two message-state mechanisms in `contracts/swarm.js`** → `lastBlob` and the history array coexist and can drift. Mitigation: keep `lastBlob` writes exactly where they are today and treat history as append-only and additive; cover both in `test/index.js` so a future refactor that collapses them has to confront the difference deliberately.

**Unbounded growth** → History is capped at the 50 most recent entries, oldest dropped. A long-lived session in a chatty room cannot grow without limit.

## Migration Plan

No data migration. `src/cli/prefs.js` merges stored preferences over `DEFAULTS`, so an existing `ui.json` gains `autoReceive` at its default value on first read; no rewrite is required and an older binary reading a newer `ui.json` ignores the unknown key.

Rollback is reverting the change: nothing is written to disk in a new format, and the stored preference is inert to any version that does not know it.

The user-visible break is the `r` key. It should be called out in the README key table and in the in-session help before release, not only in the changelog.
