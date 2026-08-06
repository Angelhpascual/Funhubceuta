import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
      <span className="text-[40px]">🔍</span>
      <h2 className="font-display font-extrabold text-[18px] uppercase tracking-[0.05em]">
        Página no encontrada
      </h2>
      <p className="text-ceuta-muted text-[13px]">
        Esta página no existe o ha sido eliminada.
      </p>
      <Link
        href="/"
        className="mt-2 px-6 py-2 rounded-xl bg-ceuta-black text-white font-display font-bold text-[13px] uppercase tracking-[0.06em] no-underline"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
