# ComplyKe Deployment Guide

## 🚀 Pre-Deployment Checklist

### ✅ Security Enhancements Completed

1. **API Route Protection**
   - ✅ Wakili AI (`/api/chat`) - Session validation implemented
   - ✅ Contract Review (`/api/review-contract`) - Authentication required
   - ✅ Receipt Scanner (`/api/scan-receipt`) - User verification active
   - ✅ M-Pesa Payment (`/api/mpesa/payment`) - Authenticated users only

2. **Database Security**
   - ✅ Row Level Security (RLS) enabled on all tables
   - ✅ Profile auto-creation for seamless onboarding
   - ✅ User-scoped data access policies

3. **Credential Management**
   - ✅ M-Pesa secrets moved to server-side only
   - ✅ OpenAI API key secured
   - ✅ Supabase credentials properly configured

4. **Build Verification**
   - ✅ Production build successful
   - ✅ TypeScript compilation clean
   - ✅ No critical errors

---

## 📋 Environment Variables Setup

### Required Variables for Production

Create these environment variables in your deployment platform (Vercel/Railway/Netlify):

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# M-Pesa Configuration (Server-Side Only - NO NEXT_PUBLIC_ prefix)
MPESA_ENVIRONMENT=sandbox  # or 'production' for live
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=174379  # Your paybill number

# Application URL (for M-Pesa callbacks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### ⚠️ Critical Security Notes

1. **M-Pesa Credentials**: NEVER use `NEXT_PUBLIC_` prefix for M-Pesa secrets
2. **API Keys**: Keep all API keys in server-side environment variables
3. **Supabase Anon Key**: This is safe to expose (it's protected by RLS)

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from the list above
   - Ensure M-Pesa variables do NOT have `NEXT_PUBLIC_` prefix

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Railway

1. **Create New Project**
   - Connect your GitHub repository
   - Railway will auto-detect Next.js

2. **Add Environment Variables**
   - Go to Variables tab
   - Add all required variables
   - Click "Deploy"

3. **Configure Custom Domain** (Optional)
   - Go to Settings → Domains
   - Add your custom domain

### Option 3: Netlify

1. **Deploy via Git**
   - Connect repository
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment Variables**
   - Site settings → Build & deploy → Environment
   - Add all variables

---

## 🗄️ Supabase Setup

### 1. Run Database Schema

Execute the SQL in `supabase_schema.sql` in your Supabase SQL Editor:

```sql
-- This creates all tables with RLS policies
-- Located in: supabase_schema.sql
```

### 2. Verify RLS Policies

Ensure these policies are active:
- ✅ Users can view/update/insert own profile
- ✅ Users can view/insert own contracts
- ✅ Users can view/insert own payroll calculations
- ✅ Users can view/insert own privacy policies
- ✅ Users can view own payments

### 3. Enable Email Authentication

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

### 4. Enable Google OAuth (Optional)

1. Go to Authentication → Providers → Google
2. Add your Google OAuth credentials
3. Add authorized redirect URLs

---

## 💳 M-Pesa Configuration

### Sandbox Testing

1. **Get Sandbox Credentials**
   - Visit: https://developer.safaricom.co.ke/
   - Create an app
   - Get Consumer Key, Consumer Secret, and Passkey

2. **Test Numbers**
   - Use Safaricom test numbers: 254708374149, 254708374150, etc.
   - PIN: Any 4 digits

### Production Setup

1. **Apply for Production Access**
   - Contact Safaricom Daraja team
   - Provide business details
   - Get production credentials

2. **Update Environment Variables**
   ```bash
   MPESA_ENVIRONMENT=production
   MPESA_CONSUMER_KEY=your_production_key
   MPESA_CONSUMER_SECRET=your_production_secret
   MPESA_PASSKEY=your_production_passkey
   MPESA_SHORTCODE=your_paybill_number
   ```

3. **Configure Callback URL**
   - Register: `https://your-domain.com/api/mpesa/callback`
   - Ensure it's publicly accessible

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Use different credentials for dev/staging/production
- ✅ Rotate API keys regularly

### 2. Supabase Security
- ✅ RLS is enabled on all tables
- ✅ Anon key is safe to expose (protected by RLS)
- ✅ Service role key should NEVER be exposed

### 3. API Protection
- ✅ All AI endpoints require authentication
- ✅ Payment endpoints verify user sessions
- ✅ Rate limiting recommended for production

### 4. M-Pesa Security
- ✅ Credentials are server-side only
- ✅ Callback URL uses HTTPS
- ✅ Transaction verification implemented

---

## 🧪 Pre-Launch Testing

### 1. Authentication Flow
- [ ] Sign up with email
- [ ] Sign in with email
- [ ] Sign in with Google (if enabled)
- [ ] Sign out

### 2. Core Features
- [ ] Generate employment contract
- [ ] Calculate payroll taxes
- [ ] Generate privacy policy
- [ ] Scan receipt (OCR)
- [ ] Review contract with AI

### 3. Data Persistence
- [ ] Verify contracts save to Supabase
- [ ] Verify payroll calculations save
- [ ] Verify privacy policies save
- [ ] Check Risk Dashboard updates

### 4. Payment Flow
- [ ] Initiate M-Pesa payment
- [ ] Receive STK push
- [ ] Complete payment
- [ ] Verify callback received

### 5. Profile Management
- [ ] Update business name
- [ ] Update KRA PIN
- [ ] Update industry
- [ ] Changes persist after refresh

---

## 📊 Monitoring & Analytics

### Recommended Tools

1. **Vercel Analytics** (if using Vercel)
   - Automatic performance monitoring
   - Web vitals tracking

2. **Supabase Dashboard**
   - Monitor database usage
   - Check API requests
   - Review auth logs

3. **Sentry** (Optional)
   - Error tracking
   - Performance monitoring
   ```bash
   npm install @sentry/nextjs
   ```

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Database Connection Issues

1. Check Supabase URL and anon key
2. Verify RLS policies are enabled
3. Check network connectivity

### M-Pesa Callback Not Received

1. Verify callback URL is registered with Safaricom
2. Ensure URL is HTTPS
3. Check server logs for errors
4. Test with ngrok for local development

### Profile Errors

- The app now auto-creates profiles for new users
- If issues persist, check Supabase logs
- Verify RLS policies allow INSERT

---

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **M-Pesa Daraja**: https://developer.safaricom.co.ke/
- **Vercel Support**: https://vercel.com/support

---

## 🎉 Post-Deployment

### 1. Update DNS (if using custom domain)
- Point your domain to deployment platform
- Configure SSL certificate

### 2. Test Production Environment
- Run through all test cases
- Verify environment variables loaded
- Check API endpoints

### 3. Monitor Initial Traffic
- Watch for errors in logs
- Monitor database usage
- Check payment callbacks

### 4. Enable Analytics
- Set up Google Analytics (optional)
- Configure Vercel Analytics
- Monitor user behavior

---

## 📝 Maintenance

### Regular Tasks

- **Weekly**: Review error logs
- **Monthly**: Rotate API keys
- **Quarterly**: Update dependencies
- **As needed**: Scale database resources

### Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

**Last Updated**: February 10, 2026
**Build Status**: ✅ Production Ready
**Security Audit**: ✅ Passed
