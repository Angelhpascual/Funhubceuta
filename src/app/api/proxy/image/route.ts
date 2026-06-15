import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_DOMAINS = [
  'adceutafc.com',
  'static.elpueblodeceuta.es',
  'elfarodeceuta.es',
  'assets.laliga.com',
  'r2.thesportsdb.com',
  'www.laverdaddeceuta.com',
  'www.ceutatv.com',
  'www.ceutaactualidad.com',
  'www.rtvce.es',
  'www.elpueblodeceuta.es',
  'img.asmedia.epimg.net',
  'imagenes2.mundodeportivo.com',
  'objetos-xlk.estaticos-marca.com',
  'estaticos-cdn.prensaiberica.es',
  'lh3.googleusercontent.com',
  'a.espncdn.com',
  'i.ytimg.com',
]

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  // Security: only proxy from allowed domains
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (!ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  const res = await fetch(url, {
    next: { revalidate: 604800 },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      Referer: `https://${hostname}/`,
      Accept: 'image/*,*/*',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400, immutable',
    },
  })
}
