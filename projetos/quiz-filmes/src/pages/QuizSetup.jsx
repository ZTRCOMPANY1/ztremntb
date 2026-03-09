import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../firebase'

export default function QuizSetup() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [questionCount, setQuestionCount] = useState(10)

  useEffect(() => {
    async function loadMovie() {
      const snap = await getDoc(doc(db, 'movies', movieId))
      if (snap.exists()) setMovie({ id: snap.id, ...snap.data() })
    }

    loadMovie()
  }, [movieId])

  function startQuiz() {
    navigate(`/quiz/${movieId}/play?count=${questionCount}`)
  }

  if (!movie) return <p>Carregando configuração...</p>

  return (
    <div className="panel-box">
      <h2>{movie.name}</h2>
      <p>Escolha quantas perguntas você quer responder.</p>

      <div className="count-options">
        {[10, 20, 30, 40, 50].map((num) => (
          <button
            key={num}
            className={questionCount === num ? 'count-btn active' : 'count-btn'}
            onClick={() => setQuestionCount(num)}
            disabled={num > (movie.totalQuestions || 0)}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="custom-count">
        <label>Ou digite manualmente:</label>
        <input
          type="number"
          min="1"
          max={movie.totalQuestions || 50}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
        />
      </div>

      <button className="primary-btn" onClick={startQuiz}>Começar quiz</button>
    </div>
  )
}