import { getConfig, setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { NextResponse } from 'next/server'

const KEY = 'mercado_active'

export async function GET() {
  const val = await getConfig(KEY)
  return NextResponse.json({ mercadoActive: val === 'true' })
}

export async function POST(req: Request) {
  const { mercadoActive } = await req.json()
  await setConfig(KEY, mercadoActive ? 'true' : 'false')
  return NextResponse.json({ mercadoActive })
}
