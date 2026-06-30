'use client'

type TimelineItem = {
  date: string
  emotion_label: string
  emotion_color: string
  emotion_emoji: string
}

export default function EmotionTimeline({ timeline }: { timeline: TimelineItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">최근 기록</h2>
      <p className="text-xs text-gray-400 mb-6">날짜별 감정 흐름</p>
      {timeline.length === 0 ? (
        <div className="text-center py-10 text-gray-300">
          <p className="text-sm">데이터가 없습니다.</p>
        </div>
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
  )
}
