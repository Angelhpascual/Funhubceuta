import { getAppEnv } from '@/lib/appEnv'

export function liveUrl() {
  const base =
    getAppEnv() === 'production'
      ? (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://adceutainfo.vercel.app')
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
  return `${base}/api/cron/live`
}
