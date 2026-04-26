import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { Car, ChevronRight, LogOut, MapPin, Flag, Calendar, Clock, CheckCircle, Play, ThumbsUp } from 'lucide-react'
import { db, auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import DriverBottomNav from '../../components/DriverBottomNav'

// Driver sees tripStatus, NOT admin booking status
const TRIP_STATUS_CONFIG = {
  assigned:  { label: 'Assigned',     bg: '#dbeafe', color: '#2563eb', icon: <Calendar size={13} />, tab: 'Upcoming' },
  accepted:  { label: 'Accepted',     bg: '#e0f2fe', color: '#0284c7', icon: <ThumbsUp size={13} />, tab: 'Upcoming' },
  started:   { label: 'Trip Started', bg: '#ede9fe', color: '#8b5cf6', icon: <Play size={13} />,     tab: 'Ongoing' },
  completed: { label: 'Completed',    bg: '#dcfce7', color: '#16a34a', icon: <CheckCircle size={13} />, tab: 'Past' },
}

export default function DriverDashboard() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('Upcoming')
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const driverQuery = query(collection(db, 'drivers'), where('email', '==', user.email))
    return onSnapshot(driverQuery, driverSnap => {
      if (driverSnap.empty) return
      const driverDocId = driverSnap.docs[0].id

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('assignedDriverId', '==', driverDocId),
      )
      onSnapshot(bookingsQuery, snapshot => {
        const data = snapshot.docs.map(document => ({ id: document.id, ...document.data() }))
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        setBookings(data)
      })
    })
  }, [user])

  // Filter by tripStatus
  const getTab = (b) => (TRIP_STATUS_CONFIG[b.tripStatus] || TRIP_STATUS_CONFIG.assigned).tab
  const filteredBookings = bookings.filter(b => getTab(b) === filter)

  const counts = {
    Upcoming: bookings.filter(b => getTab(b) === 'Upcoming').length,
    Ongoing: bookings.filter(b => getTab(b) === 'Ongoing').length,
    Past: bookings.filter(b => getTab(b) === 'Past').length,
  }

  return (
    <div style={{...styles.page, paddingBottom: '80px'}}>
      <div style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <Car size={20} color="#16a34a" />
          </div>
          <div>
            <div style={styles.logo}>Andini Travels</div>
            <div style={styles.logoSub}>Driver Portal</div>
          </div>
        </div>

        <div style={styles.headerButtons}>
          <button style={styles.ghostButton} onClick={() => signOut(auth)}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      <div style={styles.statGrid}>
        {[
          { label: 'Upcoming', key: 'Upcoming', icon: <Calendar size={22} color="#2563eb" />, color: '#2563eb' },
          { label: 'Ongoing', key: 'Ongoing', icon: <Play size={22} color="#8b5cf6" />, color: '#8b5cf6' },
          { label: 'Past', key: 'Past', icon: <CheckCircle size={22} color="#16a34a" />, color: '#16a34a' },
        ].map(({ label, key, icon, color }) => (
          <div
            key={key}
            style={{
              ...styles.statCard,
              borderBottom: filter === key ? `3px solid ${color}` : '3px solid transparent',
            }}
            onClick={() => setFilter(key)}
          >
            <div style={styles.statIcon}>{icon}</div>
            <div style={{ ...styles.statNum, color }}>{counts[key]}</div>
            <div style={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      <div style={styles.filterRow}>
        {['Upcoming', 'Ongoing', 'Past'].map(status => (
          <button
            key={status}
            style={{
              ...styles.pill,
              background: filter === status ? '#1a1a2e' : '#fff',
              color: filter === status ? '#fff' : '#555',
            }}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
        <span style={styles.count}>{filteredBookings.length} trips</span>
      </div>

      <div style={styles.list}>
        {filteredBookings.length === 0 && (
          <div style={styles.empty}>
            <Car size={48} color="#e0e0e0" style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: '600', color: '#555' }}>No {filter.toLowerCase()} trips</div>
            <div style={{ color: '#aaa', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Check back later for updates.
            </div>
          </div>
        )}

        {filteredBookings.map(booking => {
          const config = TRIP_STATUS_CONFIG[booking.tripStatus] || TRIP_STATUS_CONFIG.assigned

          return (
            <div
              key={booking.id}
              style={styles.card}
              onClick={() => navigate(`/driver/booking/${booking.id}`)}
            >
              <div style={styles.cardAvatar}>
                {booking.customerName?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <div style={styles.cardName}>{booking.customerName}</div>
                  <span
                    style={{
                      ...styles.badge,
                      background: config.bg,
                      color: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {config.icon} {config.label}
                  </span>
                </div>
                <div style={styles.cardRoute}>
                  <MapPin size={13} color="#2563eb" />
                  <span>{booking.pickupPoint}</span>
                  <span style={{ color: '#cbd5e1' }}>to</span>
                  <Flag size={13} color="#16a34a" />
                  <span>{booking.dropPoint}</span>
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.metaItem}>
                    <Calendar size={13} /> {booking.date || 'No date'}
                  </span>
                  <span style={styles.metaItem}>
                    <Clock size={13} /> {booking.pickupTime || 'No time'}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} color="#cbd5e1" />
            </div>
          )
        })}
      </div>
      <DriverBottomNav />
    </div>
  )
}

const styles = {
  page: { maxWidth: '980px', margin: '0 auto', padding: '1.25rem', fontFamily: 'sans-serif' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fff',
    borderRadius: '16px',
    padding: '1rem 1.5rem',
    marginBottom: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  brandIcon: {
    width: '40px',
    height: '40px',
    background: '#dcfce7',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
  logoSub: { fontSize: '0.75rem', color: '#94a3b8' },
  headerButtons: { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' },
  ghostButton: {
    background: '#fff',
    color: '#555',
    border: '1.5px solid #e0e0e0',
    borderRadius: '10px',
    padding: '0.6rem 1rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' },
  statCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '1rem',
    textAlign: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statIcon: { display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' },
  statNum: { fontSize: '1.8rem', fontWeight: '700' },
  statLabel: { fontSize: '0.78rem', color: '#888', marginTop: '0.2rem' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  pill: {
    border: '1.5px solid #e0e0e0',
    borderRadius: '99px',
    padding: '0.4rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  count: { marginLeft: 'auto', color: '#94a3b8', fontSize: '0.85rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: {
    background: '#fff',
    borderRadius: '14px',
    padding: '1rem 1.25rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  cardAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    fontWeight: '700',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  cardName: { fontWeight: '600', fontSize: '1rem' },
  badge: { padding: '0.25rem 0.7rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '600' },
  cardRoute: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    color: '#555',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
  },
  cardMeta: { display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#888', flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: '#fff',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}
