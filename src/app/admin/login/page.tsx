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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-soft)',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--red)',
            marginBottom: 4,
          }}
        >
          Panel de administración
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            color: 'var(--black)',
            marginBottom: 24,
          }}
        >
          AD Ceuta FC
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
              fontSize: 16,
              outline: 'none',
              marginBottom: 8,
              boxSizing: 'border-box',
              background: 'var(--bg-soft)',
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: 'var(--red)', margin: '0 0 12px', fontWeight: 600 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 12,
              border: 'none',
              background: loading ? 'var(--bg-mid)' : 'var(--black)',
              color: 'var(--white)',
              fontSize: 14,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
