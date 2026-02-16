/**
 * COMPLYKE VERIFICATION SERVICE
 * 
 * This service provides advanced security and validation for tax calculations,
 * ensuring strict adherence to Kenyan statutes and providing an audit trail.
 */

import { PayrollBreakdown, MINIMUM_WAGES_2026 } from './tax-calculator'

export interface VerificationReport {
    timestamp: string
    status: 'Verified' | 'Warning' | 'Critical'
    checks: VerificationCheck[]
    auditHash: string
}

export interface VerificationCheck {
    id: string
    label: string
    status: 'Pass' | 'Fail' | 'Info'
    message: string
}

/**
 * Performs a comprehensive security and compliance audit on a payroll calculation
 */
export function verifyCalculation(breakdown: PayrollBreakdown, location: string = 'other'): VerificationReport {
    const checks: VerificationCheck[] = []

    // 1. Minimum Wage Check
    const locationKey = location.toLowerCase() as keyof typeof MINIMUM_WAGES_2026
    const minWage = MINIMUM_WAGES_2026[locationKey] || MINIMUM_WAGES_2026.other
    if (breakdown.grossSalary < minWage) {
        checks.push({
            id: 'min-wage',
            label: 'Minimum Wage Compliance',
            status: 'Fail',
            message: `Salary falls below the statutory minimum of KES ${minWage.toLocaleString()} for this region.`
        })
    } else {
        checks.push({
            id: 'min-wage',
            label: 'Minimum Wage Compliance',
            status: 'Pass',
            message: 'Salary meets or exceeds statutory requirements.'
        })
    }

    // 2. SHIF Minimum Check
    if (breakdown.shif < 300) {
        checks.push({
            id: 'shif-min',
            label: 'SHIF Statutory Minimum',
            status: 'Fail',
            message: 'SHIF contribution must be at least KES 300.'
        })
    } else {
        checks.push({
            id: 'shif-min',
            label: 'SHIF Statutory Minimum',
            status: 'Pass',
            message: 'SHIF meets the statutory floor.'
        })
    }

    // 3. NSSF Phase 4 Alignment
    const expectedTierI = 9000 * 0.06
    if (breakdown.nssf >= expectedTierI) {
        checks.push({
            id: 'nssf-phase-4',
            label: 'NSSF Phase 4 Alignment',
            status: 'Pass',
            message: 'Calculation aligned with February 2026 Phase 4 rates.'
        })
    } else if (breakdown.grossSalary > 9000) {
        checks.push({
            id: 'nssf-phase-4',
            label: 'NSSF Phase 4 Alignment',
            status: 'Fail',
            message: 'NSSF contribution is below Phase 4 minimum for this salary level.'
        })
    }

    // 4. Mathematical Integrity Check
    const sumDeductions = breakdown.shif + breakdown.housingLevyEmployee + breakdown.nssf + breakdown.paye
    const diff = Math.abs(sumDeductions - breakdown.totalDeductions)
    if (diff > 0.01) {
        checks.push({
            id: 'math-integrity',
            label: 'Mathematical Integrity',
            status: 'Fail',
            message: 'Internal calculation variance detected in total deductions.'
        })
    } else {
        checks.push({
            id: 'math-integrity',
            label: 'Mathematical Integrity',
            status: 'Pass',
            message: 'Arithmetic verification successful.'
        })
    }

    // 5. Personal Relief Application
    // Note: PAYE should never be negative, and if gross is low, PAYE should be 0
    if (breakdown.grossSalary < 24000 && breakdown.paye > 0) {
        checks.push({
            id: 'personal-relief',
            label: 'Personal Relief Application',
            status: 'Fail',
            message: 'Low income earners should not have personal income tax liability after relief.'
        })
    } else {
        checks.push({
            id: 'personal-relief',
            label: 'Personal Relief Application',
            status: 'Pass',
            message: 'Tax relief correctly applied.'
        })
    }

    const hasFail = checks.some(c => c.status === 'Fail')
    const status = hasFail ? 'Critical' : 'Verified'

    return {
        timestamp: new Date().toISOString(),
        status,
        checks,
        auditHash: generateAuditHash(breakdown)
    }
}

/**
 * Generates a deterministic audit hash for the calculation
 * (Simple implementation for UI purposes)
 */
function generateAuditHash(breakdown: PayrollBreakdown): string {
    const data = JSON.stringify(breakdown)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0 // Convert to 32bit integer
    }
    return 'CKE-' + Math.abs(hash).toString(16).toUpperCase()
}
