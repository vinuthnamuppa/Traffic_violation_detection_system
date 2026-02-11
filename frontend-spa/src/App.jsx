import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserDashboard from './pages/UserDashboard'
import OfficerDashboard from './pages/OfficerDashboard'

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'officer' ? '/officer/dashboard' : '/user/dashboard'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'officer' ? '/officer/dashboard' : '/user/dashboard'} replace /> : <RegisterPage />} />
      
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={['public']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
