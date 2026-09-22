import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CalendarPage } from '@/pages/CalendarPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
