# fix_envs_final.ps1 - SAFE VERSION (Reads from .env.local)

if (-not (Test-Path ".env.local")) {
    Write-Host "Error: .env.local not found. Please create it first." -ForegroundColor Red
    exit
}

# Parse .env.local into a hashtable
$envVars = @{}
Get-Content .env.local | ForEach-Object {
    if ($_ -match "^([^#=]+)=(.*)$") {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Define the keys we want to sync
$keysToSync = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_APP_URL",
    "MPESA_ENVIRONMENT",
    "MPESA_SHORTCODE",
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_PASSKEY",
    "ETIMS_PROVIDER_MODE",
    "ETIMS_SANDBOX_BASE_URL",
    "ETIMS_CMC_KEY",
    "ETIMS_API_KEY_HEADER",
    "ETIMS_DEVICE_SERIAL_FIELD",
    "ETIMS_DEVICE_SERIAL_NO",
    "AT_API_KEY",
    "CRON_SECRET",
    "MPESA_CALLBACK_STRICT",
    "ETIMS_LIVE_BASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
)

Write-Host "Syncing Vercel environment variables from .env.local..." -ForegroundColor Cyan

foreach ($key in $keysToSync) {
    $val = $envVars[$key]
    
    if (-not $val) {
        Write-Host "  ! Skipping $key (not found in .env.local)" -ForegroundColor Yellow
        continue
    }

    # Write clean value to temp file
    [System.IO.File]::WriteAllBytes(".val.tmp", [System.Text.Encoding]::UTF8.GetBytes($val))

    foreach ($targetEnv in "production", "preview", "development") {
        Write-Host "  Processing $key for $targetEnv..."
        
        $flags = "--yes --force"
        if (-not $key.StartsWith("NEXT_PUBLIC_") -and $targetEnv -ne "development") {
            $flags += " --sensitive"
        }

        # Raw redirection via CMD
        cmd /c "npx -y vercel env add $key $targetEnv $flags < .val.tmp 2>nul"
    }
}

if (Test-Path ".val.tmp") { Remove-Item ".val.tmp" }
Write-Host "Safe sync complete!" -ForegroundColor Green
