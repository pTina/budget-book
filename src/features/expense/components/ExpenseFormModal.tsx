import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { parseISO } from 'date-fns'
import { Modal } from '@/shared/ui/Modal'
import { Chip } from '@/shared/ui/Chip'
import { useCategories, useCategoryMutations } from '@/features/category/hooks/useCategories'
import {
  usePaymentMethods,
  usePaymentMethodMutations,
} from '@/features/payment/hooks/usePaymentMethods'
import {
  useDisplayExpenses,
  useExpenseMutations,
  useExpenses,
  useRecurringMutations,
  useRecurrings,
} from '../hooks/useExpenses'
import { useDeleteExpense } from '../hooks/useDeleteExpense'
import { useUiStore } from '@/store/useUiStore'
import { formatAmount, parseAmountInput } from '@/shared/lib/format'
import {
  buildThisOnlyDelete,
  buildThisOnlyUpdate,
  splitRecurringFromDate,
} from '../utils/recurring'
import { CATEGORY_PALETTE } from '@/shared/storage'
import type { DisplayExpense } from '@/shared/types'

type FormState = {
  amount: string
  title: string
  date: string
  categoryId: string
  paymentMethodId: string
  recurring: boolean
  dayOfMonth: string
  endDate: string
  memo: string
  excluded: boolean
}

type Errors = Partial<Record<keyof FormState, string>>

function emptyForm(date: string, categoryId: string, recurringOn: boolean): FormState {
  return {
    amount: '',
    title: '',
    date,
    categoryId,
    paymentMethodId: '',
    recurring: recurringOn,
    dayOfMonth: String(Number(date.slice(8, 10))),
    endDate: '',
    memo: '',
    excluded: false,
  }
}

