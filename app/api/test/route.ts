import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ message: 'Gateway Operational', timestamp: new Date().toISOString() })
}
