import { createClient } from '@/lib/supabase-server'
import EtimsOnboardingForm from '@/components/etims-onboarding-form'

export default async function EtimsStatusPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-600">You must be signed in to view eTIMS status.</p>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,business_name')
    .eq('id', user.id)
    .maybeSingle()

  const isSuperAdmin = (profile?.role || '').toLowerCase() === 'super-admin'
  const defaultTin = process.env.ETIMS_ONBOARDING_DEFAULT_TIN || ''
  const defaultBhfId = process.env.ETIMS_ONBOARDING_DEFAULT_BHF || '00'
  const defaultDvcSrlNo = process.env.ETIMS_ONBOARDING_DEFAULT_SERIAL || ''
  return (
    <div className="space-y-6">
      <div className="rounded border border-navy-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-navy-900">eTIMS Onboarding Status</h1>
        <p className="mt-2 text-sm text-navy-500">
          {isSuperAdmin
            ? 'Run the selectDevice call to confirm your sandbox device is bound to KRA.'
            : 'Only super-admins can re-run the selectDevice call.'}
        </p>
      </div>

      <div className="rounded border border-navy-200 bg-white p-6">
        <EtimsOnboardingForm
          defaultTin={defaultTin}
          defaultBhfId={defaultBhfId}
          defaultDvcSrlNo={defaultDvcSrlNo}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  )
}
