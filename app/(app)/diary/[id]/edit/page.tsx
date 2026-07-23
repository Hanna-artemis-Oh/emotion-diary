import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrls } from '@/lib/supabase/photos'
import { notFound } from 'next/navigation'
import EditDiaryForm from './EditDiaryForm'

export default async function EditDiaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: diary } = await supabase
    .from('diaries')
    .select('id, title, content')
    .eq('id', id)
    .single()

  if (!diary) notFound()

  const { data: diaryPhotos } = await supabase
    .from('diary_photos')
    .select('id, storage_path')
    .eq('diary_id', id)
    .order('position', { ascending: true })

  const urlByPath = await getSignedPhotoUrls(
    supabase,
    (diaryPhotos ?? []).map((p) => p.storage_path)
  )
  const photos = (diaryPhotos ?? [])
    .filter((p) => urlByPath[p.storage_path])
    .map((p) => ({ id: p.id, url: urlByPath[p.storage_path] }))

  return (
    <EditDiaryForm
      diaryId={diary.id}
      initialTitle={diary.title ?? ''}
      initialContent={diary.content}
      initialPhotos={photos}
    />
  )
}
