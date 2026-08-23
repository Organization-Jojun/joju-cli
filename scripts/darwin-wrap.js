'use strict'

/**
 * Apple Silicon SIGKILLs a Mach-O whose ad-hoc signature does not match
 * the bytes (pear stage from Windows often leaves a stale LC_CODE_SIGNATURE).
 * pear-install only copies one file (~/.local/bin/jojun). That file must be a
 * *shell script* so it can start, then extract + `codesign --force --sign -`
 * the real binary and exec it.
 */
function wrapDarwinBin(macho) {
  if (!Buffer.isBuffer(macho) || macho.length < 4) {
    throw new Error('darwin wrap needs a Mach-O buffer')
  }

  function header(skip) {
    return (
      '#!/bin/sh\n' +
      'set -e\n' +
      'CACHE="${HOME}/Library/Caches/jojun/jojun.bin.v3"\n' +
      'SKIP=' +
      skip +
      '\n' +
      'mkdir -p "$(dirname "$CACHE")"\n' +
      'if [ ! -x "$CACHE" ] || [ "$0" -nt "$CACHE" ]; then\n' +
      '  /usr/bin/tail -c +$((SKIP + 1)) "$0" > "$CACHE.tmp"\n' +
      '  HEAD=$(od -An -tx1 -N 4 "$CACHE.tmp" | tr -d " \\n")\n' +
      '  if [ "$HEAD" != "cffaedfe" ]; then echo "jojun: bad payload $HEAD" >&2; exit 1; fi\n' +
      '  chmod +x "$CACHE.tmp"\n' +
      '  /usr/bin/codesign --force --sign - "$CACHE.tmp"\n' +
      '  /usr/bin/codesign --verify "$CACHE.tmp"\n' +
      '  mv "$CACHE.tmp" "$CACHE"\n' +
      'fi\n' +
      'exec "$CACHE" "$@"\n'
    )
  }

  let skip = 0
  let text = header(skip)
  for (let i = 0; i < 10; i++) {
    skip = Buffer.byteLength(text, 'utf8')
    text = header(skip)
    if (Buffer.byteLength(text, 'utf8') === skip) break
  }
  if (Buffer.byteLength(text, 'utf8') !== skip) {
    throw new Error('darwin wrap skip did not converge')
  }

  return {
    skip,
    header: text,
    buf: Buffer.concat([Buffer.from(text, 'utf8'), macho])
  }
}

module.exports = { wrapDarwinBin }
