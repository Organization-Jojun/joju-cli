#Requires -Version 5.0
<#
.SYNOPSIS
  Install Jojun from GitHub Releases into %LOCALAPPDATA%\Programs\Jojun\jojun.exe
#>
$ErrorActionPreference = 'Stop'

$Owner = if ($env:JOJUN_OWNER) { $env:JOJUN_OWNER } else { 'Organization-Jojun' }
$Repo = if ($env:JOJUN_REPO) { $env:JOJUN_REPO } else { 'joju-cli' }
$Version = $env:JOJUN_VERSION
$Api = "https://api.github.com/repos/$Owner/$Repo/releases"
$DestDir = if ($env:JOJUN_INSTALL_DIR) {
  $env:JOJUN_INSTALL_DIR
} else {
  Join-Path $env:LOCALAPPDATA 'Programs\Jojun'
}
$Dest = Join-Path $DestDir 'jojun.exe'

$arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
switch ($arch) {
  'x64' { $HostArch = 'x64' }
  'arm64' { $HostArch = 'arm64' }
  default { throw "jojun-install: unsupported arch: $arch" }
}
$HostKey = "win32-$HostArch"

$headers = @{
  'User-Agent' = 'jojun-cli'
  'Accept'     = 'application/vnd.github+json'
}

if ($Version) {
  $Ver = $Version.TrimStart('v')
  $release = Invoke-RestMethod -Headers $headers -Uri "$Api/tags/v$Ver"
} else {
  $release = Invoke-RestMethod -Headers $headers -Uri "$Api/latest"
  $Ver = ($release.tag_name -replace '^v', '')
}

$AssetName = "jojun_${Ver}_${HostKey}.zip"
$asset = $release.assets | Where-Object { $_.name -eq $AssetName } | Select-Object -First 1
$sums = $release.assets | Where-Object { $_.name -eq 'checksums.txt' } | Select-Object -First 1

if (-not $asset) {
  throw "jojun-install: asset not found: $AssetName"
}
if (-not $sums) {
  throw 'jojun-install: checksums.txt missing from release'
}

$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("jojun-install-" + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $zipPath = Join-Path $tmp $AssetName
  $sumPath = Join-Path $tmp 'checksums.txt'
  Write-Host "Downloading $AssetName..."
  Invoke-WebRequest -Headers @{ 'User-Agent' = 'jojun-cli' } -Uri $asset.browser_download_url -OutFile $zipPath
  Invoke-WebRequest -Headers @{ 'User-Agent' = 'jojun-cli' } -Uri $sums.browser_download_url -OutFile $sumPath

  $expected = $null
  foreach ($line in Get-Content $sumPath) {
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
    $hash = [BitConverter]::ToString($sha.ComputeHash($fs)).Replace('-', '').ToLowerInvariant()
  } finally {
    $fs.Dispose()
    $sha.Dispose()
  }
  if ($hash -ne $expected) {
    throw "jojun-install: checksum mismatch`n  expected $expected`n  got      $hash"
  }

  $extract = Join-Path $tmp 'out'
  Expand-Archive -LiteralPath $zipPath -DestinationPath $extract -Force
  $bin = Get-ChildItem -Path $extract -Recurse -Filter 'jojun.exe' | Select-Object -First 1
  if (-not $bin) { throw 'jojun-install: archive missing jojun.exe' }

  New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
  Copy-Item -LiteralPath $bin.FullName -Destination $Dest -Force

  Write-Host "Installed $Dest (v$Ver)"
  Write-Host "Run jojun once so it can add this folder to your user PATH (never uses setx)."
  Write-Host 'Then open a new terminal and type: jojun'
} finally {
  Remove-Item -LiteralPath $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
