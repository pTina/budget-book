import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { formatDateKey, formatMonthKey } from '@/shared/lib/format'
import type { RecurringEditScope, ViewMode } from '@/shared/types'

type SettingsTab = 'budget' | 'category' | 'payment' | 'recurring'

type UiState = {
  monthKey: string
  selectedDate: string
  viewMode: ViewMode

  dayExpenseOpen: boolean
  expenseFormOpen: boolean
  expenseFormId: string | null
  expenseFormRecurringOn: boolean
  settingsOpen: boolean
  settingsTab: SettingsTab
  confirmOpen: boolean
  confirmTitle: string
  confirmDescription: string
  confirmConfirmLabel: string
  confirmTone: 'danger' | 'default'
  confirmResolver: ((ok: boolean) => void) | null
  scopeOpen: boolean
  scopeResolver: ((scope: RecurringEditScope | null) => void) | null

  setMonthKey: (key: string) => void
  setSelectedDate: (date: string) => void
  goToday: () => void
  shiftMonth: (delta: number) => void
  setViewMode: (mode: ViewMode) => void

  openDayExpense: (date?: string) => void
  closeDayExpense: () => void
  openExpenseForm: (opts?: { id?: string | null; recurringOn?: boolean; date?: string }) => void
  closeExpenseForm: () => void
  openSettings: (tab?: SettingsTab) => void
  closeSettings: () => void
  askConfirm: (opts: {
    title: string
    description?: string
    confirmLabel?: string
    tone?: 'danger' | 'default'
  }) => Promise<boolean>
  resolveConfirm: (ok: boolean) => void
  askScope: () => Promise<RecurringEditScope | null>
  resolveScope: (scope: RecurringEditScope | null) => void
}

const today = new Date()

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      monthKey: formatMonthKey(today),
      selectedDate: formatDateKey(today),
      viewMode: 'calendar',

      dayExpenseOpen: false,
      expenseFormOpen: false,
      expenseFormId: null,
      expenseFormRecurringOn: false,
      settingsOpen: false,
      settingsTab: 'budget',
      confirmOpen: false,
      confirmTitle: '',
      confirmDescription: '',
      confirmConfirmLabel: '확인',
      confirmTone: 'danger',
      confirmResolver: null,
      scopeOpen: false,
      scopeResolver: null,

      setMonthKey: (key) => set({ monthKey: key }),
      setSelectedDate: (date) =>
        set({ selectedDate: date, monthKey: date.slice(0, 7) }),
      goToday: () => {
        const d = new Date()
        set({
          selectedDate: formatDateKey(d),
          monthKey: formatMonthKey(d),
        })
      },
      shiftMonth: (delta) => {
        const [y, m] = get().monthKey.split('-').map(Number)
        const next = new Date(y, m - 1 + delta, 1)
        const key = formatMonthKey(next)
        const selected = get().selectedDate
        const day = Number(selected.slice(8, 10))
        const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        const clamped = String(Math.min(day, maxDay)).padStart(2, '0')
        set({ monthKey: key, selectedDate: `${key}-${clamped}` })
      },
      setViewMode: (mode) => set({ viewMode: mode }),

      openDayExpense: (date) =>
        set({
          dayExpenseOpen: true,
          ...(date ? { selectedDate: date, monthKey: date.slice(0, 7) } : {}),
        }),
      closeDayExpense: () => set({ dayExpenseOpen: false }),
      openExpenseForm: (opts) =>
        set({
          expenseFormOpen: true,
          expenseFormId: opts?.id ?? null,
          expenseFormRecurringOn: opts?.recurringOn ?? false,
          ...(opts?.date
            ? { selectedDate: opts.date, monthKey: opts.date.slice(0, 7) }
            : {}),
        }),
      closeExpenseForm: () =>
        set({
          expenseFormOpen: false,
          expenseFormId: null,
          expenseFormRecurringOn: false,
        }),
      openSettings: (tab = 'budget') =>
        set({ settingsOpen: true, settingsTab: tab }),
      closeSettings: () => set({ settingsOpen: false }),

      askConfirm: ({ title, description = '', confirmLabel = '삭제', tone = 'danger' }) =>
        new Promise<boolean>((resolve) => {
          set({
            confirmOpen: true,
            confirmTitle: title,
            confirmDescription: description,
            confirmConfirmLabel: confirmLabel,
            confirmTone: tone,
            confirmResolver: resolve,
          })
        }),
      resolveConfirm: (ok) => {
        get().confirmResolver?.(ok)
        set({ confirmOpen: false, confirmResolver: null })
      },
      askScope: () =>
        new Promise<RecurringEditScope | null>((resolve) => {
          set({ scopeOpen: true, scopeResolver: resolve })
        }),
      resolveScope: (scope) => {
        get().scopeResolver?.(scope)
        set({ scopeOpen: false, scopeResolver: null })
      },
    }),
    {
      name: 'budget-book:ui',
      partialize: (s) => ({
        monthKey: s.monthKey,
        selectedDate: s.selectedDate,
        viewMode: s.viewMode,
      }),
    },
  ),
)
