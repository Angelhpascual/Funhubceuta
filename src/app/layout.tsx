import { unstable_noStore as noStore } from 'next/cache'
import type { Metadata, Viewport } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { AppShell } from '@/components/layout/AppShell'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  noStore()
  const liveActive = (await getConfig('live_active')) === 'true'
  const mercadoActive = (await getConfig('mercado_active')) === 'true'

  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable} h-full`}>
      <body className="min-h-full">
        {/* Fondo blanco puro — bloquea el navbar antes de que React hidrate.
            El spinner real lo muestra LoadingScreen en cuanto monta. */}
        <div
          id="html-loader"
          aria-hidden="true"
          className="fixed inset-0 bg-white z-[9999]"
        />
        <AppShell liveActive={liveActive} mercadoActive={mercadoActive}>{children}</AppShell>
        <Analytics />
        <SpeedInsights />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="04ea7445-a0f4-4488-9831-86b17b4e71fc"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
