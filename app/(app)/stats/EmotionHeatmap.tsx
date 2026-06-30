'use client'

export type HeatmapDay = {
  date: string        // YYYY-MM-DD
  emotion_color: string
  emotion_label: string
  emotion_emoji: string
}

const CELL = 13  // px
const GAP = 2    // px
const STEP = CELL + GAP

const KO_MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const KO_DAYS   = ['일','월','화','수','목','금','토']

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function EmotionHeatmap({ data }: { data: HeatmapDay[] }) {
  const dateMap = new Map(data.map((d) => [d.date, d]))

  // 오늘 기준 52주 전 일요일로 시작
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay()) // 직전 일요일

  // 주(column) 배열 생성
  const weeks: (Date | null)[][] = []
  const cur = new Date(start)
  while (cur <= today) {
    const week: (Date | null)[] = []
    for (let d = 0; d < 7; d++) {
      week.push(cur <= today ? new Date(cur) : null)
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }

  // 월 라벨: 각 월의 첫 번째 주 인덱스 계산
  const monthLabels: { label: string; col: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, col) => {
    const first = week.find((d) => d !== null)
    if (first && first.getMonth() !== lastMonth) {
      monthLabels.push({ label: KO_MONTHS[first.getMonth()], col })
      lastMonth = first.getMonth()
    }
  })

  const gridW = weeks.length * STEP
  const gridH = 7 * STEP

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">감정 잔디</h2>
      <p className="text-xs text-gray-400 mb-4">최근 1년간 일기를 쓴 날의 감정 색상</p>

      <div className="overflow-x-auto pb-1">
        {/* 월 라벨 + 그리드를 SVG로 렌더링 */}
        <svg
          width={gridW + 24}
          height={gridH + 20}
          style={{ display: 'block' }}
        >
          {/* 요일 라벨 (월/수/금만 표시) */}
          {[1, 3, 5].map((dow) => (
            <text
              key={dow}
              x={16}
              y={20 + dow * STEP + CELL / 2 + 3}
              fontSize={9}
              fill="#9CA3AF"
              textAnchor="end"
            >
              {KO_DAYS[dow]}
            </text>
          ))}

          <g transform="translate(20, 0)">
            {/* 월 라벨 */}
            {monthLabels.map(({ label, col }) => (
              <text
                key={col}
                x={col * STEP}
                y={12}
                fontSize={10}
                fill="#6B7280"
              >
                {label}
              </text>
            ))}

            {/* 잔디 셀 */}
            <g transform="translate(0, 18)">
              {weeks.map((week, col) =>
                week.map((day, row) => {
                  if (!day) return null
                  const dateStr = toDateStr(day)
                  const entry = dateMap.get(dateStr)
                  return (
                    <rect
                      key={`${col}-${row}`}
                      x={col * STEP}
                      y={row * STEP}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={entry ? entry.emotion_color : '#EBEDF0'}
                      opacity={entry ? 1 : 0.5}
                    >
                      <title>
                        {entry
                          ? `${dateStr}  ${entry.emotion_emoji} ${entry.emotion_label}`
                          : dateStr}
                      </title>
                    </rect>
                  )
                })
              )}
            </g>
          </g>
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-xs text-gray-400 mr-1">일기 없음</span>
        <rect
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            backgroundColor: '#EBEDF0',
            borderRadius: 2,
            opacity: 0.5,
          }}
        />
        <span className="text-xs text-gray-400 ml-1 mr-1">→ 감정 색상</span>
        {data.slice(0, 5).map((d, i) => (
          <span
            key={i}
            title={d.emotion_label}
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              backgroundColor: d.emotion_color,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}
