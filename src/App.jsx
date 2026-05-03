import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import Login from './pages/Login'
import DriverDashboard from './pages/driver/DriverDashboard'
import TripDetail from './pages/driver/TripDetail'
import Availability from './pages/driver/Availability'
import DriverProfile from './pages/driver/DriverProfile'
import Earnings from './pages/driver/Earnings'
import Schedule from './pages/driver/Schedule'
import Dashboard from './pages/admin/Dashboard'
import AdminLayout from './components/AdminLayout'
import DriverLayout from './components/DriverLayout'
import CreateBooking from './pages/admin/CreateBooking'
import BookingDetail from './pages/admin/BookingDetail'
import Drivers from './pages/admin/Drivers'
import Customers from './pages/admin/Customers'
import Reports from './pages/admin/Reports'

function Unauthorized() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h2>Access Denied</h2>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Driver Routes */}
          <Route 
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/driver/trips" element={<DriverDashboard />} />
            <Route path="/driver/booking/:bookingId" element={<TripDetail />} />
            <Route path="/driver/availability" element={<Availability />} />
            <Route path="/driver/profile" element={<DriverProfile />} />
            <Route path="/driver/earnings" element={<Earnings />} />
            <Route path="/driver/schedule" element={<Schedule />} />
          </Route>

          {/* Admin Routes */}
          <Route 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateBooking />} />
            <Route path="/booking/:id" element={<BookingDetail />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
