type Status = 'normal' | 'warning' | 'critical' | 'unknown'

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  normal:   { label: 'NORMAL',   color: 'var(--normal)' },
  warning:  { label: 'WARNING',  color: 'var(--warning)' },
  critical: { label: 'CRITICAL', color: 'var(--critical)' },
  unknown:  { label: 'UNKNOWN',  color: 'var(--unknown)' },
}

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'lg'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const fontSize = size === 'lg' ? '11px' : '9px'
  const padding = size === 'lg' ? '4px 10px' : '2px 7px'

  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize,
      fontWeight: 600,
      letterSpacing: '0.15em',
      color: config.color,
      border: `1px solid ${config.color}`,
      borderRadius: '2px',
      padding,
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
    }}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: config.color,
        flexShrink: 0,
        animation: status === 'critical' ? 'pulse-dot 1.2s ease-in-out infinite' : undefined,
      }} />
      {config.label}
    </span>
  )
}
