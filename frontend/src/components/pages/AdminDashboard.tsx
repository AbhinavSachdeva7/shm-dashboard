import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { getProjects, getStats, logout, type ProjectResponse, type StatsResponse } from '../../lib/adminApi'
import { ProjectCard } from '../admin/ProjectCard'

interface StatBoxProps {
  label: string
  value: string | number
  accent?: boolean
}

function StatBox({ label, value, accent }: StatBoxProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderTop: accent ? '2px solid var(--accent)' : '1px solid var(--border)',
      padding: '20px',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 800, lineHeight: 1, color: accent ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([getProjects(), getStats()])
        setProjects(p)
        setStats(s)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
        if (err instanceof Error && err.message.includes('Session expired')) navigate('/admin')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [navigate])

  const handleLogout = () => { logout(); navigate('/admin') }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-dots" style={{ display: 'flex', gap: '6px' }}><span /><span /><span /></div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.3em', marginBottom: '8px' }}>CONTROL PANEL</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 800, lineHeight: 1 }}>DASHBOARD</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button onClick={() => navigate('/admin/projects/new')}>+ NEW PROJECT</Button>
          <Button variant="outline" onClick={handleLogout}>LOGOUT</Button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
          padding: '12px 16px', marginBottom: '24px',
          fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--critical)',
        }}>{error}</div>
      )}

      {/* Stats */}
      {stats && (
        <div className="animate-fade-up animate-fade-up-delay-1" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          marginBottom: '32px',
        }}>
          <StatBox label="TOTAL PROJECTS" value={stats.total_projects} />
          <StatBox label="ACTIVE PROJECTS" value={stats.active_projects} accent />
          <StatBox label="ACCESS CODES" value={stats.active_access_codes} />
          <StatBox label="ACCESSES 24H" value={stats.recent_accesses} />
          <StatBox label="TOTAL READINGS" value={stats.total_readings.toLocaleString()} />
        </div>
      )}

      {/* Projects */}
      <div className="animate-fade-up animate-fade-up-delay-2">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '16px' }}>
          PROJECTS — {projects.length}
        </div>
        {projects.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '16px' }}>
              NO PROJECTS YET
            </div>
            <Button onClick={() => navigate('/admin/projects/new')}>CREATE FIRST PROJECT</Button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1px', background: 'var(--border)' }}>
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
