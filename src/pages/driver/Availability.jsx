import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import DriverBottomNav from '../../components/DriverBottomNav'

export default function Availability() {
  const { user } = useAuth()
  const [driver, setDriver] = useState(null)
  const [tripsToday, setTripsToday] = useState(0)

  useEffect(() => {
    if (!user) return
    // Query driver doc by email (doc IDs are auto-generated)
    const driverQuery = query(collection(db, 'drivers'), where('email', '==', user.email))
    const unsubDriver = onSnapshot(driverQuery, snap => {
      if (!snap.empty) {
        const driverDoc = { id: snap.docs[0].id, ...snap.docs[0].data() }
        setDriver(driverDoc)

        // Now query today's bookings using the driver's Firestore doc ID
        const today = new Date().toISOString().split('T')[0]
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('assignedDriverId', '==', driverDoc.id),
          where('date', '==', today)
        )
        onSnapshot(bookingsQuery, bSnap => {
          setTripsToday(bSnap.docs.length)
        })
      }
    })

    return () => unsubDriver()
  }, [user])

  const toggleAvailability = async () => {
    if (!driver) return
    await updateDoc(doc(db, 'drivers', driver.id), {
      isAvailable: !driver.isAvailable
    })
  }

  if (!driver) return <div style={{padding:'2rem'}}>Loading...</div>

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      <div style={styles.header}>
        <h2 style={styles.title}>Availability</h2>
        <p style={styles.subtitle}>{driver.name}</p>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.statusRow}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>Current Status</div>
              <div style={{ color: driver.isAvailable ? '#16a34a' : '#64748b', fontWeight: '600', marginTop: '4px' }}>
                {driver.isAvailable ? 'Available for Trips' : 'Unavailable'}
              </div>
            </div>
            
            <div 
              style={{
                ...styles.toggleBtn, 
                background: driver.isAvailable ? '#16a34a' : '#cbd5e1'
              }}
              onClick={toggleAvailability}
            >
              <div style={{
                ...styles.toggleKnob,
                transform: driver.isAvailable ? 'translateX(28px)' : 'translateX(0)'
              }} />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Today's Schedule</h3>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#0f172a' }}>
            You have <span style={{ color: '#2563eb', fontWeight: '800' }}>{tripsToday}</span> trips today
          </div>
        </div>
      </div>

      <DriverBottomNav />
    </div>
  )
}

const styles = {
  header: { background: '#fff', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: '700' },
  subtitle: { margin: 0, color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' },
  content: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toggleBtn: {
    width: '60px', height: '32px', borderRadius: '32px', padding: '2px',
    cursor: 'pointer', transition: 'background 0.3s', display: 'flex', alignItems: 'center'
  },
  toggleKnob: {
    width: '28px', height: '28px', background: '#fff', borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s'
  }
}
