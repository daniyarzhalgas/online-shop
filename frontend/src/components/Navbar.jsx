import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'
import { useState, useEffect } from 'react'
import {
  ShoppingBag, LayoutDashboard, Sparkles, Package,
  BarChart2, Settings, User, LogOut, Moon, Sun, Menu, X
} from 'lucide-react'

const NAV_LINKS = [
  { to: '/',               label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/recommendations', label: 'For You',          icon: Sparkles },
  { to: '/catalog',        label: 'Catalog',         icon: Package },
  { to: '/analytics',     label: 'Analytics',       icon: BarChart2 },
]

export default function Navbar() {
  const { username, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 50,
      height: 64, display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 16
    }}>
      {/* Logo */}
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <ShoppingBag size={24} style={{ color: 'var(--primary)' }} />
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
          Shop<span style={{ color: 'var(--primary)' }}>Rec</span>
        </span>
      </NavLink>

      {/* Desktop nav */}
      <div style={{ display: 'flex', gap: 4, flex: 1, marginLeft: 16 }}>
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
              transition: 'all 0.15s', textDecoration: 'none'
            })}
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
              transition: 'all 0.15s', textDecoration: 'none'
            })}
          >
            <Settings size={16} /> Admin
          </NavLink>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={() => setDark(!dark)}
          style={{
            width: 36, height: 36, borderRadius: 8, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer'
          }}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User menu */}
        <NavLink
          to="/profile"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
            borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)',
            fontSize: 14, fontWeight: 500, color: 'var(--text)', textDecoration: 'none',
            transition: 'all 0.15s'
          }}
        >
          <User size={16} style={{ color: 'var(--primary)' }} />
          {username}
        </NavLink>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 8, background: 'transparent', border: '1px solid var(--border)',
            fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s'
          }}
          title="Logout"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </nav>
  )
}
