import { describe, expect, it } from 'vitest'
import { expandRecurringDates, mergeDisplayExpenses } from './recurring'
import { resolveDayOfMonth } from '@/shared/lib/format'
import type { Expense, Recurring } from '@/shared/types'

const baseRecurring = (over: Partial<Recurring> = {}): Recurring => ({
  id: 'rec-1',
  title: '넷플릭스',
  amount: 17_000,
  categoryId: 'cat-culture',
  paymentMethodId: 'pm-1',
  frequency: 'monthly',
  dayOfMonth: 21,
  startDate: '2026-01-21',
  endDate: null,
  createdAt: '',
  updatedAt: '',
  ...over,
})

describe('resolveDayOfMonth', () => {
  it('31일 규칙: 2월에는 말일로 보정한다', () => {
    expect(resolveDayOfMonth(2026, 1, 31)).toBe(28) // Feb 2026
    expect(resolveDayOfMonth(2024, 1, 31)).toBe(29) // leap
    expect(resolveDayOfMonth(2026, 3, 31)).toBe(30) // April
    expect(resolveDayOfMonth(2026, 0, 31)).toBe(31) // January
  })
})

describe('expandRecurringDates', () => {
  it('월 범위 내 결제일을 전개한다', () => {
    const dates = expandRecurringDates(
      baseRecurring(),
      new Date(2026, 8, 1),
      new Date(2026, 8, 30),
    )
    expect(dates).toEqual(['2026-09-21'])
  })

  it('짧은 달 31일 결제일을 말일로 표시한다', () => {
    const dates = expandRecurringDates(
      baseRecurring({ dayOfMonth: 31, startDate: '2026-01-31' }),
      new Date(2026, 1, 1),
      new Date(2026, 1, 28),
    )
    expect(dates).toEqual(['2026-02-28'])
  })
})

describe('mergeDisplayExpenses', () => {
  it('오늘 이후 회차는 예정으로 표시한다', () => {
    const today = new Date(2026, 8, 15)
    const list = mergeDisplayExpenses(
      [],
      [baseRecurring()],
      new Date(2026, 8, 1),
      new Date(2026, 8, 30),
      today,
    )
    expect(list).toHaveLength(1)
    expect(list[0].isScheduled).toBe(true)
    expect(list[0].isVirtual).toBe(true)
  })

  it('스킵된 회차는 목록에서 제외한다', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        amount: 17_000,
        title: '넷플릭스',
        date: '2026-09-21',
        categoryId: 'cat-culture',
        paymentMethodId: 'pm-1',
        recurringId: 'rec-1',
        isException: true,
        isSkipped: true,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const list = mergeDisplayExpenses(
      expenses,
      [baseRecurring()],
      new Date(2026, 8, 1),
      new Date(2026, 8, 30),
      new Date(2026, 8, 30),
    )
    expect(list).toHaveLength(0)
  })

  it('예외 실지출이 있으면 가상 회차를 대체한다', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        amount: 20_000,
        title: '넷플릭스(할인)',
        date: '2026-09-21',
        categoryId: 'cat-culture',
        paymentMethodId: 'pm-1',
        recurringId: 'rec-1',
        isException: true,
        createdAt: '',
        updatedAt: '',
      },
    ]
    const list = mergeDisplayExpenses(
      expenses,
      [baseRecurring()],
      new Date(2026, 8, 1),
      new Date(2026, 8, 30),
      new Date(2026, 8, 30),
    )
    expect(list).toHaveLength(1)
    expect(list[0].amount).toBe(20_000)
    expect(list[0].isVirtual).toBe(false)
  })
})
