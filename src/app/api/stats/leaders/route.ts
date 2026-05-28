import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

export async function GET() {
  const { data } = await supabase
    .from('app_config')
    .select('value, updated_at')
    .eq('key', 'ceuta_leaders')
    .single()

  if (!data?.value) return NextResponse.json({ leaders: null })

  return NextResponse.json({
    leaders: JSON.parse(data.value),
    updatedAt: data.updated_at,
  })
}
