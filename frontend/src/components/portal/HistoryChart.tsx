import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { type HistoryDataPoint, type ThresholdInfo } from '../../lib/api'

interface HistoryChartProps {
  data: HistoryDataPoint[]
  unit?: string
  thresholds?: ThresholdInfo
}

function calcStatus(v: number, min?: number, max?: number): 'normal' | 'warning' | 'critical' {
  if (min !== undefined && max !== undefined) {
    const margin = (max - min) * 0.1
    if (v < min || v > max) return 'critical'
    if (v < min + margin || v > max - margin) return 'warning'
    return 'normal'
  }
  if (min !== undefined) {
    if (v < min) return 'critical'
    if (v < min * 1.1) return 'warning'
    return 'normal'
  }
  if (max !== undefined) {
    if (v > max) return 'critical'
    if (v > max * 0.9) return 'warning'
    return 'normal'
  }
  return 'normal'
}

const STATUS_COLOR = { normal: '#22C55E', warning: '#F59E0B', critical: '#EF4444' }

interface ChartPoint {
  ts: number
  value: number
  label: string
  status: 'normal' | 'warning' | 'critical'
  color: string
}

export function HistoryChart({ data, unit, thresholds }: HistoryChartProps) {
  const chartData: ChartPoint[] = data
    .filter((p) => p.value !== null && !isNaN(p.value))
    .map((p) => {
      const status = calcStatus(p.value, thresholds?.min, thresholds?.max)
      return {
        ts: new Date(p.timestamp).getTime(),
        value: p.value,
        label: new Date(p.timestamp).toLocaleString(),
        status,
        color: STATUS_COLOR[status],
      }
    })

  const showDots = chartData.length <= 200

  if (chartData.length === 0) {
    return (
      <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em' }}>
        NO DATA FOR SELECTED RANGE
      </div>
    )
  }

  const vals = chartData.map((d) => d.value)
  const pad = ((Math.max(...vals) - Math.min(...vals)) * 0.1) || 1
  let yMin = Math.min(...vals) - pad
  let yMax = Math.max(...vals) + pad
  if (thresholds?.min !== undefined && thresholds.min < yMin) yMin = thresholds.min - pad
  if (thresholds?.max !== undefined && thresholds.max > yMax) yMax = thresholds.max + pad

  function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-2)',
        padding: '10px 14px',
        borderRadius: '2px',
        fontFamily: 'var(--font-mono)',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>{d.label}</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent)' }}>
          {d.value.toFixed(3)}{unit ? ` ${unit}` : ''}
        </div>
        <div style={{ fontSize: '9px', color: d.color, marginTop: '4px', letterSpacing: '0.1em' }}>
          ● {d.status.toUpperCase()}
        </div>
      </div>
    )
  }

  function CustomDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
    const { cx, cy, payload } = props
    if (cx === undefined || cy === undefined || !payload) return null
    return <circle cx={cx} cy={cy} r={3} fill={payload.color} stroke="none" />
  }

  function CustomActiveDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
    const { cx, cy, payload } = props
    if (cx === undefined || cy === undefined || !payload) return null
    return <circle cx={cx} cy={cy} r={5} fill={payload.color} stroke="var(--bg)" strokeWidth={2} />
  }

  return (
    <div style={{ height: '320px', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="ts"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(ts: number) => {
              const d = new Date(ts)
              return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
            }}
            tick={{ fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => v.toFixed(1)}
            tick={{ fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={55}
            unit={unit ? ` ${unit}` : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          {thresholds?.min !== undefined && (
            <ReferenceLine
              y={thresholds.min}
              stroke="var(--critical)"
              strokeDasharray="5 3"
              strokeOpacity={0.6}
              label={{ value: `MIN ${thresholds.min}`, position: 'insideBottomLeft', fill: 'var(--critical)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
            />
          )}
          {thresholds?.max !== undefined && (
            <ReferenceLine
              y={thresholds.max}
              stroke="var(--critical)"
              strokeDasharray="5 3"
              strokeOpacity={0.6}
              label={{ value: `MAX ${thresholds.max}`, position: 'insideTopLeft', fill: 'var(--critical)', fontSize: 9, fontFamily: 'var(--font-mono)' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={1.5}
            dot={showDots ? (CustomDot as unknown as React.ReactElement) : false}
            activeDot={CustomActiveDot as unknown as React.ReactElement}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
