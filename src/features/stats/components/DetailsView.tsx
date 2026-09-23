import { useMemo } from 'react'
import { useCategories } from '@/features/category/hooks/useCategories'
import { ExpenseItem } from '@/features/expense/components/ExpenseItem'
import { useDisplayExpenses } from '@/features/expense/hooks/useExpenses'
import { formatAmount, parseISO } from '@/shared/lib/format'
import { useHorizontalSwipe } from '@/shared/lib/useHorizontalSwipe'
import { useUiStore } from '@/store/useUiStore'
import { filterMonthEntries, groupMonthDetails } from '../utils/stats'

export function DetailsView() {
  const monthKey = useUiStore((s) => s.monthKey)
  const shiftMonth = useUiStore((s) => s.shiftMonth)
  const openExpenseForm = useUiStore((s) => s.openExpenseForm)
  const { display } = useDisplayExpenses()
  const { data: categories = [] } = useCategories()
  const swipe = useHorizontalSwipe({
    onSwipeLeft: () => shiftMonth(1),
    onSwipeRight: () => shiftMonth(-1),
  })

  const month = useMemo(() => parseISO(`${monthKey}-01`), [monthKey])
  const groups = useMemo(() => {
    const entries = filterMonthEntries(display, month)
    return groupMonthDetails(entries, categories)
  }, [display, month, categories])

  if (groups.length === 0) {
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
      {groups.map((group) => (
        <section key={group.categoryId || 'unspecified'} className="mb-6 last:mb-0">
          <header className="mb-1 flex items-center gap-2 px-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: group.color }}
              aria-hidden="true"
            />
            <h2 className="m-0 min-w-0 flex-1 truncate text-sm font-semibold text-ink">
              {group.name}
            </h2>
            <p className="m-0 shrink-0 text-sm font-semibold tabular-nums text-ink">
              {formatAmount(group.total)}
            </p>
          </header>
          <ul className="m-0 list-none p-0">
            {group.items.map((expense) => (
              <li key={expense.id}>
                <ExpenseItem
                  expense={expense}
                  onClick={() => openExpenseForm({ id: expense.id })}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
