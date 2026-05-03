import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import {
  User, Phone, Mail, Calendar, MapPin, Car, FileText,
  CreditCard, Palette, CheckCircle, XCircle,
  Star, ClipboardList, Edit3, Shield, UserCheck, StickyNote,
  PhoneCall, Hash, Camera, IdCard, X
} from 'lucide-react'
import { resolveDriverFileUrls } from '../../utils/driverUploadService'

export default function DriverProfile() {
  const { user } = useAuth()
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tripCount, setTripCount] = useState(0)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editData, setEditData] = useState({})
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'drivers'), where('email', '==', user.email))
    const unsub = onSnapshot(q, snap => {
      setLoading(false)
      if (!snap.empty) {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() }
        setDriver(data)
        setEditData(data)

        const tripsQ = query(
          collection(db, 'bookings'),
          where('assignedDriverId', '==', data.id),
          where('tripStatus', '==', 'completed')
        )
        onSnapshot(tripsQ, tSnap => {
          setTripCount(tSnap.docs.length)
        })
      } else {
        setDriver(null)
      }
    })
    return () => unsub()
  }, [user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'drivers', driver.id), {
        ...editData,
        updatedAt: new Date()
      })
      setIsEditModalOpen(false)
    } catch (error) {
      alert("Failed to update profile: " + error.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div style={styles.loadingPage}>
      <div style={styles.loadingSpinner} />
      <p style={{ color: 'var(--text-tertiary)', marginTop: '1rem' }}>Loading profile...</p>
    </div>
  )

  if (!driver) return (
    <div style={styles.errorPage}>
      <XCircle size={48} color="var(--danger)" />
      <h3>Profile Not Found</h3>
      <p>Could not find a driver record for <b>{user?.email}</b>.</p>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.headerCard}>
        <div style={styles.headerTop}>
          <div style={styles.avatarRow}>
            <div style={styles.avatarOuter}>
              <div style={styles.avatar}>
                {driver.driverPhotoUrl ? (
                  <DocImage url={driver.driverPhotoUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <User size={36} color="var(--primary)" strokeWidth={1.5} />
                )}
              </div>
              <div style={styles.onlineDot} />
            </div>
            <div style={styles.nameBlock}>
              <h2 style={styles.driverName}>{driver.name}</h2>
              <p style={styles.driverEmail}>{driver.email}</p>
              <span style={{
                ...styles.statusBadge,
                background: driver.isAvailable ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                color: driver.isAvailable ? 'var(--success)' : 'var(--danger)',
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: driver.isAvailable ? 'var(--success)' : 'var(--danger)',
                  display: 'inline-block',
                }} />
                {driver.isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
          </div>
          <button style={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>
            <Edit3 size={14} />
            Edit Profile
          </button>
        </div>

        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <div style={{...styles.statIcon, background: 'var(--primary-subtle)'}}>
              <ClipboardList size={18} color="var(--primary)" />
            </div>
            <div>
              <div style={styles.statValue}>{tripCount}</div>
              <div style={styles.statLabel}>Trips Completed</div>
            </div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <div style={{...styles.statIcon, background: 'var(--warning-subtle)'}}>
              <Star size={18} color="var(--warning)" />
            </div>
            <div>
              <div style={styles.statValue}>{driver.rating || '4.8'}</div>
              <div style={styles.statLabel}>Rating</div>
            </div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <div style={{...styles.statIcon, background: '#ecfdf5'}}>
              <Car size={18} color="var(--success)" />
            </div>
            <div>
              <div style={{...styles.statValue, color: 'var(--success)'}}>{driver.vehicleModel || '-'}</div>
              <div style={styles.statLabel}>Vehicle</div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.sectionCard} className="card-hover">
          <SectionHeader icon={<User size={18} />} title="Basic Details" />
          <div style={styles.detailGrid}>
            <DetailItem icon={<Phone size={15} />} label="Mobile Number" value={driver.mobile} />
            <DetailItem icon={<Phone size={15} />} label="Alternate Mobile" value={driver.alternateMobile} />
            <DetailItem icon={<Calendar size={15} />} label="Date of Birth" value={driver.birthday} />
            <DetailItem icon={<Mail size={15} />} label="Login Email" value={driver.email} />
            <DetailItem icon={<MapPin size={15} />} label="Address" value={driver.address} full />
          </div>
        </div>

        <div style={styles.sectionCard} className="card-hover">
          <SectionHeader icon={<Car size={18} />} title="Vehicle Details" />
          <div style={styles.detailGrid}>
            <DetailItem icon={<FileText size={15} />} label="Driving Licence No" value={driver.dlNo} />
            <DetailItem icon={<CreditCard size={15} />} label="PAN Number" value={driver.panNo} />
            <DetailItem icon={<Hash size={15} />} label="Car Registration No" value={driver.carRegNo || driver.carNo} />
            <DetailItem icon={<Car size={15} />} label="Vehicle Type" value={driver.vehicleType} />
            <DetailItem icon={<Car size={15} />} label="Vehicle Model" value={driver.vehicleModel} />
            <DetailItem icon={<Palette size={15} />} label="Car Color" value={driver.carColor} />
          </div>
        </div>

        <div style={styles.sectionCard} className="card-hover">
          <SectionHeader icon={<FileText size={18} />} title="Documents" />
          <div style={styles.docsGrid}>
            <DocCard
              icon={<UserCheck size={22} color="var(--primary)" />}
              title="Driver Photo"
              urls={driver.driverPhotoUrl ? [driver.driverPhotoUrl] : []}
            />
            <DocCard
              icon={<IdCard size={22} color="var(--primary)" />}
              title="Aadhaar Card"
              urls={driver.aadhaarPhotoUrl ? [driver.aadhaarPhotoUrl] : []}
            />
            <DocCard
              icon={<Shield size={22} color="var(--danger)" />}
              title="Driving Licence"
              urls={driver.dlPhotoUrl ? [driver.dlPhotoUrl] : []}
            />
            <DocCard
              icon={<CreditCard size={22} color="var(--primary)" />}
              title="PAN Card"
              urls={driver.panPhotoUrl ? [driver.panPhotoUrl] : []}
            />
            <DocCard
              icon={<Camera size={22} color="var(--primary)" />}
              title="Car Photos"
              urls={driver.carPhotoUrls || []}
            />
          </div>
        </div>

        <div style={styles.sectionCard} className="card-hover">
          <SectionHeader icon={<PhoneCall size={18} />} title="Emergency Contact" />
          <div style={styles.contactList}>
            {driver.emergencyContact && (
              <div style={styles.contactRow}>
                <div style={styles.contactLeft}>
                  <div style={styles.contactAvatar}>
                    <User size={16} color="var(--text-tertiary)" />
                  </div>
                  <span style={styles.contactName}>{driver.emergencyContact}</span>
                </div>
                <div style={styles.contactRight}>
                  <Phone size={14} color="var(--primary)" />
                  <span style={styles.contactPhone}>{driver.emergencyPhone || '-'}</span>
                </div>
              </div>
            )}
            {driver.emergencyContact2 && (
              <div style={styles.contactRow}>
                <div style={styles.contactLeft}>
                  <div style={styles.contactAvatar}>
                    <User size={16} color="var(--text-tertiary)" />
                  </div>
                  <span style={styles.contactName}>{driver.emergencyContact2}</span>
                </div>
                <div style={styles.contactRight}>
                  <Phone size={14} color="var(--primary)" />
                  <span style={styles.contactPhone}>{driver.emergencyPhone2 || '-'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsEditModalOpen(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Update Driver Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateProfile} style={styles.editForm}>
              <div style={styles.scrollArea}>
                {/* Basic Info */}
                <SectionHeader icon={<User size={18} />} title="Basic Information" />
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name</label>
                  <div style={styles.inputWrapper}>
                    <User style={styles.inputIcon} size={16} />
                    <input type="text" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} style={styles.input} required placeholder="Enter full name" />
                  </div>
                </div>

                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Mobile Number</label>
                    <div style={styles.inputWrapper}>
                      <Phone style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.mobile || ''} onChange={e => setEditData({...editData, mobile: e.target.value})} style={styles.input} required placeholder="+91..." />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Alt Mobile</label>
                    <div style={styles.inputWrapper}>
                      <Phone style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.alternateMobile || ''} onChange={e => setEditData({...editData, alternateMobile: e.target.value})} style={styles.input} placeholder="+91..." />
                    </div>
                  </div>
                </div>

                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Date of Birth</label>
                    <div style={styles.inputWrapper}>
                      <Calendar style={styles.inputIcon} size={16} />
                      <input type="date" value={editData.birthday || ''} onChange={e => setEditData({...editData, birthday: e.target.value})} style={styles.input} />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Login Email (Read Only)</label>
                    <div style={styles.inputWrapper}>
                      <Mail style={styles.inputIcon} size={16} />
                      <input type="email" value={editData.email || ''} style={{...styles.input, opacity: 0.7, cursor: 'not-allowed'}} readOnly />
                    </div>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Address</label>
                  <div style={styles.inputWrapper}>
                    <MapPin style={{...styles.inputIcon, top: '1.25rem'}} size={16} />
                    <textarea value={editData.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} style={styles.textarea} placeholder="Enter full address..." />
                  </div>
                </div>

                {/* Vehicle Info */}
                <div style={{ marginTop: '2.5rem' }}>
                  <SectionHeader icon={<Car size={18} />} title="Vehicle & Identity" />
                </div>
                
                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>DL Number</label>
                    <div style={styles.inputWrapper}>
                      <FileText style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.dlNo || ''} onChange={e => setEditData({...editData, dlNo: e.target.value})} style={styles.input} placeholder="Licence Number" />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>PAN Number</label>
                    <div style={styles.inputWrapper}>
                      <CreditCard style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.panNo || ''} onChange={e => setEditData({...editData, panNo: e.target.value})} style={styles.input} placeholder="PAN Number" />
                    </div>
                  </div>
                </div>

                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Car Registration No</label>
                    <div style={styles.inputWrapper}>
                      <Hash style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.carRegNo || editData.carNo || ''} onChange={e => setEditData({...editData, carRegNo: e.target.value})} style={styles.input} placeholder="GJ..." />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Vehicle Type</label>
                    <div style={styles.inputWrapper}>
                      <Car style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.vehicleType || ''} onChange={e => setEditData({...editData, vehicleType: e.target.value})} style={styles.input} placeholder="e.g. Sedan" />
                    </div>
                  </div>
                </div>

                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Vehicle Model</label>
                    <div style={styles.inputWrapper}>
                      <Car style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.vehicleModel || ''} onChange={e => setEditData({...editData, vehicleModel: e.target.value})} style={styles.input} placeholder="e.g. Maruti Ertiga" />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Car Color</label>
                    <div style={styles.inputWrapper}>
                      <Palette style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.carColor || ''} onChange={e => setEditData({...editData, carColor: e.target.value})} style={styles.input} placeholder="e.g. White" />
                    </div>
                  </div>
                </div>

                {/* Emergency Info */}
                <div style={{ marginTop: '2.5rem' }}>
                  <SectionHeader icon={<PhoneCall size={18} />} title="Emergency Contacts" />
                </div>
                
                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Primary Contact Name</label>
                    <div style={styles.inputWrapper}>
                      <UserCheck style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.emergencyContact || ''} onChange={e => setEditData({...editData, emergencyContact: e.target.value})} style={styles.input} />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Primary Phone</label>
                    <div style={styles.inputWrapper}>
                      <PhoneCall style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.emergencyPhone || ''} onChange={e => setEditData({...editData, emergencyPhone: e.target.value})} style={styles.input} />
                    </div>
                  </div>
                </div>

                <div style={styles.inputRow}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Secondary Contact Name</label>
                    <div style={styles.inputWrapper}>
                      <UserCheck style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.emergencyContact2 || ''} onChange={e => setEditData({...editData, emergencyContact2: e.target.value})} style={styles.input} />
                    </div>
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Secondary Phone</label>
                    <div style={styles.inputWrapper}>
                      <PhoneCall style={styles.inputIcon} size={16} />
                      <input type="text" value={editData.emergencyPhone2 || ''} onChange={e => setEditData({...editData, emergencyPhone2: e.target.value})} style={styles.input} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={styles.cancelBtn}>
                  Discard Changes
                </button>
                <button type="submit" disabled={updating} style={styles.saveBtn}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon, title }) {
  return (
    <div style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>{icon}</span>
      <h3 style={styles.sectionTitle}>{title}</h3>
    </div>
  )
}

