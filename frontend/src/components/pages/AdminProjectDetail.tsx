import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import {
  getProject, getAccessCodes, createAccessCode, deleteAccessCode,
  deleteProject, testProjectConnection, updateSensorFields,
  type ProjectResponse, type AccessCodeResponse, type SensorFieldConfig,
} from '../../lib/adminApi'
import { SensorFieldForm } from '../admin/SensorFieldForm'
import { AccessCodeList } from '../admin/AccessCodeList'
import { ConnectionTest } from '../admin/ConnectionTest'

interface SectionProps {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}

function Section({ title, action, children }: SectionProps) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.2em' }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function AdminProjectDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const projectId = id ? parseInt(id, 10) : NaN

  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [accessCodes, setAccessCodes] = useState<AccessCodeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSensors, setEditingSensors] = useState(false)
  const [sensorFields, setSensorFields] = useState<SensorFieldConfig[]>([])
  const [savingSensors, setSavingSensors] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; channel_name?: string; field_count?: number } | null>(null)

  useEffect(() => {
    if (!projectId || isNaN(projectId)) return
    const load = async () => {
      try {
        const [p, codes] = await Promise.all([
          getProject(projectId),
          getAccessCodes(projectId, window.location.origin),
        ])
        setProject(p)
        setAccessCodes(codes)
        setSensorFields(p.sensor_fields.map((sf) => ({
          field_number: sf.field_number,
          name: sf.name,
          unit: sf.unit ?? undefined,
          min_threshold: sf.min_threshold ?? undefined,
          max_threshold: sf.max_threshold ?? undefined,
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project')
        if (err instanceof Error && err.message.includes('Session expired')) navigate('/admin')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await testProjectConnection(projectId)
      setTestResult(r)
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : 'Connection test failed' })
    } finally {
      setTesting(false)
    }
  }

  const handleGenerateCode = async () => {
    try {
      const code = await createAccessCode(projectId, {}, window.location.origin)
      setAccessCodes((prev) => [code, ...prev])
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate code')
    }
  }

  const handleDeleteCode = async (codeId: number) => {
    if (!confirm('Revoke this access code?')) return
    try {
      await deleteAccessCode(codeId)
      setAccessCodes((prev) => prev.filter((c) => c.id !== codeId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to revoke code')
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Deactivate this project? Data collection will stop.')) return
    try {
      await deleteProject(projectId)
      navigate('/admin/dashboard')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate')
    }
  }

  const handleSaveSensors = async () => {
    setSavingSensors(true)
    try {
      const updated = await updateSensorFields(projectId, sensorFields)
      setProject((prev) => prev ? { ...prev, sensor_fields: updated } : null)
      setEditingSensors(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update sensors')
    } finally {
      setSavingSensors(false)
    }
  }

  const addSensorField = () => {
    const used = sensorFields.map((sf) => sf.field_number)
    const next = ([1, 2, 3, 4, 5, 6, 7, 8] as const).find((n) => !used.includes(n))
    if (next) setSensorFields((prev) => [...prev, { field_number: next, name: `Sensor ${next}` }])
  }

  const resetSensorFields = () => {
    if (!project) return
    setSensorFields(project.sensor_fields.map((sf) => ({
      field_number: sf.field_number, name: sf.name,
      unit: sf.unit ?? undefined, min_threshold: sf.min_threshold ?? undefined, max_threshold: sf.max_threshold ?? undefined,
    })))
    setEditingSensors(false)
  }

  if (!id || isNaN(projectId)) {
    return (
      <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--critical)', marginBottom: '16px' }}>Invalid project ID</p>
          <Button onClick={() => navigate('/admin/dashboard')}>BACK TO DASHBOARD</Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-dots" style={{ display: 'flex', gap: '6px' }}><span /><span /><span /></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--critical)', marginBottom: '16px' }}>{error ?? 'Project not found'}</p>
          <Button onClick={() => navigate('/admin/dashboard')}>BACK TO DASHBOARD</Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate('/admin/dashboard')} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', marginBottom: '16px', display: 'block' }}>
          ← DASHBOARD
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, lineHeight: 1 }}>
                {project.name.toUpperCase()}
              </h1>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px',
                color: project.is_active ? 'var(--normal)' : 'var(--unknown)',
                border: `1px solid ${project.is_active ? 'var(--normal)' : 'var(--unknown)'}`,
                padding: '2px 7px', borderRadius: '2px', letterSpacing: '0.1em',
              }}>
                {project.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            {project.location && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{project.location}</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={`/admin/projects/${project.id}/edit`}>
              <Button variant="outline">EDIT</Button>
            </Link>
            <Button variant="danger" onClick={handleDeleteProject}>DEACTIVATE</Button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1px', background: 'var(--border)', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          <Section title="THINGSPEAK CONNECTION">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px', letterSpacing: '0.05em' }}>
              CHANNEL ID: <span style={{ color: 'var(--accent)' }}>{project.thingspeak_channel_id}</span>
            </div>
            <ConnectionTest testing={testing} result={testResult} onTest={handleTestConnection} />
          </Section>

          <Section
            title="SENSOR CONFIGURATION"
            action={
              !editingSensors
                ? <Button variant="outline" size="sm" onClick={() => setEditingSensors(true)}>EDIT</Button>
                : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button variant="ghost" size="sm" onClick={resetSensorFields}>CANCEL</Button>
                    <Button size="sm" onClick={handleSaveSensors} disabled={savingSensors}>
                      {savingSensors ? 'SAVING...' : 'SAVE'}
                    </Button>
                  </div>
                )
            }
          >
            {editingSensors ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sensorFields.map((field, i) => (
                  <SensorFieldForm
                    key={field.field_number}
                    field={field}
                    onChange={(updated) => { const f = [...sensorFields]; f[i] = updated; setSensorFields(f) }}
                    onRemove={() => setSensorFields(sensorFields.filter((_, j) => j !== i))}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSensorField} disabled={sensorFields.length >= 8}>
                  + ADD FIELD
                </Button>
              </div>
            ) : project.sensor_fields.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textAlign: 'center', padding: '16px 0' }}>
                NO SENSOR FIELDS
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                {project.sensor_fields.map((sf) => (
                  <div key={sf.id} style={{ background: 'var(--surface-2)', padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text)', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--accent)' }}>F{sf.field_number}</span> — {sf.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                      {sf.unit ?? 'no unit'} · RANGE {sf.min_threshold ?? '—'} → {sf.max_threshold ?? '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Right column — Access Codes */}
        <Section
          title="ACCESS CODES"
          action={<Button size="sm" onClick={handleGenerateCode}>+ GENERATE</Button>}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>
            Share these links with clients to grant dashboard access.
          </p>
          <AccessCodeList codes={accessCodes} onDelete={handleDeleteCode} />
        </Section>
      </div>
    </div>
  )
}
