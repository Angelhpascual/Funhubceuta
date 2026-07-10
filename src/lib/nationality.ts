const NAT_FLAGS: Record<string, string> = {
  españa: '🇪🇸',
  mali: '🇲🇱',
  senegal: '🇸🇳',
  guinea: '🇬🇳',
  'guinea-bisáu': '🇬🇼',
  'guinea bisáu': '🇬🇼',
  bisau: '🇬🇼',
  argentina: '🇦🇷',
  uruguay: '🇺🇾',
  colombia: '🇨🇴',
  francia: '🇫🇷',
  marruecos: '🇲🇦',
  argelia: '🇩🇿',
  camerún: '🇨🇲',
  brasil: '🇧🇷',
  portugal: '🇵🇹',
  ghana: '🇬🇭',
  nigeria: '🇳🇬',
  'costa de marfil': '🇨🇮',
  'ivory coast': '🇨🇮',
  'estados unidos': '🇺🇸',
  'united states': '🇺🇸',
  usa: '🇺🇸',
  'burkina faso': '🇧🇫',
}

export function flag(nationality: string): string {
  if (!nationality) return ''
  const key = nationality.toLowerCase()
  for (const [k, v] of Object.entries(NAT_FLAGS)) {
    if (key.includes(k)) return v
  }
  return ''
}