function DetailItem({ icon, label, value, full }) {
  return (
    <div style={{
      ...styles.detailItem,
      ...(full ? { gridColumn: '1 / -1' } : {}),
    }}>
      <div style={styles.detailLabelRow}>
        <span style={styles.detailIcon}>{icon}</span>
        <span style={styles.detailLabel}>{label}</span>
      </div>
      <div style={styles.detailValue}>{value || '-'}</div>
    </div>
  )
}

function DocImage({ url, style }) {
  const [resolved, setResolved] = useState(null)
  useEffect(() => {
    if (!url) return
    resolveDriverFileUrls([url]).then(urls => setResolved(urls[0]))
  }, [url])
  if (!resolved) return <div style={{...style, background: 'var(--bg-page)'}} />
  return <img src={resolved} alt="Doc" style={style} />
}

function DocCard({ icon, title, urls }) {
  const [resolvedUrls, setResolvedUrls] = useState([])
  const [resolving, setResolving] = useState(false)
  const urlKey = JSON.stringify(urls.filter(Boolean))
  const hasRefs = urlKey !== '[]'

  useEffect(() => {
    const refs = JSON.parse(urlKey)
    if (!refs.length) {
      setResolvedUrls([])
      return
    }

    let cancelled = false
    setResolving(true)

    resolveDriverFileUrls(refs)
      .then(next => {
        if (!cancelled) {
          setResolvedUrls(next)
          setResolving(false)
        }
      })
      .catch(() => {
        if (!cancelled) setResolving(false)
      })
    return () => { cancelled = true }
  }, [urlKey])

  const uploaded = hasRefs && !resolving && resolvedUrls.length > 0
  const loading = hasRefs && resolving
  const notUploaded = !hasRefs

  return (
    <div
      style={styles.docCard}
      className="card-hover"
      onClick={() => {
        if (uploaded && resolvedUrls[0]) window.open(resolvedUrls[0], '_blank')
      }}
    >
      <div style={styles.docIconWrap}>
        {uploaded ? (
          <img src={resolvedUrls[0]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
        ) : icon}
      </div>
      <div style={styles.docTitle}>{title}</div>
      <div style={styles.docStatus}>
        {uploaded && (
          <>
            <CheckCircle size={13} color="var(--success)" />
            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.7rem' }}>Uploaded</span>
          </>
        )}
        {loading && (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>Loading...</span>
        )}
        {notUploaded && (
          <>
            <XCircle size={13} color="var(--text-tertiary)" />
            <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.7rem' }}>Not Uploaded</span>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '0 0 2rem 0', backgroundColor: 'transparent' },
  loadingPage: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' },
  loadingSpinner: { width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorPage: { padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  headerCard: { background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', marginBottom: '2rem' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: '1.5rem' },
  avatarOuter: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-subtle) 0%, var(--bg-page) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--bg-card)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' },
  onlineDot: { position: 'absolute', bottom: 4, left: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--success)', border: '3px solid var(--bg-card)' },
  nameBlock: { display: 'flex', flexDirection: 'column', gap: '4px' },
  driverName: { margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' },
  driverEmail: { margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600, marginTop: '8px', width: 'fit-content' },
  editBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '10px 16px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' },
  statsRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-around', background: 'var(--bg-page)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' },
  statItem: { display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.1 },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 },
  statDivider: { width: 1, height: 40, background: 'var(--border)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' },
  sectionCard: { background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', transition: 'all 0.3s ease' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' },
  sectionIcon: { color: 'var(--primary)' },
  sectionTitle: { margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  detailItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0.5rem', borderBottom: '1px solid var(--border-light)' },
  detailLabelRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  detailIcon: { color: 'var(--text-tertiary)' },
  detailLabel: { color: 'var(--text-tertiary)', fontSize: '0.85rem' },
  detailValue: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' },
  docsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' },
  docCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 1rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', cursor: 'pointer', transition: 'all 0.2s ease' },
  docIconWrap: { width: 48, height: 48, borderRadius: '12px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  docTitle: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' },
  docStatus: { display: 'flex', alignItems: 'center', gap: '4px' },
  contactList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  contactRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0.5rem', borderBottom: '1px solid var(--border-light)' },
  contactLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  contactAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  contactName: { fontWeight: 600, color: 'var(--text-primary)' },
  contactRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  contactPhone: { fontWeight: 600, color: 'var(--primary)' },
  modalOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    background: 'rgba(2, 6, 23, 0.7)', 
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 1000, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '1rem'
  },
  modalContent: { 
    background: 'var(--bg-card)', 
    borderRadius: '24px', 
    width: '100%', 
    maxWidth: '750px', 
    maxHeight: '90vh', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
    display: 'flex', 
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid var(--border)'
  },
  modalHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '1.5rem 2rem', 
    borderBottom: '1px solid var(--border-light)', 
    background: 'var(--bg-card)',
    flexShrink: 0 
  },
  modalTitle: { 
    margin: 0, 
    fontSize: '1.25rem', 
    fontWeight: 800, 
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em'
  },
  closeBtn: { 
    background: 'var(--bg-page)', 
    border: '1px solid var(--border-light)', 
    cursor: 'pointer', 
    color: 'var(--text-tertiary)',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  scrollArea: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '2rem',
    scrollBehavior: 'smooth'
  },
  editForm: { display: 'flex', flexDirection: 'column', height: '100%' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
    zIndex: 1
  },
  inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  label: { fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.025em' },
  input: { 
    padding: '0.875rem 1rem 0.875rem 2.75rem', 
    borderRadius: '12px', 
    border: '1px solid var(--border)', 
    fontSize: '0.95rem', 
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s',
    background: 'var(--bg-page)',
    color: 'var(--text-primary)',
    fontWeight: 500
  },
  textarea: {
    padding: '0.875rem 1rem 0.875rem 2.75rem', 
    borderRadius: '12px', 
    border: '1px solid var(--border)', 
    fontSize: '0.95rem', 
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s',
    background: 'var(--bg-page)',
    height: '100px',
    resize: 'none',
    color: 'var(--text-primary)',
    fontWeight: 500
  },
  modalFooter: {
    padding: '1.5rem 2rem',
    borderTop: '1px solid var(--border-light)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    background: 'var(--bg-card)'
  },
  cancelBtn: {
    padding: '0.875rem 1.5rem',
    background: 'var(--bg-page)',
    color: 'var(--text-secondary)',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '0.9375rem',
    border: 'none'
  },
  saveBtn: { 
    padding: '0.875rem 2rem', 
    background: 'var(--primary)', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 700, 
    fontSize: '0.9375rem', 
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
  }
}


