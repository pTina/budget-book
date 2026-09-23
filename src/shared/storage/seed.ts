import type { AppData, Category, PaymentMethod } from '@/shared/types'

export const UNCATEGORIZED_ID = 'cat-uncategorized'

export const CATEGORY_PALETTE = [
  '#C0E8DD',
  '#A3C6EB',
  '#F3D1C8',
  '#E4D4F0',
  '#F7E2B8',
  '#D7E4C0',
  '#F2CBD8',
  '#D2D8EA',
  '#E8A3A3',
  '#E07C7C',
  '#C9CDD4',
] as const

const now = () => new Date().toISOString()

export function createSeedData(): AppData {
  const ts = now()

  const categories: Category[] = [
    {
      id: UNCATEGORIZED_ID,
      name: '미분류',
      color: '#9CA1A9',
      isUncategorized: true,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'cat-food',
      name: '식비',
      color: '#E8A3A3',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'cat-transport',
      name: '교통',
      color: '#A3C6EB',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'cat-living',
      name: '생활',
      color: '#C0E8DD',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'cat-culture',
      name: '문화',
      color: '#E4D4F0',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'cat-shopping',
      name: '쇼핑',
      color: '#F7E2B8',
      createdAt: ts,
      updatedAt: ts,
    },
  ]

  const paymentMethods: PaymentMethod[] = [
    { id: 'pm-shinhan', name: '신한카드', createdAt: ts, updatedAt: ts },
    { id: 'pm-cash', name: '현금', createdAt: ts, updatedAt: ts },
  ]

  return {
    version: 1,
    categories,
    paymentMethods,
    expenses: [],
    recurrings: [],
    budget: {
      enabled: true,
      defaultAmount: 1_000_000,
      applyToNextMonth: true,
      monthlyAmounts: {},
    },
  }
}
