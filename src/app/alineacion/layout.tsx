import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Alineación | AD Ceuta FC Info',
  description: 'Alineación oficial del AD Ceuta FC para el próximo partido. Once titular y suplentes.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
