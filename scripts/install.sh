#!/usr/bin/env bash
# Install Jojun from GitHub Releases into ~/.local/bin/jojun
set -euo pipefail

OWNER="${JOJUN_OWNER:-Organization-Jojun}"
REPO="${JOJUN_REPO:-joju-cli}"
VERSION="${JOJUN_VERSION:-}"
API="https://api.github.com/repos/${OWNER}/${REPO}/releases"
DEST_DIR="${JOJUN_INSTALL_DIR:-${HOME}/.local/bin}"
DEST="${DEST_DIR}/jojun"

uname_s="$(uname -s | tr '[:upper:]' '[:lower:]')"
uname_m="$(uname -m)"

case "$uname_s" in
  linux*) PLATFORM=linux ;;
  darwin*) PLATFORM=darwin ;;
  *) echo "jojun-install: unsupported OS: $uname_s" >&2; exit 1 ;;
esac

case "$uname_m" in
  x86_64|amd64) ARCH=x64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) echo "jojun-install: unsupported arch: $uname_m" >&2; exit 1 ;;
esac

HOST="${PLATFORM}-${ARCH}"

if [ -n "$VERSION" ]; then
  VER="${VERSION#v}"
  RELEASE_JSON="$(curl -fsSL -H "Accept: application/vnd.github+json" -H "User-Agent: jojun-cli" "${API}/tags/v${VER}")"
else
  RELEASE_JSON="$(curl -fsSL -H "Accept: application/vnd.github+json" -H "User-Agent: jojun-cli" "${API}/latest")"
  VER="$(printf '%s' "$RELEASE_JSON" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"v\?\([^"]*\)".*/\1/p' | head -n1)"
fi

if [ -z "$VER" ]; then
  echo "jojun-install: could not resolve release version" >&2
  exit 1
fi

ASSET="jojun_${VER}_${HOST}.tar.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading ${ASSET}..."
ASSET_URL="$(printf '%s' "$RELEASE_JSON" | sed -n "s/.*\"browser_download_url\"[[:space:]]*:[[:space:]]*\"\\([^\"]*${ASSET}\\)\".*/\\1/p" | head -n1)"
if [ -z "$ASSET_URL" ]; then
  # fallback: construct from tag
  ASSET_URL="https://github.com/${OWNER}/${REPO}/releases/download/v${VER}/${ASSET}"
fi

curl -fsSL -H "User-Agent: jojun-cli" -o "${TMP}/${ASSET}" "$ASSET_URL"
curl -fsSL -H "User-Agent: jojun-cli" -o "${TMP}/checksums.txt" \
  "https://github.com/${OWNER}/${REPO}/releases/download/v${VER}/checksums.txt"

EXPECTED="$(awk -v f="$ASSET" '$2 == f || $2 == ("*" f) { print $1; exit }' "${TMP}/checksums.txt")"
if [ -z "$EXPECTED" ]; then
  echo "jojun-install: no checksum for ${ASSET}" >&2
  exit 1
fi

if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL="$(sha256sum "${TMP}/${ASSET}" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  ACTUAL="$(shasum -a 256 "${TMP}/${ASSET}" | awk '{print $1}')"
else
  echo "jojun-install: need sha256sum or shasum" >&2
  exit 1
fi

if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "jojun-install: checksum mismatch" >&2
  echo "  expected ${EXPECTED}" >&2
  echo "  got      ${ACTUAL}" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
tar -xzf "${TMP}/${ASSET}" -C "$TMP"
if [ -f "${TMP}/jojun" ]; then
  install -m 755 "${TMP}/jojun" "$DEST"
elif [ -f "${TMP}/${HOST}/jojun" ]; then
  install -m 755 "${TMP}/${HOST}/jojun" "$DEST"
else
  FOUND="$(find "$TMP" -type f -name jojun | head -n1)"
  if [ -z "$FOUND" ]; then
    echo "jojun-install: archive missing jojun binary" >&2
    exit 1
  fi
  install -m 755 "$FOUND" "$DEST"
fi

echo "Installed ${DEST} (v${VER})"
case ":${PATH}:" in
  *":${DEST_DIR}:"*) ;;
  *)
    # best-effort for this shell; persistent PATH is usually already set for ~/.local/bin
    export PATH="${DEST_DIR}:${PATH}"
    ;;
esac
echo "Open a new terminal if needed, then type: jojun"
echo "First run on macOS may codesign the binary (Apple Silicon)."
