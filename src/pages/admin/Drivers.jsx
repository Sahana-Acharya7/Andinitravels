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
import { ArrowLeft, Pencil, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'
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
    // Add more fields as needed to match CreateBooking
    stateBorderTax: '',
    toll: '',
    parking: '',
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

export default function Drivers() {
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState([])
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
        .sort((left, right) => left.name.localeCompare(right.name))

      setDrivers(nextDrivers)
    })
  }, [])

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
      carPhotoUrls: Array.isArray(driver.carPhotoUrls) ? driver.carPhotoUrls : [],
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
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        alternateMobile: form.alternateMobile.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        aadhaarNo: form.aadhaarNo.trim(),
        dlNo: form.dlNo.trim(),
        panNo: form.panNo.trim(),
        carNo: form.carNo.trim(),
        vehicleModel: form.vehicleModel.trim(),
        vehicleType: form.vehicleType.trim(),
        carColor: form.carColor.trim(),
        emergencyContact: form.emergencyContact.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
        notes: form.notes.trim(),
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
      try {
        await signOut(driverCreationAuth)
      } catch {
        // No-op: secondary auth may already be signed out.
      }
    }
  }

  const handleDelete = async driver => {
    if (!window.confirm(`Delete driver ${driver.name}? This only removes the admin record.`)) return

    await deleteDoc(doc(db, 'drivers', driver.id))
  }

  return (
    <div style={styles.page}>
  <div style={styles.header}>
    <div style={styles.headerCopy}>
      <h2 style={styles.title}>Drivers</h2>
      <p style={styles.subtitle}>Detailed driver profiles with document and photo uploads.</p>
    </div>
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <button style={styles.primaryButton} onClick={startCreate}>
        <Plus size={16} /> Add Driver
      </button>
      <button style={styles.back} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back
      </button>
    </div>
  </div>

  {showForm && (
    <form style={styles.formCard} onSubmit={handleSubmit}>
      <div style={styles.formHeader}>
        <div>
          <h3 style={styles.formTitle}>{editingId ? 'Edit Driver' : 'New Driver'}</h3>
          <p style={styles.formSubtitle}>
            {editingId
              ? 'Update driver profile details and replace any photos if needed.'
              : 'Create the driver login and save the full profile in one place.'}
          </p>
        </div>
        <button type="button" style={styles.iconButton} onClick={resetForm}>
          <X size={18} />
        </button>
      </div>

          <Section title="Basic Details">
            <Grid>
              <Field label="Name" required>
                <input
                  style={styles.input}
                  value={form.name}
                  onChange={event => set('name', event.target.value)}
                  required
                />
              </Field>
              <Field label="Mobile" required>
                <input
                  style={styles.input}
                  type="tel"
                  value={form.mobile}
                  onChange={event => set('mobile', event.target.value)}
                  required
                />
              </Field>
              <Field label="Alternate Mobile">
                <input
                  style={styles.input}
                  type="tel"
                  value={form.alternateMobile}
                  onChange={event => set('alternateMobile', event.target.value)}
                />
              </Field>
              <Field label="Birthday">
                <input
                  style={styles.input}
                  type="date"
                  value={form.birthday}
                  onChange={event => set('birthday', event.target.value)}
                />
              </Field>
              <Field label="Login Email" required>
                <input
                  style={styles.input}
                  type="email"
                  value={form.email}
                  onChange={event => set('email', event.target.value)}
                  required
                  disabled={Boolean(editingId)}
                />
              </Field>
              {!editingId ? (
                <Field label="Password" required>
                  <input
                    style={styles.input}
                    type="password"
                    value={form.password}
                    onChange={event => set('password', event.target.value)}
                    required
                  />
                </Field>
              ) : (
                <Field label="Login Password">
                  <input
                    style={{ ...styles.input, background: '#f8fafc', color: '#94a3b8' }}
                    value="Password changes are not handled here"
                    readOnly
                  />
                </Field>
              )}
            </Grid>

            <Field label="Address">
              <textarea
                style={styles.textarea}
                value={form.address}
                onChange={event => set('address', event.target.value)}
              />
            </Field>
          </Section>

          <Section title="Identity and Vehicle">
            <Grid>
              <Field label="Aadhaar Number">
                <input style={styles.input} value={form.aadhaarNo} onChange={event => set('aadhaarNo', event.target.value)} />
              </Field>
              <Field label="Driving Licence Number">
                <input style={styles.input} value={form.dlNo} onChange={event => set('dlNo', event.target.value)} />
              </Field>
              <Field label="PAN Number">
                <input style={styles.input} value={form.panNo} onChange={event => set('panNo', event.target.value)} />
              </Field>
              
              <Field label="Car Registration Number">
                <input style={styles.input} value={form.carRegNo} onChange={event => set('carRegNo', event.target.value)} />
              </Field>
              <Field label="Vehicle Type">
                <select style={styles.input} value={form.vehicleType} onChange={event => set('vehicleType', event.target.value)}>
                  <option value="">Select vehicle type</option>
                  <option value="Sedan (4 Seater)">Sedan (4 Seater)</option>
                  <option value="MUV (7 Seater)">MUV (7 Seater)</option>
                  <option value="SUV (7 Seater)">SUV (7 Seater)</option>
                  <option value="VAN (4 Seater)">VAN (4 Seater)</option>
                </select>
              </Field>
              <Field label="Vehicle Model">
                <input style={styles.input} value={form.vehicleModel} onChange={event => set('vehicleModel', event.target.value)} />
              </Field>
              <Field label="Car Color">
                <input style={styles.input} value={form.carColor} onChange={event => set('carColor', event.target.value)} />
              </Field>
             
            </Grid>
          </Section>

          <Section title="Emergency and Notes">
            <Grid>
              <Field label="Emergency Contact Name 1">
                <input
                  style={styles.input}
                  value={form.emergencyContact}
                  onChange={event => set('emergencyContact', event.target.value)}
                />
              </Field>
              <Field label="Emergency Phone number 1">
                <input
                  style={styles.input}
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={event => set('emergencyPhone', event.target.value)}
                />
              </Field>
                <Field label="Emergency Contact Name 2">
                <input
                  style={styles.input}
                  value={form.emergencyContact2}
                  onChange={event => set('emergencyContact2', event.target.value)}
                />
              </Field>
              <Field label="Emergency Phone number 2">
                <input
                  style={styles.input}
                  type="tel"
                  value={form.emergencyPhone2}
                  onChange={event => set('emergencyPhone2', event.target.value)}
                />
              </Field>
            </Grid>

            <Field label="Notes">
              <textarea
                style={styles.textarea}
                value={form.notes}
                onChange={event => set('notes', event.target.value)}
              />
            </Field>
          </Section>

          <Section title="Uploads">
            <p style={styles.uploadHint}>
              Images are compressed in the browser before upload to reduce storage usage.
            </p>
            <Grid>
              <FileField
                label="Driver Photo"
                existingLabel={form.driverPhotoUrl ? 'Current photo saved' : 'No photo uploaded'}
                selectedLabel={files.driverPhoto?.name}
              >
                <input
                  style={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={event => setSingleFile('driverPhoto', event.target.files?.[0])}
                />
              </FileField>

              <FileField
                label="Aadhaar Photo"
                existingLabel={form.aadhaarPhotoUrl ? 'Current photo saved' : 'No photo uploaded'}
                selectedLabel={files.aadhaarPhoto?.name}
              >
                <input
                  style={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={event => setSingleFile('aadhaarPhoto', event.target.files?.[0])}
                />
              </FileField>

              <FileField
                label="DL Photo"
                existingLabel={form.dlPhotoUrl ? 'Current photo saved' : 'No photo uploaded'}
                selectedLabel={files.dlPhoto?.name}
              >
                <input
                  style={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={event => setSingleFile('dlPhoto', event.target.files?.[0])}
                />
              </FileField>

              <FileField
                label="PAN Photo"
                existingLabel={form.panPhotoUrl ? 'Current photo saved' : 'No photo uploaded'}
                selectedLabel={files.panPhoto?.name}
              >
                <input
                  style={styles.fileInput}
                  type="file"
                  accept="image/*"
                  onChange={event => setSingleFile('panPhoto', event.target.files?.[0])}
                />
              </FileField>
            </Grid>

            <FileField
              label="Car Photos"
              existingLabel={
                form.carPhotoUrls?.length
                  ? `${form.carPhotoUrls.length} photo(s) saved`
                  : 'No car photos uploaded'
              }
              selectedLabel={
                files.carPhotos.length
                  ? `${files.carPhotos.length} new photo(s) selected`
                  : ''
              }
            >
              <input
                style={styles.fileInput}
                type="file"
                accept="image/*"
                multiple
                onChange={event => setMultipleFiles(event.target.files)}
              />
            </FileField>
          </Section>

          <div style={styles.formActions}>
            <button type="button" style={styles.secondaryButton} onClick={resetForm}>
              Cancel
            </button>
            <button style={styles.primaryButton} disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Save Driver' : 'Create Driver'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.list}>
        {drivers.length === 0 && <div style={styles.empty}>No drivers added yet.</div>}

        {drivers.map(driver => (
          <div key={driver.id} style={styles.card}>
            {/* Basic Details Header */}
            <div style={styles.cardTop}>
              <div style={styles.basicInfo}>
                <div style={styles.name}>{driver.name}</div>
                <div style={styles.sub}>
                  {driver.mobile || 'No mobile'}
                </div>
                {driver.carNo && (
                  <div style={styles.sub}>
                    {driver.carNo}
                  </div>
                )}
                {driver.email && (
                  <div style={styles.sub}>
                    {driver.email}
                  </div>
                )}
                {/* ADDED — availability indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.35rem' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: driver.isAvailable ? '#16a34a' : '#94a3b8',
                    display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: driver.isAvailable ? '#16a34a' : '#94a3b8' }}>
                    {driver.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              <div style={styles.cardActionGroup}>
                <div style={styles.cardActions}>
                  <button style={styles.iconButtonBlue} onClick={() => startEdit(driver)} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button style={styles.iconButtonRed} onClick={() => handleDelete(driver)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  style={styles.expandButton}
                  onClick={() => setExpandedDriverId(expandedDriverId === driver.id ? null : driver.id)}
                  title={expandedDriverId === driver.id ? 'Hide details' : 'View full details'}
                >
                  {expandedDriverId === driver.id ? (
                    <>
                      <ChevronUp size={16} /> Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} /> See Full Details
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Full Details */}
            {expandedDriverId === driver.id && (
              <div style={styles.expandedDetails}>
                <div style={styles.detailGridExpanded}>
                  <Detail label="Alternate Mobile" value={driver.alternateMobile} />
                  <Detail label="Birthday" value={driver.birthday} />
                  <Detail label="Address" value={driver.address} />
                  <Detail label="Car Number" value={driver.carNo} />
                  <Detail label="Vehicle Model" value={driver.vehicleModel} />
                  <Detail label="Vehicle Type" value={driver.vehicleType} />
                  <Detail label="Aadhaar No" value={driver.aadhaarNo} />
                  <Detail label="DL No" value={driver.dlNo} />
                  <Detail label="PAN No" value={driver.panNo} />
                  <Detail label="Emergency Contact Name 1" value={driver.emergencyContact} />
                  <Detail label="Emergency Phone number 1" value={driver.emergencyPhone} />
                  <Detail label="Notes" value={driver.notes} />
                </div>

                {/* Photo Sections */}
                <div style={styles.photoSections}>
                  <PhotoStrip title="Driver Photo" urls={driver.driverPhotoUrl ? [driver.driverPhotoUrl] : []} />
                  <PhotoStrip title="Aadhaar" urls={driver.aadhaarPhotoUrl ? [driver.aadhaarPhotoUrl] : []} />
                  <PhotoStrip title="Driving Licence" urls={driver.dlPhotoUrl ? [driver.dlPhotoUrl] : []} />
                  <PhotoStrip title="PAN" urls={driver.panPhotoUrl ? [driver.panPhotoUrl] : []} />
                  <PhotoStrip title="Car Photos" urls={driver.carPhotoUrls || []} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  )
}

function Grid({ children }) {
  return <div style={styles.grid}>{children}</div>
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={styles.label}>
        {label}
        {required ? <span style={styles.required}> *</span> : null}
      </label>
      {children}
    </div>
  )
}

function FileField({ label, existingLabel, selectedLabel, children }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      {children}
      <div style={styles.fileMeta}>
        <div>{selectedLabel || existingLabel}</div>
      </div>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>{value || '-'}</div>
    </div>
  )
}

function PhotoStrip({ title, urls }) {
  const [resolvedUrls, setResolvedUrls] = useState([])
  const urlKey = JSON.stringify(urls.filter(Boolean))
  const hasReferences = urlKey !== '[]'

  useEffect(() => {
    const references = JSON.parse(urlKey)
    let cancelled = false

    if (!references.length) {
      return undefined
    }

    resolveDriverFileUrls(references)
      .then(nextUrls => {
        if (!cancelled) {
          setResolvedUrls(nextUrls)
        }
      })
      .catch(error => {
        console.warn(`Could not resolve ${title} files:`, error.message)
        if (!cancelled) {
          setResolvedUrls(references.filter(reference => /^https?:\/\//i.test(reference)))
        }
      })

    return () => {
      cancelled = true
    }
  }, [title, urlKey])

  if (!hasReferences) return null
  if (!resolvedUrls.length) return null

  return (
    <div style={styles.photoBlock}>
      <div style={styles.photoTitle}>{title}</div>
      <div style={styles.photoGrid}>
        {resolvedUrls.map((url, index) => (
          <a key={`${title}-${index}`} href={url} target="_blank" rel="noreferrer" style={styles.photoLink}>
            <img src={url} alt={`${title} ${index + 1}`} style={styles.photo} />
          </a>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: '980px', margin: '0 auto', padding: '1.5rem' },
 header: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
},
  headerCopy: { flex: 1, minWidth: '220px' },
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
  title: { fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.25rem' },
  subtitle: { color: '#64748b', fontSize: '0.92rem' },
  formCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1rem',
  },
  formTitle: { fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem' },
  formSubtitle: { color: '#64748b', fontSize: '0.88rem' },
  section: { marginBottom: '1.5rem' },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.75rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.82rem',
    color: '#64748b',
    fontWeight: '600',
    marginBottom: '0.35rem',
  },
  required: { color: '#dc2626' },
  input: {
    width: '100%',
    padding: '0.72rem 0.92rem',
    border: '1.5px solid #dbe2f1',
    borderRadius: '10px',
    fontSize: '0.95rem',
    outline: 'none',
    background: '#fff',
  },
  textarea: {
    width: '100%',
    minHeight: '96px',
    padding: '0.72rem 0.92rem',
    border: '1.5px solid #dbe2f1',
    borderRadius: '10px',
    fontSize: '0.95rem',
    outline: 'none',
    resize: 'vertical',
    background: '#fff',
  },
  fileInput: {
    width: '100%',
    padding: '0.62rem 0.8rem',
    border: '1.5px solid #dbe2f1',
    borderRadius: '10px',
    background: '#fff',
  },
  uploadHint: {
    color: '#64748b',
    fontSize: '0.85rem',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  fileMeta: { marginTop: '0.45rem', color: '#64748b', fontSize: '0.82rem' },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  primaryButton: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.7rem 1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  secondaryButton: {
    background: '#fff',
    color: '#475569',
    border: '1.5px solid #dbe2f1',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  empty: {
    textAlign: 'center',
    padding: '2rem 1.5rem',
    background: '#f8fafc',
    borderRadius: '12px',
    color: '#64748b',
    fontSize: '0.95rem',
    border: '1px solid #e2e8f0',
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.25rem',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0rem',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  basicInfo: {
    flex: 1,
    minWidth: '200px',
  },
  cardActionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'flex-end',
  },
  cardActions: { display: 'flex', gap: '0.5rem' },
  expandButton: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.6rem 0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  expandedDetails: {
    marginTop: '1.25rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #e2e8f0',
  },
  detailGridExpanded: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  photoSections: {
    marginTop: '1.25rem',
  },
  name: { fontWeight: '700', fontSize: '1rem', color: '#0f172a' },
  sub: { color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  detailItem: {
    padding: '0.85rem',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  detailLabel: { color: '#64748b', fontSize: '0.78rem', fontWeight: '600', marginBottom: '0.3rem' },
  detailValue: { color: '#0f172a', fontSize: '0.92rem', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  addressBlock: {
    padding: '0.85rem',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    marginBottom: '0.75rem',
  },
  photoBlock: { marginTop: '0.9rem' },
  photoTitle: { fontWeight: '600', color: '#334155', marginBottom: '0.5rem' },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem',
  },
  photoLink: {
    display: 'block',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    background: '#fff',
  },
  photo: { 
  width: '100%', 
  height: '120px', 
  objectFit: 'contain', 
  display: 'block',
  background: '#f1f5f9'

  },
  iconButton: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonBlue: {
    background: '#dbeafe',
    border: 'none',
    borderRadius: '10px',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#2563eb',
  },
  iconButtonRed: {
    background: '#fee2e2',
    border: 'none',
    borderRadius: '10px',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#dc2626',
  },
}
