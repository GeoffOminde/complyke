import { randomUUID } from 'node:crypto'
import type { EtimsProvider, EtimsProviderMode, EtimsSubmissionRequest, EtimsSubmissionResult } from './types'

export class StubEtimsProvider implements EtimsProvider {
  constructor(private readonly mode: Exclude<EtimsProviderMode, 'mock'>) {}

  async submitSale(payload: EtimsSubmissionRequest): Promise<EtimsSubmissionResult> {
    void payload
    return {
      providerMode: this.mode,
      vsuType: 'VSCU',
      status: 'queued',
      submissionRef: `VSCU-${this.mode.toUpperCase()}-${randomUUID().slice(0, 8)}`,
      message: `VSCU ${this.mode} adapter scaffold is active. Complete KRA endpoint wiring after approval.`
    }
  }
}
