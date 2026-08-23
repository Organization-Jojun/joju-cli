'use strict'

const { t } = require('./i18n')
const { formatSuggestions, publicCommands } = require('./slash')

function helpPanel() {
  const cmds = publicCommands().map((c) => ({
    name: c.names[0],
    summaryKey: c.summaryKey
  }))
  return [
    t('helpIntro'),
    '',
    t('helpFlowTitle'),
    t('helpFlow1'),
    t('helpFlow2'),
    t('helpFlow3'),
    t('helpFlow4'),
    t('helpAgent'),
    '',
    t('emptyRoom'),
    '',
    t('helpSlash'),
    formatSuggestions(cmds),
    '',
    t('advancedTitle'),
    t('advancedBody')
  ].join('\n')
}

function keysPanel() {
  return [t('keysTitle'), '', t('keysBody')].join('\n')
}

function menuPanel() {
  return [
    t('menuTitle'),
    t('menu1'),
    t('menu2'),
    t('menu3'),
    t('menu4'),
    t('menu5'),
    '',
    t('menuHint')
  ].join('\n')
}

function emptyRoomHint() {
  return t('emptyRoom')
}

module.exports = { helpPanel, keysPanel, menuPanel, emptyRoomHint }
