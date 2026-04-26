import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PieChart, TrendingUp, DollarSign, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626']

function getFinalAmount(booking) {
  if (booking.tripType === 'Round Trip') {
    return (
      (parseInt(booking.totalKilometerAmount) || 0) +
      (parseInt(booking.driverAllowance) || 0) +
      (parseInt(booking.toll) || 0) +
      (parseInt(booking.stateBorderTax) || 0) +
      (parseInt(booking.parking) || 0)
    )
  }
  return (parseInt(booking.carFare) || 0) + (parseInt(booking.parking) || 0)
}

function getExpenses(booking) {
  const fuel = parseInt(booking.fuelCost) || 0
  const maintenance = parseInt(booking.maintenanceCost) || 0
  
  // These are usually pass-through costs (collected from customer, paid out)
  const toll = parseInt(booking.toll) || 0
  const parking = parseInt(booking.parking) || 0
  const stateBorder = parseInt(booking.stateBorderTax) || 0
  
  // Driver allowance is paid to driver
  const driverAllowance = parseInt(booking.driverAllowance) || 0

  return fuel + maintenance + toll + parking + stateBorder + driverAllowance
}

export default function Reports() {
  const [bookings, setBookings] = useState([])
  const [drivers, setDrivers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const unsubBookings = onSnapshot(collection(db, 'bookings'), snapshot => {
      setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubDrivers = onSnapshot(collection(db, 'drivers'), snapshot => {
      setDrivers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => {
      unsubBookings()
      unsubDrivers()
    }
  }, [])

  // Bookings that count toward revenue: confirmed status OR driver has completed the trip
  // tripStatus === 'completed' is the reliable field — status strings vary ('Trip Completed', 'Trip Completed — Pending Reconciliation', etc.)
  const isCountable = b =>
    b.status === 'Booking Confirmed' ||
    b.tripStatus === 'completed' ||
    (b.status && b.status.startsWith('Trip Completed'))

  // 1. Calculate Overall Financials
  let totalRevenue = 0
  let totalExpenses = 0
  let totalProfit = 0

  bookings.forEach(b => {
    if (isCountable(b)) {
      const revenue = getFinalAmount(b)
      const expenses = getExpenses(b)
      totalRevenue += revenue
      totalExpenses += expenses
      totalProfit += (revenue - expenses)
    }
  })

  // 2. Revenue by Trip Type
  const tripTypeData = {}
  bookings.forEach(b => {
    if (isCountable(b)) {
      const type = b.tripType || 'Unknown'
      tripTypeData[type] = (tripTypeData[type] || 0) + getFinalAmount(b)
    }
  })
  const pieData = Object.keys(tripTypeData).map(key => ({ name: key, value: tripTypeData[key] }))

  // 3. Monthly Revenue (Simple Grouping)
  const monthlyDataMap = {}
  bookings.forEach(b => {
    if (isCountable(b) && b.date) {
      // Assuming date is YYYY-MM-DD
      const month = b.date.substring(0, 7) // YYYY-MM
      const rev = getFinalAmount(b)
      monthlyDataMap[month] = (monthlyDataMap[month] || 0) + rev
    }
  })
  const monthlyChartData = Object.keys(monthlyDataMap)
    .sort()
    .map(m => ({ name: m, Revenue: monthlyDataMap[m] }))

  // 4. Top Customers
  const customerMap = {}
  bookings.forEach(b => {
    if (isCountable(b) && b.customerName) {
      customerMap[b.customerName] = (customerMap[b.customerName] || 0) + getFinalAmount(b)
    }
  })
  const topCustomers = Object.keys(customerMap)
    .map(name => ({ name, revenue: customerMap[name] }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // 5. Driver Earnings Ledger
  const driverLedger = drivers.map(d => {
    let trips = 0
    let earnings = 0
    bookings.forEach(b => {
      if (isCountable(b) && b.driverId === d.id) {
        trips++
        earnings += (parseInt(b.driverAllowance) || 0)
      }
    })
    return { ...d, trips, earnings }
  }).sort((a, b) => b.earnings - a.earnings)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={styles.backBtn} onClick={() => navigate('/')}>
            <ArrowLeft size={18} color="#2563eb" />
          </button>
          <div>
            <h1 style={styles.title}>Financial Reports</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.2rem' }}>Revenue, Expenses, and Driver Settlements</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiIcon, background: '#dbeafe', color: '#2563eb'}}><TrendingUp size={24} /></div>
          <div>
            <div style={styles.kpiLabel}>Total Revenue</div>
            <div style={styles.kpiValue}>Rs {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiIcon, background: '#fee2e2', color: '#dc2626'}}><Activity size={24} /></div>
          <div>
            <div style={styles.kpiLabel}>Total Expenses</div>
            <div style={styles.kpiValue}>Rs {totalExpenses.toLocaleString()}</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{...styles.kpiIcon, background: '#dcfce7', color: '#16a34a'}}><DollarSign size={24} /></div>
          <div>
            <div style={styles.kpiLabel}>Net Profit</div>
            <div style={styles.kpiValue}>Rs {totalProfit.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: '600' }}>
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% Margin
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={styles.grid2}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Monthly Revenue</h3>
          <div style={{ height: 300 }}>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyChart}>No revenue data yet</div>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Revenue by Trip Type</h3>
          <div style={{ height: 300 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div style={styles.emptyChart}>No trip data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div style={styles.grid2}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Driver Earnings Ledger</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>Total Driver Allowance earned per driver.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Driver Name</th>
                  <th style={styles.th}>Trips</th>
                  <th style={styles.th}>Earnings (Allowance)</th>
                </tr>
              </thead>
              <tbody>
                {driverLedger.map(d => (
                  <tr key={d.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '600' }}>{d.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{d.mobile}</div>
                    </td>
                    <td style={styles.td}>{d.trips}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#16a34a' }}>Rs {d.earnings.toLocaleString()}</td>
                  </tr>
                ))}
                {driverLedger.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No drivers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Top Customers</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Customer Name</th>
                  <th style={styles.th}>Total Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map(c => (
                  <tr key={c.name} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: '600' }}>{c.name}</td>
                    <td style={{ ...styles.td, fontWeight: '700', color: '#2563eb' }}>Rs {c.revenue.toLocaleString()}</td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No customers found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: '1080px', margin: '0 auto', padding: '1.5rem', fontFamily: 'sans-serif' },
  header: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: '1.5rem',
  },
  title: { fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#0f172a' },
  backBtn: {
    background: '#eff6ff',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  kpiCard: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  kpiIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: { color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' },
  kpiValue: { fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  card: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  cardTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '1.5rem', marginTop: 0 },
  emptyChart: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    background: '#f8fafc',
    borderRadius: '8px',
  },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: {
    padding: '0.75rem 1rem',
    borderBottom: '2px solid #e2e8f0',
    color: '#475569',
    fontWeight: '600',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
    fontSize: '0.95rem',
  },
  tr: {
    transition: 'background 0.2s',
  },
}
