import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

export async function GET() {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'ceuta_form')
    .single()

  if (!data?.value) return NextResponse.json({ form: [] })

  const form = data.value.split(',').filter(Boolean)
  return NextResponse.json({ form })
}
