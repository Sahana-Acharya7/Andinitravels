import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import {
  Calendar,
  Car,
  LogOut,
  Plus,
  Users,
  TrendingUp,
  Settings,
  Bell,
  ChevronDown,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sun,
  Moon
} from 'lucide-react'

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Passengers', path: '/customers', icon: <Users size={20} /> },
    { label: 'Drivers', path: '/drivers', icon: <Car size={20} /> },
    { label: 'Reports', path: '/reports', icon: <TrendingUp size={20} /> },
  ]

  const getPageTitle = () => {
    const current = navItems.find(item => item.path === location.pathname)
    return current ? current.label : 'Admin'
  }

  return (
    <div className={`admin-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Car size={24} color="white" />
          </div>
          {!isCollapsed && (
            <div className="sidebar-logo-text">
              <h2>Andini Travels</h2>
              <p>Admin Dashboard</p>
            </div>
          )}
        </div>

        <button className="btn-new-booking" onClick={() => navigate('/create')}>
          <Plus size={18} /> {!isCollapsed && '+ New Booking'}
        </button>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.path}
              className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`} 
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : ''}
            >
              {item.icon} {!isCollapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Travel Agency Branding Card */}
        {!isCollapsed && (
          <div className="agency-sidebar-card">
            <div className="agency-header">
              <div className="agency-icon-box">
                <Car size={18} />
              </div>
              <span>Elite Service</span>
            </div>
            <div className="agency-body">
              <p>Andini Travels: Providing premium travel experiences and seamless journeys since 2018.</p>
            </div>
          </div>
        )}

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />} 
            {!isCollapsed && 'Collapse Menu'}
          </button>
          <button className="sidebar-nav-item" style={{ color: '#ef4444' }} onClick={() => signOut(auth)}>
            <LogOut size={20} /> {!isCollapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content-area">
        {/* Header */}
        <header className="content-header">
          <div className="header-title">
            <h1>{getPageTitle()}</h1>
          </div>

          <div className="header-actions">
            {/* Notification and Profile icons removed per user request */}
            <div className="date-picker-trigger">
              <Calendar size={18} />
              <span>Oct 24, 2023 - Oct 31, 2023</span>
              <ChevronDown size={16} />
            </div>
            
            <button className="icon-btn" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
