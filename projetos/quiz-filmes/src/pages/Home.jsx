import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import MovieCard from '../components/MovieCard'

export default function Home() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMovies() {
      const snap = await getDocs(collection(db, 'movies'))
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setMovies(list)
      setLoading(false)
    }

    loadMovies()
  }, [])

  if (loading) return <p>Carregando filmes...</p>

  return (
    <section>
      <div className="hero">
        <h1>Escolha um filme ou série e teste seu conhecimento</h1>
        <p>Entre, selecione a obra, escolha quantas perguntas quer responder e suba no ranking global.</p>
      </div>

      <div className="grid-cards">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  )
}