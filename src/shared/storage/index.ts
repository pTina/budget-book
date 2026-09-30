import type { DataAdapter } from './types'
import { firestoreAdapter } from './firestoreAdapter'

/** 현재 활성 어댑터 — Firestore (기기 간 동기화) */
export const adapter: DataAdapter = firestoreAdapter

export type { DataAdapter } from './types'
export type {
  CreateAssetCategoryInput,
  CreateAssetEntryInput,
  CreateCategoryInput,
  CreateExpenseInput,
  CreatePaymentMethodInput,
  CreateRecurringInput,
  UpdateAssetCategoryInput,
  UpdateAssetEntryInput,
  UpdateCategoryInput,
  UpdateExpenseInput,
  UpdatePaymentMethodInput,
  UpdateRecurringInput,
} from './types'
export { UNCATEGORIZED_ID, CATEGORY_PALETTE, ASSET_UNCATEGORIZED_COLOR, createSeedData } from './seed'
export { clearStorageCache, subscribeUserData } from './firestoreAdapter'
