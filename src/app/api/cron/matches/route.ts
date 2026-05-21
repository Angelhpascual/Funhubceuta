import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { scrapeNextMatches, scrapeRecentForm } from '@/infrastructure/scrapers/adceutaScraper'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { supabase } from '@/infrastructure/supabase/client'

const repo = new MatchesSupabaseRepository()

async function syncMatches() {
  const [matches, form] = await Promise.all([
    scrapeNextMatches(),
    scrapeRecentForm(),
  ])

  await repo.upsertMatches(matches)

  // Cache form in app_config
  if (form.length > 0) {
    await supabase.from('app_config').upsert(
      { key: 'ceuta_form', value: form.join(','), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  }

  return { matches: matches.length, form }
}

// QStash (producción)
export async function POST(request: Request) {
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const body = await request.text()
  const valid = await receiver.verify({
    signature: request.headers.get('Upstash-Signature') ?? '',
    body,
  }).catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const count = await syncMatches()
  return NextResponse.json({ ok: true, count })
}

// Manual en local/dev
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST via QStash in production' }, { status: 405 })
  }
  const count = await syncMatches()
  return NextResponse.json({ ok: true, count })
}
