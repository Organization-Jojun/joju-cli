'use strict'

/** Single source of truth for GitHub Releases install + update. */
const RELEASE_OWNER = 'Organization-Jojun'
const RELEASE_REPO = 'joju-cli'
const RELEASE_API =
  'https://api.github.com/repos/' + RELEASE_OWNER + '/' + RELEASE_REPO + '/releases'
const RAW_INSTALL_BASE =
  'https://raw.githubusercontent.com/' + RELEASE_OWNER + '/' + RELEASE_REPO + '/main/scripts'

module.exports = {
  RELEASE_OWNER,
  RELEASE_REPO,
  RELEASE_API,
  RAW_INSTALL_BASE,
  USER_AGENT: 'jojun-cli'
}
