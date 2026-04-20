import { Button } from '../ui/Button'

interface ConnectionTestProps {
  testing: boolean
  result: { success: boolean; message: string; channel_name?: string; field_count?: number } | null
  onTest: () => void
}

export function ConnectionTest({ testing, result, onTest }: ConnectionTestProps) {
  return (
    <div>
      <Button variant="outline" onClick={onTest} disabled={testing} size="sm">
        {testing ? 'TESTING...' : 'TEST CONNECTION'}
      </Button>
      {result && (
        <div style={{
          marginTop: '12px',
          padding: '12px 14px',
          background: result.success ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
          border: `1px solid ${result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        }}>
          <div style={{ color: result.success ? 'var(--normal)' : 'var(--critical)', marginBottom: '4px', letterSpacing: '0.1em' }}>
            {result.success ? '● CONNECTED' : '● FAILED'}
          </div>
          <div style={{ color: 'var(--text-muted)' }}>{result.message}</div>
          {result.channel_name && (
            <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Channel: {result.channel_name} ({result.field_count} fields)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
