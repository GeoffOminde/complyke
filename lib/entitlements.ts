export type PlanCode =
  | 'free_trial'
  | 'trial'
  | 'micro-entity'
  | 'institutional-sme'
  | 'sme-power'
  | 'institutional-elite'
  | 'enterprise'
  | 'conglomerate'
  | 'free'
  | 'growth'
  | ''

export type CreditFeature = 'payroll' | 'scan' | 'contract' | 'privacy'

export interface PlanPrivileges {
  headcountLimit: number | 'unlimited'
  privateVaultSubnet: boolean
  complianceOfficer: boolean
  bulkProcessing: boolean
  multiEntityManagement: boolean
  whiteLabelReporting: boolean
  includesTaxLens: boolean
  includesPayroll: boolean
  includesContracts: boolean
  includesPrivacy: boolean
  includesNotifications: boolean
  allowsPayPerUse: boolean
}

const DEFAULT_PRIVILEGES: PlanPrivileges = {
  headcountLimit: 0,
  privateVaultSubnet: false,
  complianceOfficer: false,
  bulkProcessing: false,
  multiEntityManagement: false,
  whiteLabelReporting: false,
  includesTaxLens: false,
  includesPayroll: false,
  includesContracts: false,
  includesPrivacy: false,
  includesNotifications: false,
  allowsPayPerUse: false,
}

const TRIAL_PRIVILEGES: PlanPrivileges = {
  headcountLimit: 5,
  privateVaultSubnet: false,
  complianceOfficer: false,
  bulkProcessing: true,
  multiEntityManagement: false,
  whiteLabelReporting: false,
  includesTaxLens: true,
  includesPayroll: true,
  includesContracts: true,
  includesPrivacy: true,
  includesNotifications: true,
  allowsPayPerUse: true,
}

export const PLAN_PRIVILEGES: Record<PlanCode, PlanPrivileges> = {
  '': DEFAULT_PRIVILEGES,
  free: DEFAULT_PRIVILEGES,
  growth: {
    ...DEFAULT_PRIVILEGES,
    allowsPayPerUse: true,
  },
  free_trial: TRIAL_PRIVILEGES,
  trial: TRIAL_PRIVILEGES,
  'micro-entity': {
    headcountLimit: 5,
    privateVaultSubnet: false,
    complianceOfficer: false,
    bulkProcessing: false,
    multiEntityManagement: false,
    whiteLabelReporting: false,
    includesTaxLens: true,
    includesPayroll: true,
    includesContracts: true,
    includesPrivacy: true,
    includesNotifications: true,
    allowsPayPerUse: true,
  },
  'institutional-sme': {
    headcountLimit: 50,
    privateVaultSubnet: true,
    complianceOfficer: true,
    bulkProcessing: true,
    multiEntityManagement: true,
    whiteLabelReporting: false,
    includesTaxLens: true,
    includesPayroll: true,
    includesContracts: true,
    includesPrivacy: true,
    includesNotifications: true,
    allowsPayPerUse: true,
  },
  'sme-power': {
    headcountLimit: 50,
    privateVaultSubnet: true,
    complianceOfficer: true,
    bulkProcessing: true,
    multiEntityManagement: true,
    whiteLabelReporting: false,
    includesTaxLens: true,
    includesPayroll: true,
    includesContracts: true,
    includesPrivacy: true,
    includesNotifications: true,
    allowsPayPerUse: true,
  },
  'institutional-elite': {
    headcountLimit: 'unlimited',
    privateVaultSubnet: true,
    complianceOfficer: true,
    bulkProcessing: true,
    multiEntityManagement: true,
    whiteLabelReporting: true,
    includesTaxLens: true,
    includesPayroll: true,
    includesContracts: true,
    includesPrivacy: true,
    includesNotifications: true,
    allowsPayPerUse: true,
  },
  enterprise: {
    headcountLimit: 'unlimited',
    privateVaultSubnet: true,
    complianceOfficer: true,
    bulkProcessing: true,
    multiEntityManagement: true,
    whiteLabelReporting: true,
    includesTaxLens: true,
    includesPayroll: true,
    includesContracts: true,
    includesPrivacy: true,
    includesNotifications: true,
    allowsPayPerUse: true,
  },
  conglomerate: {
    headcountLimit: 'unlimited',
    privateVaultSubnet: true,
    complianceOfficer: true,
    bulkProcessing: true,
    multiEntityManagement: true,
    whiteLabelReporting: true,
    includesTaxLens: true,
    includesPayroll: true,
    includesContracts: true,
    includesPrivacy: true,
    includesNotifications: true,
    allowsPayPerUse: true,
  },
}

