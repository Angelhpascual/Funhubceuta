import { getConfig, setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { notifyAdmin } from '@/infrastructure/push/notifyAdmin'
import { logCron } from '@/infrastructure/supabase/logCron'

const ALERT_COOLDOWN_MS = 12 * 3_600_000

/**
 * Tells the admin about a cron problem, at most once per `kind` every 12 h so
 * QStash retries or a persistently broken scraper don't flood their phone.
 * Never throws: alerting is best effort and must not mask the original error.
 */
export async function alertCronProblem(cron: string, kind: 'error' | 'empty', detail: string): Promise<void> {
  try {
    const key = `cron_alert:${cron}:${kind}`
    const last = await getConfig(key)
    const lastMs = last ? new Date(last).getTime() : NaN
    if (Number.isFinite(lastMs) && Date.now() - lastMs < ALERT_COOLDOWN_MS) return
    await setConfig(key, new Date().toISOString())
    const title = kind === 'error' ? `⚠️ Cron ${cron} falla` : `⚠️ Cron ${cron} sin resultados`
    await notifyAdmin(title, detail.slice(0, 160))
  } catch {
    /* best effort */
  }
}

/**
 * Wraps a cron body so that a throw is always recorded in cron_logs and
 * flagged to the admin (the body's own success logging stays untouched), and
 * so a "successful" run that found nothing (a scraper whose page layout
 * changed) is flagged instead of silently leaving the site stale.
 */
export async function runCron<T>(
  name: string,
  fn: () => Promise<T>,
  opts: { isEmpty?: (result: T) => boolean } = {}
): Promise<T> {
  const t0 = Date.now()
  let result: T
  try {
    result = await fn()
  } catch (err) {
    await logCron(name, 'error', Date.now() - t0, { error: String(err) })
    await alertCronProblem(name, 'error', String(err))
    throw err
  }
  if (opts.isEmpty?.(result)) {
    await alertCronProblem(name, 'empty', 'El scraper devolvió 0 resultados; la web puede estar quedándose con datos viejos.')
  }
  return result
}
