## Purpose

Defines what Jojun leaves behind on a machine and how a user removes it: how the footprint is discovered and reported, what may be deleted automatically versus only with explicit opt-in, the confirmation and dry-run contract that must hold before anything is destroyed, and the boundary between Jojun's own footprint and the Pear runtime it was installed with.

## ADDED Requirements

### Requirement: Footprint discovery

The system SHALL provide an uninstall command that, before removing anything, discovers and reports Jojun's footprint on the current machine. The report SHALL cover the resolved storage directory, the user-PATH entry Jojun registered if one is present, and any Jojun executable the command can locate. Each item SHALL be reported with its absolute path and whether it currently exists.

The storage directory SHALL be resolved by the same rules the rest of the product uses, honouring an explicit storage override and the separate location used when running under a development runtime, so that running uninstall from a source checkout cannot target an installed user's storage.

#### Scenario: Reporting a normal installation

- **WHEN** the user runs the uninstall command on a machine where Jojun has been used
- **THEN** the storage directory is reported with its absolute path and marked as existing
- **AND** any Jojun executable found is reported with its absolute path
- **AND** on Windows, a user-PATH entry pointing at Jojun's directory is reported if present

#### Scenario: Nothing installed

- **WHEN** the uninstall command runs on a machine with no storage directory, no PATH entry, and no locatable binary
- **THEN** the command reports that nothing was found
- **AND** exits successfully without prompting for confirmation

#### Scenario: Storage override is honoured

- **WHEN** the uninstall command is run with an explicit storage directory override
- **THEN** the reported and targeted storage directory is the overridden one
- **AND** the default storage location is not targeted

#### Scenario: Development runtime targets the development storage

- **WHEN** the uninstall command runs under a development runtime rather than as the installed binary
- **THEN** the targeted storage directory is the development location
- **AND** the installed user's storage directory is not targeted

### Requirement: Confirmation is required before removal

The system SHALL NOT delete anything until the user has confirmed. Confirmation SHALL be requested interactively after the footprint has been reported. The system SHALL provide a flag that supplies confirmation non-interactively for scripted use. When standard input is not interactive and no such flag was supplied, the system SHALL make no changes and SHALL exit non-zero.

#### Scenario: User declines at the prompt

- **WHEN** the user runs the uninstall command interactively and declines at the confirmation prompt
- **THEN** nothing is deleted
- **AND** the command reports that no changes were made and exits successfully

#### Scenario: User confirms at the prompt

- **WHEN** the user runs the uninstall command interactively and confirms at the prompt
- **THEN** the reported targets are removed

#### Scenario: Non-interactive without the confirmation flag

- **WHEN** the uninstall command runs with standard input not attached to a terminal and no confirmation flag
- **THEN** nothing is deleted
- **AND** the command exits with a non-zero status explaining that confirmation was required

#### Scenario: Non-interactive with the confirmation flag

- **WHEN** the uninstall command runs with the confirmation flag supplied
- **THEN** no prompt is shown and the reported targets are removed

### Requirement: Dry run reports without deleting

The system SHALL provide a dry-run mode that performs discovery and reports the full removal plan, including every target it would act on, and SHALL make no filesystem or environment change in that mode. Dry-run SHALL take precedence over the confirmation flag.

#### Scenario: Dry run leaves everything in place

- **WHEN** the uninstall command runs in dry-run mode on a machine with an existing storage directory
- **THEN** the plan lists the storage directory as a target
- **AND** after the command exits the storage directory and its contents still exist

#### Scenario: Dry run overrides the confirmation flag

- **WHEN** the uninstall command runs with both dry-run and the confirmation flag
- **THEN** nothing is deleted

### Requirement: Only Jojun's own artifacts are deleted without opt-in

The system SHALL automatically remove only artifacts Jojun itself created: the storage directory and its contents, and the user-PATH entry Jojun registered. An executable found at a location Jojun did not write SHALL be reported but SHALL NOT be deleted unless the user explicitly opts in to removing it.

#### Scenario: A manually placed binary is reported, not deleted

