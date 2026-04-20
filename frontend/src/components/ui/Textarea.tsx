import { type TextareaHTMLAttributes, forwardRef } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ style, onFocus, onBlur, ...props }, ref) => (
  <textarea
    ref={ref}
    style={{
      width: '100%',
      background: 'var(--surface-2)',
      border: '1px solid var(--border-2)',
      borderRadius: '2px',
      padding: '10px 14px',
      color: 'var(--text)',
      fontFamily: 'var(--font-sans)',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 150ms ease',
      resize: 'vertical',
      minHeight: '80px',
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
Textarea.displayName = 'Textarea'
