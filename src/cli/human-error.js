'use strict'

const { t } = require('./i18n')

function humanError(err) {
  const msg = err && err.message ? String(err.message) : String(err || 'error')

  if (/not joined/i.test(msg)) return t('errNotJoined')
  if (/64 hex|hex string/i.test(msg)) return t('errHex')
  if (/timed out waiting for peer/i.test(msg)) return t('errPeer')
  if (/timed out waiting for blob/i.test(msg)) return t('errBlob')
  if (/storage directory/i.test(msg)) return t('errStorage')
  return msg
}

module.exports = { humanError }
