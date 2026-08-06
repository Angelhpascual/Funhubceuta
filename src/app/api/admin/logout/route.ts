import { NextResponse } from 'next/server'
import { withApi } from '@/lib/apiError'

export const POST = withApi(async () => {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
  return res
})
