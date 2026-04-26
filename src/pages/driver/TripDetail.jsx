import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, MessageCircle, CheckCircle, XCircle, Play, Flag } from 'lucide-react'

export default function TripDetail() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    return onSnapshot(doc(db, 'bookings', bookingId), snapshot => {
      if (snapshot.exists()) {
        setBooking({ id: snapshot.id, ...snapshot.data() })
      } else {
        setBooking(null)
      }
    })
  }, [bookingId])

  const [expenses, setExpenses] = useState({
    tollTax: '0',
    stateBorderTax: '0',
    parkingCharges: '0',
    fuelCost: '0',
    foodExpenses: '0',
    nightStayExpenses: '0',
    repairingCost: '0',
    additionalKilometers: '0',
    ratePerKm: '11'
  })
  const [submitting, setSubmitting] = useState(false)

  if (!booking) return <div style={{ padding: '2rem' }}>Loading trip details...</div>


  const handleExpenseChange = (field, value) => {
    setExpenses(prev => ({ ...prev, [field]: value }))
  }

  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'rejected') {
        await updateDoc(doc(db, 'bookings', bookingId), {
          tripStatus: 'rejected',
          assignedDriverId: null
        })
        navigate('/driver/trips')
      } else {
        await updateDoc(doc(db, 'bookings', bookingId), {
          tripStatus: newStatus
        })
      }
    } catch (error) {
      alert("Failed to update status")
    }
  }

  const handleSubmitTrip = async () => {
    // Validate
    const allFilled = Object.values(expenses).every(v => v !== '')
    if (!allFilled) {
      alert("Please fill in all expense fields. Use 0 if no expense was incurred.")
      return
    }

    if (!window.confirm("Are you sure you want to complete this trip and submit expenses?")) return

    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        driverExpenses: {
          tollTax: Number(expenses.tollTax),
          stateBorderTax: Number(expenses.stateBorderTax),
          parkingCharges: Number(expenses.parkingCharges),
          fuelCost: Number(expenses.fuelCost),
          foodExpenses: Number(expenses.foodExpenses),
          nightStayExpenses: Number(expenses.nightStayExpenses),
          repairingCost: Number(expenses.repairingCost),
          additionalKilometers: Number(expenses.additionalKilometers),
          additionalKilometersCost: Number(expenses.additionalKilometers) * Number(expenses.ratePerKm || 0),
          submittedAt: new Date()
        },
        status: "Trip Completed — Pending Reconciliation",
        tripStatus: 'completed'
      })
    } catch (error) {
      alert("Failed to submit trip: " + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Utilities
  const openMaps = () => window.open(`https://maps.google.com/?q=${encodeURIComponent(booking.pickupPoint)}`, '_blank')
  const callCustomer = () => window.open(`tel:${booking.mobileNumber}`)
  const whatsappCustomer = () => {
    const driverText = booking.driverName ? `${booking.driverName} ` : ''
    const text = encodeURIComponent(`Hello, I am ${driverText}your driver from andini travels, I will reach your location shortly.`)
    window.open(`https://wa.me/${booking.whatsappNumber || booking.mobileNumber}?text=${text}`, '_blank')
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Trip Details</h2>
        <button style={styles.back} onClick={() => navigate('/driver/trips')}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <div style={styles.utilityRow}>
        <button style={styles.utilBtn} onClick={openMaps}><MapPin size={16} /> Google Maps</button>
        <button style={styles.utilBtn} onClick={callCustomer}><Phone size={16} /> Call</button>
        <button style={styles.utilBtn} onClick={whatsappCustomer}><MessageCircle size={16} /> WhatsApp</button>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Trip Information</span>
        </div>
        <div style={styles.section}>
          <Row label="Customer Name" value={booking.customerName} />
          <Row label="Mobile" value={booking.mobileNumber} />
          <Row label="Pickup Point" value={booking.pickupPoint} />
          <Row label="Drop Point" value={booking.dropPoint} />
          <Row label="Pickup Date" value={booking.date} />
          <Row label="Pickup Time" value={booking.pickupTime} />
          <Row label="Trip Type" value={booking.tripType} />
          <Row label="No. of Persons" value={booking.persons} />
          <Row label="No. of Bags" value={booking.bags} />
        </div>
      </div>

      <div style={styles.actionsBox}>
        {booking.tripStatus === 'assigned' && (
          <div style={styles.actionRow}>
            <button style={{...styles.actionBtn, background: '#16a34a'}} onClick={() => handleStatusChange('accepted')}>
              <CheckCircle size={18} /> Accept
            </button>
            <button style={{...styles.actionBtn, background: '#ef4444'}} onClick={() => handleStatusChange('rejected')}>
              <XCircle size={18} /> Reject
            </button>
          </div>
        )}

        {booking.tripStatus === 'accepted' && (
          <button style={{...styles.actionBtn, background: '#3b82f6', width: '100%'}} onClick={() => handleStatusChange('started')}>
            <Play size={18} /> Start Trip
          </button>
        )}

        {booking.tripStatus === 'started' && (
          <div>
            <div style={{...styles.sectionHeader, borderBottom: 'none', marginBottom: '0.5rem'}}>
              <span style={styles.sectionTitle}>Trip Expenses (Rs)</span>
            </div>
            <div style={styles.expenseForm}>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Toll Tax</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.tollTax}
                  onChange={e => handleExpenseChange('tollTax', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>State Border Tax</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.stateBorderTax}
                  onChange={e => handleExpenseChange('stateBorderTax', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Parking Charges</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.parkingCharges}
                  onChange={e => handleExpenseChange('parkingCharges', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Fuel Cost</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.fuelCost}
                  onChange={e => handleExpenseChange('fuelCost', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Food Expenses</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.foodExpenses}
                  onChange={e => handleExpenseChange('foodExpenses', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Night Stay Expenses</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.nightStayExpenses}
                  onChange={e => handleExpenseChange('nightStayExpenses', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Repairing / Maintenance</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.repairingCost}
                  onChange={e => handleExpenseChange('repairingCost', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Additional Kilometers</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.additionalKilometers}
                  onChange={e => handleExpenseChange('additionalKilometers', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Rate per Km (Rs)</label>
                <input
                  type="number"
                  style={styles.expenseInput}
                  value={expenses.ratePerKm}
                  onChange={e => handleExpenseChange('ratePerKm', e.target.value)}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.expenseLabel}>Additional Km Cost (Rs)</label>
                <div style={{...styles.expenseInput, background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center'}}>
                  {Number(expenses.additionalKilometers || 0) * Number(expenses.ratePerKm || 0)}
                </div>
              </div>
            </div>
            <button
              style={{...styles.actionBtn, background: '#8b5cf6', width: '100%', marginTop: '1rem'}}
              onClick={handleSubmitTrip}
              disabled={submitting}
            >
              <Flag size={18} /> {submitting ? 'Submitting...' : 'Submit & Complete Trip'}
            </button>
          </div>
        )}

        {booking.tripStatus === 'completed' && (
          <div style={styles.completedBadge}>
            <CheckCircle size={20} /> Trip Completed
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, highlight }) {
  if (!value) return null
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={{...styles.value, ...(highlight ? { color: '#16a34a', fontWeight: '700', fontSize: '1.1rem' } : {})}}>{value}</span>
    </div>
  )
}

const styles = {
  page: { maxWidth: '820px', margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: '700', margin: 0 },
  back: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: '#2563eb', border: 'none', borderRadius: '8px',
    padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: '600',
    color: '#fff', cursor: 'pointer',
  },
  utilityRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  utilBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#fff', border: '1px solid #dbe2f1', padding: '0.75rem',
    borderRadius: '10px', fontWeight: '600', color: '#334155', cursor: 'pointer',
    minWidth: '120px'
  },
  card: { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '1.5rem' },
  sectionHeader: { marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' },
  sectionTitle: { fontWeight: '700', color: '#2563eb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  section: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' },
  label: { color: '#64748b', fontSize: '0.9rem', fontWeight: '600' },
  value: { fontWeight: '500', fontSize: '0.96rem', textAlign: 'right' },
  actionsBox: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  actionRow: { display: 'flex', gap: '1rem' },
  actionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    color: '#fff', border: 'none', borderRadius: '10px', padding: '1rem',
    fontWeight: '700', fontSize: '1rem', cursor: 'pointer',
  },
  completedBadge: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '10px',
    fontWeight: '700', fontSize: '1.1rem'
  },
  expenseForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  expenseLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
  },
  expenseInput: {
    padding: '0.6rem',
    borderRadius: '8px',
    border: '1px solid #dbe2f1',
    fontSize: '0.95rem',
    width: '100%',
  }
}
