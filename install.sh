#!/usr/bin/env bash
# Install Jojun from GitHub Releases into ~/.local/bin/jojun
# Portable on macOS (BSD sed/grep) and Linux.
set -euo pipefail

OWNER="${JOJUN_OWNER:-Organization-Jojun}"
REPO="${JOJUN_REPO:-joju-cli}"
VERSION="${JOJUN_VERSION:-}"
API="https://api.github.com/repos/${OWNER}/${REPO}/releases"
DEST_DIR="${JOJUN_INSTALL_DIR:-${HOME}/.local/bin}"
DEST="${DEST_DIR}/jojun"

# Extract "tag_name":"vX.Y.Z" without GNU sed extensions (macOS BSD sed
# does not treat \? as optional in BRE — that was the Mac install failure).
parse_tag_name() {
  local json="$1"
  local tag=""
  tag="$(printf '%s' "$json" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n1 | cut -d'"' -f4 || true)"
  if [ -z "$tag" ]; then
    # sed -E works on both macOS and GNU
    tag="$(printf '%s' "$json" | sed -nE 's/.*"tag_name"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' | head -n1 || true)"
  fi
  tag="${tag#v}"
  printf '%s' "$tag"
}

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
  VER="$(parse_tag_name "$RELEASE_JSON")"
fi

if [ -z "$VER" ]; then
  echo "jojun-install: could not resolve release version" >&2
  echo "jojun-install: API response did not contain tag_name (rate limit, network, or parser bug)" >&2
  exit 1
fi

ASSET="jojun_${VER}_${HOST}.tar.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading ${ASSET}..."
# Prefer constructed URL (reliable). JSON scrape of browser_download_url is optional.
ASSET_URL="https://github.com/${OWNER}/${REPO}/releases/download/v${VER}/${ASSET}"
SCRAPED="$(printf '%s' "$RELEASE_JSON" | grep -o "\"browser_download_url\"[[:space:]]*:[[:space:]]*\"[^\"]*${ASSET}\"" | head -n1 | cut -d'"' -f4 || true)"
if [ -n "$SCRAPED" ]; then
  ASSET_URL="$SCRAPED"
fi

curl -fsSL -H "User-Agent: jojun-cli" -o "${TMP}/${ASSET}" "$ASSET_URL"
curl -fsSL -H "User-Agent: jojun-cli" -o "${TMP}/checksums.txt" \
  "https://github.com/${OWNER}/${REPO}/releases/download/v${VER}/checksums.txt"

EXPECTED="$(awk -v f="$ASSET" '$2 == f || $2 == ("*" f) { print $1; exit }' "${TMP}/checksums.txt")"
if [ -z "$EXPECTED" ]; then
  echo "jojun-install: no checksum for ${ASSET}" >&2
  echo "jojun-install: available assets for v${VER} should include darwin-arm64 / linux-x64 (see GitHub Releases)" >&2
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

# Ensure ~/.local/bin is on PATH for new shells (Pear-era Mac path).
ensure_unix_path() {
  local dir="$1"
  case ":${PATH}:" in
    *":${dir}:"*) return 0 ;;
  esac
  export PATH="${dir}:${PATH}"
  local shell_name rc line
  shell_name="$(basename "${SHELL:-/bin/zsh}")"
  case "$shell_name" in
    zsh) rc="${HOME}/.zshrc" ;;
    bash) rc="${HOME}/.bash_profile" ;;
    fish)
      mkdir -p "${HOME}/.config/fish"
      rc="${HOME}/.config/fish/config.fish"
      line="fish_add_path ${dir}"
      if [ -f "$rc" ] && grep -Fq "$line" "$rc" 2>/dev/null; then return 0; fi
      printf '\n%s\n' "$line" >>"$rc"
      return 0
      ;;
    *) rc="${HOME}/.profile" ;;
  esac
  line="export PATH=\"\$PATH:${dir}\""
  if [ -f "$rc" ] && grep -Fq "$dir" "$rc" 2>/dev/null; then return 0; fi
  printf '\n%s\n' "$line" >>"$rc"
}

ensure_unix_path "$DEST_DIR"

echo "Installed ${DEST} (v${VER})"
echo "Open a new terminal if needed, then type: jojun"
if [ "$PLATFORM" = darwin ]; then
  echo "First run on Apple Silicon may ad-hoc codesign the Mach-O (darwin-wrap)."
fi
