import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Schedule() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [driver, setDriver] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [weekDays, setWeekDays] = useState([])
  const [startDate, setStartDate] = useState(new Date())

  // Generate 7 days starting from startDate
  useEffect(() => {
    const days = []
    const tempDate = new Date(startDate)
    
    // Find the start of the week (optional: start from today or Monday)
    // Here we just start from the current 'startDate' state
    for (let i = 0; i < 7; i++) {
      const date = new Date(tempDate)
      date.setDate(tempDate.getDate() + i)
      days.push({
        full: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate()
      })
    }
    setWeekDays(days)
  }, [startDate])

  const handlePrevWeek = () => {
    const newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() - 7)
    setStartDate(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() + 7)
    setStartDate(newDate)
  }

  useEffect(() => {
    if (!user) return
    const driverQuery = query(collection(db, 'drivers'), where('email', '==', user.email))
    return onSnapshot(driverQuery, driverSnap => {
      if (driverSnap.empty) return
      const driverData = { id: driverSnap.docs[0].id, ...driverSnap.docs[0].data() }
      setDriver(driverData)

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('assignedDriverId', '==', driverData.id),
        where('tripStatus', 'in', ['assigned', 'accepted', 'started', 'completed'])
      )
      onSnapshot(bookingsQuery, snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setBookings(data)
      })
    })
  }, [user])

  const tripsForSelectedDate = bookings.filter(b => b.date === selectedDate)

  const toggleAvailability = async () => {
    if (!driver) return
    await updateDoc(doc(db, 'drivers', driver.id), {
      isAvailable: !driver.isAvailable
    })
  }

  return (
    <div style={styles.container}>
      {/* Date Selector Header */}
      <div style={styles.card}>
        <div style={styles.cardBody}>
          <div style={styles.headerRow}>
            <h3 style={styles.cardTitle}>Week Schedule</h3>
            <div style={styles.navBtns}>
              <button style={styles.iconBtn} onClick={handlePrevWeek}>
                <ChevronLeft size={18} />
              </button>
              <button style={styles.iconBtn} onClick={handleNextWeek}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div style={styles.dateSelector}>
            {weekDays.map((day) => (
              <button 
                key={day.full}
                onClick={() => setSelectedDate(day.full)}
                style={{
                  ...styles.dateBtn,
                  backgroundColor: selectedDate === day.full ? 'var(--primary)' : 'transparent',
                  color: selectedDate === day.full ? '#fff' : 'var(--text-secondary)',
                  borderColor: selectedDate === day.full ? 'var(--primary)' : 'var(--border-light)'
                }}
              >
                <span style={styles.dayName}>{day.dayName}</span>
                <span style={styles.dayNum}>{day.dayNum}</span>
                {bookings.some(b => b.date === day.full) && (
                  <div style={{
                    ...styles.dot,
                    backgroundColor: selectedDate === day.full ? '#fff' : 'var(--primary)'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Main Schedule Column */}
        <div style={styles.mainCol}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <span style={styles.tripCount}>{tripsForSelectedDate.length} Trips Scheduled</span>
          </div>

          <div style={styles.timeline}>
            {tripsForSelectedDate.length > 0 ? tripsForSelectedDate.sort((a,b) => a.pickupTime.localeCompare(b.pickupTime)).map((trip, idx) => (
              <div key={trip.id} style={styles.timelineItem} onClick={() => navigate(`/driver/booking/${trip.id}`)}>
                <div style={styles.timeCol}>
                  <div style={styles.timeText}>{trip.pickupTime}</div>
                  <div style={styles.durationText}>{trip.tripType || 'Local'}</div>
                </div>
                <div style={styles.timelineConnector}>
                  <div style={styles.timelineDot} />
                  {idx !== tripsForSelectedDate.length - 1 && <div style={styles.timelineLine} />}
                </div>
                <div className="card-hover" style={styles.tripCard}>
                  <div style={styles.tripHeader}>
                    <div style={styles.customerInfo}>
                      <div style={styles.avatar}>
                        {trip.customerName?.[0] || 'U'}
                      </div>
                      <div>
                        <div style={styles.customerName}>{trip.customerName}</div>
                        <div style={styles.tripId}>#{trip.id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                    <MoreVertical size={18} color="var(--text-tertiary)" />
                  </div>
                  <div style={styles.tripLocations}>
                    <div style={styles.locItem}>
                      <MapPin size={14} color="var(--primary)" />
                      <span>{trip.pickupPoint}</span>
                    </div>
                    <div style={styles.locItem}>
                      <MapPin size={14} color="var(--success)" />
                      <span>{trip.dropPoint}</span>
                    </div>
                  </div>
                  <div style={styles.tripFooter}>
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: trip.tripStatus === 'completed' ? 'var(--success-subtle)' : 'var(--primary-subtle)',
                      color: trip.tripStatus === 'completed' ? 'var(--success)' : 'var(--primary)',
                    }}>
                      {trip.tripStatus === 'completed' ? <CheckCircle size={12} /> : <Clock size={12} />} 
                      {trip.tripStatus.toUpperCase()}
                    </div>
                    <div style={styles.price}>₹{trip.totalAmount || '---'}</div>
                  </div>
                </div>
              </div>
            )) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  <CalendarIcon size={32} color="var(--text-tertiary)" />
                </div>
                <h4 style={{margin: '1rem 0 0.5rem 0', color: 'var(--text-primary)'}}>No trips scheduled</h4>
                <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)'}}>You are free for this day. Rest up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Column - Availability & Quick Stats */}
        <div style={styles.sideCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Daily Availability</h3>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.availabilityText}>
                Set your status to available to receive new trip assignments for today.
              </p>
              <div style={styles.availabilityToggle}>
                <div style={styles.statusInfo}>
                  <div style={{
                    ...styles.statusDot,
                    backgroundColor: driver?.isAvailable ? 'var(--success)' : 'var(--text-tertiary)'
                  }} />
                  <span style={styles.statusLabel}>
                    {driver?.isAvailable ? 'Available for work' : 'Offline / On Break'}
                  </span>
                </div>
                <div 
                  style={{
                    ...styles.toggleBtn, 
                    backgroundColor: driver?.isAvailable ? 'var(--success)' : 'var(--border)'
                  }}
                  onClick={toggleAvailability}
                >
                  <div style={{
                    ...styles.toggleKnob,
                    transform: driver?.isAvailable ? 'translateX(28px)' : 'translateX(0)'
                  }} />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Schedule Insights</h3>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.insightItem}>
                <div style={styles.insightIcon}><CheckCircle size={18} color="var(--success)" /></div>
                <div>
                  <div style={styles.insightValue}>{bookings.filter(b => b.tripStatus !== 'completed').length}</div>
                  <div style={styles.insightLabel}>Upcoming Bookings</div>
                </div>
              </div>
              <div style={styles.insightItem}>
                <div style={styles.insightIcon}><AlertCircle size={18} color="var(--warning)" /></div>
                <div>
                  <div style={styles.insightValue}>0</div>
                  <div style={styles.insightLabel}>Conflict Alerts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  card: { backgroundColor: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', overflow: 'hidden' },
  cardHeader: { padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)' },
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' },
  cardBody: { padding: '1.5rem' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  navBtns: { display: 'flex', gap: '0.5rem' },
  iconBtn: { padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dateSelector: { display: 'flex', justifyContent: 'space-between', gap: '1rem' },
  dateBtn: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    padding: '1rem 0.5rem', 
    borderRadius: '16px', 
    border: '1px solid', 
    cursor: 'pointer', 
    transition: 'all 0.2s',
    position: 'relative'
  },
  dayName: { fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' },
  dayNum: { fontSize: '1.25rem', fontWeight: '800' },
  dot: { position: 'absolute', bottom: '8px', width: '4px', height: '4px', borderRadius: '50%' },

  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 },
  tripCount: { fontSize: '0.9rem', color: 'var(--text-tertiary)', fontWeight: '600' },

  timeline: { display: 'flex', flexDirection: 'column', gap: '0' },
  timelineItem: { display: 'flex', gap: '1.5rem', cursor: 'pointer' },
  timeCol: { width: '80px', paddingTop: '1rem', textAlign: 'right' },
  timeText: { fontSize: '1rem', fontWeight: '800', color: 'var(--text-primary)' },
  durationText: { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' },
  timelineConnector: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1.3rem' },
  timelineDot: { width: '12px', height: '12px', borderRadius: '50%', border: '3px solid var(--primary)', backgroundColor: '#fff' },
  timelineLine: { width: '2px', flex: 1, backgroundColor: 'var(--border-light)', margin: '4px 0' },
  
  tripCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: '20px', 
    padding: '1.25rem', 
    border: '1px solid var(--border-light)', 
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  tripHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerInfo: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  avatar: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  customerName: { fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' },
  tripId: { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' },
  tripLocations: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  locItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' },
  tripFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' },
  price: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--success)' },

  emptyState: { padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border)' },
  emptyIcon: { width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },

  availabilityText: { fontSize: '0.9rem', color: 'var(--text-tertiary)', lineHeight: 1.5, marginBottom: '1.5rem' },
  availabilityToggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-page)', padding: '1rem', borderRadius: '16px' },
  statusInfo: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%' },
  statusLabel: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' },
  toggleBtn: { width: '60px', height: '32px', borderRadius: '32px', padding: '2px', cursor: 'pointer', transition: 'background 0.3s', display: 'flex', alignItems: 'center' },
  toggleKnob: { width: '28px', height: '28px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.3s' },

  insightItem: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' },
  insightIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  insightValue: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 },
  insightLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }
}
