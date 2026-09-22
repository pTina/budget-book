import type { BudgetSettings } from '@/shared/types'
import { formatMonthKey } from '@/shared/lib/format'
import { addMonths, parseISO } from 'date-fns'

export function getBudgetAmount(
  budget: BudgetSettings,
  monthKey: string,
): number {
  if (monthKey in budget.monthlyAmounts) {
    return budget.monthlyAmounts[monthKey]
  }
  return budget.defaultAmount
}

export function setBudgetForMonth(
  budget: BudgetSettings,
  monthKey: string,
  amount: number,
  applyToNextMonth: boolean,
): BudgetSettings {
  const monthlyAmounts = { ...budget.monthlyAmounts, [monthKey]: amount }
  const next: BudgetSettings = {
    ...budget,
    defaultAmount: amount,
    applyToNextMonth,
    monthlyAmounts,
  }

  if (applyToNextMonth) {
    const nextMonth = formatMonthKey(addMonths(parseISO(`${monthKey}-01`), 1))
    next.monthlyAmounts[nextMonth] = amount
  }

  return next
}

export type BudgetSummary = {
  enabled: boolean
  budgetAmount: number
  spent: number
  remaining: number
  usageRatio: number
  isWarning: boolean
  isOver: boolean
  overAmount: number
}

export function calcBudgetSummary(
  budget: BudgetSettings,
  monthKey: string,
  spent: number,
): BudgetSummary {
  const budgetAmount = getBudgetAmount(budget, monthKey)
  const remaining = budgetAmount - spent
  const usageRatio = budgetAmount > 0 ? spent / budgetAmount : 0
  const isOver = spent > budgetAmount
  const isWarning = !isOver && usageRatio >= 0.9

  return {
    enabled: budget.enabled,
    budgetAmount,
    spent,
    remaining: Math.max(0, remaining),
    usageRatio,
    isWarning,
    isOver,
    overAmount: isOver ? spent - budgetAmount : 0,
  }
}
