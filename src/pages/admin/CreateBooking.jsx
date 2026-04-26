import { useEffect, useState } from 'react'
import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { ArrowLeft } from 'lucide-react'
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
  { name: 'Malaysia', code: '+60' },
  { name: 'Thailand', code: '+66' },
  { name: 'Germany', code: '+49' },
  { name: 'France', code: '+33' },
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

  useEffect(() => {
    console.log("ENV CHECK:", import.meta.env)
  }, [])


  const navigate = useNavigate()
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
    setLoading(true)

    try {
      const payload = {
        ...form,
        // ADDED for driver assignment
        assignedDriverId: form.driverId || null,
        tripStatus: form.driverId ? 'assigned' : 'unassigned',
        customerName: form.customerName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        alternateMobileNumber: form.alternateMobileNumber.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        pickupPoint: form.pickupPoint.trim(),
        dropPoint: form.dropPoint.trim(),
        driverName: form.driverName.trim(),
        driverMobile: form.driverMobile.trim(),
        driverAlternateMobile: form.driverAlternateMobile.trim(),
        carType: form.carType.trim(),
        vehicleModel: form.vehicleModel.trim(),
        carColor: form.carColor.trim(),
        carRegNo: form.carRegNo.trim(),
        notes: form.notes.trim(),
        createdAt: serverTimestamp(),
      }

      const document = await addDoc(collection(db, 'bookings'), payload)
      navigate(`/booking/${document.id}`)
    } catch (error) {
      alert(error.message)
      setLoading(false)
    }
  }

  return (
   <div style={styles.page}>
  <div style={styles.header}>
    <div>
      <h2 style={styles.title}>New Booking</h2>
      <p style={styles.subtitle}>Pick an existing passenger or enter a new one manually.</p>
    </div>
    <button style={styles.back} onClick={() => navigate('/')}>
      <ArrowLeft size={18} /> Back
    </button>
  </div>

      <form onSubmit={handleSubmit}>
        <Section
          title="Passenger Details"
          subtitle="Choose a saved passenger to auto-fill the form, or keep manual entry."
        >
          <Row>
            <Field label="Existing Passenger">
              <select
                style={styles.input}
                value={form.customerId}
                onChange={event => handleCustomerSelect(event.target.value)}
              >
                <option value="">Select a passenger</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.mobileNumber || customer.mobile}
                  </option>
                ))}
              </select>
            </Field>
          </Row>

          <Row>
            <Field label="Passenger Name" required>
              <input
                style={styles.input}
                value={form.customerName}
                onChange={event => set('customerName', event.target.value)}
                required
              />
            </Field>
          </Row>

          <Row>
            <Field label="Mobile Number" required>
              <div style={styles.numberFieldContainer}>
                <select
                  style={{ ...styles.input, ...styles.countrySelect }}
                  value={form.mobileCountry}
                  onChange={event => set('mobileCountry', event.target.value)}
                >
                  {COUNTRY_CODES.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                <input
                  style={{ ...styles.input, ...styles.numberInput }}
                  type="tel"
                  value={form.mobileNumber}
                  onChange={event => set('mobileNumber', event.target.value)}
                  placeholder="Enter number"
                  required
                />
              </div>
            </Field>
            <Field label="Alternate Mobile Number">
              <div style={styles.numberFieldContainer}>
                <select
                  style={{ ...styles.input, ...styles.countrySelect }}
                  value={form.alternateMobileCountry}
                  onChange={event => set('alternateMobileCountry', event.target.value)}
                >
                  {COUNTRY_CODES.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                <input
                  style={{ ...styles.input, ...styles.numberInput }}
                  type="tel"
                  value={form.alternateMobileNumber}
                  onChange={event => set('alternateMobileNumber', event.target.value)}
                  placeholder="Enter number"
                />
              </div>
            </Field>
          </Row>

          <Row>
            <Field label="WhatsApp Number">
              <div style={styles.numberFieldContainer}>
                <select
                  style={{ ...styles.input, ...styles.countrySelect }}
                  value={form.whatsappCountry}
                  onChange={event => set('whatsappCountry', event.target.value)}
                >
                  {COUNTRY_CODES.map(country => (
                    <option key={country.code} value={country.name}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
                <input
                  style={{ ...styles.input, ...styles.numberInput }}
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={event => set('whatsappNumber', event.target.value)}
                  placeholder="Enter number"
                />
              </div>
            </Field>
          </Row>

          <Row>
            <Field label="Email">
              <input
                style={styles.input}
                type="email"
                value={form.email}
                onChange={event => set('email', event.target.value)}
              />
            </Field>
          </Row>

          <Field label="Address">
            <textarea
              style={{ ...styles.input, minHeight: '88px', resize: 'vertical' }}
              value={form.address}
              onChange={event => set('address', event.target.value)}
            />
          </Field>
        </Section>

        <Section title="Trip Details">
          <Row>
            <Field label="Trip Type">
              <select
                style={styles.input}
                value={form.tripType}
                onChange={event => set('tripType', event.target.value)}
              >
                <option>Drop</option>
                <option>Pickup</option>
                <option>One way</option>
                <option>Round Trip</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                style={styles.input}
                value={form.status}
                onChange={event => set('status', event.target.value)}
              >
                <option>Booking Pending</option>
                <option>Booking Confirmed</option>
                
              </select>
            </Field>
          </Row>

          {form.tripType === 'Round Trip' && (
            <Row>
              <Field label="Number of Days" required>
                <select
                  style={styles.input}
                  value={form.roundTripDays}
                  onChange={event => set('roundTripDays', event.target.value)}
                  required
                >
                  <option value="">Select days</option>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day} {day === 1 ? 'day' : 'days'}
                    </option>
                  ))}
                </select>
              </Field>
            </Row>
          )}

          <Row>
            <Field label="Pickup Date" required>
              <input
                style={styles.input}
                type="date"
                value={form.date}
                onChange={event => set('date', event.target.value)}
                required
              />
            </Field>
            <Field label="Pickup Time">
              <input
                style={styles.input}
                type="time"
                value={form.pickupTime}
                onChange={event => set('pickupTime', event.target.value)}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Pickup Point" required>
              <input
                style={styles.input}
                value={form.pickupPoint}
                onChange={event => set('pickupPoint', event.target.value)}
                required
              />
            </Field>
            <Field label="Drop Point" required>
              <input
                style={styles.input}
                value={form.dropPoint}
                onChange={event => set('dropPoint', event.target.value)}
                required
              />
            </Field>
          </Row>

          <Row>
            <Field label="No. of Persons">
              <input
                style={styles.input}
                type="number"
                value={form.persons}
                onChange={event => set('persons', event.target.value)}
              />
            </Field>
            <Field label="No. of Bags">
              <input
                style={styles.input}
                type="number"
                value={form.bags}
                onChange={event => set('bags', event.target.value)}
              />
            </Field>
          </Row>
        </Section>

        <Section title="Driver and Vehicle">
          <Row>
            <Field label="Select Driver">
              <select
                style={styles.input}
                value={form.driverId}
                onChange={event => handleDriverSelect(event.target.value)}
              >
                <option value="">Choose a driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.mobile}
                  </option>
                ))}
              </select>
            </Field>
          </Row>

          <Row>
            <Field label="Driver Name">
              <input
                style={styles.input}
                value={form.driverName}
                onChange={event => set('driverName', event.target.value)}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Driver Mobile">
              <input
                style={styles.input}
                type="tel"
                value={form.driverMobile}
                onChange={event => set('driverMobile', event.target.value)}
              />
            </Field>
            <Field label="Alternate Mobile">
              <input
                style={styles.input}
                type="tel"
                value={form.driverAlternateMobile}
                onChange={event => set('driverAlternateMobile', event.target.value)}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Car Type">
              <select
                style={styles.input}
                value={form.carType}
                onChange={event => set('carType', event.target.value)}
              >
                <option value="">Select car type</option>
                {CAR_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Car Color">
              <input
                style={styles.input}
                value={form.carColor}
                onChange={event => set('carColor', event.target.value)}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Vehicle Model">
              <input
                style={styles.input}
                value={form.vehicleModel}
                onChange={event => set('vehicleModel', event.target.value)}
                placeholder="e.g. Maruti Swift, Hyundai i20, Toyota Innova"
              />
            </Field>
            <Field label="Car Registration Number">
              <input
                style={styles.input}
                value={form.carRegNo}
                onChange={event => set('carRegNo', event.target.value)}
              />
            </Field>
          </Row>
        </Section>

        <Section title="Payment">
          {form.tripType === 'Round Trip' ? (
            <>
              <Row>
                <Field label="Number of Days">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.numberOfDays}
                    onChange={event => {
                      const days = event.target.value
                      const nights = days ? Math.max(0, parseInt(days) - 1) : ''
                      const km = days ? parseInt(days) * 300 : ''
                      const totalAmount = km && form.ratePerKilometer ? parseInt(km) * parseInt(form.ratePerKilometer) : ''
                      setForm(current => ({
                        ...current,
                        numberOfDays: days,
                        numberOfNights: nights,
                        numberOfKilometers: km,
                        totalKilometerAmount: totalAmount,
                      }))
                    }}
                  />
                </Field>
                <Field label="Number of Nights">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.numberOfNights}
                    readOnly
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Number of Kilometers">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.numberOfKilometers}
                    readOnly
                  />
                </Field>
                <Field label="Rate per Kilometer (Rs)">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.ratePerKilometer}
                    onChange={event => {
                      const rate = event.target.value
                      const totalAmount = form.numberOfKilometers && rate ? parseInt(form.numberOfKilometers) * parseInt(rate) : ''
                      setForm(current => ({
                        ...current,
                        ratePerKilometer: rate,
                        totalKilometerAmount: totalAmount,
                      }))
                    }}
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Total Amount (Rs)">
                  <input
                    style={{ ...styles.input, background: '#f0f9ff' }}
                    type="number"
                    value={form.totalKilometerAmount}
                    readOnly
                  />
                </Field>
              </Row>

              <h4 style={{margin: '1.5rem 0 0.5rem', color: '#2563eb', fontWeight: 700, fontSize: '1.1rem'}}>Other Charges</h4>
              <Row>
                <Field label="Driver Allowance Type">
                  <select
                    style={styles.input}
                    value={form.driverAllowanceType || ''}
                    onChange={event => set('driverAllowanceType', event.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="day">Day</option>
                    <option value="daynight">Day & Night</option>
                  </select>
                </Field>
                <Field label="Driver Allowance (Rs)">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.driverAllowance}
                    onChange={event => set('driverAllowance', event.target.value)}
                  />
                </Field>
              </Row>
            </>
          ) : (
            <Row>
              <Field label="Car Fare (Rs)">
                <input
                  style={styles.input}
                  type="number"
                  value={form.carFare || ''}
                  onChange={event => set('carFare', event.target.value)}
                />
              </Field>
            </Row>
          )}

            <Row>
              <Field label="Final Amount (Rs)">
                <input
                  style={{ ...styles.input, background: '#e0ffe0', fontWeight: 700 }}
                  type="number"
                  value={calculateFinalAmount(form)}
                  readOnly
                />
              </Field>
            </Row>
          </Section>


        <Section title="Notes">
          <textarea
            style={{ ...styles.input, minHeight: '96px', resize: 'vertical' }}
            value={form.notes}
            onChange={event => set('notes', event.target.value)}
            placeholder="Any extra trip notes..."
          />
        </Section>

        <button style={styles.submit} disabled={loading}>
          {loading ? 'Saving...' : 'Create Booking'}
        </button>
      </form>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div style={styles.sectionWrap}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
      </div>
      <div style={styles.sectionCard}>{children}</div>
    </div>
  )
}

