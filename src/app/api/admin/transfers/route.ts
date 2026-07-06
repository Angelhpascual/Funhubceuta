import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import {
  createTransfer,
  deleteTransfer,
  updateTransfer,
  getTransfers,
} from '@/infrastructure/supabase/TransfersRepository'

export async function GET() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const transfers = await getTransfers()
  return NextResponse.json({ transfers })
}

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const body = await request.json()
  const transfer = await createTransfer(body)
  if (!transfer) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  revalidatePath('/mercado')
  return NextResponse.json({ transfer })
}

export async function PATCH(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const body = await request.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await updateTransfer(id, data)
  revalidatePath('/mercado')
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await deleteTransfer(id)
  revalidatePath('/mercado')
  return NextResponse.json({ ok: true })
}
