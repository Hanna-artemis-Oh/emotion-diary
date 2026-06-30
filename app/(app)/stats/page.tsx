import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import EmotionCharts from './EmotionCharts'
import EmotionTimeline from './EmotionTimeline'
import EmotionHeatmap from './EmotionHeatmap'
import DateFilter from './DateFilter'

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>
}) {
  const { from, to, preset } = await searchParams
  const isAll = preset === 'all'

  const today = new Date()
  const defaultFrom = new Date()
  defaultFrom.setDate(defaultFrom.getDate() - 30)

  const fromDate = from ? new Date(`${from}T00:00:00`) : defaultFrom
  const toDate = to ? new Date(`${to}T23:59:59`) : today

  const fromStr = from ?? defaultFrom.toISOString().slice(0, 10)
  const toStr = to ?? today.toISOString().slice(0, 10)

  const supabase = await createClient()

  const query = supabase
    .from('diaries')
    .select('emotion_label, emotion_color, emotion_emoji, created_at')
    .order('created_at', { ascending: false })

  if (!isAll) {
    if (from || to) {
      query.gte('created_at', fromDate.toISOString())
      query.lte('created_at', toDate.toISOString())
    } else {
      query.gte('created_at', defaultFrom.toISOString())
    }
  }

  const { data: diaries } = await query

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
  const rangeLabel = isAll ? '전체 기간' : (from || to) ? `${fromStr} ~ ${toStr}` : '최근 30일'

  // 잔디용 1년 데이터 (날짜 필터와 무관)
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  const { data: yearDiaries } = await supabase
    .from('diaries')
    .select('emotion_label, emotion_color, emotion_emoji, created_at')
    .gte('created_at', yearAgo.toISOString())
    .order('created_at', { ascending: true })

  const heatmapMap = new Map<string, { emotion_color: string; emotion_label: string; emotion_emoji: string }>()
  for (const d of yearDiaries ?? []) {
    const dateStr = new Date(d.created_at).toISOString().slice(0, 10)
    heatmapMap.set(dateStr, {
      emotion_color: d.emotion_color ?? '#9CA3AF',
      emotion_label: d.emotion_label ?? '',
      emotion_emoji: d.emotion_emoji ?? '',
    })
  }
  const heatmapData = Array.from(heatmapMap.entries()).map(([date, v]) => ({ date, ...v }))

  return (
    <main className="min-h-screen bg-gray-50 py-10">

      {/* 좁은 영역: 헤더 / 필터 / 요약 / 빈도 차트 */}
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">감정 통계</h1>
            <p className="mt-1 text-sm text-gray-500">{rangeLabel}</p>
          </div>
          <Link
            href="/history"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            히스토리
          </Link>
        </div>

        <Suspense>
          <DateFilter from={fromStr} to={toStr} />
        </Suspense>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400 mb-1">총 일기 수</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalCount}
              <span className="text-sm font-normal text-gray-400 ml-1">개</span>
            </p>
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

        <EmotionCharts frequency={frequency} />
      </div>

      {/* 넓은 영역: 감정 잔디 */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <EmotionHeatmap data={heatmapData} />
      </div>

      {/* 좁은 영역: 최근 기록 / 버튼 */}
      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <EmotionTimeline timeline={timeline} />
        <Link
          href="/diary/new"
          className="block text-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          오늘 일기 쓰기
        </Link>
      </div>

    </main>
  )
}
