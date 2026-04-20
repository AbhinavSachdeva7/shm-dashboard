import { type SensorFieldConfig } from '../../lib/adminApi'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface SensorFieldFormProps {
  field: SensorFieldConfig
  onChange: (updated: SensorFieldConfig) => void
  onRemove: () => void
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label style={{
      display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px',
      color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: '6px',
    }}>{children}</label>
  )
}

export function SensorFieldForm({ field, onChange, onRemove }: SensorFieldFormProps) {
  return (
    <div style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '2px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', letterSpacing: '0.1em' }}>
          FIELD {field.field_number}
        </span>
        <Button variant="ghost" size="sm" onClick={onRemove} style={{ color: 'var(--critical)', fontSize: '10px' }}>
          REMOVE
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <FieldLabel>SENSOR NAME</FieldLabel>
          <Input value={field.name} onChange={(e) => onChange({ ...field, name: e.target.value })} placeholder="e.g. Strain Gauge" />
        </div>
        <div>
          <FieldLabel>UNIT</FieldLabel>
          <Input value={field.unit ?? ''} onChange={(e) => onChange({ ...field, unit: e.target.value || undefined })} placeholder="e.g. μɛ" />
        </div>
        <div />
        <div>
          <FieldLabel>MIN THRESHOLD</FieldLabel>
          <Input type="number" value={field.min_threshold ?? ''} onChange={(e) => onChange({ ...field, min_threshold: e.target.value ? Number(e.target.value) : undefined })} placeholder="Optional" />
        </div>
        <div>
          <FieldLabel>MAX THRESHOLD</FieldLabel>
          <Input type="number" value={field.max_threshold ?? ''} onChange={(e) => onChange({ ...field, max_threshold: e.target.value ? Number(e.target.value) : undefined })} placeholder="Optional" />
        </div>
      </div>
    </div>
  )
}
