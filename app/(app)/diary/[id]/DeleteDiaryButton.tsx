'use client'

import { useTransition } from 'react'
import { deleteDiary } from '@/app/actions/diary'

export default function DeleteDiaryButton({ diaryId }: { diaryId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('이 일기를 삭제하시겠어요? 삭제하면 되돌릴 수 없습니다.')) return
    startTransition(() => {
      deleteDiary(diaryId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="flex-1 text-center rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isPending ? '삭제 중...' : '삭제하기'}
    </button>
  )
}
