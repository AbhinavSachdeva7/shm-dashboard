import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { login, isAuthenticated } from '../../lib/adminApi'

export function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) navigate('/admin/dashboard')
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(password)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
      <div style={{ width: '100%', maxWidth: '380px' }} className="animate-fade-up">
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)',
            letterSpacing: '0.3em', textTransform: 'uppercase' as const, marginBottom: '12px',
          }}>RESTRICTED</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 800, lineHeight: 1, marginBottom: '10px' }}>
            ADMIN
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Enter your password to access the control panel.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block', fontFamily: 'var(--font-mono)', fontSize: '10px',
              letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const, marginBottom: '8px',
            }}>PASSWORD</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" disabled={loading} autoFocus />
          </div>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              padding: '10px 14px', borderRadius: '2px',
              fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--critical)',
            }}>{error}</div>
          )}
          <Button type="submit" size="lg" disabled={loading || !password} style={{ width: '100%' }}>
            {loading ? 'AUTHENTICATING...' : 'ENTER'}
          </Button>
        </form>

        <p style={{ marginTop: '32px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <a href="/portal" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Go to client portal →</a>
        </p>
      </div>
    </div>
  )
}
