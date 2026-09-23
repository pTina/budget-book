type SegmentOption<T extends string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  fullWidth?: boolean
}

export function SegmentControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  fullWidth,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex rounded-xl bg-canvas p-1 border border-line ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`h-8 rounded-lg px-2 text-xs font-medium transition-colors md:h-9 md:px-3 md:text-sm ${
              fullWidth ? 'flex-1' : ''
            } ${
              selected
                ? 'bg-paper text-ink shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
