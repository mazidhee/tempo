# Upgrade the existing per-user Tempo installation after the review gate.
$ErrorActionPreference = 'Stop'
$tempoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$tempoProgram = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'Programs\Tempo\Habit Tracker.exe'))
$tempoInstaller = [IO.Path]::GetFullPath((Join-Path $tempoRoot 'release\desktop\Habit Tracker Setup 1.2.0.exe'))
$expectedInstallerHash = '7B6EF8ED160B0959119A4A1AE3BAD04AB2FA12250EE89F0FDD54869199D45E5E'
if ((Get-FileHash -LiteralPath $tempoInstaller -Algorithm SHA256).Hash -ne $expectedInstallerHash) {
    throw 'Installer differs from the independently reviewed candidate.'
}
if ($tempoProgram -ne (Join-Path $env:LOCALAPPDATA 'Programs\Tempo\Habit Tracker.exe')) {
    throw 'Unexpected installation target.'
}
function Get-TempoMainProcess {
    Get-CimInstance Win32_Process | Where-Object {
        $_.ExecutablePath -eq $tempoProgram -and $_.CommandLine -notmatch '--type='
    }
}
foreach ($tempoMain in @(Get-TempoMainProcess)) {
    $tempoProcess = Get-Process -Id $tempoMain.ProcessId
    if (-not $tempoProcess.CloseMainWindow()) {
        throw 'Tempo could not close gracefully. Keep its files intact and close its window before retrying.'
    }
}
$tempoDeadline = [DateTime]::UtcNow.AddSeconds(15)
while (@(Get-TempoMainProcess).Count -gt 0 -and [DateTime]::UtcNow -lt $tempoDeadline) {
    Start-Sleep -Milliseconds 250
}
if (@(Get-TempoMainProcess).Count -gt 0) { throw 'Tempo is still running; the upgrade has not started.' }
Push-Location -LiteralPath $tempoRoot
try {
    $tempoBaselineText = & node scripts/upgrade-baseline.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Backup failed; the upgrade has not started.' }
    $tempoBaseline = ($tempoBaselineText -join "`n") | ConvertFrom-Json
    $tempoBaselinePath = Join-Path (Split-Path $tempoBaseline.backup -Parent) 'baseline.json'
    $tempoSetup = Start-Process -FilePath $tempoInstaller -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
    if ($tempoSetup.ExitCode -ne 0) { throw "Installer exit code $($tempoSetup.ExitCode)." }
    $tempoVersion = (Get-Item -LiteralPath $tempoProgram).VersionInfo.ProductVersion
    if ($tempoVersion -notmatch '^1\.2\.0') { throw "Unexpected installed version $tempoVersion." }
    & node scripts/installed-acceptance.cjs $tempoBaselinePath
    if ($LASTEXITCODE -ne 0) { throw 'Installed acceptance failed. Backup and evidence are retained.' }
    $tempoShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Tempo.lnk'
    if (-not (Test-Path -LiteralPath $tempoShortcut)) { throw 'Desktop shortcut missing.' }
    $tempoShell = New-Object -ComObject WScript.Shell
    if ($tempoShell.CreateShortcut($tempoShortcut).TargetPath -ne $tempoProgram) { throw 'Unexpected desktop shortcut target.' }
    Start-Process -FilePath $tempoShortcut -WindowStyle Hidden
    # The first process inherits a hidden startup hint; a second instance uses
    # Tempo's own show/restore handler to present its real application window.
    Start-Sleep -Milliseconds 700
    Start-Process -FilePath $tempoShortcut -WindowStyle Hidden
    [PSCustomObject]@{ InstalledVersion = $tempoVersion; Shortcut = $tempoShortcut; Evidence = (Join-Path (Split-Path $tempoBaselinePath -Parent) 'acceptance.json') } | ConvertTo-Json
} finally { Pop-Location }
