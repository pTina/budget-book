import { CalendarHeader } from '@/features/calendar/components/CalendarHeader'
import { MonthGrid } from '@/features/calendar/components/MonthGrid'
import { ExpensePanel } from '@/features/expense/components/ExpensePanel'
import { DayExpenseModal } from '@/features/expense/components/DayExpenseModal'
import { ExpenseFormModal } from '@/features/expense/components/ExpenseFormModal'
import { SettingsModal } from '@/features/settings/components/SettingsModal'
import { ConfirmDialog, ScopeDialog } from '@/shared/ui/ConfirmDialog'
import { BudgetSummary } from '@/features/budget/components/BudgetSummary'
import { StatsView } from '@/features/stats/components/StatsView'
import { useUiStore } from '@/store/useUiStore'

export function CalendarPage() {
  const viewMode = useUiStore((s) => s.viewMode)
  const openExpenseForm = useUiStore((s) => s.openExpenseForm)
  const selectedDate = useUiStore((s) => s.selectedDate)

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <CalendarHeader />

      {viewMode === 'stats' ? (
        <StatsView />
      ) : (
        <>
          <div className="border-b border-line bg-paper p-3 md:hidden">
            <BudgetSummary compact />
          </div>

          <div className="flex min-h-0 w-full flex-1">
            <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-paper md:border-r md:border-line">
              <MonthGrid />
            </main>
            <div className="hidden md:flex">
              <ExpensePanel />
            </div>
          </div>

          <button
            type="button"
            aria-label="지출 추가"
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-2xl text-white shadow-[var(--shadow-panel)] md:hidden"
            onClick={() => openExpenseForm({ date: selectedDate })}
          >
            +
          </button>
        </>
      )}

      <DayExpenseModal />
      <ExpenseFormModal />
      <SettingsModal />
      <ConfirmDialog />
      <ScopeDialog />
    </div>
  )
}
