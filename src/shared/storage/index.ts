import type { DataAdapter } from './types'
import { firestoreAdapter } from './firestoreAdapter'

/** 현재 활성 어댑터 — Firestore (기기 간 동기화) */
export const adapter: DataAdapter = firestoreAdapter

export type { DataAdapter } from './types'
export type {
  CreateCategoryInput,
  CreateExpenseInput,
  CreatePaymentMethodInput,
  CreateRecurringInput,
  UpdateCategoryInput,
  UpdateExpenseInput,
  UpdatePaymentMethodInput,
  UpdateRecurringInput,
} from './types'
export { UNCATEGORIZED_ID, CATEGORY_PALETTE, createSeedData } from './seed'
export { clearStorageCache, subscribeUserData } from './firestoreAdapter'
