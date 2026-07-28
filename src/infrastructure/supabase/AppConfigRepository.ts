import { supabaseAdmin } from './adminClient'

export async function getConfig(key: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('app_config').select('value').eq('key', key).maybeSingle()
  return data?.value ?? null
}

export async function setConfig(key: string, value: string): Promise<void> {
  await supabaseAdmin
    .from('app_config')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

export async function deleteConfig(key: string): Promise<void> {
  await supabaseAdmin.from('app_config').delete().eq('key', key)
}
