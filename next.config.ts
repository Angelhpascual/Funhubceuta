import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.64'],
  async headers() {
    return [
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  images: {
    minimumCacheTTL: 604800, // 7 días
    formats: ['image/avif', 'image/webp'],
    qualities: [65, 70, 75],
    deviceSizes: [390, 640, 828, 1080],
    imageSizes: [48, 88, 110, 220],
    localPatterns: [
      {
        pathname: '/api/proxy/image',
      },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'r2.thesportsdb.com' },
      { protocol: 'https', hostname: 'assets.laliga.com' },
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
      // Fotos de jugadores en mercado (dominios externos)
      { protocol: 'https', hostname: 'adceutafc.com' },
      { protocol: 'https', hostname: 'www.adceutafc.com' },
      { protocol: 'https', hostname: 'static.elpueblodeceuta.es' },
      { protocol: 'https', hostname: 'elfarodeceuta.es' },
      { protocol: 'https', hostname: 'teleceuta.com' },
      { protocol: 'https', hostname: 'teleceuta.fra1.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'doragonsports.com' },
      { protocol: 'https', hostname: 'imagenes2.mundodeportivo.com' },
      { protocol: 'https', hostname: 'objetos-xlk.estaticos-marca.com' },
      { protocol: 'https', hostname: 'estaticos-cdn.prensaiberica.es' },
      { protocol: 'https', hostname: 'img.asmedia.epimg.net' },
      { protocol: 'https', hostname: 'www.laverdaddeceuta.com' },
      { protocol: 'https', hostname: 'www.ceutatv.com' },
      { protocol: 'https', hostname: 'www.ceutaactualidad.com' },
      { protocol: 'https', hostname: 'www.ceutaldia.com' },
      { protocol: 'https', hostname: 'ceutaldia.com' },
      { protocol: 'https', hostname: 'www.rtvce.es' },
      { protocol: 'https', hostname: 'www.elpueblodeceuta.es' },
      { protocol: 'https', hostname: 'ceutadeportiva.com' },
      { protocol: 'https', hostname: 'www.ceutadeportiva.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
}

export default nextConfig
