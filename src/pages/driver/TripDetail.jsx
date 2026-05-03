import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, MessageCircle, CheckCircle, XCircle, Play, Flag, Info, Wallet } from 'lucide-react'

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

  if (!booking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="loading-spinner" />
    </div>
  )

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

  const openMaps = () => window.open(`https://maps.google.com/?q=${encodeURIComponent(booking.pickupPoint)}`, '_blank')
  const callCustomer = () => window.open(`tel:${booking.mobileNumber}`)
  const whatsappCustomer = () => {
    const driverText = booking.driverName ? `${booking.driverName} ` : ''
    const text = encodeURIComponent(`Hello, I am ${driverText}your driver from andini travels, I will reach your location shortly.`)
    window.open(`https://wa.me/${booking.whatsappNumber || booking.mobileNumber}?text=${text}`, '_blank')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/driver/trips')}>
          <ArrowLeft size={18} /> Back to Trips
        </button>
        <div style={styles.headerRight}>
          <button style={styles.utilBtn} onClick={openMaps}><MapPin size={16} /> Google Maps</button>
          <button style={styles.utilBtn} onClick={callCustomer}><Phone size={16} /> Call</button>
          <button style={styles.utilBtn} onClick={whatsappCustomer}><MessageCircle size={16} /> WhatsApp</button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.mainCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Info size={18} color="var(--primary)" />
              <h3 style={styles.cardTitle}>Trip Information</h3>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.infoGrid}>
                <InfoItem label="Customer" value={booking.customerName} />
                <InfoItem label="Contact" value={booking.mobileNumber} />
                <InfoItem label="Date" value={booking.date} />
                <InfoItem label="Time" value={booking.pickupTime} />
                <InfoItem label="Trip Type" value={booking.tripType} />
                <InfoItem label="Persons" value={booking.persons} />
                <InfoItem label="Bags" value={booking.bags} />
                {booking.tripMode === 'OUTSOURCED' ? (
                  <>
                    <InfoItem label="Collect from Customer" value={`₹${booking.customerFare?.totalAmount || 0}`} />
                    <InfoItem label="Payout per KM" value={`₹${booking.driverPayout?.perKm || 0}`} />
                    <InfoItem label="Total Payout" value={`₹${booking.driverPayout?.totalAmount || 0}`} />
                  </>
                ) : (
                  <InfoItem label="Total Fare" value={`₹${booking.finalAmount || 0}`} />
                )}
              </div>
              <div style={styles.locationSection}>
                <div style={styles.locationItem}>
                  <div style={styles.locIcon}><CircleIcon color="var(--primary)" /></div>
                  <div>
                    <div style={styles.locLabel}>Pickup Location</div>
                    <div style={styles.locValue}>{booking.pickupPoint}</div>
                  </div>
                </div>
                <div style={styles.locDivider} />
                <div style={styles.locationItem}>
                  <div style={styles.locIcon}><CircleIcon color="var(--success)" /></div>
                  <div>
                    <div style={styles.locLabel}>Drop Location</div>
                    <div style={styles.locValue}>{booking.dropPoint}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Play size={18} color="var(--primary)" />
              <h3 style={styles.cardTitle}>Trip Actions</h3>
            </div>
            <div style={styles.cardBody}>
              {booking.tripStatus === 'assigned' && (
                <div style={styles.actionRow}>
                  <button style={{...styles.actionBtn, backgroundColor: 'var(--success)'}} onClick={() => handleStatusChange('accepted')}>
                    <CheckCircle size={18} /> Accept Assignment
                  </button>
                  <button style={{...styles.actionBtn, backgroundColor: 'var(--danger)'}} onClick={() => handleStatusChange('rejected')}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              )}

              {booking.tripStatus === 'accepted' && (
                <button style={{...styles.actionBtn, backgroundColor: 'var(--primary)', width: '100%'}} onClick={() => handleStatusChange('started')}>
                  <Play size={18} /> Start Trip Now
                </button>
              )}

              {booking.tripStatus === 'started' && (
                <div style={styles.startedStatus}>
                  <div style={styles.statusBanner}>
                    <Play size={20} /> Trip is in Progress
                  </div>
                  <p style={styles.statusHint}>Fill in the expenses below and complete the trip once you reach the destination.</p>
                </div>
              )}

              {booking.tripStatus === 'completed' && (
                <div style={styles.completedBanner}>
                  <CheckCircle size={24} /> Trip Completed Successfully
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={styles.sideCol}>
          {booking.tripStatus === 'started' && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Wallet size={18} color="var(--primary)" />
                <h3 style={styles.cardTitle}>Trip Expenses</h3>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.expenseList}>
                  <ExpenseInput label="Toll Tax" value={expenses.tollTax} onChange={v => handleExpenseChange('tollTax', v)} />
                  <ExpenseInput label="State Border Tax" value={expenses.stateBorderTax} onChange={v => handleExpenseChange('stateBorderTax', v)} />
                  <ExpenseInput label="Parking Charges" value={expenses.parkingCharges} onChange={v => handleExpenseChange('parkingCharges', v)} />
                  <ExpenseInput label="Fuel Cost" value={expenses.fuelCost} onChange={v => handleExpenseChange('fuelCost', v)} />
                  <ExpenseInput label="Food" value={expenses.foodExpenses} onChange={v => handleExpenseChange('foodExpenses', v)} />
                  <ExpenseInput label="Night Stay" value={expenses.nightStayExpenses} onChange={v => handleExpenseChange('nightStayExpenses', v)} />
                  <ExpenseInput label="Repairs" value={expenses.repairingCost} onChange={v => handleExpenseChange('repairingCost', v)} />
                  <ExpenseInput label="Extra Km" value={expenses.additionalKilometers} onChange={v => handleExpenseChange('additionalKilometers', v)} />
                </div>
                
                <div style={styles.totalBox}>
                  <div style={styles.totalRow}>
                    <span>Extra Km Cost</span>
                    <span>₹{Number(expenses.additionalKilometers || 0) * Number(expenses.ratePerKm || 0)}</span>
                  </div>
                </div>

                <button
                  className="primary-login-button"
                  style={{ marginTop: '1.5rem', marginBottom: 0 }}
                  onClick={handleSubmitTrip}
                  disabled={submitting}
                >
                  <Flag size={18} /> {submitting ? 'Submitting...' : 'Complete & Submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  if (!value) return null;
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function CircleIcon({ color }) {
  return <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />;
}

function ExpenseInput({ label, value, onChange }) {
  return (
    <div style={styles.expenseItem}>
      <label style={styles.expenseLabel}>{label}</label>
      <div style={styles.expenseInputWrap}>
        <span style={styles.currency}>₹</span>
        <input
          type="number"
          style={styles.expenseInput}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' },
  headerRight: { display: 'flex', gap: '0.75rem' },
  utilBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  card: { backgroundColor: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', overflow: 'hidden' },
  cardHeader: { padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' },
  cardBody: { padding: '1.5rem' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '700' },
  locationSection: { backgroundColor: 'var(--bg-page)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' },
  locationItem: { display: 'flex', gap: '1rem' },
  locIcon: { marginTop: '4px' },
  locLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' },
  locValue: { fontSize: '1rem', color: 'var(--text-primary)', fontWeight: '700' },
  locDivider: { position: 'absolute', left: '1.8rem', top: '2.8rem', bottom: '2.8rem', width: '1px', borderLeft: '2px dashed var(--border)' },
  actionRow: { display: 'flex', gap: '1rem' },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem', fontWeight: '700', cursor: 'pointer' },
  startedStatus: { textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' },
  statusBanner: { backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', padding: '1rem', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' },
  statusHint: { fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 },
  completedBanner: { backgroundColor: 'var(--success-subtle)', color: 'var(--success)', padding: '2rem', borderRadius: '12px', fontWeight: '700', fontSize: '1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  expenseList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  expenseItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  expenseLabel: { fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' },
  expenseInputWrap: { position: 'relative', width: '100px' },
  currency: { position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-tertiary)' },
  expenseInput: { width: '100%', padding: '0.5rem 0.5rem 0.5rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', textAlign: 'right' },
  totalBox: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' },
}
