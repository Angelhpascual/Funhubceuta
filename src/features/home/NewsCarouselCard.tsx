import Image from 'next/image'
import { timeAgo } from '@/lib/formatters'
import { NewsItem } from '@/domain/news/News'
import { proxyImage } from '@/lib/proxyImage'
import { SourceTag } from './SourceTag'
import { THUMB_COLORS, loaderFor } from './newsImageUtils'

export function NewsCarouselCard({ item, index }: { item: NewsItem; index: number }) {
  const image = proxyImage(item.imageUrl)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-[220px] shrink-0 overflow-hidden rounded-[14px] border border-ceuta-border bg-white [scroll-snap-align:start]"
    >
      {image ? (
        <div className="relative h-[110px] w-full shrink-0">
          <Image
            loader={loaderFor(image)}
            src={image}
            alt=""
            fill
            sizes="220px"
            quality={65}
            loading="lazy"
            className="object-cover"
          />
        </div>
      ) : (
        <div className={`h-[110px] w-full shrink-0 ${THUMB_COLORS[index % THUMB_COLORS.length]}`} />
      )}
      <div className="flex flex-1 flex-col gap-1 p-[8px_10px_10px]">
        <SourceTag source={item.source} />
        <div className="line-clamp-3 font-display text-[12px] font-bold uppercase leading-[1.35] text-ceuta-black">
          {item.title}
        </div>
        <div className="mt-auto text-[11px] text-ceuta-muted">
          {timeAgo(item.publishedAt)}
        </div>
      </div>
    </a>
  )
}
