'use strict'

const { createUpdateLogger } = require('./logger')
const releaseConfig = require('./release-config')
const assets = require('./assets')
const checksum = require('./checksum')
const installTarget = require('./install-target')
const github = require('./github')
const http = require('./http')
const extract = require('./extract')
const replaceBinary = require('./replace-binary')

module.exports = {
  createUpdateLogger,
  ...releaseConfig,
  ...assets,
  ...checksum,
  ...installTarget,
  ...github,
  ...http,
  ...extract,
  ...replaceBinary
}
