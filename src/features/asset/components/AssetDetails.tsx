import { useMemo, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Chip } from '@/shared/ui/Chip'
import { formatAmount } from '@/shared/lib/format'
import { useUiStore } from '@/store/useUiStore'
import {
  entryHasDistinctValue,
  filterPeriodEntries,
  formatReturnRate,
  formatSignedAmount,
  formatYearItemMeta,
  groupPeriodDetails,
  isYearPeriod,
  returnRateTextClass,
} from '../utils/assetStats'
import type { AssetCategory, AssetEntry, AssetType } from '@/shared/types'

type FilterId = 'all' | 'uncat' | string

const TYPE_LABEL: Record<AssetType, string> = {
  buy: '매수',
  sell: '매도',
  hold: '보유',
}

type Props = {
  period: string
  entries: AssetEntry[]
  categories: AssetCategory[]
}

export function AssetDetails({ period, entries, categories }: Props) {
  const openAssetForm = useUiStore((s) => s.openAssetForm)
  const [filter, setFilter] = useState<FilterId>('all')
  const yearMode = isYearPeriod(period)

  const periodEntries = useMemo(
    () => filterPeriodEntries(entries, period),
    [entries, period],
  )
  const hasUncat = periodEntries.some((e) => e.categoryId === null)
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return periodEntries
    if (filter === 'uncat') return periodEntries.filter((e) => e.categoryId === null)
    return periodEntries.filter((e) => e.categoryId === filter)
  }, [periodEntries, filter])

  const groups = useMemo(
    () => groupPeriodDetails(filtered, period),
    [filtered, period],
  )

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col bg-paper p-4 md:w-[380px] md:shrink-0 md:border-l md:border-line">
      <div className="mb-3 hidden items-center justify-between md:flex">
        <h2 className="m-0 text-sm font-semibold">세부내역</h2>
        <Button size="sm" onClick={() => openAssetForm()}>
          + 기록
        </Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
          전체
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            selected={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.name}
          </Chip>
        ))}
        {hasUncat ? (
          <Chip selected={filter === 'uncat'} onClick={() => setFilter('uncat')}>
            미분류
          </Chip>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="m-0 py-10 text-center text-sm text-muted">
            이 기간에 기록이 없어요.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.heading} className="mb-1">
              <p className="m-0 mb-1.5 px-2 text-[13px] font-semibold">{group.heading}</p>
              {group.items.map((item) => {
                const cat = item.categoryId ? catById.get(item.categoryId) : undefined
                const catName = cat?.name ?? '미분류'
                const distinct = entryHasDistinctValue(item)
                const rate =
                  distinct && item.value != null
                    ? formatReturnRate(item.value, item.amount)
                    : null
                const rateClass =
                  distinct && item.value != null
                    ? returnRateTextClass(item.value, item.amount)
                    : ''
                const meta = yearMode ? formatYearItemMeta(item.date, catName) : catName
                const memo = item.memo?.trim()
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-canvas"
                    onClick={() => openAssetForm({ id: item.id })}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <strong className="text-sm font-medium">{item.title}</strong>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            item.type === 'buy'
                              ? 'bg-work text-ink'
                              : item.type === 'hold'
                                ? 'bg-periwinkle text-ink'
                                : 'bg-canvas text-muted'
                          }`}
                        >
                          {TYPE_LABEL[item.type]}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-faint">
                        {item.type === 'hold' && distinct
                          ? `${meta} · 원금 ${formatSignedAmount({ ...item, type: 'hold' })}`
                          : item.type === 'buy'
                            ? `${meta} · 원금`
                            : meta}
                      </span>
                      {memo ? (
                        <span className="mt-0.5 block text-[11px] text-faint">{memo}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          item.type === 'sell' ? 'text-muted' : 'text-ink'
                        }`}
                      >
                        {item.type === 'hold' && distinct
                          ? formatAmount(item.value ?? item.amount)
                          : formatSignedAmount(item)}
                      </span>
                      {distinct ? (
                        <span className="mt-0.5 text-[11px] font-medium tabular-nums text-faint">
                          {item.type === 'hold' ? '평가' : `평가 ${formatAmount(item.value ?? 0)}`}
                          {rate ? (
                            <>
                              {' '}
                              <span className={rateClass}>{rate}</span>
                            </>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
