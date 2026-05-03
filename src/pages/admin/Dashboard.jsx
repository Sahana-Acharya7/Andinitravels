import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Search,
  Users,
  ThumbsUp,
  Play,
  ArrowRight,
  ChevronLeft,
  MoreVertical
} from 'lucide-react'
import { db } from '../../firebase'
import { useNavigate } from 'react-router-dom'

const STATUS_BADGES = {
  'Booking Pending': 'pending',
  'Booking Confirmed': 'confirmed',
  'accepted': 'confirmed',
  'started': 'confirmed',
  'completed': 'completed',
  'rejected': 'rejected',
}

const STATUS_LABELS = {
  'Booking Pending': 'Pending',
  'Booking Confirmed': 'Confirmed',
  'accepted': 'Accepted',
  'started': 'Started',
  'completed': 'Completed',
  'rejected': 'Rejected',
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
      filter === 'Pending' ? booking.status === 'Booking Pending' :
      filter === 'Confirmed' ? booking.status === 'Booking Confirmed' :
      filter === 'Rejected' ? booking.tripStatus === 'rejected' :
      true;

    // Search filter
    const matchesSearch = search === '' ? true :
      booking.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      booking.id?.toLowerCase().includes(search.toLowerCase()) ||
      booking.driverName?.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  })

  const stats = [
    { label: 'All Trips', value: bookings.length, icon: <Calendar size={20} />, bg: 'var(--primary-subtle)', color: 'var(--primary)' },
    { label: 'Pending', value: bookings.filter(b => b.status === 'Booking Pending').length, icon: <Clock size={20} />, bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' },
    { label: 'Confirmed', value: bookings.filter(b => b.status === 'Booking Confirmed').length, icon: <CheckCircle size={20} />, bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' },
    { label: 'Accepted', value: bookings.filter(b => b.tripStatus === 'accepted').length, icon: <ThumbsUp size={20} />, bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
    { label: 'Started', value: bookings.filter(b => b.tripStatus === 'started').length, icon: <Play size={20} />, bg: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' },
  ]

  return (
    <>
      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stats-card">
            <div className="stats-icon-box" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stats-info">
              <div className="stats-label">{stat.label}</div>
              <div className="stats-value">{String(stat.value).padStart(2, '0')}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Data Card */}
      <div className="data-card">
        <div className="data-card-toolbar">
          <div className="filter-tabs">
            {['All', 'Unassigned', 'Pending', 'Confirmed', 'Accepted', 'Rejected'].map(tab => (
              <button
                key={tab}
                className={`filter-tab ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              placeholder="Search passenger or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Passenger</th>
              <th>Route</th>
              <th>Schedule</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => (
              <tr key={booking.id} onClick={() => navigate(`/booking/${booking.id}`)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="passenger-cell">
                    <div className="passenger-avatar" style={{ 
                      background: 'linear-gradient(to bottom right, #2563eb, #4f46e5)', 
                      borderRadius: '0.75rem',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      color: 'white',
                      fontSize: '1rem',
                      width: '40px',
                      height: '40px'
                    }}>
                      {booking.customerName?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="passenger-info">
                      <h4>{booking.customerName || 'Unknown'}</h4>
                      <p>TRP-{booking.id?.slice(-4).toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="route-cell">
                    <div className="route-point start">
                      <div className="route-dot"></div>
                      <span>{booking.pickupPoint?.split(',')[0]}</span>
                    </div>
                    <div className="route-point">
                      <div className="route-dot"></div>
                      <span>{booking.dropPoint?.split(',')[0]}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="schedule-cell">
                    <div className="date">{booking.date}</div>
                    <div className="time">{booking.pickupTime || '--:--'}</div>
                  </div>
                </td>
                <td>
                  <div className="driver-cell">
                    <h4>{booking.driverName || 'Not Assigned'}</h4>
                    <p>{booking.carType} • {booking.carNumber || '----'}</p>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${STATUS_BADGES[booking.tripStatus || booking.status] || 'pending'}`}>
                    {STATUS_LABELS[booking.tripStatus || booking.status] || 'Pending'}
                  </span>
                </td>
                <td className="amount-cell">
                  ₹{booking.tripType === 'Round Trip'
                    ? ((parseInt(booking.totalKilometerAmount) || 0) + (parseInt(booking.driverAllowance) || 0) + (parseInt(booking.toll) || 0) + (parseInt(booking.stateBorderTax) || 0) + (parseInt(booking.parking) || 0)).toLocaleString()
                    : ((parseInt(booking.carFare) || 0) + (parseInt(booking.parking) || 0)).toLocaleString()}
                </td>
                <td>
                  <ChevronRight size={20} color="#cbd5e1" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredBookings.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No results found for your search or filter.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing 1 to {filteredBookings.length} of {bookings.length} results
          </div>
          <div className="pagination-controls">
            <button className="page-btn"><ChevronLeft size={16} /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </>
  )
}
