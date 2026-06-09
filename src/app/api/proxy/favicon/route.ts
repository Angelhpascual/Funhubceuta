import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain')
  if (!domain || domain.includes('/') || domain.includes('..')) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }

  // Try favicon from Google's favicon service (server-side fetch, not blocked by client)
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

  try {
    const res = await fetch(faviconUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error('Failed')
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') ?? 'image/png'
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800', // 7 días
      },
    })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}
