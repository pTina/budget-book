import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { budgetApi } from '../api/budgetApi'
import { setBudgetForMonth } from '../utils/budget'
import { queryKeys } from '@/shared/lib/queryKeys'
import { invalidateAll } from '@/shared/lib/invalidateAll'
import { useUiStore } from '@/store/useUiStore'
import type { BudgetSettings } from '@/shared/types'

export function useBudget() {
  return useQuery({
    queryKey: queryKeys.budget,
    queryFn: () => budgetApi.get(),
  })
}

export function useBudgetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<BudgetSettings>) => budgetApi.update(input),
    onSuccess: () => invalidateAll(qc),
  })
}

export function useSaveMonthBudget() {
  const qc = useQueryClient()
  const monthKey = useUiStore((s) => s.monthKey)
  return useMutation({
    mutationFn: async (opts: {
      amount: number
      enabled: boolean
      applyToNextMonth: boolean
    }) => {
      const current = await budgetApi.get()
      const next = setBudgetForMonth(
        {
          ...current,
          enabled: opts.enabled,
          applyToNextMonth: opts.applyToNextMonth,
        },
        monthKey,
        opts.amount,
        opts.applyToNextMonth,
      )
      return budgetApi.update(next)
    },
    onSuccess: () => invalidateAll(qc),
  })
}
