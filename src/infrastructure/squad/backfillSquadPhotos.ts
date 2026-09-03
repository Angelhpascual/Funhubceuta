import { CURRENT_SEASON } from '@/lib/constants'
import { getPlayersWithExternalPhotos, updatePlayerPhotoUrl } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { downloadAndUploadImage, PLAYER_BUCKET } from '@/infrastructure/storage/imageUploader'

// Process up to 15 players per run to stay within Vercel function timeout
const BATCH_SIZE = 15

export async function backfillSquadPhotos() {
  const players = await getPlayersWithExternalPhotos(CURRENT_SEASON)
  const batch = players.slice(0, BATCH_SIZE)

  let optimized = 0
  let failed = 0

  await Promise.all(
    batch.map(async ({ id, photo_url }) => {
      const filename = `players/${id}`
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
