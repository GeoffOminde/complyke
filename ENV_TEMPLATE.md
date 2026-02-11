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

# Supabase Configuration (for database - optional for now)
# Get your credentials from: https://supabase.com/
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Analytics (optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
