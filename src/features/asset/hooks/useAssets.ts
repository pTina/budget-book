import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { assetCategoryApi, assetEntryApi } from '../api/assetApi'
import { queryKeys } from '@/shared/lib/queryKeys'
import { invalidateAll } from '@/shared/lib/invalidateAll'
import type {
  CreateAssetCategoryInput,
  CreateAssetEntryInput,
  UpdateAssetCategoryInput,
  UpdateAssetEntryInput,
} from '@/shared/storage'

export function useAssetCategories() {
  return useQuery({
    queryKey: queryKeys.assetCategories,
    queryFn: () => assetCategoryApi.list(),
    select: (list) => [...list].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  })
}

export function useAssetEntries() {
  return useQuery({
    queryKey: queryKeys.assetEntries,
    queryFn: () => assetEntryApi.list(),
  })
}

export function useAssetCategoryMutations() {
  const qc = useQueryClient()
  return {
    create: useMutation({
      mutationFn: (input: CreateAssetCategoryInput) => assetCategoryApi.create(input),
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: (input: UpdateAssetCategoryInput) => assetCategoryApi.update(input),
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: (id: string) => assetCategoryApi.remove(id),
      onSuccess: () => invalidateAll(qc),
    }),
  }
}

export function useAssetEntryMutations() {
  const qc = useQueryClient()
  return {
    create: useMutation({
      mutationFn: (input: CreateAssetEntryInput) => assetEntryApi.create(input),
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: (input: UpdateAssetEntryInput) => assetEntryApi.update(input),
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: (id: string) => assetEntryApi.remove(id),
      onSuccess: () => invalidateAll(qc),
    }),
  }
}
