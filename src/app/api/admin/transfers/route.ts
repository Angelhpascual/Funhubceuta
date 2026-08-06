import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { withApi } from '@/lib/apiError'
import {
  createTransfer,
  deleteTransfer,
  updateTransfer,
  getTransfers,
} from '@/infrastructure/supabase/TransfersRepository'

export const GET = withApi(async () => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const transfers = await getTransfers()
  return NextResponse.json({ transfers })
})

export const POST = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const body = await request.json()
  const transfer = await createTransfer(body)
  if (!transfer) return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  revalidatePath('/mercado')
  return NextResponse.json({ transfer })
})

export const PATCH = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const body = await request.json()
  const { id, ...data } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await updateTransfer(id, data)
  revalidatePath('/mercado')
  return NextResponse.json({ ok: true })
})

export const DELETE = withApi(async (request: Request) => {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await deleteTransfer(id)
  revalidatePath('/mercado')
  return NextResponse.json({ ok: true })
})
