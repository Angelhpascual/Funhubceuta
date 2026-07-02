import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPush } from '@/infrastructure/push/sendPush'
import { logNotification } from '@/infrastructure/supabase/logCron'

const SOURCE_LABELS: Record<string, string> = {
  oficial: 'AD Ceuta FC', faro: 'El Faro de Ceuta', elpueblo: 'El Pueblo de Ceuta',
  marca: 'Marca', mundodeportivo: 'Mundo Deportivo', '20minutos': '20 Minutos',
  sport: 'Sport', as: 'AS', confidencial: 'El Confidencial', abc: 'ABC',
  lavanguardia: 'La Vanguardia', cope: 'COPE', ser: 'Cadena SER',
  ceutatv: 'Ceuta Televisión', rtvc: 'RTV Ceuta', laverdad: 'La Verdad de Ceuta',
  ceutaactualidad: 'Ceuta Actualidad', onefootball: 'OneFootball', ceutaaldia: 'Ceuta al Día',
  elpais: 'El País', rtve: 'RTVE', goal: 'Goal.com', elgoldigital: 'El Gol Digital',
  fondosegunda: 'Fondo Segunda', transfermarkt: 'Transfermarkt', ceutadeportiva: 'Ceuta Deportiva',
}

async function checkAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  return token === process.env.ADMIN_SECRET
}

// GET — list queued articles
export async function GET() {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('news')
    .select('id, title, source, image_url, published_at, url')
    .eq('notify_queued', true)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ items: data ?? [] })
}

// POST — send or discard a queued article
export async function POST(req: Request) {
  if (!(await checkAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action } = await req.json() as { id: string; action: 'send' | 'discard' }
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })

  if (action === 'discard') {
    await supabaseAdmin.from('news').update({ notify_queued: false }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  // action === 'send'
  const { data: article } = await supabaseAdmin
    .from('news')
    .select('id, title, source, url')
    .eq('id', id)
    .single()

  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

  const sourceLabel = SOURCE_LABELS[article.source] ?? 'Noticias'
  const result = await sendPush({
    title: '🔴 Noticias',
    body: `${sourceLabel} · ${article.title}`,
    tag: `news-${article.id}`,
    url: '/',
  })

  await supabaseAdmin.from('news').update({ notify_queued: false }).eq('id', id)

  await logNotification({
    articleTitle: article.title,
    articleSource: article.source,
    articleUrl: article.url,
    recipients: result.total,
    sentOk: result.sent,
    sentFail: result.total - result.sent,
  })

  return NextResponse.json({ ok: true, sent: result.sent })
}
