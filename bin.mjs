import { flag } from 'paparam'
import path from 'bare-path'
import pkg from './package.json'
import { createCommands, createRootCommand, ACTIONS } from './src/cli/index.js'
import { runMenu, printStaticHelp } from './src/cli/menu.js'
import { runSession } from './src/cli/session.js'
import { isInteractive } from './src/core/readline.js'
import { spawnUpdaterIfEnabled, runUpdaterDaemon } from './src/core/updater.js'
import { ensureOnPath } from './src/core/path-install.js'

const appName = pkg.productName || pkg.name
const isDev = path.basename(Bare.argv[0], path.extname(Bare.argv[0])) === 'bare'
const SESSION_CMDS = ['ui', 'tui']

let rootCmd

function getFlags(cmd) {
  return { ...rootCmd.flags, ...cmd.flags }
}

const { joinCmd, pasteCmd, yankCmd, waitCmd, leaveCmd, keysCmd, uiCmd, tuiCmd } =
  createCommands({
    appName,
    isDev,
    getFlags,
    onBeforeAction: async (cmd) => {
      const flags = getFlags(cmd)
      ensureUpdatesFlag(flags)
      spawnUpdaterIfEnabled({
        flags,
        appName,
        isDev,
        pkg
      })
    }
  })

rootCmd = createRootCommand({
  appName,
  descriptionText: pkg.description,
  subcommands: {
    joinCmd,
    pasteCmd,
    yankCmd,
    waitCmd,
    leaveCmd,
    keysCmd,
    uiCmd,
    tuiCmd
  }
})

rootCmd.add(flag('--version|-v', 'Print the current version'))

const argv = Bare.argv.slice(isDev ? 2 : 1)

if (!isDev && !argv.includes('--updater')) {
  try {
    const pathResult = ensureOnPath()
    if (pathResult.added) {
      console.log('Jojun added itself to your PATH. Open a new terminal and type: jojun')
    }
  } catch {
    // PATH registration is best-effort
  }
}

rootCmd.parse(argv, { run: false })
if (rootCmd.flags.help) {
  printUpdatesLine(getFlags(rootCmd))
  Bare.exit()
}

if (argv.includes('--version') || argv.includes('-v') || rootCmd.flags.version) {
  console.log(`${appName} v${pkg.version}`)
  Bare.exit()
}

if (argv.includes('--updater')) {
  const flags = getFlags(rootCmd)
  ensureUpdatesFlag(flags)
  await runUpdaterDaemon({ flags, appName, isDev, pkg })
  Bare.exit()
}

const subcommand = argv.find((arg) => ACTIONS.includes(arg) || arg === 'keys')

if (subcommand) {
  const result = rootCmd.parse(argv)
  if (result === null) Bare.exit(1)
  if (result.running) await result.running
  Bare.exit(Bare.exitCode || 0)
}

const flags = getFlags(rootCmd)
ensureUpdatesFlag(flags)

const wantMenu = argv.includes('--menu')
const wantSession =
  SESSION_CMDS.some((name) => argv.includes(name)) || (!wantMenu && isInteractive())

if (wantSession) {
  flags.noUpdates = true
  flags.updates = false
  await runSession({
    flags,
    appName,
    isDev,
    version: pkg.version
  })
  Bare.exit(Bare.exitCode || 0)
}

spawnUpdaterIfEnabled({ flags, appName, isDev, pkg })
printUpdatesLine(flags)

if (wantMenu) {
  await runMenu({ flags, appName, isDev })
} else {
  printStaticHelp()
  console.log('CLI ready.\n')
}

function ensureUpdatesFlag(flags) {
  if (flags.noUpdates) flags.updates = false
}

function printUpdatesLine(flags) {
  const updates = flags.updates
  console.log(`Updates: ${updates === false ? 'disabled' : 'enabled'}`)
}
