param([ValidateRange(1024, 65535)][int]$Port = 4318, [switch]$Remove)
$ErrorActionPreference = 'Stop'
$protocolPath = 'HKCU:\Software\Classes\xfinitydigitalhome'
$handlerPath = Join-Path $PSScriptRoot 'dist\server\auth-callback.js'
$nodePath = (Get-Command node -CommandType Application).Source
$command = '"' + $nodePath + '" "' + $handlerPath + '" "%1" ' + $Port
if (Test-Path -LiteralPath $protocolPath) {
  $existing = (Get-Item -LiteralPath "$protocolPath\shell\open\command").GetValue('')
  if ($existing -ne $command) { throw 'A different application owns this callback. No changes made.' }
}
if ($Remove) {
  if (Test-Path -LiteralPath $protocolPath) { Remove-Item -LiteralPath $protocolPath -Recurse }
  Write-Output 'SmartHome sign-in callback removed.'
  exit
}
if (-not (Test-Path -LiteralPath $handlerPath)) { throw 'Build the camera viewer first.' }
New-Item -Path "$protocolPath\shell\open\command" -Force | Out-Null
Set-Item -LiteralPath $protocolPath -Value 'URL:SmartHome Xfinity sign-in'
New-ItemProperty -LiteralPath $protocolPath -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
Set-Item -LiteralPath "$protocolPath\shell\open\command" -Value $command
Write-Output 'SmartHome sign-in callback registered for the current Windows user.'
