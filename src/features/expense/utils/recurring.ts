import {
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  isBefore,
  isAfter,
  isEqual,
  min as dfMin,
  max as dfMax,
  differenceInCalendarDays,
  getDaysInMonth,
} from 'date-fns'
import type {
  DisplayExpense,
  Expense,
  Recurring,
} from '@/shared/types'
import { createId } from '@/shared/lib/id'
import { formatDateKey, resolveDayOfMonth } from '@/shared/lib/format'

function clampDate(date: Date, start: Date, end: Date): Date | null {
  if (isAfter(date, end) || isBefore(date, start)) return null
  return date
}

/** 반복 규칙을 기간 내 결제일 목록으로 전개 */
export function expandRecurringDates(
  recurring: Recurring,
  rangeStart: Date,
  rangeEnd: Date,
): string[] {
  const start = parseISO(recurring.startDate)
  const hardEnd = recurring.endDate ? parseISO(recurring.endDate) : null

  const from = dfMax([startOfMonth(rangeStart), startOfMonth(start)])
  const to = hardEnd
    ? dfMin([endOfMonth(rangeEnd), endOfMonth(hardEnd)])
    : endOfMonth(rangeEnd)

  if (isAfter(from, to)) return []

  const dates: string[] = []
  let cursor = startOfMonth(from)

  while (!isAfter(cursor, to)) {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const day = resolveDayOfMonth(year, month, recurring.dayOfMonth)
    const occurrence = new Date(year, month, day)

    const withinRecurring =
      !isBefore(occurrence, start) &&
      (!hardEnd || !isAfter(occurrence, hardEnd))

    const withinRange =
      !isBefore(occurrence, rangeStart) && !isAfter(occurrence, rangeEnd)

    if (withinRecurring && withinRange) {
      dates.push(formatDateKey(occurrence))
    }

    cursor = addMonths(cursor, 1)
  }

  return dates
}

function virtualId(recurringId: string, date: string): string {
  return `virtual-${recurringId}-${date}`
}

/**
 * 실지출 + 반복 전개를 DisplayExpense로 병합.
 * - 같은 날짜·recurringId의 실지출(예외/스킵 포함)이 있으면 가상 회차 대체
 * - isSkipped 실지출은 목록에서 제외
 * - 오늘 이후 회차는 isScheduled
 */
export function mergeDisplayExpenses(
  expenses: Expense[],
  recurrings: Recurring[],
  rangeStart: Date,
  rangeEnd: Date,
  today: Date = new Date(),
): DisplayExpense[] {
  const todayKey = formatDateKey(today)
  const result: DisplayExpense[] = []

  const expenseByRecurringDate = new Map<string, Expense>()
  for (const e of expenses) {
    if (e.recurringId) {
      expenseByRecurringDate.set(`${e.recurringId}:${e.date}`, e)
    }
  }

  for (const e of expenses) {
    if (e.isSkipped) continue
    const d = parseISO(e.date)
    if (isBefore(d, rangeStart) || isAfter(d, rangeEnd)) continue

    result.push({
      id: e.id,
      amount: e.amount,
      title: e.title,
      date: e.date,
      categoryId: e.categoryId,
      paymentMethodId: e.paymentMethodId,
      memo: e.memo,
      recurringId: e.recurringId ?? null,
      isScheduled: e.date > todayKey,
      isVirtual: false,
      sourceExpenseId: e.id,
      excluded: Boolean(e.excluded),
    })
  }

  for (const r of recurrings) {
    const dates = expandRecurringDates(r, rangeStart, rangeEnd)
    for (const date of dates) {
      const existing = expenseByRecurringDate.get(`${r.id}:${date}`)
      if (existing) continue

      result.push({
        id: virtualId(r.id, date),
        amount: r.amount,
        title: r.title,
        date,
        categoryId: r.categoryId,
        paymentMethodId: r.paymentMethodId,
        memo: r.memo,
        recurringId: r.id,
        isScheduled: date > todayKey,
        isVirtual: true,
        excluded: Boolean(r.excluded),
      })
    }
  }

  return result.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.title.localeCompare(b.title, 'ko')
  })
}

export function getDayExpenses(
  display: DisplayExpense[],
  dateKey: string,
): DisplayExpense[] {
  return display.filter((e) => e.date === dateKey)
}

export function sumDayAmount(display: DisplayExpense[], dateKey: string): number {
  return getDayExpenses(display, dateKey)
    .filter((e) => !e.excluded)
    .reduce((s, e) => s + e.amount, 0)
}

export function sumMonthSpent(
  display: DisplayExpense[],
  monthKey: string,
  today: Date = new Date(),
): number {
  const todayKey = formatDateKey(today)
  return display
    .filter(
      (e) =>
        e.date.startsWith(monthKey) &&
        e.date <= todayKey &&
        !e.isScheduled &&
        !e.excluded,
    )
    .reduce((s, e) => s + e.amount, 0)
}

