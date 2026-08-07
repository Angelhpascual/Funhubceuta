import 'server-only'
import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'

export const standingsService = new StandingsService(new StandingsSupabaseRepository())
