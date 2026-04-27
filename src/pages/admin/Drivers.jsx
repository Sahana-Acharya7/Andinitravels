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
  ArrowLeft, Pencil, Plus, Trash2, X, ChevronDown, ChevronUp, 
  Search, Filter, Phone, Mail, Car, Shield, Calendar, FileText, Hash, 
  MapPin, CheckCircle, AlertCircle, Info, BadgeCheck, Palette
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
  const [expandedDriverId, setExpandedDriverId] = useState(null)

  useEffect(() => {
    return onSnapshot(collection(db, 'drivers'), snapshot => {
      const nextDrivers = snapshot.docs
        .map(document => ({ id: document.id, ...document.data() }))
        .sort((left, right) => (left.name || '').localeCompare(right.name || ''))
      setDrivers(nextDrivers)
    })
  }, [])

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
    event.preventDefault()
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
  }

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Drivers</h1>
          <p style={styles.subtitle}>Manage driver profiles, documents and availability.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={styles.primaryBtn} onClick={startCreate}>
            <Plus size={18} /> Add Driver
          </button>
          <button style={styles.outlineBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div style={styles.filterRow}>
        <div style={styles.searchBox}>
          <Search size={20} style={styles.searchIcon} />
          <input 
            style={styles.searchInput} 
            placeholder="Search drivers by name, phone or email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={styles.filterBox}>
          <Filter size={20} style={styles.filterIcon} />
          <select 
            style={styles.filterSelect} 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Available</option>
            <option>Unavailable</option>
          </select>
        </div>
      </div>

      {/* DRIVER FORM MODAL */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>{editingId ? 'Edit Driver' : 'New Driver'}</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  {editingId ? 'Update the driver profile details.' : 'Create the driver login and save the full profile in one place.'}
                </p>
              </div>
              <button type="button" style={styles.iconBtn} onClick={resetForm}><X size={24} /></button>
            </div>
            
            <div style={styles.formBody}>
               {/* BASIC DETAILS */}
               <div style={styles.formSection}>
                  <h3 style={styles.formSectionTitle}>Basic Details</h3>
                  <div style={styles.formGrid}>
                    <Field label="Name" required><input style={styles.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter full name" required /></Field>
                    <Field label="Mobile" required><input style={styles.input} value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="Enter mobile number" required /></Field>
                    <Field label="Alternate Mobile"><input style={styles.input} value={form.alternateMobile} onChange={e => set('alternateMobile', e.target.value)} placeholder="Enter alternate number" /></Field>
                    <Field label="Birthday"><input style={styles.input} type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)} /></Field>
                    <Field label="Login Email" required><input style={styles.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="andinitravels@gmail.com" required disabled={editingId} /></Field>
                    {!editingId && <Field label="Password" required><input style={styles.input} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="•••••••••••" required /></Field>}
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Field label="Address"><textarea style={styles.textarea} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Enter full address" /></Field>
                  </div>
               </div>

               {/* IDENTITY AND VEHICLE */}
               <div style={styles.formSection}>
                  <h3 style={styles.formSectionTitle}>Identity and Vehicle</h3>
                  <div style={styles.formGrid}>
                    <Field label="Aadhaar Number"><input style={styles.input} value={form.aadhaarNo} onChange={e => set('aadhaarNo', e.target.value)} placeholder="12-digit Aadhaar number" /></Field>
                    <Field label="Driving Licence Number"><input style={styles.input} value={form.dlNo} onChange={e => set('dlNo', e.target.value)} placeholder="Enter DL number" /></Field>
                    <Field label="PAN Number"><input style={styles.input} value={form.panNo} onChange={e => set('panNo', e.target.value)} placeholder="Enter PAN number" /></Field>
                    <Field label="Car Registration Number"><input style={styles.input} value={form.carRegNo} onChange={e => set('carRegNo', e.target.value)} placeholder="e.g. GJ 18 BG 8621" /></Field>
                    <Field label="Vehicle Type">
                      <select style={styles.input} value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                        <option value="">Select vehicle type</option>
                        {CAR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Vehicle Model"><input style={styles.input} value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} placeholder="e.g. Maruti Ertiga" /></Field>
                    <Field label="Car Color"><input style={styles.input} value={form.carColor} onChange={e => set('carColor', e.target.value)} placeholder="e.g. White" /></Field>
                  </div>
               </div>

               {/* EMERGENCY AND NOTES */}
               <div style={styles.formSection}>
                  <h3 style={styles.formSectionTitle}>Emergency and Notes</h3>
                  <div style={styles.formGrid}>
                    <Field label="Emergency Contact Name 1"><input style={styles.input} value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} placeholder="Contact person name" /></Field>
                    <Field label="Emergency Phone number 1"><input style={styles.input} value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} placeholder="Contact phone number" /></Field>
                    <Field label="Emergency Contact Name 2"><input style={styles.input} value={form.emergencyContact2} onChange={e => set('emergencyContact2', e.target.value)} placeholder="Contact person name" /></Field>
                    <Field label="Emergency Phone number 2"><input style={styles.input} value={form.emergencyPhone2} onChange={e => set('emergencyPhone2', e.target.value)} placeholder="Contact phone number" /></Field>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Field label="Notes"><textarea style={styles.textarea} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." /></Field>
                  </div>
               </div>

               {/* UPLOADS */}
               <div style={styles.formSection}>
                  <h3 style={styles.formSectionTitle}>Uploads</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                    Images are compressed in the browser before upload to reduce storage usage.
                  </p>
                  <div style={styles.formGrid}>
                    <FileField label="Driver Photo" existing={form.driverPhotoUrl} selected={files.driverPhoto}>
                      <input style={styles.fileInput} type="file" accept="image/*" onChange={e => setSingleFile('driverPhoto', e.target.files?.[0])} />
                    </FileField>
                    <FileField label="Aadhaar Photo" existing={form.aadhaarPhotoUrl} selected={files.aadhaarPhoto}>
                      <input style={styles.fileInput} type="file" accept="image/*" onChange={e => setSingleFile('aadhaarPhoto', e.target.files?.[0])} />
                    </FileField>
                    <FileField label="DL Photo" existing={form.dlPhotoUrl} selected={files.dlPhoto}>
                      <input style={styles.fileInput} type="file" accept="image/*" onChange={e => setSingleFile('dlPhoto', e.target.files?.[0])} />
                    </FileField>
                    <FileField label="PAN Photo" existing={form.panPhotoUrl} selected={files.panPhoto}>
                      <input style={styles.fileInput} type="file" accept="image/*" onChange={e => setSingleFile('panPhoto', e.target.files?.[0])} />
                    </FileField>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <FileField label="Car Photos" existing={form.carPhotoUrls?.length > 0} selected={files.carPhotos.length > 0} multiple>
                      <input style={styles.fileInput} type="file" accept="image/*" multiple onChange={e => setMultipleFiles(e.target.files)} />
                    </FileField>
                  </div>
               </div>
            </div>

            <div style={styles.formFooter}>
              <button type="button" style={styles.outlineBtn} onClick={resetForm}>Cancel</button>
              <button type="button" style={styles.primaryBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Save Driver' : 'Create Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRIVER LIST */}
      <div style={styles.list}>
        {filteredDrivers.map((d, index) => (
          <DriverCard 
            key={d.id} 
            driver={d} 
            index={index}
            onEdit={() => startEdit(d)}
            onDelete={() => handleDelete(d)}
            isExpanded={expandedDriverId === d.id}
            onToggleExpand={() => setExpandedDriverId(expandedDriverId === d.id ? null : d.id)}
          />
        ))}
        {filteredDrivers.length === 0 && <div style={styles.empty}>No drivers found matching your search.</div>}
      </div>

      {/* PAGINATION */}
      <div style={styles.pagination}>
        <div style={styles.pageInfo}>Showing 1 to {filteredDrivers.length} of {filteredDrivers.length} drivers</div>
        <div style={styles.pageActions}>
           <button style={styles.pageBtn} disabled><ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} /></button>
           <button style={{ ...styles.pageBtn, background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }}>1</button>
           <button style={styles.pageBtn} disabled><ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} /></button>
        </div>
      </div>
    </div>
  )
}

