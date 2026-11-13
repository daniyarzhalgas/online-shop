import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'

export default function Navbar() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        🛍 Shop<span>Rec</span>
      </NavLink>

      <div className="navbar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          Products
        </NavLink>
        <NavLink
          to="/recommendations"
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          ✨ Recommendations
        </NavLink>
      </div>

      <div className="navbar-right">
        <span className="navbar-user">Hello, <strong>{username}</strong></span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
