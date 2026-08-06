import Image from 'next/image'
import { timeAgo } from '@/lib/formatters'
import { NewsItem } from '@/domain/news/News'
import { SOURCES } from './SourceTag'
import { loaderFor, isStoredNewsImage } from './newsImageUtils'

interface Props {
  item: NewsItem
  image: string
  loading: boolean
  onImageLoad: (img: HTMLImageElement) => void
  onImageReady: () => void
}

export function FeaturedNewsCard({ item, image, loading, onImageLoad, onImageReady }: Props) {
  void loading
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative mx-3 mt-3 block aspect-[16/10] cursor-pointer overflow-hidden rounded-[14px] bg-ceuta-black"
    >
      {image && (
        <Image
          loader={loaderFor(image)}
          src={image}
          alt={item.title}
          fill
          preload
          sizes="(max-width: 768px) 100vw, 420px"
          quality={70}
          unoptimized={isStoredNewsImage(image)}
          className="object-cover object-[center_20%]"
          onLoad={(e) => {
            onImageLoad(e.currentTarget)
            onImageReady()
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="mb-2.5 flex w-fit items-center gap-1.5 bg-ceuta-red px-[9px] py-[3px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/proxy/favicon?domain=${SOURCES[item.source]?.domain}`}
            alt=""
            width={14}
            height={14}
            loading="eager"
            decoding="async"
            className="rounded-[2px]"
          />
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">
            {SOURCES[item.source]?.label ?? item.source}
          </span>
        </div>
        <div className="font-display text-[24px] font-black uppercase leading-[1.05] tracking-[0.01em] text-white">
          {item.title}
        </div>
        <div className="mt-2 text-[12px] text-white/70">{timeAgo(item.publishedAt)}</div>
      </div>
    </a>
  )
}

export function FeaturedNewsPlaceholder({ loading }: { loading: boolean }) {
  return (
    <div className="relative mx-3 mt-3 aspect-[16/10] overflow-hidden rounded-[14px] bg-ceuta-black">
      <div className="flex size-full items-center justify-center font-display text-[13px] font-bold uppercase tracking-[0.1em] text-white/40">
        {loading ? 'CARGANDO…' : 'AD CEUTA'}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="mb-2.5 w-fit bg-ceuta-red px-[9px] py-[3px] font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">
          Destacado
        </div>
        <div className="font-display text-[24px] font-black uppercase leading-[1.05] text-white">
          Bienvenido a AD Ceuta Info
        </div>
        <div className="mt-2 text-[12px] text-white/70">Noticias próximamente</div>
      </div>
    </div>
  )
}
