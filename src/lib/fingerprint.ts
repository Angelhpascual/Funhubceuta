const KEY = 'mvp_fp'

export function getFingerprint(): string {
  if (typeof window === 'undefined') return ''
  let fp = localStorage.getItem(KEY)
  if (!fp) {
    fp = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(KEY, fp)
  }
  return fp
}
