import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import {
  Activity,
  Calendar,
  Car,
  LogOut,
  Plus,
  Play,
  Users,
  TrendingUp,
} from 'lucide-react'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <Play size={18} /> },
    { label: 'Passengers', path: '/customers', icon: <Users size={18} /> },
    { label: 'Drivers', path: '/drivers', icon: <Car size={18} /> },
    { label: 'Reports', path: '/reports', icon: <TrendingUp size={18} /> },
  ]

  return (
    <div className="admin-layout">
      {/* Persistent Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px' }}>
            <Car size={24} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', lineHeight: 1 }}>Andini Travels</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Admin Dashboard</div>
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', marginBottom: '32px' }} onClick={() => navigate('/create')}>
          <Plus size={18} /> New Booking
        </button>

        <nav className="nav-list">
          {navItems.map(item => (
            <button 
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`} 
              onClick={() => navigate(item.path)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="nav-item" style={{ color: 'var(--danger)' }} onClick={() => signOut(auth)}>
            <LogOut size={18} /> Logout
          </button>
        </div>

        <div className="sidebar-promo">
          <div style={{ marginBottom: '12px', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', background: 'white', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <Car size={32} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '8px' }}>Travel management <br/><span style={{ color: 'var(--primary)' }}>made simple</span></div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Manage bookings, drivers and trips efficiently.</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
