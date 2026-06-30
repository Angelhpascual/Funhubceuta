import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import {
  createTransfer,
  deleteTransfer,
  updateTransfer,
  getTransfers,
} from '@/infrastructure/supabase/TransfersRepository'

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

export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const transfers = await getTransfers()
  return NextResponse.json({ transfers })
}

export async function POST(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const transfer = await createTransfer(body)
  if (!transfer) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  return NextResponse.json({ transfer })
}

export async function PATCH(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await updateTransfer(id, data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await deleteTransfer(id)
  return NextResponse.json({ ok: true })
}
