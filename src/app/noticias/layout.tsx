import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Noticias | AD Ceuta FC Info',
  description: 'Últimas noticias y novedades del AD Ceuta FC. Fichajes, resultados, declaraciones y más.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
