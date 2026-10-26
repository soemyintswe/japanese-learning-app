param(
  [string]$Repository = 'soemyintswe/japanese-learning-app',
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw 'GitHub CLI (gh) is required. Install it and run: gh auth login'
}

$json = gh release list --repo $Repository --limit 1000 --json tagName,publishedAt,isDraft,isLatest,isPrerelease
if ($LASTEXITCODE -ne 0) { throw "Could not list releases for $Repository." }

$releases = @($json | ConvertFrom-Json | Where-Object { -not $_.isDraft })

if ($releases.Count -le 1) {
  Write-Output 'There is at most one published release. Nothing to remove.'
  exit 0
}

$latest = $releases | Where-Object { $_.isLatest } | Select-Object -First 1
if (-not $latest) {
  $stable = @($releases | Where-Object { -not $_.isPrerelease } | Sort-Object {
    [DateTimeOffset]::Parse($_.publishedAt)
  } -Descending)
  if ($stable.Count -gt 0) { $latest = $stable[0] }
  else { $latest = $releases | Sort-Object { [DateTimeOffset]::Parse($_.publishedAt) } -Descending | Select-Object -First 1 }
}
Write-Output "Keeping latest published release: $($latest.tagName) ($($latest.publishedAt))"

foreach ($release in $releases | Where-Object { $_.tagName -ne $latest.tagName }) {
  if ($Apply) {
    Write-Output "Deleting release and tag: $($release.tagName)"
    gh release delete $release.tagName --repo $Repository --yes --cleanup-tag
    if ($LASTEXITCODE -ne 0) { throw "Failed to delete release $($release.tagName)." }
  } else {
    Write-Output "Would delete release and tag: $($release.tagName)"
  }
}

if (-not $Apply) {
  Write-Output 'Dry run only. Draft releases are left untouched. Review the list, then rerun with -Apply to delete other published releases and their tags.'
}
