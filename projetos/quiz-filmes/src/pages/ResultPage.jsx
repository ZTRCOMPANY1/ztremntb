import { useLocation, Link } from 'react-router-dom'

function getMessage(percent) {
  if (percent === 100) return 'Perfeito. Você zerou o quiz!'
  if (percent >= 80) return 'Foi muito bem!'
  if (percent >= 50) return 'Foi bom, mas ainda dá para melhorar.'
  return 'Precisa assistir mais uma vez.'
}

export default function ResultPage() {
  const { state } = useLocation()

  if (!state) {
    return (
      <div className="panel-box">
        <p>Nenhum resultado encontrado.</p>
        <Link to="/" className="primary-btn">Voltar</Link>
      </div>
    )
  }

  const percent = Math.round((state.score / state.total) * 100)

  return (
    <div className="panel-box result-box">
      <h2>Resultado de {state.movieName}</h2>
      <p className="big-score">{state.score} / {state.total}</p>
      <p className="result-percent">Aproveitamento: {percent}%</p>
      <p>{getMessage(percent)}</p>
      <div className="result-actions">
        <Link to="/ranking" className="primary-btn">Ver ranking</Link>
        <Link to="/" className="secondary-btn">Voltar ao início</Link>
      </div>
    </div>
  )
}