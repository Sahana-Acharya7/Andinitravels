import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Play, 
  Star, 
  MapPin, 
  Circle,
  ArrowRight
} from 'lucide-react'
import { db } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const TRIP_STATUS_CONFIG = {
  assigned:  { label: 'Assigned',     bg: 'var(--primary-subtle)', color: 'var(--primary)', icon: <Calendar size={13} />, tab: 'Upcoming' },
  accepted:  { label: 'Accepted',     bg: '#e0f2fe', color: '#0284c7', icon: <Play size={13} />, tab: 'Upcoming' },
  started:   { label: 'Trip Started', bg: '#ede9fe', color: '#8b5cf6', icon: <Play size={13} />,     tab: 'Ongoing' },
  completed: { label: 'Completed',    bg: 'var(--success-subtle)', color: 'var(--success)', icon: <CheckCircle size={13} />, tab: 'Past' },
}

export default function DriverDashboard() {
  const [bookings, setBookings] = useState([])
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

  const getTab = (b) => (TRIP_STATUS_CONFIG[b.tripStatus] || TRIP_STATUS_CONFIG.assigned).tab
  
  const upcomingTrips = bookings.filter(b => getTab(b) === 'Upcoming')
  const ongoingTrips = bookings.filter(b => getTab(b) === 'Ongoing')
  const pastTrips = bookings.filter(b => getTab(b) === 'Past')

  const latestNewAssignment = upcomingTrips[0]

  return (
    <div className="dashboard-container" style={styles.container}>
      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div className="card-hover" style={styles.statCard}>
          <div style={{...styles.statIconContainer, backgroundColor: 'var(--primary-subtle)'}}>
            <Calendar size={24} color="var(--primary)" />
          </div>
          <div style={styles.statValue}>{upcomingTrips.length}</div>
          <div style={styles.statLabel}>Upcoming</div>
        </div>
        <div className="card-hover" style={styles.statCard}>
          <div style={{...styles.statIconContainer, backgroundColor: '#f5f3ff'}}>
            <Play size={24} color="#8b5cf6" />
          </div>
          <div style={styles.statValue}>{ongoingTrips.length}</div>
          <div style={styles.statLabel}>Ongoing</div>
        </div>
        <div className="card-hover" style={{...styles.statCard, borderBottom: '4px solid var(--success)'}}>
          <div style={{...styles.statIconContainer, backgroundColor: 'var(--success-subtle)'}}>
            <CheckCircle size={24} color="var(--success)" />
          </div>
          <div style={styles.statValue}>{pastTrips.length}</div>
          <div style={styles.statLabel}>Past</div>
        </div>
      </div>

      {/* New Assignment Section */}
      {latestNewAssignment && (
        <div style={styles.assignmentSection}>
          <div style={styles.assignmentBanner}>
            <div style={styles.assignmentBannerLabel}>
              <Play size={14} fill="#fff" /> NEW ASSIGNMENT
            </div>
          </div>
          <div style={styles.assignmentCard}>
            <div style={styles.assignmentMain}>
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  {latestNewAssignment.customerName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={styles.userName}>{latestNewAssignment.customerName}</div>
                  <div style={styles.userMeta}>
                    <span style={styles.rating}><Star size={12} fill="var(--warning)" color="var(--warning)" /> 4.9</span>
                    <span style={styles.userType}>Corporate Premium</span>
                  </div>
                </div>
              </div>

              <div style={styles.routeContainer}>
                <div style={styles.routePoint}>
                  <Circle size={8} color="var(--primary)" fill="var(--primary)" />
                  <span style={styles.routeText}>{latestNewAssignment.pickupPoint}</span>
                </div>
                <div style={styles.routeLine} />
                <div style={styles.routePoint}>
                  <Circle size={8} color="var(--success)" fill="var(--success)" />
                  <span style={styles.routeText}>{latestNewAssignment.dropPoint}</span>
                </div>
              </div>

              <div style={styles.dateTimeContainer}>
                <div style={styles.dateTimeItem}>
                  <Calendar size={16} color="var(--text-tertiary)" />
                  <span>{latestNewAssignment.date}</span>
                </div>
                <div style={styles.dateTimeItem}>
                  <Clock size={16} color="var(--text-tertiary)" />
                  <span>{latestNewAssignment.pickupTime}</span>
                </div>
              </div>

              <button 
                className="btn-new-booking"
                style={styles.detailsBtn}
                onClick={() => navigate(`/driver/booking/${latestNewAssignment.id}`)}
              >
                See Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ongoing Trips Section */}
      {ongoingTrips.length > 0 && (
        <>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Ongoing Trips</h2>
              <p style={styles.sectionSub}>Trips currently in progress</p>
            </div>
          </div>
          <div style={styles.tripsList}>
            {ongoingTrips.map(trip => (
              <div key={trip.id} className="card-hover" style={{...styles.tripCard, borderLeft: '4px solid #8b5cf6'}} onClick={() => navigate(`/driver/booking/${trip.id}`)}>
                <div style={styles.tripInitialAvatar}>
                  {trip.customerName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </div>
                <div style={styles.tripInfo}>
                  <div style={styles.tripName}>{trip.customerName}</div>
                  <div style={styles.tripTime}>{trip.date} • {trip.pickupTime}</div>
                </div>
                <div style={styles.tripRoute}>
                  <div style={styles.routeMin}>
                    <Circle size={6} color="var(--primary)" fill="var(--primary)" />
                    <span>{trip.pickupPoint}</span>
                    <ArrowRight size={14} color="var(--text-tertiary)" />
                    <Circle size={6} color="var(--success)" fill="var(--success)" />
                    <span>{trip.dropPoint}</span>
                  </div>
                </div>
                <div style={styles.tripStatus}>
                  <div style={{...styles.statusBadge, backgroundColor: '#f5f3ff', color: '#8b5cf6'}}>
                    <Play size={12} fill="#8b5cf6" />
                    <span>In Progress</span>
                  </div>
                </div>
                <div style={styles.tripAmount}>
                  ₹{trip.tripMode === 'OUTSOURCED' ? trip.customerFare?.totalAmount : (trip.finalAmount || '0.00')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent Past Trips */}
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Recent Past Trips</h2>
          <p style={styles.sectionSub}>Your completed assignments</p>
        </div>
        <button style={styles.viewAllBtn}>View All</button>
      </div>

      <div style={styles.tripsList}>
        {pastTrips.length > 0 ? pastTrips.slice(0, 5).map(trip => (
          <div key={trip.id} className="card-hover" style={styles.tripCard} onClick={() => navigate(`/driver/booking/${trip.id}`)}>
            <div style={styles.tripInitialAvatar}>
              {trip.customerName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div style={styles.tripInfo}>
              <div style={styles.tripName}>{trip.customerName}</div>
              <div style={styles.tripTime}>{trip.date} • {trip.pickupTime}</div>
            </div>
            <div style={styles.tripRoute}>
              <div style={styles.routeMin}>
                <Circle size={6} color="var(--primary)" fill="var(--primary)" />
                <span>{trip.pickupPoint}</span>
                <ArrowRight size={14} color="var(--text-tertiary)" />
                <Circle size={6} color="var(--success)" fill="var(--success)" />
                <span>{trip.dropPoint}</span>
              </div>
            </div>
            <div style={styles.tripStatus}>
              <div style={styles.statusBadge}>
                <CheckCircle size={12} color="var(--success)" />
                <span>Completed</span>
              </div>
            </div>
            <div style={styles.tripAmount}>
              ₹{trip.tripMode === 'OUTSOURCED' ? (trip.customerFare?.totalAmount || '0.00') : (trip.finalAmount || '0.00')}
            </div>
          </div>
        )) : (
          <div style={styles.emptyState}>No past trips found.</div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
  },
  statCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
    cursor: 'pointer',
  },
  statIconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    marginTop: '0.5rem',
  },
  assignmentSection: {
    position: 'relative',
  },
  assignmentBanner: {
    backgroundColor: 'var(--primary)',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    padding: '0.75rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
  },
  assignmentBannerLabel: {
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    letterSpacing: '0.05em',
  },
  assignmentCard: {
    backgroundColor: 'var(--bg-card)',
    borderBottomLeftRadius: 'var(--radius-xl)',
    borderBottomRightRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: '2rem',
  },
  assignmentMain: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1.2fr 1fr auto',
    alignItems: 'center',
    gap: '2rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#6366f1',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '700',
  },
  userName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  userMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  rating: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  userType: {
    fontSize: '0.85rem',
    color: 'var(--primary)',
    fontWeight: '500',
  },
  routeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    position: 'relative',
  },
  routePoint: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  routeText: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  routeLine: {
    position: 'absolute',
    left: '3.5px',
    top: '12px',
    bottom: '12px',
    width: '1px',
    backgroundColor: 'var(--border)',
  },
  dateTimeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  dateTimeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  detailsBtn: {
    margin: 0,
    width: 'auto',
    padding: '0 2rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  sectionSub: {
    fontSize: '0.9rem',
    color: 'var(--text-tertiary)',
    margin: '0.25rem 0 0 0',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  tripsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  tripCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '20px',
    padding: '1.25rem 1.5rem',
    display: 'grid',
    gridTemplateColumns: 'auto 200px 1.5fr 1fr auto',
    alignItems: 'center',
    gap: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-light)',
    cursor: 'pointer',
  },
  tripInitialAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'var(--border-light)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.9rem',
  },
  tripInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  tripName: {
    fontWeight: '700',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  },
  tripTime: {
    fontSize: '0.8rem',
    color: 'var(--text-tertiary)',
    marginTop: '0.2rem',
  },
  tripRoute: {
    display: 'flex',
    alignItems: 'center',
  },
  routeMin: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  tripStatus: {
    display: 'flex',
    justifyContent: 'center',
  },
  statusBadge: {
    backgroundColor: 'var(--success-subtle)',
    color: 'var(--success)',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  tripAmount: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--success)',
  },
  emptyState: {
    padding: '3rem',
    textAlign: 'center',
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-xl)',
    color: 'var(--text-tertiary)',
    border: '1px dashed var(--border)',
  }
}
