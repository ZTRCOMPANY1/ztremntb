import { Link } from 'react-router-dom'

export default function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <div
        className="movie-cover"
        style={{ backgroundImage: `url(${movie.image || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop'})` }}
      />
      <div className="movie-body">
        <h3>{movie.name}</h3>
        <p>{movie.description}</p>
        <p><strong>{movie.totalQuestions || 0}</strong> perguntas disponíveis</p>
        <Link to={`/quiz/${movie.id}/setup`} className="primary-btn">Responder quiz</Link>
      </div>
    </div>
  )
}