export function getPlanPrivileges(plan?: string | null): PlanPrivileges {
  const normalized = normalizePlan(plan)
  return PLAN_PRIVILEGES[normalized] || DEFAULT_PRIVILEGES
}


export function normalizePlan(plan?: string | null): PlanCode {
  const value = (plan || '').toLowerCase().trim()
  if (value === 'free_trial' || value === 'institutional trial') return 'free_trial'
  if (value === 'micro-entity') return 'micro-entity'
  if (value === 'institutional sme' || value === 'institutional-sme' || value === 'sme power') return 'institutional-sme'
  if (value === 'sme-power') return 'sme-power'
  if (value === 'institutional elite' || value === 'institutional-elite') return 'institutional-elite'
  if (value === 'enterprise') return 'enterprise'
  if (value === 'conglomerate') return 'conglomerate'
  if (value === 'free') return 'free'
  if (value === 'trial') return 'trial'
  if (value === 'growth') return 'growth'
  return ''
}

export function isPaidPlan(plan?: string | null): boolean {
  const p = normalizePlan(plan)
  return (
    p === 'micro-entity' ||
    p === 'sme-power' ||
    p === 'institutional-sme' ||
    p === 'institutional-elite' ||
    p === 'enterprise' ||
    p === 'conglomerate'
  )
}

/**
 * Check if the subscription is expired with a 3-day grace period
 */
export function getSubscriptionStatus(
  subscriptionPlan?: string | null,
  subscriptionEndDate?: string | null
): 'active' | 'grace_period' | 'expired' {
  const p = normalizePlan(subscriptionPlan)
  if (!subscriptionEndDate) return p === 'free' ? 'active' : 'expired'

  const expiry = new Date(subscriptionEndDate).getTime()
  if (Number.isNaN(expiry)) return 'expired'

  const now = Date.now()
  const gracePeriod = 3 * 24 * 60 * 60 * 1000 // 3 days

  if (now <= expiry) return 'active'
  if (now <= expiry + gracePeriod) return 'grace_period'
  return 'expired'
}

export function canAccessFeature(
  plan: string | null | undefined,
  feature: 'payroll' | 'receipts' | 'contracts' | 'privacy' | 'archive' | 'itax',
  subscriptionEndDate?: string | null
): boolean {
  const status = getSubscriptionStatus(plan, subscriptionEndDate)
  if (status === 'expired') return false

  const privileges = getPlanPrivileges(plan)

  if (feature === 'payroll') return privileges.includesPayroll
  if (feature === 'receipts') return privileges.includesTaxLens
  if (feature === 'contracts') return privileges.includesContracts
  if (feature === 'privacy') return privileges.includesPrivacy
  if (feature === 'archive') return privileges.privateVaultSubnet
  if (feature === 'itax') return privileges.includesTaxLens

  return false
}

export function isTrialExpired(subscriptionPlan?: string | null, subscriptionEndDate?: string | null): boolean {
  return getSubscriptionStatus(subscriptionPlan, subscriptionEndDate) === 'expired'
}

export function isPaidTierPlan(
  plan?: string | null
): plan is 'micro-entity' | 'sme-power' | 'institutional-sme' | 'institutional-elite' | 'enterprise' | 'conglomerate' {
  const p = normalizePlan(plan)
  return (
    p === 'micro-entity' ||
    p === 'sme-power' ||
    p === 'institutional-sme' ||
    p === 'institutional-elite' ||
    p === 'enterprise' ||
    p === 'conglomerate'
  )
}

export function mapPayPerUsePlanToFeature(plan?: string | null): CreditFeature | null {
  const p = (plan || '').toLowerCase().trim()
  if (p === 'ppu-payroll') return 'payroll'
  if (p === 'ppu-scan' || p === 'ppu-scan-ocr') return 'scan'
  if (p === 'ppu-contract') return 'contract'
  if (p === 'ppu-privacy') return 'privacy'
  return null
}
