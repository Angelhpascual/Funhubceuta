import { NextResponse } from 'next/server'
import { getActiveMvpSession, getMvpVoteTallies } from '@/infrastructure/supabase/MvpRepository'
import { withApi } from '@/lib/apiError'

export const revalidate = 0

export const GET = withApi(async () => {
  const session = await getActiveMvpSession()
  if (!session) return NextResponse.json({ session: null })

  const tallies = session.status === 'open' || session.status === 'closed'
    ? await getMvpVoteTallies(session.id)
    : []

  return NextResponse.json({ session, tallies })
})
