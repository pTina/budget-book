import { describe, expect, it } from 'vitest'
import { calcMonthStats } from './stats'
import type { Category, DisplayExpense, PaymentMethod } from '@/shared/types'
import { CATEGORY_PALETTE } from '@/shared/storage/seed'

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
    expect(stats.median).toBe(235_000)
    expect(stats.ranks).toHaveLength(2)
    expect(stats.ranks[0].ratio).toBeCloseTo(320_000 / 470_000)
    expect(stats.paymentRanks).toHaveLength(1)
    expect(stats.paymentRanks[0].name).toBe('미지정')
  })

  it('결제수단별로 합산하고 등록 순 팔레트 색을 쓴다', () => {
    const methods: PaymentMethod[] = [
      { id: 'pm-cash', name: '현금', createdAt: '', updatedAt: '' },
      { id: 'pm-card', name: '카드', createdAt: '', updatedAt: '' },
    ]
    const stats = calcMonthStats(
      [
        {
          id: '1',
          amount: 200_000,
          title: '현금',
          date: '2026-09-10',
          categoryId: 'cat-food',
          paymentMethodId: 'pm-cash',
          isScheduled: false,
          isVirtual: false,
        },
        {
          id: '2',
          amount: 80_000,
          title: '카드',
          date: '2026-09-12',
          categoryId: 'cat-transport',
          paymentMethodId: 'pm-card',
          isScheduled: false,
          isVirtual: false,
        },
        {
          id: '3',
          amount: 20_000,
          title: '없음',
          date: '2026-09-13',
          categoryId: 'cat-food',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
      ],
      categories,
      new Date(2026, 8, 1),
      new Date(2026, 8, 15),
      methods,
    )
    expect(stats.paymentRanks).toHaveLength(3)
    expect(stats.paymentRanks[0]).toMatchObject({
      name: '현금',
      amount: 200_000,
      color: CATEGORY_PALETTE[0],
    })
    expect(stats.paymentRanks[1].name).toBe('카드')
    expect(stats.paymentRanks[2].name).toBe('미지정')
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
