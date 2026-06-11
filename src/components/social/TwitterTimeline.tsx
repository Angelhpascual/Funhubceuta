const SOCIALS = [
  {
    href: 'https://twitter.com/ADCeuta_FC',
    label: '@ADCeuta_FC',
    sublabel: 'Síguenos en X',
    bg: 'bg-ceuta-black',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: 'https://www.instagram.com/adceutafc',
    label: '@adceutafc',
    sublabel: 'Síguenos en Instagram',
    bg: null,
    bgStyle: { background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    href: 'https://www.youtube.com/@AD_Ceuta_FC',
    label: 'AD Ceuta FC',
    sublabel: 'Canal de YouTube',
    bg: 'bg-[#FF0000]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export function SocialLinks() {
  return (
    <div className="mx-3 overflow-hidden rounded-[14px] border-2 border-ceuta-black bg-white">
      {/* header */}
      <div className="relative overflow-hidden bg-ceuta-black px-[18px] py-[14px]">
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 w-[80px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 8px, #0A0A0A 8px 16px)',
            clipPath: 'polygon(30px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-[14px] bg-ceuta-red" />
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
            Síguenos
          </span>
        </div>
      </div>

      {/* social rows */}
      <div className="divide-y divide-ceuta-border">
        {SOCIALS.map((s) => (
          <a
            key={s.href}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-[18px] py-[14px] active:bg-ceuta-bg-soft"
          >
            {/* icon pill */}
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${s.bg ?? ''}`}
              style={s.bgStyle}
            >
              {s.icon}
            </div>

            {/* text */}
            <div className="flex-1 min-w-0">
              <div className="font-display text-[14px] font-black uppercase tracking-[0.02em] text-ceuta-black">
                {s.label}
              </div>
              <div className="font-display text-[10px] font-semibold uppercase tracking-[0.1em] text-ceuta-muted">
                {s.sublabel}
              </div>
            </div>

            {/* arrow */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-ceuta-muted"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}
