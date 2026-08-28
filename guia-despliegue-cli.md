# Guía de despliegue — Jojun (GitHub Releases + bare-build)

Jojun **no** usa GoReleaser ni Pear. El binario sale de `bare-build`; el canal es GitHub Releases.

**Para agentes (checklist completo de versiones / update):** lee [`docs/RELEASE.md`](docs/RELEASE.md).

## Resumen rápido

1. Bump `version` en `package.json` → merge a `main`.
2. `git tag -a vX.Y.Z -m "…" && git push origin vX.Y.Z`
3. Actions publica assets + `checksums.txt`.
4. Usuarios: `install.sh` / `install.ps1` o `jojun update`.

## Destinos (no cambiar)

| OS | Path |
|----|------|
| Windows | `%LOCALAPPDATA%\Programs\Jojun\jojun.exe` |
| macOS / Linux | `~/.local/bin/jojun` |

PATH Windows: `SetEnvironmentVariable` User Path — **nunca setx**.
