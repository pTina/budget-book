import { useMemo } from 'react'
import { useDisplayExpenses } from '../hooks/useExpenses'
import { useUiStore } from '@/store/useUiStore'
import { formatAmount, formatDayHeading } from '@/shared/lib/format'
import { getDayExpenses, sumDayAmount } from '../utils/recurring'
import { ExpenseItem } from './ExpenseItem'
import { BudgetSummary } from '@/features/budget/components/BudgetSummary'

export function ExpensePanel() {
  const selectedDate = useUiStore((s) => s.selectedDate)
  const openExpenseForm = useUiStore((s) => s.openExpenseForm)
  const { display } = useDisplayExpenses()

  const items = useMemo(
    () => getDayExpenses(display, selectedDate),
    [display, selectedDate],
  )
  const total = sumDayAmount(display, selectedDate)

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-l border-line bg-paper">
      <div className="border-b border-line p-4">
        <BudgetSummary />
      </div>

      <div className="flex items-baseline justify-between gap-2 px-4 pt-4">
        <h2 className="m-0 text-sm font-semibold text-ink">
          {formatDayHeading(selectedDate)}
        </h2>
        <p className="m-0 text-sm font-semibold tabular-nums text-ink">
          {formatAmount(total)}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {items.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted leading-relaxed">
            이 날은 지출이 없어요.
            <br />
            날짜를 더블클릭해 기록을 남겨보세요.
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {items.map((e) => (
              <li key={e.id}>
                <ExpenseItem
                  expense={e}
                  onClick={() => openExpenseForm({ id: e.id })}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
