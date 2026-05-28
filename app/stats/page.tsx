import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import EmotionCharts from './EmotionCharts'

export default async function StatsPage() {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: diaries } = await supabase
    .from('diaries')
    .select('emotion_label, emotion_color, emotion_emoji, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  // 감정별 빈도 집계
  const frequencyMap = new Map<string, { emotion_color: string; emotion_emoji: string; count: number }>()
  for (const d of diaries ?? []) {
    if (!d.emotion_label) continue
    const prev = frequencyMap.get(d.emotion_label)
    if (prev) {
      prev.count++
    } else {
      frequencyMap.set(d.emotion_label, {
        emotion_color: d.emotion_color ?? '#9CA3AF',
        emotion_emoji: d.emotion_emoji ?? '',
        count: 1,
      })
    }
  }
  const frequency = Array.from(frequencyMap.entries())
    .map(([emotion_label, v]) => ({ emotion_label, ...v }))
    .sort((a, b) => b.count - a.count)

  // 최근 30일 타임라인
  const timeline = (diaries ?? []).map((d) => ({
    date: new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(
      new Date(d.created_at)
    ),
    emotion_label: d.emotion_label ?? '',
    emotion_color: d.emotion_color ?? '#9CA3AF',
    emotion_emoji: d.emotion_emoji ?? '',
  }))

  const totalCount = diaries?.length ?? 0
  const topEmotion = frequency[0]

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">감정 통계</h1>
            <p className="mt-1 text-sm text-gray-500">최근 30일 기준</p>
          </div>
          <Link
            href="/history"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            히스토리
          </Link>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1">총 일기 수</p>
            <p className="text-3xl font-bold text-gray-900">{totalCount}<span className="text-sm font-normal text-gray-400 ml-1">개</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1">가장 많은 감정</p>
            {topEmotion ? (
              <p className="text-2xl font-bold text-gray-900">
                {topEmotion.emotion_emoji}{' '}
                <span className="text-lg">{topEmotion.emotion_label}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-400">없음</p>
            )}
          </div>
        </div>

        <EmotionCharts frequency={frequency} timeline={timeline} />

        <div className="mt-6">
          <Link
            href="/diary/new"
            className="block text-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            오늘 일기 쓰기
          </Link>
        </div>
      </div>
    </main>
  )
}
