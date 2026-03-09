import { useEffect, useMemo, useState } from 'react'
    setTimeout(async () => {
      const nextIndex = currentIndex + 1

      if (nextIndex < questions.length) {
        setCurrentIndex(nextIndex)
        setSelected('')
        setFeedback('')
        setLocked(false)
      } else {
        const finalScore = isCorrect ? score + 10 : score

        await updateDoc(doc(db, 'users', user.uid), {
          totalScore: increment(finalScore),
          quizzesPlayed: increment(1)
        })

        navigate('/resultado', {
          state: {
            score: finalScore,
            total: questions.length * 10,
            movieName: movie?.name || 'Quiz'
          }
        })
      }
    }, 1200)
  

  if (!movie || questions.length === 0) return <p>Carregando quiz...</p>

  const currentQuestion = questions[currentIndex]

  return (
    <div className="quiz-box">
      <div className="quiz-header-row">
        <h2>{movie.name}</h2>
        <span>Pergunta {currentIndex + 1} de {questions.length}</span>
      </div>

      <h3 className="question-title">{currentQuestion.question}</h3>

      <div className="options-grid">
        {currentQuestion.options.map((option) => {
          const isCorrect = option === currentQuestion.correctAnswer
          const isSelected = option === selected

          let className = 'option-btn'
          if (locked && isSelected && isCorrect) className += ' correct'
          if (locked && isSelected && !isCorrect) className += ' wrong'
          if (locked && !isSelected && isCorrect) className += ' reveal'

          return (
            <button
              key={option}
              className={className}
              onClick={() => handleAnswer(option)}
              disabled={locked}
            >
              {option}
            </button>
          )
        })}
      </div>

      {feedback && <p className={feedback === 'Certa!' ? 'success-text' : 'error-text'}>{feedback}</p>}
    </div>
  )
