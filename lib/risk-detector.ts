/**
 * COMPLYKE RISK DETECTOR - DETERMINISTIC COMPLIANCE ENGINE
 * 
 * This module implements hardcoded "Red Flag" triggers based on specific
 * sections of Kenyan law. NO AI INFERENCE. ONLY RULE-BASED LOGIC.
 * 
 * Sources:
 * - Employment Act, 2007 (Section 37: Casual Worker Conversion)
 * - Tax Procedures Act (Section 23A: eTIMS Requirement)
 * - Affordable Housing Act, 2024 (Penalty Calculations)
 */

// ============================================================================
// RISK TRIGGER 1: CASUAL WORKER CONVERSION (SECTION 37)
// ============================================================================

export interface CasualWorkerRisk {
    isAtRisk: boolean
    daysEmployed: number
    message: string
    severity: 'CRITICAL' | 'WARNING' | 'SAFE'
    legalReference: string
    financialImpact?: string
}

/**
 * Check if a casual worker has been employed for more than 90 days
 * Source: Employment Act, 2007, Section 37
 * 
 * Rule: Any casual worker employed for more than 3 months (90 days) continuously
 * is automatically deemed a permanent employee.
 */
export function checkCasualWorkerRisk(
    startDate: string,
    contractType: 'casual' | 'permanent' | 'contract'
): CasualWorkerRisk {
    if (contractType !== 'casual') {
        return {
            isAtRisk: false,
            daysEmployed: 0,
            message: 'Not applicable - Employee is not on casual contract',
            severity: 'SAFE',
            legalReference: 'N/A'
        }
    }

    const start = new Date(startDate)
    const today = new Date()
    const daysEmployed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    if (daysEmployed > 90) {
        return {
            isAtRisk: true,
            daysEmployed,
            message: `❌ VIOLATION RISK: Section 37 of Employment Act automatically converts this staff to Permanent after 90 days. You owe ${Math.floor(daysEmployed / 30)} months of Housing Levy arrears.`,
            severity: 'CRITICAL',
            legalReference: 'Employment Act, 2007, Section 37',
            financialImpact: 'Housing Levy arrears + potential lawsuit for unfair treatment'
        }
    } else if (daysEmployed > 75) {
        return {
            isAtRisk: true,
            daysEmployed,
            message: `⚠️ WARNING: Employee approaching 90-day limit (${90 - daysEmployed} days remaining). Convert to permanent or terminate before Day 90 to avoid automatic conversion.`,
            severity: 'WARNING',
            legalReference: 'Employment Act, 2007, Section 37'
        }
    }

    return {
        isAtRisk: false,
        daysEmployed,
        message: `✅ SAFE: Employee has been employed for ${daysEmployed} days (${90 - daysEmployed} days until automatic conversion).`,
        severity: 'SAFE',
        legalReference: 'Employment Act, 2007, Section 37'
    }
}

// ============================================================================
// RISK TRIGGER 2: eTIMS VALIDATION (SECTION 23A)
// ============================================================================

export interface ReceiptRisk {
    isDeductible: boolean
    hasKRAPin: boolean
    hasETIMS: boolean
    message: string
    severity: 'CRITICAL' | 'WARNING' | 'SAFE'
    legalReference: string
    taxImpact?: string
}

/**
 * Check if a receipt is tax-deductible based on eTIMS validation
 * Source: Tax Procedures Act, Section 23A
 * 
 * Rule: All business expenses MUST have eTIMS-validated receipts (QR code + KRA PIN).
 * Receipts without eTIMS = NON-DEDUCTIBLE for tax purposes.
 */
export function checkReceiptDeductibility(
    hasKRAPin: boolean,
    hasQRCode: boolean
): ReceiptRisk {
    if (!hasKRAPin) {
        return {
            isDeductible: false,
            hasKRAPin: false,
            hasETIMS: false,
            message: '❌ NON-DEDUCTIBLE: This receipt lacks a KRA PIN. Only purchase from KRA-registered businesses to claim expenses.',
            severity: 'CRITICAL',
            legalReference: 'Tax Procedures Act, Section 23A',
            taxImpact: 'KRA will tax this amount as profit (30% corporate tax)'
        }
    }

    if (!hasQRCode) {
        return {
            isDeductible: false,
            hasKRAPin: true,
            hasETIMS: false,
            message: '❌ NON-DEDUCTIBLE: This receipt lacks eTIMS validation (QR Code). KRA will reject this expense during audit.',
            severity: 'CRITICAL',
            legalReference: 'Tax Procedures Act, Section 23A',
            taxImpact: 'Expense will be added back to taxable income'
        }
    }

    return {
        isDeductible: true,
        hasKRAPin: true,
        hasETIMS: true,
        message: '✅ TAX DEDUCTIBLE: Receipt has KRA PIN and eTIMS validation. Safe to claim as business expense.',
        severity: 'SAFE',
        legalReference: 'Tax Procedures Act, Section 23A'
    }
}

// ============================================================================
// RISK TRIGGER 3: HOUSING LEVY ARREARS CALCULATOR
// ============================================================================

export interface HousingLevyArrears {
    monthsOverdue: number
    principalAmount: number
    penaltyAmount: number
    totalDue: number
    message: string
    severity: 'CRITICAL' | 'WARNING' | 'SAFE'
    legalReference: string
}

/**
 * Calculate Housing Levy arrears and penalties
 * Source: Affordable Housing Act, 2024
 * 
 * Penalty: 3% per month on unpaid amounts
 */
