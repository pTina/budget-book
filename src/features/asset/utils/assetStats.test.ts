import { describe, expect, it } from 'vitest'
import type { AssetCategory, AssetEntry } from '@/shared/types'
import {
  balanceAsOf,
  barHeightPct,
  categoryBalances,
  filterPeriodEntries,
  formatBalanceDiff,
  formatProfitLine,
  formatReturnRate,
  returnRateTextClass,
  returnRateTone,
  groupPeriodDetails,
  monthSeries,
  periodEndDate,
  shiftAssetPeriod,
  switchAssetUnit,
  yearSeries,
} from './assetStats'

const cats: AssetCategory[] = [
  {
    id: 'pension',
    name: '연금',
    color: '#C0E8DD',
    order: 0,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'stock',
    name: '주식',
    color: '#A3C6EB',
    order: 1,
    createdAt: '',
    updatedAt: '',
  },
]

function entry(
  partial: Pick<AssetEntry, 'id' | 'date' | 'type' | 'amount'> &
    Partial<AssetEntry>,
): AssetEntry {
  return {
    categoryId: partial.categoryId ?? 'pension',
    title: partial.title ?? 'item',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: '',
    ...partial,
  }
}

const entries: AssetEntry[] = [
  entry({ id: '1', date: '2026-01-01', type: 'hold', amount: 7_500_000, categoryId: 'pension' }),
  entry({ id: '2', date: '2026-09-04', type: 'buy', amount: 500_000, categoryId: 'pension' }),
  entry({ id: '3', date: '2026-09-18', type: 'buy', amount: 1_200_000, categoryId: 'stock' }),
  entry({ id: '4', date: '2026-09-04', type: 'sell', amount: 320_000, categoryId: 'stock' }),
  entry({ id: '5', date: '2026-08-12', type: 'buy', amount: 400_000, categoryId: 'stock' }),
]

describe('period helpers', () => {
  it('월 말일과 연 말일을 계산한다', () => {
    expect(periodEndDate('2026-09')).toBe('2026-09-30')
    expect(periodEndDate('2026-02')).toBe('2026-02-28')
    expect(periodEndDate('2026')).toBe('2026-12-31')
  })

  it('월/년을 이동한다', () => {
    expect(shiftAssetPeriod('2026-01', -1)).toBe('2025-12')
    expect(shiftAssetPeriod('2026', 1)).toBe('2027')
  })

  it('단위 전환 시 연도는 유지한다', () => {
    expect(switchAssetUnit('2026-09', 'year')).toBe('2026')
    expect(switchAssetUnit('2024', 'month', new Date(2026, 8, 1))).toBe('2024-12')
    expect(switchAssetUnit('2026', 'month', new Date(2026, 8, 1))).toBe('2026-09')
  })
})

describe('balanceAsOf', () => {
  it('보유 + 매수 − 매도를 기간 말까지 합산한다', () => {
    expect(balanceAsOf(entries, '2026-09-30')).toBe(9_280_000)
    expect(balanceAsOf(entries, '2026-08-31')).toBe(7_900_000)
    expect(balanceAsOf(entries, '2025-12-31')).toBe(0)
  })

  it('카테고리별로 필터한다', () => {
    expect(balanceAsOf(entries, '2026-09-30', 'pension')).toBe(8_000_000)
    expect(balanceAsOf(entries, '2026-09-30', 'stock')).toBe(1_280_000)
  })

  it('평가금액이 있으면 원금과 따로 합산한다', () => {
    const data = entries.map((e) =>
      e.id === '3' ? { ...e, value: 1_350_000 } : e,
    )
    expect(balanceAsOf(data, '2026-09-30', undefined, 'principal')).toBe(9_280_000)
    expect(balanceAsOf(data, '2026-09-30', undefined, 'value')).toBe(9_430_000)
  })
})

