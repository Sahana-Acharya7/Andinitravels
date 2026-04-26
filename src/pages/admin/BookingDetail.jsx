import { useEffect, useState } from 'react'
import { doc, collection, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate, useParams } from 'react-router-dom'

const STATUS_COLORS = {
  'Booking Pending': '#f59e0b',
  'Booking Confirmed': '#16a34a',
}

const TRIP_STATUS_BADGES = {
  unassigned:  { label: 'Unassigned',      bg: '#e2e8f0', color: '#64748b' },
  assigned:    { label: 'Assigned',         bg: '#dbeafe', color: '#2563eb' },
  accepted:    { label: 'Driver Accepted',  bg: '#dcfce7', color: '#16a34a' },
  started:     { label: 'Trip Started',     bg: '#fff7ed', color: '#ea580c' },
  completed:   { label: 'Completed',        bg: '#dcfce7', color: '#16a34a' },
  rejected:    { label: 'Driver Rejected',  bg: '#fef2f2', color: '#dc2626' },
}

const FIELD_SECTIONS = {
  'Passenger Details': [
    ['Passenger Name', 'customerName'],
    ['Mobile Number', 'mobileNumber'],
    ['Alternate Mobile', 'alternateMobileNumber'],
    ['WhatsApp Number', 'whatsappNumber'],
    ['Email', 'email'],
    ['Address', 'address'],
  ],
  'Trip Details': [
    ['Trip Type', 'tripType'],
    ['Status', 'status'],
    ['Pickup Date', 'date'],
    ['Pickup Time', 'pickupTime'],
    ['Pickup Point', 'pickupPoint'],
    ['Drop Point', 'dropPoint'],
    ['No. of Persons', 'persons'],
    ['No. of Bags', 'bags'],
    ['Round Trip Days', 'roundTripDays'],
  ],
  'Driver & Vehicle': [
    ['Select Existing Driver', 'driverId'],
    ['Driver Name', 'driverName'],
    ['Driver Mobile', 'driverMobile'],
    ['Alternate Mobile', 'driverAlternateMobile'],
    ['Car Type', 'carType'],
    ['Car Color', 'carColor'],
    ['Vehicle Model', 'vehicleModel'],
    ['Car Registration No', 'carRegNo'],
  ],
  'Payment': [
    ['Number of Days', 'numberOfDays'],
    ['Number of Nights', 'numberOfNights'],
    ['Number of Kilometers', 'numberOfKilometers'],
    ['Rate per Km (Rs)', 'ratePerKilometer'],
    ['Total Km Amount (Rs)', 'totalKilometerAmount'],
    ['Driver Allowance Type', 'driverAllowanceType'],
    ['Driver Allowance (Rs)', 'driverAllowance'],
    ['Car Fare (Rs)', 'carFare'],
  ],
  'Additional': [
    ['Notes', 'notes'],
  ],
}

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [shareMessage, setShareMessage] = useState('')
  const [drivers, setDrivers] = useState([])

  useEffect(() => {
    return onSnapshot(collection(db, 'drivers'), snapshot => {
      const nextDrivers = snapshot.docs
        .map(document => ({ id: document.id, ...document.data() }))
        .sort((left, right) => (left.name || '').localeCompare(right.name || ''))
      setDrivers(nextDrivers)
    })
  }, [])

  const handleDriverSelect = driverId => {
    if (!driverId) {
      setForm(current => ({
        ...current,
        driverId: '',
        driverName: '',
        driverMobile: '',
        driverAlternateMobile: '',
        carType: '',
        vehicleModel: '',
        carColor: '',
        carRegNo: '',
      }))
      return
    }

    const driver = drivers.find(item => item.id === driverId)
    if (!driver) return

    setForm(current => ({
      ...current,
      driverId,
      driverName: driver.name || '',
      driverMobile: driver.mobile || '',
      driverAlternateMobile: driver.alternateMobile || '',
      carType: driver.vehicleType || '',
      vehicleModel: driver.vehicleModel || '',
      carColor: driver.carColor || '',
      carRegNo: driver.carRegNo || driver.carNo || '',
    }))
  }

  useEffect(() => {
    return onSnapshot(doc(db, 'bookings', id), document => {
      const data = { id: document.id, ...document.data() }
      setBooking(data)
      setForm(data)
    })
  }, [id])

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const save = async () => {
    const { id: _, ...data } = form
    // ADDED for driver assignment
    data.assignedDriverId = data.driverId || null
    data.tripStatus = data.driverId ? 'assigned' : 'unassigned'

    await updateDoc(doc(db, 'bookings', id), data)
    setEditing(false)
  }

  const setStatus = async status => {
    await updateDoc(doc(db, 'bookings', id), { status })
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      await deleteDoc(doc(db, 'bookings', id))
      navigate('/')
    }
  }

  const handleShare = async () => {
    if (!booking) return
    const message = buildShareText(booking)
    try {
      if (navigator.share) {
        await navigator.share({ title: `Trip for ${booking.customerName || 'passenger'}`, text: message })
        setShareMessage('Trip details shared.')
        return
      }
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(message)
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
      setShareMessage('Trip details copied and WhatsApp share opened.')
    } catch (error) {
      setShareMessage(error?.message || 'Could not share trip details.')
    }
  }

  if (!booking) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerCopy}>
          <h2 style={styles.title}>{booking.customerName}</h2>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.shareButton} onClick={handleShare}>
            Share via WhatsApp
          </button>
          <button style={styles.editButton} onClick={() => (editing ? save() : setEditing(true))}>
            {editing ? 'Save Changes' : 'Edit Booking'}
          </button>
          <button style={{...styles.editButton, color: '#dc2626', borderColor: '#fecaca', background: '#fef2f2'}} onClick={handleDelete}>
            Delete Booking
          </button>
          <button style={{...styles.back, background: '#2563eb', color: '#fff', marginLeft: 'auto', border: 'none'}} onClick={() => navigate('/')}>
            Back
          </button>
        </div>
      </div>

      {shareMessage ? <div style={styles.infoBar}>{shareMessage}</div> : null}

      <div style={styles.statusRow}>
        {['Booking Pending', 'Booking Confirmed'].map(status => (
          <button
            key={status}
            style={{
              ...styles.statusButton,
              background: booking.status === status ? STATUS_COLORS[status] : '#fff',
              color: booking.status === status ? '#fff' : STATUS_COLORS[status],
              border: `2px solid ${STATUS_COLORS[status]}`,
            }}
            onClick={() => setStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        {Object.entries(FIELD_SECTIONS).map(([sectionName, fields]) => (
          <div key={sectionName}>
            <div style={{...styles.sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <span style={styles.sectionTitle}>{sectionName}</span>
              {/* ADDED — tripStatus badge on Driver & Vehicle header */}
              {sectionName === 'Driver & Vehicle' && !editing && (() => {
                const badge = TRIP_STATUS_BADGES[form.tripStatus] || TRIP_STATUS_BADGES.unassigned
                return (
                  <span style={{ background: badge.bg, color: badge.color, padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700' }}>
                    {badge.label}
                  </span>
                )
              })()}
            </div>
            <div style={styles.section}>
              {fields.map(([label, key]) => {
                if (key === 'roundTripDays' && form.tripType !== 'Round Trip') return null;
                if (key === 'driverId' && !editing) return null;
                if (sectionName === 'Payment') {
                  if (form.tripType !== 'Round Trip' && !['carFare', 'parking'].includes(key)) return null;
                  if (form.tripType === 'Round Trip' && key === 'carFare') return null;
                }
                return (
                  <div key={key} style={styles.row}>
                    <span style={styles.label}>{label}</span>
                    {editing ? (
                      key === 'driverId' ? (
                        <select
                          style={styles.input}
                          value={form.driverId || ''}
                          onChange={event => handleDriverSelect(event.target.value)}
                        >
                          <option value="">Select Driver / Clear </option>
                          {drivers.map(driver => (
                            <option key={driver.id} value={driver.id}>
                              {driver.name} - {driver.mobile}
                            </option>
                          ))}
                        </select>
                      ) : key === 'address' || key === 'notes' ? (
                        <textarea
                          style={styles.textarea}
                          value={form[key] || ''}
                          onChange={event => set(key, event.target.value)}
                        />
                      ) : (
                        <input
                          style={styles.input}
                          type={inputTypeFor(key)}
                          value={form[key] || ''}
                          onChange={event => set(key, event.target.value)}
                        />
                      )
                    ) : (
                      <span style={styles.value}>{form[key] || '-'}</span>
                    )}
                  </div>
                );
              })}
              {/* ADDED — Assignment Status row in view mode */}
              {sectionName === 'Driver & Vehicle' && !editing && (
                <div style={styles.row}>
                  <span style={styles.label}>Assignment Status</span>
                  <span style={styles.value}>
                    {(TRIP_STATUS_BADGES[form.tripStatus] || TRIP_STATUS_BADGES.unassigned).label}
                  </span>
                </div>
              )}
              {sectionName === 'Payment' && (
                <div style={{ ...styles.row, borderTop: '1.5px solid #2563eb', paddingTop: '0.75rem', fontWeight: '700' }}>
                  <span style={styles.label}>Final Amount (Rs)</span>
                  <span style={{ ...styles.value, color: '#16a34a', fontSize: '1.1rem' }}>
                    Rs {form.tripType === 'Round Trip'
                      ? ((parseInt(form.totalKilometerAmount) || 0) + (parseInt(form.driverAllowance) || 0))
                      : (parseInt(form.carFare) || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {booking.driverExpenses && (
        <div style={{...styles.card, marginTop: '2rem', border: '1.5px solid #e2e8f0'}}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Trip Cost Reconciliation</span>
          </div>
          <div style={styles.section}>
            <div style={styles.row}>
              <span style={styles.label}>Toll Tax</span>
              <span style={styles.value}>+ Rs {booking.driverExpenses.tollTax || 0}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>State Border Tax</span>
              <span style={styles.value}>+ Rs {booking.driverExpenses.stateBorderTax || 0}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Parking Charges</span>
              <span style={styles.value}>+ Rs {booking.driverExpenses.parkingCharges || 0}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Fuel Cost</span>
              <span style={styles.value}>+ Rs {booking.driverExpenses.fuelCost || 0}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Food Expenses</span>
              <span style={styles.value}>+ Rs {booking.driverExpenses.foodExpenses || 0}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Night Stay Expenses</span>
              <span style={styles.value}>+ Rs {booking.driverExpenses.nightStayExpenses || 0}</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Repairing Cost</span>
              <span style={styles.value}>+ Rs {booking.driverExpenses.repairingCost || 0}</span>
            </div>
            {booking.driverExpenses.additionalKilometers > 0 && (
              <div style={styles.row}>
                <span style={styles.label}>Extra Km ({booking.driverExpenses.additionalKilometers} km) Cost</span>
                <span style={styles.value}>+ Rs {booking.driverExpenses.additionalKilometersCost || 0}</span>
              </div>
            )}
            
            {(() => {
              const totalOperationalCost = 
                (booking.driverExpenses.tollTax || 0) +
                (booking.driverExpenses.stateBorderTax || 0) +
                (booking.driverExpenses.parkingCharges || 0) +
                (booking.driverExpenses.fuelCost || 0) +
                (booking.driverExpenses.foodExpenses || 0) +
                (booking.driverExpenses.nightStayExpenses || 0) +
                (booking.driverExpenses.repairingCost || 0) +
                (booking.driverExpenses.additionalKilometersCost || 0);

              const customerBilledAmount = booking.tripType === 'Round Trip'
                ? ((parseInt(booking.totalKilometerAmount) || 0) + (parseInt(booking.driverAllowance) || 0))
                : (parseInt(booking.carFare) || 0);

              const finalAmount = customerBilledAmount + totalOperationalCost;

              return (
                <>
                  <div style={{...styles.row, borderTop: '2px solid #000', marginTop: '0.5rem', fontWeight: '700'}}>
                    <span style={styles.label}>Total Operational Cost</span>
                    <span style={styles.value}>Rs {totalOperationalCost}</span>
                  </div>
                  <div style={styles.row}>
                    <span style={styles.label}>Customer Billed Amount</span>
                    <span style={styles.value}>Rs {customerBilledAmount}</span>
                  </div>
                  <div style={{...styles.row, background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginTop: '1rem'}}>
                    <span style={{...styles.label, color: '#0f172a'}}>Final Amount</span>
                    <span style={{...styles.value, color: '#2563eb', fontSize: '1.2rem', fontWeight: '800'}}>
                      Rs {finalAmount}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

function buildShareText(booking) {
  const tripTypeDisplay = booking.tripType === 'One way' ? 'One Way Trip' : 
                          booking.tripType === 'Round Trip' ? 'Round Trip' : 
                          booking.tripType === 'Drop' ? 'Drop' : 
                          booking.tripType === 'Pickup' ? 'Pickup' : 
                          booking.tripType || '-'

  return [
    `Dear *${booking.customerName || 'Customer'}*,`,
    `Contact No: ${booking.mobileNumber || '-'}`,
    '',
    'Please find the below mentioned details:',
    '',
    `*--- ${tripTypeDisplay.toUpperCase()} ---*`,
    '',
    `*Pickup From:* ${booking.pickupPoint || '-'}`,
    `*Pickup Date:* ${booking.date || '-'}`,
    `*Pickup Time:* ${booking.pickupTime || '-'}`,
    `*Drop At:* ${booking.dropPoint || '-'}`,
    '',
    `*Driver Name:* ${booking.driverName || '-'}`,
    `*Mobile:* ${booking.driverMobile || '-'}`,
    `*Car Color:* ${booking.carColor || '-'}`,
    `*Vehicle Model:* ${booking.vehicleModel || '-'}`,
    `*Car Reg No:* ${booking.carRegNo || '-'}`,
    '',
    '*Regards,*',
    '*Andini Travels*',
    'Trimandir - Adalaj',
    '',
    '📞 *24 Hours Helpline No:* +919104956467',
  ].join('\n')
}

function inputTypeFor(key) {
  if (key === 'date' || key === 'birthday') return 'date'
  if (key === 'pickupTime') return 'time'
  if (['persons', 'bags', 'rent', 'driverAllowance', 'toll', 'parking', 'carFare', 'fuelCost', 'maintenanceCost'].includes(key)) return 'number'
  if (key === 'email') return 'email'
  return 'text'
}

const styles = {
  page: { maxWidth: '820px', margin: '0 auto', padding: '1.5rem' },
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
  title: { fontSize: '1.35rem', fontWeight: '700' },
  headerActions: { display: 'flex', gap: '0.75rem', flexWrap: 'nowrap', alignItems: 'center', flex: 1 },
  back: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#2563eb',
    border: '1.5px solid #e0e0e0',
    borderRadius: '10px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#f3f5f8',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  shareButton: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  editButton: {
    background: '#fff',
    color: '#2563eb',
    border: '1.5px solid #dbe2f1',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  infoBar: {
    background: '#ecfdf5',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    fontSize: '0.92rem',
  },
  statusRow: { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  statusButton: {
    flex: 1,
    padding: '0.7rem',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '0.92rem',
    cursor: 'pointer',
    minWidth: '120px',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f1f5f9',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '1.5rem',
    marginBottom: '1rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#2563eb',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  sectionHint: { color: '#64748b', fontSize: '0.85rem' },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  'row:last-child': {
    borderBottom: 'none',
  },
  label: { color: '#64748b', fontSize: '0.9rem', minWidth: '160px', fontWeight: '600' },
  value: { fontWeight: '500', fontSize: '0.96rem', textAlign: 'right', whiteSpace: 'pre-wrap' },
  input: {
    border: '1.5px solid #dbe2f1',
    borderRadius: '8px',
    padding: '0.45rem 0.7rem',
    fontSize: '0.9rem',
    width: '60%',
    minWidth: '220px',
  },
  textarea: {
    border: '1.5px solid #dbe2f1',
    borderRadius: '8px',
    padding: '0.45rem 0.7rem',
    fontSize: '0.9rem',
    width: '60%',
    minWidth: '220px',
    minHeight: '88px',
    resize: 'vertical',
  },
}