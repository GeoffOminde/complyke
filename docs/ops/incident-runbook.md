# ComplyKe Incident Runbook

## Severity definition
- `SEV-1`: payment and entitlement broken for most users.
- `SEV-2`: partial degradation (some flows broken).
- `SEV-3`: isolated or low-impact issue.

## Initial triage (first 15 minutes)
1. Confirm impact scope (which API routes, how many users).
2. Check latest deploy and config changes.
3. Review structured audit logs:
- `payment.stk_*`
- `payment.callback_*`
- `entitlement.*`
- `credit.*`
4. Decide: rollback vs hotfix.

## Payment/callback incident playbook
1. Verify `MPESA_*` env vars and callback strictness setting.
2. Confirm payment row linkage fields exist:
- `payments.checkout_request_id`
- `payments.merchant_request_id`
- `payments.user_id`
3. Inspect unmatched callback pattern:
- missing request IDs
- unknown source
- schema mismatch
4. If callback abuse suspected:
- temporarily enable stricter source checks
- rotate shared secret if in use
- notify stakeholders

## Credit/entitlement incident playbook
1. Query affected user payments + feature credits.
2. Confirm duplicate callbacks did not alter balance.
3. Validate idempotent guard behavior on `payments.status`.
4. Apply corrective credit adjustment only with audit note.

## Recovery verification
1. Re-run smoke checks:
- tier purchase flow
- ppu-payroll/scan/contract/privacy increments
- one consume per feature path decrements correctly
2. Confirm no fresh `high` alerts for 30 minutes.
3. Publish incident summary with root cause and fix.

## Post-incident actions
1. Add test coverage for root cause.
2. Add/adjust alert threshold if detection lagged.
3. Update this runbook.

