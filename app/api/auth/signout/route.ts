import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const supabase = await createClient()

        // Sign out from Supabase (clears session on server-side if using server-side auth)
        const { error } = await supabase.auth.signOut()

        if (error) throw error

        // If you are using cookies via @supabase/ssr, the signOut() on server client 
        // will handle removing the session cookies.

        return NextResponse.json({ success: true, message: 'Institutional Session Terminated' })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Logout protocol failure'
        console.error('Logout protocol failure:', message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
