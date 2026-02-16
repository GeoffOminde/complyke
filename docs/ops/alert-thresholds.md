# ComplyKe Alert Thresholds (Production)

## Scope
- Payment lifecycle
- Callback matching/authenticity
- Credits and entitlement safety
- Core API health

## Recommended alerts
1. `payment.stk_error` or `payment.persistence_failed`
- Condition: `>= 3` events in `5m`
- Severity: `high`
- Action: page on-call, verify M-Pesa credentials and DB write path.

2. `payment.callback_unmatched`
- Condition: `>= 2` events in `10m`
- Severity: `high`
- Action: investigate callback source, request IDs, and payment row linkage.

3. `payment.callback_rejected`
- Condition: `>= 1` event in `5m`
- Severity: `high`
- Action: verify callback source controls and potential abuse.

4. `payment.callback_duplicate_*`
- Condition: `>= 5` events in `10m`
- Severity: `medium`
- Action: check replay attempts and upstream retry behavior.

5. `credit.consume_underflow_attempt`
- Condition: `>= 5` events per user in `10m`
- Severity: `medium`
- Action: check client abuse and entitlement bypass attempts.

6. API availability (health + protected routes)
- Condition: `GET /api/test` non-200 for `3` consecutive checks
- Severity: `high`
- Action: incident response and rollback decision.

## Delivery targets
- Channel 1: on-call paging (`high`)
- Channel 2: ops Slack/Teams (`medium`)
- Channel 3: daily summary email (all categories)

