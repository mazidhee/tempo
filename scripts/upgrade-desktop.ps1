# Upgrade the existing per-user Tempo installation after the review gate.
param([Parameter(Mandatory=$true)][string]$ReviewedInstallerSha256)
$ErrorActionPreference = 'Stop'
$tempoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$tempoProgram = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'Programs\Tempo\Habit Tracker.exe'))
$tempoMetadata = Get-Content -LiteralPath (Join-Path $tempoRoot 'package.json') -Raw | ConvertFrom-Json
$tempoInstaller = [IO.Path]::GetFullPath((Join-Path $tempoRoot "release\desktop\Habit Tracker Setup $($tempoMetadata.version).exe"))
$expectedInstallerHash = $ReviewedInstallerSha256
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
Push-Location -LiteralPath $tempoRoot
try {
    $tempoBaselineText = & node scripts/upgrade-baseline.cjs
    if ($LASTEXITCODE -ne 0) { throw 'Backup failed; the upgrade has not started.' }
    $tempoBaseline = ($tempoBaselineText -join "`n") | ConvertFrom-Json
    $tempoBaselinePath = Join-Path (Split-Path $tempoBaseline.backup -Parent) 'baseline.json'
    # Modern Tempo closes to its tray. Only end this exact executable after a
    # consistent SQLite backup; enabled Guard requires its own Quit cleanup.
    if ($tempoBaseline.guardEnabled -and @(Get-TempoMainProcess).Count -gt 0) { throw 'Use Quit Tempo from its tray to release enabled Guard before upgrading. The backup is retained.' }
    foreach ($tempoMain in @(Get-TempoMainProcess)) {
        $tempoProcess = Get-Process -Id $tempoMain.ProcessId
        [void]$tempoProcess.CloseMainWindow()
    }
    Start-Sleep -Milliseconds 750
    foreach ($tempoMain in @(Get-TempoMainProcess)) { Stop-Process -Id $tempoMain.ProcessId }
    $tempoDeadline = [DateTime]::UtcNow.AddSeconds(10)
    while (@(Get-TempoMainProcess).Count -gt 0 -and [DateTime]::UtcNow -lt $tempoDeadline) { Start-Sleep -Milliseconds 250 }
    if (@(Get-TempoMainProcess).Count -gt 0) { throw 'Tempo is still running; the upgrade has not started.' }
    $tempoSetup = Start-Process -FilePath $tempoInstaller -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
    if ($tempoSetup.ExitCode -ne 0) { throw "Installer exit code $($tempoSetup.ExitCode)." }
    $tempoVersion = (Get-Item -LiteralPath $tempoProgram).VersionInfo.ProductVersion
    if ($tempoVersion -notlike "$($tempoMetadata.version)*") { throw "Unexpected installed version $tempoVersion." }
    & node scripts/installed-acceptance.cjs $tempoBaselinePath --import-roadmaps
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
