import { describe, expect, it } from 'vitest'
import { calcMonthStats } from './stats'
import type { Category, DisplayExpense } from '@/shared/types'

const categories: Category[] = [
  {
    id: 'cat-food',
    name: '식비',
    color: '#E57373',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'cat-transport',
    name: '교통',
    color: '#64B5F6',
    createdAt: '',
    updatedAt: '',
  },
]

const expenses: DisplayExpense[] = [
  {
    id: '1',
    amount: 320_000,
    title: '식비합',
    date: '2026-09-10',
    categoryId: 'cat-food',
    paymentMethodId: null,
    isScheduled: false,
    isVirtual: false,
  },
  {
    id: '2',
    amount: 150_000,
    title: '교통합',
    date: '2026-09-12',
    categoryId: 'cat-transport',
    paymentMethodId: null,
    isScheduled: false,
    isVirtual: false,
  },
  {
    id: '3',
    amount: 50_000,
    title: '미래',
    date: '2026-09-25',
    categoryId: 'cat-food',
    paymentMethodId: null,
    isScheduled: true,
    isVirtual: true,
  },
]

describe('calcMonthStats', () => {
  it('오늘까지의 지출만 합산하고 예정은 제외한다', () => {
    const stats = calcMonthStats(
      expenses,
      categories,
      new Date(2026, 8, 1),
      new Date(2026, 8, 15),
    )
    expect(stats.total).toBe(470_000)
    expect(stats.elapsedDays).toBe(15)
    expect(stats.dailyAverage).toBeCloseTo(470_000 / 15)
    expect(stats.topCategory?.name).toBe('식비')
    expect(stats.ranks).toHaveLength(2)
    expect(stats.ranks[0].ratio).toBeCloseTo(320_000 / 470_000)
  })

  it('지난 달은 월 전체와 해당 월 일수를 사용한다', () => {
    const stats = calcMonthStats(
      [
        {
          id: '1',
          amount: 100_000,
          title: 'a',
          date: '2026-08-31',
          categoryId: 'cat-food',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
      ],
      categories,
      new Date(2026, 7, 1),
      new Date(2026, 8, 15),
    )
    expect(stats.total).toBe(100_000)
    expect(stats.elapsedDays).toBe(31)
  })
})
