# Kenyan Tax & Compliance Reference Guide 2025

This document provides detailed information about the tax calculations and compliance requirements implemented in ComplyKe.

## 📊 Tax Calculations

### 1. PAYE (Pay As You Earn) - Income Tax

#### Tax Bands for 2025

| Monthly Income Range | Tax Rate | Calculation |
|---------------------|----------|-------------|
| KES 0 - 24,000 | 10% | Income × 0.10 |
| KES 24,001 - 32,333 | 25% | 2,400 + (Income - 24,000) × 0.25 |
| KES 32,334 - 500,000 | 30% | 4,483.25 + (Income - 32,333) × 0.30 |
| KES 500,001 - 800,000 | 32.5% | 144,783.35 + (Income - 500,000) × 0.325 |
| Above KES 800,000 | 35% | 242,283.35 + (Income - 800,000) × 0.35 |

#### Personal Relief
- **Amount**: KES 2,400 per month (KES 28,800 per year)
- **Application**: Deducted from calculated tax
- **Formula**: `Tax Payable = Calculated Tax - Personal Relief`

#### Example Calculation (KES 100,000 gross salary)

```
Taxable Income: KES 100,000

Step 1: Calculate tax by bands
- First 24,000 @ 10% = 2,400
- Next 8,333 @ 25% = 2,083.25
- Next 67,667 @ 30% = 20,300.10
Total Tax = 24,783.35

Step 2: Apply personal relief
Tax Payable = 24,783.35 - 2,400 = 22,383.35

Final PAYE: KES 22,383.35
```

---

### 2. Housing Levy

#### Details
- **Rate**: 1.5% of gross salary
- **Legal Basis**: Finance Act 2023
- **Purpose**: Affordable Housing Program
- **Calculation**: `Gross Salary × 0.015`

#### Example
```
Gross Salary: KES 100,000
Housing Levy: 100,000 × 0.015 = KES 1,500
```

#### Payment
- **Remitted to**: Housing Development Fund
- **Deadline**: 9th of the following month
- **Penalty**: 5% per month for late payment

---

### 3. SHIF (Social Health Insurance Fund)

#### Details
- **Rate**: 2.75% of gross salary
- **Legal Basis**: Social Health Insurance Act 2024/2025
- **Replaces**: NHIF (National Hospital Insurance Fund)
- **Calculation**: `Gross Salary × 0.0275`

#### Example
```
Gross Salary: KES 100,000
SHIF: 100,000 × 0.0275 = KES 2,750
```

#### Payment
- **Remitted to**: Social Health Authority (SHA)
- **Deadline**: 9th of the following month
- **Coverage**: Universal health coverage for employee and dependents

---

### 4. NSSF (National Social Security Fund)

#### Phase 4 Implementation (Effective February 1, 2026)

**Tier I (Lower Earnings Limit - LEL)**: KES 9,000
- Rate: 6% (employee) + 6% (employer)
- Employee Contribution: KES 540
- Employer Contribution: KES 540

**Tier II (Upper Earnings Limit - UEL)**: KES 108,000
- Rate: 6% (employee) + 6% (employer)
- Maximum Employee Contribution: KES 6,480
- Maximum Employer Contribution: KES 6,480

**Total Maximum Monthly Remittance**: KES 12,960

#### Calculation Examples

**Example 1: Low Earner (KES 8,000)**
```
Salary: KES 8,000 (below LEL)
Employee Contribution: 8,000 × 0.06 = KES 480
Employer Contribution: 8,000 × 0.06 = KES 480
Total: KES 960
```

**Example 2: Mid-Range Earner (KES 50,000)**
```
Salary: KES 50,000
Tier I: 9,000 × 0.06 = KES 540
Tier II: (50,000 - 9,000) × 0.06 = KES 2,460
Employee Contribution: 540 + 2,460 = KES 3,000
Employer Contribution: KES 3,000 (matches employee)
Total: KES 6,000
```

