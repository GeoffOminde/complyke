# M-Pesa Configuration (Daraja API)
# Get your credentials from: https://developer.safaricom.co.ke/

# For Sandbox Testing
# CRITICAL SECURITY: Do NOT prefix these with NEXT_PUBLIC_ to prevent client-side exposure
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key_here
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret_here
MPESA_PASSKEY=your_sandbox_passkey_here
MPESA_SHORTCODE=174379

# For Production (uncomment and update when ready)
# MPESA_ENVIRONMENT=production
# MPESA_CONSUMER_KEY=your_production_consumer_key
# MPESA_CONSUMER_SECRET=your_production_consumer_secret
# MPESA_PASSKEY=your_production_passkey
# MPESA_SHORTCODE=your_paybill_number

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# KRA eTIMS / VSCU Configuration (server-side only)
# NOTE: Values are provided by KRA onboarding/specs. Do NOT prefix with NEXT_PUBLIC_.
# ETIMS_PROVIDER_MODE=sandbox   # or 'live'
# ETIMS_SANDBOX_BASE_URL=https://etims-api-sbx.kra.go.ke
# ETIMS_LIVE_BASE_URL=https://etims-api.kra.go.ke
# ETIMS_VSCU_SALES_PATH=/vscu/sales
#
# ETIMS_API_KEY=your_kra_etims_api_key_or_token   # used for VSCU submission (header name defaults to x-api-key)
# ETIMS_API_KEY_HEADER=cmcKey                     # set if KRA spec requires a specific header name
# ETIMS_DEVICE_SERIAL_NO=your_kra_device_serial_no
# ETIMS_DEVICE_SERIAL_FIELD=deviceSerialNo        # set if KRA spec uses a different field name
# ETIMS_ITEM_CODE_MAP='{"ITEM01":"HS-0302", "ITEM02":"HS-8471"}'
# ETIMS_ONBOARDING_DEFAULT_TIN=P052492656K
# ETIMS_ONBOARDING_DEFAULT_BHF=00
# ETIMS_ONBOARDING_DEFAULT_SERIAL=D2EF9D23
#
# eTIMS ATMS onboarding check (device selection)
# ETIMS_CMC_KEY=your_kra_cmc_key                  # if the onboarding endpoint requires cmcKey
# ETIMS_ATMS_SELECT_DEVICE_PATH=/atms/v1/init/selectDevice

# Supabase Configuration (for database - optional for now)
# Get your credentials from: https://supabase.com/
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Analytics (optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
