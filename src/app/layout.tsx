import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'AD Ceuta FC Info',
  description: 'La app de los aficionados del AD Ceuta FC',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AD Ceuta FC Info',
  },
}

export const viewport: Viewport = {
  themeColor: '#D62027',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable} h-full`}>
      <body className="min-h-full">
        {/* HTML splash — replica visual del LoadingScreen, sin depender de React ni CSS */}
        <style>{`
          @keyframes hl-spin { from { transform: rotate(-90deg); } to { transform: rotate(270deg); } }
          @keyframes hl-arc  { 0%,100% { stroke-dashoffset: 310; } 50% { stroke-dashoffset: 80; } }
          #html-loader.hide  { opacity: 0 !important; pointer-events: none; }
        `}</style>
        <div
          id="html-loader"
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, background: '#fff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '32px',
            zIndex: 9999, transition: 'opacity 0.3s ease',
          }}
        >
          <div style={{ position: 'relative', width: 120, height: 120 }}>
            <svg width="120" height="120" viewBox="0 0 120 120"
              style={{ position: 'absolute', inset: 0, animation: 'hl-spin 1.4s linear infinite' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#D62027" strokeWidth="4"
                strokeLinecap="round" strokeDasharray="326" strokeDashoffset="245"
                style={{ transformOrigin: '60px 60px', animation: 'hl-arc 1.4s ease-in-out infinite' }} />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/escudo.png" alt="" width={68} height={68} style={{ objectFit: 'contain' }} />
            </div>
          </div>
        </div>
        <AppShell>{children}</AppShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
