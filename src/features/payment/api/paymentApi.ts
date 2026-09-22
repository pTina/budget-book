import { adapter } from '@/shared/storage'
import type {
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
} from '@/shared/storage'

export const paymentApi = {
  list: () => adapter.getPaymentMethods(),
  create: (input: CreatePaymentMethodInput) => adapter.createPaymentMethod(input),
  update: (input: UpdatePaymentMethodInput) => adapter.updatePaymentMethod(input),
  remove: (id: string) => adapter.deletePaymentMethod(id),
}
