import { SupabaseClient } from '@supabase/supabase-js'

const SIGNED_URL_EXPIRES_IN = 60 * 60 // 1시간

export async function getSignedPhotoUrls(
  supabase: SupabaseClient,
  storagePaths: string[]
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {}

  const { data } = await supabase.storage
    .from('diary-photos')
    .createSignedUrls(storagePaths, SIGNED_URL_EXPIRES_IN)

  const urlByPath: Record<string, string> = {}
  data?.forEach((entry) => {
    if (entry.path && entry.signedUrl) urlByPath[entry.path] = entry.signedUrl
  })
  return urlByPath
}
