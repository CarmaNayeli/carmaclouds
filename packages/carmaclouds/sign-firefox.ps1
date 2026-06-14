<#
.SYNOPSIS
    Builds and signs the CarmaClouds Firefox extension via Mozilla (web-ext sign).

.DESCRIPTION
    Loads AMO API credentials from a .env file (or -ApiKey/-ApiSecret params),
    rebuilds the extension, and submits it to Mozilla for unlisted signing.
    The signed .xpi is written to ..\..\releases\.

.EXAMPLE
    .\sign-firefox.ps1
    # Reads WEB_EXT_API_KEY / WEB_EXT_API_SECRET from .env

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

# 3. Build (unless skipped).
if (-not $SkipBuild) {
    Write-Host "Building extension..." -ForegroundColor Cyan
    node build.js
    if ($LASTEXITCODE -ne 0) { Write-Error "Build failed."; exit 1 }
}

# 4. Sign. web-ext reads these env vars automatically.
$env:WEB_EXT_API_KEY = $ApiKey
$env:WEB_EXT_API_SECRET = $ApiSecret

Write-Host "Submitting to Mozilla for signing (unlisted channel)..." -ForegroundColor Cyan
npm run sign:firefox
$signExit = $LASTEXITCODE

# 5. Clean up secrets from the session.
Remove-Item Env:WEB_EXT_API_KEY, Env:WEB_EXT_API_SECRET -ErrorAction SilentlyContinue

if ($signExit -ne 0) {
    Write-Error "Signing failed (exit $signExit). See output above."
    exit $signExit
}

Write-Host "Done. Signed .xpi is in the releases/ folder." -ForegroundColor Green
