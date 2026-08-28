'use strict'

const http = require('bare-http1')
const https = require('bare-https')
const { USER_AGENT } = require('./release-config')

function clientFor(url) {
  const u = typeof url === 'string' ? new URL(url) : url
  return u.protocol === 'http:' ? http : https
}

/**
 * GET url → { statusCode, headers, body: Buffer }
 * Follows a single level of redirects (GitHub asset CDN).
 */
function getBuffer(url, opts = {}) {
  const maxRedirects = opts.maxRedirects === undefined ? 5 : opts.maxRedirects
  return getOnce(url, opts).then((res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      if (maxRedirects <= 0) throw new Error('too many redirects')
      const next = new URL(res.headers.location, url).href
      return getBuffer(next, { ...opts, maxRedirects: maxRedirects - 1 })
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error('HTTP ' + res.statusCode + ' for ' + url)
    }
    return res
  })
}

function getOnce(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const lib = clientFor(u)
    const headers = {
      'User-Agent': opts.userAgent || USER_AGENT,
      Accept: opts.accept || '*/*',
      ...(opts.headers || {})
    }
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port ? Number(u.port) : u.protocol === 'http:' ? 80 : 443,
        path: u.pathname + u.search,
        method: 'GET',
        headers
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks)
          })
        })
        res.on('error', reject)
      }
    )
    req.on('error', reject)
    req.end()
  })
}

function getJson(url, opts = {}) {
  return getBuffer(url, {
    ...opts,
    accept: opts.accept || 'application/vnd.github+json'
  }).then((res) => {
    const text = res.body.toString('utf8')
    try {
      return { ...res, json: JSON.parse(text) }
    } catch (err) {
      throw new Error('invalid JSON from ' + url + ': ' + err.message)
    }
  })
}

module.exports = { getBuffer, getJson, getOnce, clientFor }
