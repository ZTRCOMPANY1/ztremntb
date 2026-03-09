import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="logo">QuizFlix</Link>
        <nav>
          <Link to="/">Início</Link>
          <Link to="/ranking">Ranking</Link>
          {user && user.email === 'seuemail@admin.com' && <Link to="/admin">Admin</Link>}
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Cadastro</Link>
            </>
          ) : (
            <button onClick={handleLogout} className="logout-btn">Sair</button>
          )}
        </nav>
      </header>

      <main className="page-container">{children}</main>
    </div>
  )
}