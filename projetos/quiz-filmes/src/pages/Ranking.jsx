import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore'
import { db } from '../firebase'

export default function Ranking() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function loadRanking() {
      const q = query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(50))
      const snap = await getDocs(q)
      setUsers(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    }

    loadRanking()
  }, [])

  return (
    <div className="panel-box">
      <h2>Ranking Global</h2>
      <div className="ranking-list">
        {users.map((user, index) => (
          <div key={user.id} className="ranking-item">
            <span>#{index + 1}</span>
            <strong>{user.username}</strong>
            <span>{user.totalScore} pts</span>
          </div>
        ))}
      </div>
    </div>
  )
}