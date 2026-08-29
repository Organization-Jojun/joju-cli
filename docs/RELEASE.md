# RELEASE.md — cómo publicar una versión nueva (para agentes)

Documento operativo para cloud/local agents. Si subes mal una release, `jojun update` e `install.sh` / `install.ps1` se rompen para todo el mundo.

## Qué es Jojun (post-Pear)

- **Producto:** clipboard P2P por Hyperswarm (`join` / `paste` / `yank` / `wait` / `leave`). Dos PCs, mismo room name, sin servidor.
- **Runtime del binario:** Bare (`bare-build` → exe standalone). Dev/tests: `bare-runtime`.
- **Distribución:** solo **GitHub Releases** del repo `Organization-Jojun/joju-cli`. No hay Pear, no hay seed EC2, no hace falta dejar una ventana abierta.
- **Self-update:** `jojun update` lee `https://api.github.com/repos/Organization-Jojun/joju-cli/releases/latest`, elige el asset del OS/arch, verifica SHA-256 de `checksums.txt`, reemplaza el binario.

Constantes de repo: [`src/update/release-config.js`](../src/update/release-config.js). **No cambies owner/repo sin actualizar también los instaladores.**

## Destinos de install (congelados — no reinventar)

| OS | Binario | PATH |
|----|---------|------|
| Windows | `%LOCALAPPDATA%\Programs\Jojun\jojun.exe` | Primer run: `ensureOnPath()` vía PowerShell `SetEnvironmentVariable` User Path. **Nunca `setx`.** |
| macOS / Linux | `~/.local/bin/jojun` | Append a shell rc solo si hace falta. Darwin: asset con `darwin-wrap` (codesign ad-hoc al primer run). |

Si cambias estas rutas, rompes uninstall, PATH y docs de agentes.

## Checklist exacto para subir `vX.Y.Z`

Hazlo en una rama `agent-a/…` o `agent-b/…`, merge a `main`, **después** taggea. El tag debe apuntar al commit que ya está (o quedará) en `main` con el `version` correcto.

1. **Bump** `"version"` en [`package.json`](../package.json) a `X.Y.Z` (sin `v`). Ese string es el que ve `--version` y el que usa `jojun update` para comparar.
2. **`npm test`** debe pasar en local (y pasará otra vez en CI).
3. **Commit** convencional, push de la rama, **merge a `main`**.
4. **Desde el commit de main** (o el mismo SHA ya mergeado):

```bash
git checkout main
git pull origin main
git tag -a vX.Y.Z -m "vX.Y.Z — <una frase>"
git push origin vX.Y.Z
```

5. El workflow [`.github/workflows/release.yml`](../.github/workflows/release.yml) se dispara solo con tags `v*`:
   - job `test` → `npm test`
   - matrix build: `make:win32-x64`, `make:darwin-arm64`, `make:linux-x64`
   - `node scripts/pack-release-asset.js` → `dist-release/jojun_X.Y.Z_<host>.zip|tar.gz` + líneas en `checksums.txt`
   - job `publish` sube todo al GitHub Release del tag
6. **Verifica** en Actions que el run quedó `success`, y en Releases que existen al menos:
   - `jojun_X.Y.Z_win32-x64.zip`
   - `jojun_X.Y.Z_darwin-arm64.tar.gz`
   - `jojun_X.Y.Z_linux-x64.tar.gz`
   - `checksums.txt` (una línea SHA-256 por asset)

7. **Smoke opcional:**
   - `jojun update --check` en una máquina con versión anterior → debe reportar newer.
   - `jojun update` → instala y `--version` refleja `X.Y.Z` (vía `bare-runtime` en dev si el standalone no pinta stdout en tu shell).

## Cómo funciona el update para el usuario

```
jojun update --check   # solo informa
jojun update           # descarga, verifica checksum, reemplaza binario
```

- One-shots con updates habilitados pueden loguear en `updates.log` si hay versión nueva (`run: jojun update`); **no** aplican solos.
- Sesión interactiva TTY: updates off (no molesta la UI).
- Windows: no se puede sobrescribir el `.exe` en uso → rename a `.old` + copy. Si falla: cerrar otras ventanas `jojun` y reintentar.
- `--no-updates` desactiva el check silencioso de ese run.

## Nombres de assets (contrato duro)

```
jojun_<version>_<platform>-<arch>.zip     # win32
jojun_<version>_<platform>-<arch>.tar.gz  # darwin / linux
```

Ejemplo: `jojun_0.2.0_win32-x64.zip`.  
`platform`: `win32` | `darwin` | `linux`.  
`arch`: `x64` | `arm64`.  
Dentro del archive: un solo binario `jojun` / `jojun.exe`.

Si renombras assets o omites `checksums.txt`, **install y update fallan**.

## Qué NO hacer

- No regenerar ni documentar `pear://` links.
- No volver a encender EC2 seed / `pear stage` / `pear seed`.
- No usar GoReleaser (este repo no es Go; el builder es `bare-build`).
- No tagear sin bump de `package.json` (update cree que ya está al día o compare mal).
- No force-push tags que ya tienen binarios en producción sin avisar.
- No editar a mano un Release a medias: deja que el workflow publique, o borra el Release y retagea limpio (`vX.Y.Z+1`).

## Install one-liners (usuarios / agentes)

```powershell
# Windows
irm https://get.jojun.jonathanrbt.lat | iex
```

```bash
# macOS / Linux
curl -fsSL https://get.jojun.jonathanrbt.lat | bash
```

Mirror (GitHub raw): `…/main/install.ps1` y `…/main/install.sh`.  
Worker Cloudflare `jojun-get` sirve esos scripts en `get.jojun.jonathanrbt.lat`.

Entrypoints públicos: `install.ps1` / `install.sh` en la **raíz** del repo. `scripts/install.*` solo redirigen (compat).

Override de versión: `JOJUN_VERSION=0.2.0` (con o sin `v`).

Prompt largo para coding agents: [`docs/AGENT-PROMPT.md`](AGENT-PROMPT.md).

## Breaking notes (agents)

- **v0.2.0:** room names → SHA-256 topics (no pad-hex, no public default room). Old and new clients with the same name will not peer. Uninstall reverses Unix shell-rc PATH lines Jojun wrote.

## Si el Release workflow falla

1. Mira el job rojo en Actions (casi siempre `npm test` o `bare-build` en un OS).
2. Corrige en rama, merge a main, **nuevo tag** (`vX.Y.Z+1`). No reuses un tag fallido a menos que lo borres en remoto y local a propósito.
3. Tests Windows-only (`pathHasDir` con `;`) deben skipear en Linux — no los “arregles” haciéndolos fallar en CI otra vez.
