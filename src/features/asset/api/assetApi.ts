import { adapter } from '@/shared/storage'
import type {
  CreateAssetCategoryInput,
  CreateAssetEntryInput,
  UpdateAssetCategoryInput,
  UpdateAssetEntryInput,
} from '@/shared/storage'

export const assetCategoryApi = {
  list: () => adapter.getAssetCategories(),
  create: (input: CreateAssetCategoryInput) => adapter.createAssetCategory(input),
  update: (input: UpdateAssetCategoryInput) => adapter.updateAssetCategory(input),
  remove: (id: string) => adapter.deleteAssetCategory(id),
}

export const assetEntryApi = {
  list: () => adapter.getAssetEntries(),
  create: (input: CreateAssetEntryInput) => adapter.createAssetEntry(input),
  update: (input: UpdateAssetEntryInput) => adapter.updateAssetEntry(input),
  remove: (id: string) => adapter.deleteAssetEntry(id),
}
