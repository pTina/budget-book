import type { ReactNode, ButtonHTMLAttributes } from 'react'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  color?: string
  children: ReactNode
}

export function Chip({ selected, color, children, className = '', ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors ${
        selected
          ? 'border-ink bg-ink text-white'
          : 'border-line-strong bg-paper text-ink hover:border-ink/30'
      } ${className}`}
      {...rest}
    >
      {color ? (
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  )
}
