import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { SOURCE_LABELS } from '@/lib/constants'
import { NoticiasClient } from './NoticiasClient'

const newsRepo = new NewsSupabaseRepository()

export default async function NoticiasAdminPage() {
  const news = await newsRepo.getAdminList()
  const queued = news.filter((n) => n.notify_queued).length
  const total = news.length

  return (
    <>
      {/* Hero */}
      <section className="bg-ceuta-black text-white relative overflow-hidden">
        <div
          className="absolute top-0 right-[-40px] bottom-0 w-[420px] opacity-[0.08]"
          style={{
            background: 'repeating-linear-gradient(-45deg, #fff 0 14px, #000 14px 28px)',
            clipPath: 'polygon(120px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-9 relative flex items-end justify-between gap-6 flex-wrap">
          <div>
            <div className="font-display text-[12.5px] font-bold tracking-[0.16em] uppercase text-ceuta-red flex items-center gap-2.5">
              <span className="w-6 h-0.5 bg-ceuta-red" />
              Gestión de contenido
            </div>
            <h1 className="font-display font-black text-[46px] leading-[0.95] uppercase mt-2">
              Noticias<em className="not-italic text-ceuta-gold">.</em>
            </h1>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <span className="flex items-center gap-2 bg-white/7 border border-white/14 rounded-full px-3.5 py-2 font-display text-[12.5px] font-semibold tracking-[0.06em] uppercase text-white/75">
              <span className="w-[7px] h-[7px] rounded-full bg-[#1E9E4B]" />
              Publicadas · <b className="text-white">{total}</b>
            </span>
            {queued > 0 && (
              <span className="flex items-center gap-2 bg-white/7 border border-white/14 rounded-full px-3.5 py-2 font-display text-[12.5px] font-semibold tracking-[0.06em] uppercase text-white/75">
                <span className="w-[7px] h-[7px] rounded-full bg-ceuta-gold" />
                Pendientes de notificar · <b className="text-white">{queued}</b>
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pb-16">
        <NoticiasClient news={news} sourceLabels={SOURCE_LABELS} />
      </div>
    </>
  )
}
