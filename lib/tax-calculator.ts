/**
 * COMPLYKE TAX CALCULATOR - DETERMINISTIC ENGINE
 * 
 * CRITICAL: This module uses HARDCODED rates from verified 2025 Kenyan statutes.
 * NO AI INFERENCE. NO PREDICTIONS. ONLY MATH.
 * 
 * Sources:
 * - Social Health Insurance Act, 2023 (SHIF)
 * - Affordable Housing Act, 2024 (Housing Levy)
 * - NSSF Act, 2013 (Pension)
 * - Income Tax Act (PAYE Bands)
 */

// ============================================================================
// HARDCODED STATUTORY RATES (2025 VERIFIED)
// ============================================================================

/**
 * SHIF (Social Health Insurance Fund)
 * Source: Social Health Insurance Act, 2023
 * Rate: 2.75% of Gross Salary
 * Minimum: KES 300
 * Maximum: No cap
 */
export function calculateSHIF(grossSalary: number): number {
    const shif = grossSalary * 0.0275
    return Math.max(shif, 300) // Minimum KES 300
}

/**
 * Housing Levy
 * Source: Affordable Housing Act, 2024
 * Employee: 1.5% of Gross Salary
 * Employer: 1.5% of Gross Salary (Total: 3%)
 * Penalty: 3% per month on unpaid amounts
 */
export function calculateHousingLevy(grossSalary: number): {
    employee: number
    employer: number
    total: number
} {
    const employeeContribution = grossSalary * 0.015
    const employerContribution = grossSalary * 0.015

    return {
        employee: employeeContribution,
        employer: employerContribution,
        total: employeeContribution + employerContribution
    }
}

/**
 * NSSF (National Social Security Fund)
 * Source: NSSF Act, 2013 (Phase 4 - Effective February 1, 2026)
 * 
 * Tier I (Lower Earnings Limit - LEL): KES 9,000
 * Tier II (Upper Earnings Limit - UEL): KES 108,000
 * Contribution Rate: 6% for both employee and employer
 * 
 * Maximum Employee Contribution: KES 6,480
 * Maximum Employer Contribution: KES 6,480
 * Total Maximum Monthly Remittance: KES 12,960
 * 
 * Updated: February 2026 to comply with NSSF Phase 4 implementation
 */
export function calculateNSSF(grossSalary: number): number {
    // Phase 4 rates (Effective February 1, 2026)
    const TIER_I_LEL = 9000      // Lower Earnings Limit
    const TIER_II_UEL = 108000   // Upper Earnings Limit
    const CONTRIBUTION_RATE = 0.06  // 6% for employee (employer matches)

    // Tier I contribution (always applies up to LEL)
    const tierI_Contribution = TIER_I_LEL * CONTRIBUTION_RATE  // KES 540

    if (grossSalary <= TIER_I_LEL) {
        // Only Tier I applies for low earners
        return grossSalary * CONTRIBUTION_RATE
    } else if (grossSalary <= TIER_II_UEL) {
        // Tier I + Tier II for mid-range earners
        const tierII_PensionableEarnings = grossSalary - TIER_I_LEL
        const tierII_Contribution = tierII_PensionableEarnings * CONTRIBUTION_RATE
        return tierI_Contribution + tierII_Contribution
    } else {
        // Maximum contribution for high earners (salary exceeds UEL)
        const tierII_MaxContribution = (TIER_II_UEL - TIER_I_LEL) * CONTRIBUTION_RATE
        return tierI_Contribution + tierII_MaxContribution  // KES 6,480 total
    }
}

/**
 * PAYE (Pay As You Earn) - Income Tax
 * Source: Income Tax Act (2025 Tax Bands)
 * 
 * Tax Bands:
 * - First KES 24,000: 10%
 * - Next KES 8,333 (24,001 - 32,333): 25%
 * - Next KES 467,667 (32,334 - 500,000): 30%
 * - Next KES 300,000 (500,001 - 800,000): 32.5%
 * - Above KES 800,000: 35%
 * 
 * Personal Relief: KES 2,400 per month
 */
export function calculatePAYE(grossSalary: number): number {
    // Taxable income = Gross - NSSF
    const nssf = calculateNSSF(grossSalary)
    const taxableIncome = grossSalary - nssf
    let tax = 0

    // Apply progressive tax bands
    if (taxableIncome <= 24000) {
        tax = taxableIncome * 0.10
    } else if (taxableIncome <= 32333) {
        tax = (24000 * 0.10) + ((taxableIncome - 24000) * 0.25)
    } else if (taxableIncome <= 500000) {
        tax = (24000 * 0.10) + (8333 * 0.25) + ((taxableIncome - 32333) * 0.30)
    } else if (taxableIncome <= 800000) {
        tax = (24000 * 0.10) + (8333 * 0.25) + (467667 * 0.30) + ((taxableIncome - 500000) * 0.325)
    } else {
        tax = (24000 * 0.10) + (8333 * 0.25) + (467667 * 0.30) + (300000 * 0.325) + ((taxableIncome - 800000) * 0.35)
    }

    // Apply personal relief (KES 2,400 per month)
    const personalRelief = 2400
    tax = Math.max(0, tax - personalRelief)

    return Math.round(tax * 100) / 100 // Round to 2 decimal places
}

/**
 * COMPLETE PAYROLL CALCULATION
 * Returns all statutory deductions and net pay
 */
export interface PayrollBreakdown {
    grossSalary: number
    shif: number
    housingLevyEmployee: number
    housingLevyEmployer: number
    nssf: number
    paye: number
    totalDeductions: number
    netPay: number
}

export function calculatePayroll(grossSalary: number): PayrollBreakdown {
    const shif = calculateSHIF(grossSalary)
    const housingLevy = calculateHousingLevy(grossSalary)
    const nssf = calculateNSSF(grossSalary)
    const paye = calculatePAYE(grossSalary)

    const totalDeductions = shif + housingLevy.employee + nssf + paye
    const netPay = grossSalary - totalDeductions

    return {
        grossSalary,
        shif,
        housingLevyEmployee: housingLevy.employee,
        housingLevyEmployer: housingLevy.employer,
        nssf,
        paye,
        totalDeductions,
        netPay: Math.round(netPay * 100) / 100
    }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================


/**
 * Minimum Wage Validation (2026)
 * Source: Regulation of Wages (General) (Amendment) Order, 2024 (Legal Notice No. 164)
 * Effective: November 2024 (6% increase)
 * 
 * Note: The living wage in Kenya is estimated at KES 35,518/month,
 * significantly higher than statutory minimums.
 */
export const MINIMUM_WAGES_2026 = {
    nairobi: 16114,   // Major cities (Nairobi, Mombasa, Kisumu)
    mombasa: 16114,
    kisumu: 16114,
    other: 15202,     // Other urban areas
    rural: 7997       // Rural areas
} as const

export function isAboveMinimumWage(salary: number, location: string = 'other'): boolean {
    const locationKey = location.toLowerCase() as keyof typeof MINIMUM_WAGES_2026
    const minimumWage = MINIMUM_WAGES_2026[locationKey] || MINIMUM_WAGES_2026.other
    return salary >= minimumWage
}

/**
 * Format currency to KES
 */
export function formatKES(amount: number): string {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Calculate Housing Levy Penalty
 * Source: Affordable Housing Act, 2024
 * Penalty: 3% per month on unpaid amounts
 */
export function calculateHousingLevyPenalty(unpaidAmount: number, monthsOverdue: number): number {
    const penaltyRate = 0.03 // 3% per month
    return unpaidAmount * penaltyRate * monthsOverdue
}
