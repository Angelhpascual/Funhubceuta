export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin has its own shell — no app navbar
  return <>{children}</>
}
