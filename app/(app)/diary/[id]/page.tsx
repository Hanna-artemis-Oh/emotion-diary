import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function DiaryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: diary } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', id)
    .single()

  if (!diary) notFound()

  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(diary.created_at))

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* 감정 결과 카드 */}
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-3 text-white shadow-sm"
          style={{ backgroundColor: diary.emotion_color ?? '#6B7280' }}
        >
          <span className="text-6xl">{diary.emotion_emoji}</span>
          <span className="text-2xl font-bold tracking-wide">{diary.emotion_label}</span>
          <span className="text-sm opacity-80">{formattedDate}</span>
        </div>

        {/* 일기 내용 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
          {diary.title && (
            <h1 className="text-xl font-bold text-gray-900">{diary.title}</h1>
          )}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {diary.content}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Link
            href="/diary/new"
            className="flex-1 text-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            새 일기 쓰기
          </Link>
          <Link
            href="/history"
            className="flex-1 text-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            히스토리 보기
          </Link>
        </div>
      </div>
    </main>
  )
}
