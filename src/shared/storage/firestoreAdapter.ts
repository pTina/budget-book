import { requireUid } from '@/shared/lib/auth'
import { getFirestoreDb } from '@/shared/lib/firebase'
import { createId } from '@/shared/lib/id'
import type {
  AppData,
  AssetCategory,
  AssetEntry,
  BudgetSettings,
  Category,
  Expense,
  PaymentMethod,
  Recurring,
} from '@/shared/types'
import { createSeedData, UNCATEGORIZED_ID } from './seed'
import type {
  CreateAssetCategoryInput,
  CreateAssetEntryInput,
  CreateCategoryInput,
  CreateExpenseInput,
  CreatePaymentMethodInput,
  CreateRecurringInput,
  DataAdapter,
  UpdateAssetCategoryInput,
  UpdateAssetEntryInput,
  UpdateCategoryInput,
  UpdateExpenseInput,
  UpdatePaymentMethodInput,
  UpdateRecurringInput,
} from './types'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'

type Cache = {
  categories: Category[] | null
  paymentMethods: PaymentMethod[] | null
  expenses: Expense[] | null
  recurrings: Recurring[] | null
  budget: BudgetSettings | null
  assetCategories: AssetCategory[] | null
  assetEntries: AssetEntry[] | null
  seeded: boolean
}

const cache: Cache = {
  categories: null,
  paymentMethods: null,
  expenses: null,
  recurrings: null,
  budget: null,
  assetCategories: null,
  assetEntries: null,
  seeded: false,
}

const DEFAULT_BUDGET: BudgetSettings = {
  enabled: true,
  defaultAmount: 1_000_000,
  applyToNextMonth: true,
  monthlyAmounts: {},
}

function nowIso() {
  return new Date().toISOString()
}

function userRef() {
  return doc(getFirestoreDb(), 'users', requireUid())
}

function col(name: string) {
  return collection(userRef(), name)
}

function budgetRef() {
  return doc(col('settings'), 'budget')
}

function omitUndefined<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, omitUndefined(item)]),
  ) as T
}

async function seedIfNeeded() {
  if (cache.seeded) return

  const [catSnap, pmSnap, budgetSnap, assetCatSnap] = await Promise.all([
    getDocs(col('categories')),
    getDocs(col('paymentMethods')),
    getDoc(budgetRef()),
    getDocs(col('assetCategories')),
  ])

  if (catSnap.empty && pmSnap.empty && !budgetSnap.exists()) {
    const seed = createSeedData()
    const batch = writeBatch(getFirestoreDb())
    seed.categories.forEach((c) => batch.set(doc(col('categories'), c.id), omitUndefined(c)))
    seed.paymentMethods.forEach((p) =>
      batch.set(doc(col('paymentMethods'), p.id), omitUndefined(p)),
    )
    seed.assetCategories.forEach((c) =>
      batch.set(doc(col('assetCategories'), c.id), omitUndefined(c)),
    )
    batch.set(budgetRef(), omitUndefined(seed.budget))
    await batch.commit()
    cache.categories = seed.categories
    cache.paymentMethods = seed.paymentMethods
    cache.expenses = []
    cache.recurrings = []
    cache.budget = seed.budget
    cache.assetCategories = seed.assetCategories
    cache.assetEntries = []
  } else {
    cache.categories = catSnap.docs.map((d) => d.data() as Category)
    cache.paymentMethods = pmSnap.docs.map((d) => d.data() as PaymentMethod)
    cache.budget = budgetSnap.exists()
      ? { ...DEFAULT_BUDGET, ...(budgetSnap.data() as BudgetSettings) }
      : DEFAULT_BUDGET

    if (!budgetSnap.exists()) {
      await setDoc(budgetRef(), cache.budget)
    }

    const hasUncategorized = cache.categories.some((c) => c.id === UNCATEGORIZED_ID)
    if (!hasUncategorized) {
      const seed = createSeedData()
      const unc = seed.categories.find((c) => c.id === UNCATEGORIZED_ID)!
      await setDoc(doc(col('categories'), unc.id), omitUndefined(unc))
      cache.categories = [unc, ...cache.categories]
    }

    if (assetCatSnap.empty) {
      const entrySnap = await getDocs(col('assetEntries'))
      if (entrySnap.empty) {
        const seed = createSeedData()
        const batch = writeBatch(getFirestoreDb())
        seed.assetCategories.forEach((c) =>
          batch.set(doc(col('assetCategories'), c.id), omitUndefined(c)),
        )
        await batch.commit()
        cache.assetCategories = seed.assetCategories
      } else {
        cache.assetCategories = []
      }
    } else {
      cache.assetCategories = assetCatSnap.docs.map((d) => d.data() as AssetCategory)
    }
  }

  cache.seeded = true
}

