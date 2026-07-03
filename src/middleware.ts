import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Edge Runtime requires Web Crypto — Node.js crypto is not available here.
// Must produce the same hex as deriveToken() in src/infrastructure/admin/auth.ts.
async function deriveTokenEdge(password: string): Promise<string> {
  const data = new TextEncoder().encode(password + 'funhub-admin-v1')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname === '/admin/login') return NextResponse.next()

  const session = request.cookies.get('admin_session')?.value
  const password = process.env.ADMIN_PASSWORD

  if (!session || !password || session !== (await deriveTokenEdge(password))) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
