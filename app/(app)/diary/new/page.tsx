'use client'

import { useActionState } from 'react'
import { createDiary, type DiaryActionState } from '@/app/actions/diary'

export default function NewDiaryPage() {
  const [state, action, pending] = useActionState<DiaryActionState, FormData>(
    createDiary,
    null
  )

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">오늘의 일기</h1>
          <p className="mt-1 text-sm text-gray-500">
            오늘 있었던 일을 자유롭게 기록하세요. AI가 감정을 분석해드립니다.
          </p>
        </div>

        <form action={action} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <input
              name="title"
              type="text"
              placeholder="제목 (선택)"
              className="w-full text-lg font-medium text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <textarea
              name="content"
              placeholder="오늘 하루는 어땠나요?"
              rows={12}
              required
              className="w-full text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent resize-none leading-relaxed"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
              {state.error}
            </p>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pending ? (
                <>
                  <SpinnerIcon />
                  감정 분석 중...
                </>
              ) : (
                '감정 분석하기 →'
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
