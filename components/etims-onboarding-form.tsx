"use client"

import { useCallback, useState } from 'react'

interface Props {
  defaultTin: string
  defaultBhfId: string
  defaultDvcSrlNo: string
  isSuperAdmin: boolean
}

type ResponseState = {
  ok: boolean
  status: number
  bodyJson: unknown | null
  bodyText: string
} | null

const RESULT_TOOLTIPS: Record<string, string> = {
  '000': 'Device is active and ready to receive eTIMS submissions.',
  '3001': 'Serial or TIN already bound elsewhere. Release it with KRA support before retrying.',
  '4000': 'Invalid payload; re-check the request body.',
}

const getResultTooltip = (code?: string) => {
  if (!code) return 'Status code not provided by KRA.'
  return RESULT_TOOLTIPS[code] || 'KRA returned an unknown status code.'
}

export default function EtimsOnboardingForm({
  defaultTin,
  defaultBhfId,
  defaultDvcSrlNo,
  isSuperAdmin,
}: Props) {
  const [tin, setTin] = useState(defaultTin)
  const [bhfId, setBhfId] = useState(defaultBhfId)
  const [dvcSrlNo, setDvcSrlNo] = useState(defaultDvcSrlNo)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResponseState>(null)
  const [error, setError] = useState<string | null>(null)

  const runSelectDevice = useCallback(async () => {
    if (!isSuperAdmin) {
      setError('You are not authorized to run the onboarding check.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const resp = await fetch('/api/etims/onboarding/select-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tin, bhfId, dvcSrlNo }),
        credentials: 'include',
      })

      const body = await resp.json()
      setResult({
        ok: body.ok === true,
        status: resp.status,
        bodyJson: body.bodyJson ?? body,
        bodyText: typeof body.bodyText === 'string' ? body.bodyText : JSON.stringify(body, null, 2),
      })

      if (!resp.ok) {
        setError(body.error || 'Onboarding request failed.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected network error')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [tin, bhfId, dvcSrlNo, isSuperAdmin])

  if (!isSuperAdmin) {
    return (
      <div>
        <p className="text-sm text-navy-500">
          Only super-admin users can trigger the eTIMS onboarding check.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-sm font-medium text-navy-600">
          TIN
          <input
            value={tin}
            onChange={(event) => setTin(event.target.value.toUpperCase())}
            className="mt-1 w-full rounded border border-navy-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-navy-600">
          Branch ID
          <input
            value={bhfId}
            onChange={(event) => setBhfId(event.target.value)}
            className="mt-1 w-full rounded border border-navy-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-navy-600">
          Device Serial
          <input
            value={dvcSrlNo}
            onChange={(event) => setDvcSrlNo(event.target.value.trim())}
            className="mt-1 w-full rounded border border-navy-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <button
        disabled={loading}
        onClick={runSelectDevice}
        className="rounded bg-navy-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? 'Running onboarding check...' : 'Run eTIMS selectDevice'}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result &&
        (() => {
          const payload =
            result.bodyJson && typeof result.bodyJson === 'object'
              ? (result.bodyJson as Record<string, unknown>)
              : null
          const resultCd = (payload?.resultCd as string | undefined) ?? undefined
          return (
            <div className="rounded border border-navy-200 bg-white p-4 text-sm text-navy-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <span className="rounded-full border px-3 py-0.5 text-xs font-semibold">
                  {result.ok ? 'ok' : 'failed'} · {result.status}
                </span>
                {payload && (
                  <span
                    title={getResultTooltip(resultCd)}
                    className="rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                  >
                    {resultCd ? `code ${resultCd}` : 'no code'}
                  </span>
                )}
                {resultCd === '000' && (
                  <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Device Active
                  </span>
                )}
              </div>
              <p className="mt-2 font-semibold">Payload Response</p>
              <pre className="mt-1 max-h-48 overflow-auto rounded bg-navy-950/5 p-3 text-xs leading-snug">
                {result.bodyText}
              </pre>
            </div>
          )
        })()}
    </div>
  )
}