async function loadExpenses() {
  if (cache.expenses) {
    cache.expenses = dedupeById(cache.expenses)
    return cache.expenses
  }
  const snap = await getDocs(col('expenses'))
  cache.expenses = snap.docs.map((d) => d.data() as Expense)
  return cache.expenses
}

async function loadRecurrings() {
  if (cache.recurrings) {
    cache.recurrings = dedupeById(cache.recurrings)
    return cache.recurrings
  }
  const snap = await getDocs(col('recurrings'))
  cache.recurrings = snap.docs.map((d) => d.data() as Recurring)
  return cache.recurrings
}

async function loadAssetEntries() {
  if (cache.assetEntries) {
    cache.assetEntries = dedupeById(cache.assetEntries)
    return cache.assetEntries
  }
  const snap = await getDocs(col('assetEntries'))
  cache.assetEntries = snap.docs.map((d) => d.data() as AssetEntry)
  return cache.assetEntries
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id)
  if (idx < 0) return [...list, item]
  const next = list.slice()
  next[idx] = item
  return next
}

function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of list) map.set(item.id, item)
  return [...map.values()]
}

export function clearStorageCache() {
  cache.categories = null
  cache.paymentMethods = null
  cache.expenses = null
  cache.recurrings = null
  cache.budget = null
  cache.assetCategories = null
  cache.assetEntries = null
  cache.seeded = false
}

export function subscribeUserData(onChange: () => void): Unsubscribe {
  const uid = requireUid()
  const root = doc(getFirestoreDb(), 'users', uid)

  const unsubs = [
    onSnapshot(collection(root, 'categories'), (snap) => {
      cache.categories = snap.docs.map((d) => d.data() as Category)
      onChange()
    }),
    onSnapshot(collection(root, 'paymentMethods'), (snap) => {
      cache.paymentMethods = snap.docs.map((d) => d.data() as PaymentMethod)
      onChange()
    }),
    onSnapshot(collection(root, 'expenses'), (snap) => {
      cache.expenses = snap.docs.map((d) => d.data() as Expense)
      onChange()
    }),
    onSnapshot(collection(root, 'recurrings'), (snap) => {
      cache.recurrings = snap.docs.map((d) => d.data() as Recurring)
      onChange()
    }),
    onSnapshot(doc(collection(root, 'settings'), 'budget'), (snap) => {
      cache.budget = snap.exists()
        ? { ...DEFAULT_BUDGET, ...(snap.data() as BudgetSettings) }
        : DEFAULT_BUDGET
      onChange()
    }),
    onSnapshot(collection(root, 'assetCategories'), (snap) => {
      cache.assetCategories = snap.docs.map((d) => d.data() as AssetCategory)
      onChange()
    }),
    onSnapshot(collection(root, 'assetEntries'), (snap) => {
      cache.assetEntries = snap.docs.map((d) => d.data() as AssetEntry)
      onChange()
    }),
  ]

  return () => unsubs.forEach((stop) => stop())
}

