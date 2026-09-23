export type Category = {
  id: string
  name: string
  color: string
  isUncategorized?: boolean
  createdAt: string
  updatedAt: string
}

export type PaymentMethod = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type Expense = {
  id: string
  amount: number
  title: string
  date: string
  categoryId: string
  paymentMethodId: string | null
  memo?: string
  recurringId?: string | null
  /** 반복 회차 중 '이번만' 수정/삭제로 생긴 예외 */
  isException?: boolean
  /** 삭제된 반복 회차(이번만) 표시용 — 실제 목록에서 제외 */
  isSkipped?: boolean
  createdAt: string
  updatedAt: string
}

export type RecurringFrequency = 'monthly'

export type Recurring = {
  id: string
  title: string
  amount: number
  categoryId: string
  paymentMethodId: string | null
  frequency: RecurringFrequency
  /** 1–31. 짧은 달에는 말일로 보정 */
  dayOfMonth: number
  startDate: string
  endDate?: string | null
  memo?: string
  createdAt: string
  updatedAt: string
}

export type BudgetSettings = {
  enabled: boolean
  /** 기본 월 예산 (applyToNextMonth용) */
  defaultAmount: number
  applyToNextMonth: boolean
  /** 'YYYY-MM' → 금액. enabled가 false여도 값 유지 */
  monthlyAmounts: Record<string, number>
}

export type AppData = {
  version: 1
  categories: Category[]
  paymentMethods: PaymentMethod[]
  expenses: Expense[]
  recurrings: Recurring[]
  budget: BudgetSettings
}

/** 캘린더/목록에 표시되는 지출 (실지출 + 반복 전개) */
export type DisplayExpense = {
  id: string
  amount: number
  title: string
  date: string
  categoryId: string
  paymentMethodId: string | null
  memo?: string
  recurringId?: string | null
  /** 오늘 이후 반복 회차 */
  isScheduled: boolean
  /** 실제 Expense 레코드 여부 (없으면 가상 회차) */
  isVirtual: boolean
  sourceExpenseId?: string
}

export type ViewMode = 'calendar' | 'stats' | 'details'

export type RecurringEditScope = 'this' | 'following'
