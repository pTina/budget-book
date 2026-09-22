import { describe, expect, it } from 'vitest'
import { calcBudgetSummary, getBudgetAmount, setBudgetForMonth } from './budget'
import type { BudgetSettings } from '@/shared/types'

const base: BudgetSettings = {
  enabled: true,
  defaultAmount: 1_000_000,
  applyToNextMonth: true,
  monthlyAmounts: {},
}

describe('budget', () => {
  it('월별 금액이 없으면 defaultAmount를 사용한다', () => {
    expect(getBudgetAmount(base, '2026-09')).toBe(1_000_000)
  })

  it('월별 금액이 있으면 해당 값을 사용한다', () => {
    const b = { ...base, monthlyAmounts: { '2026-09': 800_000 } }
    expect(getBudgetAmount(b, '2026-09')).toBe(800_000)
  })

  it('다음 달에도 적용하면 다음 달 키에 금액을 넣는다', () => {
    const next = setBudgetForMonth(base, '2026-09', 900_000, true)
    expect(next.monthlyAmounts['2026-09']).toBe(900_000)
    expect(next.monthlyAmounts['2026-10']).toBe(900_000)
    expect(next.defaultAmount).toBe(900_000)
  })

  it('90% 이상이면 경고, 초과 시 overAmount를 계산한다', () => {
    const warn = calcBudgetSummary(base, '2026-09', 900_000)
    expect(warn.isWarning).toBe(true)
    expect(warn.isOver).toBe(false)

    const over = calcBudgetSummary(base, '2026-09', 1_200_000)
    expect(over.isOver).toBe(true)
    expect(over.overAmount).toBe(200_000)
    expect(over.remaining).toBe(0)
  })

  it('enabled=false여도 금액 값은 유지된다', () => {
    const off = { ...base, enabled: false, monthlyAmounts: { '2026-09': 500_000 } }
    expect(getBudgetAmount(off, '2026-09')).toBe(500_000)
    expect(calcBudgetSummary(off, '2026-09', 100).enabled).toBe(false)
  })
})
