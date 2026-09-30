import { useNavigate } from 'react-router-dom'
import { AppAreaSwitch } from '@/shared/ui/AppAreaSwitch'
import { SegmentControl } from '@/shared/ui/SegmentControl'
import { SettingsIcon } from '@/shared/ui/SettingsIcon'
import { useUiStore } from '@/store/useUiStore'
import {
  isYearPeriod,
  periodLabel,
  shiftAssetPeriod,
  switchAssetUnit,
} from '@/features/asset/utils/assetStats'
import type { AssetPeriodUnit } from '@/shared/types'

const UNIT_OPTIONS: { value: AssetPeriodUnit; label: string }[] = [
  { value: 'month', label: '월' },
  { value: 'year', label: '년' },
]

type Props = {
  period: string
}

export function AssetHeader({ period }: Props) {
  const navigate = useNavigate()
  const setAssetPeriod = useUiStore((s) => s.setAssetPeriod)
  const openSettings = useUiStore((s) => s.openSettings)
  const unit: AssetPeriodUnit = isYearPeriod(period) ? 'year' : 'month'

  const go = (next: string) => {
    setAssetPeriod(next)
    navigate(`/assets/${next}`)
  }

  return (
    <header className="border-b border-line bg-paper">
      <div className="flex items-center gap-1.5 px-3 py-3 md:gap-3 md:px-6">
        <h1 className="hidden m-0 text-lg font-bold tracking-tight text-ink md:block">
          가계부
        </h1>
        <AppAreaSwitch />
        <div className="ml-auto">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink md:h-9 md:w-9"
            aria-label="설정"
            onClick={() => openSettings('asset')}
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-3 py-2 md:px-6">
        <SegmentControl<AssetPeriodUnit>
          ariaLabel="기간 단위"
          value={unit}
          options={UNIT_OPTIONS}
          onChange={(next) => go(switchAssetUnit(period, next))}
        />
        <div className="flex items-center">
          <button
            type="button"
            aria-label="이전"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-canvas"
            onClick={() => go(shiftAssetPeriod(period, -1))}
          >
            ‹
          </button>
          <p className="m-0 min-w-[5.5rem] text-center text-sm font-semibold tabular-nums">
            {periodLabel(period)}
          </p>
          <button
            type="button"
            aria-label="다음"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-canvas"
            onClick={() => go(shiftAssetPeriod(period, 1))}
          >
            ›
          </button>
        </div>
      </div>
    </header>
  )
}
