import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const ALLOWED_DOMAINS = [
  'adceutafc.com',
  'static.elpueblodeceuta.es',
  'elfarodeceuta.es',
  'teleceuta.com',
  'teleceuta.fra1.digitaloceanspaces.com',
  'assets.laliga.com',
  'r2.thesportsdb.com',
  'www.laverdaddeceuta.com',
  'www.ceutatv.com',
  'www.ceutaactualidad.com',
  'www.ceutaldia.com',
  'ceutaldia.com',
  'www.rtvce.es',
  'www.elpueblodeceuta.es',
  'img.asmedia.epimg.net',
  'imagenes2.mundodeportivo.com',
  'objetos-xlk.estaticos-marca.com',
  'estaticos-cdn.prensaiberica.es',
  'lh3.googleusercontent.com',
  'a.espncdn.com',
  'i.ytimg.com',
  'upload.wikimedia.org',
  'doragonsports.com',
  'onguesyapdtatsadsxmc.supabase.co',
]

function imageResponse(
  body: ArrayBuffer | Buffer,
  contentType: string,
  timings: { upstream: number; transform?: number; total: number }
) {
  return new NextResponse(body instanceof ArrayBuffer ? body : new Uint8Array(body), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400, immutable',
      'Server-Timing': [
        `origin;dur=${timings.upstream.toFixed(1)}`,
        timings.transform !== undefined ? `transform;dur=${timings.transform.toFixed(1)}` : null,
        `total;dur=${timings.total.toFixed(1)}`,
      ]
        .filter(Boolean)
        .join(', '),
      Vary: 'Accept',
    },
  })
}

export async function GET(request: NextRequest) {
  const startedAt = performance.now()
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  const width = parseInt(request.nextUrl.searchParams.get('w') ?? '', 10)
  const quality = parseInt(request.nextUrl.searchParams.get('q') ?? '70', 10)
  const targetWidth = Number.isFinite(width) ? Math.min(Math.max(width, 32), 1200) : null
  const targetQuality = Number.isFinite(quality) ? Math.min(Math.max(quality, 45), 85) : 70

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

  const upstreamStartedAt = performance.now()
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
  const upstreamMs = performance.now() - upstreamStartedAt

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await res.arrayBuffer()
  const acceptsAvif = request.headers.get('accept')?.includes('image/avif') ?? false
  const acceptsWebp = request.headers.get('accept')?.includes('image/webp') ?? false

  if (targetWidth && contentType.startsWith('image/') && !contentType.includes('svg')) {
    try {
      const transformStartedAt = performance.now()
      const transformer = sharp(Buffer.from(buffer), { animated: false }).resize({
        width: targetWidth,
        withoutEnlargement: true,
      })

      if (acceptsAvif) {
        const optimized = await transformer.avif({ quality: targetQuality }).toBuffer()
        return imageResponse(optimized, 'image/avif', {
          upstream: upstreamMs,
          transform: performance.now() - transformStartedAt,
          total: performance.now() - startedAt,
        })
      }

      if (acceptsWebp) {
        const optimized = await transformer.webp({ quality: targetQuality }).toBuffer()
        return imageResponse(optimized, 'image/webp', {
          upstream: upstreamMs,
          transform: performance.now() - transformStartedAt,
          total: performance.now() - startedAt,
        })
      }

      const optimized = await transformer.jpeg({ quality: targetQuality }).toBuffer()
      return imageResponse(optimized, 'image/jpeg', {
        upstream: upstreamMs,
        transform: performance.now() - transformStartedAt,
        total: performance.now() - startedAt,
      })
    } catch {
      // Fall back to the original response if sharp cannot decode a remote image.
    }
  }

  return imageResponse(buffer, contentType, {
    upstream: upstreamMs,
    total: performance.now() - startedAt,
  })
}
