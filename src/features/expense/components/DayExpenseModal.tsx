import { useMemo } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { useDisplayExpenses } from '../hooks/useExpenses'
import { useUiStore } from '@/store/useUiStore'
import { formatAmount, formatDayHeading } from '@/shared/lib/format'
import { getDayExpenses, sumDayAmount } from '../utils/recurring'
import { ExpenseItem } from './ExpenseItem'

export function DayExpenseModal() {
  const open = useUiStore((s) => s.dayExpenseOpen)
  const selectedDate = useUiStore((s) => s.selectedDate)
  const closeDayExpense = useUiStore((s) => s.closeDayExpense)
  const openExpenseForm = useUiStore((s) => s.openExpenseForm)
  const { display } = useDisplayExpenses()

  const items = useMemo(
    () => getDayExpenses(display, selectedDate),
    [display, selectedDate],
  )
  const total = sumDayAmount(display, selectedDate)

  return (
    <Modal
      open={open}
      title={`${formatDayHeading(selectedDate)}`}
      onClose={closeDayExpense}
      footer={
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white"
          onClick={() => {
            closeDayExpense()
            openExpenseForm({ date: selectedDate })
          }}
        >
          지출 추가
        </button>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">하루 합계</span>
        <span className="text-sm font-semibold tabular-nums">{formatAmount(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted leading-relaxed">
          이 날은 지출이 없어요.
          <br />
          지출 추가로 기록을 남겨보세요.
        </p>
      ) : (
        <ul className="m-0 max-h-[50vh] list-none overflow-y-auto p-0">
          {items.map((e) => (
            <li key={e.id}>
              <ExpenseItem
                expense={e}
                onClick={() => {
                  closeDayExpense()
                  openExpenseForm({ id: e.id })
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
