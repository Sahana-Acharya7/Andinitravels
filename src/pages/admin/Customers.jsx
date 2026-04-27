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
import { Activity, Pencil, Plus, Trash2, User, X } from 'lucide-react'
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
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="heading-2" style={{ margin: 0 }}>Passengers</h1>
          <p className="text-label" style={{ textTransform: 'none', marginTop: '4px' }}>Store and reuse passenger details for bookings.</p>
        </div>
        <button className="btn-primary" onClick={startCreate}>
          <Plus size={18} /> New Passenger
        </button>
      </header>

      <div style={styles.toolbar}>
        <div className="search-container">
          <Activity className="icon" size={18} />
          <input
            placeholder="Search by name, mobile, or email..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <span className="text-label" style={{ fontWeight: 600 }}>{filteredCustomers.length} Total Passengers</span>
      </div>

      {showForm && (
        <form className="card-premium" style={styles.formCard} onSubmit={handleSubmit}>
          <div style={styles.formHeader}>
            <div>
              <h3 className="heading-3">{editingId ? 'Edit Passenger' : 'New Passenger'}</h3>
              <p className="text-label" style={{ textTransform: 'none', marginTop: '2px' }}>Fill in the details below to save this passenger.</p>
            </div>
            <button type="button" className="btn btn-ghost" style={{ padding: '8px' }} onClick={resetForm}>
              <X size={20} />
            </button>
          </div>

          <div style={styles.grid}>
            <div className="input-group">
              <label className="input-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                style={{ width: '100%' }}
                value={form.name}
                onChange={event => set('name', event.target.value)}
                placeholder="e.g. John Doe"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Mobile Number <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                style={{ width: '100%' }}
                type="tel"
                value={form.mobile}
                onChange={event => set('mobile', event.target.value)}
                placeholder="e.g. +91 98765 43210"
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                style={{ width: '100%' }}
                type="email"
                value={form.email}
                onChange={event => set('email', event.target.value)}
                placeholder="e.g. john@example.com"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Birthday</label>
              <input
                style={{ width: '100%' }}
                type="date"
                value={form.birthday}
                onChange={event => set('birthday', event.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Address</label>
            <textarea
              style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
              value={form.address}
              onChange={event => set('address', event.target.value)}
              placeholder="Full residence or office address..."
            />
          </div>

          <div style={styles.formActions}>
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Passenger' : 'Save Passenger'}
            </button>
          </div>
        </form>
      )}

      <div style={styles.list}>
        {filteredCustomers.length === 0 ? (
          <div className="card" style={styles.empty}>
            <div style={styles.emptyIcon}>
              <User size={48} color="var(--text-tertiary)" />
            </div>
            <h3 className="heading-3">No passengers found</h3>
            <p className="text-label" style={{ textTransform: 'none', marginTop: '4px' }}>Add your first passenger to start building your database.</p>
            {!showForm && (
              <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={startCreate}>
                Add Passenger
              </button>
            )}
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="card card-hover" style={styles.customerCard}>
              <div style={styles.avatar}>{customer.name?.[0]?.toUpperCase() || '?'}</div>
              <div style={styles.cardBody}>
                <div style={styles.cardHeaderRow}>
                  <div className="text-value" style={{ fontSize: '1.05rem' }}>{customer.name}</div>
                  <div style={styles.cardActions}>
                    <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => startEdit(customer)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(customer)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div style={styles.metaRow}>
                  {customer.mobile && (
                    <div style={styles.metaItem}>
                      <Activity size={14} color="var(--text-tertiary)" />
                      <span className="text-label" style={{ textTransform: 'none', fontSize: '0.8125rem' }}>{customer.mobile}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div style={styles.metaItem}>
                      <Activity size={14} color="var(--text-tertiary)" />
                      <span className="text-label" style={{ textTransform: 'none', fontSize: '0.8125rem' }}>{customer.email}</span>
                    </div>
                  )}
                  {customer.birthday && (
                    <div style={styles.metaItem}>
                      <Plus size={14} color="var(--text-tertiary)" />
                      <span className="text-label" style={{ textTransform: 'none', fontSize: '0.8125rem' }}>{customer.birthday}</span>
                    </div>
                  )}
                </div>
                
                {customer.address && (
                  <p className="text-label" style={{ textTransform: 'none', fontSize: '0.8125rem', marginTop: '8px', lineHeight: 1.4 }}>
                    {customer.address}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

const styles = {
  toolbar: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  formCard: {
    padding: '2rem',
    marginBottom: '1.5rem',
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '1.5rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--border-light)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '0.5rem',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  customerCard: {
    padding: '1.25rem',
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'flex-start',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'var(--primary-subtle)',
    color: 'var(--primary)',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '1.125rem',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    gap: '1rem',
  },
  cardActions: { display: 'flex', gap: '8px' },
  metaRow: { display: 'flex', gap: '1.25rem', flexWrap: 'wrap' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    background: 'var(--bg-page)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  }
}
