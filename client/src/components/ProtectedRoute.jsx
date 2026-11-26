import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from 'reactstrap'
import { useAuth } from '../context/auth-context.js'

export default function ProtectedRoute() {
  const { employee, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner color="secondary" />
      </div>
    )
  }
  if (!employee) return <Navigate to="/auth/login" replace />

  return <Outlet />
}
