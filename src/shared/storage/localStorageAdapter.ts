import type {
  AppData,
  BudgetSettings,
  Category,
  Expense,
  PaymentMethod,
  Recurring,
} from '@/shared/types'
import { createId } from '@/shared/lib/id'
import { createSeedData, UNCATEGORIZED_ID } from './seed'
import type {
  CreateCategoryInput,
  CreateExpenseInput,
  CreatePaymentMethodInput,
  CreateRecurringInput,
  DataAdapter,
  UpdateCategoryInput,
  UpdateExpenseInput,
  UpdatePaymentMethodInput,
  UpdateRecurringInput,
} from './types'

const STORAGE_KEY = 'budget-book:v1'

function nowIso(): string {
  return new Date().toISOString()
}

function read(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = createSeedData()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return JSON.parse(raw) as AppData
  } catch {
    const seed = createSeedData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
    return seed
  }
}

function write(data: AppData): AppData {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}

function mutate(fn: (data: AppData) => void): AppData {
  const data = read()
  fn(data)
  return write(data)
}

export const localStorageAdapter: DataAdapter = {
  async getAll() {
    return read()
  },

  async replaceAll(data) {
    return write(data)
  },

  async getCategories() {
    return read().categories
  },

  async createCategory(input: CreateCategoryInput) {
    const ts = nowIso()
    const category: Category = {
      ...input,
      id: createId('cat'),
      createdAt: ts,
      updatedAt: ts,
    }
    mutate((d) => {
      d.categories.push(category)
    })
    return category
  },

  async updateCategory(input: UpdateCategoryInput) {
    let updated!: Category
    mutate((d) => {
      const idx = d.categories.findIndex((c) => c.id === input.id)
      if (idx < 0) throw new Error('카테고리를 찾을 수 없습니다.')
      const prev = d.categories[idx]
      if (prev.isUncategorized && input.name !== undefined) {
        throw new Error('미분류 카테고리는 수정할 수 없습니다.')
      }
      updated = {
        ...prev,
        ...input,
        updatedAt: nowIso(),
      }
      d.categories[idx] = updated
    })
    return updated
  },

  async deleteCategory(id: string) {
    mutate((d) => {
      const cat = d.categories.find((c) => c.id === id)
      if (!cat) return
      if (cat.isUncategorized) throw new Error('미분류 카테고리는 삭제할 수 없습니다.')
      d.categories = d.categories.filter((c) => c.id !== id)
      d.expenses = d.expenses.map((e) =>
        e.categoryId === id ? { ...e, categoryId: UNCATEGORIZED_ID, updatedAt: nowIso() } : e,
      )
      d.recurrings = d.recurrings.map((r) =>
        r.categoryId === id ? { ...r, categoryId: UNCATEGORIZED_ID, updatedAt: nowIso() } : r,
      )
    })
  },

  async getPaymentMethods() {
    return read().paymentMethods
  },

  async createPaymentMethod(input: CreatePaymentMethodInput) {
    const ts = nowIso()
    const method: PaymentMethod = {
      ...input,
      id: createId('pm'),
      createdAt: ts,
      updatedAt: ts,
    }
    mutate((d) => {
      d.paymentMethods.push(method)
    })
    return method
  },

  async updatePaymentMethod(input: UpdatePaymentMethodInput) {
    let updated!: PaymentMethod
    mutate((d) => {
      const idx = d.paymentMethods.findIndex((p) => p.id === input.id)
      if (idx < 0) throw new Error('결제수단을 찾을 수 없습니다.')
      updated = { ...d.paymentMethods[idx], ...input, updatedAt: nowIso() }
      d.paymentMethods[idx] = updated
    })
    return updated
  },

  async deletePaymentMethod(id: string) {
    mutate((d) => {
      d.paymentMethods = d.paymentMethods.filter((p) => p.id !== id)
      d.expenses = d.expenses.map((e) =>
        e.paymentMethodId === id
          ? { ...e, paymentMethodId: null, updatedAt: nowIso() }
          : e,
      )
      d.recurrings = d.recurrings.map((r) =>
        r.paymentMethodId === id
          ? { ...r, paymentMethodId: null, updatedAt: nowIso() }
          : r,
      )
    })
  },

  async getExpenses() {
    return read().expenses
  },

  async createExpense(input: CreateExpenseInput) {
    const ts = nowIso()
    const expense: Expense = {
      ...input,
      id: createId('exp'),
      createdAt: ts,
      updatedAt: ts,
    }
    mutate((d) => {
      d.expenses.push(expense)
    })
    return expense
  },

  async updateExpense(input: UpdateExpenseInput) {
    let updated!: Expense
    mutate((d) => {
      const idx = d.expenses.findIndex((e) => e.id === input.id)
      if (idx < 0) throw new Error('지출을 찾을 수 없습니다.')
      updated = { ...d.expenses[idx], ...input, updatedAt: nowIso() }
      d.expenses[idx] = updated
    })
    return updated
  },

  async deleteExpense(id: string) {
    mutate((d) => {
      d.expenses = d.expenses.filter((e) => e.id !== id)
    })
  },

  async getRecurrings() {
    return read().recurrings
  },

  async createRecurring(input: CreateRecurringInput) {
    const ts = nowIso()
    const recurring: Recurring = {
      ...input,
      id: createId('rec'),
      createdAt: ts,
      updatedAt: ts,
    }
    mutate((d) => {
      d.recurrings.push(recurring)
    })
    return recurring
  },

  async updateRecurring(input: UpdateRecurringInput) {
    let updated!: Recurring
    mutate((d) => {
      const idx = d.recurrings.findIndex((r) => r.id === input.id)
      if (idx < 0) throw new Error('반복 지출을 찾을 수 없습니다.')
      updated = { ...d.recurrings[idx], ...input, updatedAt: nowIso() }
      d.recurrings[idx] = updated
    })
    return updated
  },

  async deleteRecurring(id: string) {
    mutate((d) => {
      d.recurrings = d.recurrings.filter((r) => r.id !== id)
    })
  },

  async getBudget() {
    return read().budget
  },

  async updateBudget(input: Partial<BudgetSettings>) {
    let updated!: BudgetSettings
    mutate((d) => {
      updated = { ...d.budget, ...input }
      d.budget = updated
    })
    return updated
  },
}

export { STORAGE_KEY }
