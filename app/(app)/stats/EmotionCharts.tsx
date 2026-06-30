'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import EmotionHeatmap, { type HeatmapDay } from './EmotionHeatmap'

type FrequencyItem = {
  emotion_label: string
  emotion_color: string
  emotion_emoji: string
  count: number
}

type TimelineItem = {
  date: string
  emotion_label: string
  emotion_color: string
  emotion_emoji: string
}

type Props = {
  frequency: FrequencyItem[]
  timeline: TimelineItem[]
  heatmapData: HeatmapDay[]
}

export default function EmotionCharts({ frequency, timeline, heatmapData }: Props) {
  return (
    <div className="space-y-8">
      {/* 감정 빈도 바 차트 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">감정 빈도</h2>
        <p className="text-xs text-gray-400 mb-6">어떤 감정을 가장 많이 느꼈나요?</p>
        {frequency.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={frequency} barCategoryGap="30%">
              <XAxis
                dataKey="emotion_label"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(label, i) => `${frequency[i]?.emotion_emoji ?? ''} ${label}`}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                formatter={(value) => [`${Number(value)}회`, '횟수']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: 12 }}
                cursor={{ fill: '#F9FAFB' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {frequency.map((item, i) => (
                  <Cell key={i} fill={item.emotion_color ?? '#9CA3AF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 감정 잔디 */}
      <EmotionHeatmap data={heatmapData} />

      {/* 최근 기록 타임라인 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">최근 기록</h2>
        <p className="text-xs text-gray-400 mb-6">날짜별 감정 흐름</p>
        {timeline.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {timeline.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 flex-shrink-0">{item.date}</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.emotion_color ?? '#9CA3AF' }}
                  />
                  <span className="text-sm text-gray-700">
                    {item.emotion_emoji} {item.emotion_label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-10 text-gray-300">
      <p className="text-sm">데이터가 없습니다.</p>
    </div>
  )
}
