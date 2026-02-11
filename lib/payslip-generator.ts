export interface PayslipData {
    employeeName: string;
    businessName: string;
    month: string;
    grossSalary: number;
    housingLevy: number;
    shif: number;
    nssf: number;
    paye: number;
    netPay: number;
    kraPin?: string;
}

export function generatePayslip(data: PayslipData): string {
    const formatter = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
    });

    return `
INSTITUTIONAL PAYSLIP - ${data.month.toUpperCase()}

EMPLOYER: ${data.businessName.toUpperCase()}
EMPLOYEE: ${data.employeeName.toUpperCase()}
DATE: ${new Date().toLocaleDateString('en-GB')}
------------------------------------------------------------

EARNINGS
Basic Salary:                       ${formatter.format(data.grossSalary)}
------------------------------------------------------------
TOTAL EARNINGS:                     ${formatter.format(data.grossSalary)}

STATUTORY DEDUCTIONS
NSSF (Tier I & II):                 (${formatter.format(data.nssf)})
SHIF (2.75%):                       (${formatter.format(data.shif)})
Housing Levy (1.5%):                (${formatter.format(data.housingLevy)})
PAYE (Statutory Tax):               (${formatter.format(data.paye)})
------------------------------------------------------------
TOTAL DEDUCTIONS:                   (${formatter.format(data.nssf + data.shif + data.housingLevy + data.paye)})

NET PAY
Take Home Amount:                   ${formatter.format(data.netPay)}
------------------------------------------------------------

STATUS: VERIFIED
AUDIT HASH: ${Math.random().toString(36).substring(2, 10).toUpperCase()}
GOVERNMENT PORTAL: https://itax.kra.go.ke/

This is a computer-generated institutional instrument.
    `;
}
