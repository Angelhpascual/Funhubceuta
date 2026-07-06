import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { SOURCE_LABELS } from '@/lib/constants'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { sendPush } from '@/infrastructure/push/sendPush'
import { logNotification } from '@/infrastructure/supabase/logCron'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'

export async function GET() {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { data } = await supabaseAdmin
    .from('news')
    .select('id, title, source, image_url, published_at, url')
    .eq('notify_queued', true)
    .eq('discarded', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()

  const { id, action } = await req.json() as { id: string; action: 'send' | 'publish' | 'notify' | 'discard' }
  if (!id || !action) return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })

  if (action === 'discard') {
    await supabaseAdmin.from('news').update({ notify_queued: false, published: false, discarded: true }).eq('id', id)
    revalidatePath('/noticias')
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  }

  const { data: article } = await supabaseAdmin
    .from('news')
    .select('id, title, source, url')
    .eq('id', id)
    .single()

  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 })

  const willPublish = action === 'publish' || action === 'send'
  const willNotify  = action === 'notify'  || action === 'send'

  await supabaseAdmin
    .from('news')
    .update({ notify_queued: false, ...(willPublish ? { published: true } : {}) })
    .eq('id', id)

  if (willPublish) {
    revalidatePath('/noticias')
    revalidatePath('/')
  }

  if (!willNotify) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  const sourceLabel = SOURCE_LABELS[article.source] ?? 'Noticias'
  const result = await sendPush({
    title: '🔴 Noticias',
    body: `${sourceLabel} · ${article.title}`,
    tag: `news-${article.id}`,
    url: '/',
  })

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