/** '이번만' 수정: 가상 → 예외 Expense 생성, 실지출 → 업데이트 */
export function buildThisOnlyUpdate(
  display: DisplayExpense,
  patch: Partial<
    Pick<Expense, 'amount' | 'title' | 'categoryId' | 'paymentMethodId' | 'memo' | 'date' | 'excluded'>
  >,
): { type: 'create' | 'update'; expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } } {
  if (display.isVirtual || !display.sourceExpenseId) {
    return {
      type: 'create',
      expense: {
        amount: patch.amount ?? display.amount,
        title: patch.title ?? display.title,
        date: patch.date ?? display.date,
        categoryId: patch.categoryId ?? display.categoryId,
        paymentMethodId:
          patch.paymentMethodId !== undefined
            ? patch.paymentMethodId
            : display.paymentMethodId,
        memo: patch.memo ?? display.memo,
        recurringId: display.recurringId,
        isException: true,
        isSkipped: false,
        excluded: patch.excluded ?? display.excluded,
      },
    }
  }

  return {
    type: 'update',
    expense: {
      id: display.sourceExpenseId,
      amount: patch.amount ?? display.amount,
      title: patch.title ?? display.title,
      date: patch.date ?? display.date,
      categoryId: patch.categoryId ?? display.categoryId,
      paymentMethodId:
        patch.paymentMethodId !== undefined
          ? patch.paymentMethodId
          : display.paymentMethodId,
      memo: patch.memo ?? display.memo,
      isException: true,
      excluded: patch.excluded ?? display.excluded,
    },
  }
}

/** '이번만' 삭제: 가상 → skip Expense 생성, 실지출 → skip 또는 삭제 */
export function buildThisOnlyDelete(
  display: DisplayExpense,
): { type: 'skip' | 'delete'; expense?: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>; id?: string } {
  if (display.isVirtual || !display.sourceExpenseId) {
    return {
      type: 'skip',
      expense: {
        amount: display.amount,
        title: display.title,
        date: display.date,
        categoryId: display.categoryId,
        paymentMethodId: display.paymentMethodId,
        memo: display.memo,
        recurringId: display.recurringId,
        isException: true,
        isSkipped: true,
      },
    }
  }

  if (display.recurringId) {
    return {
      type: 'skip',
      expense: undefined,
      id: display.sourceExpenseId,
    }
  }

  return { type: 'delete', id: display.sourceExpenseId }
}

/** '이후 전체' 수정용: 해당일 전날로 endDate 자르고 새 규칙 시작 */
export function splitRecurringFromDate(
  recurring: Recurring,
  fromDate: string,
  patch: Partial<
    Pick<
      Recurring,
      | 'amount'
      | 'title'
      | 'categoryId'
      | 'paymentMethodId'
      | 'memo'
      | 'dayOfMonth'
      | 'endDate'
      | 'excluded'
    >
  >,
): { close: Recurring; next: Omit<Recurring, 'id' | 'createdAt' | 'updatedAt'> } {
  const from = parseISO(fromDate)
  const dayBefore = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1)
  const closeEnd = formatDateKey(dayBefore)

  const close: Recurring = {
    ...recurring,
    endDate: isBefore(dayBefore, parseISO(recurring.startDate))
      ? recurring.startDate
      : closeEnd,
  }

  // startDate가 fromDate 이후면 그냥 원본 수정
  if (!isBefore(parseISO(recurring.startDate), from) || isEqual(parseISO(recurring.startDate), from)) {
    return {
      close: { ...recurring, ...patch, startDate: fromDate },
      next: {
        title: patch.title ?? recurring.title,
        amount: patch.amount ?? recurring.amount,
        categoryId: patch.categoryId ?? recurring.categoryId,
        paymentMethodId:
          patch.paymentMethodId !== undefined
            ? patch.paymentMethodId
            : recurring.paymentMethodId,
        frequency: 'monthly',
        dayOfMonth: patch.dayOfMonth ?? recurring.dayOfMonth,
        startDate: fromDate,
        endDate: patch.endDate !== undefined ? patch.endDate : recurring.endDate,
        memo: patch.memo ?? recurring.memo,
        excluded: patch.excluded ?? recurring.excluded,
      },
    }
  }

  return {
    close,
    next: {
      title: patch.title ?? recurring.title,
      amount: patch.amount ?? recurring.amount,
      categoryId: patch.categoryId ?? recurring.categoryId,
      paymentMethodId:
        patch.paymentMethodId !== undefined
          ? patch.paymentMethodId
          : recurring.paymentMethodId,
      frequency: 'monthly',
      dayOfMonth: patch.dayOfMonth ?? recurring.dayOfMonth,
      startDate: fromDate,
      endDate: patch.endDate !== undefined ? patch.endDate : recurring.endDate,
      memo: patch.memo ?? recurring.memo,
      excluded: patch.excluded ?? recurring.excluded,
    },
  }
}

export function createSkipMarker(display: DisplayExpense): Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    amount: display.amount,
    title: display.title,
    date: display.date,
    categoryId: display.categoryId,
    paymentMethodId: display.paymentMethodId,
    memo: display.memo,
    recurringId: display.recurringId,
    isException: true,
    isSkipped: true,
  }
}

export { createId, clampDate, differenceInCalendarDays, getDaysInMonth }
