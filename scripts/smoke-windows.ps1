#Requires -Version 5.1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$pear = Join-Path $env:LOCALAPPDATA "Programs\pear\pear.exe"
if (Test-Path $pear) {
  $pearDir = Split-Path $pear
  if ($env:PATH -notlike "*$pearDir*") {
    $env:PATH = "$pearDir;$env:PATH"
  }
  $env:PEAR_BIN = $pear
  Write-Host "Pear: $pear"
} else {
  Write-Host "Pear CLI no encontrada en $pear — instala con: irm https://install.pears.com/pear.ps1 | iex"
}

Write-Host "npm test"
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "npm start"
npm start
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:JOJUN_USE_MOCK_P2P = "1"
$storage = Join-Path $env:TEMP "jojun-smoke"
Remove-Item -Recurse -Force $storage -ErrorAction SilentlyContinue
$topic = "68656c6c6f2d6a6f6a756e000000000000000000000000000000000000000000"
$bare = ".\node_modules\bare-runtime\bin\bare"

Write-Host "mock join/paste/yank"
node $bare bin.mjs --no-updates --storage $storage join $topic
"hello jojun" | node $bare bin.mjs --no-updates --storage $storage paste
node $bare bin.mjs --no-updates --storage $storage yank
Write-Host ""
Write-Host "OK — mock smoke. Para P2P real: dos ventanas, ver README."
