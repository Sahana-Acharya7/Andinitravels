import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { 
  ArrowLeft, Pencil, Plus, Trash2, X, ChevronDown, 
  Search, Filter, Phone, Mail, Car, Shield, Calendar, FileText, Hash, 
  MapPin, CheckCircle, AlertCircle, Info, BadgeCheck, Palette,
  MoreVertical, Edit2, User, UserPlus, PhoneCall, Mail as MailIcon,
  Cake, ShieldCheck, CreditCard, ClipboardList, LifeBuoy, FileCheck,
  Camera, ExternalLink
} from 'lucide-react'
import { db, driverCreationAuth } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import {
  resolveDriverFileUrls,
  uploadDriverFilesToSupabase,
} from '../../utils/driverUploadService'

function createEmptyDriver() {
  return {
    name: '',
    mobile: '',
    alternateMobile: '',
    address: '',
    email: '',
    password: '',
    birthday: '',
    aadhaarNo: '',
    dlNo: '',
    panNo: '',
    carNo: '',
    vehicleModel: '',
    vehicleType: '',
    carColor: '',
    carRegNo: '',
    driverAlternateMobile: '',
    driverAllowance: '',
    driverAllowanceType: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyContact2: '',
    emergencyPhone2: '',
    notes: '',
    driverPhotoUrl: '',
    aadhaarPhotoUrl: '',
    dlPhotoUrl: '',
    panPhotoUrl: '',
    carPhotoUrls: [],
    uid: '',
    isAvailable: true,
    licenseExpiry: '',
    insuranceExpiry: '',
    employeeId: '',
    driverType: 'COMPANY_DRIVER',
    ownsVehicle: false
  }
}

function createEmptyFiles() {
  return {
    driverPhoto: null,
    aadhaarPhoto: null,
    dlPhoto: null,
    panPhoto: null,
    carPhotos: [],
  }
}

const CAR_TYPES = [
  'Sedan (4 Seater)',
  'MUV (7 Seater)',
  'SUV (7 Seater)',
  'VAN (4 Seater)',
]

