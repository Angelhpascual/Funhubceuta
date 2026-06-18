import { NextResponse } from 'next/server'
import { getTransfers } from '@/infrastructure/supabase/TransfersRepository'

export const revalidate = 60

export async function GET() {
  const transfers = await getTransfers()
  return NextResponse.json({ transfers })
}
