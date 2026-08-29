# Install Jojun from GitHub Releases → %LOCALAPPDATA%\Programs\Jojun\jojun.exe
# Safe for Windows PowerShell 5.1 and PowerShell 7+ (including irm | iex).
$ErrorActionPreference = 'Stop'

# WinPS 5.1 often defaults to TLS 1.0; GitHub requires TLS 1.2+.
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  } catch {
    # best-effort
  }
}

function Get-JojunArch {
  $pa = [string]$env:PROCESSOR_ARCHITECTURE
  $paWow = [string]$env:PROCESSOR_ARCHITEW6432
  if ($pa -match 'ARM64' -or $paWow -match 'ARM64') { return 'arm64' }
  if ($pa -eq 'AMD64' -or $paWow -eq 'AMD64' -or [Environment]::Is64BitOperatingSystem) { return 'x64' }
  if ($pa -eq 'x86' -and -not $paWow) {
    throw 'jojun-install: 32-bit Windows is not supported (need win32-x64 or win32-arm64)'
  }
  # Fallback for PS7+ / .NET where env is odd
  try {
    $runtime = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
    if ($null -ne $runtime) {
      $name = $runtime.ToString().ToLowerInvariant()
      if ($name -eq 'arm64') { return 'arm64' }
      if ($name -eq 'x64' -or $name -eq 'x86') { return 'x64' }
    }
  } catch {}
  throw "jojun-install: could not detect CPU architecture (PROCESSOR_ARCHITECTURE=$pa)"
}

function Add-JojunUserPath([string]$Dir) {
  if ([string]::IsNullOrWhiteSpace($Dir)) { return $false }
  $user = [Environment]::GetEnvironmentVariable('Path', 'User')
  if ($null -eq $user) { $user = '' }
  $norm = $Dir.TrimEnd('\')
  foreach ($part in ($user -split ';')) {
    if ($part.TrimEnd('\').ToLowerInvariant() -eq $norm.ToLowerInvariant()) {
      return $false
    }
  }
  $new = if ([string]::IsNullOrWhiteSpace($user)) { $norm } else { $user.TrimEnd(';') + ';' + $norm }
  [Environment]::SetEnvironmentVariable('Path', $new, 'User')
  # Make it visible in this session too
  if ($env:Path -notlike "*$norm*") {
    $env:Path = $norm + ';' + $env:Path
  }
  return $true
}

function Invoke-JojunDownload([string]$Uri, [string]$OutFile) {
  # -UseBasicParsing avoids IE COM null crashes on WinPS 5.1
  Invoke-WebRequest -Uri $Uri -OutFile $OutFile -UseBasicParsing -Headers @{
    'User-Agent' = 'jojun-cli'
  }
}

$Owner = if ($env:JOJUN_OWNER) { $env:JOJUN_OWNER } else { 'Organization-Jojun' }
$Repo = if ($env:JOJUN_REPO) { $env:JOJUN_REPO } else { 'joju-cli' }
$Version = $env:JOJUN_VERSION
$Api = "https://api.github.com/repos/$Owner/$Repo/releases"

if ([string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
  throw 'jojun-install: LOCALAPPDATA is empty; run from a normal user PowerShell (not a broken service session)'
}

$DestDir = if ($env:JOJUN_INSTALL_DIR) {
  $env:JOJUN_INSTALL_DIR
} else {
  Join-Path $env:LOCALAPPDATA 'Programs\Jojun'
}
$Dest = Join-Path $DestDir 'jojun.exe'
$HostArch = Get-JojunArch
$HostKey = "win32-$HostArch"

$headers = @{
  'User-Agent' = 'jojun-cli'
  'Accept'     = 'application/vnd.github+json'
}

Write-Host "Resolving release from GitHub ($Owner/$Repo)..."
if ($Version) {
  $Ver = ([string]$Version).Trim().TrimStart('v')
  if (-not $Ver) { throw 'jojun-install: JOJUN_VERSION is empty' }
  $release = Invoke-RestMethod -Headers $headers -Uri "$Api/tags/v$Ver"
} else {
  $release = Invoke-RestMethod -Headers $headers -Uri "$Api/latest"
  if ($null -eq $release -or -not $release.tag_name) {
    throw 'jojun-install: GitHub /releases/latest returned no tag_name (rate limit or network?)'
  }
  $Ver = ([string]$release.tag_name).TrimStart('v')
}

if (-not $Ver) { throw 'jojun-install: could not resolve version' }

$AssetName = "jojun_${Ver}_${HostKey}.zip"
$asset = @($release.assets) | Where-Object { $_.name -eq $AssetName } | Select-Object -First 1
$sums = @($release.assets) | Where-Object { $_.name -eq 'checksums.txt' } | Select-Object -First 1

if (-not $asset -or -not $asset.browser_download_url) {
  throw "jojun-install: asset not found for this PC: $AssetName (tag v$Ver). Check https://github.com/$Owner/$Repo/releases"
}
if (-not $sums -or -not $sums.browser_download_url) {
  throw 'jojun-install: checksums.txt missing from release'
}

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("jojun-install-" + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $zipPath = Join-Path $tmp $AssetName
  $sumPath = Join-Path $tmp 'checksums.txt'
  Write-Host "Downloading $AssetName..."
  Invoke-JojunDownload -Uri $asset.browser_download_url -OutFile $zipPath
  Invoke-JojunDownload -Uri $sums.browser_download_url -OutFile $sumPath

  if (-not (Test-Path -LiteralPath $zipPath)) {
    throw 'jojun-install: download failed (zip missing)'
  }

  $expected = $null
  foreach ($line in Get-Content -LiteralPath $sumPath) {
    if ($line -match '^([a-fA-F0-9]{64})\s+\*?(.+)$') {
      if ($Matches[2].Trim() -eq $AssetName) {
        $expected = $Matches[1].ToLowerInvariant()
        break
      }
    }
  }
  if (-not $expected) { throw "jojun-install: no checksum for $AssetName" }

  $sha = [System.Security.Cryptography.SHA256]::Create()
  $fs = [System.IO.File]::OpenRead($zipPath)
  try {
    $hashBytes = $sha.ComputeHash($fs)
    $hash = [BitConverter]::ToString($hashBytes).Replace('-', '').ToLowerInvariant()
  } finally {
    $fs.Dispose()
    $sha.Dispose()
  }
  if ($hash -ne $expected) {
    throw "jojun-install: checksum mismatch`n  expected $expected`n  got      $hash"
  }

  $extract = Join-Path $tmp 'out'
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extract -Force
  $bin = Get-ChildItem -Path $extract -Recurse -Filter 'jojun.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $bin) { throw 'jojun-install: archive missing jojun.exe' }

  New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
  Copy-Item -LiteralPath $bin.FullName -Destination $Dest -Force

  $pathAdded = Add-JojunUserPath -Dir $DestDir

  Write-Host "Installed $Dest (v$Ver)"
  if ($pathAdded) {
    Write-Host "Added $DestDir to your user PATH."
  }
  Write-Host 'Open a NEW terminal and type: jojun'
} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
