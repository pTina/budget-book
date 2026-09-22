import type { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/queryKeys'

export async function invalidateAll(
  qc: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.all }),
    qc.invalidateQueries({ queryKey: queryKeys.categories }),
    qc.invalidateQueries({ queryKey: queryKeys.paymentMethods }),
    qc.invalidateQueries({ queryKey: queryKeys.expenses }),
    qc.invalidateQueries({ queryKey: queryKeys.recurrings }),
    qc.invalidateQueries({ queryKey: queryKeys.budget }),
  ])
}
