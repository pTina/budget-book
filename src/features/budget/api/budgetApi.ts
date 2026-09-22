import { adapter } from '@/shared/storage'
import type { BudgetSettings } from '@/shared/types'

export const budgetApi = {
  get: () => adapter.getBudget(),
  update: (input: Partial<BudgetSettings>) => adapter.updateBudget(input),
}
