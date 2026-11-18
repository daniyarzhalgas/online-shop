import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'
import { ShoppingBag, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      login(res.data.token, res.data.username, res.data.role)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)', borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        padding: 40
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'color-mix(in srgb, var(--primary) 12%, var(--surface))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShoppingBag size={28} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            Welcome back to <span style={{ color: 'var(--primary)' }}>ShopRec</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Sign in to get your personalized picks
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'color-mix(in srgb, var(--danger) 10%, var(--surface))',
            border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
            color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, marginBottom: 20, fontSize: 14
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Username
            </label>
            <input
              type="text" value={username} required autoFocus
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. daniyar"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password} required
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '10px 40px 10px 14px', borderRadius: 10, fontSize: 14,
                  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                type="button" onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: loading ? 'var(--border)' : 'var(--primary)',
              color: '#fff', fontWeight: 600, fontSize: 15, cursor: loading ? 'default' : 'pointer',
              marginTop: 4, transition: 'background 0.2s'
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
        </p>

        {/* Demo accounts */}
        <div style={{
          marginTop: 24, padding: 16, borderRadius: 10,
          background: 'var(--bg)', border: '1px solid var(--border)'
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>
            TEST ACCOUNTS
          </p>
          {[
            ['daniyar', 'password123', 'USER'],
            ['aizat',   'password123', 'USER'],
            ['admin',   'admin123',    'ADMIN'],
          ].map(([u, p, r]) => (
            <div
              key={u}
              onClick={() => { setUsername(u); setPassword(p) }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                transition: 'background 0.15s', fontSize: 13,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <code style={{ color: 'var(--primary)' }}>{u}</code>
              <span style={{ color: 'var(--text-muted)' }}>{p}</span>
              <span style={{
                fontSize: 10, background: r === 'ADMIN' ? '#ef444420' : '#10b98120',
                color: r === 'ADMIN' ? '#ef4444' : '#10b981',
                padding: '2px 6px', borderRadius: 10
              }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