export function calculateHousingLevyArrears(
    monthlyGrossSalary: number,
    monthsUnpaid: number
): HousingLevyArrears {
    if (monthsUnpaid === 0) {
        return {
            monthsOverdue: 0,
            principalAmount: 0,
            penaltyAmount: 0,
            totalDue: 0,
            message: '✅ COMPLIANT: No Housing Levy arrears',
            severity: 'SAFE',
            legalReference: 'Affordable Housing Act, 2024'
        }
    }

    // Employee: 1.5%, Employer: 1.5% = 3% total per month
    const monthlyLevy = monthlyGrossSalary * 0.03
    const principalAmount = monthlyLevy * monthsUnpaid

    // Penalty: 3% per month on unpaid amount
    const penaltyRate = 0.03
    const penaltyAmount = principalAmount * penaltyRate * monthsUnpaid

    const totalDue = principalAmount + penaltyAmount

    return {
        monthsOverdue: monthsUnpaid,
        principalAmount,
        penaltyAmount,
        totalDue,
        message: `❌ CRITICAL: You owe KES ${totalDue.toLocaleString()} in Housing Levy arrears (Principal: KES ${principalAmount.toLocaleString()} + Penalty: KES ${penaltyAmount.toLocaleString()})`,
        severity: 'CRITICAL',
        legalReference: 'Affordable Housing Act, 2024 - Penalty: 3% per month'
    }
}

// ============================================================================
// RISK TRIGGER 4: MINIMUM WAGE VIOLATION
// ============================================================================

export interface MinimumWageRisk {
    isCompliant: boolean
    providedSalary: number
    minimumWage: number
    shortfall: number
    message: string
    severity: 'CRITICAL' | 'WARNING' | 'SAFE'
    legalReference: string
}

/**
 * Check if salary meets minimum wage requirements
 * Source: Regulation of Wages (General) Order, 2025
 */
export function checkMinimumWageCompliance(
    salary: number,
    location: 'nairobi' | 'mombasa' | 'kisumu' | 'nakuru' | 'other'
): MinimumWageRisk {
    const minimumWages = {
        nairobi: 17000,
        mombasa: 16500,
        kisumu: 15500,
        nakuru: 15000,
        other: 15000
    }

    const minimumWage = minimumWages[location]
    const isCompliant = salary >= minimumWage
    const shortfall = isCompliant ? 0 : minimumWage - salary

    if (!isCompliant) {
        return {
            isCompliant: false,
            providedSalary: salary,
            minimumWage,
            shortfall,
            message: `❌ CRITICAL: Salary (KES ${salary.toLocaleString()}) is below the 2025 minimum wage for ${location} (KES ${minimumWage.toLocaleString()}). This violates the Regulation of Wages (General) Order 2025.`,
            severity: 'CRITICAL',
            legalReference: 'Regulation of Wages (General) Order, 2025'
        }
    }

    return {
        isCompliant: true,
        providedSalary: salary,
        minimumWage,
        shortfall: 0,
        message: `✅ COMPLIANT: Salary meets minimum wage requirement for ${location}`,
        severity: 'SAFE',
        legalReference: 'Regulation of Wages (General) Order, 2025'
    }
}

// ============================================================================
// COMPREHENSIVE RISK ASSESSMENT
// ============================================================================

export interface ComplianceRiskReport {
    overallRisk: 'CRITICAL' | 'WARNING' | 'SAFE'
    criticalIssues: number
    warnings: number
    risks: {
        casualWorker?: CasualWorkerRisk
        minimumWage?: MinimumWageRisk
        housingLevyArrears?: HousingLevyArrears
    }
    recommendations: string[]
}

/**
 * Generate a comprehensive compliance risk report
 */
export function generateComplianceReport(params: {
    employeeStartDate?: string
    contractType?: 'casual' | 'permanent' | 'contract'
    salary?: number
    location?: 'nairobi' | 'mombasa' | 'kisumu' | 'nakuru' | 'other'
    housingLevyMonthsUnpaid?: number
}): ComplianceRiskReport {
    const risks: ComplianceRiskReport['risks'] = {}
    const recommendations: string[] = []
    let criticalIssues = 0
    let warnings = 0

    // Check casual worker risk
    if (params.employeeStartDate && params.contractType) {
        const casualRisk = checkCasualWorkerRisk(params.employeeStartDate, params.contractType)
        risks.casualWorker = casualRisk

        if (casualRisk.severity === 'CRITICAL') {
            criticalIssues++
            recommendations.push('Convert casual worker to permanent immediately or face legal penalties')
        } else if (casualRisk.severity === 'WARNING') {
            warnings++
            recommendations.push('Plan for contract conversion or termination before 90-day limit')
        }
    }

    // Check minimum wage compliance
    if (params.salary && params.location) {
        const wageRisk = checkMinimumWageCompliance(params.salary, params.location)
        risks.minimumWage = wageRisk

        if (wageRisk.severity === 'CRITICAL') {
            criticalIssues++
            recommendations.push(`Increase salary by KES ${wageRisk.shortfall.toLocaleString()} to meet minimum wage`)
        }
    }

    // Check housing levy arrears
    if (params.salary && params.housingLevyMonthsUnpaid) {
        const arrearsRisk = calculateHousingLevyArrears(params.salary, params.housingLevyMonthsUnpaid)
        risks.housingLevyArrears = arrearsRisk

        if (arrearsRisk.severity === 'CRITICAL') {
            criticalIssues++
            recommendations.push(`Pay Housing Levy arrears of KES ${arrearsRisk.totalDue.toLocaleString()} immediately`)
        }
    }

    const overallRisk = criticalIssues > 0 ? 'CRITICAL' : warnings > 0 ? 'WARNING' : 'SAFE'

    return {
        overallRisk,
        criticalIssues,
        warnings,
        risks,
        recommendations
    }
}
