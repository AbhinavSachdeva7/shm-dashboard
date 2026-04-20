import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'var(--accent)', color: '#080808', borderColor: 'var(--accent)' },
  outline: { background: 'transparent', color: 'var(--text)', borderColor: 'var(--border-2)' },
  ghost:   { background: 'transparent', color: 'var(--text-muted)', borderColor: 'transparent' },
  danger:  { background: 'transparent', color: 'var(--critical)', borderColor: 'var(--critical)' },
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { fontSize: '10px', padding: '5px 12px' },
  md: { fontSize: '11px', padding: '8px 16px' },
  lg: { fontSize: '12px', padding: '11px 24px' },
}

export function Button({ variant = 'primary', size = 'md', children, disabled, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        letterSpacing: '0.05em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: '2px',
        transition: 'all 150ms ease',
        border: '1px solid transparent',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.4 : 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </button>
  )
}
