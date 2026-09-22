import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentApi } from '../api/paymentApi'
import { queryKeys } from '@/shared/lib/queryKeys'
import { invalidateAll } from '@/shared/lib/invalidateAll'
import type {
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
} from '@/shared/storage'

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.paymentMethods,
    queryFn: () => paymentApi.list(),
  })
}

export function usePaymentMethodMutations() {
  const qc = useQueryClient()
  return {
    create: useMutation({
      mutationFn: (input: CreatePaymentMethodInput) => paymentApi.create(input),
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: (input: UpdatePaymentMethodInput) => paymentApi.update(input),
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: (id: string) => paymentApi.remove(id),
      onSuccess: () => invalidateAll(qc),
    }),
  }
}
