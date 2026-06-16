import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'

function deriveToken(password: string): string {
  return createHash('sha256').update(password + 'funhub-admin-v1').digest('hex')
}

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  const password = process.env.ADMIN_PASSWORD
  if (!session || !password) return false
  return session === deriveToken(password)
}

const ACTIONS: Record<string, () => Promise<Record<string, unknown>>> = {
  news: async () => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(
      `${base}/api/cron/news?secret=${process.env.TEST_SECRET}`,
      { cache: 'no-store' }
    )
    return res.json()
  },
  matches: async () => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(
      `${base}/api/cron/matches?secret=${process.env.TEST_SECRET}`,
      { cache: 'no-store' }
    )
    return res.json()
  },
  'match-day': async () => {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/cron/match-day`, { cache: 'no-store' })
    return res.json()
  },
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { action, payload } = body as {
    action: string
    payload?: { title: string; body: string; tag: string; url: string }
  }

  // Custom push notification
  if (action === 'push' && payload) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    return NextResponse.json(await res.json())
  }

  const handler = ACTIONS[action]
  if (!handler) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  const result = await handler()
  return NextResponse.json({ ok: true, action, result })
}
