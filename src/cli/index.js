'use strict'

const path = require('bare-path')
const { command, arg, flag, summary, description } = require('paparam')
const session = require('../core/session')
const { resolveStorage } = require('../core/updater')
const { runJoin } = require('../commands/join')
const { runPaste } = require('../commands/paste')
const { runYank } = require('../commands/yank')
const { runWait, DEFAULT_TIMEOUT_MS } = require('../commands/wait')
const { runLeave } = require('../commands/leave')

const ACTIONS = ['join', 'paste', 'yank', 'wait', 'leave']

function createCommands({ appName, isDev, getFlags, onBeforeAction }) {
  function prepareSession(cmd) {
    const flags = getFlags(cmd)
    const dir = resolveStorage(flags, appName, isDev)
    session.setStorageDir(path.join(dir, 'jojun'))
  }

  const joinCmd = command(
    'join',
    summary('Join a Hyperswarm topic'),
    description('Connect to a topic room by its 32-byte hex id.'),
    arg('<topic>', 'topic hex (64 characters)'),
    async () => {
      await onBeforeAction(joinCmd)
      prepareSession(joinCmd)
      await runJoin(joinCmd.args.topic)
      Bare.exit(0)
    }
  )

  const pasteCmd = command(
    'paste',
    summary('Paste stdin to the swarm'),
    description('Read stdin and send the blob to connected peers.'),
    async () => {
      await onBeforeAction(pasteCmd)
      prepareSession(pasteCmd)
      await runPaste()
      Bare.exit(0)
    }
  )

  const yankCmd = command(
    'yank',
    summary('Yank the last blob to stdout'),
    description('Write the most recently received blob to stdout.'),
    async () => {
      await onBeforeAction(yankCmd)
      prepareSession(yankCmd)
      runYank()
      Bare.exit(0)
    }
  )

  const waitCmd = command(
    'wait',
    summary('Wait for a peer on the topic'),
    description('Block until another peer joins the same topic.'),
    flag('--timeout|-t [ms=' + DEFAULT_TIMEOUT_MS + ']', 'max wait in milliseconds'),
    async () => {
      await onBeforeAction(waitCmd)
      prepareSession(waitCmd)
      const flags = getFlags(waitCmd)
      const timeout = flags.timeout ? Number(flags.timeout) : DEFAULT_TIMEOUT_MS
      await runWait(timeout)
      Bare.exit(0)
    }
  )

  const leaveCmd = command(
    'leave',
    summary('Leave the current topic'),
    description('Disconnect from the swarm topic.'),
    async () => {
      await onBeforeAction(leaveCmd)
      prepareSession(leaveCmd)
      await runLeave()
      Bare.exit(0)
    }
  )

  const keysCmd = command(
    'keys',
    summary('List the five Jojun actions'),
    description('Quick reference for join, paste, yank, wait, and leave.'),
    async () => {
      await onBeforeAction(keysCmd)
      for (const action of ACTIONS) console.log(action)
      Bare.exit(0)
    }
  )

  return { joinCmd, pasteCmd, yankCmd, waitCmd, leaveCmd, keysCmd, ACTIONS }
}

function createRootCommand({ appName, descriptionText, subcommands }) {
  const { joinCmd, pasteCmd, yankCmd, waitCmd, leaveCmd, keysCmd } = subcommands

  return command(
    appName,
    summary(descriptionText),
    description('Paste on one machine, yank on the other — Hyperswarm topic CLI.'),
    flag('--storage <dir>', 'custom storage directory'),
    flag('--no-updates', 'disable OTA updates for this run'),
    flag('--update-window <ms>', 'updater wait in milliseconds'),
    flag('--updater', 'run updater daemon').hide(),
    joinCmd,
    pasteCmd,
    yankCmd,
    waitCmd,
    leaveCmd,
    keysCmd
  )
}

module.exports = { createCommands, createRootCommand, ACTIONS }
