import puppeteer, { Browser } from 'puppeteer'

export async function launchBrowser(): Promise<Browser> {
  if (process.env.NODE_ENV === 'production') {
    const chromium = await import('@sparticuz/chromium')
    return puppeteer.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    })
  }

  return puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}
