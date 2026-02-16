import { randomUUID } from 'node:crypto'
import type { EtimsProvider, EtimsProviderMode, EtimsSubmissionRequest, EtimsSubmissionResult } from './types'

type RuntimeMode = Exclude<EtimsProviderMode, 'mock'>

interface HttpProviderConfig {
  mode: RuntimeMode
  baseUrl: string
  salesPath: string
  tokenPath?: string
  clientId?: string
  clientSecret?: string
  apiKey?: string
  apiKeyHeaderName: string
  deviceSerialNo?: string
  deviceSerialField: string
  timeoutMs: number
}

function normalizeBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function withLeadingSlash(value: string) {
  return value.startsWith('/') ? value : `/${value}`
}

function resolveConfig(mode: RuntimeMode): HttpProviderConfig {
  const baseUrlFromEnv =
    mode === 'sandbox'
      ? process.env.ETIMS_SANDBOX_BASE_URL
      : process.env.ETIMS_LIVE_BASE_URL

  if (!baseUrlFromEnv) {
    throw new Error(`Missing ${mode === 'sandbox' ? 'ETIMS_SANDBOX_BASE_URL' : 'ETIMS_LIVE_BASE_URL'} for VSCU integration`)
  }

  return {
    mode,
    baseUrl: normalizeBaseUrl(baseUrlFromEnv),
    salesPath: withLeadingSlash(process.env.ETIMS_VSCU_SALES_PATH || '/vscu/sales'),
    tokenPath: process.env.ETIMS_AUTH_TOKEN_PATH ? withLeadingSlash(process.env.ETIMS_AUTH_TOKEN_PATH) : undefined,
    clientId: process.env.ETIMS_CLIENT_ID || undefined,
    clientSecret: process.env.ETIMS_CLIENT_SECRET || undefined,
    apiKey: process.env.ETIMS_API_KEY || undefined,
    apiKeyHeaderName: (process.env.ETIMS_API_KEY_HEADER || 'x-api-key').trim() || 'x-api-key',
    deviceSerialNo: (process.env.ETIMS_DEVICE_SERIAL_NO || process.env.ETIMS_SERIAL_NO || '').trim() || undefined,
    deviceSerialField: (process.env.ETIMS_DEVICE_SERIAL_FIELD || 'deviceSerialNo').trim() || 'deviceSerialNo',
    timeoutMs: Number(process.env.ETIMS_REQUEST_TIMEOUT_MS || 15000),
  }
}

function createSubmissionRef(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`
}

function mapStatus(code: number): EtimsSubmissionResult['status'] {
  if (code === 200 || code === 201) return 'accepted'
  if (code === 202) return 'queued'
  if (code === 400 || code === 409 || code === 422) return 'rejected'
  return 'error'
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) return null
  return value as Record<string, unknown>
}

function extractSubmissionRef(payload: unknown, fallbackPrefix: string) {
  const obj = asObject(payload)
  const fromTopLevel =
    (obj?.submissionRef as string | undefined) ||
    (obj?.reference as string | undefined) ||
    (obj?.id as string | undefined)

  if (fromTopLevel) return fromTopLevel

  const data = asObject(obj?.data)
  const fromData =
    (data?.submissionRef as string | undefined) ||
    (data?.reference as string | undefined) ||
    (data?.id as string | undefined)

  return fromData || createSubmissionRef(fallbackPrefix)
}

export class HttpEtimsProvider implements EtimsProvider {
  private readonly config: HttpProviderConfig

  constructor(mode: RuntimeMode) {
    this.config = resolveConfig(mode)
  }

  private async getAuthToken() {
    if (!this.config.tokenPath || !this.config.clientId || !this.config.clientSecret) {
      return null
    }

    const tokenResponse = await fetch(`${this.config.baseUrl}${this.config.tokenPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    })

    if (!tokenResponse.ok) {
      throw new Error(`VSCU token request failed (${tokenResponse.status})`)
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string }
    if (!tokenJson.access_token) {
      throw new Error('VSCU token response missing access_token')
    }

    return tokenJson.access_token
  }

  async submitSale(payload: EtimsSubmissionRequest): Promise<EtimsSubmissionResult> {
    const authToken = await this.getAuthToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
    } else if (this.config.apiKey) {
      headers[this.config.apiKeyHeaderName] = this.config.apiKey
    }

    const requestBody: Record<string, unknown> = {
      deviceType: 'VSCU',
      merchantName: payload.merchantName ?? null,
      kraPin: payload.kraPin,
      totalAmount: payload.totalAmount,
      saleDate: payload.date ?? null,
      category: payload.category ?? null,
      auditHash: payload.auditHash ?? null,
      etimsSignature: payload.etimsSignature ?? null,
      trnsMsNo: payload.trnsMsNo ?? null,
      invcNo: payload.invcNo ?? null,
      receptNo: payload.receptNo ?? null,
      itemList: payload.itemList ?? null,
    }

    // Some eTIMS/VSCU adapters require a provisioned device serial identifier.
    // Keep it optional so environments that don't need it remain compatible.
    if (this.config.deviceSerialNo) {
      requestBody[this.config.deviceSerialField] = this.config.deviceSerialNo
    }

    const response = await fetch(`${this.config.baseUrl}${this.config.salesPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    })

    let parsedBody: unknown = null
    try {
      parsedBody = await response.json()
    } catch {
      parsedBody = { message: await response.text() }
    }

    const status = mapStatus(response.status)
    const submissionRef = extractSubmissionRef(parsedBody, `VSCU-${this.config.mode.toUpperCase()}`)
    const messageFromBody =
      (asObject(parsedBody)?.message as string | undefined) ||
      (asObject(parsedBody)?.error as string | undefined)

    return {
      providerMode: this.config.mode,
      vsuType: 'VSCU',
      status,
      submissionRef,
      message: messageFromBody || `VSCU ${this.config.mode} responded with status ${response.status}.`,
    }
  }
}
