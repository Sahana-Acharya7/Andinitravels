import { useNavigate, useLocation } from 'react-router-dom'
import { Car, Clock, User } from 'lucide-react'

export default function DriverBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const navItems = [
    { label: 'Trips', path: '/driver/trips', icon: <Car size={22} /> },
    { label: 'Availability', path: '/driver/availability', icon: <Clock size={22} /> },
    { label: 'Profile', path: '/driver/profile', icon: <User size={22} /> }
  ]

  return (
    <div style={styles.navContainer}>
      {navItems.map(item => {
        const active = location.pathname.includes(item.path)
        return (
          <div 
            key={item.label}
            style={{...styles.navItem, color: active ? '#2563eb' : '#64748b'}}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span style={styles.navLabel}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  navContainer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65px',
    background: '#fff',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
    zIndex: 100,
    fontFamily: 'sans-serif'
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer',
    width: '33%',
  },
  navLabel: {
    fontSize: '0.75rem',
    fontWeight: '600'
  }
}
