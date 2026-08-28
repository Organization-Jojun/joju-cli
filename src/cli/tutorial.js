'use strict'

const { t } = require('./i18n')
const swarm = require('../contracts')

async function runTutorial({ promptLine, log, note, errLine, connect, send, receive, savePrefs }) {
  log('')
  log(t('tut1'))
  log(t('tut1a'))
  let mode = ''
  while (mode !== '1' && mode !== '2') {
    mode = (await promptLine(t('tut1prompt'))).toLowerCase()
  }
  const twoPcs = mode === '2'
  await swarm.setUseMock(!twoPcs)
  savePrefs({ mock: !twoPcs })
  note(twoPcs ? t('tut1live') : t('tut1mock'))
  await promptLine(t('tutContinue'))

  log(t('tut2'))
  let room = ''
  while (!room) {
    room = (await promptLine(t('tut2prompt'))).trim()
    if (!room) errLine(t('errRoomName'))
  }
  savePrefs({ roomName: room })

  log(t('tut3'))
  const joined = await connect(room, { skipPrompt: true })
  if (joined) {
    log(`${t('tut3ok')} "${joined}".`)
    note(t('tut3see'))
  }
  await promptLine(t('tutContinue'))

  log(t('tut4'))
  let msg = await promptLine(t('tut4prompt'))
  if (!msg) msg = 'hello jojun'
  await send(msg, { skipPrompt: true })
  note(t('tut4sent'))
  await receive()
  await promptLine(t('tutContinue'))

  log(twoPcs ? t('tut5two') : t('tut5one'))
  await promptLine(t('tutContinue'))

  log(t('tut6'))
  await promptLine(t('tutContinue'))
}

module.exports = { runTutorial }
