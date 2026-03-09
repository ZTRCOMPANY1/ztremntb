import { useState } from 'react'

    await setDoc(doc(db, 'movies', movieId), {
      name: movieName,
      description: movieDescription,
      image: movieImage,
      totalQuestions: 0,
      createdAt: Date.now()
    })

    setMessage('Filme/série criado com sucesso.')
  

  async function handleAddQuestion(e) {
    e.preventDefault()
    setMessage('')

    const movieRef = doc(db, 'movies', movieId)
    const movieSnap = await getDoc(movieRef)

    if (!movieSnap.exists()) {
      setMessage('Crie o filme/série primeiro.')
      return
    }

    await addDoc(collection(db, 'movies', movieId, 'questions'), {
      question,
      options: [optionA, optionB, optionC, optionD],
      correctAnswer,
      createdAt: Date.now()
    })

    await updateDoc(movieRef, {
      totalQuestions: (movieSnap.data().totalQuestions || 0) + 1
    })

    setQuestion('')
    setOptionA('')
    setOptionB('')
    setOptionC('')
    setOptionD('')
    setCorrectAnswer('')
    setMessage('Pergunta adicionada com sucesso.')
  }

  return (
    <div className="admin-grid">
      <form className="panel-box" onSubmit={handleCreateMovie}>
        <h2>Criar card de filme/série</h2>
        <input value={movieId} onChange={(e) => setMovieId(e.target.value)} placeholder="ID: supernatural" required />
        <input value={movieName} onChange={(e) => setMovieName(e.target.value)} placeholder="Nome" required />
        <textarea value={movieDescription} onChange={(e) => setMovieDescription(e.target.value)} placeholder="Descrição" required />
        <input value={movieImage} onChange={(e) => setMovieImage(e.target.value)} placeholder="URL da imagem" />
        <button className="primary-btn" type="submit">Salvar card</button>
      </form>

      <form className="panel-box" onSubmit={handleAddQuestion}>
        <h2>Adicionar pergunta</h2>
        <input value={movieId} onChange={(e) => setMovieId(e.target.value)} placeholder="ID do filme/série" required />
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pergunta" required />
        <input value={optionA} onChange={(e) => setOptionA(e.target.value)} placeholder="Opção A" required />
        <input value={optionB} onChange={(e) => setOptionB(e.target.value)} placeholder="Opção B" required />
        <input value={optionC} onChange={(e) => setOptionC(e.target.value)} placeholder="Opção C" required />
        <input value={optionD} onChange={(e) => setOptionD(e.target.value)} placeholder="Opção D" required />
        <input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} placeholder="Resposta correta (texto exato)" required />
        <button className="primary-btn" type="submit">Adicionar pergunta</button>
        {message && <p>{message}</p>}
      </form>
    </div>
  )
