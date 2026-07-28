import { NextResponse } from 'next/server'

export function checkCronAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export function cronUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
