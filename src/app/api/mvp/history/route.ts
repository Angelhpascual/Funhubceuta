import { NextResponse } from 'next/server'
import { getMvpHistory } from '@/infrastructure/supabase/MvpRepository'
import { withApi } from '@/lib/apiError'

export const revalidate = 0

export const GET = withApi(async () => {
  const history = await getMvpHistory(3)
  return NextResponse.json({ history })
})
