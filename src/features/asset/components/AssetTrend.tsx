import { formatAmount } from '@/shared/lib/format'
import {
  balanceAsOf,
  balanceDiffParts,
  barHeightPct,
  categoryBalances,
  formatProfitLine,
  isYearPeriod,
  monthSeries,
  periodEndDate,
  previousPeriod,
  returnRateTextClass,
  totalLabel,
  yearSeries,
} from '../utils/assetStats'
import type { AssetCategory, AssetEntry } from '@/shared/types'

type Props = {
  period: string
  entries: AssetEntry[]
  categories: AssetCategory[]
}

export function AssetTrend({ period, entries, categories }: Props) {
  const unit = isYearPeriod(period) ? 'year' : 'month'
  const asOf = periodEndDate(period)
  const valueTotal = balanceAsOf(entries, asOf, undefined, 'value')
  const principalTotal = balanceAsOf(entries, asOf, undefined, 'principal')
  const prevValue = balanceAsOf(
    entries,
    periodEndDate(previousPeriod(period)),
    undefined,
    'value',
  )
  const diff = balanceDiffParts(valueTotal - prevValue, unit)
  const profit = formatProfitLine(principalTotal, valueTotal)
  const profitClass = returnRateTextClass(valueTotal, principalTotal)
  const series =
    unit === 'year' ? yearSeries(entries, Number(period)) : monthSeries(entries, period)
  const max = Math.max(0, ...series.map((p) => p.value))
  const ranks = categoryBalances(entries, asOf, categories)

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-paper p-4 md:overflow-hidden md:p-6">
      <p className="m-0 text-xs text-muted">{totalLabel(period)}</p>
      <p className="m-0 mt-1.5 text-[28px] font-bold tracking-tight tabular-nums text-ink">
        {formatAmount(valueTotal)}
      </p>
      <p className="m-0 mt-2 text-sm text-muted">
        {diff.amount ? (
          <>
            {diff.label}{' '}
            <em className="not-italic font-semibold text-ink">{diff.amount}</em>
          </>
        ) : (
          diff.label
        )}
      </p>
      <p className="m-0 mt-1.5 text-sm text-muted">
        원금 {formatAmount(principalTotal)} · 평가손익{' '}
        <em className={`not-italic font-semibold ${profitClass}`}>
          {profit}
        </em>
      </p>
      <div className="mt-6 flex min-h-0 flex-1 flex-col md:mt-8 md:flex-row md:items-stretch md:gap-10">
        <div className="shrink-0 md:min-w-0 md:flex-[1.4]">
          <ul
            className="m-0 flex h-[132px] list-none items-end gap-3 p-0 md:h-[220px] md:w-full md:max-w-[480px] md:gap-4"
            aria-label={unit === 'year' ? '연도별 평가금액 추이' : '최근 6개월 평가금액 추이'}
          >
            {series.map((point) => (
              <li
                key={point.key}
                className="flex h-full w-8 flex-col items-center justify-end gap-1.5 md:w-auto md:min-w-10 md:max-w-14 md:flex-1"
              >
                <span
                  className={`block w-6 rounded-t-md md:w-full md:max-w-10 ${
                    point.selected ? 'bg-ink' : 'bg-personal'
                  }`}
                  style={{ height: `${barHeightPct(point.value, max)}%` }}
                />
                <span className="text-[11px] text-faint">{point.label}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-1.5 text-xs text-faint">
            {unit === 'year'
              ? '연말 평가액 추이 · 최근 5년'
              : '월말 평가액 추이 · 원금은 직접 입력'}
          </p>
        </div>
        <ul className="mt-5 m-0 min-h-0 min-w-0 flex-1 list-none p-0 md:mt-0 md:overflow-y-auto">
          {ranks.length === 0 ? (
            <li className="py-6 text-sm text-muted">이 기간에 자산이 없어요.</li>
          ) : (
            ranks.map((row) => (
              <li key={row.id ?? 'uncat'} className="py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-semibold">{row.name}</span>
                    <span className="mt-0.5 text-xs font-normal text-faint">
                      원금 {formatAmount(row.principal)}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatAmount(row.amount)}
                    </span>
                    {row.rate ? (
                      <span
                        className={`mt-0.5 text-xs font-medium tabular-nums ${returnRateTextClass(row.amount, row.principal)}`}
                      >
                        {row.rate}
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${Math.round(row.ratio * 100)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  )
}
