import { afterEach, describe, expect, it, vi } from 'vitest'

import { HttpEtimsProvider } from '../../lib/etims/http-provider'

const ORIGINAL_ENV = { ...process.env }

function restoreEnv() {
  // Remove keys added during a test
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key]
  }
  // Restore original values
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value
  }
}

afterEach(() => {
  restoreEnv()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('HttpEtimsProvider', () => {
  it('adds deviceSerialNo to the VSCU request when ETIMS_DEVICE_SERIAL_NO is set', async () => {
    process.env.ETIMS_SANDBOX_BASE_URL = 'https://example.test'
    process.env.ETIMS_API_KEY = 'test-api-key'
    process.env.ETIMS_DEVICE_SERIAL_NO = 'SERIAL-123'

    const seenBodies: Array<Record<string, unknown>> = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: unknown, init?: RequestInit) => {
        if (init?.body) {
          seenBodies.push(JSON.parse(String(init.body)))
        }

        return {
          ok: true,
          status: 201,
          json: async () => ({ submissionRef: 'ref-1', message: 'ok' }),
          text: async () => 'ok',
        } as unknown as Response
      })
    )

    const provider = new HttpEtimsProvider('sandbox')
    await provider.submitSale({
      kraPin: 'P051234567X',
      totalAmount: 100,
    })

    expect(seenBodies[0]?.deviceSerialNo).toBe('SERIAL-123')
  })

  it('does not add deviceSerialNo when ETIMS_DEVICE_SERIAL_NO is not set', async () => {
    process.env.ETIMS_SANDBOX_BASE_URL = 'https://example.test'
    process.env.ETIMS_API_KEY = 'test-api-key'
    delete process.env.ETIMS_DEVICE_SERIAL_NO
    delete process.env.ETIMS_SERIAL_NO

    const seenBodies: Array<Record<string, unknown>> = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: unknown, init?: RequestInit) => {
        if (init?.body) {
          seenBodies.push(JSON.parse(String(init.body)))
        }

        return {
          ok: true,
          status: 201,
          json: async () => ({ submissionRef: 'ref-2', message: 'ok' }),
          text: async () => 'ok',
        } as unknown as Response
      })
    )

    const provider = new HttpEtimsProvider('sandbox')
    await provider.submitSale({
      kraPin: 'P051234567X',
      totalAmount: 100,
    })

    expect(seenBodies[0]).toBeTruthy()
    expect('deviceSerialNo' in (seenBodies[0] || {})).toBe(false)
  })
})

