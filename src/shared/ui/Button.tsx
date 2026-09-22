import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-[#1c1e22]',
  secondary: 'bg-paper text-ink border border-line-strong hover:bg-canvas',
  tertiary: 'bg-transparent text-ink hover:bg-canvas',
  ghost: 'bg-transparent text-muted hover:bg-canvas hover:text-ink',
  danger: 'bg-warn text-white hover:bg-[#c44844]',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'min-h-11 px-4 text-sm rounded-[6px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`krds-btn inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
