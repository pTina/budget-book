import { CalendarHeader } from '@/features/calendar/components/CalendarHeader'
import { MonthGrid } from '@/features/calendar/components/MonthGrid'
import { ExpensePanel } from '@/features/expense/components/ExpensePanel'
import { DayExpenseModal } from '@/features/expense/components/DayExpenseModal'
import { ExpenseFormModal } from '@/features/expense/components/ExpenseFormModal'
import { SettingsModal } from '@/features/settings/components/SettingsModal'
import { ConfirmDialog, ScopeDialog } from '@/shared/ui/ConfirmDialog'
import { BudgetSummary } from '@/features/budget/components/BudgetSummary'
import { useBudget } from '@/features/budget/hooks/useBudget'
import { StatsView } from '@/features/stats/components/StatsView'
import { useUiStore } from '@/store/useUiStore'

export function CalendarPage() {
  const viewMode = useUiStore((s) => s.viewMode)
  const { data: budget } = useBudget()
  const showMobileBudget = Boolean(budget?.enabled)

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <CalendarHeader />

      {viewMode === 'stats' ? (
        <StatsView />
      ) : (
        <>
          {showMobileBudget ? (
            <div className="border-b border-line bg-paper p-3 md:hidden">
              <BudgetSummary compact />
            </div>
          ) : null}

          <div className="flex min-h-0 w-full flex-1">
            <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-paper md:border-r md:border-line">
              <MonthGrid />
            </main>
            <div className="hidden md:flex">
              <ExpensePanel />
            </div>
          </div>
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
