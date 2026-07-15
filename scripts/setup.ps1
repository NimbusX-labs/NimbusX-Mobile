# NimbusX Project Setup Script
# Requires: Node.js 22+, npm, Android Studio or Xcode

param(
    [switch]$iOS,
    [switch]$Android,
    [switch]$All
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         NimbusX Project Setup           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Install npm dependencies
Write-Host "`n[1/4] Installing npm dependencies..." -ForegroundColor Yellow
npm install
if (-not $?) { throw "npm install failed" }

# 2. Install CocoaPods (iOS only)
if ($iOS -or $All) {
    Write-Host "`n[2/4] Installing CocoaPods..." -ForegroundColor Yellow
    if (Test-Path "$ROOT/ios/Podfile") {
        Push-Location "$ROOT/ios"
        pod install
        if (-not $?) { throw "pod install failed" }
        Pop-Location
    } else {
        Write-Host "  ⚠ No Podfile found, skipping..." -ForegroundColor DarkYellow
    }
} else {
    Write-Host "`n[2/4] Skipping CocoaPods (use -iOS or -All to include)" -ForegroundColor DarkGray
}

# 3. Verify environment
Write-Host "`n[3/4] Verifying environment..." -ForegroundColor Yellow
$nodeVer = node -v
$npmVer = npm -v
Write-Host "  Node: $nodeVer"
Write-Host "  npm:  $npmVer"

# 4. Check .env file
Write-Host "`n[4/4] Checking configuration..." -ForegroundColor Yellow
if (-not (Test-Path "$ROOT/.env")) {
    if (Test-Path "$ROOT/.env.example") {
        Copy-Item "$ROOT/.env.example" "$ROOT/.env"
        Write-Host "  ✅ Created .env from .env.example" -ForegroundColor Green
        Write-Host "  ⚠ Edit .env with your Supabase credentials!" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠ No .env or .env.example found" -ForegroundColor DarkYellow
    }
} else {
    Write-Host "  ✅ .env found" -ForegroundColor Green
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "Run 'npm start' to launch Metro, then 'npm run android' or 'npm run ios'"
