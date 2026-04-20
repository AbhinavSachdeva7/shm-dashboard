import { type InputHTMLAttributes, forwardRef } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ style, onFocus, onBlur, ...props }, ref) => (
  <input
    ref={ref}
    style={{
      width: '100%',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-2)',
      borderRadius: '2px',
      padding: '10px 14px',
      color: 'var(--text)',
      fontFamily: 'var(--font-mono)',
      fontSize: '13px',
      outline: 'none',
      transition: 'border-color 150ms ease',
      ...style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = 'var(--accent)'
      onFocus?.(e)
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-2)'
      onBlur?.(e)
    }}
    {...props}
  />
))
Input.displayName = 'Input'
