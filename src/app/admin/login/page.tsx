'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.replace('/admin')
    } else {
      setError('Contraseña incorrecta')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ceuta-bg-soft p-4">
      <div className="bg-white rounded-[20px] p-8 w-full max-w-[360px] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ceuta-red mb-1">
          Panel de administración
        </div>
        <div className="text-[24px] font-black uppercase tracking-[-0.02em] text-ceuta-black mb-6">
          AD Ceuta FC
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            className={`w-full px-4 py-3 rounded-[12px] border text-[16px] outline-none mb-2 bg-ceuta-bg-soft ${
              error ? 'border-ceuta-red' : 'border-ceuta-border'
            }`}
          />
          {error && (
            <p className="text-[12px] text-ceuta-red mb-3 font-semibold">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className={`w-full py-[13px] rounded-[12px] border-none text-white text-[14px] font-bold uppercase tracking-[0.05em] ${
              loading ? 'bg-ceuta-bg-mid cursor-default' : 'bg-ceuta-black cursor-pointer'
            }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
