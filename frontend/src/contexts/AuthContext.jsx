import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token,    setToken]    = useState(() => localStorage.getItem('token'))
  const [username, setUsername] = useState(() => localStorage.getItem('username'))
  const [role,     setRole]     = useState(() => localStorage.getItem('role') || 'USER')

  const login = (tok, uname, userRole = 'USER') => {
    localStorage.setItem('token',    tok)
    localStorage.setItem('username', uname)
    localStorage.setItem('role',     userRole)
    setToken(tok)
    setUsername(uname)
    setRole(userRole)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    setToken(null)
    setUsername(null)
    setRole('USER')
  }

  const isAdmin = role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ token, username, role, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
