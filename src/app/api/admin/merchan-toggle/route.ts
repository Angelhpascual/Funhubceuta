import { getConfig, setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

const KEY = 'mercado_active'

export async function GET() {
  const val = await getConfig(KEY)
  return NextResponse.json({ mercadoActive: val === 'true' })
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const { mercadoActive } = await req.json()
  await setConfig(KEY, mercadoActive ? 'true' : 'false')
  return NextResponse.json({ mercadoActive })
}
