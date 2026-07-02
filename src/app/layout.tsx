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
        {/* Pure HTML splash — inline styles so it works before any CSS loads */}
        <div
          id="html-loader"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'opacity 0.3s ease',
          }}
        >
          <img src="/escudo.png" alt="" width={72} height={72} style={{ objectFit: 'contain' }} />
        </div>
        <AppShell>{children}</AppShell>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
