import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/browser', () => ({ launchBrowser: vi.fn() }))

import { launchBrowser } from '@/infrastructure/browser'
import { scrapeOfficialSquadPhotos } from '../officialSquadPhotoScraper'

function mockBrowser(rawPlayers: { dorsal: string | null; photoUrl: string | null }[]) {
  const page = {
    setUserAgent: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(
      rawPlayers
        .filter((p) => p.dorsal !== null && p.photoUrl !== null && !p.photoUrl.includes('Default-photo'))
    ),
  }
  const browser = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  }
  vi.mocked(launchBrowser).mockResolvedValue(browser as never)
  return { page, browser }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('scrapeOfficialSquadPhotos', () => {
  it('returns dorsal + photoUrl pairs', async () => {
    mockBrowser([{ dorsal: '9', photoUrl: 'https://adceutafc.com/wp-content/uploads/9_Player.webp' }])
    const result = await scrapeOfficialSquadPhotos()
    expect(result).toEqual([{ dorsal: 9, photoUrl: 'https://adceutafc.com/wp-content/uploads/9_Player.webp' }])
  })

  it('closes the browser even when scraping throws', async () => {
    const { browser, page } = mockBrowser([])
    page.goto.mockRejectedValue(new Error('timeout'))
    await expect(scrapeOfficialSquadPhotos()).rejects.toThrow('timeout')
    expect(browser.close).toHaveBeenCalled()
  })

  it('skips players without a dorsal or a real photo (placeholder silhouette)', async () => {
    mockBrowser([
      { dorsal: null, photoUrl: 'https://adceutafc.com/wp-content/uploads/x.webp' },
      { dorsal: '7', photoUrl: 'https://adceutafc.com/wp-content/uploads/Default-photo.png' },
    ])
    const result = await scrapeOfficialSquadPhotos()
    expect(result).toEqual([])
  })
})
