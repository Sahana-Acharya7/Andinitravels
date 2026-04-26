import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { Car, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState(null) // null = landing, 'admin', 'driver'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUserRole } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Store the chosen role so AuthContext + ProtectedRoute use it
      setUserRole(mode)
      if (mode === 'admin') {
        navigate('/dashboard')
      } else {
        navigate('/driver/trips')
      }
    } catch (err) {
      setError('Wrong email or password. Try again.')
      setLoading(false)
    }
  }

  // Landing page — choose portal
  if (!mode) {
    return (
      <div style={styles.container}>
        <div style={styles.landingCard}>
          <h1 style={styles.brandTitle}>Andini Travels</h1>
          <p style={styles.brandSub}>Choose your portal to continue</p>

          <div style={styles.portalGrid}>
            <div style={styles.portalCard} onClick={() => setMode('admin')}>
              <div style={{ ...styles.portalIcon, background: '#dbeafe' }}>
                <Shield size={32} color="#2563eb" />
              </div>
              <div style={styles.portalLabel}>Admin Portal</div>
              <div style={styles.portalDesc}>Manage bookings, drivers & reports</div>
            </div>

            <div style={styles.portalCard} onClick={() => setMode('driver')}>
              <div style={{ ...styles.portalIcon, background: '#dcfce7' }}>
                <Car size={32} color="#16a34a" />
              </div>
              <div style={styles.portalLabel}>Driver Portal</div>
              <div style={styles.portalDesc}>View trips, update status & availability</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Login form
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div style={{
            ...styles.portalIcon,
            background: mode === 'admin' ? '#dbeafe' : '#dcfce7',
            width: '44px', height: '44px',
          }}>
            {mode === 'admin'
              ? <Shield size={22} color="#2563eb" />
              : <Car size={22} color="#16a34a" />
            }
          </div>
          <div>
            <h1 style={styles.brand}>Andini Travels</h1>
            <p style={styles.sub}>
              {mode === 'admin' ? 'Admin Login' : 'Driver Login'}
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button
            style={{
              ...styles.btn,
              background: mode === 'admin' ? '#2563eb' : '#16a34a',
            }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <button style={styles.backLink} onClick={() => { setMode(null); setError(''); setEmail(''); setPassword('') }}>
          ← Back to portal selection
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f6fa',
    fontFamily: 'sans-serif',
    padding: '1rem',
  },
  // Landing
  landingCard: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  brandTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#1a1a2e',
    margin: '0 0 0.3rem 0',
  },
  brandSub: {
    color: '#64748b',
    fontSize: '0.95rem',
    marginBottom: '2rem',
  },
  portalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  portalCard: {
    background: '#fafbfd',
    border: '1.5px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.5rem 1rem',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  portalIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 0.75rem',
  },
  portalLabel: {
    fontWeight: '700',
    fontSize: '1rem',
    color: '#1a1a2e',
    marginBottom: '0.3rem',
  },
  portalDesc: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  // Login form
  card: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '1.5rem',
  },
  brand: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: 0,
  },
  sub: {
    color: '#64748b',
    fontSize: '0.88rem',
    margin: 0,
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1.5px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '1rem',
    outline: 'none',
    display: 'block',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%',
    padding: '0.85rem',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  error: {
    color: '#e53e3e',
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
  },
  backLink: {
    display: 'block',
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.88rem',
    marginTop: '1.25rem',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: '500',
  },
}