import { createClient } from '@/lib/supabase-server'

export default async function ItaxStatusPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return (
      <div className="space-y-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>Please sign in to review your most recent iTax ledger submission.</p>
      </div>
    )
  }

  const { data: entries, error } = await supabase
    .from('itax_ledger_entries')
    .select(
      `
        id,
        trns_ms_no,
        invc_no,
        recept_no,
        etims_signature,
        status,
        created_at,
        item_list
      `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    return (
      <div className="space-y-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p>Unable to load ledger history: {error.message}</p>
      </div>
    )
  }

  const latest = entries?.[0]

  return (
    <div className="space-y-6">
      <div className="rounded border border-navy-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-navy-900">Latest eTIMS Receipt</h1>
        {latest ? (
          <div className="mt-4 space-y-2 text-sm text-navy-700">
            <p>
              <span className="font-semibold">Status:</span> {latest.status}
            </p>
            <p>
              <span className="font-semibold">Transaction:</span> {latest.trns_ms_no}
            </p>
            <p>
              <span className="font-semibold">Invoice:</span> {latest.invc_no}
            </p>
            <p>
              <span className="font-semibold">Receipt:</span> {latest.recept_no}
            </p>
            <p>
              <span className="font-semibold">Submitted at:</span>{' '}
              {new Date(latest.created_at).toLocaleString()}
            </p>
            <div>
              <p className="font-semibold">eTIMS Signature:</p>
              <pre className="whitespace-pre-wrap rounded bg-navy-950/5 p-3 text-xs leading-relaxed text-navy-800">
                {latest.etims_signature || 'N/A'}
              </pre>
            </div>
            {latest.item_list && (
              <div>
                <p className="font-semibold">Item List</p>
                <pre className="whitespace-pre-wrap rounded bg-navy-950/5 p-3 text-xs leading-relaxed text-navy-800">
                  {JSON.stringify(latest.item_list, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-navy-500">
            No historical ledger entries found. Submit a receipt via the Tax Lens panel to populate this overview.
          </p>
        )}
      </div>

      <div className="rounded border border-navy-200 bg-white p-5 text-sm text-navy-600">
        <p>
          After you see a <strong>status: submitted</strong> or <strong>queued</strong> result and the
          eTIMS signature/receipt values populate above, your sandbox submission is fully validated.
        </p>
      </div>
    </div>
  )
}