describe('series', () => {
  it('최근 6개월 월말 잔고를 만든다', () => {
    const series = monthSeries(entries, '2026-09')
    expect(series).toHaveLength(6)
    expect(series.map((p) => p.label)).toEqual(['4', '5', '6', '7', '8', '9'])
    expect(series[5]?.selected).toBe(true)
    expect(series[5]?.value).toBe(9_280_000)
    expect(series[4]?.value).toBe(7_900_000)
  })

  it('최근 5년 연말 잔고를 만든다', () => {
    const series = yearSeries(entries, 2026)
    expect(series).toHaveLength(5)
    expect(series.map((p) => p.label)).toEqual(['22', '23', '24', '25', '26'])
    expect(series[4]?.value).toBe(9_280_000)
    expect(series[3]?.value).toBe(0)
  })
})

describe('categoryBalances', () => {
  it('0원 카테고리는 빼고 금액 내림차순이다', () => {
    const rows = categoryBalances(entries, '2026-09-30', cats)
    expect(rows.map((r) => r.name)).toEqual(['연금', '주식'])
    expect(rows[0]?.amount).toBe(8_000_000)
    expect(rows[0]?.principal).toBe(8_000_000)
    expect(rows[0]?.ratio).toBeCloseTo(8_000_000 / 9_280_000)
  })
})

describe('formatReturnRate', () => {
  it('원금 대비 수익률을 소수 첫째 자리로 표시한다', () => {
    expect(formatReturnRate(13_210_000, 12_480_000)).toBe('+5.8%')
    expect(formatReturnRate(3_640_000, 3_200_000)).toBe('+13.8%')
    expect(formatReturnRate(8_000_000, 8_000_000)).toBe('0%')
    expect(formatReturnRate(90, 100)).toBe('−10.0%')
    expect(formatReturnRate(100, 0)).toBeNull()
  })

  it('수익률 부호에 맞춰 톤을 나눈다', () => {
    expect(returnRateTone(13_210_000, 12_480_000)).toBe('plus')
    expect(returnRateTone(90, 100)).toBe('minus')
    expect(returnRateTone(8_000_000, 8_000_000)).toBe('zero')
    expect(returnRateTone(100, 0)).toBeNull()
    expect(returnRateTextClass(13_210_000, 12_480_000)).toBe('text-rate-plus')
    expect(returnRateTextClass(90, 100)).toBe('text-rate-minus')
    expect(returnRateTextClass(8_000_000, 8_000_000)).toBe('')
  })

  it('평가손익 줄에 비율을 붙인다', () => {
    expect(formatProfitLine(12_480_000, 13_210_000)).toBe('+730,000원 (+5.8%)')
  })
})

describe('details', () => {
  it('선택 월 기록만 날짜 내림차순으로 묶는다', () => {
    const month = filterPeriodEntries(entries, '2026-09')
    const groups = groupPeriodDetails(month, '2026-09')
    expect(groups.map((g) => g.heading)).toEqual(['9월 18일', '9월 4일'])
    expect(groups[1]?.items).toHaveLength(2)
  })

  it('선택 연 기록만 월 내림차순으로 묶는다', () => {
    const year = filterPeriodEntries(entries, '2026')
    const groups = groupPeriodDetails(year, '2026')
    expect(groups[0]?.heading).toBe('9월')
    expect(groups[1]?.heading).toBe('8월')
  })
})

describe('formatBalanceDiff', () => {
  it('증감 문구를 만든다', () => {
    expect(formatBalanceDiff(1_380_000, 'month')).toBe('전월 대비 +1,380,000원')
    expect(formatBalanceDiff(-120_000, 'year')).toBe('전년 대비 −120,000원')
    expect(formatBalanceDiff(0, 'month')).toBe('전월과 같음')
  })
})

describe('barHeightPct', () => {
  it('최대값 대비 높이를 계산한다', () => {
    expect(barHeightPct(0, 100)).toBe(0)
    expect(barHeightPct(50, 100)).toBe(50)
    expect(barHeightPct(1, 100)).toBe(6)
  })
})
