import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Portal } from './components/pages/Portal'
import { PortalDashboard } from './components/pages/PortalDashboard'
import { AdminLogin } from './components/pages/AdminLogin'
import { AdminDashboard } from './components/pages/AdminDashboard'
import { AdminProjectForm } from './components/pages/AdminProjectForm'
import { AdminProjectDetail } from './components/pages/AdminProjectDetail'
import { RequireAuth } from './components/RequireAuth'

function Header() {
  const location = useLocation()
  const zone = location.pathname.startsWith('/portal') ? 'PORTAL'
    : location.pathname.startsWith('/admin') ? 'ADMIN'
    : null

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--surface)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to={zone === 'PORTAL' ? '/portal' : '/admin'} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 800,
          color: 'var(--text)',
          letterSpacing: '0.05em',
        }}>
          SHM
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--accent)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          padding: '2px 6px',
          border: '1px solid var(--accent)',
          borderRadius: '2px',
        }}>
          DASHBOARD
        </span>
      </Link>
      {zone && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--text-muted)',
          letterSpacing: '0.2em',
        }}>
          {zone}
        </span>
      )}
    </header>
  )
}

function AppContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/portal/:code" element={<PortalDashboard />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/projects/new" element={<RequireAuth><AdminProjectForm /></RequireAuth>} />
          <Route path="/admin/projects/:id" element={<RequireAuth><AdminProjectDetail /></RequireAuth>} />
          <Route path="/admin/projects/:id/edit" element={<RequireAuth><AdminProjectForm /></RequireAuth>} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
