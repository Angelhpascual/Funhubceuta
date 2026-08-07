'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
      <span className="text-[40px]">⚠️</span>
      <h2 className="font-display font-extrabold text-[18px] uppercase tracking-[0.05em]">
        Algo ha fallado
      </h2>
      <p className="text-ceuta-muted text-[13px]">
        Ha ocurrido un error inesperado. Puedes intentarlo de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 px-6 py-2 rounded-xl bg-ceuta-black text-white font-display font-bold text-[13px] uppercase tracking-[0.06em]"
      >
        Reintentar
      </button>
    </div>
  )
}
