# Integration Blueprint

This blueprint shows how external business software (ERP/accounting/HR) integrates with ComplyKe.

## 1) ERP sends data to ComplyKe APIs

Typical API calls:

- `POST /api/kra/verify`
- `POST /api/review-contract`
- `POST /api/scan-receipt`
- `POST /api/mpesa/payment`

For protected routes, the caller must be authenticated (session/cookie or token-backed browser context).

## 2) ComplyKe stores results in Supabase

ComplyKe writes generated/verified data into Supabase tables such as:

- `contracts`
- `privacy_policies`
- `payroll_calculations`
- `payments`
- `notifications`

Payment persistence is written as `pending` on STK initiation and then updated by callback processing.

## 3) ComplyKe returns JSON back to calling system

Every API route returns structured JSON and an HTTP status:

- `2xx` for successful processing
- `4xx` for validation/auth/credential issues
- `5xx` for unexpected server faults

Example (`/api/mpesa/payment`):

```json
{
  "success": true,
  "message": "STK Push sent successfully. Please check your phone.",
  "data": {
    "merchantRequestID": "...",
    "checkoutRequestID": "...",
    "responseCode": "0",
    "responseDescription": "Success. Request accepted for processing"
  }
}
```

## 4) Optional outbound webhooks to external software

ComplyKe can notify external systems when payment status changes.

Configure in Vercel env:

- `ERP_WEBHOOK_URL` (required to enable webhooks)
- `ERP_WEBHOOK_SECRET` (optional but recommended)

Current events:

- `payment.completed`
- `payment.failed`

Webhook headers:

- `x-complyke-event`
- `x-complyke-timestamp`
- `x-complyke-signature` (present when `ERP_WEBHOOK_SECRET` is set)

Signature algorithm:

- HMAC SHA-256 over `${timestamp}.${rawBody}` with `ERP_WEBHOOK_SECRET`

Verify example (Node.js):

```ts
import crypto from 'node:crypto'

function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

Webhook payload format:

```json
{
  "event": "payment.completed",
  "timestamp": "2026-02-11T22:52:57.000Z",
  "data": {
    "checkoutRequestID": "ws_CO_...",
    "merchantRequestID": "...",
    "phoneNumber": "2547XXXXXXXX",
    "amount": 1,
    "mpesaReceiptNumber": "TST...",
    "resultCode": 0,
    "resultDesc": "Success"
  }
}
```
