import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (userObj) => {
      if (userObj) {
        setUser(userObj)
        // Read role from localStorage (set during login)
        const savedRole = localStorage.getItem('andini_role')
        setRole(savedRole || 'admin')
      } else {
        setUser(null)
        setRole(null)
        localStorage.removeItem('andini_role')
      }
      setLoading(false)
    })
  }, [])

  // Called by Login page after portal selection
  const setUserRole = (newRole) => {
    setRole(newRole)
    localStorage.setItem('andini_role', newRole)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, setUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
