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

  if (!mode) {
    return (
      <div style={styles.container}>
        <div className="card-premium" style={styles.landingCard}>
          <div style={styles.brandContainer}>
            <div style={styles.logoIcon}>
              <Car size={32} color="white" />
            </div>
            <h1 className="heading-1" style={{ marginBottom: '0.5rem' }}>Andini Travels</h1>
            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.95rem' }}>Select your portal to continue</p>
          </div>

          <div style={styles.portalGrid}>
            <div className="card card-hover" style={styles.portalCard} onClick={() => setMode('admin')}>
              <div style={{ ...styles.portalIcon, background: 'var(--info-subtle)' }}>
                <Shield size={28} color="var(--info)" />
              </div>
              <div className="text-value" style={{ marginBottom: '4px' }}>Admin Portal</div>
              <div className="text-label" style={{ textTransform: 'none', fontSize: '0.75rem', lineHeight: '1.4' }}>Manage bookings, drivers & reports</div>
            </div>

            <div className="card card-hover" style={styles.portalCard} onClick={() => setMode('driver')}>
              <div style={{ ...styles.portalIcon, background: 'var(--success-subtle)' }}>
                <Car size={28} color="var(--success)" />
              </div>
              <div className="text-value" style={{ marginBottom: '4px' }}>Driver Portal</div>
              <div className="text-label" style={{ textTransform: 'none', fontSize: '0.75rem', lineHeight: '1.4' }}>View trips, update status & availability</div>
            </div>
          </div>
          
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <p className="text-label" style={{ textTransform: 'none' }}>© 2024 Andini Travels. All rights reserved.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div className="card-premium" style={styles.card}>
        <div style={styles.headerRow}>
          <div style={{
            ...styles.portalIcon,
            background: mode === 'admin' ? 'var(--info-subtle)' : 'var(--success-subtle)',
            width: '48px', height: '48px', margin: 0
          }}>
            {mode === 'admin'
              ? <Shield size={24} color="var(--info)" />
              : <Car size={24} color="var(--success)" />
            }
          </div>
          <div>
            <h2 className="heading-3" style={{ margin: 0 }}>Andini Travels</h2>
            <p className="text-label" style={{ textTransform: 'none', fontSize: '0.85rem' }}>
              {mode === 'admin' ? 'Administrative Access' : 'Driver Partner Access'}
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} style={{ marginTop: '1.5rem' }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              style={{ width: '100%' }}
              type="email"
              placeholder="name@andinitravels.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              style={{ width: '100%' }}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && (
            <div className="badge-danger" style={{ width: '100%', padding: '10px', borderRadius: '8px', marginBottom: '1.25rem', justifyContent: 'center' }}>
              {error}
            </div>
          )}
          
          <button
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              background: mode === 'admin' ? 'var(--primary)' : 'var(--success)',
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <button 
          className="btn btn-ghost" 
          style={{ width: '100%', marginTop: '1.5rem', fontSize: '0.875rem' }} 
          onClick={() => { setMode(null); setError(''); setEmail(''); setPassword('') }}
        >
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
    background: 'var(--bg-page)',
    padding: '1.5rem',
  },
  landingCard: {
    padding: '3rem 2rem',
    width: '100%',
    maxWidth: '560px',
    textAlign: 'center',
  },
  brandContainer: {
    marginBottom: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    background: 'var(--primary)',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)',
  },
  portalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  },
  portalCard: {
    padding: '1.5rem 1.25rem',
    cursor: 'pointer',
    textAlign: 'center',
  },
  portalIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  card: {
    padding: '2.5rem',
    width: '100%',
    maxWidth: '440px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--border-light)',
  },
}