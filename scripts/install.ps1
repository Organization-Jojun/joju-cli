# Legacy path (older docs). Prefer: irm .../install.ps1 | iex  (repo root)
$ErrorActionPreference = 'Stop'
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {
  try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
}

$local = $null
if ($PSScriptRoot) {
  $local = Join-Path $PSScriptRoot '..\install.ps1'
}
if ($local -and (Test-Path -LiteralPath $local)) {
  & $local
  return
}

$u = 'https://raw.githubusercontent.com/Organization-Jojun/joju-cli/main/install.ps1'
Invoke-Expression (Invoke-RestMethod -Uri $u -Headers @{ 'User-Agent' = 'jojun-cli' })
