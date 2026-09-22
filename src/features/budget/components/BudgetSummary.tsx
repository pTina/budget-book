import { calcBudgetSummary } from '../utils/budget'
import { formatAmount } from '@/shared/lib/format'
import { useBudget } from '../hooks/useBudget'
import { useDisplayExpenses } from '@/features/expense/hooks/useExpenses'
import { useUiStore } from '@/store/useUiStore'
import { ProgressBar } from '@/shared/ui/ProgressBar'

export function BudgetSummary({ compact = false }: { compact?: boolean }) {
  const monthKey = useUiStore((s) => s.monthKey)
  const openSettings = useUiStore((s) => s.openSettings)
  const { data: budget } = useBudget()
  const { monthSpent } = useDisplayExpenses()

  if (!budget?.enabled) return null

  const summary = calcBudgetSummary(budget, monthKey, monthSpent)
  const monthLabel = `${Number(monthKey.slice(5, 7))}월 예산`
  const pct = Math.round(summary.usageRatio * 100)

  return (
    <section
      className={`rounded-2xl border border-line bg-paper ${compact ? 'p-3' : 'p-4'}`}
      aria-label="월 예산 요약"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="m-0 text-sm font-semibold text-ink">{monthLabel}</h2>
        <button
          type="button"
          className="text-xs font-medium text-muted hover:text-ink"
          onClick={() => openSettings('budget')}
        >
          예산 수정
        </button>
      </div>

      <p className="m-0 mb-2 text-sm tabular-nums text-ink">
        <span className="font-semibold">{formatAmount(summary.spent)}</span>
        <span className="text-faint"> / {formatAmount(summary.budgetAmount)}</span>
      </p>

      <ProgressBar
        ratio={summary.usageRatio}
        warning={summary.isWarning}
        over={summary.isOver}
      />

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span
          className={
            summary.isOver
              ? 'font-medium text-danger'
              : summary.isWarning
                ? 'font-medium text-warning'
                : 'text-muted'
          }
        >
          {summary.isOver
            ? `초과 ${formatAmount(summary.overAmount)}`
            : `${pct}% 사용`}
        </span>
        {!summary.isOver ? (
          <span className="text-muted">남은 예산 {formatAmount(summary.remaining)}</span>
        ) : null}
      </div>
    </section>
  )
}
