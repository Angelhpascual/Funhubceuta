import { supabase } from '@/infrastructure/supabase/client'
import { SOURCE_LABELS } from '@/lib/constants'
import { NoticiasClient } from './NoticiasClient'

async function getNews() {
  const { data } = await supabase
    .from('news')
    .select('id, title, source, published_at, image_url, url')
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}


export default async function NoticiasAdminPage() {
  const news = await getNews()

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--red)] mb-1">Gestión</p>
      <h1 className="text-[26px] font-black uppercase tracking-tight text-[var(--black)] mb-1">Noticias</h1>
      <p className="text-[12px] text-[var(--muted)] mb-6">{news.length} artículos en base de datos</p>

      <NoticiasClient news={news} sourceLabels={SOURCE_LABELS} />
    </div>
  )
}
