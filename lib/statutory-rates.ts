/**
 * COMPLYKE STATUTORY RATES — SINGLE SOURCE OF TRUTH
 *
 * All Kenyan statutory rates, limits, and minimum wages must be defined HERE.
 * Import from this file in tax-calculator.ts, risk-detector.ts, and any
 * system prompt construction to ensure consistency across the codebase.
 *
 * Having the same number defined in multiple places (even slightly differently)
 * is a compliance liability — a user trusts that the calculator and the AI
 * assistant agree on every figure.
 *
 * Sources:
 *   - NSSF Act, 2013 (Phase 4, effective February 1, 2026)
 *   - Social Health Insurance Act, 2023 (SHIF)
 *   - Affordable Housing Act, 2024
 *   - Income Tax Act (2025 PAYE Bands)
 *   - Regulation of Wages (General) (Amendment) Order, 2024 (Legal Notice No. 164)
 */

// ============================================================================
// NSSF — Phase 4 (Effective February 1, 2026)
// ============================================================================

export const NSSF = {
    /** Lower Earnings Limit — Tier I ceiling */
    TIER_I_LEL: 9_000,
    /** Upper Earnings Limit — Tier II ceiling */
    TIER_II_UEL: 108_000,
    /** Contribution rate: 6% for both employee and employer */
    RATE: 0.06,
    /** Maximum employee contribution per month (KES 108,000 × 6%) */
    MAX_EMPLOYEE_CONTRIBUTION: 6_480,
    /** Maximum employer contribution per month */
    MAX_EMPLOYER_CONTRIBUTION: 6_480,
} as const

// ============================================================================
// SHIF — Social Health Insurance Fund (replaces NHIF)
// Source: Social Health Insurance Act, 2023
// ============================================================================

export const SHIF = {
    /** 2.75% of gross salary */
    RATE: 0.0275,
    /** Minimum monthly contribution regardless of salary */
    MINIMUM: 300,
} as const

// ============================================================================
// Affordable Housing Levy
// Source: Affordable Housing Act, 2024
// ============================================================================

export const HOUSING_LEVY = {
    /** Employee contribution: 1.5% of gross salary */
    EMPLOYEE_RATE: 0.015,
    /** Employer contribution: 1.5% of gross salary */
    EMPLOYER_RATE: 0.015,
    /** Penalty rate per month on unpaid amounts */
    PENALTY_RATE_PER_MONTH: 0.03,
} as const

// ============================================================================
// PAYE — Income Tax Bands (2025)
// Source: Income Tax Act
// ============================================================================

export const PAYE = {
    BANDS: [
        { upTo: 24_000, rate: 0.10 },
        { upTo: 32_333, rate: 0.25 },
        { upTo: 500_000, rate: 0.30 },
        { upTo: 800_000, rate: 0.325 },
        { upTo: Infinity, rate: 0.35 },
    ],
    /** Monthly personal relief */
    PERSONAL_RELIEF: 2_400,
} as const

// ============================================================================
// Minimum Wages (2024 Order — Legal Notice No. 164, effective Nov 2024)
// Source: Regulation of Wages (General) (Amendment) Order, 2024
//
// NOTE: The verified figures from Legal Notice No. 164 are used here.
// Previous entries in risk-detector.ts used different values (e.g. 17,000
// for Nairobi) sourced from an unverified 2025 order. Until that order
// is confirmed, these are the statutory minimums to use.
// ============================================================================

export const MINIMUM_WAGES = {
    /** Nairobi, Mombasa, Kisumu — major cities */
    nairobi: 16_114,
    mombasa: 16_114,
    kisumu: 16_114,
    /** Other urban areas */
    nakuru: 15_202,
    other: 15_202,
    /** Rural areas */
    rural: 7_997,
} as const

export type MinimumWageLocation = keyof typeof MINIMUM_WAGES
