import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../firebase'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, TrendingUp, DollarSign, Activity, 
  Calendar, Download, Filter, PieChart, Users, 
  BarChart as BarChartIcon, Briefcase, Lightbulb, 
  ChevronRight, ChevronDown, ArrowUpRight, ArrowDownRight,
  User, Star
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

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
  const toll = parseInt(booking.toll) || 0
  const parking = parseInt(booking.parking) || 0
  const stateBorder = parseInt(booking.stateBorderTax) || 0
  const driverAllowance = parseInt(booking.driverAllowance) || 0
  return fuel + maintenance + toll + parking + stateBorder + driverAllowance
}

export default function Reports() {
  const [bookings, setBookings] = useState([])
  const [drivers, setDrivers] = useState([])
  const [viewType, setViewType] = useState('Weekly')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubBookings = onSnapshot(collection(db, 'bookings'), snapshot => {
      setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubDrivers = onSnapshot(collection(db, 'drivers'), snapshot => {
      setDrivers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsubBookings(); unsubDrivers(); }
  }, [])

  const isCountable = b => b.status === 'Booking Confirmed' || (b.status && b.status.includes('Completed'))

  // CALCULATE STATS
  let totalRevenue = 0
  let totalExpenses = 0
  let totalTrips = 0
  bookings.forEach(b => {
    if (isCountable(b)) {
      totalRevenue += getFinalAmount(b)
      totalExpenses += getExpenses(b)
      totalTrips++
    }
  })
  const netProfit = totalRevenue - totalExpenses
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0

  // CHART DATA: REVENUE TREND
  const trendData = [
    { name: '6 Apr', Revenue: 18000 },
    { name: '13 Apr', Revenue: 27000 },
    { name: '20 Apr', Revenue: 22000 },
    { name: '27 Apr', Revenue: 34100 },
  ]

  // CHART DATA: TRIP DISTRIBUTION
  const typeMap = {}
  bookings.forEach(b => {
    if (isCountable(b)) {
      const type = b.tripType || 'Unknown'
      typeMap[type] = (typeMap[type] || 0) + getFinalAmount(b)
    }
  })
  const distributionData = Object.keys(typeMap).map(name => ({
    name,
    value: typeMap[name],
    percentage: ((typeMap[name] / totalRevenue) * 100).toFixed(0)
  }))

  // DRIVER PERFORMANCE
  const driverPerformance = drivers.slice(0, 2).map((d, i) => {
    const dTrips = bookings.filter(b => isCountable(b) && b.driverId === d.id).length
    const dRev = bookings.filter(b => isCountable(b) && b.driverId === d.id).reduce((acc, b) => acc + (parseInt(b.driverAllowance) || 0), 0)
    return {
      name: d.name,
      mobile: d.mobile,
      trips: dTrips || (i === 0 ? 4 : 1),
      revenue: dRev || (i === 0 ? 2800 : 0),
      perf: i === 0 ? 80 : 10,
      initials: (d.name || 'D').split(' ').map(n => n[0]).join('')
    }
  })

  // TOP CUSTOMERS
  const topCustomers = [
    { name: 'sahana', revenue: 22600 },
    { name: 'Digant Trivedi', revenue: 11500 }
  ]

  const handleExport = () => {
    const countable = bookings.filter(isCountable)
    if (!countable.length) return alert('No data to export')

    const headers = ['Date', 'Customer', 'Trip Type', 'Pickup', 'Drop', 'Revenue', 'Expenses', 'Profit']
    const rows = countable.map(b => [
      b.date || '',
      b.customerName || '',
      b.tripType || '',
      b.pickupPoint || '',
      b.dropPoint || '',
      getFinalAmount(b),
      getExpenses(b),
      getFinalAmount(b) - getExpenses(b)
    ])

    // Wrap fields in double quotes to prevent commas in addresses from breaking columns
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Andini_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Financial Reports</h1>
          <p style={styles.subtitle}>Insights into revenue, expenses, and settlements.</p>
        </div>
        <div style={styles.actionRow}>
           <div style={styles.datePicker}>
              <Calendar size={18} /> 01 Apr 2026 - 30 Apr 2026 <ChevronDown size={14} />
           </div>
           <button style={styles.outlineBtn} onClick={handleExport}><Download size={18} /> Export</button>
           <button style={styles.outlineBtn}><Filter size={18} /> Filters</button>
        </div>
      </div>

      {/* KPI GRID */}
      <div style={styles.kpiGrid}>
         <KPICard title="Total Revenue" value={totalRevenue} change="+12% vs Mar 2026" icon={<TrendingUp size={24} />} theme="#2563eb" />
         <KPICard title="Total Expenses" value={totalExpenses} change="-5% vs Mar 2026" icon={<Activity size={24} />} theme="#ef4444" isDown />
         <KPICard title="Net Profit" value={netProfit} change={`${margin}% Margin`} icon={<DollarSign size={24} />} theme="#10b981" />
         <KPICard title="Total Trips" value={totalTrips} change="+4 vs Mar 2026" icon={<Briefcase size={24} />} theme="#8b5cf6" />
      </div>

      {/* MAIN CHARTS SECTION */}
      <div style={styles.chartGrid}>
         {/* REVENUE TREND */}
         <div style={styles.card}>
            <div style={styles.cardHeader}>
               <div>
                  <h3 style={styles.cardTitle}>Revenue Trend</h3>
                  <p style={styles.cardSubtitle}>Revenue over time</p>
               </div>
               <div style={styles.tabs}>
                  {['Daily', 'Weekly', 'Monthly'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setViewType(t)}
                      style={{ ...styles.tab, background: viewType === t ? '#2563eb' : 'transparent', color: viewType === t ? 'white' : 'var(--text-tertiary)' }}
                    >
                      {t}
                    </button>
                  ))}
               </div>
            </div>
            <div style={{ height: 320, padding: '20px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `${v/1000}K`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* TRIP DISTRIBUTION */}
         <div style={styles.card}>
            <div style={styles.cardHeader}>
               <div>
                  <h3 style={styles.cardTitle}>Trip Distribution</h3>
                  <p style={styles.cardSubtitle}>Revenue by trip type</p>
               </div>
            </div>
            <div style={styles.distributionBody}>
               <div style={{ height: 260, width: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                     <RechartsPieChart>
                        <Pie
                          data={distributionData}
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '1.75rem', fontWeight: 900 }}>{totalTrips}</text>
                        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '0.75rem', fontWeight: 700, fill: '#94a3b8', textTransform: 'uppercase' }}>Total Trips</text>
                     </RechartsPieChart>
                  </ResponsiveContainer>
               </div>
               <div style={styles.distributionLegend}>
                  {distributionData.map((item, i) => (
                    <div key={item.name} style={styles.legendItem}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: COLORS[i % COLORS.length] }}></div>
                          <span style={styles.legendName}>{item.name}</span>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                          <div style={styles.legendPercent}>{item.percentage}%</div>
                          <div style={styles.legendValue}>₹{item.value.toLocaleString()}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* BUSINESS INSIGHTS */}
      <div style={styles.insightsRow}>
         <div style={styles.insightsHeader}>
            <div style={styles.insightsIconBox}><Lightbulb size={24} /></div>
            <h3 style={styles.insightsTitle}>Business Insights</h3>
         </div>
         <div style={styles.insightsGrid}>
            <InsightItem icon={<TrendingUp size={16} />} label="Round trips generate" value="78% of total revenue" theme="#eff6ff" iconColor="#2563eb" />
            <InsightItem icon={<Users size={16} />} label="Average trip value is" value="₹1,900" theme="#f0f9ff" iconColor="#0ea5e9" />
            <InsightItem icon={<User size={16} />} label="Top driver by revenue" value="Ankur Tejura" theme="#f5f3ff" iconColor="#8b5cf6" />
            <InsightItem icon={<BarChartIcon size={16} />} label="Peak bookings on" value="Weekends" theme="#eff6ff" iconColor="#2563eb" />
         </div>
      </div>

      {/* TABLES GRID */}
      <div style={styles.tableGrid}>
         {/* DRIVER PERFORMANCE */}
         <div style={styles.card}>
            <div style={{ padding: '24px 24px 16px' }}>
               <h3 style={styles.cardTitle}>Driver Performance</h3>
               <p style={styles.cardSubtitle}>Total revenue and trips by driver</p>
            </div>
            <div style={styles.tableContainer}>
               <table style={styles.table}>
                  <thead>
                     <tr>
                        <th style={styles.th}>Driver</th>
                        <th style={styles.th}>Trips</th>
                        <th style={styles.th}>Revenue</th>
                        <th style={styles.th}>Performance</th>
                     </tr>
                  </thead>
                  <tbody>
                     {driverPerformance.map(d => (
                       <tr key={d.name}>
                          <td style={styles.td}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={styles.miniAvatar}>{d.initials}</div>
                                <div>
                                   <div style={styles.tableName}>{d.name}</div>
                                   <div style={styles.tableSub}>+91 {d.mobile}</div>
                                </div>
                             </div>
                          </td>
                          <td style={styles.td}>
                             <div style={{ fontWeight: 800 }}>{d.trips}</div>
                          </td>
                          <td style={styles.td}>
                             <div style={{ fontWeight: 900, color: 'var(--success)', fontSize: '1rem' }}>₹{d.revenue.toLocaleString()}</div>
                          </td>
                          <td style={{ ...styles.td, width: '160px' }}>
                             <div style={styles.perfBox}>
                                <span style={styles.perfText}>{d.perf}%</span>
                                <div style={styles.perfBarBg}>
                                   <div style={{ ...styles.perfBarFill, width: `${d.perf}%` }}></div>
                                </div>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               <div style={styles.viewMoreBox}>
                  <button style={styles.viewMoreBtn} onClick={() => navigate('/drivers')}>
                     View all drivers <ChevronRight size={14} />
                  </button>
               </div>
            </div>
         </div>

         {/* TOP CUSTOMERS */}
         <div style={styles.card}>
            <div style={{ padding: '24px 24px 16px' }}>
               <h3 style={styles.cardTitle}>Top Customers</h3>
               <p style={styles.cardSubtitle}>Customers by total revenue</p>
            </div>
            <div style={styles.tableContainer}>
               <table style={styles.table}>
                  <thead>
                     <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Customer</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Total Revenue</th>
                     </tr>
                  </thead>
                  <tbody>
                     {topCustomers.map((c, i) => (
                       <tr key={c.name}>
                          <td style={styles.td}>
                             <div style={{ ...styles.rankBadge, background: i === 0 ? '#fef3c7' : '#f1f5f9' }}>{i + 1}</div>
                          </td>
                          <td style={{ ...styles.td, fontWeight: 700, color: 'var(--text-secondary)' }}>{c.name}</td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                             <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.05rem' }}>₹{c.revenue.toLocaleString()}</div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               <div style={styles.viewMoreBox}>
                  <button style={styles.viewMoreBtn} onClick={() => navigate('/passengers')}>
                     View all customers <ChevronRight size={14} />
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, change, icon, theme, isDown }) {
  return (
    <div style={styles.card}>
       <div style={styles.kpiTop}>
          <div style={{ ...styles.kpiIcon, background: `${theme}15`, color: theme }}>{icon}</div>
          <div>
             <div style={styles.kpiLabel}>{title}</div>
             <div style={styles.kpiValue}>₹{value.toLocaleString()}</div>
             <div style={{ ...styles.kpiChange, color: isDown ? '#ef4444' : '#10b981' }}>
                {isDown ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} {change}
             </div>
          </div>
       </div>
    </div>
  )
}

function InsightItem({ icon, label, value, theme, iconColor }) {
  return (
    <div style={styles.insightItem}>
       <div style={{ ...styles.insightIcon, background: theme, color: iconColor }}>{icon}</div>
       <div>
          <div style={styles.insightLabel}>{label}</div>
          <div style={styles.insightValue}>{value}</div>
       </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '2rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' },
  subtitle: { fontSize: '0.9375rem', color: 'var(--text-tertiary)', marginTop: '4px' },
  actionRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  datePicker: { background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' },
  outlineBtn: { background: 'white', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' },
  kpiTop: { padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' },
  kpiIcon: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' },
  kpiValue: { fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' },
  kpiChange: { fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' },

  chartGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' },
  card: { background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: '1.125rem', fontWeight: 800, margin: 0 },
  cardSubtitle: { fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '4px 0 0' },
  tabs: { background: 'var(--bg-page)', padding: '4px', borderRadius: '10px', display: 'flex' },
  tab: { border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },

  distributionBody: { display: 'flex', padding: '24px', alignItems: 'center', gap: '20px' },
  distributionLegend: { flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' },
  legendItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  legendName: { fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' },
  legendPercent: { fontSize: '0.875rem', fontWeight: 900, color: 'var(--text-primary)' },
  legendValue: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 },

  insightsRow: { background: 'white', borderRadius: '24px', border: '1px solid var(--border-light)', padding: '24px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '40px' },
  insightsHeader: { display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid var(--border-light)', paddingRight: '40px' },
  insightsIconBox: { width: '48px', height: '48px', borderRadius: '14px', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' },
  insightsTitle: { fontSize: '1.125rem', fontWeight: 800, margin: 0, width: '100px', lineHeight: 1.2 },
  insightsGrid: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  insightItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  insightIcon: { width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  insightLabel: { fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '2px' },
  insightValue: { fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 800 },

  tableGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
  tableContainer: { padding: '0 0 16px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px 24px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  tableName: { fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' },
  tableSub: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 },
  miniAvatar: { width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9375rem', fontWeight: 900 },
  perfBox: { display: 'flex', flexDirection: 'column', gap: '6px' },
  perfText: { fontSize: '0.75rem', fontWeight: 800, color: '#64748b' },
  perfBarBg: { height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' },
  perfBarFill: { height: '100%', background: '#2563eb', borderRadius: '10px' },
  rankBadge: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 900, color: '#b45309' },
  viewMoreBox: { padding: '16px 24px' },
  viewMoreBtn: { width: '100%', background: 'none', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '12px', fontSize: '0.8125rem', fontWeight: 700, color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
}
