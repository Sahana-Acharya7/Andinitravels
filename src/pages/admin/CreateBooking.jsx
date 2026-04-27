import React, { useEffect, useState } from 'react'
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ArrowLeft, User, MapPin, Car, CreditCard, ChevronRight, Check, Plus, MessageSquare } from 'lucide-react'
import { db } from '../../firebase'
import { useNavigate } from 'react-router-dom'

const COUNTRY_CODES = [
  { name: 'India', code: '+91' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'UAE', code: '+971' },
  { name: 'Singapore', code: '+65' },
]

const EMPTY_BOOKING = {
  customerId: '',
  customerName: '',
  mobileNumber: '',
  mobileCountry: 'India',
  alternateMobileNumber: '',
  alternateMobileCountry: 'India',
  whatsappNumber: '',
  whatsappCountry: 'India',
  address: '',
  email: '',
  date: '',
  pickupTime: '',
  pickupPoint: '',
  dropPoint: '',
  tripType: 'Drop',
  roundTripDays: '',
  persons: '',
  bags: '',
  rent: '',
  driverId: '',
  driverName: '',
  driverMobile: '',
  driverAlternateMobile: '',
  carType: '',
  vehicleModel: '',
  carColor: '',
  carRegNo: '',
  numberOfDays: '',
  numberOfNights: '',
  numberOfKilometers: '',
  ratePerKilometer: '11',
  totalKilometerAmount: '',
  carFare: '',
  status: 'Booking Pending',
  notes: '',
  assignedDriverId: null,
  tripStatus: 'unassigned',
}

function calculateFinalAmount(form) {
  if (form.tripType === 'Round Trip') {
    const totalKm = parseInt(form.totalKilometerAmount) || 0
    const driverAllowance = parseInt(form.driverAllowance) || 0
    return totalKm + driverAllowance
  } else {
    const carFare = parseInt(form.carFare) || 0
    return carFare
  }
}

const CAR_TYPES = [
  'Sedan (4 Seater)',
  'MUV (7 Seater)',
  'SUV (7 Seater)',
  'VAN (4 Seater)',
]

