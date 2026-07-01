import { describe, it, expect, beforeEach, vi } from 'vitest'

// Logic mirrored from InstallModal.tsx

type Platform = 'ios' | 'android' | 'desktop'

function detectPlatform(ua: string): Platform {
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

function shouldShow(opts: {
  forceShow: boolean
  isStandalone: boolean
  snoozedUntil: number | null
}): boolean {
  if (opts.forceShow) return true
  if (opts.isStandalone) return false
  if (opts.snoozedUntil !== null && Date.now() < opts.snoozedUntil) return false
  return true
}

// dismiss = solo cierra la sesión (sin localStorage)
function dismiss(setVisible: (v: boolean) => void) {
  setVisible(false)
}

// snooze = cierra + guarda 7 días en localStorage
function snooze(setVisible: (v: boolean) => void, storage: Map<string, string>) {
  storage.set('install_snoozed', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
  setVisible(false)
}

describe('detectPlatform', () => {
  it('detecta iOS en iPhone', () => {
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('ios')
  })

  it('detecta iOS en iPad', () => {
    expect(detectPlatform('Mozilla/5.0 (iPad; CPU OS 17_0)')).toBe('ios')
  })

  it('detecta Android', () => {
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 7)')).toBe('android')
  })

  it('detecta desktop en Chrome Mac', () => {
    expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126')).toBe('desktop')
  })

  it('es case-insensitive para iPhone', () => {
    expect(detectPlatform('...IPHONE...')).toBe('ios')
  })
})

describe('shouldShow', () => {
  it('fuerza mostrar con ?install=1 aunque esté en standalone', () => {
    expect(shouldShow({ forceShow: true, isStandalone: true, snoozedUntil: null })).toBe(true)
  })

  it('fuerza mostrar con ?install=1 aunque esté snoozed', () => {
    const future = Date.now() + 999999
    expect(shouldShow({ forceShow: true, isStandalone: false, snoozedUntil: future })).toBe(true)
  })

  it('no muestra si está en modo standalone (PWA instalada)', () => {
    expect(shouldShow({ forceShow: false, isStandalone: true, snoozedUntil: null })).toBe(false)
  })

  it('no muestra si está dentro del periodo de snooze', () => {
    const future = Date.now() + 7 * 24 * 60 * 60 * 1000
    expect(shouldShow({ forceShow: false, isStandalone: false, snoozedUntil: future })).toBe(false)
  })

  it('muestra si el snooze ya ha expirado', () => {
    const past = Date.now() - 1000
    expect(shouldShow({ forceShow: false, isStandalone: false, snoozedUntil: past })).toBe(true)
  })

  it('muestra en primera visita sin snooze ni standalone', () => {
    expect(shouldShow({ forceShow: false, isStandalone: false, snoozedUntil: null })).toBe(true)
  })
})

describe('dismiss vs snooze', () => {
  it('dismiss solo cierra el modal sin tocar el storage', () => {
    const storage = new Map<string, string>()
    let visible = true
    dismiss((v) => { visible = v })
    expect(visible).toBe(false)
    expect(storage.has('install_snoozed')).toBe(false)
  })

  it('snooze cierra el modal Y guarda 7 días en storage', () => {
    const storage = new Map<string, string>()
    let visible = true
    const before = Date.now()
    snooze((v) => { visible = v }, storage)
    const after = Date.now()
    expect(visible).toBe(false)
    const snoozedUntil = parseInt(storage.get('install_snoozed')!)
    expect(snoozedUntil).toBeGreaterThan(before + 6 * 24 * 60 * 60 * 1000)
    expect(snoozedUntil).toBeLessThanOrEqual(after + 7 * 24 * 60 * 60 * 1000 + 100)
  })

  it('tras dismiss, el modal vuelve a mostrarse en la siguiente visita', () => {
    // dismiss no guarda snooze → shouldShow devuelve true en próxima visita
    expect(shouldShow({ forceShow: false, isStandalone: false, snoozedUntil: null })).toBe(true)
  })

  it('tras snooze, el modal NO se muestra en los próximos 7 días', () => {
    const snoozedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000
    expect(shouldShow({ forceShow: false, isStandalone: false, snoozedUntil })).toBe(false)
  })
})
