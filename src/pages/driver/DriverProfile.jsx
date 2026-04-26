import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import DriverBottomNav from '../../components/DriverBottomNav'
import { LogOut, User, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { resolveDriverFileUrls } from '../../utils/driverUploadService'

export default function DriverProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    console.log("Fetching driver profile for:", user.email)
    const q = query(collection(db, 'drivers'), where('email', '==', user.email))
    const unsub = onSnapshot(q, snap => {
      setLoading(false)
      if (!snap.empty) {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() }
        console.log("Driver data loaded:", data)
        setDriver(data)
      } else {
        console.log("No driver document found for email:", user.email)
        setDriver(null)
      }
    })
    return () => unsub()
  }, [user])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  if (loading) return <div style={styles.loading}>Loading profile...</div>
  if (!driver) return (
    <div style={styles.errorPage}>
      <XCircle size={48} color="#ef4444" />
      <h3>Profile Not Found</h3>
      <p>Could not find a driver record for <b>{user?.email}</b>.</p>
      <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      <DriverBottomNav />
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.avatar}>
          <User size={32} color="#2563eb" />
        </div>
        <h2 style={styles.title}>{driver.name}</h2>
        <p style={styles.subtitle}>{driver.email}</p>
      </div>

      <div style={styles.content}>
        <Section title="Basic Details">
          <Row label="Full Name" value={driver.name} />
          <Row label="Mobile Number" value={driver.mobile} />
          <Row label="Alternate Mobile" value={driver.alternateMobile} />
          <Row label="Date of Birth" value={driver.birthday} />
          <Row label="Login Email" value={driver.email} />
          <Row label="Address" value={driver.address} />
        </Section>

        <Section title="Identity & Vehicle Information">
          <Row label="Aadhaar Number" value={driver.aadhaarNo} />
          <Row label="Driving Licence No" value={driver.dlNo} />
          <Row label="PAN Number" value={driver.panNo} />
          <Row label="Car Registration No" value={driver.carRegNo || driver.carNo} />
          <Row label="Vehicle Type" value={driver.vehicleType} />
          <Row label="Vehicle Model" value={driver.vehicleModel} />
          <Row label="Car Color" value={driver.carColor} />
        </Section>

        <Section title="Emergency Contact Details">
          <Row label="Emergency Contact Name 1" value={driver.emergencyContact} />
          <Row label="Emergency Phone 1" value={driver.emergencyPhone} />
          <Row label="Emergency Contact Name 2" value={driver.emergencyContact2} />
          <Row label="Emergency Phone 2" value={driver.emergencyPhone2} />
        </Section>

        <Section title="Additional Notes">
          <Row label="Notes / Remarks" value={driver.notes} />
        </Section>

        <div style={styles.sectionCard}>
          <h3 style={styles.sectionTitle}>Document Uploads</h3>
          <div style={styles.photoGrid}>
            <PhotoBlock title="Driver Photo" urls={driver.driverPhotoUrl ? [driver.driverPhotoUrl] : []} />
            <PhotoBlock title="Aadhaar Card" urls={driver.aadhaarPhotoUrl ? [driver.aadhaarPhotoUrl] : []} />
            <PhotoBlock title="Driving Licence" urls={driver.dlPhotoUrl ? [driver.dlPhotoUrl] : []} />
            <PhotoBlock title="PAN Card" urls={driver.panPhotoUrl ? [driver.panPhotoUrl] : []} />
            <PhotoBlock title="Car Photos" urls={driver.carPhotoUrls || []} />
          </div>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </div>

      <DriverBottomNav />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={styles.sectionCard}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <div style={styles.sectionBody}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value || '-'}</span>
    </div>
  )
}

function PhotoBlock({ title, urls }) {
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
    console.log(`Resolving photos for ${title}:`, refs)
    
    resolveDriverFileUrls(refs)
      .then(next => {
        if (!cancelled) {
          console.log(`Resolved ${title}:`, next)
          setResolvedUrls(next)
          setResolving(false)
        }
      })
      .catch(err => {
        console.error(`Error resolving ${title}:`, err)
        if (!cancelled) {
          setResolving(false)
        }
      })
    return () => { cancelled = true }
  }, [urlKey, title])

  return (
    <div style={styles.photoBlock}>
      <div style={styles.photoLabel}>{title}</div>
      <div style={styles.photoContainer}>
        {!hasRefs ? (
          <div style={styles.noPhoto}>
            <ImageIcon size={20} />
            <span>Not Uploaded</span>
          </div>
        ) : resolving ? (
          <div style={styles.noPhoto}>Loading...</div>
        ) : resolvedUrls.length === 0 ? (
          <div style={{...styles.noPhoto, color: '#ef4444', borderColor: '#fecaca'}}>
            <XCircle size={20} />
            <span>Load Error</span>
          </div>
        ) : (
          resolvedUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" style={styles.photoLink}>
              <img 
                src={url} 
                alt={`${title} ${i + 1}`} 
                style={styles.photo} 
                onError={(e) => {
                  console.error("Image load failed:", url)
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<div style="padding: 10px; font-size: 10px; color: red;">Failed to load</div>'
                }}
              />
            </a>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { backgroundColor: '#f5f6fa', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' },
  loading: { padding: '2rem', textAlign: 'center', color: '#64748b' },
  errorPage: { padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  header: { background: '#fff', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  avatar: { width: '72px', height: '72px', borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' },
  title: { margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#1a1a2e' },
  subtitle: { margin: 0, color: '#64748b', fontSize: '0.95rem', marginTop: '0.3rem' },
  content: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  sectionCard: { background: '#fff', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  sectionTitle: { margin: '0 0 1rem 0', color: '#2563eb', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' },
  sectionBody: { display: 'flex', flexDirection: 'column' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
  label: { color: '#64748b', fontSize: '0.9rem', fontWeight: '500' },
  value: { fontWeight: '600', fontSize: '0.95rem', color: '#0f172a', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' },
  photoBlock: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  photoLabel: { color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' },
  photoContainer: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  photoLink: { display: 'block', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', width: '100%', background: '#f8fafc' },
  photo: { width: '100%', height: '120px', objectFit: 'cover', transition: 'transform 0.2s' },
  noPhoto: { width: '100%', height: '120px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem', gap: '4px' },
  logoutBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '1rem', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
}
