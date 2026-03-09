import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        username,
        email,
        totalScore: 0,
        quizzesPlayed: 0,
        createdAt: Date.now()
      })

      navigate('/')
    } catch {
      setError('Não foi possível criar a conta.')
    }
  }

  return (
    <div className="auth-box">
      <h2>Cadastro</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Nome de usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="primary-btn">Criar conta</button>
      </form>
      {error && <p className="error-text">{error}</p>}
      <p>Já tem conta? <Link to="/login">Entrar</Link></p>
    </div>
  )
}