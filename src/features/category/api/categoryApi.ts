import { adapter } from '@/shared/storage'
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/shared/storage'

export const categoryApi = {
  list: () => adapter.getCategories(),
  create: (input: CreateCategoryInput) => adapter.createCategory(input),
  update: (input: UpdateCategoryInput) => adapter.updateCategory(input),
  remove: (id: string) => adapter.deleteCategory(id),
}
