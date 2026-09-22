import { useEffect, useState } from 'react'
import { Modal } from '@/shared/ui/Modal'
import { Button } from '@/shared/ui/Button'
import { useBudget, useSaveMonthBudget } from '@/features/budget/hooks/useBudget'
import { useCategories, useCategoryMutations } from '@/features/category/hooks/useCategories'
import {
  usePaymentMethods,
  usePaymentMethodMutations,
} from '@/features/payment/hooks/usePaymentMethods'
import {
  useRecurringMutations,
  useRecurrings,
} from '@/features/expense/hooks/useExpenses'
import { useUiStore } from '@/store/useUiStore'
import { CATEGORY_PALETTE } from '@/shared/storage'
import { getBudgetAmount } from '@/features/budget/utils/budget'
import { formatAmount, parseAmountInput } from '@/shared/lib/format'
import { logOut, useAuthUser } from '@/shared/lib/auth'

type Tab = 'budget' | 'category' | 'payment' | 'recurring'

const TABS: { id: Tab; label: string }[] = [
  { id: 'budget', label: '예산' },
  { id: 'category', label: '카테고리' },
  { id: 'payment', label: '결제수단' },
  { id: 'recurring', label: '반복 지출' },
]

const HINTS: Record<Tab, string> = {
  budget: '월 예산을 켜고 목표 금액을 설정하세요. 끄면 예산 UI가 숨겨집니다.',
  category: '지출을 분류할 카테고리를 관리합니다. 삭제 시 연결 지출은 미분류로 옮겨집니다.',
  payment: '카드·현금 등 결제수단을 등록하세요.',
  recurring: '구독·고정비처럼 매달 반복되는 지출 규칙을 관리합니다.',
}

