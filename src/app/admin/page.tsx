import { redirect } from 'next/navigation'
import { supabase } from '@/infrastructure/supabase/client'

async function getStats() {
  const [
    { count: subscribers },
    { count: news },
    { count: players },
    { data: lastNews },
    { data: lastSync },
  ] = await Promise.all([
    supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('player_stats').select('*', { count: 'exact', head: true }).eq('season', '2025-2026'),
    supabase.from('news').select('published_at, source, title').order('published_at', { ascending: false }).limit(5),
    supabase.from('news').select('created_at').order('created_at', { ascending: false }).limit(1),
  ])

  return {
    subscribers: subscribers ?? 0,
    news: news ?? 0,
    players: players ?? 0,
    lastNews: lastNews ?? [],
    lastSync: lastSync?.[0]?.created_at ?? null,
  }
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Madrid',
  })
}

const SOURCE_LABELS: Record<string, string> = {
  oficial: 'AD Ceuta FC', faro: 'El Faro', elpueblo: 'El Pueblo',
  marca: 'Marca', mundodeportivo: 'Mundo Deportivo',
  '20minutos': '20 Minutos', elmundo: 'El Mundo',
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ secret?: string }>
}) {
  const { secret } = await searchParams
  if (secret !== process.env.TEST_SECRET) redirect('/')

  const stats = await getStats()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: '24px 16px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#D62027', marginBottom: 4 }}>Panel de administración</div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#0A0A0A' }}>AD Ceuta FC Info</div>
      </div>

      {/* Métricas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#D62027', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.subscribers}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>Usuarios con notificaciones</div>
        </div>
        <div style={{ background: '#0A0A0A', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.news}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>Noticias en base de datos</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#F5F4F1', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#0A0A0A', lineHeight: 1 }}>{stats.players}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6E6E6E', marginTop: 8 }}>Jugadores con stats ESPN</div>
        </div>
        <div style={{ background: '#F5F4F1', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', lineHeight: 1.4 }}>{fmt(stats.lastSync)}</div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6E6E6E', marginTop: 8 }}>Última noticia guardada</div>
        </div>
      </div>

      {/* Últimas noticias */}
      <div style={{ background: '#F5F4F1', borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6E6E6E', marginBottom: 12 }}>Últimas 5 noticias</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.lastNews.map((n, i) => (
            <div key={i} style={{ borderTop: i > 0 ? '1px solid #E4E1DA' : 'none', paddingTop: i > 0 ? 10 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#D62027', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                {SOURCE_LABELS[n.source] ?? n.source} · {fmt(n.published_at)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3 }}>{n.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
