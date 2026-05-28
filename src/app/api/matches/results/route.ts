import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

export async function GET() {
  // Calculate form from finished matches in DB
  const { data } = await supabase
    .from('matches')
    .select('result, date')
    .eq('status', 'finished')
    .not('result', 'is', null)
    .order('date', { ascending: false })
    .limit(5)

  if (data && data.length > 0) {
    const form = data.map(m => m.result).reverse()
    return NextResponse.json({ form })
  }

  // Fallback: app_config cached form
  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'ceuta_form')
    .single()

  if (!config?.value) return NextResponse.json({ form: [] })

  const form = config.value.split(',').filter(Boolean)
  return NextResponse.json({ form })
}