export function SettingsModal() {
  const open = useUiStore((s) => s.settingsOpen)
  const tab = useUiStore((s) => s.settingsTab)
  const closeSettings = useUiStore((s) => s.closeSettings)
  const openSettings = useUiStore((s) => s.openSettings)
  const openExpenseForm = useUiStore((s) => s.openExpenseForm)
  const askConfirm = useUiStore((s) => s.askConfirm)
  const monthKey = useUiStore((s) => s.monthKey)

  const { data: budget } = useBudget()
  const { data: categories = [] } = useCategories()
  const { data: methods = [] } = usePaymentMethods()
  const { data: recurrings = [] } = useRecurrings()
  const saveBudget = useSaveMonthBudget()
  const categoryMut = useCategoryMutations()
  const methodMut = usePaymentMethodMutations()
  const recurringMut = useRecurringMutations()
  const { user } = useAuthUser()
  const [loggingOut, setLoggingOut] = useState(false)

  const [enabled, setEnabled] = useState(true)
  const [amount, setAmount] = useState('')
  const [applyNext, setApplyNext] = useState(true)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState<string>(CATEGORY_PALETTE[0])
  const [newMethod, setNewMethod] = useState('')
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [editingMethod, setEditingMethod] = useState<string | null>(null)
  const [editingMethodName, setEditingMethodName] = useState('')

  useEffect(() => {
    if (!open || !budget) return
    setEnabled(budget.enabled)
    setApplyNext(budget.applyToNextMonth)
    setAmount(String(getBudgetAmount(budget, monthKey)))
  }, [open, budget, monthKey])

  const isBudgetDirty = () => {
    if (!budget) return false
    const currentAmount = parseAmountInput(amount)
    const savedAmount = getBudgetAmount(budget, monthKey)
    if (enabled !== budget.enabled) return true
    if (applyNext !== budget.applyToNextMonth) return true
    if (currentAmount === null) return enabled !== budget.enabled
    return currentAmount !== savedAmount
  }

  const persistBudgetIfNeeded = async () => {
    if (!budget || !isBudgetDirty()) return
    const n = parseAmountInput(amount)
    const amountToSave = n !== null && n >= 0 ? n : getBudgetAmount(budget, monthKey)
    await saveBudget.mutateAsync({
      amount: amountToSave,
      enabled,
      applyToNextMonth: applyNext,
    })
  }

  const handleClose = async () => {
    try {
      await persistBudgetIfNeeded()
    } finally {
      closeSettings()
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    const ok = await askConfirm({
      title: `'${name}' 카테고리를 삭제할까요?`,
      description: '연결된 지출은 미분류로 옮겨져요.',
    })
    if (ok) await categoryMut.remove.mutateAsync(id)
  }

  const deleteMethod = async (id: string, name: string) => {
    const ok = await askConfirm({
      title: `'${name}' 결제수단을 삭제할까요?`,
      description: '연결된 지출의 결제수단은 비워져요.',
    })
    if (ok) await methodMut.remove.mutateAsync(id)
  }

  const deleteRecurring = async (id: string, title: string) => {
    const ok = await askConfirm({
      title: `'${title}' 반복 지출을 삭제할까요?`,
      description: '이후 예정 회차가 더 이상 표시되지 않습니다.',
    })
    if (ok) await recurringMut.remove.mutateAsync(id)
  }

  return (
    <Modal open={open} title="설정" onClose={() => void handleClose()} size="lg">
      <div className="mb-4 inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-canvas p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`h-9 shrink-0 rounded-lg px-3 text-sm font-medium ${
              tab === t.id ? 'bg-paper text-ink shadow-sm' : 'text-muted'
            }`}
            onClick={() => openSettings(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="m-0 mb-4 text-sm text-muted leading-relaxed">{HINTS[tab]}</p>

      {tab === 'budget' && budget ? (
        <div className="flex flex-col gap-4">
          <ToggleRow
            label="예산 사용"
            checked={enabled}
            onChange={setEnabled}
          />
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">월 예산</span>
            <input
              inputMode="numeric"
              value={amount ? Number(amount).toLocaleString('ko-KR') : ''}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
              disabled={!enabled}
              className="h-10 w-full rounded-xl border border-line-strong px-3 disabled:opacity-50"
            />
          </label>
          <ToggleRow
            label="다음 달에도 같은 예산 적용"
            checked={applyNext}
            onChange={setApplyNext}
            disabled={!enabled}
          />
        </div>
      ) : null}

      {tab === 'category' ? (
        <div className="flex flex-col gap-3">
          <ul className="m-0 list-none space-y-2 p-0">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                  aria-hidden="true"
                />
                {editingCat === c.id ? (
                  <input
                    autoFocus
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-line-strong px-2 text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                )}
                {!c.isUncategorized ? (
                  <span className="flex gap-1">
                    {editingCat === c.id ? (
                      <button
                        type="button"
                        className="text-xs font-medium text-ink"
                        onClick={async () => {
                          await categoryMut.update.mutateAsync({
                            id: c.id,
                            name: editingCatName.trim() || c.name,
                          })
                          setEditingCat(null)
                        }}
                      >
                        완료
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-xs text-muted"
                        onClick={() => {
                          setEditingCat(c.id)
                          setEditingCatName(c.name)
                        }}
                      >
                        수정
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-xs text-danger"
                      onClick={() => void deleteCategory(c.id, c.name)}
                    >
                      삭제
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-dashed border-line-strong p-3">
            <p className="m-0 mb-2 text-xs font-medium text-muted">+ 카테고리 추가</p>
            <input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="이름"
              className="mb-2 h-9 w-full rounded-lg border border-line-strong px-3 text-sm"
            />
            <div className="mb-3 flex flex-wrap gap-2">
              {CATEGORY_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`색상 ${color}`}
                  aria-pressed={newCatColor === color}
                  className={`h-7 w-7 rounded-full ${
                    newCatColor === color ? 'ring-2 ring-offset-2 ring-ink' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCatColor(color)}
                />
              ))}
            </div>
            <button
              type="button"
              className="h-9 rounded-lg bg-ink px-3 text-sm font-medium text-white"
              onClick={async () => {
                const name = newCatName.trim()
                if (!name) return
                await categoryMut.create.mutateAsync({ name, color: newCatColor })
                setNewCatName('')
              }}
            >
              추가
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'payment' ? (
        <div className="flex flex-col gap-3">
          <ul className="m-0 list-none space-y-2 p-0">
            {methods.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
              >
                {editingMethod === m.id ? (
                  <input
                    autoFocus
                    value={editingMethodName}
                    onChange={(e) => setEditingMethodName(e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-line-strong px-2 text-sm"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium">{m.name}</span>
                )}
                <span className="flex gap-1">
                  {editingMethod === m.id ? (
                    <button
                      type="button"
                      className="text-xs font-medium"
                      onClick={async () => {
                        await methodMut.update.mutateAsync({
                          id: m.id,
                          name: editingMethodName.trim() || m.name,
                        })
                        setEditingMethod(null)
                      }}
                    >
                      완료
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-muted"
                      onClick={() => {
                        setEditingMethod(m.id)
                        setEditingMethodName(m.name)
                      }}
                    >
                      수정
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-danger"
                    onClick={() => void deleteMethod(m.id, m.name)}
                  >
                    삭제
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={newMethod}
              onChange={(e) => setNewMethod(e.target.value)}
              placeholder="결제수단 이름"
              className="h-10 flex-1 rounded-xl border border-line-strong px-3 text-sm"
            />
            <button
              type="button"
              className="h-10 rounded-xl bg-ink px-4 text-sm font-medium text-white"
              onClick={async () => {
                const name = newMethod.trim()
                if (!name) return
                await methodMut.create.mutateAsync({ name })
                setNewMethod('')
              }}
            >
              추가
            </button>
          </div>
        </div>
      ) : null}

      {tab === 'recurring' ? (
        <div className="flex flex-col gap-3">
          <ul className="m-0 list-none space-y-2 p-0">
            {recurrings.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted">등록된 반복 지출이 없어요.</li>
            ) : (
              recurrings.map((r) => {
                const cat = categories.find((c) => c.id === r.categoryId)
                const method = methods.find((m) => m.id === r.paymentMethodId)
                return (
                  <li
                    key={r.id}
                    className="rounded-xl border border-line px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="m-0 text-sm font-semibold">{r.title}</p>
                        <p className="m-0 mt-1 text-xs text-muted">
                          매월 {r.dayOfMonth}일 · {cat?.name ?? '미분류'}
                          {method ? ` · ${method.name}` : ''}
                        </p>
                      </div>
                      <p className="m-0 text-sm font-semibold tabular-nums">
                        {formatAmount(r.amount)}
                      </p>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-muted"
                        onClick={() => {
                          void handleClose().then(() => {
                            openExpenseForm({ recurringOn: true })
                          })
                        }}
                      >
                        수정은 회차에서
                      </button>
                      <button
                        type="button"
                        className="text-xs text-danger"
                        onClick={() => void deleteRecurring(r.id, r.title)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
          <button
            type="button"
            className="h-11 rounded-xl border border-dashed border-line-strong text-sm font-medium text-ink hover:bg-canvas"
            onClick={() => {
              void handleClose().then(() => {
                openExpenseForm({ recurringOn: true })
              })
            }}
          >
            + 반복 지출 추가
          </button>
        </div>
      ) : null}

      <div className="mt-6 border-t border-line pt-4">
        {user?.email ? (
          <p className="m-0 mb-3 truncate text-xs text-muted">{user.email}</p>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={loggingOut}
          onClick={async () => {
            setLoggingOut(true)
            try {
              await persistBudgetIfNeeded()
              closeSettings()
              await logOut()
            } finally {
              setLoggingOut(false)
            }
          }}
        >
          {loggingOut ? '로그아웃 중…' : '로그아웃'}
        </Button>
      </div>
    </Modal>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
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
