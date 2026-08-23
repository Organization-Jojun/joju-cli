'use strict'

const en = require('./en')
const es = require('./es')

const TABLES = { en, es }

let lang = 'en'

function normalizeLang(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
  if (v === 'es' || v === 'es-co' || v === 'spanish' || v === 'espanol' || v === 'español') {
    return 'es'
  }
  if (v === 'en' || v === 'english' || v === 'inglés' || v === 'ingles') return 'en'
  return null
}

function setLang(next) {
  const n = normalizeLang(next)
  if (n) lang = n
  return lang
}

function getLang() {
  return lang
}

function t(key) {
  const table = TABLES[lang] || en
  if (table[key] !== undefined) return table[key]
  if (en[key] !== undefined) return en[key]
  return key
}

module.exports = { t, setLang, getLang, normalizeLang, TABLES }
