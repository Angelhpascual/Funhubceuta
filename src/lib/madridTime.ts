// Converts a wall-clock date+time as observed in Europe/Madrid (which the
// `matches.time` column stores, e.g. "20:30") into the real UTC instant it
// represents. Needed because serverless functions run with TZ=UTC, so
// `new Date("2026-09-05T18:30:00")` would be parsed as 18:30 UTC — two hours
// off from the real Madrid kickoff during CEST (UTC+2).
export function madridDateTimeToUtc(dateStr: string, timeStr: string): Date {
  const naiveUtc = new Date(`${dateStr}T${timeStr}:00Z`)
  const asMadridWallClock = new Date(naiveUtc.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
  const asUtcWallClock = new Date(naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' }))
  const madridOffsetMs = asMadridWallClock.getTime() - asUtcWallClock.getTime()
  return new Date(naiveUtc.getTime() - madridOffsetMs)
}

// "YYYY-MM-DD" for a given instant, as observed in Europe/Madrid — used to
// compare against the plain date strings stored in the `matches` table.
export function madridDateString(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(d)
}
