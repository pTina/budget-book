import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoryApi } from '../api/categoryApi'
import { queryKeys } from '@/shared/lib/queryKeys'
import { invalidateAll } from '@/shared/lib/invalidateAll'
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/shared/storage'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoryApi.list(),
  })
}

export function useCategoryMutations() {
  const qc = useQueryClient()
  return {
    create: useMutation({
      mutationFn: (input: CreateCategoryInput) => categoryApi.create(input),
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: (input: UpdateCategoryInput) => categoryApi.update(input),
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: (id: string) => categoryApi.remove(id),
      onSuccess: () => invalidateAll(qc),
    }),
  }
}
