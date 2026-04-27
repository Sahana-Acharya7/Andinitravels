import { useNavigate, useLocation } from 'react-router-dom'
import { Car, Clock, User } from 'lucide-react'

export default function DriverBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const navItems = [
    { label: 'Trips', path: '/driver/trips', icon: <Car size={24} /> },
    { label: 'Schedule', path: '/driver/availability', icon: <Clock size={24} /> },
    { label: 'Profile', path: '/driver/profile', icon: <User size={24} /> }
  ]

  return (
    <nav style={styles.navContainer} className="glass">
      {navItems.map(item => {
        const active = location.pathname.includes(item.path)
        return (
          <button 
            key={item.label}
            style={{
              ...styles.navItem, 
              color: active ? 'var(--primary)' : 'var(--text-tertiary)',
            }}
            onClick={() => navigate(item.path)}
          >
            <div style={{
              ...styles.iconWrapper,
              background: active ? 'var(--primary-subtle)' : 'transparent',
            }}>
              {item.icon}
            </div>
            <span style={{
              ...styles.navLabel,
              fontWeight: active ? '700' : '500',
              color: active ? 'var(--primary)' : 'var(--text-tertiary)'
            }}>
              {item.label}
            </span>
            {active && <div style={styles.activeDot} />}
          </button>
        )
      })}
    </nav>
  )
}

const styles = {
  navContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '76px',
    background: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 12px 12px 12px',
    boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
    zIndex: 1000,
    borderTop: '1px solid var(--border-light)',
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    width: '30%',
    padding: '8px 0',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  iconWrapper: {
    padding: '6px 16px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  navLabel: {
    fontSize: '0.6875rem',
    marginTop: '2px',
  },
  activeDot: {
    position: 'absolute',
    bottom: '-2px',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    background: 'var(--primary)',
  }
}

