import { supabase } from './client'

export async function logCron(
  cronType: string,
  status: 'success' | 'error',
  durationMs: number,
  details: Record<string, unknown>
) {
  await supabase
    .from('cron_logs')
    .insert({ cron_type: cronType, status, duration_ms: durationMs, details })
    .then(
      () => null,
      () => null
    )
}

export async function logNotification(opts: {
  articleTitle: string
  articleSource: string
  articleUrl: string
  recipients: number
  sentOk: number
  sentFail: number
}) {
  await supabase
    .from('notification_logs')
    .insert({
      article_title: opts.articleTitle,
      article_source: opts.articleSource,
      article_url: opts.articleUrl,
      recipients: opts.recipients,
      sent_ok: opts.sentOk,
      sent_fail: opts.sentFail,
    })
    .then(
      () => null,
      () => null
    )
}
