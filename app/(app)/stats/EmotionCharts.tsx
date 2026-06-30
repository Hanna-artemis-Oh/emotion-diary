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

type FrequencyItem = {
  emotion_label: string
  emotion_color: string
  emotion_emoji: string
  count: number
}

export default function EmotionCharts({ frequency }: { frequency: FrequencyItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">감정 빈도</h2>
      <p className="text-xs text-gray-400 mb-6">어떤 감정을 가장 많이 느꼈나요?</p>
      {frequency.length === 0 ? (
        <div className="text-center py-10 text-gray-300">
          <p className="text-sm">데이터가 없습니다.</p>
        </div>
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
  )
}
