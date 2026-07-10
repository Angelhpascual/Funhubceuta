import { NextResponse } from 'next/server'
import { getActiveMvpSession, getMvpVoteTallies } from '@/infrastructure/supabase/MvpRepository'

export const revalidate = 0

export async function GET() {
  const session = await getActiveMvpSession()
  if (!session) return NextResponse.json({ session: null })

  const tallies = session.status === 'open' || session.status === 'closed'
    ? await getMvpVoteTallies(session.id)
    : []

  return NextResponse.json({ session, tallies })
}
