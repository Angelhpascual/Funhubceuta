import { NextResponse } from 'next/server'
import { createPredictionSession, openPredictionSession } from '@/infrastructure/supabase/PredictionRepository'
import { apiError } from '@/lib/apiError'
import { sendPush } from '@/infrastructure/push/sendPush'
import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import { checkAdminAuth, unauthorizedResponse } from '@/infrastructure/admin/auth'
import { logCron } from '@/infrastructure/supabase/logCron'

export async function POST(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  try {
    const { matchLabel, jornada, matchMeta } = await request.json()
    if (!matchLabel) return NextResponse.json({ error: 'matchLabel requerido' }, { status: 400 })
    const { data, error } = await createPredictionSession(matchLabel, jornada ?? '', matchMeta)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ session: data })
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(request: Request) {
  if (!(await checkAdminAuth())) return unauthorizedResponse()
  try {
    const { sessionId, action } = await request.json()
    if (!sessionId || !action) return NextResponse.json({ error: 'sessionId y action requeridos' }, { status: 400 })
    if (action === 'open') {
      const { error } = await openPredictionSession(sessionId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const { data: session } = await supabaseAdmin
        .from('prediction_sessions')
        .select('match_label, jornada')
        .eq('id', sessionId)
        .maybeSingle()

      // Session is already open regardless of what happens below — see the
      // identical comment + fix in admin/mvp/session/route.ts for why this
      // no longer silently swallows a push failure.
      let pushResult: { sent: number; total: number } | { error: string }
      try {
        pushResult = await sendPush({
          title: '🔮 Predice el resultado',
          body: session?.jornada
            ? `${session.match_label} · ${session.jornada}`
            : session?.match_label ?? 'Predicción abierta',
          tag: 'prediccion',
          url: '/',
        })
      } catch (err) {
        pushResult = { error: String(err) }
        await logCron('predictions-session', 'error', 0, { stage: 'sendPush', error: String(err) })
      }

      return NextResponse.json({ ok: true, push: pushResult })
    }
    return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 })
  } catch (err) {
    return apiError(err)
  }
}
