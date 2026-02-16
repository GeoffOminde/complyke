import { createAdminClient } from '@/lib/supabase-admin'

type AuditLevel = 'info' | 'warn' | 'error'

interface AuditLogInput {
  event: string
  level?: AuditLevel
  actorUserId?: string | null
  metadata?: Record<string, unknown>
}

export async function auditLog(input: AuditLogInput): Promise<void> {
  const entry = {
    ts: new Date().toISOString(),
    level: input.level || 'info',
    event: input.event,
    actorUserId: input.actorUserId || null,
    metadata: input.metadata || {},
  }

  // Structured log for platform log drains/alerts.
  const line = JSON.stringify({ kind: 'audit', ...entry })
  if (entry.level === 'error') {
    console.error(line)
  } else if (entry.level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
  }

  // Optional DB sink for compliance/audit history.
  if (process.env.AUDIT_LOG_TO_DB !== 'true') return

  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      event: entry.event,
      level: entry.level,
      actor_user_id: entry.actorUserId,
      metadata: entry.metadata,
      created_at: entry.ts,
    })
  } catch (error) {
    console.error('Audit DB insert failed:', error)
  }
}

