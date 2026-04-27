import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import {
  Activity,
  AlertCircle,
  Calendar,
  Car,
  CheckCircle,
  ChevronRight,
  Clock,
  LogOut,
  Plus,
  Play,
  User,
  Users,
  TrendingUp,
  ThumbsUp,
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
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const bookingsQuery = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'))

    return onSnapshot(bookingsQuery, snapshot => {
      setBookings(snapshot.docs.map(document => ({ id: document.id, ...document.data() })))
    })
  }, [])

  const filteredBookings = bookings.filter(booking => {
    // Status filter
    const matchesFilter = filter === 'All' ? true :
      filter === 'Unassigned' ? (booking.assignedDriverId === null || booking.assignedDriverId === undefined) :
      filter === 'Accepted' ? booking.tripStatus === 'accepted' :
      filter === 'Started' ? booking.tripStatus === 'started' :
      filter === 'Rejected' ? booking.tripStatus === 'rejected' :
      booking.status === filter;

    // Search filter
    const matchesSearch = search === '' ? true :
      booking.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      booking.pickupPoint?.toLowerCase().includes(search.toLowerCase()) ||
      booking.dropPoint?.toLowerCase().includes(search.toLowerCase()) ||
      booking.driverName?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  })

  const counts = {
    All: bookings.length,
    'Booking Pending': bookings.filter(booking => booking.status === 'Booking Pending').length,
    'Booking Confirmed': bookings.filter(booking => booking.status === 'Booking Confirmed').length,
    'Accepted': bookings.filter(booking => booking.tripStatus === 'accepted').length,
    'Started': bookings.filter(booking => booking.tripStatus === 'started').length,
  }

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '4px' }}>Overview of all trips and bookings</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="filter-pills" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center' }}>
            <Calendar size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>27 Apr 2026</span>
            <ChevronRight size={16} color="var(--text-secondary)" style={{ marginLeft: '8px', transform: 'rotate(90deg)' }} />
          </div>
          <button className="card" style={{ padding: '8px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => window.location.reload()}>
            <Activity size={18} />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {[
          { label: 'All Trips', sub: 'Total bookings', key: 'All', icon: <Calendar size={24} />, color: 'var(--primary)', bg: 'var(--primary-subtle)' },
          { label: 'Pending', sub: 'Awaiting action', key: 'Booking Pending', icon: <Clock size={24} />, color: 'var(--warning)', bg: 'var(--warning-subtle)' },
          { label: 'Confirmed', sub: 'Booking confirmed', key: 'Booking Confirmed', icon: <CheckCircle size={24} />, color: 'var(--success)', bg: 'var(--success-subtle)' },
          { label: 'Accepted', sub: 'Driver accepted', key: 'Accepted', icon: <ThumbsUp size={24} />, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Started', sub: 'Trips in progress', key: 'Started', icon: <Play size={24} />, color: '#ea580c', bg: '#fff7ed' },
        ].map(({ label, sub, key, icon, color, bg }) => (
          <div
            key={key}
            className={`kpi-card ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            <div className="kpi-icon-container" style={{ background: bg, color: color }}>
              {icon}
            </div>
            <div>
              <div className="kpi-value">{counts[key] || 0}</div>
              <div className="kpi-label">{label}</div>
              <div className="kpi-sub">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="filter-section">
        <div className="filter-pills">
          {['All', 'Unassigned', 'Pending', 'Confirmed', 'Accepted', 'Rejected'].map(status => (
            <button
              key={status}
              className={`filter-pill ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="search-container">
          <Users className="icon" size={18} />
          <input
            placeholder="Search by passenger, location, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{filter} Trips</h3>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{filteredBookings.length} trips found</span>
      </div>

      <div className="trip-list">
        {filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <Car size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>No trips found</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          filteredBookings.map(booking => {
            const statusConfig = STATUS[booking.status] || { bg: '#eee', color: '#555' }
            const tripStatusConfig = TRIP_STATUS[booking.tripStatus]

            return (
              <div
                key={booking.id}
                className="trip-card"
                onClick={() => navigate(`/booking/${booking.id}`)}
              >
                <div className="trip-avatar">
                  {booking.customerName?.[0]?.toUpperCase() || '?'}
                </div>
                
                <div className="trip-main">
                  <div className="trip-header">
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{booking.customerName}</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {STATUS[booking.status] && (
                        <span className="badge" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                          {booking.status}
                        </span>
                      )}
                      {tripStatusConfig && (
                        <span className="badge" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
                          {tripStatusConfig.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="trip-route">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', fontWeight: 500 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>{booking.pickupPoint}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', fontWeight: 500 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>{booking.dropPoint}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      <Calendar size={14} />
                      <span>{booking.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      <Clock size={14} />
                      <span>{booking.pickupTime || '--:--'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                      <User size={14} />
                      <span>{booking.driverName || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                    ₹{booking.tripType === 'Round Trip'
                      ? ((parseInt(booking.totalKilometerAmount) || 0) + (parseInt(booking.driverAllowance) || 0) + (parseInt(booking.toll) || 0) + (parseInt(booking.stateBorderTax) || 0) + (parseInt(booking.parking) || 0))
                      : ((parseInt(booking.carFare) || 0) + (parseInt(booking.parking) || 0))}
                  </div>
                  <ChevronRight size={20} color="var(--border)" />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Showing 1 to {filteredBookings.length} of {bookings.length} trips</span>
        <div className="filter-pills" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
          <button className="filter-pill" style={{ padding: '4px 8px' }}><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /></button>
          <button className="filter-pill active" style={{ padding: '4px 12px' }}>1</button>
          <button className="filter-pill" style={{ padding: '4px 8px' }}><ChevronRight size={16} /></button>
        </div>
      </div>
    </>
  )
}
