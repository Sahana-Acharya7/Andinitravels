import { useEffect, useState } from 'react'
import { doc, collection, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, 
  User, Car, CreditCard, FileText, Share2, Edit, Trash2, 
  Package, Users, Hash, CheckCircle, AlertCircle, Info, Palette, Settings
} from 'lucide-react'

const STATUS_COLORS = {
  'Booking Pending': { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c', icon: <AlertCircle size={16} /> },
  'Booking Confirmed': { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', icon: <CheckCircle size={16} /> },
}

const TRIP_STATUS_BADGES = {
  unassigned:  { label: 'Unassigned',      bg: '#f1f5f9', color: '#64748b' },
  assigned:    { label: 'Assigned',         bg: '#eff6ff', color: '#2563eb' },
  accepted:    { label: 'Driver Accepted',  bg: '#f0fdf4', color: '#16a34a' },
  started:     { label: 'Trip Started',     bg: '#fff7ed', color: '#ea580c' },
  completed:   { label: 'Completed',        bg: '#f0fdf4', color: '#16a34a' },
  rejected:    { label: 'Driver Rejected',  bg: '#fef2f2', color: '#dc2626' },
}

const CAR_TYPES = [
  'Sedan (4 Seater)',
  'MUV (7 Seater)',
  'SUV (7 Seater)',
  'VAN (4 Seater)',
]

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

  useEffect(() => {
    return onSnapshot(doc(db, 'bookings', id), document => {
      if (!document.exists()) return navigate('/')
      const data = { id: document.id, ...document.data() }
      setBooking(data)
      setForm(data)
    })
  }, [id, navigate])

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

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const save = async () => {
    const { id: _, ...data } = form
    data.assignedDriverId = data.driverId || null
    data.tripStatus = data.driverId ? (data.tripStatus === 'unassigned' ? 'assigned' : data.tripStatus) : 'unassigned'
    await updateDoc(doc(db, 'bookings', id), data)
    setEditing(false)
  }

  const setStatus = async status => {
    await updateDoc(doc(db, 'bookings', id), { status })
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      await deleteDoc(doc(db, 'bookings', id))
      navigate('/')
    }
  }

  const handleShare = async () => {
    if (!booking) return
    const message = buildShareText(booking)
    try {
      if (navigator.share) {
        await navigator.share({ title: `Trip for ${booking.customerName}`, text: message })
        return
      }
      await navigator.clipboard.writeText(message)
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    } catch (error) {
      alert('Could not share details.')
    }
  }

  if (!booking) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading trip details...</div>

  const finalCustomerAmount = booking.tripType === 'Round Trip'
    ? ((parseInt(booking.totalKilometerAmount) || 0) + (parseInt(booking.driverAllowance) || 0))
    : (parseInt(booking.carFare) || 0)

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button style={styles.iconBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={styles.title}>{booking.customerName}</h1>
        </div>

        <div style={styles.actionRow}>
          <button style={styles.shareBtn} onClick={handleShare}>
            <Share2 size={16} /> Share via WhatsApp
          </button>
          <button style={styles.editBtn} onClick={() => (editing ? save() : setEditing(true))}>
            {editing ? <CheckCircle size={16} /> : <Edit size={16} />}
            {editing ? 'Save Changes' : 'Edit Booking'}
          </button>
          <button style={styles.deleteBtn} onClick={handleDelete}>
            <Trash2 size={16} /> Delete Booking
          </button>
        </div>
      </div>

      {/* STATUS BADGES */}
      <div style={styles.statusRow}>
        {Object.entries(STATUS_COLORS).map(([name, theme]) => (
          <button
            key={name}
            onClick={() => setStatus(name)}
            style={{
              ...styles.statusTab,
              background: booking.status === name ? theme.bg : '#fff',
              borderColor: theme.border,
              color: theme.color,
              opacity: booking.status === name ? 1 : 0.5,
              fontWeight: booking.status === name ? 700 : 500
            }}
          >
            {theme.icon} {name}
          </button>
        ))}
      </div>

      {/* MAIN CARDS GRID */}
      <div style={styles.grid}>
        {/* PASSENGER DETAILS */}
        <Card title="Passenger Details" icon={<User size={20} />}>
          <div style={styles.cardContent}>
            <div style={styles.column}>
              <InfoItem label="Passenger Name" value={booking.customerName} editing={editing} onChange={v => set('customerName', v)} />
              <InfoItem label="Mobile Number" value={booking.mobileNumber} icon={<Phone size={14} />} editing={editing} onChange={v => set('mobileNumber', v)} />
              <InfoItem label="Alternate Mobile" value={booking.alternateMobileNumber} icon={<Phone size={14} />} editing={editing} onChange={v => set('alternateMobileNumber', v)} />
              <InfoItem label="WhatsApp Number" value={booking.whatsappNumber} icon={<Share2 size={14} />} editing={editing} onChange={v => set('whatsappNumber', v)} />
              <InfoItem label="Email" value={booking.email} icon={<Mail size={14} />} editing={editing} onChange={v => set('email', v)} />
            </div>
            <div style={styles.column}>
              <InfoItem label="Address" value={booking.address} icon={<MapPin size={14} />} isTextarea editing={editing} onChange={v => set('address', v)} />
            </div>
          </div>
        </Card>

        {/* TRIP DETAILS */}
        <Card title="Trip Details" icon={<MapPin size={20} />}>
          <div style={styles.cardContent}>
            <div style={styles.column}>
              <InfoItem label="Trip Type" value={booking.tripType} editing={editing} isSelect options={['Drop', 'Pickup', 'One way', 'Round Trip']} onChange={v => set('tripType', v)} />
              <InfoItem label="Status" value={booking.status} />
              <InfoItem label="Pickup Date" value={booking.date} icon={<Calendar size={14} />} editing={editing} type="date" onChange={v => set('date', v)} />
              <InfoItem label="Pickup Time" value={booking.pickupTime} icon={<Clock size={14} />} editing={editing} type="time" onChange={v => set('pickupTime', v)} />
              <InfoItem label="Pickup Point" value={booking.pickupPoint} editing={editing} onChange={v => set('pickupPoint', v)} />
              <InfoItem label="Drop Point" value={booking.dropPoint} editing={editing} onChange={v => set('dropPoint', v)} />
            </div>
            <div style={styles.column}>
              <InfoItem label="No. of Persons" value={booking.persons} icon={<Users size={14} />} editing={editing} type="number" onChange={v => set('persons', v)} />
              <InfoItem label="No. of Bags" value={booking.bags} icon={<Package size={14} />} editing={editing} type="number" onChange={v => set('bags', v)} />
              {booking.tripType === 'Round Trip' && (
                <InfoItem label="Round Trip Days" value={booking.roundTripDays} icon={<Calendar size={14} />} editing={editing} type="number" onChange={v => set('roundTripDays', v)} />
              )}
            </div>
          </div>
        </Card>

        {/* DRIVER & VEHICLE */}
        <Card 
          title="Driver & Vehicle" 
          icon={<Car size={20} />} 
          badge={TRIP_STATUS_BADGES[booking.tripStatus]?.label}
          badgeTheme={TRIP_STATUS_BADGES[booking.tripStatus]}
        >
          <div style={styles.cardContent}>
            <div style={styles.column}>
              {editing && (
                <div style={styles.field}>
                  <label style={styles.label}>Select Existing Driver</label>
                  <select style={styles.input} value={form.driverId || ''} onChange={e => handleDriverSelect(e.target.value)}>
                    <option value="">Select Driver</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <InfoItem label="Driver Name" value={booking.driverName} icon={<User size={14} />} editing={editing} onChange={v => set('driverName', v)} />
              <InfoItem label="Driver Mobile" value={booking.driverMobile} icon={<Phone size={14} />} editing={editing} onChange={v => set('driverMobile', v)} />
              <InfoItem label="Alternate Mobile" value={booking.driverAlternateMobile} icon={<Phone size={14} />} editing={editing} onChange={v => set('driverAlternateMobile', v)} />
              <InfoItem label="Car Type" value={booking.carType} icon={<Car size={14} />} editing={editing} isSelect options={CAR_TYPES} onChange={v => set('carType', v)} />
            </div>
            <div style={styles.column}>
              <InfoItem label="Car Color" value={booking.carColor} icon={<Palette size={14} />} editing={editing} onChange={v => set('carColor', v)} />
              <InfoItem label="Vehicle Model" value={booking.vehicleModel} icon={<Car size={14} />} editing={editing} onChange={v => set('vehicleModel', v)} />
              <InfoItem label="Car Registration No" value={booking.carRegNo} icon={<Hash size={14} />} editing={editing} onChange={v => set('carRegNo', v)} />
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Assignment Status</span>
                <span style={{ 
                  ...styles.statusBadge, 
                  background: TRIP_STATUS_BADGES[booking.tripStatus]?.bg, 
                  color: TRIP_STATUS_BADGES[booking.tripStatus]?.color 
                }}>
                  {TRIP_STATUS_BADGES[booking.tripStatus]?.label}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* PAYMENT */}
        <Card title="Payment" icon={<CreditCard size={20} />}>
          <div style={styles.cardContent}>
            <div style={styles.column}>
              {booking.tripType === 'Round Trip' ? (
                <>
                  <InfoItem label="Number of Days" value={booking.numberOfDays} editing={editing} type="number" onChange={v => set('numberOfDays', v)} />
                  <InfoItem label="Number of Nights" value={booking.numberOfNights} editing={editing} type="number" onChange={v => set('numberOfNights', v)} />
                  <InfoItem label="Number of Kilometers" value={booking.numberOfKilometers} editing={editing} type="number" onChange={v => set('numberOfKilometers', v)} />
                  <InfoItem label="Rate per Km (Rs)" value={booking.ratePerKilometer} editing={editing} type="number" onChange={v => set('ratePerKilometer', v)} />
                  <InfoItem label="Total Km Amount (Rs)" value={booking.totalKilometerAmount} />
                </>
              ) : (
                <InfoItem label="Car Fare (Rs)" value={booking.carFare} editing={editing} type="number" onChange={v => set('carFare', v)} />
              )}
            </div>
            <div style={styles.column}>
              {booking.tripType === 'Round Trip' && (
                <>
                  <InfoItem label="Driver Allowance Type" value={booking.driverAllowanceType} editing={editing} isSelect options={['day', 'daynight']} onChange={v => set('driverAllowanceType', v)} />
                  <InfoItem label="Driver Allowance (Rs)" value={booking.driverAllowance} icon={<CreditCard size={14} />} editing={editing} type="number" onChange={v => set('driverAllowance', v)} />
                </>
              )}
              <div style={{ ...styles.infoRow, marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ ...styles.infoLabel, fontSize: '1rem', color: 'var(--text-primary)' }}>Final Amount (Rs)</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--success)' }}>₹{finalCustomerAmount}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* TRIP COST RECONCILIATION */}
        {booking.driverExpenses && (
          <Card title="Trip Cost Reconciliation" icon={<FileText size={20} />}>
             <div style={styles.reconcileGrid}>
                <div style={styles.reconcileCol}>
                   <ReconcileItem label="Toll Tax" value={booking.driverExpenses.tollTax} />
                   <ReconcileItem label="State Border Tax" value={booking.driverExpenses.stateBorderTax} />
                   <ReconcileItem label="Parking Charges" value={booking.driverExpenses.parkingCharges} />
                   <ReconcileItem label="Fuel Cost" value={booking.driverExpenses.fuelCost} />
                   <ReconcileItem label="Food Expenses" value={booking.driverExpenses.foodExpenses} />
                </div>
                <div style={styles.reconcileCol}>
                   <ReconcileItem label="Night Stay Expenses" value={booking.driverExpenses.nightStayExpenses} />
                   <ReconcileItem label="Repairing Cost" value={booking.driverExpenses.repairingCost} />
                   {booking.driverExpenses.additionalKilometers > 0 && (
                     <ReconcileItem label={`Extra Km (${booking.driverExpenses.additionalKilometers} km) Cost`} value={booking.driverExpenses.additionalKilometersCost} />
                   )}
                   <div style={{ height: '20px' }} />
                   <ReconcileItem label="Total Operational Cost" value={calculateOperational(booking.driverExpenses)} isBold />
                   <ReconcileItem label="Customer Billed Amount" value={finalCustomerAmount} isBold />
                </div>
             </div>
             <div style={styles.finalReconcile}>
                <span>Final Amount</span>
                <span style={styles.finalReconcileValue}>Rs {finalCustomerAmount + calculateOperational(booking.driverExpenses)}</span>
             </div>
             <p style={styles.disclaimer}><Info size={12} /> Amounts include all operational costs and charges</p>
          </Card>
        )}

        {/* NOTES SECTION */}
        <Card title="Additional Notes" icon={<Settings size={20} />}>
           <InfoItem label="Notes" value={booking.notes} isTextarea editing={editing} onChange={v => set('notes', v)} />
        </Card>
      </div>
    </div>
  )
}