function Row({ children }) {
  return <div style={styles.row}>{children}</div>
}

function Field({ label, children, required }) {
  return (
    <div>
      <label style={styles.label}>
        {label}
        {required ? <span style={{ color: '#dc2626' }}> *</span> : null}
      </label>
      {children}
    </div>
  )
}

const styles = {
  page: { maxWidth: '820px', margin: '0 auto', padding: '1.5rem' },
  header: {
  display: 'flex',
  justifyContent: 'space-between',  
  alignItems: 'flex-start',         
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  
},
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
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.2rem' },
  subtitle: { color: '#64748b', fontSize: '0.92rem' },
  sectionWrap: { marginBottom: '1.5rem' },
  sectionHeader: { marginBottom: '0.75rem' },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
  },
  sectionSubtitle: { color: '#64748b', fontSize: '0.88rem' },
  sectionCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '1.25rem',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.35rem',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '0.82rem',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.92rem',
    border: '1.5px solid #dbe2f1',
    borderRadius: '10px',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#fff',
  },
  submit: {
    width: '100%',
    padding: '0.95rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '700',
  },
  numberFieldContainer: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-start',
  },
  countrySelect: {
    flex: '0 0 140px',
    fontSize: '0.9rem',
  },
  numberInput: {
    flex: '1',
  },
}
