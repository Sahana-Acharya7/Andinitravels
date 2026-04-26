import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import {
  AlertCircle,
  Calendar,
  Car,
  CheckCircle,
  ChevronRight,
  Clock,
  Flag,
  Loader,
  LogOut,
  MapPin,
  Plus,
  Play, // ADDED
  User,
  Users,
  TrendingUp,
  ThumbsUp, // ADDED
} from 'lucide-react'
import { db, auth } from '../../firebase'
import { useNavigate } from 'react-router-dom'

const STATUS = {
  'Booking Pending': { bg: '#fff8e1', color: '#f59e0b' },
  'Booking Confirmed': { bg: '#e6f4ea', color: '#16a34a' },
}

const TRIP_STATUS = {
  assigned:  { label: 'Assigned',        bg: '#dbeafe', color: '#2563eb' },
  accepted:  { label: 'Driver Accepted', bg: '#e0f2fe', color: '#0284c7' },
  started:   { label: 'Trip Started',    bg: '#fff7ed', color: '#ea580c' },
  completed: { label: 'Completed',       bg: '#dcfce7', color: '#16a34a' },
  rejected:  { label: 'Driver Rejected', bg: '#fef2f2', color: '#dc2626' },
}

export default function Dashboard() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))

    return onSnapshot(bookingsQuery, snapshot => {
      setBookings(snapshot.docs.map(document => ({ id: document.id, ...document.data() })))
    })
  }, [])

  const filteredBookings =
    filter === 'All' ? bookings : bookings.filter(booking => {
      if (filter === 'Unassigned') {
        return booking.assignedDriverId === null || booking.assignedDriverId === undefined
      }
      // ADDED — tripStatus-based filters
      if (filter === 'Driver Accepted') return booking.tripStatus === 'accepted'
      if (filter === 'Trips Started') return booking.tripStatus === 'started'
      if (filter === 'Rejected') return booking.tripStatus === 'rejected'
      return booking.status === filter
    })

  const counts = {
    All: bookings.length,
    'Booking Pending': bookings.filter(booking => booking.status === 'Booking Pending').length,
    'Booking Confirmed': bookings.filter(booking => booking.status === 'Booking Confirmed').length,
    // ADDED
    'Driver Accepted': bookings.filter(booking => booking.tripStatus === 'accepted').length,
    'Trips Started': bookings.filter(booking => booking.tripStatus === 'started').length,
  }

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .stat-grid-responsive {
            display: flex !important;
            overflow-x: auto !important;
            padding-bottom: 0.5rem !important;
            gap: 0.5rem !important;
          }
          .stat-card-responsive {
            min-width: 110px !important;
            flex-shrink: 0 !important;
          }
          .header-buttons-responsive {
            justify-content: flex-start !important;
            width: 100% !important;
          }
        }
      `}</style>

      <div style={styles.page}>
        <div style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            <Car size={20} color="#2563eb" />
          </div>
          <div>
            <div style={styles.logo}>Andini Travels</div>
            <div style={styles.logoSub}>Admin Dashboard</div>
          </div>
        </div>

        <div style={styles.headerButtons} className="header-buttons-responsive">
          <button style={styles.primaryButton} onClick={() => navigate('/create')}>
            <Plus size={16} /> New Booking
          </button>
          <button style={styles.ghostButton} onClick={() => navigate('/customers')}>
            <User size={16} /> Passengers
          </button>
          <button style={styles.ghostButton} onClick={() => navigate('/drivers')}>
            <Users size={16} /> Drivers
          </button>
          <button style={styles.ghostButton} onClick={() => navigate('/reports')}>
            <TrendingUp size={16} /> Reports
          </button>
          <button style={styles.ghostButton} onClick={() => signOut(auth)}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div style={styles.statGrid} className="stat-grid-responsive">
        {[
          { label: 'All Trips', key: 'All', icon: <Calendar size={18} color="#2563eb" />, color: '#2563eb' },
          { label: 'Booking Pending', key: 'Booking Pending', icon: <AlertCircle size={18} color="#f59e0b" />, color: '#f59e0b' },
          { label: 'Booking Confirmed', key: 'Booking Confirmed', icon: <CheckCircle size={18} color="#16a34a" />, color: '#16a34a' },
          { label: 'Driver Accepted', key: 'Driver Accepted', icon: <ThumbsUp size={18} color="#8b5cf6" />, color: '#8b5cf6' },
          { label: 'Trips Started', key: 'Trips Started', icon: <Play size={18} color="#ea580c" />, color: '#ea580c' },
        ].map(({ label, key, icon, color }) => (
          <div
            key={key}
            className="stat-card-responsive"
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
        {/* ADDED — Driver Accepted & Trips Started pills */}
        {['All', 'Booking Pending', 'Booking Confirmed', 'Driver Accepted', 'Trips Started', 'Unassigned', 'Rejected'].map(status => (
          <button
            key={status}
            style={{
              ...styles.pill,
              background: filter === status ? '#2563eb' : '#fff',
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
            <div style={{ fontWeight: '600', color: '#555' }}>No bookings found</div>
            <div style={{ color: '#aaa', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Create a new booking to get started
            </div>
          </div>
        )}

        {filteredBookings.map(booking => {
          const statusConfig = STATUS[booking.status] || { bg: '#eee', color: '#555', icon: null }

          return (
            <div
              key={booking.id}
              style={styles.card}
              onClick={() => navigate(`/booking/${booking.id}`)}
            >
              <div style={styles.cardAvatar}>
                {booking.customerName?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <div style={styles.cardName}>{booking.customerName}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {STATUS[booking.status] && (
                      <span
                        style={{
                          ...styles.badge,
                          background: statusConfig.bg,
                          color: statusConfig.color,
                        }}
                      >
                        {booking.status}
                      </span>
                    )}
                    {/* ADDED — show tripStatus badge */}
                    {booking.tripStatus && TRIP_STATUS[booking.tripStatus] && (
                      <span
                        style={{
                          ...styles.badge,
                          background: TRIP_STATUS[booking.tripStatus].bg,
                          color: TRIP_STATUS[booking.tripStatus].color,
                        }}
                      >
                        {TRIP_STATUS[booking.tripStatus].label}
                      </span>
                    )}
                  </div>
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
                  <span style={styles.metaItem}>
                    <User size={13} /> {booking.driverName || 'Unassigned'}
                  </span>
                  <span style={{ ...styles.metaItem, fontWeight: '700', color: '#16a34a' }}>
                    Rs {booking.tripType === 'Round Trip'
                      ? ((parseInt(booking.totalKilometerAmount) || 0) + (parseInt(booking.driverAllowance) || 0) + (parseInt(booking.toll) || 0) + (parseInt(booking.stateBorderTax) || 0) + (parseInt(booking.parking) || 0))
                      : ((parseInt(booking.carFare) || 0) + (parseInt(booking.parking) || 0))}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} color="#cbd5e1" />
            </div>
          )
        })}
      </div>
      </div>
    </>
  )
}

const styles = {
  page: { maxWidth: '980px', margin: '0 auto', padding: '1.25rem' },
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
    background: '#e8f0fe',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a2e' },
  logoSub: { fontSize: '0.75rem', color: '#94a3b8' },
  headerButtons: { display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' },
  primaryButton: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.6rem 1.1rem',
    fontWeight: '600',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
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
  },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' },
  statCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '0.75rem 0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  statIcon: { display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' },
  statNum: { fontSize: '1.4rem', fontWeight: '700' },
  statLabel: { fontSize: '0.7rem', color: '#888', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' },
  pill: {
    border: '1.5px solid #e0e0e0',
    borderRadius: '99px',
    padding: '0.4rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '500',
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
    background: '#e8f0fe',
    color: '#2563eb',
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