- **WHEN** a Jojun executable exists at a location Jojun did not create it, such as a copy the user placed on their PATH by hand
- **THEN** it is reported in the plan as found
- **AND** it is not deleted by a default confirmed run
- **AND** the report states that removing it requires explicit opt-in

#### Scenario: Opting in to removing a discovered binary

- **WHEN** the user explicitly opts in to removing a discovered executable and confirms
- **THEN** that executable is removed

### Requirement: The Pear runtime is never modified

The system SHALL NOT delete, modify, or invoke removal of the Pear runtime, Pear's own installed-application records, or any Pear storage outside Jojun's own directory. Where Jojun was installed through Pear, the uninstall command SHALL state that Pear still holds an entry and SHALL leave it untouched.

#### Scenario: A Pear installation is reported but not altered

- **WHEN** the uninstall command runs on a machine where Jojun was installed through Pear
- **THEN** the output states that Pear's own installation record is not removed by this command
- **AND** the Pear runtime and its application records are unchanged after the command exits

### Requirement: PATH removal is exact and non-destructive

When removing the user-PATH entry, the system SHALL remove only the entry matching Jojun's own directory and SHALL preserve every other entry, along with their order. The comparison SHALL ignore trailing separators and case, matching how the entry was added. If no matching entry is present, PATH SHALL be left unchanged. The system SHALL NOT use any mechanism that truncates the stored PATH value.

#### Scenario: Only Jojun's entry is removed

- **WHEN** the user PATH contains Jojun's directory among several other entries and uninstall is confirmed
- **THEN** the resulting PATH contains every other entry, unchanged and in the same relative order
- **AND** it does not contain Jojun's directory

#### Scenario: Entry differing by trailing separator or case

- **WHEN** the stored PATH entry for Jojun's directory differs from the current directory only by a trailing separator or by letter case
- **THEN** that entry is recognised as Jojun's and removed

#### Scenario: No entry present

- **WHEN** the user PATH contains no entry for Jojun's directory and uninstall is confirmed
- **THEN** the stored PATH value is left byte-for-byte unchanged
- **AND** the outcome for the PATH target is reported as skipped

### Requirement: The room is left before removal

The system SHALL leave the room and release any network subscription before deleting the storage directory, so that no in-flight write recreates state that has just been removed. The uninstall command SHALL NOT start the update daemon, which would otherwise recreate the storage directory and write its log there.

#### Scenario: Storage does not reappear after removal

- **WHEN** uninstall is confirmed and completes on a machine with a joined session
- **THEN** the storage directory does not exist when the command exits
- **AND** it has not been recreated by an update daemon started by this command

### Requirement: Per-target outcome reporting

The system SHALL report an outcome for every target in the plan: removed, skipped because it was absent or requires opt-in, or failed with a reason. If any target the user requested and confirmed failed to be removed, the command SHALL exit with a non-zero status while still reporting the targets that succeeded.

#### Scenario: A target cannot be removed

- **WHEN** a confirmed run cannot remove one target, for example because the file is in use or permission is denied
- **THEN** that target is reported as failed with the reason
- **AND** the targets that were removed are reported as removed
- **AND** the command exits with a non-zero status

#### Scenario: All targets removed

- **WHEN** every target in a confirmed plan is removed
- **THEN** each is reported as removed and the command exits successfully

#### Scenario: Machine-readable output

- **WHEN** the uninstall command is run requesting JSON output
- **THEN** the emitted object contains the plan and the per-target outcomes
- **AND** it follows the same output convention as the other one-shot commands

### Requirement: A running executable that cannot remove itself is reported

Where the operating system prevents deletion of the executable currently being run, the system SHALL NOT fail the whole uninstall. It SHALL remove every other target, report that executable as requiring manual removal, and print its absolute path so the user can delete it themselves.

#### Scenario: Self-removal blocked by the platform

- **WHEN** uninstall is confirmed while running from the installed executable on a platform that locks a running executable
- **THEN** the storage directory and PATH entry are still removed
- **AND** the executable is reported as requiring manual removal, with its absolute path shown
