# Monthly RLS Audit Checklist

## In-scope tables
- `payments`
- `feature_credits`
- `notifications`
- `contracts`
- `privacy_policies`
- `payroll_calculations`
- `audit_logs`
- `webhook_nonces`

## Checklist
1. RLS is enabled on all in-scope tables.
2. `anon` and `authenticated` grants are least-privilege.
3. User-scoped policies enforce `auth.uid() = user_id` where applicable.
4. No policy allows broad `SELECT` or `UPDATE` without user scope.
5. Admin writes happen via service-role server routes only.
6. No client route relies on direct `payments` insert/update by authenticated users.
7. Verify indexes exist on callback lookup keys:
- `payments.checkout_request_id`
- `payments.merchant_request_id`
8. Confirm uniqueness constraints for replay controls:
- `(source, nonce)` on `webhook_nonces`
9. Review audit event volume and anomalies.

## Suggested audit SQL snippets
```sql
-- RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'payments','feature_credits','notifications',
    'contracts','privacy_policies','payroll_calculations',
    'audit_logs','webhook_nonces'
  )
ORDER BY tablename;
```

```sql
-- Policies overview
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'payments','feature_credits','notifications',
    'contracts','privacy_policies','payroll_calculations',
    'audit_logs','webhook_nonces'
  )
ORDER BY tablename, policyname;
```

```sql
-- Grants overview
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'payments','feature_credits','notifications',
    'contracts','privacy_policies','payroll_calculations',
    'audit_logs','webhook_nonces'
  )
ORDER BY table_name, grantee, privilege_type;
```

