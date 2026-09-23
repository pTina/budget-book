import { useMemo } from 'react'
import { useBudget } from '@/features/budget/hooks/useBudget'
import { useCategories } from '@/features/category/hooks/useCategories'
import { usePaymentMethods } from '@/features/payment/hooks/usePaymentMethods'
import { useDisplayExpenses } from '@/features/expense/hooks/useExpenses'
import { useUiStore } from '@/store/useUiStore'
import { calcMonthStats, type StatSlice } from '../utils/stats'
import { calcBudgetSummary } from '@/features/budget/utils/budget'
import { formatAmount, parseISO } from '@/shared/lib/format'
import { useHorizontalSwipe } from '@/shared/lib/useHorizontalSwipe'
import { DonutChart } from './DonutChart'

export function StatsView() {
  const monthKey = useUiStore((s) => s.monthKey)
  const shiftMonth = useUiStore((s) => s.shiftMonth)
  const { display } = useDisplayExpenses()
  const { data: categories = [] } = useCategories()
  const { data: methods = [] } = usePaymentMethods()
  const { data: budget } = useBudget()
  const { monthSpent } = useDisplayExpenses()
  const swipe = useHorizontalSwipe({
    onSwipeLeft: () => shiftMonth(1),
    onSwipeRight: () => shiftMonth(-1),
  })

  const month = useMemo(() => parseISO(`${monthKey}-01`), [monthKey])
  const stats = useMemo(
    () => calcMonthStats(display, categories, month, new Date(), methods),
    [display, categories, month, methods],
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
        <DonutChart
          total={stats.total}
          ranks={stats.ranks}
          size={168}
          ariaLabel={`카테고리별 지출 도넛 차트, 총 ${stats.total.toLocaleString('ko-KR')}원`}
        />

        <div className="flex-1 grid grid-cols-2 gap-4">
          <StatCard label={`${monthLabel} 총 지출`} value={formatAmount(stats.total)} />
          <StatCard
            label="하루 평균"
            value={formatAmount(Math.round(stats.dailyAverage))}
          />
          <StatCard
            label="중앙값"
            value={formatAmount(Math.round(stats.median))}
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
      <RankList items={stats.ranks} itemKey={(r) => r.categoryId} />

      {stats.paymentRanks.length > 0 ? (
        <>
          <hr className="my-6 border-0 border-t border-line" />
          <h2 className="m-0 mb-4 text-sm font-semibold text-ink">결제수단별 지출</h2>
          <div className="mb-4">
            <DonutChart
              total={stats.total}
              ranks={stats.paymentRanks}
              size={148}
              ariaLabel={`결제수단별 지출 도넛 차트, 총 ${stats.total.toLocaleString('ko-KR')}원`}
            />
          </div>
          <RankList
            items={stats.paymentRanks}
            itemKey={(r) => r.paymentMethodId || 'unspecified'}
          />
        </>
      ) : null}
    </div>
  )
}

function RankList<T extends StatSlice>({
  items,
  itemKey,
}: {
  items: T[]
  itemKey: (item: T) => string
}) {
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {items.map((r) => (
        <li key={itemKey(r)} className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: r.color }}
            aria-hidden="true"
          />
          <span className="w-16 shrink-0 truncate text-sm font-medium text-ink">{r.name}</span>
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
