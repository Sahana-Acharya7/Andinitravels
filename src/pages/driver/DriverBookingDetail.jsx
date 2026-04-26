import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Share2, CheckCircle, XCircle, Play, Flag } from 'lucide-react'

const STATUS_COLORS = {
  'Booking Pending': '#f59e0b',
  'Booking Confirmed': '#f59e0b',
  'Driver Accepted': '#3b82f6',
  'Driver Rejected': '#ef4444',
  'Trip Started': '#8b5cf6',
  'Trip Completed': '#16a34a',
}

function getFinalAmount(booking) {
  if (booking.tripType === 'Round Trip') {
    return (
      (parseInt(booking.totalKilometerAmount) || 0) +
      (parseInt(booking.driverAllowance) || 0) +
      (parseInt(booking.toll) || 0) +
      (parseInt(booking.stateBorderTax) || 0) +
      (parseInt(booking.parking) || 0)
    )
  }
  return (parseInt(booking.carFare) || 0) + (parseInt(booking.parking) || 0)
}

export default function DriverBookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    return onSnapshot(doc(db, 'bookings', id), snapshot => {
      if (snapshot.exists()) {
        setBooking({ id: snapshot.id, ...snapshot.data() })
      } else {
        setBooking(null)
      }
    })
  }, [id])

  if (!booking) return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Loading trip details...</div>

  const handleShare = () => {
    const text = [
      `*Trip Details*`,
      `Passenger: ${booking.customerName}`,
      `Mobile: ${booking.mobileNumber}`,
      `Date: ${booking.date}`,
      `Pickup Time: ${booking.pickupTime}`,
      `From: ${booking.pickupPoint}`,
      `To: ${booking.dropPoint}`,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const updateStatus = async (newStatus) => {
    if (!window.confirm(`Mark trip as '${newStatus}'?`)) return
    try {
      await updateDoc(doc(db, 'bookings', booking.id), { status: newStatus })
    } catch (e) {
      alert("Failed to update status. Please try again.")
    }
  }

  const isPending = booking.status === 'Booking Pending' || booking.status === 'Booking Confirmed'
  const finalFare = getFinalAmount(booking)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerCopy}>
          <p style={styles.subtitle}>Trip ID: {id}</p>
          <h2 style={styles.title}>{booking.customerName}</h2>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.shareButton} onClick={handleShare}>
            <Share2 size={16} /> Share
          </button>
          <button style={{...styles.back, background: '#2563eb', color: '#fff', marginLeft: 'auto', border: 'none'}} onClick={() => navigate('/')}>
            Back
          </button>
        </div>
      </div>

      <div style={styles.infoBar}>
        <div style={styles.statusBadge}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: STATUS_COLORS[booking.status] || '#cbd5e1',
            }}
          />
          <span style={{ color: STATUS_COLORS[booking.status] || '#64748b' }}>
            {booking.status}
          </span>
        </div>
        <div style={styles.tripTypeBadge}>{booking.tripType}</div>
      </div>

      <div style={styles.grid}>
        
        {/* ACTION BUTTONS */}
        {booking.status !== 'Trip Completed' && booking.status !== 'Driver Rejected' && (
          <Section title="Trip Actions">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {isPending && (
                <>
                  <button style={{...styles.actionBtn, background: '#16a34a'}} onClick={() => updateStatus('Driver Accepted')}>
                    <CheckCircle size={18} /> Accept Trip
                  </button>
                  <button style={{...styles.actionBtn, background: '#ef4444'}} onClick={() => updateStatus('Driver Rejected')}>
                    <XCircle size={18} /> Reject
                  </button>
                </>
              )}
              {booking.status === 'Driver Accepted' && (
                <button style={{...styles.actionBtn, background: '#8b5cf6'}} onClick={() => updateStatus('Trip Started')}>
                  <Play size={18} /> Start Trip
                </button>
              )}
              {booking.status === 'Trip Started' && (
                <button style={{...styles.actionBtn, background: '#16a34a'}} onClick={() => updateStatus('Trip Completed')}>
                  <Flag size={18} /> Mark as Completed
                </button>
              )}
            </div>
          </Section>
        )}

        <Section title="Passenger Details">
          <InfoRow label="Name" value={booking.customerName} />
          <InfoRow label="Mobile Number" value={booking.mobileNumber} />
          <InfoRow label="Alternate Mobile" value={booking.alternateMobileNumber} />
        </Section>

        <Section title="Route Details">
          <InfoRow label="Date" value={booking.date} />
          <InfoRow label="Pickup Time" value={booking.pickupTime} />
          <InfoRow label="Pickup Point" value={booking.pickupPoint} />
          <InfoRow label="Drop Point" value={booking.dropPoint} />
          {booking.numberOfDays && <InfoRow label="Days" value={booking.numberOfDays} />}
          {booking.numberOfNights && <InfoRow label="Nights" value={booking.numberOfNights} />}
        </Section>

        <Section title="Earnings & Fare Info">
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.2rem' }}>AMOUNT TO COLLECT FROM CUSTOMER</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>Rs {finalFare.toLocaleString()}</div>
          </div>
          <InfoRow label="Driver Allowance" value={booking.driverAllowance ? `Rs ${booking.driverAllowance}` : 'N/A'} />
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Note: Tolls and parking collected during the trip are to be reported to the admin.</p>
        </Section>
        
        {booking.notes && (
          <Section title="Notes">
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{booking.notes}</p>
          </Section>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  )
}

const styles = {
  page: { maxWidth: '820px', margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    minWidth: '150px',
  },
  subtitle: { margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '500' },
  title: { fontSize: '1.35rem', fontWeight: '700', margin: 0 },
  headerActions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 },
  back: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderRadius: '10px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  shareButton: {
    background: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.5rem 1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  actionBtn: {
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.25rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.95rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  infoBar: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '0.75rem 1.25rem',
    borderRadius: '10px',
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    alignItems: 'center',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  tripTypeBadge: {
    background: '#fff',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  grid: {
    display: 'grid',
    gap: '1.5rem',
  },
  section: {
    background: '#fff',
    borderRadius: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  sectionTitle: {
    margin: 0,
    padding: '1rem 1.25rem',
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#1a1a2e',
    background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
  },
  sectionBody: {
    padding: '1.25rem',
    display: 'grid',
    gap: '1rem',
  },
  infoRow: {
    display: 'grid',
    gridTemplateColumns: '140px 1fr',
    gap: '1rem',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  infoValue: {
    color: '#0f172a',
    fontSize: '0.95rem',
    fontWeight: '500',
  },
}
