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
    } catch (error: any) {
        console.error('Logout protocol failure:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
