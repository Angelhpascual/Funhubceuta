import { NextResponse } from 'next/server'

export function apiError(err: unknown, status = 500): NextResponse {
  const message = err instanceof Error ? err.message : String(err)
  return NextResponse.json({ error: message }, { status })
}

export function withApi<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (err) {
      return apiError(err)
    }
  }
}
