import { describe, it, expect } from 'vitest'
import { calculatePayroll } from '../lib/tax-calculator'

describe('Statutory Tax Engine (February 2026)', () => {
    it('calculates correct SHIF for KES 100,000', () => {
        const result = calculatePayroll(100000)
        // 2.75% of 100,000 = 2,750
        expect(result.shif).toBe(2750)
    })

    it('applies SHIF minimum floor of KES 300', () => {
        const result = calculatePayroll(5000)
        // 2.75% of 5,000 = 137.5, should floor to 300
        expect(result.shif).toBe(300)
    })

    it('calculates Housing Levy correctly (1.5%)', () => {
        const result = calculatePayroll(100000)
        // 1.5% of 100,000 = 1,500
        expect(result.housingLevyEmployee).toBe(1500)
    })

    it('calculates NSSF Phase 4 (2026) correctly for high earners', () => {
        const result = calculatePayroll(200000)
        // Max NSSF tier is KES 6,480 in Phase 4
        expect(result.nssf).toBe(6480)
    })

    it('calculates net pay correctly', () => {
        const gross = 50000
        const result = calculatePayroll(gross)
        const totalDeductions = result.shif + result.housingLevyEmployee + result.nssf + result.paye
        expect(result.totalDeductions).toBeCloseTo(totalDeductions, 2)
        expect(result.netPay).toBeCloseTo(gross - totalDeductions, 2)
    })
})
