import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'En Directo | AD Ceuta FC Info',
  description: 'Sigue el partido del AD Ceuta FC en directo. Marcador, eventos y estadísticas en tiempo real.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
