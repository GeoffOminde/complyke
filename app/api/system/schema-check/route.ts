import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await createClient()

    async function checkTable(tableName: string) {
        try {
            // We use head: true and count: exact to minimally impact db performance
            // If table doesn't exist, this should throw an error with code '42P01' (undefined_table)
            // or a 404 from PostgREST.
            const { error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true })

            if (error) {
                // Postgres Error 42P01: undefined_table
                // If error.code is 42P01, the table is definitely missing.
                if (error.code === '42P01' || error.message?.includes('does not exist')) {
                    return false
                }
                // Other errors (like 42501 permission denied) imply the table exists but access is restricted.
                // For a schema health check, we count this as "Active / Protected".
                return true
            }
            return true
        } catch (e) {
            console.error(`Schema check failed for ${tableName}:`, e)
            return false
        }
    }

    const [vault, revenue, audit, notifications] = await Promise.all([
        checkTable('document_vault'),
        checkTable('payments'),
        checkTable('audit_logs'),
        checkTable('notifications')
    ])

    return NextResponse.json({
        vault,
        revenue,
        audit,
        notifications,
        checked_at: new Date().toISOString()
    })
}
