import { writeFileSync, mkdirSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const sharp = require('sharp')

const TEAMS = [
  { id: '2737', slug: 'albacete' },
  { id: '6832', slug: 'almeria' },
  { id: '12597', slug: 'burgos' },
  { id: '11487', slug: 'sabadell' },
  { id: '4438', slug: 'castellon' },
  { id: '5404', slug: 'ceuta' },
  { id: '3842', slug: 'cadiz' },
  { id: '8447', slug: 'cordoba' },
  { id: '3752', slug: 'eibar' },
  { id: '7320', slug: 'eldense' },
  { id: '20179', slug: 'andorra' },
  { id: '9812', slug: 'girona' },
  { id: '3747', slug: 'granada' },
  { id: '98',   slug: 'laspalmas' },
  { id: '17534', slug: 'leganes' },
  { id: '84',   slug: 'mallorca' },
  { id: '85',   slug: 'celtafortuna' },
  { id: '92',   slug: 'oviedo' },
  { id: '20983', slug: 'realsociedad2' },
  { id: '95',   slug: 'valladolid' },
  { id: '3788', slug: 'sporting' },
  { id: '245',  slug: 'tenerife' },
]

mkdirSync('./public/logos', { recursive: true })

for (const { id, slug } of TEAMS) {
  const url = `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) { console.error(`FAIL ${slug}`); continue }
  const raw = Buffer.from(await res.arrayBuffer())
  const webp = await sharp(raw)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90 })
    .toBuffer()
  writeFileSync(`./public/logos/${slug}.webp`, webp)
  console.log(`✓ ${slug}.webp  ${webp.length}b`)
}
