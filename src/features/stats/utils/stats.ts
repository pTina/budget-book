import {
  getDate,
  getDaysInMonth,
  differenceInCalendarDays,
  startOfMonth,
  isBefore,
  isSameMonth,
} from 'date-fns'
import type { Category, DisplayExpense, PaymentMethod } from '@/shared/types'
import { formatDateKey, formatMonthKey } from '@/shared/lib/format'
import { CATEGORY_PALETTE } from '@/shared/storage/seed'

const UNSPECIFIED_COLOR = '#9CA1A9'

export type StatSlice = {
  name: string
  color: string
  amount: number
  ratio: number
}

export type CategoryStat = StatSlice & {
  categoryId: string
}

export type PaymentStat = StatSlice & {
  paymentMethodId: string
}

export type MonthStats = {
  total: number
  dailyAverage: number
  median: number
  elapsedDays: number
  ranks: CategoryStat[]
  paymentRanks: PaymentStat[]
}

/**
 * 선택 월 통계.
 * - 기준: 오늘까지의 지출 (지난 달은 월 전체)
 * - 하루 평균 = 총지출 / 경과 일수
 * - 지출 0원 카테고리 제외, 금액 내림차순
 */
export function filterMonthSpent(
  display: DisplayExpense[],
  month: Date,
  today: Date = new Date(),
): DisplayExpense[] {
  const monthKey = formatMonthKey(month)
  const todayKey = formatDateKey(today)
  const isCurrent = isSameMonth(month, today)
  const isFuture = isBefore(today, startOfMonth(month))
  const cutoff = isCurrent
    ? todayKey
    : isFuture
      ? ''
      : formatDateKey(
          new Date(month.getFullYear(), month.getMonth(), getDaysInMonth(month)),
        )

  return display.filter((e) => {
    if (!e.date.startsWith(monthKey)) return false
    if (e.isScheduled) return false
    if (!cutoff) return false
    return e.date <= cutoff
  })
}

export type CategoryDetailGroup = {
  categoryId: string
  name: string
  color: string
  total: number
  items: DisplayExpense[]
}

export function groupExpensesByCategory(
  spent: DisplayExpense[],
  categories: Category[],
): CategoryDetailGroup[] {
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const byCat = new Map<string, DisplayExpense[]>()
  for (const e of spent) {
    const list = byCat.get(e.categoryId) ?? []
    list.push(e)
    byCat.set(e.categoryId, list)
  }

  return [...byCat.entries()]
    .map(([categoryId, items]) => {
      const cat = catMap.get(categoryId)
      return {
        categoryId,
        name: cat?.name ?? '미분류',
        color: cat?.color ?? '#9CA1A9',
        total: items.reduce((s, e) => s + e.amount, 0),
        items: [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
      }
    })
    .filter((g) => g.total > 0)
    .sort((a, b) => {
      const aFixed = a.name === '고정지출'
      const bFixed = b.name === '고정지출'
      if (aFixed !== bFixed) return aFixed ? -1 : 1
      return b.total - a.total
    })
}

export function calcMonthStats(
  display: DisplayExpense[],
  categories: Category[],
  month: Date,
  today: Date = new Date(),
  paymentMethods: PaymentMethod[] = [],
): MonthStats {
  const monthKey = formatMonthKey(month)
  const isCurrent = isSameMonth(month, today)
  const isFuture = isBefore(today, startOfMonth(month))
  const spent = filterMonthSpent(display, month, today)

  const total = spent.reduce((s, e) => s + e.amount, 0)

  let elapsedDays: number
  if (isFuture) {
    elapsedDays = 0
  } else if (isCurrent) {
    elapsedDays = getDate(today)
  } else {
    elapsedDays = getDaysInMonth(month)
  }

  const dailyAverage = elapsedDays > 0 ? total / elapsedDays : 0

  const byDay = new Map<string, number>()
  for (const e of spent) {
    byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount)
  }
  const dailyTotals: number[] = []
  for (let day = 1; day <= elapsedDays; day += 1) {
    const key = `${monthKey}-${String(day).padStart(2, '0')}`
    const amount = byDay.get(key) ?? 0
    if (amount > 0) dailyTotals.push(amount)
  }
  const median = medianOf(dailyTotals)

  const byCat = new Map<string, number>()
  for (const e of spent) {
    byCat.set(e.categoryId, (byCat.get(e.categoryId) ?? 0) + e.amount)
  }

  const catMap = new Map(categories.map((c) => [c.id, c]))
  const ranks: CategoryStat[] = [...byCat.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => {
      const cat = catMap.get(categoryId)
      return {
        categoryId,
        name: cat?.name ?? '미분류',
        color: cat?.color ?? '#9CA1A9',
        amount,
        ratio: total > 0 ? amount / total : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  const byPay = new Map<string, number>()
  for (const e of spent) {
    const key = e.paymentMethodId ?? ''
    byPay.set(key, (byPay.get(key) ?? 0) + e.amount)
  }

  const methodMap = new Map(paymentMethods.map((m) => [m.id, m]))
  const methodIndex = new Map(paymentMethods.map((m, i) => [m.id, i]))
  const paymentRanks: PaymentStat[] = [...byPay.entries()]
    .filter(([, amount]) => amount > 0)
    .map(([paymentMethodId, amount]) => {
      const method = methodMap.get(paymentMethodId)
      const idx = methodIndex.get(paymentMethodId)
      return {
        paymentMethodId,
        name: method?.name ?? '미지정',
        color:
          idx === undefined
            ? UNSPECIFIED_COLOR
            : CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
        amount,
        ratio: total > 0 ? amount / total : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  return {
    total,
    dailyAverage,
    median,
    elapsedDays,
    ranks,
    paymentRanks,
  }
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2
  return sorted[mid]
}

export function daysElapsedInMonth(month: Date, today: Date = new Date()): number {
  if (!isSameMonth(month, today) && isBefore(today, startOfMonth(month))) return 0
  if (!isSameMonth(month, today)) return getDaysInMonth(month)
  return differenceInCalendarDays(today, startOfMonth(month)) + 1
}
