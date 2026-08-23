## Why

Receiving a message today is a manual pull: the user must press `r` (or `/receive`), which calls `runYank()` → `swarm.waitForBlob()` and blocks until something arrives. That is backwards for a room clipboard — the other laptop has already sent the message, and the receiving user has no way to know it is there without guessing and pressing a key.

The push path already exists and is unused. `src/p2p/room.js` emits a `message` event on every `conn.on('data')`, and `src/contracts/swarm.js` exposes `onMessage(handler)`. The interactive session subscribes to none of it — it only polls on keypress. Two user-visible defects follow from that single-slot pull model:

- `waitForBlob()` returns immediately when `lastBlob !== null` (`src/contracts/swarm.js:132`), so pressing `r` a second time re-prints the *same* message instead of waiting for the next one.
- `runPaste()` sets `lastBlob` on the **sending** side, so pressing `r` on the machine that just sent echoes the user's own message back as if it had been received.

## What Changes

- The interactive session subscribes to incoming messages on connect and prints each one **as it arrives**, with no keypress required.
- A bounded in-session message history replaces the single "last blob" slot for display purposes, so consecutive messages are all retained and shown in order.
- Messages the local user sent are recorded as outgoing and are never rendered as received. This fixes the self-echo.
- **BREAKING** (interactive session only): `r` / `3` / `/receive` / `/recibir` / `/yank` no longer blocks waiting for a peer message. It becomes a **replay** of the session's received history, printed immediately. Users who pressed `r` to wait should now use `w` / `/wait`.
- Auto-receive is on by default and can be toggled from `/settings`; the choice persists in `ui.json` alongside the existing preferences. With it off, `r` restores today's blocking pull.
- Incoming messages that arrive while a multi-step sub-prompt is open (room name entry, send-text entry, settings) are queued and flushed when that sub-prompt closes, so they cannot corrupt a line the user is mid-way through typing.
- The one-shot script surface is untouched: `jojun yank`, `jojun paste`, `jojun wait`, `--json` output shapes and exit codes all keep their current behavior, since scripts and the smoke test depend on them.

Not in scope: outbound HTTP webhooks to an external URL, wire-level message framing, and persistence of history across process restarts. See Design for why framing bounds what this feature can honestly promise.

## Capabilities

### New Capabilities
- `session-receive`: How the interactive session delivers inbound room messages to the user — automatic push on arrival, message history and replay, self-echo suppression, the auto-receive preference, and the ordering rules that keep async output from colliding with an open prompt.

### Modified Capabilities
<!-- None. openspec/specs/ is currently empty; the one-shot command surface
     (join/paste/yank/wait/leave) has no spec today and its behavior is
     deliberately unchanged by this change. -->

## Impact

**Code**
- `src/cli/session.js` — subscribe on connect, unsubscribe on leave/quit, render inbound messages, queue during sub-prompts, rework `doReceive()` into replay
- `src/contracts/swarm.js` — message history buffer with direction tagging (in/out); `getLastBlob()` and `waitForBlob()` semantics preserved for the one-shot commands
- `src/cli/prefs.js` — `autoReceive` preference and its default
- `src/cli/i18n/en.js`, `src/cli/i18n/es.js` — strings for inbound messages, replay, empty history, and the settings toggle
- `src/cli/help.js`, `src/cli/menu.js` — `r` is described as replay, not receive-and-wait
- `README.md` — the key table currently maps Receive → `yank`; that mapping changes

**Tests**
- `test/index.js` — history ordering, self-echo suppression, replay with empty history, toggle behavior
- `test/p2p-hyperswarm.js` and `scripts/smoke-windows.ps1` — must keep passing unchanged, proving the one-shot surface did not move

**Dependencies**: none added. Uses the existing `bare-events` emitter in `src/p2p/room.js`.

**Runtime risk**: the session uses a raw line reader (`src/core/readline.js`) in canonical TTY mode, not a full readline with redraw. Asynchronous output cannot repaint a line the user is part-way through typing. The sub-prompt queue bounds this; the residual case is documented in Design.
