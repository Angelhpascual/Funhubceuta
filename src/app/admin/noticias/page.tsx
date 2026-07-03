import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { SOURCE_LABELS } from '@/lib/constants'
import { NoticiasClient } from './NoticiasClient'

const newsRepo = new NewsSupabaseRepository()

export default async function NoticiasAdminPage() {
  const news = await newsRepo.getAdminList()

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--red)] mb-1">Gestión</p>
      <h1 className="text-[26px] font-black uppercase tracking-tight text-[var(--black)] mb-1">Noticias</h1>
      <p className="text-[12px] text-[var(--muted)] mb-6">{news.length} artículos en base de datos</p>

      <NoticiasClient news={news} sourceLabels={SOURCE_LABELS} />
    </div>
  )
}
