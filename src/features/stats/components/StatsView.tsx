import { useMemo } from 'react'
import { useBudget } from '@/features/budget/hooks/useBudget'
import { useCategories } from '@/features/category/hooks/useCategories'
import { useDisplayExpenses } from '@/features/expense/hooks/useExpenses'
import { useUiStore } from '@/store/useUiStore'
import { calcMonthStats } from '../utils/stats'
import { calcBudgetSummary } from '@/features/budget/utils/budget'
import { formatAmount, parseISO } from '@/shared/lib/format'
import { useHorizontalSwipe } from '@/shared/lib/useHorizontalSwipe'
import { DonutChart } from './DonutChart'

export function StatsView() {
  const monthKey = useUiStore((s) => s.monthKey)
  const shiftMonth = useUiStore((s) => s.shiftMonth)
  const { display } = useDisplayExpenses()
  const { data: categories = [] } = useCategories()
  const { data: budget } = useBudget()
  const { monthSpent } = useDisplayExpenses()
  const swipe = useHorizontalSwipe({
    onSwipeLeft: () => shiftMonth(1),
    onSwipeRight: () => shiftMonth(-1),
  })

  const month = useMemo(() => parseISO(`${monthKey}-01`), [monthKey])
  const stats = useMemo(
    () => calcMonthStats(display, categories, month),
    [display, categories, month],
  )

  const budgetSummary =
    budget?.enabled ? calcBudgetSummary(budget, monthKey, monthSpent) : null

  const monthLabel = `${Number(monthKey.slice(5, 7))}월`

  if (stats.total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="m-0 text-center text-sm text-muted leading-relaxed">
          이 달에는 아직 지출이 없어요.
          <br />
          캘린더에서 지출을 기록해 보세요.
        </p>
      </div>
    )
  }

  return (
    <div
      className="mx-auto w-full max-w-[900px] flex-1 overflow-y-auto p-4 touch-pan-y md:p-6"
      {...swipe}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
        <DonutChart total={stats.total} ranks={stats.ranks} size={168} />

        <div className="flex-1 grid grid-cols-2 gap-4">
          <StatCard label={`${monthLabel} 총 지출`} value={formatAmount(stats.total)} />
          <StatCard
            label="가장 많이 쓴 곳"
            value={stats.topCategory?.name ?? '-'}
          />
          <StatCard
            label="하루 평균"
            value={formatAmount(Math.round(stats.dailyAverage))}
          />
          {budgetSummary ? (
            <StatCard
              label="남은 예산"
              value={
                budgetSummary.isOver
                  ? `초과 ${formatAmount(budgetSummary.overAmount)}`
                  : formatAmount(budgetSummary.remaining)
              }
            />
          ) : null}
        </div>
      </div>

      <hr className="my-6 border-0 border-t border-line" />

      <h2 className="m-0 mb-3 text-sm font-semibold text-ink">카테고리별 지출</h2>
      <ul className="m-0 list-none space-y-3 p-0">
        {stats.ranks.map((r) => (
          <li key={r.categoryId} className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: r.color }}
              aria-hidden="true"
            />
            <span className="w-14 shrink-0 text-sm font-medium text-ink">{r.name}</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(r.ratio * 100)}%`,
                  backgroundColor: r.color,
                }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-sm tabular-nums text-ink">
              {formatAmount(r.amount)}
            </span>
            <span className="hidden w-10 shrink-0 text-right text-xs tabular-nums text-muted md:inline">
              {Math.round(r.ratio * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="m-0 text-xs text-muted">{label}</p>
      <p className="m-0 mt-1 text-lg font-semibold text-ink">{value}</p>
    </div>
  )
}
