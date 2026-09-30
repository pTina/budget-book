import { format, parseISO } from 'date-fns'
import { formatAmount, formatMonthKey } from '@/shared/lib/format'
import { ASSET_UNCATEGORIZED_COLOR } from '@/shared/storage'
import type {
  AssetCategory,
  AssetEntry,
  AssetPeriodUnit,
} from '@/shared/types'

const UNCAT_KEY = '__uncat__'

export function isYearPeriod(period: string): boolean {
  return /^\d{4}$/.test(period)
}

export function isMonthPeriod(period: string): boolean {
  return /^\d{4}-\d{2}$/.test(period)
}

export function parseAssetPeriod(period: string): {
  unit: AssetPeriodUnit
  year: number
  month: number
} | null {
  if (isYearPeriod(period)) {
    return { unit: 'year', year: Number(period), month: 12 }
  }
  if (isMonthPeriod(period)) {
    const [y, m] = period.split('-').map(Number)
    return { unit: 'month', year: y, month: m }
  }
  return null
}

export function currentAssetPeriod(unit: AssetPeriodUnit, today = new Date()): string {
  if (unit === 'year') return String(today.getFullYear())
  return formatMonthKey(today)
}

export function shiftAssetPeriod(period: string, delta: number): string {
  const parsed = parseAssetPeriod(period)
  if (!parsed) return period
  if (parsed.unit === 'year') return String(parsed.year + delta)
  const next = new Date(parsed.year, parsed.month - 1 + delta, 1)
  return formatMonthKey(next)
}

export function switchAssetUnit(
  period: string,
  unit: AssetPeriodUnit,
  today = new Date(),
): string {
  const parsed = parseAssetPeriod(period)
  if (!parsed) return currentAssetPeriod(unit, today)
  if (unit === 'year') return String(parsed.year)
  if (parsed.year === today.getFullYear()) return formatMonthKey(today)
  return `${parsed.year}-12`
}

export function periodEndDate(period: string): string {
  const parsed = parseAssetPeriod(period)
  if (!parsed) return period
  if (parsed.unit === 'year') return `${parsed.year}-12-31`
  const last = new Date(parsed.year, parsed.month, 0).getDate()
  return `${period}-${String(last).padStart(2, '0')}`
}

export function periodLabel(period: string): string {
  const parsed = parseAssetPeriod(period)
  if (!parsed) return period
  if (parsed.unit === 'year') return String(parsed.year)
  return `${parsed.year}.${String(parsed.month).padStart(2, '0')}`
}

export function signedDelta(
  entry: AssetEntry,
  kind: 'principal' | 'value' = 'principal',
): number {
  if (entry.type === 'sell') return -entry.amount
  if (kind === 'value') return entry.value ?? entry.amount
  return entry.amount
}

export function balanceAsOf(
  entries: AssetEntry[],
  asOf: string,
  categoryId?: string | null,
  kind: 'principal' | 'value' = 'principal',
): number {
  return entries.reduce((sum, entry) => {
    if (entry.date > asOf) return sum
    if (categoryId !== undefined) {
      if (categoryId === null && entry.categoryId !== null) return sum
      if (categoryId !== null && entry.categoryId !== categoryId) return sum
    }
    return sum + signedDelta(entry, kind)
  }, 0)
}

export type ChartPoint = {
  key: string
  label: string
  value: number
  selected: boolean
}

export function monthSeries(entries: AssetEntry[], monthKey: string): ChartPoint[] {
  const [y, m] = monthKey.split('-').map(Number)
  const points: ChartPoint[] = []
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(y, m - 1 - i, 1)
    const key = formatMonthKey(d)
    points.push({
      key,
      label: String(d.getMonth() + 1),
      value: balanceAsOf(entries, periodEndDate(key), undefined, 'value'),
      selected: key === monthKey,
    })
  }
  return points
}

export function yearSeries(entries: AssetEntry[], year: number): ChartPoint[] {
  const points: ChartPoint[] = []
  for (let i = 4; i >= 0; i -= 1) {
    const y = year - i
    const key = String(y)
    points.push({
      key,
      label: String(y).slice(-2),
      value: balanceAsOf(entries, periodEndDate(key), undefined, 'value'),
      selected: y === year,
    })
  }
  return points
}

export type CategoryBalance = {
  id: string | null
  name: string
  color: string
  amount: number
  principal: number
  rate: string | null
  ratio: number
}

