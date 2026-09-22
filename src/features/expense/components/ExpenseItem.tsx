import type { DisplayExpense } from '@/shared/types'
import { formatAmount } from '@/shared/lib/format'
import { useCategories } from '@/features/category/hooks/useCategories'
import { usePaymentMethods } from '@/features/payment/hooks/usePaymentMethods'

type Props = {
  expense: DisplayExpense
  onClick: () => void
}

export function ExpenseItem({ expense, onClick }: Props) {
  const { data: categories = [] } = useCategories()
  const { data: methods = [] } = usePaymentMethods()
  const cat = categories.find((c) => c.id === expense.categoryId)
  const method = methods.find((m) => m.id === expense.paymentMethodId)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-canvas"
    >
      <span
        className="mt-0.5 w-[3px] self-stretch rounded-full"
        style={{ backgroundColor: cat?.color ?? '#9CA1A9' }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-ink">{expense.title}</span>
          {expense.recurringId ? (
            <span className="text-faint" aria-hidden="true" title="반복 지출">
              ↻
            </span>
          ) : null}
          {expense.isScheduled ? (
            <span className="rounded bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">
              예정
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-faint">
          {cat?.name ?? '미분류'}
          {method ? ` / ${method.name}` : ''}
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
        {formatAmount(expense.amount)}
      </span>
    </button>
  )
}
