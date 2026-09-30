import { useNavigate, useLocation } from 'react-router-dom'
import { SegmentControl } from '@/shared/ui/SegmentControl'
import { useUiStore } from '@/store/useUiStore'

type Area = 'ledger' | 'asset'

const OPTIONS: { value: Area; label: string }[] = [
  { value: 'ledger', label: '가계부' },
  { value: 'asset', label: '자산' },
]

export function AppAreaSwitch() {
  const navigate = useNavigate()
  const location = useLocation()
  const assetPeriod = useUiStore((s) => s.assetPeriod)
  const value: Area = location.pathname.startsWith('/assets') ? 'asset' : 'ledger'

  return (
    <SegmentControl<Area>
      ariaLabel="앱 영역"
      value={value}
      options={OPTIONS}
      onChange={(next) => {
        if (next === 'asset') navigate(`/assets/${assetPeriod}`)
        else navigate('/')
      }}
    />
  )
}
