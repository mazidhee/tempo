param([string[]]$Names)
$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot '../.review/foundation/registry'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$pending = [System.Collections.Generic.Queue[string]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new()
foreach ($name in $Names) { $pending.Enqueue($name) }
while ($pending.Count) {
  $name = $pending.Dequeue()
  if (-not $seen.Add($name)) { continue }
  $path = Join-Path $destination "$name.json"
  Invoke-WebRequest -Uri "https://ui.shadcn.com/r/styles/new-york/$name.json" -OutFile $path -TimeoutSec 35
  $item = Get-Content -LiteralPath $path -Raw | ConvertFrom-Json
  foreach ($dependency in $item.registryDependencies) {
    if ($dependency -match '^[a-z-]+$') { $pending.Enqueue($dependency) }
  }
  Write-Output "Fetched $name"
}
# Point the CLI at these identical official sources through the working Windows
# network path. This avoids Node's direct-fetch timeout without substituting code.
Get-ChildItem -LiteralPath $destination -Filter '*.json' | ForEach-Object {
  $item = Get-Content -LiteralPath $_.FullName -Raw | ConvertFrom-Json
  if ($item.registryDependencies) {
    $item.registryDependencies = @($item.registryDependencies | ForEach-Object {
      if ($_ -match '^[a-z-]+$') { (Join-Path $destination "$_.json").Replace('\','/') } else { $_ }
    })
    $item | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $_.FullName -Encoding utf8
  }
}
