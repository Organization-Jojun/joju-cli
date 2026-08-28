#Requires -Version 5.1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "npm test"
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "CLI help"
node .\node_modules\bare-runtime\bin\bare bin.mjs --no-updates --help
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

$exe = Join-Path $PWD "out\win32-x64\jojun.exe"
if (Test-Path $exe) {
  Write-Host "standalone --version"
  & $exe --no-updates --version
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "OK — mock smoke. Install: irm .../scripts/install.ps1 | iex"
