import { NextResponse } from 'next/server'

export function apiError(err: unknown, status = 500): NextResponse {
  const message = err instanceof Error ? err.message : String(err)
  return NextResponse.json({ error: message }, { status })
}