export const firestoreAdapter: DataAdapter = {
  async getAll() {
    await seedIfNeeded()
    const [expenses, recurrings, assetEntries] = await Promise.all([
      loadExpenses(),
      loadRecurrings(),
      loadAssetEntries(),
    ])
    return {
      version: 1 as const,
      categories: cache.categories ?? [],
      paymentMethods: cache.paymentMethods ?? [],
      expenses,
      recurrings,
      budget: cache.budget ?? DEFAULT_BUDGET,
      assetCategories: cache.assetCategories ?? [],
      assetEntries,
    }
  },

  async replaceAll(data: AppData) {
    const batch = writeBatch(getFirestoreDb())
    ;(await getDocs(col('categories'))).docs.forEach((d) => batch.delete(d.ref))
    ;(await getDocs(col('paymentMethods'))).docs.forEach((d) => batch.delete(d.ref))
    ;(await getDocs(col('expenses'))).docs.forEach((d) => batch.delete(d.ref))
    ;(await getDocs(col('recurrings'))).docs.forEach((d) => batch.delete(d.ref))
    ;(await getDocs(col('assetCategories'))).docs.forEach((d) => batch.delete(d.ref))
    ;(await getDocs(col('assetEntries'))).docs.forEach((d) => batch.delete(d.ref))
    data.categories.forEach((c) => batch.set(doc(col('categories'), c.id), omitUndefined(c)))
    data.paymentMethods.forEach((p) =>
      batch.set(doc(col('paymentMethods'), p.id), omitUndefined(p)),
    )
    data.expenses.forEach((e) => batch.set(doc(col('expenses'), e.id), omitUndefined(e)))
    data.recurrings.forEach((r) => batch.set(doc(col('recurrings'), r.id), omitUndefined(r)))
    data.assetCategories.forEach((c) =>
      batch.set(doc(col('assetCategories'), c.id), omitUndefined(c)),
    )
    data.assetEntries.forEach((e) =>
      batch.set(doc(col('assetEntries'), e.id), omitUndefined(e)),
    )
    batch.set(budgetRef(), omitUndefined(data.budget))
    await batch.commit()
    cache.categories = data.categories
    cache.paymentMethods = data.paymentMethods
    cache.expenses = data.expenses
    cache.recurrings = data.recurrings
    cache.budget = data.budget
    cache.assetCategories = data.assetCategories
    cache.assetEntries = data.assetEntries
    cache.seeded = true
    return data
  },

  async getCategories() {
    await seedIfNeeded()
    return cache.categories ?? []
  },

  async createCategory(input: CreateCategoryInput) {
    const ts = nowIso()
    const category: Category = { ...input, id: createId('cat'), createdAt: ts, updatedAt: ts }
    await setDoc(doc(col('categories'), category.id), omitUndefined(category))
    cache.categories = upsertById(cache.categories ?? [], category)
    return category
  },

  async updateCategory(input: UpdateCategoryInput) {
    await seedIfNeeded()
    const list = cache.categories ?? []
    const prev = list.find((c) => c.id === input.id)
    if (!prev) throw new Error('카테고리를 찾을 수 없습니다.')
    if (prev.isUncategorized && input.name !== undefined) {
      throw new Error('미분류 카테고리는 수정할 수 없습니다.')
    }
    const updated: Category = { ...prev, ...input, updatedAt: nowIso() }
    await setDoc(doc(col('categories'), updated.id), omitUndefined(updated))
    cache.categories = list.map((c) => (c.id === updated.id ? updated : c))
    return updated
  },

  async deleteCategory(id: string) {
    await seedIfNeeded()
    const list = cache.categories ?? []
    const cat = list.find((c) => c.id === id)
    if (!cat) return
    if (cat.isUncategorized) throw new Error('미분류 카테고리는 삭제할 수 없습니다.')

    const expenses = await loadExpenses()
    const recurrings = await loadRecurrings()
    const batch = writeBatch(getFirestoreDb())
    batch.delete(doc(col('categories'), id))
    const ts = nowIso()
    expenses.forEach((e) => {
      if (e.categoryId !== id) return
      const next = { ...e, categoryId: UNCATEGORIZED_ID, updatedAt: ts }
      batch.set(doc(col('expenses'), e.id), omitUndefined(next))
    })
    recurrings.forEach((r) => {
      if (r.categoryId !== id) return
      const next = { ...r, categoryId: UNCATEGORIZED_ID, updatedAt: ts }
      batch.set(doc(col('recurrings'), r.id), omitUndefined(next))
    })
    await batch.commit()
    cache.categories = list.filter((c) => c.id !== id)
    cache.expenses = expenses.map((e) =>
      e.categoryId === id ? { ...e, categoryId: UNCATEGORIZED_ID, updatedAt: ts } : e,
    )
    cache.recurrings = recurrings.map((r) =>
      r.categoryId === id ? { ...r, categoryId: UNCATEGORIZED_ID, updatedAt: ts } : r,
    )
  },

  async getPaymentMethods() {
    await seedIfNeeded()
    return cache.paymentMethods ?? []
  },

  async createPaymentMethod(input: CreatePaymentMethodInput) {
    const ts = nowIso()
    const method: PaymentMethod = { ...input, id: createId('pm'), createdAt: ts, updatedAt: ts }
    await setDoc(doc(col('paymentMethods'), method.id), omitUndefined(method))
    cache.paymentMethods = upsertById(cache.paymentMethods ?? [], method)
    return method
  },

  async updatePaymentMethod(input: UpdatePaymentMethodInput) {
    await seedIfNeeded()
    const list = cache.paymentMethods ?? []
    const prev = list.find((p) => p.id === input.id)
    if (!prev) throw new Error('결제수단을 찾을 수 없습니다.')
    const updated: PaymentMethod = { ...prev, ...input, updatedAt: nowIso() }
    await setDoc(doc(col('paymentMethods'), updated.id), omitUndefined(updated))
    cache.paymentMethods = list.map((p) => (p.id === updated.id ? updated : p))
    return updated
  },

  async deletePaymentMethod(id: string) {
    const expenses = await loadExpenses()
    const recurrings = await loadRecurrings()
    const batch = writeBatch(getFirestoreDb())
    batch.delete(doc(col('paymentMethods'), id))
    const ts = nowIso()
    expenses.forEach((e) => {
      if (e.paymentMethodId !== id) return
      batch.set(doc(col('expenses'), e.id), omitUndefined({ ...e, paymentMethodId: null, updatedAt: ts }))
    })
    recurrings.forEach((r) => {
      if (r.paymentMethodId !== id) return
      batch.set(
        doc(col('recurrings'), r.id),
        omitUndefined({ ...r, paymentMethodId: null, updatedAt: ts }),
      )
    })
    await batch.commit()
    cache.paymentMethods = (cache.paymentMethods ?? []).filter((p) => p.id !== id)
    cache.expenses = expenses.map((e) =>
      e.paymentMethodId === id ? { ...e, paymentMethodId: null, updatedAt: ts } : e,
    )
    cache.recurrings = recurrings.map((r) =>
      r.paymentMethodId === id ? { ...r, paymentMethodId: null, updatedAt: ts } : r,
    )
  },

  async getExpenses() {
    await seedIfNeeded()
    return loadExpenses()
  },

  async createExpense(input: CreateExpenseInput) {
    const ts = nowIso()
    const expense: Expense = { ...input, id: createId('exp'), createdAt: ts, updatedAt: ts }
    await setDoc(doc(col('expenses'), expense.id), omitUndefined(expense))
    cache.expenses = upsertById(await loadExpenses(), expense)
    return expense
  },

  async updateExpense(input: UpdateExpenseInput) {
    const list = await loadExpenses()
    const prev = list.find((e) => e.id === input.id)
    if (!prev) throw new Error('지출을 찾을 수 없습니다.')
    const updated: Expense = { ...prev, ...input, updatedAt: nowIso() }
    await setDoc(doc(col('expenses'), updated.id), omitUndefined(updated))
    cache.expenses = list.map((e) => (e.id === updated.id ? updated : e))
    return updated
  },

  async deleteExpense(id: string) {
    await deleteDoc(doc(col('expenses'), id))
    cache.expenses = (await loadExpenses()).filter((e) => e.id !== id)
  },

  async getRecurrings() {
    await seedIfNeeded()
    return loadRecurrings()
  },

  async createRecurring(input: CreateRecurringInput) {
    const ts = nowIso()
    const recurring: Recurring = { ...input, id: createId('rec'), createdAt: ts, updatedAt: ts }
    await setDoc(doc(col('recurrings'), recurring.id), omitUndefined(recurring))
    cache.recurrings = upsertById(await loadRecurrings(), recurring)
    return recurring
  },

  async updateRecurring(input: UpdateRecurringInput) {
    const list = await loadRecurrings()
    const prev = list.find((r) => r.id === input.id)
    if (!prev) throw new Error('반복 지출을 찾을 수 없습니다.')
    const updated: Recurring = { ...prev, ...input, updatedAt: nowIso() }
    await setDoc(doc(col('recurrings'), updated.id), omitUndefined(updated))
    cache.recurrings = list.map((r) => (r.id === updated.id ? updated : r))
    return updated
  },

  async deleteRecurring(id: string) {
    await deleteDoc(doc(col('recurrings'), id))
    cache.recurrings = (await loadRecurrings()).filter((r) => r.id !== id)
  },

  async getBudget() {
    await seedIfNeeded()
    return cache.budget ?? DEFAULT_BUDGET
  },

  async updateBudget(input: Partial<BudgetSettings>) {
    await seedIfNeeded()
    const updated: BudgetSettings = { ...(cache.budget ?? DEFAULT_BUDGET), ...input }
    await setDoc(budgetRef(), omitUndefined(updated))
    cache.budget = updated
    return updated
  },

  async getAssetCategories() {
    await seedIfNeeded()
    return cache.assetCategories ?? []
  },

  async createAssetCategory(input: CreateAssetCategoryInput) {
    await seedIfNeeded()
    const name = input.name.trim()
    const dup = (cache.assetCategories ?? []).some((c) => c.name === name)
    if (dup) throw new Error('같은 이름의 자산 카테고리가 있어요.')
    const ts = nowIso()
    const category: AssetCategory = { ...input, name, id: createId('acat'), createdAt: ts, updatedAt: ts }
    await setDoc(doc(col('assetCategories'), category.id), omitUndefined(category))
    cache.assetCategories = upsertById(cache.assetCategories ?? [], category)
    return category
  },

  async updateAssetCategory(input: UpdateAssetCategoryInput) {
    await seedIfNeeded()
    const list = cache.assetCategories ?? []
    const prev = list.find((c) => c.id === input.id)
    if (!prev) throw new Error('자산 카테고리를 찾을 수 없습니다.')
    const nextName = input.name
    if (nextName !== undefined) {
      const dup = list.some((c) => c.id !== input.id && c.name === nextName.trim())
      if (dup) throw new Error('같은 이름의 자산 카테고리가 있어요.')
    }
    const updated: AssetCategory = {
      ...prev,
      ...input,
      name: nextName !== undefined ? nextName.trim() : prev.name,
      updatedAt: nowIso(),
    }
    await setDoc(doc(col('assetCategories'), updated.id), omitUndefined(updated))
    cache.assetCategories = list.map((c) => (c.id === updated.id ? updated : c))
    return updated
  },

  async deleteAssetCategory(id: string) {
    await seedIfNeeded()
    const entries = await loadAssetEntries()
    const batch = writeBatch(getFirestoreDb())
    batch.delete(doc(col('assetCategories'), id))
    const ts = nowIso()
    entries.forEach((e) => {
      if (e.categoryId !== id) return
      batch.set(doc(col('assetEntries'), e.id), omitUndefined({ ...e, categoryId: null, updatedAt: ts }))
    })
    await batch.commit()
    cache.assetCategories = (cache.assetCategories ?? []).filter((c) => c.id !== id)
    cache.assetEntries = entries.map((e) =>
      e.categoryId === id ? { ...e, categoryId: null, updatedAt: ts } : e,
    )
  },

  async getAssetEntries() {
    await seedIfNeeded()
    return loadAssetEntries()
  },

  async createAssetEntry(input: CreateAssetEntryInput) {
    const ts = nowIso()
    const entry: AssetEntry = { ...input, id: createId('aent'), createdAt: ts, updatedAt: ts }
    await setDoc(doc(col('assetEntries'), entry.id), omitUndefined(entry))
    cache.assetEntries = upsertById(await loadAssetEntries(), entry)
    return entry
  },

  async updateAssetEntry(input: UpdateAssetEntryInput) {
    const list = await loadAssetEntries()
    const prev = list.find((e) => e.id === input.id)
    if (!prev) throw new Error('자산 기록을 찾을 수 없습니다.')
    const updated: AssetEntry = { ...prev, ...input, updatedAt: nowIso() }
    await setDoc(doc(col('assetEntries'), updated.id), omitUndefined(updated))
    cache.assetEntries = list.map((e) => (e.id === updated.id ? updated : e))
    return updated
  },

  async deleteAssetEntry(id: string) {
    await deleteDoc(doc(col('assetEntries'), id))
    cache.assetEntries = (await loadAssetEntries()).filter((e) => e.id !== id)
  },
}
