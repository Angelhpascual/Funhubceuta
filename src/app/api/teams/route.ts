import { NextResponse } from 'next/server'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { withApi } from '@/lib/apiError'

const repo = new TeamsSupabaseRepository()

export const GET = withApi(async () => {
  const teams = await repo.getAllTeams()
  return NextResponse.json({ teams })
})
