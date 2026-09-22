import type {
  AppData,
  BudgetSettings,
  Category,
  Expense,
  PaymentMethod,
  Recurring,
} from '@/shared/types'

export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCategoryInput = Partial<Omit<Category, 'id' | 'createdAt'>> & {
  id: string
}

export type CreatePaymentMethodInput = Omit<
  PaymentMethod,
  'id' | 'createdAt' | 'updatedAt'
>
export type UpdatePaymentMethodInput = Partial<
  Omit<PaymentMethod, 'id' | 'createdAt'>
> & { id: string }

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'createdAt'>> & {
  id: string
}

export type CreateRecurringInput = Omit<
  Recurring,
  'id' | 'createdAt' | 'updatedAt'
>
export type UpdateRecurringInput = Partial<
  Omit<Recurring, 'id' | 'createdAt'>
> & { id: string }

/** 어댑터 인터페이스 — localStorage / Firestore 교체 시 이 계약만 유지 */
export interface DataAdapter {
  getAll(): Promise<AppData>
  replaceAll(data: AppData): Promise<AppData>

  getCategories(): Promise<Category[]>
  createCategory(input: CreateCategoryInput): Promise<Category>
  updateCategory(input: UpdateCategoryInput): Promise<Category>
  deleteCategory(id: string): Promise<void>

  getPaymentMethods(): Promise<PaymentMethod[]>
  createPaymentMethod(input: CreatePaymentMethodInput): Promise<PaymentMethod>
  updatePaymentMethod(input: UpdatePaymentMethodInput): Promise<PaymentMethod>
  deletePaymentMethod(id: string): Promise<void>

  getExpenses(): Promise<Expense[]>
  createExpense(input: CreateExpenseInput): Promise<Expense>
  updateExpense(input: UpdateExpenseInput): Promise<Expense>
  deleteExpense(id: string): Promise<void>

  getRecurrings(): Promise<Recurring[]>
  createRecurring(input: CreateRecurringInput): Promise<Recurring>
  updateRecurring(input: UpdateRecurringInput): Promise<Recurring>
  deleteRecurring(id: string): Promise<void>

  getBudget(): Promise<BudgetSettings>
  updateBudget(input: Partial<BudgetSettings>): Promise<BudgetSettings>
}
