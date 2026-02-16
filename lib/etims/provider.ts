import { HttpEtimsProvider } from './http-provider'
import type { EtimsProvider, EtimsProviderMode } from './types'

function resolveMode(): Exclude<EtimsProviderMode, 'mock'> {
  const raw = process.env.ETIMS_PROVIDER_MODE?.trim().toLowerCase()
  if (raw === 'sandbox') return 'sandbox'
  if (raw === 'live') return 'live'
  if (raw === 'mock') {
    throw new Error('ETIMS_PROVIDER_MODE=mock is disabled. Use sandbox or live for real VSCU integration.')
  }
  throw new Error('ETIMS_PROVIDER_MODE must be set to sandbox or live.')
}

export function createEtimsProviderFromEnv(): EtimsProvider {
  const mode = resolveMode()
  return new HttpEtimsProvider(mode)
}
