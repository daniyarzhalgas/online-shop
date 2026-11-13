import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import RecommendationsPage from './pages/RecommendationsPage'
import Navbar from './components/Navbar'

function PrivateLayout({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateLayout><HomePage /></PrivateLayout>} />
          <Route path="/recommendations" element={<PrivateLayout><RecommendationsPage /></PrivateLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
