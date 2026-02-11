# 🇰🇪 KRA eTIMS API Access Guide for ComplyKe

This guide outlines the experimental steps for developers to gain access to the KRA eTIMS (Electronic Tax Invoice Management System) API for integration with ComplyKe.

---

## 🎯 Integration Options

KRA provides two main API-driven systemic solutions for system-to-system integration:

1.  **OSCU (Online Sales Control Unit)**: Best for businesses conducting operations solely online with reliable connectivity.
2.  **VSCU (Virtual Sales Control Unit)**: Best for high-volume transactions or businesses that may occasionally be offline.

**Recommendation for ComplyKe**: Start with **OSCU** as it is simpler for cloud-based Next.js applications.

---

## 🚀 Step-by-Step Signup Process

Follow these steps to register for developer access:

### 1. Register on the eTIMS Portal
-   Go to [etims.kra.go.ke](https://etims.kra.go.ke).
-   Click **"Sign Up"**.
-   Enter your **KRA PIN** (this should auto-populate your business details).
-   Verify via **OTP** sent to your registered iTax mobile number.
-   Create your eTIMS password and log in.

### 2. Submit a Service Request
-   On the dashboard, click **"Service Request"**.
-   Select **"eTIMS"** from the dropdown.
-   Choose either **"OSCU"** or **"VSCU"** as your solution type.

### 3. Upload Mandatory Documents
You will need to scan and upload:
-   **ID Card Copy**: For at least one director/owner.
-   **CR12 Form** (for Companies) or **Partnership Deed**.
-   **eTIMS Acknowledgement & Commitment Form**: Download from the KRA website, sign, and upload.
-   **Introductory Letter**: If a representative is signing up on your behalf.

### 4. Wait for Approval
-   A KRA officer will review your application.
-   Once approved, you will receive a confirmation SMS.
-   Status can be tracked on the eTIMS portal under "My Requests".

---

## 🛠️ Developer Sandbox & Documentation

Once approved, you can access the following:

### 1. Sandbox Environment
KRA provides a testing environment to develop and test your Trader Invoicing System (TIS).
-   **Url**: Typically provided in the onboarding package upon approval.
-   **Goal**: Ensure your system can sign and transmit invoices accurately before going live.

### 2. Technical Specifications
Download the technical spec for your chosen integration (OSCU or VSCU) from the portal. This includes:
-   API Endpoints (Base URLs)
-   Authentication headers and signatures
-   JSON payload structures for Invoice, Receipt, and Stock movements.

---

## 📞 Support Contacts

For technical assistance during integration:
-   **Email**: timsupport@kra.go.ke
-   **Call Centre**: +254 20 4 999 999
-   **WhatsApp**: +254 711 099 999

---

## 🏗️ Next Steps for ComplyKe Devs

1.  **Onboard on Sandbox**: Use a test KRA PIN to register in the sandbox environment.
2.  **Mock API Calls**: Use the specs to build mock endpoints in ComplyKe (`lib/kra-etims-mock.ts`) to test UI responsiveness.
3.  **Digital Certificate**: Ensure you have a valid digital certificate as required by KRA for signing payloads.

---

**Last Updated**: February 10, 2026
