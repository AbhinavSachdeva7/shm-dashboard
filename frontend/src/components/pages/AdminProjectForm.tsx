import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { createProject, getProject, updateProject, type ProjectCreate, type SensorFieldConfig } from '../../lib/adminApi'
import { SensorFieldForm } from '../admin/SensorFieldForm'

function FieldLabel({ children }: { children: string }) {
  return (
    <label style={{
      display: 'block', fontFamily: 'var(--font-mono)', fontSize: '9px',
      letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' as const, marginBottom: '8px',
    }}>{children}</label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: '20px' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export function AdminProjectForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [channelId, setChannelId] = useState('')
  const [readKey, setReadKey] = useState('')
  const [sensorFields, setSensorFields] = useState<SensorFieldConfig[]>([])

  useEffect(() => {
    if (!isEditing || !id) return
    setLoading(true)
    getProject(parseInt(id, 10))
      .then((p) => {
        setName(p.name)
        setLocation(p.location ?? '')
        setDescription(p.description ?? '')
        setChannelId(p.thingspeak_channel_id)
        setSensorFields(p.sensor_fields.map((sf) => ({
          field_number: sf.field_number,
          name: sf.name,
          unit: sf.unit ?? undefined,
          min_threshold: sf.min_threshold ?? undefined,
          max_threshold: sf.max_threshold ?? undefined,
        })))
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load project')
        if (err instanceof Error && err.message.includes('Session expired')) navigate('/admin')
      })
      .finally(() => setLoading(false))
  }, [isEditing, id])

  const addSensorField = () => {
    const used = sensorFields.map((sf) => sf.field_number)
    const next = ([1, 2, 3, 4, 5, 6, 7, 8] as const).find((n) => !used.includes(n))
    if (next) setSensorFields([...sensorFields, { field_number: next, name: `Sensor ${next}` }])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (isEditing && id) {
        if (isNaN(parseInt(id, 10))) { navigate('/admin/dashboard'); return }
        await updateProject(parseInt(id, 10), {
          name, location: location || undefined, description: description || undefined,
          thingspeak_channel_id: channelId, thingspeak_read_key: readKey || undefined,
        })
        navigate(`/admin/projects/${id}`)
      } else {
        const data: ProjectCreate = {
          name, location: location || undefined, description: description || undefined,
          thingspeak_channel_id: channelId, thingspeak_read_key: readKey,
          sensor_fields: sensorFields.length > 0 ? sensorFields : undefined,
        }
        const project = await createProject(data)
        navigate(`/admin/projects/${project.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-dots" style={{ display: 'flex', gap: '6px' }}><span /><span /><span /></div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: '700px', margin: '0 auto' }}>
      <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
        <button onClick={() => navigate(isEditing && id ? `/admin/projects/${id}` : '/admin/dashboard')} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em', marginBottom: '16px', display: 'block' }}>
          ← BACK
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, lineHeight: 1 }}>
          {isEditing ? 'EDIT PROJECT' : 'NEW PROJECT'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
        <Section title="PROJECT DETAILS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <FieldLabel>Project Name *</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MTHL Bridge Monitoring" required />
            </div>
            <div>
              <FieldLabel>Location</FieldLabel>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai Trans-Harbour Link" />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the monitoring setup..." rows={3} />
            </div>
          </div>
        </Section>

        <Section title="THINGSPEAK CONNECTION">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <FieldLabel>Channel ID *</FieldLabel>
              <Input value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="e.g. 1234567" required />
            </div>
            <div>
              <FieldLabel>Read API Key {!isEditing && '*'}</FieldLabel>
              <Input value={readKey} onChange={(e) => setReadKey(e.target.value)} placeholder={isEditing ? 'Leave blank to keep existing' : 'Enter API key'} required={!isEditing} />
            </div>
          </div>
        </Section>

        {!isEditing && (
          <Section title="SENSOR FIELDS">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sensorFields.map((field, i) => (
                <SensorFieldForm
                  key={field.field_number}
                  field={field}
                  onChange={(updated) => { const f = [...sensorFields]; f[i] = updated; setSensorFields(f) }}
                  onRemove={() => setSensorFields(sensorFields.filter((_, j) => j !== i))}
                />
              ))}
              <Button type="button" variant="outline" onClick={addSensorField} disabled={sensorFields.length >= 8}>
                + ADD SENSOR FIELD
              </Button>
            </div>
          </Section>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--critical)' }}>
            {error}
          </div>
        )}

        <div style={{ background: 'var(--surface)', padding: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={() => navigate(isEditing && id ? `/admin/projects/${id}` : '/admin/dashboard')} disabled={saving}>CANCEL</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'SAVING...' : isEditing ? 'UPDATE PROJECT' : 'CREATE PROJECT'}
          </Button>
        </div>
      </form>
    </div>
  )
}
