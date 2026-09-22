type Props = {
  ratio: number
  warning?: boolean
  over?: boolean
}

export function ProgressBar({ ratio, warning, over }: Props) {
  const pct = Math.min(100, Math.round(ratio * 100))
  const color = over ? 'bg-danger' : warning ? 'bg-warning' : 'bg-accent'

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.max(pct, over ? 100 : pct)}%` }}
      />
    </div>
  )
}
