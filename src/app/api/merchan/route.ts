import { NextResponse } from 'next/server'
import { getMerchanProducts } from '@/infrastructure/supabase/MerchanRepository'
import { withApi } from '@/lib/apiError'

export const GET = withApi(async () => {
  const products = await getMerchanProducts()
  return NextResponse.json({ products }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
})