export default function Drivers() {
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState([])
  const [filteredDrivers, setFilteredDrivers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [form, setForm] = useState(createEmptyDriver())
  const [files, setFiles] = useState(createEmptyFiles())
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [viewingDriver, setViewingDriver] = useState(null)

  useEffect(() => {
    return onSnapshot(collection(db, 'drivers'), snapshot => {
      const nextDrivers = snapshot.docs
        .map(document => ({ id: document.id, ...document.data() }))
        .sort((left, right) => (left.name || '').localeCompare(right.name || ''))
      setDrivers(nextDrivers)
      
      // Update the viewing driver if it exists in the new data
      if (viewingDriver) {
        const updated = nextDrivers.find(d => d.id === viewingDriver.id)
        if (updated) setViewingDriver(updated)
      }
    })
  }, [viewingDriver?.id])

  useEffect(() => {
    let result = drivers.filter(d => 
      (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.mobile || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.email || '').toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter === 'Available') result = result.filter(d => d.isAvailable)
    if (statusFilter === 'Unavailable') result = result.filter(d => !d.isAvailable)
    setFilteredDrivers(result)
  }, [search, statusFilter, drivers])

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const resetForm = () => {
    setForm(createEmptyDriver())
    setFiles(createEmptyFiles())
    setShowForm(false)
    setEditingId(null)
  }

  const startCreate = () => {
    setForm(createEmptyDriver())
    setFiles(createEmptyFiles())
    setEditingId(null)
    setShowForm(true)
  }

  const startEdit = driver => {
    setForm({
      ...createEmptyDriver(),
      ...driver,
      password: '',
    })
    setFiles(createEmptyFiles())
    setEditingId(driver.id)
    setShowForm(true)
  }

  const setSingleFile = (key, file) => {
    setFiles(current => ({ ...current, [key]: file || null }))
  }

  const setMultipleFiles = fileList => {
    setFiles(current => ({ ...current, carPhotos: Array.from(fileList || []) }))
  }

  const handleSubmit = async event => {
    if (event) event.preventDefault()
    setLoading(true)
    let uid = form.uid || ''
    try {
      if (!editingId) {
        const createdUser = await createUserWithEmailAndPassword(
          driverCreationAuth,
          form.email.trim(),
          form.password,
        )
        uid = createdUser.user.uid
      }
      const storageId = uid || editingId || `driver-${Date.now()}`
      const uploadPayload = await uploadDriverFilesToSupabase(storageId, files, form)
      const payload = {
        ...form,
        ...uploadPayload,
        uid,
        updatedAt: serverTimestamp(),
      }
      delete payload.password
      if (editingId) {
        await updateDoc(doc(db, 'drivers', editingId), payload)
      } else {
        await addDoc(collection(db, 'drivers'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      }
      resetForm()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
      try { await signOut(driverCreationAuth) } catch {}
    }
  }

  const handleDelete = async driver => {
    if (!window.confirm(`Delete driver ${driver.name}?`)) return
    await deleteDoc(doc(db, 'drivers', driver.id))
    if (viewingDriver?.id === driver.id) setViewingDriver(null)
  }

  if (viewingDriver) {
    return (
      <>
        <DriverProfile 
          driver={viewingDriver} 
          onBack={() => setViewingDriver(null)} 
          onEdit={() => startEdit(viewingDriver)} 
        />
        {showForm && (
           <DriverForm 
             editingId={editingId} 
             form={form} 
             set={set} 
             resetForm={resetForm} 
             handleSubmit={handleSubmit} 
             loading={loading}
             files={files}
             setSingleFile={setSingleFile}
             setMultipleFiles={setMultipleFiles}
           />
        )}
      </>
    )
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Drivers</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>Manage your fleet and track driver performance.</p>
        </div>
        <button 
          className="btn-new-booking" 
          style={{ width: 'auto', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
          onClick={startCreate}
        >
          <UserPlus size={20} />
          <span>+ Add New Driver</span>
        </button>
      </div>

      {/* Toolbar Area */}
      <div className="data-card-toolbar" style={{ border: 'none', padding: '0 0 1.5rem 0', background: 'transparent' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <div className="search-box" style={{ flex: 1, maxWidth: '480px' }}>
            <Search className="search-icon" size={18} />
            <input
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="search-box" style={{ width: '200px' }}>
            <Filter className="search-icon" size={18} />
            <select 
              style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: '2.5rem', cursor: 'pointer' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>All Status</option>
              <option>Available</option>
              <option>Unavailable</option>
            </select>
          </div>
        </div>
        <div className="tab-count" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          <Car size={16} />
          <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{drivers.length}</span> Total Drivers
        </div>
      </div>

      {/* Driver List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredDrivers.map((d, idx) => (
          <div key={d.id} className="data-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', transition: 'all 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '300px' }}>
              <div style={{ 
                width: '3.5rem', 
                height: '3.5rem', 
                borderRadius: '1rem', 
                background: 'linear-gradient(to bottom right, #2563eb, #4f46e5)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontWeight: 800, 
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                {(d.name || 'D')[0].toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{d.name}</h4>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-subtle)', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                  ID: DRV-{(idx + 1).toString().padStart(3, '0')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '250px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Phone size={14} color="var(--text-tertiary)" /> {d.mobile}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                <MailIcon size={14} /> {d.email}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                <Car size={16} color="var(--text-tertiary)" /> {d.vehicleModel || 'No Vehicle'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                {d.carRegNo || '-- --- ----'}
              </div>
            </div>

            <div style={{ width: '150px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.8125rem', 
                fontWeight: 700, 
                color: d.isAvailable ? '#10b981' : '#ef4444',
                background: d.isAvailable ? '#ecfdf5' : '#fef2f2',
                padding: '6px 12px',
                borderRadius: '8px',
                width: 'fit-content'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                {d.isAvailable ? 'Available' : 'Unavailable'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="icon-btn" onClick={() => startEdit(d)} title="Edit"><Pencil size={16} /></button>
                <button className="icon-btn" style={{ color: '#ef4444' }} onClick={() => handleDelete(d)} title="Delete"><Trash2 size={16} /></button>
              </div>
              <button 
                className="btn-new-booking" 
                style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.8125rem', marginBottom: 0 }}
                onClick={() => setViewingDriver(d)}
              >
                See Full Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <DriverForm 
          editingId={editingId} 
          form={form} 
          set={set} 
          resetForm={resetForm} 
          handleSubmit={handleSubmit} 
          loading={loading}
          files={files}
          setSingleFile={setSingleFile}
          setMultipleFiles={setMultipleFiles}
        />
      )}
    </div>
  )
}

function DriverForm({ editingId, form, set, resetForm, handleSubmit, loading, files, setSingleFile, setMultipleFiles }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.formCard}>
        <div style={styles.formHeader}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{editingId ? 'Edit Driver' : 'New Driver'}</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
              {editingId ? 'Update the driver profile details.' : 'Create the driver login and save the full profile in one place.'}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={resetForm}><X size={24} /></button>
        </div>
        
        <div style={styles.formBody}>
            {/* BASIC DETAILS */}
            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>Basic Details</h3>
              <div style={styles.formGrid}>
                <Field label="Name" required><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter full name" required /></Field>
                <Field label="Mobile" required><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="Enter mobile number" required /></Field>
                <Field label="Alternate Mobile"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.alternateMobile} onChange={e => set('alternateMobile', e.target.value)} placeholder="Enter alternate number" /></Field>
                <Field label="Birthday"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)} /></Field>
                <Field label="Login Email" required><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="andinitravels@gmail.com" required disabled={editingId} /></Field>
                {!editingId && <Field label="Password" required><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="•••••••••••" required /></Field>}
                <Field label="Driver Type" required>
                  <select className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.driverType} onChange={e => set('driverType', e.target.value)} required>
                    <option value="COMPANY_DRIVER">Company Driver</option>
                    <option value="ATTACHED_DRIVER">Attached (Vendor) Driver</option>
                  </select>
                </Field>
                <Field label="Vehicle Ownership">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '45px' }}>
                    <input type="checkbox" checked={form.ownsVehicle} onChange={e => set('ownsVehicle', e.target.checked)} />
                    <span style={{ fontSize: '0.875rem' }}>Driver owns the vehicle</span>
                  </div>
                </Field>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Field label="Address"><textarea className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px' }} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Enter full address" /></Field>
              </div>
            </div>

            {/* IDENTITY AND VEHICLE */}
            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>Identity and Vehicle</h3>
              <div style={styles.formGrid}>
                <Field label="Aadhaar Number"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.aadhaarNo} onChange={e => set('aadhaarNo', e.target.value)} placeholder="12-digit Aadhaar number" /></Field>
                <Field label="Driving Licence Number"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.dlNo} onChange={e => set('dlNo', e.target.value)} placeholder="Enter DL number" /></Field>
                <Field label="PAN Number"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.panNo} onChange={e => set('panNo', e.target.value)} placeholder="Enter PAN number" /></Field>
                <Field label="Car Registration Number"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.carRegNo} onChange={e => set('carRegNo', e.target.value)} placeholder="e.g. GJ 18 BG 8621" /></Field>
                <Field label="Vehicle Type">
                  <select className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                    <option value="">Select vehicle type</option>
                    {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Vehicle Model"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} placeholder="e.g. Maruti Ertiga" /></Field>
                <Field label="Car Color"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.carColor} onChange={e => set('carColor', e.target.value)} placeholder="e.g. White" /></Field>
              </div>
            </div>

            {/* EMERGENCY AND NOTES */}
            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>Emergency and Notes</h3>
              <div style={styles.formGrid}>
                <Field label="Emergency Contact Name 1"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="Contact person name" /></Field>
                <Field label="Emergency Phone number 1"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} placeholder="Contact phone number" /></Field>
                <Field label="Emergency Contact Name 2"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.emergencyContact2} onChange={e => set('emergencyContact2', e.target.value)} placeholder="Contact person name" /></Field>
                <Field label="Emergency Phone number 2"><input className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} value={form.emergencyPhone2} onChange={e => set('emergencyPhone2', e.target.value)} placeholder="Contact phone number" /></Field>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Field label="Notes"><textarea className="form-input" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '80px' }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." /></Field>
              </div>
            </div>

            {/* UPLOADS */}
            <div style={styles.formSection}>
              <h3 style={styles.formSectionTitle}>Uploads</h3>
              <div style={styles.formGrid}>
                <FileField label="Driver Photo" existing={form.driverPhotoUrl} selected={files.driverPhoto}>
                  <input style={{ padding: '8px', width: '100%', fontSize: '0.75rem' }} type="file" accept="image/*" onChange={e => setSingleFile('driverPhoto', e.target.files?.[0])} />
                </FileField>
                <FileField label="Aadhaar Photo" existing={form.aadhaarPhotoUrl} selected={files.aadhaarPhoto}>
                  <input style={{ padding: '8px', width: '100%', fontSize: '0.75rem' }} type="file" accept="image/*" onChange={e => setSingleFile('aadhaarPhoto', e.target.files?.[0])} />
                </FileField>
                <FileField label="DL Photo" existing={form.dlPhotoUrl} selected={files.dlPhoto}>
                  <input style={{ padding: '8px', width: '100%', fontSize: '0.75rem' }} type="file" accept="image/*" onChange={e => setSingleFile('dlPhoto', e.target.files?.[0])} />
                </FileField>
                <FileField label="PAN Photo" existing={form.panPhotoUrl} selected={files.panPhoto}>
                  <input style={{ padding: '8px', width: '100%', fontSize: '0.75rem' }} type="file" accept="image/*" onChange={e => setSingleFile('panPhoto', e.target.files?.[0])} />
                </FileField>
              </div>
              <div style={{ marginTop: '16px' }}>
                <FileField label="Car Photos" existing={form.carPhotoUrls?.length > 0} selected={files.carPhotos.length > 0}>
                  <input style={{ padding: '8px', width: '100%', fontSize: '0.75rem' }} type="file" accept="image/*" multiple onChange={e => setMultipleFiles(e.target.files)} />
                </FileField>
              </div>
            </div>
        </div>

        <div style={styles.formFooter}>
          <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          <button type="button" className="btn-new-booking" style={{ width: 'auto', padding: '0 32px', marginBottom: 0 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingId ? 'Save Driver' : 'Create Driver'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DriverProfile({ driver, onBack, onEdit }) {
  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700, fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: '0.75rem' }}>
            <ArrowLeft size={16} /> Back to Drivers
          </button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Driver Profile: {driver.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ gap: '8px' }} onClick={onEdit}>
            <Edit2 size={18} /> Edit Profile
          </button>
          <button className="btn-new-booking" style={{ width: 'auto', padding: '0 24px', marginBottom: 0, gap: '8px' }} onClick={onEdit}>
            <ShieldCheck size={18} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Basic Details */}
          <div className="data-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', color: '#2563eb' }}>
               <div style={{ width: '32px', height: '32px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} />
               </div>
               <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Basic Details</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <ProfileField label="FULL NAME" value={driver.name} />
              <ProfileField label="LOGIN EMAIL" value={driver.email} />
              <ProfileField label="MOBILE NUMBER" value={driver.mobile} highlighted />
              <ProfileField label="ALTERNATE MOBILE" value={driver.alternateMobile} highlighted />
              <ProfileField label="BIRTHDAY" value={driver.birthday} />
              <div style={{ gridColumn: 'span 2' }}>
                <ProfileField label="RESIDENTIAL ADDRESS" value={driver.address} />
              </div>
            </div>
          </div>

          {/* Identity & Vehicle Details */}
          <div className="data-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', color: '#2563eb' }}>
               <div style={{ width: '32px', height: '32px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={18} />
               </div>
               <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Identity & Vehicle Details</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              <ProfileField label="AADHAAR NUMBER" value={driver.aadhaarNo} masked />
              <ProfileField label="PAN NUMBER" value={driver.panNo} />
              <ProfileField label="DRIVING LICENCE" value={driver.dlNo} highlighted />
              <ProfileField label="REGISTRATION NO." value={driver.carRegNo} highlighted />
              <ProfileField label="VEHICLE MODEL" value={driver.vehicleModel} />
              <ProfileField label="CAR COLOR" value={driver.carColor} isColor />
            </div>
          </div>

          {/* Car Photos Gallery */}
          <div className="data-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', color: '#2563eb' }}>
               <div style={{ width: '32px', height: '32px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={18} />
               </div>
               <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Vehicle Photos</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {driver.carPhotoUrls && driver.carPhotoUrls.length > 0 ? (
                driver.carPhotoUrls.map((url, i) => (
                  <div key={i} style={{ height: '150px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', overflow: 'hidden', position: 'relative' }}>
                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Car ${i+1}`} />
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', background: 'rgba(255,255,255,0.9)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: 'span 3', padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.875rem' }}>
                  No vehicle photos uploaded yet.
                </div>
              )}
            </div>
          </div>

          {/* Emergency & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="data-card" style={{ padding: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: '#ef4444' }}>
                  <LifeBuoy size={18} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Emergency Contacts</h3>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {driver.emergencyContact ? (
                    <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
                      <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.875rem' }}>{driver.emergencyContact}</div>
                      <div style={{ color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, marginTop: '2px' }}>{driver.emergencyPhone}</div>
                    </div>
                  ) : <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>No emergency contact provided.</p>}
                  {driver.emergencyContact2 && (
                    <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
                      <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.875rem' }}>{driver.emergencyContact2}</div>
                      <div style={{ color: '#dc2626', fontSize: '0.8125rem', fontWeight: 600, marginTop: '2px' }}>{driver.emergencyPhone2}</div>
                    </div>
                  )}
               </div>
            </div>

            <div className="data-card" style={{ padding: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: '#64748b' }}>
                  <ClipboardList size={18} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Internal Notes</h3>
               </div>
               <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                 "{driver.notes || 'No internal notes available for this driver.'}"
               </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Photo Card */}
          <div className="data-card" style={{ padding: '2rem', textAlign: 'center' }}>
             <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1.5rem', textAlign: 'left' }}>DRIVER PHOTO</p>
             <div style={{ width: '180px', height: '180px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto 1.5rem', border: '4px solid #f8fafc', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
               {driver.driverPhotoUrl ? (
                 <img src={driver.driverPhotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Driver" />
               ) : (
                 <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <User size={64} color="#cbd5e1" />
                 </div>
               )}
             </div>
             <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>{driver.name}</h4>
             <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>Employee ID: {driver.employeeId || 'AT-9901'}</p>
          </div>

          {/* Documents Card */}
          <div className="data-card" style={{ padding: '2rem' }}>
             <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '1.5rem' }}>VERIFIED DOCUMENTS</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <DocItem label="Aadhaar Card" url={driver.aadhaarPhotoUrl} />
                <DocItem label="Driving Licence" url={driver.dlPhotoUrl} />
                <DocItem label="PAN Card" url={driver.panPhotoUrl} />
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileField({ label, value, highlighted, masked, isColor }) {
  const displayValue = masked ? (value || '').replace(/\d(?=\d{4})/g, '#') : value
  return (
    <div>
      <p style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</p>
      <div style={{ 
        fontSize: highlighted ? '1rem' : '0.9375rem', 
        fontWeight: highlighted ? 800 : 500, 
        color: highlighted ? 'var(--text-primary)' : 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {isColor && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: value?.toLowerCase() || 'transparent', border: '1px solid var(--border)' }} />}
        {displayValue || 'Not Provided'}
      </div>
    </div>
  )
}

function DocItem({ label, url }) {
  return (
    <div style={{ padding: '1rem', background: 'var(--bg-page)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ height: '120px', background: 'var(--bg-card)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
         {url ? (
           <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={label} />
         ) : (
           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
             <FileText size={32} />
           </div>
         )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BadgeCheck size={14} color="#10b981" /> {label}
        </span>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--success-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={10} color="#10b981" />
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={styles.field}>
       <label style={styles.label}>{label} {required && <span style={{ color: 'red' }}>*</span>}</label>
       {children}
    </div>
  )
}

function FileField({ label, existing, selected, children }) {
  return (
    <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{label}</span>
        {existing && !selected && <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>✓ Uploaded</span>}
        {selected && <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700 }}>● Selected</span>}
      </div>
      {children}
    </div>
  )
}

const styles = {
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  formCard: { background: 'var(--bg-card)', borderRadius: '24px', width: '90%', maxWidth: '800px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', color: 'var(--text-primary)' },
  formHeader: { padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formBody: { padding: '24px', maxHeight: '70vh', overflowY: 'auto' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formFooter: { padding: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  formSection: { marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border)' },
  formSectionTitle: { fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-tertiary)' },
}
