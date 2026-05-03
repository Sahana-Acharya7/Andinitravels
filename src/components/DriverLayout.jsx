import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Car, 
  Calendar, 
  Clock, 
  Wallet, 
  FileText, 
  User, 
  LogOut, 
  ChevronLeft,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isDark, setIsDark] = React.useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const menuItems = [
    { icon: <Car size={20} />, label: 'Trips', path: '/driver/trips' },
    { icon: <Calendar size={20} />, label: 'Schedule', path: '/driver/schedule' },
    { icon: <Wallet size={20} />, label: 'Earnings', path: '/driver/earnings' },
    { icon: <User size={20} />, label: 'Profile', path: '/driver/profile' },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: isCollapsed ? '80px' : '260px'
      }}>
        <div style={styles.sidebarContent}>
          <div style={styles.brand}>
            <div style={styles.logoIcon}>
              <Car size={24} color="#fff" />
            </div>
            {!isCollapsed && (
              <div>
                <div style={styles.logoText}>Andini Travels</div>
                <div style={styles.logoSub}>Driver Portal</div>
              </div>
            )}
          </div>

          <nav style={styles.nav}>
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  backgroundColor: location.pathname === item.path ? 'var(--primary-subtle)' : 'transparent',
                  color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-secondary)',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{
                  ...styles.navIcon,
                  color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-secondary)'
                }}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.label}</span>}
                {location.pathname === item.path && !isCollapsed && (
                  <div style={styles.activeIndicator} />
                )}
              </button>
            ))}
          </nav>

          <div style={styles.sidebarFooter}>
            <button onClick={handleLogout} style={{...styles.footerItem, justifyContent: isCollapsed ? 'center' : 'flex-start'}}>
              <LogOut size={20} color="var(--danger)" />
              {!isCollapsed && <span style={{color: 'var(--danger)'}}>Sign Out</span>}
            </button>
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)} 
              style={{...styles.footerItem, justifyContent: isCollapsed ? 'center' : 'flex-start'}}
            >
              <ChevronLeft size={20} style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', color: 'var(--text-secondary)' }} />
              {!isCollapsed && <span style={{color: 'var(--text-secondary)'}}>Collapse</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          <div style={styles.headerActions}>
            <button style={styles.iconButton} onClick={() => setIsDark(!isDark)} title="Toggle Theme">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-page)',
    color: 'var(--text-primary)',
  },
  sidebar: {
    backgroundColor: 'var(--bg-card)',
    borderRight: '1px solid var(--border)',
    transition: 'width 0.3s ease',
    position: 'sticky',
    top: 0,
    height: '100vh',
    zIndex: 100,
  },
  sidebarContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '1.5rem 1rem',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2.5rem',
    padding: '0 0.5rem',
  },
  logoIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: 'var(--success)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '700',
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  navIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    right: '0.5rem',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
  },
  sidebarFooter: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-light)',
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    height: '70px',
    padding: '0 2.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  iconButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  },
  notificationDot: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--danger)',
    border: '2px solid var(--bg-card)',
    borderRadius: '50%',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  profileImg: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--bg-card)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  content: {
    padding: '0 2.5rem 2.5rem 2.5rem',
    flex: 1,
    overflowY: 'auto',
  },
};
