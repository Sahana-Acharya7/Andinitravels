import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react'
import { db } from '../../firebase'
import { useNavigate } from 'react-router-dom'

const EMPTY_CUSTOMER = {
  name: '',
  mobile: '',
  address: '',
  email: '',
  birthday: '',
}

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_CUSTOMER)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    return onSnapshot(collection(db, 'customers'), snapshot => {
      const nextCustomers = snapshot.docs
        .map(document => ({ id: document.id, ...document.data() }))
        .sort((left, right) => left.name.localeCompare(right.name))

      setCustomers(nextCustomers)
    })
  }, [])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return customers

    return customers.filter(customer =>
      [customer.name, customer.mobile, customer.email]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query)),
    )
  }, [customers, search])

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }))

  const resetForm = () => {
    setForm(EMPTY_CUSTOMER)
    setShowForm(false)
    setEditingId(null)
    setLoading(false)
  }

  const handleSubmit = async event => {
    event.preventDefault()
    setLoading(true)

    const payload = {
      ...form,
      mobile: form.mobile.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      updatedAt: serverTimestamp(),
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'customers', editingId), payload)
      } else {
        await addDoc(collection(db, 'customers'), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      }

      resetForm()
    } catch (error) {
      alert(error.message)
      setLoading(false)
    }
  }

  const startCreate = () => {
    setForm(EMPTY_CUSTOMER)
    setEditingId(null)
    setShowForm(true)
  }

  const startEdit = customer => {
    setForm({
      name: customer.name || '',
      mobile: customer.mobile || '',
      address: customer.address || '',
      email: customer.email || '',
      birthday: customer.birthday || '',
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = async customer => {
    if (!window.confirm(`Delete passenger ${customer.name}?`)) return

    await deleteDoc(doc(db, 'customers', customer.id))
  }

  return (
   <div style={styles.page}>
  <div style={styles.header}>
    <div style={styles.headerCopy}>
      <h2 style={styles.title}>Passengers</h2>
      <p style={styles.subtitle}>Store passengers once and reuse them for bookings.</p>
    </div>
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <button style={styles.primaryButton} onClick={startCreate}>
        <Plus size={16} /> New Passenger
      </button>
      <button style={styles.back} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back
      </button>
    </div>
  </div>

  <div style={styles.toolbar}>
    <input
      style={styles.search}
      placeholder="Search by passenger name, mobile, or email"
      value={search}
      onChange={event => setSearch(event.target.value)}
    />
    <span style={styles.count}>{filteredCustomers.length} passengers</span>
  </div>

  {showForm && (
    <form style={styles.formCard} onSubmit={handleSubmit}>
      <div style={styles.formHeader}>
        <div>
          <h3 style={styles.formTitle}>{editingId ? 'Edit Passenger' : 'New Passenger'}</h3>
          <p style={styles.formSubtitle}>These details will be available in the booking dropdown.</p>
        </div>
        <button type="button" style={styles.iconButton} onClick={resetForm}>
          <X size={18} />
        </button>
      </div>

      <div style={styles.grid}>
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
            <Field label="Email">
              <input
                style={styles.input}
                type="email"
                value={form.email}
                onChange={event => set('email', event.target.value)}
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
          </div>

          <Field label="Address">
            <textarea
              style={{ ...styles.input, minHeight: '96px', resize: 'vertical' }}
              value={form.address}
              onChange={event => set('address', event.target.value)}
            />
          </Field>

          <div style={styles.formActions}>
            <button type="button" style={styles.secondaryButton} onClick={resetForm}>
              Cancel
            </button>
            <button style={styles.primaryButton} disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Save Passenger' : 'Create Passenger'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.list}>
        {filteredCustomers.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>No passengers yet</div>
            <div style={styles.emptySub}>Add a passenger to reuse their details in new bookings.</div>
          </div>
        )}

        {filteredCustomers.map(customer => (
          <div key={customer.id} style={styles.card}>
            <div style={styles.avatar}>{customer.name?.[0]?.toUpperCase() || '?'}</div>
            <div style={styles.cardBody}>
              <div style={styles.cardTop}>
                <div style={styles.name}>{customer.name}</div>
                <div style={styles.cardActions}>
                  <button style={styles.iconButtonBlue} onClick={() => startEdit(customer)}>
                    <Pencil size={16} />
                  </button>
                  <button style={styles.iconButtonRed} onClick={() => handleDelete(customer)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={styles.sub}>{customer.mobile || 'No mobile added'}</div>
              <div style={styles.sub}>{customer.email || 'No email added'}</div>
              <div style={styles.sub}>{customer.address || 'No address added'}</div>
              <div style={styles.sub}>Birthday: {customer.birthday || 'Not set'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={styles.label}>
        {label}
        {required ? <span style={styles.required}> *</span> : null}
      </label>
      {children}
    </div>
  )
}

const styles = {
  page: { maxWidth: '860px', margin: '0 auto', padding: '1.5rem' },
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
  title: { fontSize: '1.45rem', fontWeight: '700', marginBottom: '0.25rem' },
  subtitle: { color: '#6b7280', fontSize: '0.92rem' },
  toolbar: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  search: {
    flex: 1,
    minWidth: '240px',
    padding: '0.75rem 0.95rem',
    border: '1.5px solid #dbe2f1',
    borderRadius: '10px',
    fontSize: '0.95rem',
    background: '#fff',
  },
  count: { color: '#6b7280', fontSize: '0.9rem', fontWeight: '600' },
  formCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.25rem',
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
  formSubtitle: { color: '#6b7280', fontSize: '0.88rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#6b7280',
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
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
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
  list: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '1.2rem',
    display: 'flex',
    gap: '1rem',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#dbeafe',
    color: '#1d4ed8',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '1.1rem',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '0.4rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  cardActions: { display: 'flex', gap: '0.5rem' },
  name: { fontWeight: '700', fontSize: '1rem', color: '#0f172a' },
  sub: { color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem', lineHeight: 1.5 },
  empty: {
    background: '#fff',
    borderRadius: '16px',
    padding: '3rem 1.5rem',
    textAlign: 'center',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
  },
  emptyTitle: { fontWeight: '700', marginBottom: '0.4rem', color: '#334155' },
  emptySub: { color: '#94a3b8' },
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
