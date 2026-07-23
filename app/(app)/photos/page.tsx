import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrls } from '@/lib/supabase/photos'
import Image from 'next/image'
import Link from 'next/link'

export default async function PhotosPage() {
  const supabase = await createClient()

  const { data: photoRows } = await supabase
    .from('diary_photos')
    .select('id, storage_path, position, diary_id, diaries!inner(created_at)')
    .order('created_at', { referencedTable: 'diaries', ascending: false })
    .order('position', { ascending: true })

  const urlByPath = await getSignedPhotoUrls(
    supabase,
    (photoRows ?? []).map((p) => p.storage_path)
  )

  const photos = (photoRows ?? [])
    .filter((p) => urlByPath[p.storage_path])
    .map((p) => ({ id: p.id, url: urlByPath[p.storage_path], diaryId: p.diary_id }))

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">사진 아카이브</h1>
          <p className="mt-1 text-sm text-gray-500">일기에 첨부한 사진들을 모아봤어요.</p>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">🖼️</p>
            <p className="text-sm">아직 첨부된 사진이 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href={`/diary/${photo.diaryId}`}
                className="relative aspect-square block"
              >
                <Image
                  src={photo.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 300px"
                  className="object-cover"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
