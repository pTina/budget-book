import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AssetHeader } from '@/features/asset/components/AssetHeader'
import { AssetTrend } from '@/features/asset/components/AssetTrend'
import { AssetDetails } from '@/features/asset/components/AssetDetails'
import { AssetFormModal } from '@/features/asset/components/AssetFormModal'
import { SettingsModal } from '@/features/settings/components/SettingsModal'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SegmentControl } from '@/shared/ui/SegmentControl'
import { useAssetCategories, useAssetEntries } from '@/features/asset/hooks/useAssets'
import {
  currentAssetPeriod,
  isMonthPeriod,
  isYearPeriod,
} from '@/features/asset/utils/assetStats'
import { useUiStore } from '@/store/useUiStore'
import type { AssetView } from '@/shared/types'

const VIEW_OPTIONS: { value: AssetView; label: string }[] = [
  { value: 'trend', label: '추이' },
  { value: 'details', label: '세부내역' },
]

export function AssetPage() {
  const { period: periodParam } = useParams()
  const setAssetPeriod = useUiStore((s) => s.setAssetPeriod)
  const assetView = useUiStore((s) => s.assetView)
  const setAssetView = useUiStore((s) => s.setAssetView)
  const openAssetForm = useUiStore((s) => s.openAssetForm)
  const { data: categories = [] } = useAssetCategories()
  const { data: entries = [] } = useAssetEntries()

  const period = periodParam ?? ''
  const valid = isMonthPeriod(period) || isYearPeriod(period)

  useEffect(() => {
    if (valid) setAssetPeriod(period)
  }, [period, valid, setAssetPeriod])

  if (!valid) {
    return <Navigate to={`/assets/${currentAssetPeriod('month')}`} replace />
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <AssetHeader period={period} />
      <div className="px-4 pt-3 md:hidden">
        <SegmentControl<AssetView>
          ariaLabel="자산 보기"
          fullWidth
          value={assetView}
          options={VIEW_OPTIONS}
          onChange={setAssetView}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className={`min-h-0 min-w-0 flex-1 ${
            assetView === 'details' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <AssetTrend period={period} entries={entries} categories={categories} />
        </div>
        <div
          className={`min-h-0 w-full md:w-[380px] md:shrink-0 ${
            assetView === 'trend' ? 'hidden md:flex' : 'flex'
          } flex-1 md:flex-none`}
        >
          <AssetDetails period={period} entries={entries} categories={categories} />
        </div>
      </div>
      <button
        type="button"
        className="mx-4 mb-4 mt-2 flex h-11 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white md:hidden"
        onClick={() => openAssetForm()}
      >
        + 기록
      </button>
      <AssetFormModal />
      <SettingsModal />
      <ConfirmDialog />
    </div>
  )
}
