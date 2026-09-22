import { adapter } from '@/shared/storage'
import type {
  CreateExpenseInput,
  CreateRecurringInput,
  UpdateExpenseInput,
  UpdateRecurringInput,
} from '@/shared/storage'

export const expenseApi = {
  list: () => adapter.getExpenses(),
  create: (input: CreateExpenseInput) => adapter.createExpense(input),
  update: (input: UpdateExpenseInput) => adapter.updateExpense(input),
  remove: (id: string) => adapter.deleteExpense(id),
}

export const recurringApi = {
  list: () => adapter.getRecurrings(),
  create: (input: CreateRecurringInput) => adapter.createRecurring(input),
  update: (input: UpdateRecurringInput) => adapter.updateRecurring(input),
  remove: (id: string) => adapter.deleteRecurring(id),
}
