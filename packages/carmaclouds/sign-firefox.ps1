<#
.SYNOPSIS
    Builds and signs the CarmaClouds Firefox extension via Mozilla (web-ext sign).

.DESCRIPTION
    Loads AMO API credentials from a .env file (or -ApiKey/-ApiSecret params),
    bumps the version (Mozilla rejects re-signing the same version), rebuilds the
    extension, and submits it to Mozilla for unlisted signing. The signed .xpi is
    written to ..\..\releases\ and published to website/public/carmaclouds-firefox.xpi.

.EXAMPLE
    .\sign-firefox.ps1
    # Reads creds from .env, bumps the patch version, builds, signs

.EXAMPLE
    .\sign-firefox.ps1 -Bump minor
    # Bump the minor version instead of patch (also: major, none)

.EXAMPLE
    .\sign-firefox.ps1 -ApiKey "user:12345:67" -ApiSecret "abc123..."
    # Pass credentials directly instead of using .env

.EXAMPLE
    .\sign-firefox.ps1 -SkipBuild
    # Sign the existing dist/ without rebuilding first
#>
param(
    [string]$ApiKey,
    [string]$ApiSecret,
    [string]$EnvFile = ".env",
    [ValidateSet("patch", "minor", "major", "none")]
    [string]$Bump = "patch",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

# Run from this script's own directory so relative paths resolve correctly.
Set-Location -Path $PSScriptRoot

# 1. Load credentials from .env unless passed explicitly.
if ((-not $ApiKey -or -not $ApiSecret) -and (Test-Path $EnvFile)) {
    Write-Host "Loading credentials from $EnvFile" -ForegroundColor Cyan
    foreach ($line in Get-Content $EnvFile) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) { continue }
        $idx = $trimmed.IndexOf("=")
        if ($idx -lt 1) { continue }
        $name = $trimmed.Substring(0, $idx).Trim()
        $value = $trimmed.Substring($idx + 1).Trim().Trim('"')
        if ($name -eq "WEB_EXT_API_KEY" -and -not $ApiKey) { $ApiKey = $value }
        if ($name -eq "WEB_EXT_API_SECRET" -and -not $ApiSecret) { $ApiSecret = $value }
    }
}

# 2. Validate.
if (-not $ApiKey -or -not $ApiSecret -or
    $ApiKey -like "user:XXXXX*" -or $ApiSecret -eq "your-secret-here") {
    Write-Error "Missing AMO credentials. Fill in WEB_EXT_API_KEY and WEB_EXT_API_SECRET in '$EnvFile' (copy from .env.example) or pass -ApiKey / -ApiSecret. Get keys at https://addons.mozilla.org/developers/addon/api/key/"
    exit 1
}

# 3. Bump the version across every component so they stay in lockstep. Mozilla
#    rejects re-signing an already-signed version, so each signed build needs a
#    fresh number. manifest_firefox.json is the source of truth; all other
#    components are forced to the new version (the website/public copies are
#    regenerated from these by build.js, so they don't need editing directly).
#    Each target keeps its own match pattern so we only touch the version field
#    and preserve the file's formatting.
if ($Bump -ne "none") {
    $jsonPattern = '("version"\s*:\s*")\d+\.\d+\.\d+(")'
    $targets = @(
        @{ Path = "manifest_firefox.json";           Pattern = $jsonPattern },          # Firefox (MV2)
        @{ Path = "manifest.json";                   Pattern = $jsonPattern },          # Chrome (MV3)
        @{ Path = "package.json";                    Pattern = $jsonPattern },          # npm package
        @{ Path = "owlbear-extension\manifest.json"; Pattern = $jsonPattern },          # OwlCloud Owlbear extension
        @{ Path = "foundry-module\module.json";      Pattern = $jsonPattern },          # FoundCloud Foundry module
        @{ Path = "foundry-module\README.md";        Pattern = '(\*\*Version:\*\*\s*)\d+\.\d+\.\d+()' }  # module readme
    )

    # Read current version from the source of truth.
    $srcPath = Join-Path $PSScriptRoot "manifest_firefox.json"
    $m = [regex]::Match((Get-Content -Raw $srcPath), '"version"\s*:\s*"(\d+)\.(\d+)\.(\d+)"')
    if (-not $m.Success) { Write-Error "Could not read version from manifest_firefox.json."; exit 1 }
    $major = [int]$m.Groups[1].Value
    $minor = [int]$m.Groups[2].Value
    $patch = [int]$m.Groups[3].Value
    switch ($Bump) {
        "major" { $major++; $minor = 0; $patch = 0 }
        "minor" { $minor++; $patch = 0 }
        "patch" { $patch++ }
    }
    $oldVersion = "$($m.Groups[1].Value).$($m.Groups[2].Value).$($m.Groups[3].Value)"
    $newVersion = "$major.$minor.$patch"

    # Write UTF-8 WITHOUT a BOM. Windows PowerShell 5.1's `Set-Content -Encoding utf8`
    # prepends a BOM, which gets copied into dist/manifest.json and makes web-ext /
    # AMO's JSON parser reject the build.
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    foreach ($t in $targets) {
        $path = Join-Path $PSScriptRoot $t.Path
        if (-not (Test-Path $path)) { Write-Warning "Skipping missing file: $($t.Path)"; continue }
        $content = Get-Content -Raw $path
        if (-not [regex]::IsMatch($content, $t.Pattern)) {
            Write-Warning "No version field matched in $($t.Path) - left unchanged."
            continue
        }
        $updated = [regex]::Replace($content, $t.Pattern, "`${1}$newVersion`${2}", 1)
        [System.IO.File]::WriteAllText($path, $updated, $utf8NoBom)
        Write-Host "  updated $($t.Path)" -ForegroundColor DarkGray
    }
    Write-Host "Version bumped: $oldVersion -> $newVersion ($Bump)" -ForegroundColor Cyan
}

# 4. Build (unless skipped).
if (-not $SkipBuild) {
    Write-Host "Building extension..." -ForegroundColor Cyan
    node build.js
    if ($LASTEXITCODE -ne 0) { Write-Error "Build failed."; exit 1 }
}

# 5. Sign. web-ext reads these env vars automatically.
$env:WEB_EXT_API_KEY = $ApiKey
$env:WEB_EXT_API_SECRET = $ApiSecret

Write-Host "Submitting to Mozilla for signing (unlisted channel)..." -ForegroundColor Cyan
npm run sign:firefox
$signExit = $LASTEXITCODE

# 6. Clean up secrets from the session.
Remove-Item Env:WEB_EXT_API_KEY, Env:WEB_EXT_API_SECRET -ErrorAction SilentlyContinue

if ($signExit -ne 0) {
    Write-Error "Signing failed (exit $signExit). See output above."
    exit $signExit
}

# 7. Publish the newest signed .xpi to the website under a stable filename so the
#    download link never changes between versions.
$releasesDir = Join-Path $PSScriptRoot "..\..\releases"
$newest = Get-ChildItem -Path $releasesDir -Filter "*.xpi" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($newest) {
    $dest = Join-Path $PSScriptRoot "website\public\carmaclouds-firefox.xpi"
    # build.js syncs to the repo-root website/, so resolve that path too.
    $repoWebsite = Join-Path $PSScriptRoot "..\..\website\public\carmaclouds-firefox.xpi"
    $target = if (Test-Path (Split-Path $repoWebsite)) { $repoWebsite } else { $dest }
    Copy-Item $newest.FullName $target -Force
    Write-Host "Published signed xpi to $target" -ForegroundColor Green
}

Write-Host "Done. Signed .xpi is in the releases/ folder." -ForegroundColor Green
