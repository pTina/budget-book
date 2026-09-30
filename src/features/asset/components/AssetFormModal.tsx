import { useEffect, useState, type ReactNode } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Chip } from '@/shared/ui/Chip'
import { SegmentControl } from '@/shared/ui/SegmentControl'
import { useUiStore } from '@/store/useUiStore'
import { formatAmount, formatDateKey, parseAmountInput } from '@/shared/lib/format'
import { CATEGORY_PALETTE } from '@/shared/storage'
import {
  useAssetCategories,
  useAssetCategoryMutations,
  useAssetEntries,
  useAssetEntryMutations,
} from '../hooks/useAssets'
import type { AssetType } from '@/shared/types'

const MAX_AMOUNT = 99_999_999
const TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'buy', label: '매수' },
  { value: 'sell', label: '매도' },
  { value: 'hold', label: '보유' },
]

type FormState = {
  type: AssetType
  categoryId: string
  amount: string
  value: string
  date: string
  title: string
  memo: string
}

type Errors = Partial<Record<keyof FormState, string>>

function emptyForm(date: string, categoryId: string): FormState {
  return {
    type: 'buy',
    categoryId,
    amount: '',
    value: '',
    date,
    title: '',
    memo: '',
  }
}

export function AssetFormModal() {
  const open = useUiStore((s) => s.assetFormOpen)
  const formId = useUiStore((s) => s.assetFormId)
  const closeAssetForm = useUiStore((s) => s.closeAssetForm)
  const askConfirm = useUiStore((s) => s.askConfirm)
  const { data: categories = [] } = useAssetCategories()
  const { data: entries = [] } = useAssetEntries()
  const categoryMut = useAssetCategoryMutations()
  const entryMut = useAssetEntryMutations()

  const defaultCat = categories[0]?.id ?? ''
  const target = formId ? entries.find((e) => e.id === formId) ?? null : null
  const isEdit = Boolean(formId)

  const [form, setForm] = useState<FormState>(() => emptyForm(formatDateKey(new Date()), defaultCat))
  const [errors, setErrors] = useState<Errors>({})
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    if (!open) return
    if (formId && !target) return
    if (target) {
      setForm({
        type: target.type,
        categoryId: target.categoryId ?? '',
        amount: String(target.amount),
        value:
          target.type !== 'sell' && target.value != null && target.value !== target.amount
            ? String(target.value)
            : '',
        date: target.date,
        title: target.title,
        memo: target.memo ?? '',
      })
    } else {
      setForm(emptyForm(formatDateKey(new Date()), defaultCat))
    }
    setErrors({})
    setAddingCategory(false)
    setNewCategoryName('')
  }, [open, formId, target, defaultCat])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: Errors = {}
    const amount = parseAmountInput(form.amount)
    if (amount === null || amount <= 0) next.amount = '원금을 입력하세요'
    else if (amount > MAX_AMOUNT) next.amount = '금액은 99,999,999원까지예요'
    if (form.type !== 'sell' && form.value) {
      const value = parseAmountInput(form.value)
      if (value === null || value <= 0) next.value = '평가금액을 확인하세요'
      else if (value > MAX_AMOUNT) next.value = '금액은 99,999,999원까지예요'
    }
    if (!form.title.trim()) next.title = '내용을 입력하세요'
    else if (form.title.trim().length > 30) next.title = '내용은 30자까지예요'
    if (!form.date) next.date = '날짜를 선택하세요'
    if (form.memo.length > 100) next.memo = '메모는 100자까지예요'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const payload = () => {
    const amount = parseAmountInput(form.amount)!
    const parsedValue = form.type === 'sell' ? null : parseAmountInput(form.value)
    const value =
      parsedValue === null || parsedValue === amount ? undefined : parsedValue
    return {
      type: form.type,
      categoryId: form.categoryId || null,
      amount,
      value,
      date: form.date,
      title: form.title.trim(),
      memo: form.memo.trim() || undefined,
    }
  }

  const onSave = async () => {
    if (!validate()) return
    if (isEdit && target) {
      await entryMut.update.mutateAsync({ id: target.id, ...payload() })
    } else {
      await entryMut.create.mutateAsync(payload())
    }
    closeAssetForm()
  }

  const onDelete = async () => {
    if (!target) return
    const ok = await askConfirm({ title: '이 기록을 삭제할까요?' })
    if (!ok) return
    await entryMut.remove.mutateAsync(target.id)
    closeAssetForm()
  }

  const addCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    if (name.length > 10) return
    const created = await categoryMut.create.mutateAsync({
      name,
      color: CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length],
      order: categories.reduce((max, c) => Math.max(max, c.order), -1) + 1,
    })
    setField('categoryId', created.id)
    setAddingCategory(false)
    setNewCategoryName('')
  }

  const amountDisplay = (() => {
    const n = parseAmountInput(form.amount)
    return n === null ? '' : formatAmount(n).replace('원', '')
  })()
  const valueDisplay = (() => {
    const n = parseAmountInput(form.value)
    return n === null ? '' : formatAmount(n).replace('원', '')
  })()

  return (
    <Modal
      open={open}
      title={isEdit ? '자산 수정' : '자산 기록'}
      onClose={closeAssetForm}
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          {isEdit ? (
            <button
              type="button"
              className="mr-auto h-10 rounded-xl px-3 text-sm font-medium text-danger hover:bg-danger/10"
              onClick={() => void onDelete()}
            >
              삭제
            </button>
          ) : null}
          <button
            type="button"
            className="h-10 rounded-xl px-4 text-sm font-medium text-muted hover:bg-canvas"
            onClick={closeAssetForm}
          >
            취소
          </button>
          <button
            type="button"
            className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white"
            onClick={() => void onSave()}
          >
            저장
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-xs font-medium text-muted">구분</legend>
          <SegmentControl<AssetType>
            ariaLabel="구분"
            fullWidth
            value={form.type}
            options={TYPE_OPTIONS}
            onChange={(value) => {
              setField('type', value)
              if (value === 'sell') setField('value', '')
            }}
          />
        </fieldset>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2 text-xs font-medium text-muted">카테고리</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
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
                  onChange={(e) => setNewCategoryName(e.target.value.slice(0, 10))}
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
        </fieldset>

        <Field label="투자 원금" error={errors.amount}>
          <input
            inputMode="numeric"
            value={amountDisplay}
            onChange={(e) => setField('amount', e.target.value.replace(/[^\d]/g, ''))}
            className="field-input tabular-nums"
            placeholder="0"
          />
        </Field>
        {form.type !== 'sell' ? (
          <Field
            label="평가금액"
            error={errors.value}
            hint="비워 두면 원금과 같게 저장합니다. 시세 연동 없음."
          >
            <input
              inputMode="numeric"
              value={valueDisplay}
              onChange={(e) => setField('value', e.target.value.replace(/[^\d]/g, ''))}
              className="field-input tabular-nums"
              placeholder="원금과 같음"
            />
          </Field>
        ) : null}
        <Field label="날짜" error={errors.date}>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setField('date', e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="내용" error={errors.title}>
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            className="field-input"
            placeholder="예: 삼성전자"
            maxLength={30}
          />
        </Field>
        <Field label="메모" error={errors.memo}>
          <input
            value={form.memo}
            onChange={(e) => setField('memo', e.target.value)}
            className="field-input"
            placeholder="선택 사항"
            maxLength={100}
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
        .field-input:focus-visible { box-shadow: var(--focus-ring); }
      `}</style>
    </Modal>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
      {hint && !error ? <span className="mt-1 block text-[11px] text-faint">{hint}</span> : null}
    </label>
  )
}
