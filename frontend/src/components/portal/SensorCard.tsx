import { type SensorReading } from '../../lib/api'
import { StatusBadge } from './StatusBadge'

interface SensorCardProps {
  reading: SensorReading
  isSelected?: boolean
  onClick?: () => void
}

export function SensorCard({ reading, isSelected, onClick }: SensorCardProps) {
  const statusColor = {
    normal:   'var(--normal)',
    warning:  'var(--warning)',
    critical: 'var(--critical)',
    unknown:  'var(--unknown)',
  }[reading.status]

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        borderLeft: `3px solid ${isSelected ? 'var(--accent)' : statusColor}`,
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        outline: isSelected ? '1px solid var(--accent)' : 'none',
        outlineOffset: '-2px',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border-2)'
          e.currentTarget.style.borderLeftColor = statusColor
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.borderLeftColor = statusColor
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}>
          {reading.name}
        </span>
        <StatusBadge status={reading.status} size="sm" />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        {reading.value !== null && reading.value !== undefined ? (
          <>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 700,
              color: isSelected ? 'var(--accent)' : 'var(--text)',
              lineHeight: 1,
              transition: 'color 150ms ease',
            }}>
              {reading.value.toFixed(2)}
            </span>
            {reading.unit && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {reading.unit}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)' }}>—</span>
        )}
      </div>

      {(reading.thresholds.min !== undefined || reading.thresholds.max !== undefined) && (
        <div style={{
          marginTop: '10px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}>
          RANGE&nbsp;
          {reading.thresholds.min ?? '—'} — {reading.thresholds.max ?? '—'}
          {reading.unit && ` ${reading.unit}`}
        </div>
      )}
    </div>
  )
}
