import Image from 'next/image'
import { timeAgo } from '@/lib/formatters'
import { NewsItem } from '@/domain/news/News'
import { proxyImage } from '@/lib/proxyImage'
import { SourceTag } from './SourceTag'
import { THUMB_COLORS, loaderFor, isStoredNewsImage } from './newsImageUtils'

export function NewsListItem({ item, index }: { item: NewsItem; index: number }) {
  const image = proxyImage(item.imageUrl)

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex cursor-pointer items-start gap-3 border-b border-ceuta-border px-4 py-[14px] transition-colors active:bg-ceuta-bg-soft"
    >
      {image ? (
        <div className="relative size-[88px] shrink-0 overflow-hidden rounded-[8px]">
          <Image
            loader={loaderFor(image)}
            src={image}
            alt=""
            fill
            sizes="88px"
            quality={65}
            loading="lazy"
            unoptimized={isStoredNewsImage(image)}
            className="object-cover"
          />
        </div>
      ) : (
        <div className={`relative size-[88px] shrink-0 overflow-hidden rounded-[8px] ${THUMB_COLORS[index % THUMB_COLORS.length]}`} />
      )}
      <div className="min-w-0 flex-1">
        <SourceTag source={item.source} />
        <div className="mt-1 font-display text-[16px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-ceuta-black">
          {item.title}
        </div>
        <div className="mt-[5px] text-[11.5px] text-ceuta-muted">
          {timeAgo(item.publishedAt)}
        </div>
      </div>
    </a>
  )
}
