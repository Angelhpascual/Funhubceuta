import { NextResponse } from 'next/server'
import { apiError } from '@/lib/apiError'
import { supabase } from '@/infrastructure/supabase/client'

export async function GET() {
  try {
    const { data } = await supabase
      .from('app_config')
      .select('value, updated_at')
      .eq('key', 'ceuta_leaders')
      .single()
    const headers = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    if (!data?.value) return NextResponse.json({ leaders: null }, { headers })
    return NextResponse.json({
      leaders: JSON.parse(data.value),
      updatedAt: data.updated_at,
    }, { headers })
  } catch (err) {
    return apiError(err)
  }
}