**Example 3: High Earner (KES 150,000)**
```
Salary: KES 150,000 (exceeds UEL)
Tier I: 9,000 × 0.06 = KES 540
Tier II: (108,000 - 9,000) × 0.06 = KES 5,940
Employee Contribution: 540 + 5,940 = KES 6,480 (maximum)
Employer Contribution: KES 6,480 (maximum)
Total: KES 12,960
```

#### Payment
- **Remitted to**: NSSF
- **Deadline**: 15th of the following month
- **Purpose**: Retirement benefits

#### Important Notes
- Employees earning below KES 50,000 generally not affected by Phase 4 changes
- Employees earning KES 72,000+ will see increased deductions
- Tier II contributions can be remitted to NSSF or approved private pension scheme (with RBA approval)


---

## 💼 Employment Compliance

### Minimum Wage (2026)

**Source**: Regulation of Wages (General) (Amendment) Order, 2024 (Legal Notice No. 164)  
**Effective**: November 2024 (6% increase)

| Category | Monthly Minimum |
|----------|----------------|
| Major Cities (Nairobi, Mombasa, Kisumu) | KES 16,114 |
| Other Urban Areas | KES 15,202 |
| Rural Areas | KES 7,997 |

**Note**: 
- ComplyKe uses KES 16,114 as the general minimum wage threshold for major cities.
- The **living wage** in Kenya is estimated at **KES 35,518/month**, significantly higher than statutory minimums.
- Private security guards have a court-ordered minimum wage of **KES 30,000/month** (as of February 2025).

---

### Mandatory Employment Contract Clauses

1. **Employee Details**
   - Full name and ID number
   - Job title and description
   - Start date

2. **Remuneration**
   - Gross salary amount
   - Payment frequency
   - Payment method

3. **Statutory Deductions** (MUST include)
   - Housing Levy (1.5%)
   - SHIF (2.75%)
   - NSSF
   - PAYE

4. **Working Hours**
   - Maximum 52 hours per week
   - Overtime rates (1.5x normal rate)

5. **Leave Entitlement**
   - Minimum 21 days annual leave
   - Sick leave provisions
   - Maternity/paternity leave

6. **Termination**
   - Notice period (minimum 30 days)
   - Severance pay provisions

---

## 🔒 Data Protection Compliance

### ODPC (Office of Data Protection Commissioner) Requirements

#### Mandatory Privacy Policy Sections

1. **Data Controller Information**
   - Company name
   - Contact details
   - Data Protection Officer (if applicable)

2. **Types of Personal Data Collected**
   - Names, ID numbers
   - Phone numbers, email addresses
   - CCTV footage (if applicable)
   - Financial information

3. **Legal Basis for Processing**
   - Consent
   - Contract
   - Legal obligation
   - Legitimate interests

4. **Data Subject Rights**
   - Right to access
   - Right to rectification
   - Right to erasure
   - Right to data portability
   - Right to object
   - Right to withdraw consent

5. **Data Security Measures**
   - Technical safeguards
   - Organizational measures
   - Access controls

6. **Data Retention**
   - Retention periods
   - Deletion procedures

7. **Complaint Procedures**
   - Internal complaint process
   - ODPC contact information

#### ODPC Contact Information
- **Website**: www.odpc.go.ke
- **Email**: complaints@odpc.go.ke
- **Phone**: +254 (0) 20 2675 000
- **Address**: ODPC Offices, Nairobi

---

## 📅 Compliance Deadlines

### Monthly Obligations

| Obligation | Deadline | Authority |
|-----------|----------|-----------|
| PAYE Remittance | 9th of following month | KRA |
| Housing Levy | 9th of following month | Housing Fund |
| SHIF | 9th of following month | SHA |
| NSSF | 15th of following month | NSSF |

### Quarterly Obligations

| Obligation | Deadline | Authority |
|-----------|----------|-----------|
| VAT Returns | 20th of following month | KRA |
| Withholding Tax | 20th of following month | KRA |

### Annual Obligations

