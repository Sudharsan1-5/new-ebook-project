# Diagnostic Script for eBook Generator Project
# Run this to check your setup status

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "eBook Generator - Diagnostic Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "d:\project-bolt-sb1-cpyievkt\project"
$issues = @()
$warnings = @()

# Check 1: Environment file
Write-Host "1. Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path "$projectPath\.env") {
    Write-Host "   ✓ .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content "$projectPath\.env" -Raw
    if ($envContent -match "VITE_SUPABASE_URL=https://") {
        Write-Host "   ✓ VITE_SUPABASE_URL is configured" -ForegroundColor Green
    } else {
        $issues += ".env file missing VITE_SUPABASE_URL"
        Write-Host "   ✗ VITE_SUPABASE_URL not properly configured" -ForegroundColor Red
    }
    
    if ($envContent -match "VITE_SUPABASE_ANON_KEY=") {
        Write-Host "   ✓ VITE_SUPABASE_ANON_KEY is configured" -ForegroundColor Green
    } else {
        $issues += ".env file missing VITE_SUPABASE_ANON_KEY"
        Write-Host "   ✗ VITE_SUPABASE_ANON_KEY not properly configured" -ForegroundColor Red
    }
} else {
    $issues += ".env file does not exist"
    Write-Host "   ✗ .env file not found" -ForegroundColor Red
    Write-Host "   → Copy .env.example to .env and add your credentials" -ForegroundColor Yellow
}

Write-Host ""

# Check 2: Node modules
Write-Host "2. Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "$projectPath\node_modules") {
    Write-Host "   ✓ node_modules folder exists" -ForegroundColor Green
} else {
    $issues += "Dependencies not installed"
    Write-Host "   ✗ node_modules not found" -ForegroundColor Red
    Write-Host "   → Run: npm install" -ForegroundColor Yellow
}

Write-Host ""

# Check 3: Migration files
Write-Host "3. Checking database migrations..." -ForegroundColor Yellow
$migration1 = "$projectPath\supabase\migrations\20251004141355_create_users_and_admin_system.sql"
$migration2 = "$projectPath\supabase\migrations\20251005044850_fix_rls_policies_and_admin.sql"

if (Test-Path $migration1) {
    Write-Host "   ✓ Migration 1 found" -ForegroundColor Green
} else {
    $issues += "Migration file 1 missing"
    Write-Host "   ✗ Migration 1 not found" -ForegroundColor Red
}

if (Test-Path $migration2) {
    Write-Host "   ✓ Migration 2 found" -ForegroundColor Green
} else {
    $issues += "Migration file 2 missing"
    Write-Host "   ✗ Migration 2 not found" -ForegroundColor Red
}

Write-Host "   ⚠ Note: Migrations must be applied to Supabase manually" -ForegroundColor Yellow

Write-Host ""

# Check 4: Dev server
Write-Host "4. Checking for running dev server..." -ForegroundColor Yellow
$devServer = netstat -ano | Select-String ":5173.*LISTENING"
if ($devServer) {
    Write-Host "   ✓ Dev server is running on port 5173" -ForegroundColor Green
} else {
    $warnings += "Dev server not running"
    Write-Host "   ⚠ Dev server not running" -ForegroundColor Yellow
    Write-Host "   → Run: npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# Check 5: Key files
Write-Host "5. Checking critical files..." -ForegroundColor Yellow
$criticalFiles = @(
    "src\lib\supabase.ts",
    "src\lib\export-pdf.ts",
    "src\components\ExportModal.tsx",
    "src\pages\Dashboard.tsx"
)

foreach ($file in $criticalFiles) {
    if (Test-Path "$projectPath\$file") {
        Write-Host "   ✓ $file exists" -ForegroundColor Green
    } else {
        $issues += "Missing file: $file"
        Write-Host "   ✗ $file not found" -ForegroundColor Red
    }
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure database migrations are applied in Supabase" -ForegroundColor White
    Write-Host "2. Add API keys to the api_keys table in Supabase" -ForegroundColor White
    Write-Host "3. Run: npm run dev" -ForegroundColor White
    Write-Host "4. Test creating an eBook" -ForegroundColor White
} else {
    if ($issues.Count -gt 0) {
        Write-Host "✗ Issues found ($($issues.Count)):" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  - $issue" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠ Warnings ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "Action Required:" -ForegroundColor Cyan
    Write-Host "1. Fix the issues listed above" -ForegroundColor White
    Write-Host "2. Read CHECK_STATUS.md for detailed instructions" -ForegroundColor White
    Write-Host "3. Read SETUP_DATABASE.md for database setup" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IMPORTANT: Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The blank PDF issue is caused by missing database tables." -ForegroundColor Yellow
Write-Host ""
Write-Host "You MUST apply migrations to your Supabase database:" -ForegroundColor White
Write-Host "  Option 1: Use Supabase CLI" -ForegroundColor Cyan
Write-Host "    supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Gray
Write-Host "    supabase db push" -ForegroundColor Gray
Write-Host ""
Write-Host "  Option 2: Manual SQL in Supabase Dashboard" -ForegroundColor Cyan
Write-Host "    - Go to SQL Editor" -ForegroundColor Gray
Write-Host "    - Run migration files from supabase\migrations\" -ForegroundColor Gray
Write-Host ""
Write-Host "After migrations, add API keys to the api_keys table." -ForegroundColor White
Write-Host ""
Write-Host "See SETUP_DATABASE.md for detailed instructions." -ForegroundColor Cyan
Write-Host ""

# Pause
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
