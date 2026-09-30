import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarPage } from '@/pages/CalendarPage'
import { AssetPage } from '@/pages/AssetPage'
import { useUiStore } from '@/store/useUiStore'
import { currentAssetPeriod } from '@/features/asset/utils/assetStats'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function AssetsIndexRedirect() {
  const period = useUiStore((s) => s.assetPeriod) || currentAssetPeriod('month')
  return <Navigate to={`/assets/${period}`} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter
      basename={basename || undefined}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/assets" element={<AssetsIndexRedirect />} />
        <Route path="/assets/:period" element={<AssetPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
