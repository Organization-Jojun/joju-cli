## Purpose

Defines how the interactive Jojun session delivers inbound room messages to the user: automatic display the moment a message arrives, a replayable session history, suppression of the user's own sent messages, and the rules that keep asynchronous output from colliding with an open prompt.

## ADDED Requirements

### Requirement: Automatic display of inbound messages

While the session is connected to a room, the system SHALL display each inbound message as it arrives, without requiring any keypress from the user. Each displayed message SHALL indicate that it was received (not sent locally) and SHALL report its size in bytes.

#### Scenario: Message arrives while the user is idle at the main prompt

- **WHEN** the session is connected to a room, the user is sitting at the main prompt having typed nothing, and a peer sends a message
- **THEN** the message is printed to the terminal within the session without the user pressing any key
- **AND** the printed output identifies it as received and states its length in bytes
- **AND** the main prompt is written again below the message so the session remains usable

#### Scenario: Several messages arrive in succession

- **WHEN** a peer sends three messages in succession while the session is connected and idle at the main prompt
- **THEN** all three are displayed, each as its own entry, in the order they were received

#### Scenario: Message arrives before the user connects

- **WHEN** a peer sends a message at a time when the local session is not connected to the room
- **THEN** nothing is displayed for that message
- **AND** the session does not report an error, because an undelivered message is expected to be lost

### Requirement: Locally sent messages are never shown as received

The system SHALL record the direction of every message in the session. A message the local user sent SHALL NOT be displayed as an inbound message and SHALL NOT be returned by replay as though it had been received.

#### Scenario: User sends a message and then replays

- **WHEN** the user sends a message from this machine and no peer has sent anything
- **THEN** no inbound message is displayed at any point as a result of that send
- **AND** replaying the received history reports that no messages have been received

#### Scenario: User sends, then a peer sends

- **WHEN** the user sends a message from this machine and afterwards a peer sends a different message
- **THEN** only the peer's message is displayed as received
- **AND** replay reports the peer's message and not the locally sent one

### Requirement: Received message history and replay

The system SHALL retain the messages received during the current session in the order they arrived, holding at least the 50 most recent, discarding the oldest first once that limit is exceeded. The Receive action — the `r` key, the `3` menu entry, and the `/receive`, `/recibir`, and `/yank` slash commands — SHALL replay from that history and SHALL return immediately rather than blocking to wait for a peer.

#### Scenario: Replay after messages were received

- **WHEN** the session has received two messages and the user triggers the Receive action
- **THEN** the most recently received message is displayed again immediately
- **AND** the session does not block waiting for a peer

#### Scenario: Replay with nothing received

- **WHEN** the session has received no messages and the user triggers the Receive action
- **THEN** the session reports that no messages have been received yet
- **AND** returns to the prompt immediately without waiting and without reporting an error

#### Scenario: History is not carried across restarts

- **WHEN** the user quits the session and starts a new one
- **THEN** the received history is empty in the new session

### Requirement: Auto-receive preference

Automatic display SHALL be enabled by default. The system SHALL let the user turn it off and on from the settings menu, SHALL persist the choice with the session's other user preferences, and SHALL apply the persisted choice on the next session start. While automatic display is off, the Receive action SHALL block and wait for an inbound message, as it did before this capability existed, subject to the configured wait timeout.

#### Scenario: Default for a user who has never changed the setting

- **WHEN** a user with no stored auto-receive preference starts a session and connects to a room
- **THEN** automatic display is active

#### Scenario: Turning auto-receive off

- **WHEN** the user turns auto-receive off in settings and a peer then sends a message
- **THEN** the message is not displayed automatically
- **AND** triggering the Receive action displays it

#### Scenario: Preference survives a restart

- **WHEN** the user turns auto-receive off, quits, and starts a new session
- **THEN** automatic display is still off

#### Scenario: Receive blocks while auto-receive is off

- **WHEN** auto-receive is off, no message has been received, and the user triggers the Receive action
- **THEN** the session waits for an inbound message until one arrives or the configured wait timeout elapses
- **AND** on timeout it reports the timeout and returns to the prompt

### Requirement: Inbound output must not corrupt an open prompt

The system SHALL NOT print an inbound message while the user is being asked for input at a multi-step sub-prompt — entering a room name, entering the text of a message to send, or answering a settings question. Messages that arrive during such a sub-prompt SHALL be held and displayed, in arrival order, once that sub-prompt has been answered or cancelled.

#### Scenario: Message arrives while the user is typing a room name

- **WHEN** the user has been asked for a room name and has not yet answered, and a peer sends a message
- **THEN** nothing is printed until the user answers the room-name question
- **AND** after the answer is submitted the held message is displayed

#### Scenario: Several messages arrive during one sub-prompt

- **WHEN** two messages arrive while a sub-prompt is open
- **THEN** after the sub-prompt closes both are displayed in the order they arrived

### Requirement: Automatic display follows the connection

Automatic display SHALL be active only while the session is connected to a room. On disconnect the system SHALL stop displaying inbound messages, and on connecting again it SHALL resume. Leaving a room SHALL release the session's subscription so that no handler remains registered against a room the session has left.

#### Scenario: Disconnect stops automatic display

- **WHEN** the user disconnects from the room
- **THEN** no further inbound messages are displayed

#### Scenario: Reconnecting resumes automatic display

- **WHEN** the user disconnects and then connects to a room again, and a peer sends a message
- **THEN** that message is displayed automatically

#### Scenario: Connecting twice does not duplicate output

- **WHEN** the user connects to a room, connects again without disconnecting first, and a peer then sends one message
- **THEN** that message is displayed exactly once

### Requirement: The one-shot command surface is unchanged

This capability SHALL apply to the interactive session only. The non-interactive commands `jojun join`, `jojun paste`, `jojun yank`, `jojun wait`, and `jojun leave` SHALL keep their existing behavior, their `--json` output shapes, and their exit codes, because scripts and the Windows smoke test depend on them.

#### Scenario: One-shot yank still waits

- **WHEN** `jojun yank` is run with no message available
- **THEN** it waits for a message until one arrives or the timeout elapses, exactly as before this change

#### Scenario: JSON output shape is stable

- **WHEN** any of the one-shot commands is run with `--json`
- **THEN** the emitted object has the same fields and the command the same exit code as before this change
