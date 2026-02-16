export interface SelectDeviceRequest {
  tin: string
  bhfId: string
  dvcSrlNo: string
}

export interface SelectDeviceResult {
  ok: boolean
  status: number
  bodyText: string
  bodyJson?: unknown
}

function normalizeBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function withLeadingSlash(value: string) {
  return value.startsWith('/') ? value : `/${value}`
}

function resolveAtmsConfig(): {
  baseUrl: string
  selectDevicePath: string
  cmcKey: string
  timeoutMs: number
} {
  const baseUrl = (process.env.ETIMS_SANDBOX_BASE_URL || process.env.ETIMS_LIVE_BASE_URL || '').trim()
  if (!baseUrl) {
    throw new Error('Missing ETIMS_SANDBOX_BASE_URL (recommended) for eTIMS onboarding check')
  }

  const cmcKey = (process.env.ETIMS_CMC_KEY || process.env.ETIMS_API_KEY || '').trim()
  if (!cmcKey) {
    throw new Error('Missing ETIMS_CMC_KEY (or ETIMS_API_KEY) for eTIMS onboarding check')
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    selectDevicePath: withLeadingSlash(process.env.ETIMS_ATMS_SELECT_DEVICE_PATH || '/atms/v1/init/selectDevice'),
    cmcKey,
    timeoutMs: Number(process.env.ETIMS_REQUEST_TIMEOUT_MS || 15000),
  }
}

export async function selectDevice(input: SelectDeviceRequest): Promise<SelectDeviceResult> {
  const config = resolveAtmsConfig()

  const response = await fetch(`${config.baseUrl}${config.selectDevicePath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // KRA sandbox documentation refers to this header name.
      cmcKey: config.cmcKey,
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(config.timeoutMs),
  })

  const status = response.status
  const contentType = response.headers.get('content-type') || ''

  let bodyText = ''
  try {
    bodyText = await response.text()
  } catch {
    bodyText = ''
  }

  let bodyJson: unknown = undefined
  if (contentType.includes('application/json') && bodyText) {
    try {
      bodyJson = JSON.parse(bodyText)
    } catch {
      bodyJson = undefined
    }
  }

  return {
    ok: response.ok,
    status,
    bodyText,
    bodyJson,
  }
}
