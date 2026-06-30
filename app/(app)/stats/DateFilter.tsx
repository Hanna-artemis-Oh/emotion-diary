'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PRESETS = [
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '90일', days: 90 },
  { label: '전체', days: 0 },
]

type Props = {
  from: string
  to: string
}

export default function DateFilter({ from, to }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function push(params: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => next.set(k, v))
    router.push(`/stats?${next.toString()}`)
  }

  function handlePreset(days: number) {
    if (days === 0) {
      const next = new URLSearchParams()
      router.push(`/stats?${next.toString()}`)
      return
    }
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    push({
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    })
  }

  const currentDays = (() => {
    if (!searchParams.get('from') && !searchParams.get('to')) return 30
    const f = searchParams.get('from')
    const t = searchParams.get('to')
    if (!f || !t) return null
    const diff = Math.round(
      (new Date(t).getTime() - new Date(f).getTime()) / (1000 * 60 * 60 * 24)
    )
    return PRESETS.find((p) => p.days === diff)?.days ?? null
  })()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* 프리셋 버튼 */}
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p.days)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentDays === p.days
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 직접 날짜 입력 */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => push({ from: e.target.value, to })}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <span className="text-xs text-gray-400">~</span>
        <input
          type="date"
          value={to}
          min={from}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => push({ from, to: e.target.value })}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
    </div>
  )
}
