import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

// Estadios Liga Hypermotion 2025-2026
const VENUES: Record<string, string> = {
  'AD Ceuta FC':                  'Estadio Alfonso Murube',
  'FC Andorra':                   'Estadi Nacional',
  'Albacete BP':                  'Estadio Carlos Belmonte',
  'Albacete Balompié':            'Estadio Carlos Belmonte',
  'Burgos CF':                    'Estadio El Plantío',
  'Cádiz CF':                     'Estadio Nuevo Mirandilla',
  'CD Castellón':                 'Estadio Castalia',
  'Córdoba CF':                   'Estadio El Arcángel',
  'RC Deportivo':                 'Estadio Abanca Riazor',
  'SD Eibar':                     'Estadio Municipal de Ipurúa',
  'Granada CF':                   'Estadio Nuevo Los Cármenes',
  'SD Huesca':                    'Estadio El Alcoraz',
  'CD Leganés':                   'Estadio Municipal de Butarque',
  'UD Las Palmas':                'Estadio Gran Canaria',
  'CD Mirandés':                  'Estadio Municipal de Anduva',
  'Real Racing Club':             'Estadio El Sardinero',
  'Real Racing Club de Santander':'Estadio El Sardinero',
  'Real Sociedad B':              'Estadio Zubieta',
  'Real Sporting de Gijón':       'Estadio El Molinón',
  'Málaga CF':                    'Estadio La Rosaleda',
  'Real Valladolid':              'Estadio José Zorrilla',
  'Real Valladolid CF':           'Estadio José Zorrilla',
  'Real Zaragoza':                'Estadio La Romareda',
  'Cultural Leonesa':             'Estadio Reino de León',
  'UD Almería':                   'Estadio Power Horse',
}

export async function POST() {
  const updates = await Promise.allSettled(
    Object.entries(VENUES).map(([name, venue]) =>
      supabase
        .from('teams')
        .update({ venue })
        .ilike('name', `%${name.split(' ').slice(-1)[0]}%`)
    )
  )

  // Also do exact name matches
  await Promise.allSettled(
    Object.entries(VENUES).map(([name, venue]) =>
      supabase.from('teams').update({ venue }).eq('name', name)
    )
  )

  return NextResponse.json({ ok: true, venues: Object.keys(VENUES).length })
}
