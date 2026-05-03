import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { 
  Car, 
  Lock, 
  ArrowRight, 
  Mail,
  Eye,
  EyeOff,
  User,
  ShieldCheck,
  Info
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import carFleetImage from '../assets/car-fleet.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUserRole } = useAuth()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Verify Role against Firestore
      const driverQuery = query(collection(db, 'drivers'), where('uid', '==', user.uid))
      const driverSnap = await getDocs(driverQuery)
      const isDriver = !driverSnap.empty

      // Auto-detect role and redirect
      const role = isDriver ? 'driver' : 'admin'
      setUserRole(role)
      
      if (role === 'admin') {
        navigate('/dashboard')
      } else {
        navigate('/driver/trips')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-split-page">
      {/* Left Panel: Branding & Visuals */}
      <div className="login-left-panel">
        <div className="login-left-content">
          <div className="brand-logo-large">
            <div className="logo-icon-square">
              <Car size={28} color="white" />
            </div>
            <div className="brand-info">
              <h2>Andini Travels</h2>
              <p>Operations Management System</p>
            </div>
          </div>

          <h1 className="login-hero-title">
            Smart Operations.
            <span>Seamless Journeys.</span>
          </h1>
          
          <p className="login-hero-subtitle">
            A unified platform to manage bookings, drivers, documents and business operations in real-time.
          </p>
        </div>

        <img 
          src={carFleetImage} 
          alt="Modern Car Fleet" 
          className="hero-fleet-image" 
        />
      </div>

      {/* Right Panel: Login Form */}
      <div className="login-right-panel">
        <div className="login-card-wrapper">
          <div className="login-card">
            <div className="login-user-avatar">
              <User size={36} />
            </div>
            
            <h2>Welcome Back</h2>
            <p className="login-card-subtitle">Sign in to continue to your account</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-container">
                  <Mail size={20} className="input-icon-left" />
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <Lock size={20} className="input-icon-left" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="password-visibility-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="form-actions-row">
                <label className="remember-checkbox">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" className="forgot-password-link">Forgot Password?</a>
              </div>

              {error && (
                <div className="error-message-container">
                  {error}
                </div>
              )}

              <button className="primary-login-button" type="submit" disabled={loading}>
                {loading ? (
                  <>Logging in...</>
                ) : (
                  <>Sign In <ArrowRight size={20} /></>
                )}
              </button>
            </form>

            <div className="role-info-alert">
              <ShieldCheck size={24} />
              <div className="role-info-content">
                <p>Role-Based Access Control</p>
                <span>Access will be granted based on your role. You will be redirected to your dashboard after login.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright-footer">
          © 2026 Andini Travels. All rights reserved.
        </div>
      </div>
    </div>
  )
}