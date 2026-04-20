const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'shm_admin_token'

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface SensorFieldConfig {
  field_number: number
  name: string
  unit?: string
  min_threshold?: number
  max_threshold?: number
}

export interface SensorFieldResponse extends SensorFieldConfig {
  id: number
}

export interface ProjectResponse {
  id: number
  name: string
  location?: string
  description?: string
  thingspeak_channel_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  sensor_fields: SensorFieldResponse[]
  access_code_count: number
}

export interface ProjectCreate {
  name: string
  location?: string
  description?: string
  thingspeak_channel_id: string
  thingspeak_read_key: string
  sensor_fields?: SensorFieldConfig[]
}

export interface ProjectUpdate {
  name?: string
  location?: string
  description?: string
  thingspeak_channel_id?: string
  thingspeak_read_key?: string
  is_active?: boolean
}

export interface AccessCodeResponse {
  id: number
  code: string
  project_id: number
  is_active: boolean
  expires_at?: string
  access_count: number
  last_accessed_at?: string
  created_at: string
  shareable_link?: string
}

export interface AccessCodeCreate {
  custom_code?: string
  expires_at?: string
}

export interface StatsResponse {
  total_projects: number
  active_projects: number
  total_access_codes: number
  active_access_codes: number
  total_readings: number
  recent_accesses: number
}

export interface ConnectionTestResponse {
  success: boolean
  message: string
  channel_name?: string
  field_count?: number
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getStoredToken()
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })

  if (res.status === 401) {
    clearStoredToken()
    throw new Error('Session expired. Please login again.')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' })) as { detail?: string }
    throw new Error(err.detail ?? 'Request failed')
  }
  if (res.status === 204) return {} as T
  return res.json() as Promise<T>
}

export async function login(password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' })) as { detail?: string }
    throw new Error(err.detail ?? 'Invalid password')
  }
  const data = await res.json() as LoginResponse
  setStoredToken(data.access_token)
  return data
}

export function logout(): void { clearStoredToken() }

export const getProjects = () => apiRequest<ProjectResponse[]>('/api/admin/projects')
export const getProject = (id: number) => apiRequest<ProjectResponse>(`/api/admin/projects/${id}`)
export const createProject = (data: ProjectCreate) => apiRequest<ProjectResponse>('/api/admin/projects', { method: 'POST', body: JSON.stringify(data) })
export const updateProject = (id: number, data: ProjectUpdate) => apiRequest<ProjectResponse>(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteProject = (id: number) => apiRequest<void>(`/api/admin/projects/${id}`, { method: 'DELETE' })
export const testProjectConnection = (id: number) => apiRequest<ConnectionTestResponse>(`/api/admin/projects/${id}/test`, { method: 'POST' })
export const getSensorFields = (projectId: number) => apiRequest<SensorFieldResponse[]>(`/api/admin/projects/${projectId}/sensors`)
export const updateSensorFields = (projectId: number, sensor_fields: SensorFieldConfig[]) => apiRequest<SensorFieldResponse[]>(`/api/admin/projects/${projectId}/sensors`, { method: 'PUT', body: JSON.stringify({ sensor_fields }) })
export const getAccessCodes = (projectId: number, baseUrl?: string) => apiRequest<AccessCodeResponse[]>(`/api/admin/projects/${projectId}/codes${baseUrl ? `?base_url=${encodeURIComponent(baseUrl)}` : ''}`)
export const createAccessCode = (projectId: number, data: AccessCodeCreate = {}, baseUrl?: string) => apiRequest<AccessCodeResponse>(`/api/admin/projects/${projectId}/codes${baseUrl ? `?base_url=${encodeURIComponent(baseUrl)}` : ''}`, { method: 'POST', body: JSON.stringify(data) })
export const deleteAccessCode = (codeId: number) => apiRequest<void>(`/api/admin/codes/${codeId}`, { method: 'DELETE' })
export const getStats = () => apiRequest<StatsResponse>('/api/admin/stats')
