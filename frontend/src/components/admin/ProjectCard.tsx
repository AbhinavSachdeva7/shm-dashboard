import { useNavigate } from 'react-router-dom'
import { type ProjectResponse } from '../../lib/adminApi'

interface ProjectCardProps {
  project: ProjectResponse
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/admin/projects/${project.id}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${project.is_active ? 'var(--normal)' : 'var(--unknown)'}`,
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-2)' }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.borderLeftColor = project.is_active ? 'var(--normal)' : 'var(--unknown)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700 }}>
          {project.name.toUpperCase()}
        </h3>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.15em',
          color: project.is_active ? 'var(--normal)' : 'var(--unknown)',
          border: `1px solid ${project.is_active ? 'var(--normal)' : 'var(--unknown)'}`,
          padding: '2px 6px', borderRadius: '2px',
        }}>
          {project.is_active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
      {project.location && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em' }}>
          {project.location}
        </div>
      )}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'SENSORS', value: String(project.sensor_fields.length) },
          { label: 'CODES', value: String(project.access_code_count) },
          { label: 'CHANNEL', value: project.thingspeak_channel_id },
        ].map((stat) => (
          <div key={stat.label}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '2px' }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text)', fontWeight: 600 }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
