import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useToast } from './hooks/useToast'
import { createContext, useContext } from 'react'

import Navbar       from './components/Navbar'
import Toast        from './components/Toast'

import LandingPage        from './pages/LandingPage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import DashboardPage      from './pages/DashboardPage'
import RecommendationsPage from './pages/RecommendationsPage'
import CatalogPage        from './pages/CatalogPage'
import ProductDetailPage  from './pages/ProductDetailPage'
import ProfilePage        from './pages/ProfilePage'
import AnalyticsPage      from './pages/AnalyticsPage'
import AdminPage          from './pages/AdminPage'

export const ToastContext = createContext(null)
export const useGlobalToast = () => useContext(ToastContext)

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { token, isAdmin } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px)', background: 'var(--bg)' }}>
        {children}
      </main>
    </>
  )
}

function AppInner() {
  const { toasts, addToast, removeToast } = useToast()

  return (
    <ToastContext.Provider value={addToast}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout><DashboardPage /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/recommendations" element={
            <PrivateRoute>
              <AppLayout><RecommendationsPage /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/catalog" element={
            <PrivateRoute>
              <AppLayout><CatalogPage /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/products/:id" element={
            <PrivateRoute>
              <AppLayout><ProductDetailPage /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <AppLayout><ProfilePage /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute>
              <AppLayout><AnalyticsPage /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AppLayout><AdminPage /></AppLayout>
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toast toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
