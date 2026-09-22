import { parseISO } from 'date-fns'
import { useUiStore } from '@/store/useUiStore'
import type { DisplayExpense } from '@/shared/types'
import { buildThisOnlyDelete, createSkipMarker } from '../utils/recurring'
import { useExpenseMutations, useExpenses, useRecurringMutations, useRecurrings } from './useExpenses'

export function useDeleteExpense() {
  const askConfirm = useUiStore((s) => s.askConfirm)
  const askScope = useUiStore((s) => s.askScope)
  const { data: recurrings = [] } = useRecurrings()
  const { data: expenses = [] } = useExpenses()
  const expenseMut = useExpenseMutations()
  const recurringMut = useRecurringMutations()

  const deleteExpense = async (target: DisplayExpense): Promise<boolean> => {
    const ok = await askConfirm({
      title: '이 지출을 삭제할까요?',
      description: target.recurringId
        ? '반복 지출인 경우 삭제 범위를 이어서 선택합니다.'
        : undefined,
    })
    if (!ok) return false

    if (target.recurringId) {
      const scope = await askScope()
      if (!scope) return false

      if (scope === 'this') {
        const result = buildThisOnlyDelete(target)
        if (result.type === 'skip' && result.expense) {
          await expenseMut.create.mutateAsync(result.expense)
        } else if (result.type === 'skip' && result.id) {
          await expenseMut.update.mutateAsync({
            id: result.id,
            isSkipped: true,
            isException: true,
          })
        } else if (result.type === 'delete' && result.id) {
          await expenseMut.remove.mutateAsync(result.id)
        }
      } else {
        const recurring = recurrings.find((r) => r.id === target.recurringId)
        if (!recurring) return false
        const from = parseISO(target.date)
        const dayBefore = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1)
        const endDate = `${dayBefore.getFullYear()}-${String(dayBefore.getMonth() + 1).padStart(2, '0')}-${String(dayBefore.getDate()).padStart(2, '0')}`

        if (recurring.startDate >= target.date) {
          await recurringMut.remove.mutateAsync(recurring.id)
        } else {
          await recurringMut.update.mutateAsync({ id: recurring.id, endDate })
        }

        for (const e of expenses) {
          if (e.recurringId === recurring.id && e.date >= target.date) {
            await expenseMut.remove.mutateAsync(e.id)
          }
        }
      }
    } else if (target.sourceExpenseId) {
      await expenseMut.remove.mutateAsync(target.sourceExpenseId)
    } else if (target.isVirtual) {
      await expenseMut.create.mutateAsync(createSkipMarker(target))
    }

    return true
  }

  return { deleteExpense }
}
