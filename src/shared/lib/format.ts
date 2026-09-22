import {
  format,
  parseISO,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSunday,
  isToday as dfIsToday,
  getDay,
} from 'date-fns'
import { ko } from 'date-fns/locale'

export function formatMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM')
}

export function formatDateKey(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM-dd')
}

export function formatMonthLabel(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(`${date}-01`) : date
  return format(d, 'yyyy.MM')
}

export function formatDayHeading(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'M월 d일 (eee)', { locale: ko })
}

export function formatAmount(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`
}

export function formatAmountShort(amount: number): string {
  if (amount >= 10_000) {
    const man = amount / 10_000
    return `${man % 1 === 0 ? man.toFixed(0) : man.toFixed(1)}만`
  }
  return amount.toLocaleString('ko-KR')
}

export function parseAmountInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  return Number(digits)
}

/** 31일 규칙: dayOfMonth가 해당 월 일수보다 크면 말일 */
export function resolveDayOfMonth(year: number, monthIndex: number, dayOfMonth: number): number {
  const days = getDaysInMonth(new Date(year, monthIndex, 1))
  return Math.min(dayOfMonth, days)
}

export function buildCalendarDays(month: Date): Date[] {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const days = eachDayOfInterval({ start, end })

  const lead = getDay(start) // 0=Sun
  const leadDays: Date[] = []
  for (let i = lead; i > 0; i -= 1) {
    leadDays.push(new Date(start.getFullYear(), start.getMonth(), 1 - i))
  }

  const trailCount = (7 - ((leadDays.length + days.length) % 7)) % 7
  const trailDays: Date[] = []
  for (let i = 1; i <= trailCount; i += 1) {
    trailDays.push(new Date(end.getFullYear(), end.getMonth(), end.getDate() + i))
  }

  return [...leadDays, ...days, ...trailDays]
}

export function isCurrentMonth(day: Date, month: Date): boolean {
  return isSameMonth(day, month)
}

export function isSundayDate(day: Date): boolean {
  return isSunday(day)
}

export function isTodayDate(day: Date): boolean {
  return dfIsToday(day)
}

export { parseISO, startOfMonth, endOfMonth, getDaysInMonth }
