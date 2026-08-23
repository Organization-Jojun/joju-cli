'use strict'

function humanError(err) {
  const msg = err && err.message ? String(err.message) : String(err || 'error')

  if (/not joined/i.test(msg)) {
    return 'Todavía no hay habitación. Pulsá j o /join (Enter = topic de prueba).'
  }
  if (/64 hex|hex string/i.test(msg)) {
    return 'Ese topic no es 64 caracteres hex. Pegá el id completo o Enter para el de prueba.'
  }
  if (/timed out waiting for peer/i.test(msg)) {
    return 'Nadie en la habitación todavía. En la otra PC: mismo topic y jojun join (o j).'
  }
  if (/timed out waiting for blob/i.test(msg)) {
    return 'No llegó ningún blob. En la otra PC: jojun paste (o p) con el mismo topic.'
  }
  if (/storage directory/i.test(msg)) {
    return 'Sesión sin carpeta de storage. Relanzá con --storage o desde Pear.'
  }
  return msg
}

module.exports = { humanError }
