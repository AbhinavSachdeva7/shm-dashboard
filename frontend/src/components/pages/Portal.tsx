import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { validateAccessCode } from '../../lib/api'

export function Portal() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const trimmed = code.trim().toUpperCase()
      const result = await validateAccessCode(trimmed)
      if (result.valid) {
        navigate(`/portal/${trimmed}`)
      } else {
        setError(result.message ?? 'Invalid access code')
      }
    } catch {
      setError('Unable to verify code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-up">
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--accent)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase' as const,
            marginBottom: '12px',
          }}>
            CLIENT ACCESS
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '42px',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text)',
            marginBottom: '10px',
          }}>
            PORTAL
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6 }}>
            Enter your project access code to view structural health data.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase' as const,
              marginBottom: '8px',
            }}>
              ACCESS CODE
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MTHL-2024-XK9"
              disabled={loading}
              autoFocus
              style={{ textAlign: 'center', fontSize: '16px', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.3)',
              padding: '10px 14px',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--critical)',
            }}>
              {error}
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading || !code.trim()} style={{ width: '100%' }}>
            {loading ? 'VERIFYING...' : 'ACCESS DASHBOARD'}
          </Button>
        </form>

        <p style={{ marginTop: '32px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          No access code?{' '}
          <a href="mailto:support@paritta.in" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Contact us →
          </a>
        </p>
      </div>
    </div>
  )
}