function DriverCard({ driver, onEdit, onDelete, isExpanded, onToggleExpand, index }) {
  const initials = (driver.name || 'D').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const idStr = `DRV-${(index + 1).toString().padStart(3, '0')}`

  return (
    <div style={styles.card}>
      <div style={styles.cardMain}>
        {/* Left Section: Identity */}
        <div style={styles.cardLeft}>
          <div style={styles.avatar}>{initials}</div>
          <div style={styles.idBox}>
             <h3 style={styles.cardName}>{driver.name}</h3>
             <span style={styles.idBadge}>ID: {idStr}</span>
          </div>
          <div style={styles.contactList}>
             <div style={styles.contactItem}><Phone size={14} /> {driver.mobile}</div>
             <div style={styles.contactItem}><Mail size={14} /> {driver.email}</div>
          </div>
          <div style={{ ...styles.statusTag, background: driver.isAvailable ? '#f0fdf4' : '#fef2f2', color: driver.isAvailable ? '#16a34a' : '#dc2626' }}>
             <span style={{ ...styles.statusDot, background: driver.isAvailable ? '#16a34a' : '#dc2626' }}></span>
             {driver.isAvailable ? 'Available' : 'Unavailable'}
          </div>
        </div>

        {/* Middle Section: Details Grid */}
        <div style={styles.cardMid}>
          <div style={styles.detailsGrid}>
            <DetailItem icon={<BadgeCheck size={18} />} label="License No." value={driver.dlNo} />
            <DetailItem icon={<Car size={18} />} label="Vehicle" value={driver.vehicleModel || driver.vehicleType} />
            <DetailItem icon={<Calendar size={18} />} label="License Expiry" value={driver.licenseExpiry} />
            <DetailItem icon={<Hash size={18} />} label="Vehicle No." value={driver.carRegNo || driver.carNo} />
            <DetailItem icon={<Shield size={18} />} label="Insurance Expiry" value={driver.insuranceExpiry} />
            <DetailItem icon={<FileText size={18} />} label="Documents" value="3 Uploaded" />
          </div>
        </div>

        {/* Right Section: Actions */}
        <div style={styles.cardRight}>
           <div style={styles.cardActionGroup}>
              <button style={styles.editIconBtn} onClick={onEdit}><Pencil size={16} /></button>
              <button style={styles.deleteIconBtn} onClick={onDelete}><Trash2 size={16} /></button>
           </div>
           <button style={styles.detailsBtn} onClick={onToggleExpand}>
              {isExpanded ? 'Hide Details' : 'See Full Details'} <ChevronDown size={18} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
           </button>
        </div>
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div style={styles.cardExpanded}>
           <div style={styles.expandedGrid}>
              <div style={styles.expandedCol}>
                 <h4 style={styles.expandedTitle}>Contact & Location</h4>
                 <InfoRow label="Alternate Mobile" value={driver.alternateMobile} />
                 <InfoRow label="Address" value={driver.address} />
                 <InfoRow label="Emergency Contact" value={driver.emergencyContact} />
              </div>
              <div style={styles.expandedCol}>
                 <h4 style={styles.expandedTitle}>Vehicle & Misc</h4>
                 <InfoRow label="Car Color" value={driver.carColor} />
                 <InfoRow label="Vehicle Model" value={driver.vehicleModel} />
                 <InfoRow label="Notes" value={driver.notes} />
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

function FileField({ label, existing, selected, multiple, children }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {children}
      <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        {selected ? (
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ New file selected</span>
        ) : existing ? (
          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Current file saved</span>
        ) : (
          <span>No photo uploaded</span>
        )}
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value }) {
  return (
    <div style={styles.detailItem}>
       <div style={styles.detailIcon}>{icon}</div>
       <div>
          <div style={styles.detailLabel}>{label}</div>
          <div style={styles.detailValue}>{value || '-'}</div>
       </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
       <span style={styles.infoLabel}>{label}</span>
       <span style={styles.infoValue}>{value || '-'}</span>
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

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '2rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.9375rem', color: 'var(--text-tertiary)', marginTop: '4px' },
  primaryBtn: { background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' },
  outlineBtn: { background: 'white', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  
  filterRow: { display: 'flex', gap: '20px', marginBottom: '32px' },
  searchBox: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
  searchInput: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9375rem', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  filterBox: { position: 'relative', minWidth: '200px' },
  filterIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
  filterSelect: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', border: '1px solid var(--border-light)', outline: 'none', fontSize: '0.9375rem', background: 'white', cursor: 'pointer', appearance: 'none' },

  list: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  cardMain: { display: 'flex', padding: '24px', gap: '32px', alignItems: 'center' },
  
  cardLeft: { width: '260px', display: 'flex', flexDirection: 'column', gap: '12px' },
  avatar: { width: '64px', height: '64px', borderRadius: '20px', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 },
  idBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
  cardName: { fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' },
  idBadge: { background: '#eff6ff', color: '#2563eb', padding: '2px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, width: 'fit-content' },
  contactList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  contactItem: { fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' },
  statusTag: { padding: '4px 12px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', width: 'fit-content', marginTop: '4px' },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%' },

  cardMid: { flex: 1 },
  detailsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  detailItem: { display: 'flex', gap: '12px', alignItems: 'center' },
  detailIcon: { width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-page)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '2px' },
  detailValue: { fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 700 },

  cardRight: { display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-end', borderLeft: '1px solid var(--border-light)', paddingLeft: '32px' },
  cardActionGroup: { display: 'flex', gap: '8px' },
  editIconBtn: { width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  deleteIconBtn: { width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  detailsBtn: { background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },

  cardExpanded: { padding: '24px', background: 'var(--bg-page)', borderTop: '1px solid var(--border-light)' },
  expandedGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' },
  expandedCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  expandedTitle: { fontSize: '0.875rem', fontWeight: 800, margin: '0 0 12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted var(--border)' },
  infoLabel: { fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 600 },
  infoValue: { fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 700 },

  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px' },
  pageInfo: { fontSize: '0.875rem', color: 'var(--text-tertiary)', fontWeight: 600 },
  pageActions: { display: 'flex', gap: '8px' },
  pageBtn: { width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' },

  empty: { textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)', fontWeight: 600, background: 'white', borderRadius: '24px', border: '1px dashed var(--border)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  formCard: { background: 'white', borderRadius: '24px', width: '90%', maxWidth: '800px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' },
  formHeader: { padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  formBody: { padding: '24px', maxHeight: '70vh', overflowY: 'auto' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  formFooter: { padding: '24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  formSection: { marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid var(--border-light)' },
  formSectionTitle: { fontSize: '0.9375rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-tertiary)' },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.9375rem', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', outline: 'none', fontSize: '0.9375rem', width: '100%', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' },
  fileInput: { padding: '8px', border: '1px dashed var(--border)', borderRadius: '8px', width: '100%', fontSize: '0.75rem' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }
}
