import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'

export default function Availability() {
  const { user } = useAuth()
  const [driver, setDriver] = useState(null)
  const [tripsToday, setTripsToday] = useState(0)

  useEffect(() => {
    if (!user) return
    const driverQuery = query(collection(db, 'drivers'), where('email', '==', user.email))
    const unsubDriver = onSnapshot(driverQuery, snap => {
      if (!snap.empty) {
        const driverDoc = { id: snap.docs[0].id, ...snap.docs[0].data() }
        setDriver(driverDoc)

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
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'var(--font-main)' }}>
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.statusRow}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Current Status</div>
              <div style={{ color: driver.isAvailable ? 'var(--success)' : 'var(--text-tertiary)', fontWeight: '600', marginTop: '4px' }}>
                {driver.isAvailable ? 'Available for Trips' : 'Unavailable'}
              </div>
            </div>
            
            <div 
              style={{
                ...styles.toggleBtn, 
                background: driver.isAvailable ? 'var(--success)' : 'var(--border)'
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
          <h3 style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Today's Schedule</h3>
          <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            You have <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{tripsToday}</span> trips today
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  content: { padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toggleBtn: {
    width: '60px', height: '32px', borderRadius: '32px', padding: '2px',
    cursor: 'pointer', transition: 'background 0.3s', display: 'flex', alignItems: 'center'
  },
  toggleKnob: {
    width: '28px', height: '28px', background: '#fff', borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.3s'
  }
}
