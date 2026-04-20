type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h',  label: '1H' },
  { value: '6h',  label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d',  label: '7D' },
  { value: '30d', label: '30D' },
]

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div style={{
      display: 'flex',
      border: '1px solid var(--border-2)',
      borderRadius: '2px',
      overflow: 'hidden',
    }}>
      {RANGES.map((r, i) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          style={{
            padding: '6px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            border: 'none',
            borderRight: i < RANGES.length - 1 ? '1px solid var(--border-2)' : 'none',
            background: r.value === value ? 'var(--accent)' : 'var(--surface-2)',
            color: r.value === value ? '#080808' : 'var(--text-muted)',
            transition: 'all 150ms ease',
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
