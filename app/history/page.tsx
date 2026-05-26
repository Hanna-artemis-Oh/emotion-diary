import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data: diaries } = await supabase
    .from('diaries')
    .select('id, title, content, emotion_label, emotion_color, emotion_emoji, created_at')
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">히스토리</h1>
            <p className="mt-1 text-sm text-gray-500">지금까지 기록한 일기 목록</p>
          </div>
          <Link
            href="/diary/new"
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            새 일기 쓰기
          </Link>
        </div>

        {!diaries || diaries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-sm">아직 작성한 일기가 없어요.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {diaries.map((diary) => {
              const date = new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }).format(new Date(diary.created_at))

              const preview = diary.content.length > 80
                ? diary.content.slice(0, 80) + '...'
                : diary.content

              return (
                <li key={diary.id}>
                  <Link href={`/diary/${diary.id}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition-shadow">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: diary.emotion_color ?? '#E5E7EB' }}
                      >
                        {diary.emotion_emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {diary.title || '제목 없음'}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{date}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 leading-relaxed">{preview}</p>
                        <span
                          className="mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: diary.emotion_color ?? '#6B7280' }}
                        >
                          {diary.emotion_label}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
