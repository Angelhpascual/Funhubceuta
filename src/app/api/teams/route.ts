import { NextResponse } from 'next/server'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'

const repo = new TeamsSupabaseRepository()

export async function GET() {
  const teams = await repo.getAllTeams()
  return NextResponse.json({ teams })
}
