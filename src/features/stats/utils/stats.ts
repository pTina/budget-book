import {
  getDate,
  getDaysInMonth,
  differenceInCalendarDays,
  startOfMonth,
  isBefore,
  isSameMonth,
} from 'date-fns'
import type { Category, DisplayExpense } from '@/shared/types'
import { formatDateKey, formatMonthKey } from '@/shared/lib/format'

export type CategoryStat = {
  categoryId: string
  name: string
  color: string
  amount: number
  ratio: number
}

export type MonthStats = {
  total: number
  dailyAverage: number
  elapsedDays: number
  topCategory: CategoryStat | null
  ranks: CategoryStat[]
}

/**
 * 선택 월 통계.
 * - 기준: 오늘까지의 지출 (지난 달은 월 전체)
 * - 하루 평균 = 총지출 / 경과 일수
 * - 지출 0원 카테고리 제외, 금액 내림차순
 */
export function calcMonthStats(
  display: DisplayExpense[],
  categories: Category[],
  month: Date,
  today: Date = new Date(),
): MonthStats {
  const monthKey = formatMonthKey(month)
  const todayKey = formatDateKey(today)
  const isCurrent = isSameMonth(month, today)
  const isFuture = isBefore(today, startOfMonth(month))

  const cutoff = isCurrent
    ? todayKey
    : isFuture
      ? '' // 미래 월: 지출 없음
      : formatDateKey(
          new Date(month.getFullYear(), month.getMonth(), getDaysInMonth(month)),
        )

  const spent = display.filter((e) => {
    if (!e.date.startsWith(monthKey)) return false
    if (e.isScheduled) return false
    if (!cutoff) return false
    return e.date <= cutoff
  })

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

  return {
    total,
    dailyAverage,
    elapsedDays,
    topCategory: ranks[0] ?? null,
    ranks,
  }
}

export function daysElapsedInMonth(month: Date, today: Date = new Date()): number {
  if (!isSameMonth(month, today) && isBefore(today, startOfMonth(month))) return 0
  if (!isSameMonth(month, today)) return getDaysInMonth(month)
  return differenceInCalendarDays(today, startOfMonth(month)) + 1
}
