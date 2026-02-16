import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const compliantVendors = [
  { name: 'Nairobi Office Mart', category: 'Office Supplies', location: 'Westlands', status: 'eTIMS Verified' },
  { name: 'Metro Fuel & Logistics', category: 'Transport', location: 'Industrial Area', status: 'eTIMS Verified' },
  { name: 'BluePeak Utilities', category: 'Utilities', location: 'Nairobi CBD', status: 'eTIMS Verified' },
  { name: 'Kijani Professional Services', category: 'Professional Services', location: 'Upper Hill', status: 'eTIMS Verified' },
]

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      vendors: compliantVendors,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch compliant vendors'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
