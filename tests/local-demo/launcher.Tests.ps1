$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
function Assert-True($Value,[string]$Message) { if (-not $Value) { throw $Message } }
# Native Windows parsing, entrypoint and OS process/lock tests. Docker command cases below are simulations.
$tokens=$null; $errors=$null
[void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path $root 'scripts/local-demo.ps1'),[ref]$tokens,[ref]$errors)
Assert-True ($errors.Count -eq 0) 'PowerShell launcher has parse errors'
$env:VOLUME_DEMO_WINDOWS_WORKER='1'
& node --test (Join-Path $root 'tests/local-demo/admin.test.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Native Windows Node safety cases failed' }
$temp=Join-Path $env:TEMP ('VOLUME test co dau đ & space '+[guid]::NewGuid())
New-Item -ItemType Directory -Path (Join-Path $temp 'scripts') -Force | Out-Null
try {
    Copy-Item (Join-Path $root 'START_VOLUME.bat') $temp
    Copy-Item (Join-Path $root 'STOP_VOLUME.bat') $temp
    Copy-Item (Join-Path $root 'scripts/local-demo.ps1') (Join-Path $temp 'scripts')
    Copy-Item (Join-Path $root 'scripts/local-demo-admin.mjs') (Join-Path $temp 'scripts')
    $info=New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName=Join-Path $env:SystemRoot 'System32/cmd.exe'
    $info.Arguments='/d /c ""'+(Join-Path $temp 'START_VOLUME.bat')+'""'
    $info.UseShellExecute=$false
    $info.RedirectStandardInput=$true; $info.RedirectStandardOutput=$true; $info.RedirectStandardError=$true
    $info.EnvironmentVariables['PATH']=(Join-Path $env:SystemRoot 'System32')+';'+(Join-Path $env:SystemRoot 'System32/WindowsPowerShell/v1.0')
    $p=New-Object System.Diagnostics.Process; $p.StartInfo=$info
    [void]$p.Start();$p.StandardInput.WriteLine('');$p.StandardInput.Close()
    $output=$p.StandardOutput.ReadToEnd()+$p.StandardError.ReadToEnd()
    Assert-True ($p.WaitForExit(30000)) 'Entry point did not exit safely'
    Assert-True ($p.ExitCode -ne 0) 'Missing Node must fail'
    Assert-True ($output -match 'Chua co Node.js') 'Missing dependency instructions absent'
    Write-Host 'PASS D01/D02/D21 native .bat -> Windows PowerShell, Unicode/space/& path, missing dependency UI'
    # STOP with no state is a real native invocation; it must not invoke Docker at all.
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $temp 'scripts/local-demo.ps1') -Action Stop
    Assert-True ($LASTEXITCODE -eq 0) 'Native STOP without owned resources failed'
    Write-Host 'PASS D15 native repeatable no-resource STOP'
} finally {
    Remove-Item -LiteralPath $temp -Recurse -Force
}
Write-Host 'Windows entrypoints/process identity/kernel locks: REAL WINDOWS. Container ownership scenarios: SIMULATED. Full Windows Docker Desktop stack: NOT RUN on this hosted runner.'
