import { describe, expect, it } from 'vitest'
import { calcMonthStats, filterMonthSpent, groupExpensesByCategory } from './stats'
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

describe('filterMonthSpent', () => {
  it('선택 월·오늘까지·예정을 제외한다', () => {
    const spent = filterMonthSpent(
      expenses,
      new Date(2026, 8, 1),
      new Date(2026, 8, 15),
    )
    expect(spent.map((e) => e.id)).toEqual(['1', '2'])
  })
})

describe('groupExpensesByCategory', () => {
  it('금액 합계 내림차순, 그룹 안은 날짜 내림차순으로 묶는다', () => {
    const groups = groupExpensesByCategory(
      [
        {
          id: 'a',
          amount: 10_000,
          title: '커피',
          date: '2026-09-10',
          categoryId: 'cat-food',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
        {
          id: 'b',
          amount: 20_000,
          title: '점심',
          date: '2026-09-12',
          categoryId: 'cat-food',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
        {
          id: 'c',
          amount: 5_000,
          title: '버스',
          date: '2026-09-11',
          categoryId: 'cat-transport',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
        {
          id: 'd',
          amount: 8_000,
          title: '기타',
          date: '2026-09-09',
          categoryId: 'unknown',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
      ],
      categories,
    )
    expect(groups.map((g) => g.name)).toEqual(['식비', '미분류', '교통'])
    expect(groups[0].total).toBe(30_000)
    expect(groups[0].items.map((e) => e.id)).toEqual(['b', 'a'])
    expect(groups[1].name).toBe('미분류')
  })

  it('고정지출 그룹은 금액과 관계없이 맨 앞에 둔다', () => {
    const groups = groupExpensesByCategory(
      [
        {
          id: 'a',
          amount: 50_000,
          title: '점심',
          date: '2026-09-12',
          categoryId: 'cat-food',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
        {
          id: 'b',
          amount: 10_000,
          title: '넷플릭스',
          date: '2026-09-10',
          categoryId: 'cat-fixed',
          paymentMethodId: null,
          isScheduled: false,
          isVirtual: false,
        },
      ],
      [
        ...categories,
        {
          id: 'cat-fixed',
          name: '고정지출',
          color: '#C9CDD4',
          createdAt: '',
          updatedAt: '',
        },
      ],
    )
    expect(groups.map((g) => g.name)).toEqual(['고정지출', '식비'])
  })
})
