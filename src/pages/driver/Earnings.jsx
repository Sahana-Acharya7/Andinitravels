import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/AuthContext'
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  ChevronRight,
  Download,
  Filter
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'

export default function Earnings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const driverQuery = query(collection(db, 'drivers'), where('email', '==', user.email))
    return onSnapshot(driverQuery, driverSnap => {
      if (driverSnap.empty) return
      const driverDocId = driverSnap.docs[0].id

      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('assignedDriverId', '==', driverDocId),
        where('tripStatus', '==', 'completed')
      )
      onSnapshot(bookingsQuery, snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setBookings(data)
        setLoading(false)
      })
    })
  }, [user])

  const totalEarnings = bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
  const thisMonthEarnings = bookings
    .filter(b => b.date && b.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
  
  // Prepare chart data (last 7 days)
  const chartData = [
    { name: 'Mon', amount: 2400 },
    { name: 'Tue', amount: 1398 },
    { name: 'Wed', amount: 9800 },
    { name: 'Thu', amount: 3908 },
    { name: 'Fri', amount: 4800 },
    { name: 'Sat', amount: 3800 },
    { name: 'Sun', amount: 4300 },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="loading-spinner" />
    </div>
  )

  return (
    <div style={styles.container}>
      {/* Top Stats */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff'}}>
          <div style={styles.statHeader}>
            <div style={{...styles.iconBox, backgroundColor: 'rgba(255,255,255,0.2)'}}>
              <Wallet size={20} color="#fff" />
            </div>
            <span style={{fontSize: '0.85rem', fontWeight: '600', opacity: 0.8}}>Total Balance</span>
          </div>
          <div style={styles.statBody}>
            <div style={styles.amount}>₹{totalEarnings.toLocaleString()}</div>
            <div style={styles.trend}>
              <TrendingUp size={14} /> +12.5% from last month
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{...styles.iconBox, backgroundColor: '#f0fdf4'}}>
              <ArrowUpRight size={20} color="#16a34a" />
            </div>
            <span style={styles.statLabel}>Monthly Earnings</span>
          </div>
          <div style={styles.statBody}>
            <div style={{...styles.amount, color: 'var(--text-primary)'}}>₹{thisMonthEarnings.toLocaleString()}</div>
            <div style={{...styles.trend, color: 'var(--success)'}}>
              On track to beat last month
            </div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div style={{...styles.iconBox, backgroundColor: '#eff6ff'}}>
              <Calendar size={20} color="var(--primary)" />
            </div>
            <span style={styles.statLabel}>Trips Completed</span>
          </div>
          <div style={styles.statBody}>
            <div style={{...styles.amount, color: 'var(--text-primary)'}}>{bookings.length}</div>
            <div style={{...styles.trend, color: 'var(--text-tertiary)'}}>
              Across all categories
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div style={styles.grid}>
        <div style={styles.mainCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>Earnings Overview</h3>
                <p style={styles.cardSub}>Weekly performance data</p>
              </div>
              <div style={styles.headerActions}>
                <button style={styles.outlineBtn}><Filter size={14} /> Filter</button>
                <button style={styles.outlineBtn}><Download size={14} /> Export</button>
              </div>
            </div>
            <div style={{...styles.cardBody, height: '300px'}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 2 ? '#2563eb' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Recent Transactions</h3>
              <button style={styles.viewAllBtn}>View all</button>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.transactionList}>
                {bookings.slice(0, 5).map(trip => (
                  <div key={trip.id} style={styles.transactionItem}>
                    <div style={styles.txIcon}>
                      <ArrowUpRight size={18} color="#16a34a" />
                    </div>
                    <div style={styles.txInfo}>
                      <div style={styles.txTitle}>{trip.customerName}</div>
                      <div style={styles.txMeta}>{trip.date} • {trip.tripType}</div>
                    </div>
                    <div style={styles.txAmount}>
                      <div style={styles.amountText}>+ ₹{trip.totalAmount || '0'}</div>
                      <div style={styles.statusText}>Completed</div>
                    </div>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.sideCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Earnings by Category</h3>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.categoryList}>
                <CategoryItem label="Local Trips" amount="₹12,450" percentage={65} color="#2563eb" />
                <CategoryItem label="Outstation" amount="₹4,200" percentage={25} color="#8b5cf6" />
                <CategoryItem label="Airport Transfers" amount="₹1,800" percentage={10} color="#16a34a" />
              </div>
            </div>
          </div>

          <div style={{...styles.card, background: 'var(--primary-subtle)', border: 'none'}}>
            <div style={styles.cardBody}>
              <div style={styles.payoutCard}>
                <div style={{...styles.iconBox, backgroundColor: '#fff', margin: '0 auto 1rem'}}>
                  <TrendingUp size={20} color="var(--primary)" />
                </div>
                <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--text-primary)'}}>Earnings Tip</h4>
                <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5}}>
                  Drivers who maintain a 4.8+ rating tend to receive 30% more premium corporate assignments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryItem({ label, amount, percentage, color }) {
  return (
    <div style={styles.categoryItem}>
      <div style={styles.categoryHeader}>
        <span style={styles.categoryLabel}>{label}</span>
        <span style={styles.categoryAmount}>{amount}</span>
      </div>
      <div style={styles.progressBg}>
        <div style={{...styles.progressFill, width: `${percentage}%`, backgroundColor: color}} />
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' },
  statCard: { 
    backgroundColor: '#fff', 
    borderRadius: 'var(--radius-xl)', 
    padding: '1.75rem', 
    boxShadow: 'var(--shadow-sm)', 
    border: '1px solid var(--border-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  statHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  iconBox: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: '600' },
  statBody: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  amount: { fontSize: '1.75rem', fontWeight: '800', lineHeight: 1.2 },
  trend: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: '600', opacity: 0.9 },
  
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  
  card: { backgroundColor: '#fff', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)', overflow: 'hidden' },
  cardHeader: { padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' },
  cardSub: { margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-tertiary)' },
  cardBody: { padding: '1.5rem' },
  
  headerActions: { display: 'flex', gap: '0.75rem' },
  outlineBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    backgroundColor: '#fff', 
    border: '1.5px solid var(--border)', 
    borderRadius: '10px', 
    padding: '0.5rem 0.85rem', 
    fontSize: '0.8rem', 
    fontWeight: '600', 
    color: 'var(--text-secondary)',
    cursor: 'pointer'
  },
  
  transactionList: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  transactionItem: { display: 'flex', alignItems: 'center', gap: '1rem' },
  txIcon: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' },
  txMeta: { fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' },
  txAmount: { textAlign: 'right' },
  amountText: { fontSize: '0.95rem', fontWeight: '800', color: '#16a34a' },
  statusText: { fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' },
  viewAllBtn: { background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' },
  
  categoryList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  categoryItem: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  categoryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  categoryLabel: { fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' },
  categoryAmount: { fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '700' },
  progressBg: { height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px' },
  
  payoutCard: { textAlign: 'center' }
}
