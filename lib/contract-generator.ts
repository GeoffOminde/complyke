/**
 * Contract Generation Utilities
 */

export interface EmployeeDetails {
    employeeName: string;
    idNumber: string;
    jobTitle: string;
    grossSalary: number;
    startDate: string;
    employerName?: string;
}

/**
 * Generate a standard employment contract for Kenya
 */
export function generateEmploymentContract(details: EmployeeDetails): string {
    const { employeeName, idNumber, jobTitle, grossSalary, startDate } = details;

    return `
EMPLOYMENT CONTRACT

This Employment Contract is entered into on ${new Date(startDate).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}.

**BETWEEN:**

**${details.employerName || '[EMPLOYER NAME]'}** (hereinafter referred to as "the Employer")

**AND:**

**${employeeName}**, ID Number: ${idNumber} (hereinafter referred to as "the Employee")

**1. POSITION AND DUTIES**
The Employee is hereby employed as **${jobTitle}** and shall perform all duties as assigned by the Employer.

**2. COMMENCEMENT**
Employment shall commence on ${new Date(startDate).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}.

**3. REMUNERATION**
The Employee shall receive a gross monthly salary of **KES ${grossSalary.toLocaleString('en-KE')}**.

**4. STATUTORY DEDUCTIONS**
The Employer shall make the following statutory deductions from the Employee's gross salary in accordance with Kenyan law:

a) **Affordable Housing Levy**: 1.5% of gross salary as per the Finance Act 2023
b) **Social Health Insurance Fund (SHIF)**: 2.75% of gross salary as per the Social Health Insurance Act 2024/2025
c) **National Social Security Fund (NSSF)**: As per NSSF Act
d) **Pay As You Earn (PAYE)**: As per Income Tax Act

**5. WORKING HOURS**
The Employee shall work [40] hours per week, from Monday to Friday.

**6. LEAVE ENTITLEMENT**
The Employee is entitled to **21 days** of annual leave per year, as per the Employment Act.

**7. TERMINATION**
Either party may terminate this contract by giving **[30] days' written notice** or payment in lieu thereof.

**8. GOVERNING LAW**
This contract shall be governed by the laws of the Republic of Kenya.

**9. COMPLIANCE**
Both parties agree to comply with all applicable Kenyan labor laws, including but not limited to:
- The Employment Act, 2007
- The Labour Relations Act, 2007
- The Occupational Safety and Health Act, 2007
- The Work Injury Benefits Act, 2007
- The Data Protection Act, 2019

**SIGNED:**

_______________________          _______________________
Employer                         Employee
Date: _______________            Date: _______________


**This is a legally binding contract. Both parties should seek independent legal advice before signing.**
`.trim();
}
