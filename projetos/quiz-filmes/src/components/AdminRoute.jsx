import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <p>Carregando...</p>
  if (!user) return <Navigate to="/login" replace />

  const adminEmail = 'seuemail@admin.com'
  if (user.email !== adminEmail) return <Navigate to="/" replace />

  return children
}