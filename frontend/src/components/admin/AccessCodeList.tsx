import { type AccessCodeResponse } from '../../lib/adminApi'
import { Button } from '../ui/Button'

interface AccessCodeListProps {
  codes: AccessCodeResponse[]
  onDelete: (id: number) => void
}

export function AccessCodeList({ codes, onDelete }: AccessCodeListProps) {
  if (codes.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        NO ACCESS CODES
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
      {codes.map((c) => (
        <div key={c.id} style={{
          background: 'var(--surface-2)',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                {c.code}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px',
                color: c.is_active ? 'var(--normal)' : 'var(--unknown)',
                border: `1px solid ${c.is_active ? 'var(--normal)' : 'var(--unknown)'}`,
                padding: '1px 5px', borderRadius: '2px', letterSpacing: '0.1em',
              }}>
                {c.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>ACCESSES: {c.access_count}</span>
              {c.last_accessed_at && <span>LAST: {new Date(c.last_accessed_at).toLocaleDateString()}</span>}
              {c.expires_at && <span>EXPIRES: {new Date(c.expires_at).toLocaleDateString()}</span>}
            </div>
            {c.shareable_link && (
              <div style={{ marginTop: '6px' }}>
                <a href={c.shareable_link} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.05em' }}>
                  {c.shareable_link} ↗
                </a>
              </div>
            )}
          </div>
          <Button variant="danger" size="sm" onClick={() => onDelete(c.id)}>REVOKE</Button>
        </div>
      ))}
    </div>
  )
}