function Card({ title, icon, children, badge, badgeTheme }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.cardIconBox}>{icon}</div>
          <h3 style={styles.cardTitle}>{title}</h3>
        </div>
        {badge && (
          <span style={{ ...styles.cardBadge, background: badgeTheme?.bg, color: badgeTheme?.color }}>
            {badge}
          </span>
        )}
      </div>
      <div style={styles.cardBody}>{children}</div>
    </div>
  )
}

function InfoItem({ label, value, icon, editing, onChange, type = 'text', isTextarea, isSelect, options }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <div style={styles.infoValue}>
        {editing ? (
          isTextarea ? (
            <textarea style={styles.textarea} value={value || ''} onChange={e => onChange(e.target.value)} />
          ) : isSelect ? (
            <select style={styles.input} value={value || ''} onChange={e => onChange(e.target.value)}>
              <option value="">Select</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input style={styles.input} type={type} value={value || ''} onChange={e => onChange(e.target.value)} />
          )
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
             {value || '-'} {icon && <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>}
          </span>
        )}
      </div>
    </div>
  )
}

function ReconcileItem({ label, value, isBold }) {
  return (
    <div style={{ ...styles.reconcileRow, fontWeight: isBold ? 700 : 400 }}>
       <span>{label}</span>
       <span>{value > 0 ? `+ Rs ${value}` : isBold ? `Rs ${value}` : `Rs 0`}</span>
    </div>
  )
}