| Obligation | Deadline | Authority |
|-----------|----------|-----------|
| Income Tax Returns | 30th June | KRA |
| Annual Returns | Within 42 days of AGM | Business Registration Service |
| ODPC Data Audit | As required | ODPC |

---

## ⚠️ Penalties for Non-Compliance

### PAYE & Statutory Deductions
- **Late Payment**: 5% of unpaid amount + 1% per month interest
- **Non-Remittance**: Criminal prosecution + fines up to KES 200,000

### Data Protection
- **First Offense**: Warning or KES 500,000 fine
- **Subsequent Offenses**: Up to KES 5,000,000 or 1% of annual turnover
- **Serious Violations**: Criminal prosecution

### Employment Act Violations
- **Unpaid Wages**: KES 200,000 fine or 1 year imprisonment
- **No Written Contract**: KES 50,000 fine
- **Unfair Termination**: Compensation up to 12 months' salary

---

## 📚 Legal References

### Key Legislation

1. **Employment Act, 2007**
   - Governs employment relationships
   - Sets minimum standards

2. **Labour Relations Act, 2007**
   - Trade unions and collective bargaining
   - Dispute resolution

3. **Income Tax Act (Cap 470)**
   - PAYE calculations
   - Tax reliefs and deductions

4. **Finance Act, 2023**
   - Housing Levy introduction
   - Tax rate changes

5. **Social Health Insurance Act, 2024/2025**
   - SHIF implementation
   - Universal health coverage

6. **Data Protection Act, 2019**
   - Personal data processing
   - Data subject rights
   - ODPC powers

7. **NSSF Act, 2013**
   - Pension contributions
   - Retirement benefits

---

## 🔄 Recent Changes (2024/2025)

### What's New

1. **SHIF Replaces NHIF**
   - New rate: 2.75% (was tiered NHIF rates)
   - Universal coverage
   - Effective: 2024

2. **Housing Levy**
   - New mandatory deduction: 1.5%
   - Affordable housing initiative
   - Effective: 2023

3. **NSSF Expansion**
   - Increased contribution caps
   - Tier I and Tier II structure
   - Effective: 2023

4. **PAYE Adjustments**
   - Updated tax bands
   - Personal relief maintained at KES 2,400/month

---

## 💡 Best Practices for SMEs

### Compliance Checklist

- [ ] Register with KRA (PIN certificate)
- [ ] Register employees for NSSF
- [ ] Register employees for SHIF
- [ ] Register for Housing Levy
- [ ] Maintain written employment contracts
- [ ] Keep payroll records for 5+ years
- [ ] File monthly PAYE returns
- [ ] Remit deductions on time
- [ ] Conduct annual data protection audits
- [ ] Update privacy policy annually
- [ ] Display ODPC compliance notice

### Record Keeping

**Minimum Retention Periods**:
- Employment contracts: Duration + 5 years
- Payroll records: 5 years
- Tax returns: 5 years
- NSSF records: Permanent
- Personal data: As needed + 1 year

---

## 📞 Important Contacts

### Government Agencies

**Kenya Revenue Authority (KRA)**
- Website: www.kra.go.ke
- Call Center: +254 20 4 999 999
- Email: callcentre@kra.go.ke

**NSSF**
- Website: www.nssf.or.ke
- Call Center: +254 20 2 729 000
- Email: info@nssf.or.ke

**Social Health Authority (SHA)**
- Website: www.sha.go.ke
- Call Center: 0800 720 601

**Office of Data Protection Commissioner (ODPC)**
- Website: www.odpc.go.ke
- Phone: +254 20 2675 000
- Email: info@odpc.go.ke

---

**Last Updated**: February 10, 2026

**Recent Updates**:
- ✅ NSSF Phase 4 rates (Effective February 1, 2026)
- ✅ Minimum wage 2026 rates (Effective November 2024)
- ⚠️ Monitoring proposed PAYE changes (Tax Laws Amendment Bill 2026)

*This guide is for informational purposes. Always consult with a qualified tax advisor or legal professional for specific advice.*
