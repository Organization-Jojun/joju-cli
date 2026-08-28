# Guía de despliegue — Jojun (GitHub Releases + bare-build)

Jojun **no** usa GoReleaser ni Pear. El binario sale de `bare-build`; el canal de distribución es GitHub Releases.

## Flujo

1. Bump `version` en `package.json`.
2. Tag semántico y push: `git tag v0.1.0 && git push origin v0.1.0`
3. Workflow [`.github/workflows/release.yml`](.github/workflows/release.yml):
   - `npm test`
   - `npm run make:*` en Windows / macOS / Linux runners
   - `node scripts/pack-release-asset.js` (zip/tar.gz + `checksums.txt`; darwin pasa por `darwin-wrap`)
   - Publica assets en el Release del tag
4. Usuarios instalan con:
   - Unix: `curl -fsSL https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/scripts/install.sh | bash`
   - Windows: `irm https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/scripts/install.ps1 | iex`
5. Actualizar: `jojun update` (verifica SHA-256 del asset)

## Destinos de install (no cambiar)

| OS | Path |
|----|------|
| Windows | `%LOCALAPPDATA%\Programs\Jojun\jojun.exe` |
| macOS / Linux | `~/.local/bin/jojun` |

PATH: primer run de `jojun` llama `ensureOnPath()` (Windows: `SetEnvironmentVariable` User Path, **nunca setx**).

## Assets

`jojun_<version>_<platform>-<arch>.zip` (Windows) o `.tar.gz` (Unix), más `checksums.txt`.
