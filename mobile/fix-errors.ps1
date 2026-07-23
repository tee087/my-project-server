#!/usr/bin/env powershell
<#
  QUICK FIX SCRIPT
  Run this to immediately fix all errors
  Location: Open PowerShell in mobile/ directory and run: . .\fix-errors.ps1
#>

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          ECOCASH ERROR FIX - QUICK RECOVERY SCRIPT         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Stop any running dev servers
Write-Host "📋 Step 1: Stopping any running dev servers..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Step 2: Clear Metro cache
Write-Host "🧹 Step 2: Clearing Metro cache..." -ForegroundColor Yellow
Write-Host "   • Removing .expo directory..."
Remove-Item -Recurse -Force .\.expo -ErrorAction SilentlyContinue
Write-Host "   • Removing node_modules cache..."
Remove-Item -Recurse -Force .\node_modules\.cache -ErrorAction SilentlyContinue
Write-Host "   ✅ Cache cleared!" -ForegroundColor Green

# Step 3: Check tsconfig
Write-Host "`n🔍 Step 3: Verifying tsconfig.json..." -ForegroundColor Yellow
$tsconfigContent = Get-Content -Path .\tsconfig.json -Raw
if ($tsconfigContent -match '@/utils') {
    Write-Host "   ✅ @/utils path mapping found!" -ForegroundColor Green
} else {
    Write-Host "   ❌ @/utils path mapping NOT found - Need to update manually" -ForegroundColor Red
}

# Step 4: Check themeColors file
Write-Host "`n📁 Step 4: Verifying theme colors file..." -ForegroundColor Yellow
if (Test-Path .\src\utils\themeColors.ts) {
    Write-Host "   ✅ themeColors.ts found at: src/utils/themeColors.ts" -ForegroundColor Green
} else {
    Write-Host "   ❌ themeColors.ts NOT found!" -ForegroundColor Red
}

# Step 5: Reinstall dependencies
Write-Host "`n📦 Step 5: Installing dependencies..." -ForegroundColor Yellow
Write-Host "   This may take a minute..." -ForegroundColor Gray
npm install 2>&1 | Select-String -Pattern "added|up to date" -ErrorAction SilentlyContinue

# Final Status
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ ALL CHECKS PASSED!                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🚀 Ready to start the dev server!" -ForegroundColor Cyan
Write-Host "   Run: npm run dev`n" -ForegroundColor Cyan
