const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface SensorInfo {
  field: number
  name: string
  unit?: string
}

export interface ProjectInfo {
  name: string
  location?: string
  description?: string
  sensors: SensorInfo[]
}

export interface AccessCodeValidation {
  valid: boolean
  project?: ProjectInfo
  message?: string
}

export interface ThresholdInfo {
  min?: number
  max?: number
}

export interface SensorReading {
  field: number
  name: string
  value?: number
  unit?: string
  status: 'normal' | 'warning' | 'critical' | 'unknown'
  thresholds: ThresholdInfo
}

export interface CurrentReadingsResponse {
  timestamp?: string
  readings: SensorReading[]
}

export interface HistoryDataPoint {
  timestamp: string
  value: number
}

export interface HistoryResponse {
  field: number
  name: string
  unit?: string
  data: HistoryDataPoint[]
}

export async function validateAccessCode(code: string): Promise<AccessCodeValidation> {
  const res = await fetch(`${API_BASE}/api/portal/${code}`)
  if (!res.ok) throw new Error('Failed to validate access code')
  return res.json() as Promise<AccessCodeValidation>
}

export async function getCurrentReadings(code: string): Promise<CurrentReadingsResponse> {
  const res = await fetch(`${API_BASE}/api/portal/${code}/current`)
  if (!res.ok) throw new Error('Failed to fetch readings')
  return res.json() as Promise<CurrentReadingsResponse>
}

export async function getHistory(
  code: string,
  field: number,
  range: '1h' | '6h' | '24h' | '7d' | '30d' = '24h',
): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/api/portal/${code}/history?field=${field}&range=${range}`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json() as Promise<HistoryResponse>
}
