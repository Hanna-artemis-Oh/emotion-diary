import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: recentDiaries } = await supabase
    .from('diaries')
    .select('id, title, content, emotion_label, emotion_color, emotion_emoji, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  const totalCount = await supabase
    .from('diaries')
    .select('id', { count: 'exact', head: true })
    .then(({ count }) => count ?? 0)

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '사용자'

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">🌈 감정 일기</span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* 인사말 */}
        <div>
          <p className="text-sm text-gray-500">안녕하세요,</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{displayName}님 👋</h1>
        </div>

        {/* 새 일기 쓰기 CTA */}
        <Link
          href="/diary/new"
          className="block rounded-2xl bg-gray-900 p-6 text-white hover:bg-gray-800 transition-colors"
        >
          <p className="text-sm opacity-60 mb-1">오늘 하루는 어떠셨나요?</p>
          <p className="text-xl font-semibold">새 일기 쓰기 →</p>
        </Link>

        {/* 바로가기 */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/history"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm font-semibold text-gray-900">히스토리</p>
            <p className="text-xs text-gray-400 mt-0.5">총 {totalCount}개의 일기</p>
          </Link>
          <Link
            href="/stats"
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-2">📊</p>
            <p className="text-sm font-semibold text-gray-900">감정 통계</p>
            <p className="text-xs text-gray-400 mt-0.5">내 감정 패턴 보기</p>
          </Link>
        </div>

        {/* 최근 일기 */}
        {recentDiaries && recentDiaries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">최근 일기</h2>
              <Link href="/history" className="text-xs text-gray-400 hover:text-gray-600">
                전체 보기
              </Link>
            </div>
            <ul className="space-y-2">
              {recentDiaries.map((diary) => {
                const date = new Intl.DateTimeFormat('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(diary.created_at))

                return (
                  <li key={diary.id}>
                    <Link href={`/diary/${diary.id}`}>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: diary.emotion_color ?? '#E5E7EB' }}
                        >
                          {diary.emotion_emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {diary.title || '제목 없음'}
                          </p>
                          <p className="text-xs text-gray-400">{diary.emotion_label} · {date}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
