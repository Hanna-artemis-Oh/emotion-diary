'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateDiary, type DiaryActionState } from '@/app/actions/diary'

type ExistingPhoto = { id: string; url: string }
type PhotoDraft = { file: File; previewUrl: string }

export default function EditDiaryForm({
  diaryId,
  initialTitle,
  initialContent,
  initialPhotos,
}: {
  diaryId: string
  initialTitle: string
  initialContent: string
  initialPhotos: ExistingPhoto[]
}) {
  const updateDiaryWithId = updateDiary.bind(null, diaryId)
  const [state, action, pending] = useActionState<DiaryActionState, FormData>(
    updateDiaryWithId,
    null
  )

  const [existingPhotos, setExistingPhotos] = useState(initialPhotos)
  const [removedIds, setRemovedIds] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newPhotos, setNewPhotos] = useState<PhotoDraft[]>([])

  useEffect(() => {
    return () => {
      newPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function syncFileInput(next: PhotoDraft[]) {
    const dataTransfer = new DataTransfer()
    next.forEach((p) => dataTransfer.items.add(p.file))
    if (fileInputRef.current) fileInputRef.current.files = dataTransfer.files
  }

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return

    const next = [
      ...newPhotos,
      ...selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]
    setNewPhotos(next)
    syncFileInput(next)
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(newPhotos[index].previewUrl)
    const next = newPhotos.filter((_, i) => i !== index)
    setNewPhotos(next)
    syncFileInput(next)
  }

  function removeExistingPhoto(id: string) {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== id))
    setRemovedIds((prev) => [...prev, id])
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">일기 수정</h1>
          <p className="mt-1 text-sm text-gray-500">
            제목, 내용, 사진만 수정할 수 있어요. 감정 분석 결과는 그대로 유지됩니다.
          </p>
        </div>

        <form action={action} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          {removedIds.map((id) => (
            <input key={id} type="hidden" name="removedPhotoIds" value={id} />
          ))}

          <div>
            <input
              name="title"
              type="text"
              defaultValue={initialTitle}
              placeholder="제목 (선택)"
              className="w-full text-lg font-medium text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <textarea
              name="content"
              defaultValue={initialContent}
              rows={12}
              required
              className="w-full text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent resize-none leading-relaxed"
            />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            {existingPhotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {existingPhotos.map((photo) => (
                  <div key={photo.id} className="relative shrink-0 w-20 h-20">
                    <Image
                      src={photo.url}
                      alt="첨부 사진"
                      fill
                      sizes="80px"
                      className="object-cover rounded-lg border border-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(photo.id)}
                      aria-label="사진 제거"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              name="newPhotos"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              📷 사진 추가
            </button>

            {newPhotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {newPhotos.map((photo, index) => (
                  <div key={index} className="relative shrink-0 w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt={`추가 사진 ${index + 1} 미리보기`}
                      className="w-full h-full object-cover rounded-lg border border-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      aria-label="사진 제거"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {state?.error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
              {state.error}
            </p>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-end gap-3">
            <Link
              href={`/diary/${diaryId}`}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