function calculateOperational(ex) {
  return (ex.tollTax || 0) + (ex.stateBorderTax || 0) + (ex.parkingCharges || 0) + (ex.fuelCost || 0) + (ex.foodExpenses || 0) + (ex.nightStayExpenses || 0) + (ex.repairingCost || 0) + (ex.additionalKilometersCost || 0)
}

function buildShareText(booking) {
  const tripTypeDisplay = (booking.tripType || '-').toUpperCase()
  return [
    `Dear *${booking.customerName}*,`,
    `Contact No: ${booking.mobileNumber || '-'}`,
    '',
    'Please find the below mentioned details:',
    '',
    `*--- ${tripTypeDisplay} ---*`,
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
    `*Car Reg No:* ${booking.carRegNo || booking.carNo || '-'}`,
    '',
    '*Regards,*',
    '*Andini Travels*',
    'Trimandir - Adalaj',
    '',
    '📞 *24 Hours Helpline No:* +919104956467'
  ].join('\n')
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 100px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' },
  title: { fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' },
  iconBtn: { width: '44px', height: '44px', borderRadius: '12px', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  actionRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  shareBtn: { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  editBtn: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  deleteBtn: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  backBtn: { background: 'white', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' },
  statusRow: { display: 'flex', gap: '16px', marginBottom: '40px' },
  statusTab: { flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' },
  grid: { display: 'flex', flexDirection: 'column', gap: '32px' },
  card: { background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardIconBox: { width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: '1.125rem', fontWeight: 800, margin: 0 },
  cardBadge: { padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' },
  cardBody: { padding: '24px' },
  cardContent: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  column: { display: 'flex', flexDirection: 'column' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid var(--border-light)' },
  infoLabel: { color: 'var(--text-tertiary)', fontSize: '0.875rem', fontWeight: 600 },
  infoValue: { color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 600, textAlign: 'right' },
  statusBadge: { padding: '2px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 },
  reconcileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '24px' },
  reconcileCol: { display: 'flex', flexDirection: 'column' },
  reconcileRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' },
  finalReconcile: { background: '#eff6ff', padding: '16px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.125rem', fontWeight: 800, color: '#2563eb' },
  finalReconcileValue: { fontSize: '1.5rem' },
  disclaimer: { marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' },
  input: { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }
}