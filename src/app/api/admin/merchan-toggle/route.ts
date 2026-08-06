import { getConfig, setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { NextResponse } from 'next/server'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { withApi } from '@/lib/apiError'

const KEY = 'mercado_active'

export const GET = withApi(async () => {
  const val = await getConfig(KEY)
  return NextResponse.json({ mercadoActive: val === 'true' })
})

export const POST = withApi(async (req: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const { mercadoActive } = await req.json()
  await setConfig(KEY, mercadoActive ? 'true' : 'false')
  return NextResponse.json({ mercadoActive })
})
