import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { SOURCE_LABELS } from '@/lib/constants'
import { AdminHero } from '@/features/admin/AdminHero'
import { NoticiasClient } from './NoticiasClient'

export const dynamic = 'force-dynamic'

const newsRepo = new NewsSupabaseRepository()

export default async function NoticiasAdminPage() {
  const news = await newsRepo.getAdminList(200)
  const queued = news.filter((n) => n.notify_queued).length

  const badges = [
    { color: '#1E9E4B', label: 'Publicadas', value: news.length },
    ...(queued > 0 ? [{ color: '#F2C300', label: 'Pendientes de notificar', value: queued }] : []),
  ]

  return (
    <>
      <AdminHero
        label="Gestión de contenido"
        title={<>Noticias<em className="not-italic text-ceuta-gold">.</em></>}
        badges={badges}
      />
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pb-16">
        <NoticiasClient news={news} sourceLabels={SOURCE_LABELS} />
      </div>
    </>
  )
}
