export type EtimsProviderMode = 'mock' | 'sandbox' | 'live'

export type EtimsSubmissionStatus = 'accepted' | 'queued' | 'rejected' | 'error'

export interface EtimsSubmissionRequest {
  merchantName?: string | null
  kraPin: string
  totalAmount: number
  date?: string | null
  category?: string | null
  auditHash?: string | null
  etimsSignature?: string | null
  trnsMsNo?: string | null
  invcNo?: string | null
  receptNo?: string | null
  itemList?: EtimsSaleItem[] | null
}

export interface EtimsSaleItem {
  itemCd: string
  qty: number
  unitPrice: number
}

export interface EtimsSubmissionResult {
  providerMode: EtimsProviderMode
  vsuType: 'VSCU'
  status: EtimsSubmissionStatus
  submissionRef: string
  message: string
}

export interface EtimsProvider {
  submitSale(payload: EtimsSubmissionRequest): Promise<EtimsSubmissionResult>
}
