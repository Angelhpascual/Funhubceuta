import { CURRENT_SEASON } from '@/lib/constants'
import { getPlayersWithExternalPhotos, updatePlayerPhotoUrl } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { downloadAndUploadImage, PLAYER_BUCKET } from '@/infrastructure/storage/imageUploader'
import { sourceUrlHash } from '@/lib/sourceUrlHash'

// Unlike the news-image backfill, this only ever has the squad's own roster
// pending (bounded, ~30-40 players), and overridePhotoUrlsByDorsal resets
// every matched player back to "pending" on every squad sync — so a cap
// below the roster size left the same leftover players permanently stuck
// un-optimized across every future run, not just the first one (regression:
// discovered when 14 of 29 official photos never converged after a sync).
// 50 covers the full roster with headroom; downloads run in parallel so the
// cost is still one round of network+sharp latency, not 50x it.
const BATCH_SIZE = 50

export async function backfillSquadPhotos() {
  const players = await getPlayersWithExternalPhotos(CURRENT_SEASON)
  const batch = players.slice(0, BATCH_SIZE)

  let optimized = 0
  let failed = 0

  await Promise.all(
    batch.map(async ({ id, photo_url }) => {
      // The storage path used to be a bare `players/${id}`, reused on every
      // re-sync — with the bucket's 1-year Cache-Control, overwriting that
      // same path never invalidated the CDN/browser cache, so a changed
      // source photo (e.g. official site replacing LaLiga's) kept showing
      // the old image indefinitely even though the file itself was correct.
      // Hashing the source URL into the path means a new photo gets a new
      // URL, while an unchanged source keeps reusing (not duplicating) its file.
      const filename = `players/${id}-${sourceUrlHash(photo_url)}`
      const stored = await downloadAndUploadImage(photo_url, filename, {
        bucket: PLAYER_BUCKET,
        maxWidth: 220,
        maxHeight: 240,
        quality: 80,
      })
      if (stored) {
        await updatePlayerPhotoUrl(id, stored)
        optimized++
      } else {
        failed++
      }
    })
  )

  return { pending: players.length, optimized, failed }
}
