#!/usr/bin/env bash
# =============================================================================
# Andini Travels — Animated 3D Sign-In Page Setup Script
# Run from:  PS C:\Users\vishw\Desktop\Andinitravels>  bash script.sh
# =============================================================================
set -e

echo "📦 Installing animation dependencies..."
npm install framer-motion @react-spring/web

echo "✍️  Writing animated Login.jsx..."
mkdir -p src/pages

cat > src/pages/Login.jsx << 'LOGINEOF'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import { Car, Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

// ─── Floating Road Particles ──────────────────────────────────────────────────
function Particle({ delay, left, size, duration }) {
  return (
    <motion.div
      className="lp-particle"
      style={{ left: `${left}%`, width: size, height: size }}
      initial={{ y: '110vh', opacity: 0 }}
      animate={{ y: '-10vh', opacity: [0, 0.7, 0.7, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
  )
}

// ─── 3D SVG Cab ───────────────────────────────────────────────────────────────
function AnimatedCab({ color = '#f59e0b', className = '' }) {
  return (
    <motion.div
      className={`lp-cab-wrap ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" className="lp-cab-svg">
        {/* Shadow */}
        <ellipse cx="100" cy="94" rx="72" ry="6" fill="rgba(0,0,0,0.18)" />
        {/* Body */}
        <rect x="20" y="52" width="160" height="38" rx="10" fill={color} />
        {/* Roof */}
        <path d="M55 52 Q65 24 100 22 Q135 24 145 52 Z" fill={color} />
        {/* Windows */}
        <path d="M62 50 Q68 30 90 28 L90 50 Z" fill="#bfdbfe" opacity="0.9" />
        <rect x="94" y="27" width="28" height="23" rx="3" fill="#bfdbfe" opacity="0.9" />
        <path d="M128 28 Q140 30 138 50 L110 50 Z" fill="#bfdbfe" opacity="0.9" />
        {/* Door lines */}
        <line x1="98" y1="52" x2="98" y2="90" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        {/* Wheels */}
        <circle cx="50" cy="90" r="14" fill="#1e293b" />
        <circle cx="50" cy="90" r="7" fill="#475569" />
        <circle cx="50" cy="90" r="2.5" fill="#94a3b8" />
        <circle cx="150" cy="90" r="14" fill="#1e293b" />
        <circle cx="150" cy="90" r="7" fill="#475569" />
        <circle cx="150" cy="90" r="2.5" fill="#94a3b8" />
        {/* Headlights */}
        <ellipse cx="180" cy="67" rx="6" ry="4" fill="#fef9c3" />
        <ellipse cx="180" cy="67" rx="3" ry="2" fill="#fef08a" />
        {/* Taxi sign */}
        <rect x="84" y="14" width="32" height="11" rx="3" fill="#fbbf24" />
        <text x="100" y="23" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1e293b" fontFamily="Outfit,sans-serif">TAXI</text>
        {/* Stripe */}
        <rect x="20" y="65" width="160" height="6" rx="0" fill="rgba(0,0,0,0.08)" />
        <rect x="20" y="65" width="16" height="6" fill="#000" opacity="0.15" />
        <rect x="52" y="65" width="16" height="6" fill="#000" opacity="0.15" />
        <rect x="84" y="65" width="16" height="6" fill="#000" opacity="0.15" />
        <rect x="116" y="65" width="16" height="6" fill="#000" opacity="0.15" />
        <rect x="148" y="65" width="16" height="6" fill="#000" opacity="0.15" />
      </svg>
    </motion.div>
  )
}

// ─── Road / Road-markings ──────────────────────────────────────────────────────
function RoadScene() {
  return (
    <div className="lp-road-scene">
      <div className="lp-road">
        <div className="lp-road-marking" />
      </div>
    </div>
  )
}

// ─── Tilt Card Wrapper ────────────────────────────────────────────────────────
function TiltCard({ children, className }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-50, 50], [6, -6])
  const rotateY = useTransform(x, [-50, 50], [-6, 6])

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    x.set(clientX - rect.left - rect.width / 2)
    y.set(clientY - rect.top - rect.height / 2)
  }
  const handleLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchEnd={handleLeave}
    >
      {children}
    </motion.div>
  )
}

// ─── Portal Card ──────────────────────────────────────────────────────────────
function PortalCard({ icon: Icon, label, sub, color, bg, onClick }) {
  return (
    <motion.button
      className="lp-portal-btn"
      style={{ '--accent': color, '--accent-bg': bg }}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -4 }}
    >
      <motion.div
        className="lp-portal-icon"
        whileHover={{ rotateY: 180 }}
        transition={{ duration: 0.5 }}
      >
        <Icon size={28} color={color} />
      </motion.div>
      <span className="lp-portal-label">{label}</span>
      <span className="lp-portal-sub">{sub}</span>
    </motion.button>
  )
}

// ─── Main Login Component ─────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUserRole } = useAuth()

  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 6 + 3,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 8,
  }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      setUserRole(mode)
      navigate(mode === 'admin' ? '/dashboard' : '/driver/trips')
    } catch {
      setError('Wrong email or password. Try again.')
      setLoading(false)
    }
  }

  const back = () => { setMode(null); setError(''); setEmail(''); setPassword('') }

  return (
    <div className="lp-root">
      {/* Gradient background */}
      <div className="lp-bg" />

      {/* Floating particles */}
      {particles.map(p => <Particle key={p.id} {...p} />)}

      {/* 3D road + cab scene */}
      <div className="lp-scene-container">
        <motion.div
          className="lp-cabs-row"
          animate={{ x: ['-5%', '5%', '-5%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AnimatedCab color="#f59e0b" className="lp-cab-left" />
          <AnimatedCab color="#f97316" className="lp-cab-right" />
        </motion.div>
        <RoadScene />
      </div>

      {/* Card area */}
      <div className="lp-card-area">
        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.88, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <TiltCard className="lp-glass-card">
                {/* Brand */}
                <div className="lp-brand">
                  <motion.div
                    className="lp-logo"
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  >
                    <Car size={28} color="#fff" />
                  </motion.div>
                  <motion.h1
                    className="lp-title"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Andini Travels
                  </motion.h1>
                  <motion.p
                    className="lp-subtitle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    Choose your portal to continue
                  </motion.p>
                </div>

                {/* Portals */}
                <div className="lp-portal-grid">
                  <PortalCard
                    icon={Shield}
                    label="Admin Portal"
                    sub="Manage bookings & reports"
                    color="#3b82f6"
                    bg="#eff6ff"
                    onClick={() => setMode('admin')}
                  />
                  <PortalCard
                    icon={Car}
                    label="Driver Portal"
                    sub="View trips & availability"
                    color="#10b981"
                    bg="#ecfdf5"
                    onClick={() => setMode('driver')}
                  />
                </div>

                <p className="lp-footer">© 2024 Andini Travels · All rights reserved</p>
              </TiltCard>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.88, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -30 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            >
              <TiltCard className="lp-glass-card">
                {/* Header */}
                <div className="lp-form-header">
                  <motion.div
                    className="lp-form-icon"
                    style={{
                      background: mode === 'admin' ? '#eff6ff' : '#ecfdf5',
                    }}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  >
                    {mode === 'admin'
                      ? <Shield size={24} color="#3b82f6" />
                      : <Car size={24} color="#10b981" />}
                  </motion.div>
                  <div>
                    <h2 className="lp-form-title">Andini Travels</h2>
                    <p className="lp-form-sub">
                      {mode === 'admin' ? 'Administrative Access' : 'Driver Partner Access'}
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="lp-form">
                  <motion.div
                    className="lp-input-wrap"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="lp-label">Email Address</label>
                    <input
                      className="lp-input"
                      type="email"
                      placeholder="name@andinitravels.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </motion.div>

                  <motion.div
                    className="lp-input-wrap"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 }}
                  >
                    <label className="lp-label">Password</label>
                    <div className="lp-pw-wrap">
                      <input
                        className="lp-input lp-pw-input"
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="lp-pw-toggle"
                        onClick={() => setShowPw(v => !v)}
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className="lp-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    className="lp-btn-primary"
                    style={{
                      background: mode === 'admin'
                        ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                    }}
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.26 }}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        Authenticating...
                      </motion.span>
                    ) : 'Sign In'}
                  </motion.button>
                </form>

                <motion.button
                  className="lp-btn-ghost"
                  onClick={back}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32 }}
                >
                  <ArrowLeft size={16} /> Back to portal selection
                </motion.button>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
LOGINEOF

echo "✍️  Writing Login.css..."
cat > src/pages/Login.css << 'CSSEOF'
/* ════════════════════════════════════════════════════════
   Andini Travels — Animated Login Page
   Mobile-first, 3D-perspective, Framer Motion enhanced
════════════════════════════════════════════════════════ */

/* ── Root layout ─────────────────────────────────────── */
.lp-root {
  position: relative;
  min-height: 100dvh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  padding-bottom: 2rem;
  perspective: 1200px;
}

/* ── Background gradient ─────────────────────────────── */
.lp-bg {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e293b 40%,
    #0c1a2e 70%,
    #0f172a 100%
  );
  z-index: 0;
}
.lp-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 10%, rgba(37,99,235,0.25) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 80%, rgba(16,185,129,0.2) 0%, transparent 55%),
    radial-gradient(ellipse 50% 40% at 60% 30%, rgba(245,158,11,0.12) 0%, transparent 50%);
}

/* ── Floating particles ──────────────────────────────── */
.lp-particle {
  position: fixed;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.9), rgba(251,191,36,0.4));
  pointer-events: none;
  z-index: 1;
  filter: blur(1px);
}

/* ── 3D scene container ──────────────────────────────── */
.lp-scene-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 180px;
  z-index: 2;
  pointer-events: none;
}

.lp-cabs-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 5%;
  height: 110px;
}

.lp-cab-wrap {
  filter: drop-shadow(0 12px 20px rgba(0,0,0,0.45));
  transform-style: preserve-3d;
}

.lp-cab-svg {
  width: clamp(130px, 28vw, 200px);
  height: auto;
}

.lp-cab-right {
  transform: scaleX(-1);
  transform-style: preserve-3d;
}

/* ── Road ────────────────────────────────────────────── */
.lp-road-scene {
  width: 100%;
  height: 70px;
  position: relative;
  overflow: hidden;
}

.lp-road {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 54px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-top: 3px solid rgba(245,158,11,0.35);
  overflow: hidden;
}

.lp-road-marking {
  position: absolute;
  top: 50%;
  left: -100%;
  right: -100%;
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 30px,
    rgba(255,255,255,0.35) 30px,
    rgba(255,255,255,0.35) 60px
  );
  transform: translateY(-50%);
  animation: road-move 2s linear infinite;
}

@keyframes road-move {
  from { transform: translateY(-50%) translateX(0); }
  to   { transform: translateY(-50%) translateX(60px); }
}

/* ── Card area ───────────────────────────────────────── */
.lp-card-area {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
  padding: 0 1rem;
  /* Push card up above the road / cabs */
  margin-bottom: 190px;
}

/* ── Glass card ──────────────────────────────────────── */
.lp-glass-card {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  padding: clamp(1.5rem, 6vw, 2.5rem);
  box-shadow:
    0 8px 32px rgba(0,0,0,0.45),
    0 0 0 1px rgba(255,255,255,0.06) inset;
  transform-style: preserve-3d;
}

/* ── Brand section ───────────────────────────────────── */
.lp-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.lp-logo {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 8px 24px rgba(37,99,235,0.45);
  transform-style: preserve-3d;
}

.lp-title {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 0.35rem;
  letter-spacing: -0.02em;
}

.lp-subtitle {
  font-family: 'Outfit', sans-serif;
  font-size: 0.9rem;
  color: rgba(248,250,252,0.6);
  letter-spacing: 0.01em;
}

/* ── Portal buttons ──────────────────────────────────── */
.lp-portal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.lp-portal-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 16px;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #f8fafc;
  transition: border-color 0.25s, background 0.25s;
}

.lp-portal-btn:hover {
  background: rgba(255,255,255,0.1);
  border-color: var(--accent, #fff);
}

.lp-portal-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--accent-bg, rgba(255,255,255,0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
}

.lp-portal-label {
  font-family: 'Outfit', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #f1f5f9;
}

.lp-portal-sub {
  font-family: 'Outfit', sans-serif;
  font-size: 0.72rem;
  color: rgba(248,250,252,0.5);
  text-align: center;
  line-height: 1.4;
}

/* ── Footer ──────────────────────────────────────────── */
.lp-footer {
  font-family: 'Outfit', sans-serif;
  font-size: 0.72rem;
  color: rgba(248,250,252,0.35);
  text-align: center;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.08);
}

/* ── Form header ─────────────────────────────────────── */
.lp-form-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 1.5rem;
}

.lp-form-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lp-form-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.lp-form-sub {
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  color: rgba(248,250,252,0.5);
  margin: 0;
}

/* ── Form inputs ─────────────────────────────────────── */
.lp-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.lp-input-wrap {
  margin-bottom: 1.1rem;
}

.lp-label {
  font-family: 'Outfit', sans-serif;
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(248,250,252,0.65);
  margin-bottom: 0.4rem;
  letter-spacing: 0.02em;
}

.lp-input {
  width: 100%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 12px;
  padding: 12px 14px;
  font-family: 'Outfit', sans-serif;
  font-size: 16px; /* prevents iOS zoom */
  color: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  -webkit-appearance: none;
}

.lp-input::placeholder { color: rgba(248,250,252,0.3); }

.lp-input:focus {
  outline: none;
  border-color: rgba(99,179,237,0.6);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
  background: rgba(255,255,255,0.1);
}

.lp-pw-wrap {
  position: relative;
}

.lp-pw-input { padding-right: 44px; }

.lp-pw-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: rgba(248,250,252,0.5);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}
.lp-pw-toggle:hover { color: #f8fafc; }

/* ── Error ───────────────────────────────────────────── */
.lp-error {
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.4);
  border-radius: 10px;
  padding: 10px 14px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.83rem;
  color: #fca5a5;
  margin-bottom: 1rem;
  overflow: hidden;
}

/* ── Primary button ──────────────────────────────────── */
.lp-btn-primary {
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  border: none;
  cursor: pointer;
  margin-top: 0.25rem;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 14px rgba(0,0,0,0.3);
  transition: opacity 0.2s;
}
.lp-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

/* ── Ghost button ────────────────────────────────────── */
.lp-btn-ghost {
  width: 100%;
  margin-top: 1.25rem;
  padding: 11px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  color: rgba(248,250,252,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.lp-btn-ghost:hover {
  background: rgba(255,255,255,0.1);
  color: #f8fafc;
}

/* ══════════════════════════════════
   Responsive breakpoints
══════════════════════════════════ */

/* Tiny phones (< 360px) */
@media (max-width: 359px) {
  .lp-portal-grid { grid-template-columns: 1fr; }
  .lp-glass-card { padding: 1.25rem; }
}

/* Small phones (360–479px) — PRIMARY target */
@media (min-width: 360px) and (max-width: 479px) {
  .lp-card-area { padding: 0 0.75rem; }
  .lp-glass-card { padding: 1.5rem 1.25rem; }
}

/* Large phones / small tablets (480–767px) */
@media (min-width: 480px) and (max-width: 767px) {
  .lp-scene-container { height: 200px; }
  .lp-card-area { margin-bottom: 210px; }
}

/* Tablets (768px+) */
@media (min-width: 768px) {
  .lp-card-area {
    margin-bottom: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 0;
  }
  .lp-scene-container { height: 220px; }
  .lp-cab-svg { width: 220px; }
}

/* Desktops (1024px+) */
@media (min-width: 1024px) {
  .lp-cab-svg { width: 260px; }
  .lp-glass-card { padding: 3rem 2.5rem; }
}

/* Landscape phone */
@media (max-height: 600px) and (orientation: landscape) {
  .lp-scene-container { height: 120px; }
  .lp-card-area { margin-bottom: 130px; }
  .lp-brand { margin-bottom: 1rem; }
  .lp-logo { width: 44px; height: 44px; margin-bottom: 0.5rem; }
  .lp-title { font-size: 1.25rem; }
}

/* Respect reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  .lp-road-marking { animation: none; }
  .lp-particle { display: none; }
}
CSSEOF

echo ""
echo "✅ Done! Files written:"
echo "   src/pages/Login.jsx  — animated 3D sign-in page"
echo "   src/pages/Login.css  — mobile-first responsive styles"
echo ""
echo "📌 Run 'npm run dev' to preview."
