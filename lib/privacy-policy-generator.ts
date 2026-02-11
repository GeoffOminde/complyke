/**
 * Privacy Policy Generator for ODPC Compliance
 */

export interface CompanyDetails {
    companyName: string;
    collectsPhoneNumbers: boolean;
    hasCCTV: boolean;
    email?: string;
    phone?: string;
    address?: string;
}

/**
 * Generate a Data Protection Act 2019 compliant privacy policy
 */
export function generatePrivacyPolicy(details: CompanyDetails): string {
    const { companyName, collectsPhoneNumbers, hasCCTV } = details;

    const dataCollectionSections: string[] = [];

    if (collectsPhoneNumbers) {
        dataCollectionSections.push(`
- **Phone Numbers**: We collect phone numbers for communication purposes, service delivery, and customer support.`);
    }

    if (hasCCTV) {
        dataCollectionSections.push(`
- **CCTV Surveillance**: We operate CCTV cameras on our premises for security purposes. Footage is retained for [30] days and access is restricted to authorized personnel only.`);
    }

    return `
DATA PRIVACY POLICY

Effective Date: ${new Date().toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}

**Company Name:** ${companyName}

This Privacy Policy is issued in compliance with the **Data Protection Act, 2019** of the Republic of Kenya and regulations issued by the Office of the Data Protection Commissioner (ODPC).

---

## 1. INTRODUCTION

${companyName} ("we", "us", "our") is committed to protecting the privacy and personal data of our customers, employees, and stakeholders. This policy explains how we collect, use, store, and protect your personal data.

---

## 2. DATA CONTROLLER

${companyName} is the data controller responsible for your personal data.

For any data protection queries, please contact:
- Email: ${details.email || '[Email Address]'}
- Phone: ${details.phone || '[Contact Number]'}
- Address: ${details.address || '[Physical Address]'}

---

## 3. PERSONAL DATA WE COLLECT

We collect and process the following categories of personal data:

${dataCollectionSections.length > 0 ? dataCollectionSections.join('\n') : '- Basic contact information as necessary for business operations'}

---

## 4. LEGAL BASIS FOR PROCESSING

We process personal data based on:
- **Consent**: You have given clear consent for us to process your personal data for specific purposes
- **Contract**: Processing is necessary for a contract we have with you
- **Legal Obligation**: Processing is necessary to comply with the law
- **Legitimate Interests**: Processing is necessary for our legitimate interests or those of a third party

---

## 5. HOW WE USE YOUR DATA

We use your personal data for:
- Providing products and services
- Customer support and communication
- Compliance with legal and regulatory requirements
- Security and fraud prevention
- Business operations and analytics

---

## 6. DATA SHARING

We do not sell your personal data. We may share data with:
- Service providers who assist in our operations
- Legal and regulatory authorities when required by law
- Professional advisors (lawyers, accountants, auditors)

---

## 7. DATA SECURITY

We implement appropriate technical and organizational measures to protect your personal data against:
- Unauthorized access
- Accidental loss
- Destruction or damage
- Unlawful processing

${hasCCTV ? '\nCCTV footage is stored securely and access is limited to authorized personnel only.' : ''}

---

## 8. DATA RETENTION

We retain personal data only for as long as necessary to fulfill the purposes for which it was collected or as required by law.

---

## 9. YOUR RIGHTS

Under the Data Protection Act, 2019, you have the right to:
- **Access** your personal data
- **Rectification** of inaccurate data
- **Erasure** of your data (right to be forgotten)
- **Restriction** of processing
- **Data Portability**
- **Object** to processing
- **Withdraw Consent** at any time

To exercise these rights, contact us at ${details.email || '[Email Address]'}

---

## 10. COMPLAINTS

If you believe your data protection rights have been violated, you have the right to lodge a complaint with:

**Office of the Data Protection Commissioner (ODPC)**
- Website: www.odpc.go.ke
- Email: complaints@odpc.go.ke
- Phone: +254 (0) 20 2675 000

---

## 11. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on our website or through direct communication.

---

## 12. CONSENT

By providing your personal data to ${companyName}, you consent to the collection, use, and processing of your data as described in this Privacy Policy.

---

**Last Updated:** ${new Date().toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}

---

**${companyName}**
Committed to Data Protection and Privacy
`.trim();
}
