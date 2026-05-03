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
import { 
  Pencil, 
  Plus, 
  Trash2, 
  User, 
  X, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  UserPlus, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Cake,
  PhoneCall,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Cake as CakeIcon,
  Edit2,
  Trash
} from 'lucide-react'
import { db } from '../../firebase'

const EMPTY_CUSTOMER = {
  name: '',
  mobile: '',
  address: '',
  email: '',
  birthday: '',
  type: 'Business'
}

export default function Customers() {
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
      email: (form.email || '').trim(),
      address: (form.address || '').trim(),
      birthday: form.birthday || '',
      type: form.type || 'Regular',
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
      type: customer.type || 'Business'
    })
    setEditingId(customer.id)
    setShowForm(true)
  }

  const handleDelete = async customer => {
    if (!window.confirm(`Delete passenger ${customer.name}?`)) return
    await deleteDoc(doc(db, 'customers', customer.id))
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.25rem 0' }}>Passengers</h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Store and reuse passenger details for bookings.</p>
        </div>
        <button 
          className="btn-new-booking" 
          style={{ width: 'auto', padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
          onClick={startCreate}
        >
          <UserPlus size={20} />
          <span>+ New Passenger</span>
        </button>
      </div>

      {/* Search and Stats Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
          <input 
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', outline: 'none', fontSize: '0.875rem' }} 
            placeholder="Search by name, mobile, or email..." 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <Users size={20} color="#2563eb" fill="#2563eb" fillOpacity="0.1" />
          <span style={{ color: '#0f172a', fontWeight: 700 }}>{customers.length}</span>
          <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>Total Passengers</span>
        </div>
      </div>

      {showForm && (
        <div className="data-card" style={{ marginBottom: '2rem', animation: 'slideIn 0.3s ease-out' }}>
          <form className="dashboard-content" style={{ padding: '2rem' }} onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{editingId ? 'Edit Passenger' : 'Add New Passenger'}</h3>
              <button type="button" className="icon-btn" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-container">
                  <input
                    value={form.name}
                    onChange={event => set('name', event.target.value)}
                    placeholder="e.g. Digant Trivedi"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Passenger Type</label>
                <div className="input-container">
                  <select 
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontSize: '0.9375rem' }}
                    value={form.type}
                    onChange={event => set('type', event.target.value)}
                  >
                    <option value="Business">Business</option>
                    <option value="Premium">Premium</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div className="input-container">
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={event => set('mobile', event.target.value)}
                    placeholder="e.g. +91 9820608212"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-container">
                  <input
                    type="email"
                    value={form.email}
                    onChange={event => set('email', event.target.value)}
                    placeholder="e.g. digant@gmail.com"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Birthday</label>
                <div className="input-container">
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={event => set('birthday', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Full Address</label>
              <div className="input-container">
                <textarea
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px', fontSize: '0.9375rem' }}
                  value={form.address}
                  onChange={event => set('address', event.target.value)}
                  placeholder="Street, City, State, etc."
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
              <button className="btn-new-booking" style={{ width: 'auto', padding: '0 32px', marginBottom: 0 }} disabled={loading}>
                {loading ? 'Saving...' : editingId ? 'Update Passenger' : 'Save Passenger'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Passenger List (White Card) */}
      <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Passenger Info</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ divideY: '1px solid #f1f5f9' }}>
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="group-hover-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '3rem', 
                      height: '3rem', 
                      borderRadius: '0.75rem', 
                      background: customer.type === 'Premium' ? 'linear-gradient(to bottom right, #14b8a6, #059669)' : 'linear-gradient(to bottom right, #2563eb, #4f46e5)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontWeight: 700, 
                      fontSize: '1.125rem' 
                    }}>
                      {customer.name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>{customer.name}</h4>
                      <span className={`status-badge ${customer.type?.toLowerCase() || 'regular'}`} style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        padding: '0.125rem 0.5rem', 
                        borderRadius: '9999px', 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        textTransform: 'uppercase',
                        marginTop: '4px'
                      }}>
                        {customer.type || 'Regular'}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.875rem' }}>
                      <PhoneCall size={16} color="#94a3b8" />
                      {customer.mobile}
                    </div>
                    {customer.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.875rem' }}>
                        <MailIcon size={16} color="#94a3b8" />
                        {customer.email}
                      </div>
                    )}
                    {customer.birthday && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.875rem' }}>
                        <CakeIcon size={16} color="#94a3b8" />
                        {customer.birthday}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', color: '#475569', fontSize: '0.875rem', maxWidth: '320px' }}>
                    <MapPinIcon size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <span className="line-clamp-2">{customer.address || 'No address provided'}</span>
                  </div>
                </td>
                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                  <div className="action-buttons-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button 
                      style={{ padding: '0.5rem', color: '#94a3b8', borderRadius: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }} 
                      onClick={() => startEdit(customer)}
                      title="Edit"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      style={{ padding: '0.5rem', color: '#94a3b8', borderRadius: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer' }} 
                      onClick={() => handleDelete(customer)}
                      title="Delete"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination / Footer */}
        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
          <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Showing {filteredCustomers.length} of {customers.length} passengers</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto' }}>
            <button className="page-btn" disabled><ChevronLeft size={20} /></button>
            <button className="page-btn active" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>1</button>
            <button className="page-btn" disabled><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
