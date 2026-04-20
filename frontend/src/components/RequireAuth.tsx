import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../lib/adminApi'
import type { ReactNode } from 'react'

export function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin" replace />
  }
  return <>{children}</>
}