export default function CreateBooking() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [customers, setCustomers] = useState([])
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState(EMPTY_BOOKING)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return onSnapshot(collection(db, 'customers'), snapshot => {
      const nextCustomers = snapshot.docs
        .map(document => ({ id: document.id, ...document.data() }))
        .sort((left, right) => left.name.localeCompare(right.name))
      setCustomers(nextCustomers)
    })
  }, [])

  useEffect(() => {
    return onSnapshot(collection(db, 'drivers'), snapshot => {
      const nextDrivers = snapshot.docs
        .map(document => ({ id: document.id, ...document.data() }))
        .sort((left, right) => left.name.localeCompare(right.name))
      setDrivers(nextDrivers)
    })
  }, [])

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const handleCustomerSelect = customerId => {
    if (!customerId) {
      set('customerId', '')
      return
    }
    const customer = customers.find(item => item.id === customerId)
    if (!customer) return
    setForm(current => ({
      ...current,
      customerId,
      customerName: customer.name || '',
      mobileNumber: customer.mobileNumber || customer.mobile || '',
      mobileCountry: customer.mobileCountry || 'India',
      alternateMobileNumber: customer.alternateMobileNumber || '',
      alternateMobileCountry: customer.alternateMobileCountry || 'India',
      whatsappNumber: customer.whatsappNumber || customer.mobile || '',
      whatsappCountry: customer.whatsappCountry || 'India',
      address: customer.address || '',
      email: customer.email || '',
    }))
  }

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

  const handleSubmit = async event => {
    event.preventDefault()
    if (step !== 5) return
    setLoading(true)
    try {
      const payload = {
        ...form,
        assignedDriverId: form.driverId || null,
        tripStatus: form.driverId ? 'assigned' : 'unassigned',
        customerName: (form.customerName || '').trim(),
        mobileNumber: (form.mobileNumber || '').trim(),
        alternateMobileNumber: (form.alternateMobileNumber || '').trim(),
        whatsappNumber: (form.whatsappNumber || '').trim(),
        address: (form.address || '').trim(),
        email: (form.email || '').trim(),
        pickupPoint: (form.pickupPoint || '').trim(),
        dropPoint: (form.dropPoint || '').trim(),
        driverName: (form.driverName || '').trim(),
        driverMobile: (form.driverMobile || '').trim(),
        driverAlternateMobile: (form.driverAlternateMobile || '').trim(),
        carType: (form.carType || '').trim(),
        vehicleModel: (form.vehicleModel || '').trim(),
        carColor: (form.carColor || '').trim(),
        carRegNo: (form.carRegNo || '').trim(),
        notes: (form.notes || '').trim(),
        createdAt: serverTimestamp(),
      }
      const document = await addDoc(collection(db, 'bookings'), payload)
      navigate(`/booking/${document.id}`)
    } catch (error) {
      alert(error.message)
      setLoading(false)
    }
  }

  const steps = [
    { id: 1, name: 'Passenger', icon: <User size={18} /> },
    { id: 2, name: 'Trip Details', icon: <MapPin size={18} /> },
    { id: 3, name: 'Driver & Vehicle', icon: <Car size={18} /> },
    { id: 4, name: 'Payment', icon: <CreditCard size={18} /> },
    { id: 5, name: 'Notes', icon: <MessageSquare size={18} /> },
  ]

  const finalAmount = calculateFinalAmount(form)

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>New Booking</h1>
          <p style={styles.subtitle}>Create a new trip booking in 5 simple steps.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Stepper Moved to Right */}
          <div style={styles.stepper}>
            {steps.map((s, index) => (
              <React.Fragment key={s.id}>
                <div style={styles.stepItem} onClick={() => s.id < step && setStep(s.id)}>
                  <div style={{
                    ...styles.stepIcon,
                    backgroundColor: step === s.id ? 'var(--primary)' : step > s.id ? 'var(--success)' : 'white',
                    borderColor: step >= s.id ? 'transparent' : 'var(--border)',
                    color: step >= s.id ? 'white' : 'var(--text-tertiary)'
                  }}>
                    {step > s.id ? <Check size={14} strokeWidth={3} /> : s.icon}
                  </div>
                  <div style={{ ...styles.stepName, color: step === s.id ? 'var(--primary)' : 'var(--text-tertiary)', fontWeight: step === s.id ? '700' : '500' }}>
                    {s.name}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div style={{ ...styles.stepLine, backgroundColor: step > s.id ? 'var(--success)' : 'var(--border)' }}></div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </button>
        </div>
      </header>

      <div style={styles.form}>
        <div style={styles.card}>
          {/* Card Header Section */}
          <div style={styles.cardHeader}>
            <div style={styles.cardIconBox}>
              {steps[step-1].icon}
            </div>
            <div>
              <h2 style={styles.cardTitle}>{steps[step-1].name} Details</h2>
              <p style={styles.cardSubtitle}>
                {step === 1 ? 'Choose a saved passenger or add new details manually.' : 
                 step === 2 ? 'Set the pickup, drop points and trip duration.' : 
                 step === 3 ? 'Assign a driver or enter vehicle details.' : 
                 step === 4 ? 'Review and confirm the payment details.' : 
                 'Add any additional notes for this trip.'}
              </p>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {/* STEP 1: PASSENGER */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Existing Passenger</label>
                    <select style={styles.input} value={form.customerId} onChange={e => handleCustomerSelect(e.target.value)}>
                      <option value="">Select a passenger</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.mobile || c.mobileNumber})</option>)}
                    </select>
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Passenger Name <span style={{color:'red'}}>*</span></label>
                    <input style={styles.input} value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Enter passenger name" required />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Mobile Number <span style={{color:'red'}}>*</span></label>
                    <div style={styles.phoneInput}>
                      <select style={styles.countrySelect} value={form.mobileCountry} onChange={e => set('mobileCountry', e.target.value)}>
                        {COUNTRY_CODES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.code})</option>)}
                      </select>
                      <input style={styles.numberInput} value={form.mobileNumber} onChange={e => set('mobileNumber', e.target.value)} placeholder="Enter mobile number" required />
                    </div>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>WhatsApp Number</label>
                    <div style={styles.phoneInput}>
                      <select style={styles.countrySelect} value={form.whatsappCountry} onChange={e => set('whatsappCountry', e.target.value)}>
                        {COUNTRY_CODES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.code})</option>)}
                      </select>
                      <input style={styles.numberInput} value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)} placeholder="Enter WhatsApp number" />
                    </div>
                  </div>
                </div>

                {!showMoreDetails ? (
                  <button type="button" style={styles.addMoreBtn} onClick={() => setShowMoreDetails(true)}>
                    <Plus size={16} /> Add more details (Email, Address, Alternate Mobile)
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={styles.row}>
                      <div style={styles.field}>
                        <label style={styles.label}>Alternate Mobile Number</label>
                        <div style={styles.phoneInput}>
                          <select style={styles.countrySelect} value={form.alternateMobileCountry} onChange={e => set('alternateMobileCountry', e.target.value)}>
                            {COUNTRY_CODES.map(c => <option key={c.name} value={c.name}>{c.name} ({c.code})</option>)}
                          </select>
                          <input style={styles.numberInput} value={form.alternateMobileNumber} onChange={e => set('alternateMobileNumber', e.target.value)} placeholder="Enter alternate number" />
                        </div>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input style={styles.input} value={form.email} onChange={e => set('email', e.target.value)} placeholder="Enter email address" />
                      </div>
                    </div>
                    <div style={styles.row}>
                      <div style={styles.field}>
                        <label style={styles.label}>Address</label>
                        <textarea style={{ ...styles.input, minHeight: '80px' }} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Enter address" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: TRIP DETAILS */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Trip Type</label>
                    <select style={styles.input} value={form.tripType} onChange={e => set('tripType', e.target.value)}>
                      <option>Drop</option>
                      <option>Pickup</option>
                      <option>One way</option>
                      <option>Round Trip</option>
                    </select>
                  </div>
                </div>

                {form.tripType === 'Round Trip' && (
                  <div style={styles.row}>
                    <div style={styles.field}>
                      <label style={styles.label}>Number of Days <span style={{color:'red'}}>*</span></label>
                      <select style={styles.input} value={form.roundTripDays} onChange={e => set('roundTripDays', e.target.value)} required>
                        <option value="">Select days</option>
                        {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day} {day === 1 ? 'day' : 'days'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Pickup Date <span style={{color:'red'}}>*</span></label>
                    <input style={styles.input} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Pickup Time</label>
                    <input style={styles.input} type="time" value={form.pickupTime} onChange={e => set('pickupTime', e.target.value)} />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Pickup Point <span style={{color:'red'}}>*</span></label>
                    <input style={styles.input} value={form.pickupPoint} onChange={e => set('pickupPoint', e.target.value)} placeholder="Enter pickup point" required />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Drop Point <span style={{color:'red'}}>*</span></label>
                    <input style={styles.input} value={form.dropPoint} onChange={e => set('dropPoint', e.target.value)} placeholder="Enter drop point" required />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>No. of Persons</label>
                    <input style={styles.input} type="number" value={form.persons} onChange={e => set('persons', e.target.value)} placeholder="e.g. 2" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>No. of Bags</label>
                    <input style={styles.input} type="number" value={form.bags} onChange={e => set('bags', e.target.value)} placeholder="e.g. 2" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: DRIVER & VEHICLE */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Select a Driver</label>
                    <select style={styles.input} value={form.driverId} onChange={e => handleDriverSelect(e.target.value)}>
                      <option value="">Choose a driver</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.mobile})</option>)}
                    </select>
                  </div>
                </div>

                {(form.driverName || form.driverId) && (
                  <div style={{ ...styles.card, background: 'var(--bg-page)', border: 'none', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{form.driverName || 'Driver'}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{form.driverMobile}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Driver Name</label>
                    <input style={styles.input} value={form.driverName} onChange={e => set('driverName', e.target.value)} placeholder="Enter driver name" />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Driver Mobile</label>
                    <input style={styles.input} value={form.driverMobile} onChange={e => set('driverMobile', e.target.value)} placeholder="Enter mobile number" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Alternate Mobile</label>
                    <input style={styles.input} value={form.driverAlternateMobile} onChange={e => set('driverAlternateMobile', e.target.value)} placeholder="Enter alternate number" />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Car Type</label>
                    <select style={styles.input} value={form.carType} onChange={e => set('carType', e.target.value)}>
                      <option value="">Select type</option>
                      {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Car Color</label>
                    <input style={styles.input} value={form.carColor} onChange={e => set('carColor', e.target.value)} placeholder="Enter car color" />
                  </div>
                </div>

                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Vehicle Model</label>
                    <input style={styles.input} value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} placeholder="Enter vehicle model" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Car Registration Number</label>
                    <input style={styles.input} value={form.carRegNo} onChange={e => set('carRegNo', e.target.value)} placeholder="Enter reg number" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PAYMENT */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {form.tripType === 'Round Trip' ? (
                  <>
                    <div style={styles.row}>
                      <div style={styles.field}>
                        <label style={styles.label}>Number of Days</label>
                        <input style={styles.input} type="number" value={form.numberOfDays} onChange={e => {
                          const days = e.target.value
                          const nights = days ? Math.max(0, parseInt(days) - 1) : ''
                          const km = days ? parseInt(days) * 300 : ''
                          const total = km && form.ratePerKilometer ? parseInt(km) * parseInt(form.ratePerKilometer) : ''
                          setForm(c => ({ ...c, numberOfDays: days, numberOfNights: nights, numberOfKilometers: km, totalKilometerAmount: total }))
                        }} />
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Number of Nights</label>
                        <input style={{ ...styles.input, background: 'var(--bg-page)' }} value={form.numberOfNights} readOnly />
                      </div>
                    </div>
                    <div style={styles.row}>
                      <div style={styles.field}>
                        <label style={styles.label}>Estimated KM</label>
                        <input style={{ ...styles.input, background: 'var(--bg-page)' }} value={form.numberOfKilometers} readOnly />
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Rate per KM</label>
                        <input style={styles.input} type="number" value={form.ratePerKilometer} onChange={e => {
                          const total = form.numberOfKilometers && e.target.value ? parseInt(form.numberOfKilometers) * parseInt(e.target.value) : ''
                          setForm(c => ({ ...c, ratePerKilometer: e.target.value, totalKilometerAmount: total }))
                        }} />
                      </div>
                    </div>
                    <div style={styles.row}>
                      <div style={styles.field}>
                        <label style={styles.label}>Driver Allowance Type</label>
                        <select style={styles.input} value={form.driverAllowanceType} onChange={e => set('driverAllowanceType', e.target.value)}>
                          <option value="">Select</option>
                          <option value="day">Day</option>
                          <option value="daynight">Day & Night</option>
                        </select>
                      </div>
                      <div style={styles.field}>
                        <label style={styles.label}>Allowance (Rs)</label>
                        <input style={styles.input} type="number" value={form.driverAllowance} onChange={e => set('driverAllowance', e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={styles.row}>
                    <div style={styles.field}>
                      <label style={styles.label}>Car Fare (Rs)</label>
                      <input style={styles.input} type="number" value={form.carFare} onChange={e => set('carFare', e.target.value)} placeholder="Enter car fare" />
                    </div>
                  </div>
                )}

                <div style={{ ...styles.card, background: 'var(--success-subtle)', border: 'none', textAlign: 'center', padding: '24px', margin: '12px 0' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Final Amount</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)' }}>₹{finalAmount}</div>
                </div>
              </div>
            )}

            {/* STEP 5: NOTES */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={styles.row}>
                  <div style={styles.field}>
                    <label style={styles.label}>Trip Notes</label>
                    <textarea style={{ ...styles.input, minHeight: '160px' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Enter any instructions..." />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Improved Footer */}
        <div style={styles.footer}>
          <div style={styles.footerContent}>
            <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
              <button type="button" style={styles.backBtnFooter} onClick={() => step > 1 ? setStep(step - 1) : navigate('/')}>
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 5 ? (
                <button type="button" style={styles.nextBtn} onClick={() => setStep(step + 1)}>
                  Next <ChevronRight size={18} />
                </button>
              ) : (
                <button type="button" style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Processing...' : `Create Booking ₹${finalAmount}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 120px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '12px', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  title: { fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: '4px 0 0' },
  stepper: { display: 'flex', alignItems: 'center', gap: '24px' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' },
  stepIcon: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' },
  stepName: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.02em' },
  stepLine: { width: '40px', height: '2px', margin: '0 -12px 24px', zIndex: 1 },
  form: { display: 'flex', flexDirection: 'column', gap: '32px' },
  card: { background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  cardHeader: { padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' },
  cardIconBox: { width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: '1.125rem', fontWeight: 800, margin: 0 },
  cardSubtitle: { fontSize: '0.875rem', color: 'var(--text-tertiary)', margin: '4px 0 0' },
  row: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '240px' },
  label: { fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' },
  input: { width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.9375rem', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', background: '#fff' },
  phoneInput: { display: 'flex', gap: '10px', width: '100%' },
  countrySelect: { width: '140px', padding: '14px 10px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.875rem', background: 'var(--bg-page)', flexShrink: 0 },
  numberInput: { flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.9375rem', outline: 'none', boxSizing: 'border-box' },
  addMoreBtn: { padding: '14px', background: 'var(--bg-page)', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '8px 0' },
  footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(15px)', borderTop: '1px solid var(--border-light)', padding: '20px 24px', zIndex: 100 },
  footerContent: { maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  nextBtn: { background: 'var(--primary)', color: 'white', padding: '14px 32px', borderRadius: '14px', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235,0.2)' },
  submitBtn: { background: 'var(--success)', color: 'white', padding: '14px 32px', borderRadius: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(22,163,74,0.2)' },
  backBtnFooter: { padding: '14px 32px', background: 'white', border: '1px solid var(--border)', borderRadius: '14px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }
}
