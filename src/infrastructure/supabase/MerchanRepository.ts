import { supabase } from './client'

export type MerchanProduct = {
  id: number
  name: string
  price: string
  url: string
  image: string
  category: 'equipaciones' | 'entrenamiento' | 'paseo' | 'merchandising'
  tag?: 'nuevo' | 'top' | null
  featured: boolean
  sort_order: number
}

export async function getMerchanProducts(): Promise<MerchanProduct[]> {
  const { data, error } = await supabase
    .from('merchan_products')
    .select('id, name, price, url, image, category, tag, featured, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}
