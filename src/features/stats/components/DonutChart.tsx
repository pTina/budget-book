import type { CategoryStat } from '../utils/stats'

type Props = {
  total: number
  ranks: CategoryStat[]
  size?: number
}

export function DonutChart({ total, ranks, size = 160 }: Props) {
  if (total <= 0 || ranks.length === 0) {
    return (
      <div
        className="mx-auto rounded-full bg-line"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    )
  }

  let cursor = 0
  const segments = ranks.map((r) => {
    const start = cursor
    const deg = r.ratio * 360
    cursor += deg
    return `${r.color} ${start}deg ${cursor}deg`
  })

  const gradient = `conic-gradient(${segments.join(', ')})`

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`카테고리별 지출 도넛 차트, 총 ${total.toLocaleString('ko-KR')}원`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: gradient }}
      />
      <div className="absolute inset-[28%] rounded-full bg-paper" />
    </div>
  )
}
