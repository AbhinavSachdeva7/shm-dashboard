import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import {
  validateAccessCode, getCurrentReadings, getHistory,
  type ProjectInfo, type SensorReading, type HistoryDataPoint,
} from '../../lib/api'
import { SensorCard } from '../portal/SensorCard'
import { HistoryChart } from '../portal/HistoryChart'
import { TimeRangeSelector } from '../portal/TimeRangeSelector'
import { StatusBadge } from '../portal/StatusBadge'

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

function LoadingDots() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 52px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
    }}>
      <div className="loading-dots" style={{ display: 'flex', gap: '6px' }}>
        <span /><span /><span />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
        LOADING
      </span>
    </div>
  )
}

export function PortalDashboard() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [pollError, setPollError] = useState(false)

  useEffect(() => {
    if (!code) { navigate('/portal'); return }
    const load = async () => {
      try {
        const result = await validateAccessCode(code)
        if (!result.valid || !result.project) {
          setError(result.message ?? 'Invalid access code')
          return
        }
        setProject(result.project)
        if (result.project.sensors.length > 0) setSelectedSensor(result.project.sensors[0].field)
      } catch {
        setError('Unable to load project data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [code, navigate])

  const fetchReadings = useCallback(async () => {
    if (!code) return
    try {
      const data = await getCurrentReadings(code)
      setReadings(data.readings)
      if (data.timestamp) setLastUpdated(new Date(data.timestamp))
      setPollError(false)
    } catch {
      setPollError(true)
    }
  }, [code])

  useEffect(() => {
    if (!project) return
    fetchReadings()
    const interval = setInterval(fetchReadings, 30000)
    return () => clearInterval(interval)
  }, [project, fetchReadings])

  useEffect(() => {
    if (!code || selectedSensor === null) return
    const fetchHistory = async () => {
      setHistoryLoading(true)
      try {
        const data = await getHistory(code, selectedSensor, timeRange)
        setHistoryData(data.data)
      } catch {
        setHistoryData([])
      } finally {
        setHistoryLoading(false)
      }
    }
    fetchHistory()
  }, [code, selectedSensor, timeRange])

  const overallStatus = readings.length > 0
    ? readings.some((r) => r.status === 'critical') ? 'critical'
    : readings.some((r) => r.status === 'warning') ? 'warning'
    : readings.some((r) => r.status === 'unknown') ? 'unknown'
    : 'normal'
    : 'unknown'

  if (loading) return <LoadingDots />

  if (error) {
    return (
      <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px', padding: '0 24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.3em', color: 'var(--critical)', marginBottom: '16px' }}>
            ACCESS DENIED
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>INVALID CODE</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
          <Button onClick={() => navigate('/portal')}>TRY AGAIN</Button>
        </div>
      </div>
    )
  }

  if (!project) return null

  const selectedReading = readings.find((r) => r.field === selectedSensor)

  const delayClasses = ['animate-fade-up-delay-1', 'animate-fade-up-delay-2', 'animate-fade-up-delay-3', 'animate-fade-up-delay-4', 'animate-fade-up-delay-5', 'animate-fade-up-delay-6'] as const

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '6px' }}>
            {project.location ?? 'STRUCTURAL MONITORING'}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, lineHeight: 1, marginBottom: '8px' }}>
            {project.name.toUpperCase()}
          </h1>
          {project.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '480px' }}>{project.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <StatusBadge status={overallStatus} size="lg" />
          {lastUpdated && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              UPDATED {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Sensor Grid */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '16px' }}>
          LIVE READINGS
        </div>
        {pollError && (
          <div style={{
            marginBottom: '16px',
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--critical)',
            letterSpacing: '0.1em',
          }}>
            ● LIVE DATA UNAVAILABLE — displaying last known readings
            {lastUpdated && ` (as of ${lastUpdated.toLocaleTimeString()})`}
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}>
          {readings.map((r, i) => (
            <div key={r.field} className={`animate-fade-up ${delayClasses[Math.min(i, 5)]}`}>
              <SensorCard
                reading={r}
                isSelected={r.field === selectedSensor}
                onClick={() => setSelectedSensor(r.field)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* History Chart */}
      {selectedSensor !== null && (
        <section
          className="animate-fade-up animate-fade-up-delay-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '4px' }}>
                HISTORICAL DATA
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700 }}>
                {(selectedReading?.name ?? `SENSOR ${selectedSensor}`).toUpperCase()}
              </h2>
            </div>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          {historyLoading ? (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-dots" style={{ display: 'flex', gap: '6px' }}>
                <span /><span /><span />
              </div>
            </div>
          ) : (
            <HistoryChart
              data={historyData}
              unit={selectedReading?.unit}
              thresholds={selectedReading?.thresholds}
            />
          )}
        </section>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          ACCESS CODE: <span style={{ color: 'var(--accent)' }}>{code}</span>
        </span>
        <a href="mailto:support@paritta.in" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'none' }}>
          CONTACT SUPPORT →
        </a>
      </div>
    </div>
  )
}
