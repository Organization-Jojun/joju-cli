'use strict'

function emit(json, payload, human) {
  if (json) {
    console.log(JSON.stringify(payload))
    return
  }
  if (human) console.log(human)
}

module.exports = { emit }