export function ExpenseFormModal() {
  const open = useUiStore((s) => s.expenseFormOpen)
  const formId = useUiStore((s) => s.expenseFormId)
  const recurringOn = useUiStore((s) => s.expenseFormRecurringOn)
  const selectedDate = useUiStore((s) => s.selectedDate)
  const closeExpenseForm = useUiStore((s) => s.closeExpenseForm)
  const askScope = useUiStore((s) => s.askScope)
  const { deleteExpense } = useDeleteExpense()

  const { data: categories = [] } = useCategories()
  const { data: methods = [] } = usePaymentMethods()
  const { data: recurrings = [] } = useRecurrings()
  const { data: expenses = [] } = useExpenses()
  const { display } = useDisplayExpenses()
  const expenseMut = useExpenseMutations()
  const recurringMut = useRecurringMutations()
  const categoryMut = useCategoryMutations()
  const methodMut = usePaymentMethodMutations()

  const editableCategories = categories.filter((c) => !c.isUncategorized)
  const defaultCat = editableCategories[0]?.id ?? categories[0]?.id ?? ''

  const target = useMemo<DisplayExpense | null>(() => {
    if (!formId) return null
    return display.find((e) => e.id === formId) ?? null
  }, [formId, display])

  const isEdit = Boolean(formId)
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(selectedDate, defaultCat, recurringOn),
  )
  const [errors, setErrors] = useState<Errors>({})
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingMethod, setAddingMethod] = useState(false)
  const [newMethodName, setNewMethodName] = useState('')

  useEffect(() => {
    if (!open) return
    if (formId && !target) return
    if (target) {
      const sourceRecurring = target.recurringId
        ? recurrings.find((r) => r.id === target.recurringId)
        : undefined
      setForm({
        amount: String(target.amount),
        title: target.title,
        date: target.date,
        categoryId: target.categoryId,
        paymentMethodId: target.paymentMethodId ?? '',
        recurring: Boolean(target.recurringId),
        dayOfMonth: String(
          sourceRecurring?.dayOfMonth ?? Number(target.date.slice(8, 10)),
        ),
        endDate: sourceRecurring?.endDate ?? '',
        memo: target.memo ?? '',
        excluded: Boolean(target.excluded),
      })
    } else {
      setForm(emptyForm(selectedDate, defaultCat, recurringOn))
    }
    setErrors({})
    setAddingCategory(false)
    setAddingMethod(false)
  }, [open, formId, target, selectedDate, defaultCat, recurringOn, recurrings])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Errors = {}
    const amount = parseAmountInput(form.amount)
    if (amount === null || amount <= 0) next.amount = '금액을 입력하세요'
    if (!form.title.trim()) next.title = '내용을 입력하세요'
    if (!form.date) next.date = '날짜를 선택하세요'
    if (!form.categoryId) next.categoryId = '카테고리를 선택하세요'
    if (methods.length > 0 && !form.paymentMethodId) {
      next.paymentMethodId = '결제수단을 선택하세요'
    }
    if (form.recurring) {
      const day = Number(form.dayOfMonth)
      if (!day || day < 1 || day > 31) next.dayOfMonth = '결제일을 1–31로 입력하세요'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const saveNew = async () => {
    if (!validate()) return
    const amount = parseAmountInput(form.amount)!

    if (form.recurring) {
      await recurringMut.create.mutateAsync({
        title: form.title.trim(),
        amount,
        categoryId: form.categoryId,
        paymentMethodId: form.paymentMethodId || null,
        frequency: 'monthly',
        dayOfMonth: Number(form.dayOfMonth),
        startDate: form.date,
        endDate: form.endDate || null,
        memo: form.memo.trim() || undefined,
        excluded: form.excluded || undefined,
      })
    } else {
      await expenseMut.create.mutateAsync({
        title: form.title.trim(),
        amount,
        date: form.date,
        categoryId: form.categoryId,
        paymentMethodId: form.paymentMethodId || null,
        memo: form.memo.trim() || undefined,
        excluded: form.excluded || undefined,
      })
    }
    closeExpenseForm()
  }

  const saveEdit = async () => {
    if (!target || !validate()) return
    const amount = parseAmountInput(form.amount)!
    const patch = {
      amount,
      title: form.title.trim(),
      date: form.date,
      categoryId: form.categoryId,
      paymentMethodId: form.paymentMethodId || null,
      memo: form.memo.trim() || undefined,
      excluded: form.excluded,
    }

    const oneOffExpense = {
      title: patch.title,
      amount: patch.amount,
      date: patch.date,
      categoryId: patch.categoryId,
      paymentMethodId: patch.paymentMethodId,
      memo: patch.memo,
      excluded: patch.excluded || undefined,
    }

    // 반복 → 일반 지출 전환
    if (target.recurringId && !form.recurring) {
      const scope = await askScope()
      if (!scope) return

      if (scope === 'this') {
        const skip = buildThisOnlyDelete(target)
        if (skip.type === 'skip' && skip.expense) {
          await expenseMut.create.mutateAsync(skip.expense)
        } else if (skip.type === 'skip' && skip.id) {
          await expenseMut.update.mutateAsync({
            id: skip.id,
            isSkipped: true,
            isException: true,
          })
        } else if (skip.type === 'delete' && skip.id) {
          await expenseMut.remove.mutateAsync(skip.id)
        }
        await expenseMut.create.mutateAsync(oneOffExpense)
      } else {
        const recurring = recurrings.find((r) => r.id === target.recurringId)
        if (!recurring) return
        const from = parseISO(target.date)
        const dayBefore = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 1)
        const endDate = `${dayBefore.getFullYear()}-${String(dayBefore.getMonth() + 1).padStart(2, '0')}-${String(dayBefore.getDate()).padStart(2, '0')}`

        if (recurring.startDate >= target.date) {
          await recurringMut.remove.mutateAsync(recurring.id)
        } else {
          await recurringMut.update.mutateAsync({ id: recurring.id, endDate })
        }

        for (const e of expenses) {
          if (e.recurringId === recurring.id && e.date >= target.date) {
            await expenseMut.remove.mutateAsync(e.id)
          }
        }
        await expenseMut.create.mutateAsync(oneOffExpense)
      }
      closeExpenseForm()
      return
    }

    if (target.recurringId) {
      const scope = await askScope()
      if (!scope) return

      if (scope === 'this') {
        const result = buildThisOnlyUpdate(target, patch)
        if (result.type === 'create') {
          await expenseMut.create.mutateAsync(result.expense)
        } else {
          await expenseMut.update.mutateAsync({
            id: result.expense.id!,
            ...result.expense,
          })
        }
      } else {
        const recurring = recurrings.find((r) => r.id === target.recurringId)
        if (!recurring) return
        const { close, next } = splitRecurringFromDate(recurring, target.date, {
          amount: patch.amount,
          title: patch.title,
          categoryId: patch.categoryId,
          paymentMethodId: patch.paymentMethodId,
          memo: patch.memo,
          excluded: patch.excluded,
          dayOfMonth: Number(form.dayOfMonth) || Number(target.date.slice(8, 10)),
          endDate: form.endDate || null,
        })

        if (close.id === recurring.id && close.startDate === next.startDate) {
          await recurringMut.update.mutateAsync({ id: recurring.id, ...next })
        } else {
          await recurringMut.update.mutateAsync({
            id: recurring.id,
            endDate: close.endDate,
          })
          await recurringMut.create.mutateAsync(next)
        }

        // 해당일 예외 실지출이 있으면 정리
        const existing = expenses.find(
          (e) => e.recurringId === target.recurringId && e.date === target.date,
        )
        if (existing) {
          await expenseMut.remove.mutateAsync(existing.id)
        }
      }
    } else if (target.sourceExpenseId) {
      // 일반 지출 → 반복 지출로 전환
      if (form.recurring) {
        await recurringMut.create.mutateAsync({
          title: patch.title,
          amount: patch.amount,
          categoryId: patch.categoryId,
          paymentMethodId: patch.paymentMethodId,
          frequency: 'monthly',
          dayOfMonth: Number(form.dayOfMonth),
          startDate: patch.date,
          endDate: form.endDate || null,
          memo: patch.memo,
          excluded: patch.excluded || undefined,
        })
        await expenseMut.remove.mutateAsync(target.sourceExpenseId)
      } else {
        await expenseMut.update.mutateAsync({ id: target.sourceExpenseId, ...patch })
      }
    }
    closeExpenseForm()
  }

  const onDelete = async () => {
    if (!target) return
    const done = await deleteExpense(target)
    if (done) closeExpenseForm()
  }

  const addCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    const color = CATEGORY_PALETTE[editableCategories.length % CATEGORY_PALETTE.length]
    const created = await categoryMut.create.mutateAsync({ name, color })
    setField('categoryId', created.id)
    setAddingCategory(false)
    setNewCategoryName('')
  }

  const addMethod = async () => {
    const name = newMethodName.trim()
    if (!name) return
    const created = await methodMut.create.mutateAsync({ name })
    setField('paymentMethodId', created.id)
    setAddingMethod(false)
    setNewMethodName('')
  }

  const amountDisplay = (() => {
    const n = parseAmountInput(form.amount)
    return n === null ? '' : formatAmount(n).replace('원', '')
  })()

  return (
    <Modal
      open={open}
      title={isEdit ? '지출 수정' : '지출 등록'}
      onClose={closeExpenseForm}
      initialFocusSelector="#expense-amount"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          {isEdit ? (
            <button
              type="button"
              className="mr-auto h-10 rounded-xl px-3 text-sm font-medium text-danger hover:bg-danger/10"
              onClick={onDelete}
            >
              삭제
            </button>
          ) : null}
          <button
            type="button"
            className="h-10 rounded-xl px-4 text-sm font-medium text-muted hover:bg-canvas"
            onClick={closeExpenseForm}
          >
            취소
          </button>
          <button
            type="button"
            className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white"
            onClick={() => (isEdit ? saveEdit() : saveNew())}
          >
            저장
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="expense-amount" className="sr-only">
            금액
          </label>
          <div className="flex items-baseline gap-1">
            <input
              id="expense-amount"
              inputMode="numeric"
              value={amountDisplay}
              onChange={(e) => setField('amount', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              className="w-full border-0 bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-faint"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'err-amount' : undefined}
            />
            <span className="text-lg text-muted">원</span>
          </div>
          {errors.amount ? (
            <p id="err-amount" className="m-0 mt-1 text-xs text-danger">
              {errors.amount}
            </p>
          ) : null}
        </div>

        <Field label="내용" error={errors.title}>
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            className="field-input"
            placeholder="예: 점심 김치찌개"
          />
        </Field>

        <Field label="날짜" error={errors.date}>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
            className="field-input"
          />
        </Field>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-xs font-medium text-muted">카테고리</legend>
          <div className="flex flex-wrap gap-2">
            {editableCategories.map((c) => (
              <Chip
                key={c.id}
                selected={form.categoryId === c.id}
                color={c.color}
                onClick={() => setField('categoryId', c.id)}
              >
                {c.name}
              </Chip>
            ))}
            {addingCategory ? (
              <span className="inline-flex items-center gap-1">
                <input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void addCategory()
                    }
                  }}
                  onBlur={() => {
                    if (!newCategoryName.trim()) {
                      setAddingCategory(false)
                      setNewCategoryName('')
                    }
                  }}
                  className="h-9 w-28 rounded-full border border-line-strong px-3 text-sm"
                  placeholder="이름"
                  aria-label="새 카테고리 이름"
                />
                <button type="button" className="text-xs font-medium" onClick={() => void addCategory()}>
                  추가
                </button>
              </span>
            ) : (
              <Chip onClick={() => setAddingCategory(true)}>+ 추가</Chip>
            )}
          </div>
          {errors.categoryId ? (
            <p className="m-0 mt-1 text-xs text-danger">{errors.categoryId}</p>
          ) : null}
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-xs font-medium text-muted">결제수단</legend>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <Chip
                key={m.id}
                selected={form.paymentMethodId === m.id}
                onClick={() => setField('paymentMethodId', m.id)}
              >
                {m.name}
              </Chip>
            ))}
            {addingMethod ? (
              <span className="inline-flex items-center gap-1">
                <input
                  autoFocus
                  value={newMethodName}
                  onChange={(e) => setNewMethodName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void addMethod()
                    }
                  }}
                  onBlur={() => {
                    if (!newMethodName.trim()) {
                      setAddingMethod(false)
                      setNewMethodName('')
                    }
                  }}
                  className="h-9 w-28 rounded-full border border-line-strong px-3 text-sm"
                  placeholder="이름"
                  aria-label="새 결제수단 이름"
                />
                <button type="button" className="text-xs font-medium" onClick={() => void addMethod()}>
                  추가
                </button>
              </span>
            ) : (
              <Chip onClick={() => setAddingMethod(true)}>+ 추가</Chip>
            )}
          </div>
          {errors.paymentMethodId ? (
            <p className="m-0 mt-1 text-xs text-danger">{errors.paymentMethodId}</p>
          ) : null}
        </fieldset>

        <div className="flex flex-col gap-3">
          <div>
            <ToggleRow
              id="recurring-toggle"
              label="반복 지출"
              checked={form.recurring}
              onChange={(next) => setField('recurring', next)}
            />
            {form.recurring ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="결제일" error={errors.dayOfMonth}>
                  <input
                    inputMode="numeric"
                    value={form.dayOfMonth}
                    onChange={(e) => setField('dayOfMonth', e.target.value.replace(/[^\d]/g, ''))}
                    className="field-input"
                    placeholder="1–31"
                  />
                </Field>
                <Field label="종료일 (선택)">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setField('endDate', e.target.value)}
                    className="field-input"
                  />
                </Field>
              </div>
            ) : null}
          </div>
          <ToggleRow
            id="excluded-toggle"
            label="지출에서 제외"
            checked={form.excluded}
            onChange={(next) => setField('excluded', next)}
          />
        </div>

        <Field label="메모">
          <textarea
            value={form.memo}
            onChange={(e) => setField('memo', e.target.value)}
            rows={2}
            className="field-input resize-none"
            placeholder="선택 사항"
          />
        </Field>
      </div>

      <style>{`
        .field-input {
          width: 100%;
          height: 2.5rem;
          border-radius: 0.75rem;
          border: 1px solid var(--color-line-strong);
          background: var(--color-paper);
          padding: 0 0.75rem;
        }
        textarea.field-input { height: auto; padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .field-input:focus-visible { box-shadow: var(--focus-ring); }
      `}</style>
    </Modal>
  )
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-ink' : 'bg-line-strong'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  )
}
