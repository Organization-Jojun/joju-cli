'use strict'

const path = require('bare-path')
const session = require('../core/session')
const { resolveStorage } = require('../core/updater')
const { FIXTURE_TOPIC_HEX } = require('../p2p/topic')
const { isInteractive, readLine, write } = require('../core/readline')
const { runJoin } = require('../commands/join')
const { runPaste } = require('../commands/paste')
const { runYank } = require('../commands/yank')
const { runWait, DEFAULT_TIMEOUT_MS } = require('../commands/wait')
const { runLeave } = require('../commands/leave')

const MENU = `
  Jojun — copiar y pegar entre dos PCs (sin WhatsApp, sin USB)

  1  join     Entrar a la habitación (mismo topic las dos PCs)
  2  paste    Enviar un texto a la otra PC
  3  yank     Recibir el texto
  4  wait     Esperar a que la otra PC llegue
  5  leave    Salir y olvidar la habitación
  q  quit     Cerrar

`

function printStaticHelp() {
  console.log(MENU)
  console.log('Uso directo (sin menú):')
  console.log('  jojun join <topic>')
  console.log('  echo hola | jojun paste')
  console.log('  jojun yank')
  console.log('')
}

async function runMenu({ flags, appName, isDev }) {
  const dir = resolveStorage(flags, appName, isDev)
  session.setStorageDir(path.join(dir, 'jojun'))

  if (!isInteractive()) {
    printStaticHelp()
    return
  }

  write(MENU)
  write('Elegí 1-5 (o q): ')
  const choice = (await readLine()).toLowerCase()

  if (choice === 'q' || choice === 'quit' || choice === '') {
    write('Listo.\n')
    return
  }

  if (choice === '1' || choice === 'join') {
    write('Topic (Enter = el de prueba): ')
    let topic = await readLine()
    if (!topic) topic = FIXTURE_TOPIC_HEX
    await runJoin(topic, { json: flags.json })
    return
  }

  if (choice === '2' || choice === 'paste') {
    write('Texto a enviar (una línea, luego Enter): ')
    const text = await readLine()
    await runPaste({
      json: flags.json,
      timeout: 30_000,
      bytes: Buffer.from(text || '', 'utf8')
    })
    return
  }

  if (choice === '3' || choice === 'yank') {
    await runYank({ timeout: DEFAULT_TIMEOUT_MS })
    write('\n')
    return
  }

  if (choice === '4' || choice === 'wait') {
    await runWait(DEFAULT_TIMEOUT_MS, { json: flags.json })
    return
  }

  if (choice === '5' || choice === 'leave') {
    await runLeave({ json: flags.json })
    return
  }

  write('Opción no válida. Probá 1-5 o q.\n')
}

module.exports = { runMenu, printStaticHelp, MENU }
