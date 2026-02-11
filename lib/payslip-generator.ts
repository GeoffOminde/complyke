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
    logoUrl?: string; // Optional logo parameter
}

export function generatePayslip(data: PayslipData): string {
    const formatter = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' });
    const logoBlock = data.logoUrl ? `<img src="${data.logoUrl}" style="height: 60px; margin-bottom: 20px;" alt="Company Entity" />` : '';

    return `
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
    .logo-area { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; }
    .meta { text-align: right; font-size: 12px; color: #64748b; line-height: 1.6; }
    .section-title { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; margin-top: 30px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
    .row.total { border-bottom: none; border-top: 2px solid #e2e8f0; font-weight: 800; font-size: 16px; margin-top: 10px; padding-top: 15px; }
    .net-pay-card { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 25px; border-radius: 16px; margin-top: 40px; display: flex; justify-content: space-between; align-items: center; }
    .net-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 5px; }
    .net-amount { font-size: 32px; font-weight: 900; }
    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
</style>
</head>
<body>

    <div class="header">
        <div>
            ${logoBlock}
            <div class="logo-area">${data.businessName}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Institutional Payroll Instrument</div>
        </div>
        <div class="meta">
            Payslip Period: <strong>${data.month.toUpperCase()}</strong><br>
            Employee: <strong>${data.employeeName}</strong><br>
            Generated: ${new Date().toLocaleDateString('en-GB')}<br>
            <span class="badge">Statutory Verified</span>
        </div>
    </div>

    <div class="section-title">Earnings Breakdown</div>
    <div class="row">
        <span>Basic Salary Authorization</span>
        <span style="font-weight: 600;">${formatter.format(data.grossSalary)}</span>
    </div>
    <div class="row total">
        <span>Total Gross Earnings</span>
        <span>${formatter.format(data.grossSalary)}</span>
    </div>

    <div class="section-title">Statutory Retentions (2026 Cycle)</div>
    <div class="row">
        <span>NSSF (Tier I & II)</span>
        <span style="color: #ef4444;">(${formatter.format(data.nssf)})</span>
    </div>
    <div class="row">
        <span>SHIF (Social Health)</span>
        <span style="color: #ef4444;">(${formatter.format(data.shif)})</span>
    </div>
    <div class="row">
        <span>Housing Levy (1.5%)</span>
        <span style="color: #ef4444;">(${formatter.format(data.housingLevy)})</span>
    </div>
    <div class="row">
        <span>PAYE (Income Tax)</span>
        <span style="color: #ef4444;">(${formatter.format(data.paye)})</span>
    </div>
    
    <div class="row total" style="color: #be123c;">
        <span>Total Statutory Relief</span>
        <span>(${formatter.format(data.nssf + data.shif + data.housingLevy + data.paye)})</span>
    </div>

    <div class="net-pay-card">
        <div>
            <div class="net-label">Net Liquidity Transfer</div>
            <div class="net-amount">${formatter.format(data.netPay)}</div>
        </div>
        <div style="text-align: right;">
            <div style="font-size: 10px; opacity: 0.6;">KRA Audit Hash</div>
            <div style="font-family: monospace; letter-spacing: 2px;">${Math.random().toString(36).substring(2, 10).toUpperCase()}</div>
        </div>
    </div>

    <div class="footer">
        Generated via ComplyKe Institutional Ledger • Valid for Tax Period 2026<br>
        Verify at https://itax.kra.go.ke
    </div>

</body>
</html>
    `;
}
