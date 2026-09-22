import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { endOfMonth, parseISO, startOfMonth } from 'date-fns'
import { expenseApi, recurringApi } from '../api/expenseApi'
import { mergeDisplayExpenses, sumMonthSpent } from '../utils/recurring'
import { queryKeys } from '@/shared/lib/queryKeys'
import { invalidateAll } from '@/shared/lib/invalidateAll'
import { useUiStore } from '@/store/useUiStore'
import type {
  CreateExpenseInput,
  CreateRecurringInput,
  UpdateExpenseInput,
  UpdateRecurringInput,
} from '@/shared/storage'

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses,
    queryFn: () => expenseApi.list(),
  })
}

export function useRecurrings() {
  return useQuery({
    queryKey: queryKeys.recurrings,
    queryFn: () => recurringApi.list(),
  })
}

export function useDisplayExpenses() {
  const monthKey = useUiStore((s) => s.monthKey)
  const expenses = useExpenses()
  const recurrings = useRecurrings()

  const display = useMemo(() => {
    if (!expenses.data || !recurrings.data) return []
    const month = parseISO(`${monthKey}-01`)
    return mergeDisplayExpenses(
      expenses.data,
      recurrings.data,
      startOfMonth(month),
      endOfMonth(month),
    )
  }, [expenses.data, recurrings.data, monthKey])

  return {
    display,
    isLoading: expenses.isLoading || recurrings.isLoading,
    monthSpent: sumMonthSpent(display, monthKey),
  }
}

export function useExpenseMutations() {
  const qc = useQueryClient()
  return {
    create: useMutation({
      mutationFn: (input: CreateExpenseInput) => expenseApi.create(input),
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: (input: UpdateExpenseInput) => expenseApi.update(input),
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: (id: string) => expenseApi.remove(id),
      onSuccess: () => invalidateAll(qc),
    }),
  }
}

export function useRecurringMutations() {
  const qc = useQueryClient()
  return {
    create: useMutation({
      mutationFn: (input: CreateRecurringInput) => recurringApi.create(input),
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: (input: UpdateRecurringInput) => recurringApi.update(input),
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: (id: string) => recurringApi.remove(id),
      onSuccess: () => invalidateAll(qc),
    }),
  }
}