export function categoryBalances(
  entries: AssetEntry[],
  asOf: string,
  categories: AssetCategory[],
): CategoryBalance[] {
  const values = new Map<string, number>()
  const principals = new Map<string, number>()
  for (const entry of entries) {
    if (entry.date > asOf) continue
    const key = entry.categoryId ?? UNCAT_KEY
    values.set(key, (values.get(key) ?? 0) + signedDelta(entry, 'value'))
    principals.set(key, (principals.get(key) ?? 0) + signedDelta(entry, 'principal'))
  }

  const catById = new Map(categories.map((c) => [c.id, c]))
  const rows: CategoryBalance[] = []
  for (const [key, amount] of values) {
    const principal = principals.get(key) ?? 0
    if (amount === 0 && principal === 0) continue
    if (key === UNCAT_KEY) {
      rows.push({
        id: null,
        name: '미분류',
        color: ASSET_UNCATEGORIZED_COLOR,
        amount,
        principal,
        rate: formatReturnRate(amount, principal),
        ratio: 0,
      })
      continue
    }
    const cat = catById.get(key)
    rows.push({
      id: key,
      name: cat?.name ?? '미분류',
      color: cat?.color ?? ASSET_UNCATEGORIZED_COLOR,
      amount,
      principal,
      rate: formatReturnRate(amount, principal),
      ratio: 0,
    })
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  return rows
    .map((row) => ({ ...row, ratio: total > 0 ? row.amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount)
}

export type ReturnRateTone = 'plus' | 'minus' | 'zero'

function roundedReturnPct(value: number, principal: number): number | null {
  if (principal <= 0) return null
  return Math.round(((value - principal) / principal) * 100 * 10) / 10
}

export function returnRateTone(value: number, principal: number): ReturnRateTone | null {
  const rounded = roundedReturnPct(value, principal)
  if (rounded == null) return null
  if (rounded > 0) return 'plus'
  if (rounded < 0) return 'minus'
  return 'zero'
}

export function returnRateTextClass(value: number, principal: number): string {
  const tone = returnRateTone(value, principal)
  if (tone === 'plus') return 'text-rate-plus'
  if (tone === 'minus') return 'text-rate-minus'
  return ''
}

export function formatReturnRate(value: number, principal: number): string | null {
  const rounded = roundedReturnPct(value, principal)
  if (rounded == null) return null
  if (rounded === 0) return '0%'
  const sign = rounded > 0 ? '+' : '−'
  return `${sign}${Math.abs(rounded).toFixed(1)}%`
}

export function formatProfitLine(principal: number, value: number): string {
  const diff = value - principal
  const sign = diff > 0 ? '+' : diff < 0 ? '−' : ''
  const amount = `${sign}${formatAmount(Math.abs(diff))}`
  const rate = formatReturnRate(value, principal)
  return rate ? `${amount} (${rate})` : amount
}

export function entryHasDistinctValue(entry: AssetEntry): boolean {
  return entry.type !== 'sell' && entry.value != null && entry.value !== entry.amount
}

export function entryDisplayValue(entry: AssetEntry): number {
  if (entry.type === 'sell') return entry.amount
  return entry.value ?? entry.amount
}

export function previousPeriod(period: string): string {
  return shiftAssetPeriod(period, -1)
}

export function formatBalanceDiff(diff: number, unit: AssetPeriodUnit): string {
  const parts = balanceDiffParts(diff, unit)
  return parts.amount ? `${parts.label} ${parts.amount}` : parts.label
}

export function balanceDiffParts(
  diff: number,
  unit: AssetPeriodUnit,
): { label: string; amount: string | null } {
  if (diff === 0) {
    return { label: unit === 'year' ? '전년과 같음' : '전월과 같음', amount: null }
  }
  const sign = diff > 0 ? '+' : '−'
  return {
    label: unit === 'year' ? '전년 대비' : '전월 대비',
    amount: `${sign}${formatAmount(Math.abs(diff))}`,
  }
}

export function filterPeriodEntries(entries: AssetEntry[], period: string): AssetEntry[] {
  const parsed = parseAssetPeriod(period)
  if (!parsed) return []
  return entries.filter((e) => {
    if (parsed.unit === 'year') return e.date.startsWith(`${parsed.year}-`)
    return e.date.startsWith(period)
  })
}

export type DetailGroup = {
  heading: string
  items: AssetEntry[]
}

export function groupPeriodDetails(
  entries: AssetEntry[],
  period: string,
): DetailGroup[] {
  const parsed = parseAssetPeriod(period)
  if (!parsed) return []
  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })

  if (parsed.unit === 'month') {
    const map = new Map<string, AssetEntry[]>()
    for (const item of sorted) {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    }
    return [...map.entries()].map(([date, items]) => ({
      heading: formatDayHeading(date),
      items,
    }))
  }

  const map = new Map<string, AssetEntry[]>()
  for (const item of sorted) {
    const monthKey = item.date.slice(0, 7)
    const list = map.get(monthKey) ?? []
    list.push(item)
    map.set(monthKey, list)
  }
  return [...map.entries()].map(([monthKey, items]) => ({
    heading: `${Number(monthKey.slice(5, 7))}월`,
    items,
  }))
}

export function formatDayHeading(date: string): string {
  const d = parseISO(date)
  return format(d, 'M월 d일')
}

export function formatYearItemMeta(date: string, categoryName: string): string {
  const d = parseISO(date)
  return `${categoryName} · ${d.getMonth() + 1}.${d.getDate()}`
}

export function formatSignedAmount(entry: AssetEntry): string {
  if (entry.type === 'buy') return `+${formatAmount(entry.amount)}`
  if (entry.type === 'sell') return `−${formatAmount(entry.amount)}`
  return formatAmount(entry.amount)
}

export function barHeightPct(value: number, max: number): number {
  if (max <= 0 || value <= 0) return 0
  return Math.max(6, Math.round((value / max) * 100))
}

export function totalLabel(period: string): string {
  const parsed = parseAssetPeriod(period)
  if (!parsed) return '평가금액'
  if (parsed.unit === 'year') return `${parsed.year} 평가금액`
  return `${parsed.month}월 평가금액`
}
