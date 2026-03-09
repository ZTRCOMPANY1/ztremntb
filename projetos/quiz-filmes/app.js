import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const authSection = document.getElementById('authSection');
const homeSection = document.getElementById('homeSection');
const quizSection = document.getElementById('quizSection');
const resultSection = document.getElementById('resultSection');
const rankingSection = document.getElementById('rankingSection');
const adminSection = document.getElementById('adminSection');

const navHomeBtn = document.getElementById('navHomeBtn');
const navRankingBtn = document.getElementById('navRankingBtn');
const navAdminBtn = document.getElementById('navAdminBtn');
const logoutBtn = document.getElementById('logoutBtn');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const movieGrid = document.getElementById('movieGrid');
const rankingTableBody = document.getElementById('rankingTableBody');
const questionCountInput = document.getElementById('questionCount');

const quizMovieName = document.getElementById('quizMovieName');
const quizTitle = document.getElementById('quizTitle');
const quizProgressText = document.getElementById('quizProgressText');
const questionText = document.getElementById('questionText');
const answersContainer = document.getElementById('answersContainer');
const feedbackBox = document.getElementById('feedbackBox');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const finishQuizBtn = document.getElementById('finishQuizBtn');
const liveScore = document.getElementById('liveScore');

const resultTitle = document.getElementById('resultTitle');
const resultScoreText = document.getElementById('resultScoreText');
const resultMessage = document.getElementById('resultMessage');
const playAgainBtn = document.getElementById('playAgainBtn');
const seeRankingBtn = document.getElementById('seeRankingBtn');

const movieForm = document.getElementById('movieForm');
const questionForm = document.getElementById('questionForm');
const questionMovieSelect = document.getElementById('questionMovieSelect');

const toast = document.getElementById('toast');

let currentUser = null;
let currentUsername = '';
let currentIsAdmin = false;
let movies = [];
let currentQuiz = [];
let currentMovie = null;
let currentIndex = 0;
let score = 0;
let answered = false;

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2800);
}

function pseudoEmailFromUsername(username) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@quizlocal.app`;
}

function normalizeUsername(username) {
  return username.trim().replace(/\s+/g, ' ');
}

function hideAllPanels() {
  [authSection, homeSection, quizSection, resultSection, rankingSection, adminSection].forEach((section) => {
    section.classList.remove('active');
    section.classList.add('hidden');
  });
}

function openPanel(panel) {
  hideAllPanels();
  panel.classList.remove('hidden');
  panel.classList.add('active');
}

function getPerformanceMessage(points, total) {
  const percent = total > 0 ? (points / total) * 100 : 0;

  if (percent === 100) return 'Perfeito! Você mandou muito bem!';
  if (percent >= 80) return 'Foi muito bom! Você conhece muito desse filme.';
  if (percent >= 60) return 'Foi bom! Você foi bem no quiz.';
  if (percent >= 40) return 'Dá para melhorar. Continue tentando!';
  return 'Não foi tão bem dessa vez, mas na próxima você consegue.';
}

function shuffleArray(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

async function seedInitialData() {
  const snapshot = await getDocs(collection(db, 'movies'));
  if (!snapshot.empty) return;

  const movieRef = await addDoc(collection(db, 'movies'), {
    title: 'Supernatural',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    description: 'Perguntas sobre a série Supernatural para testar se você conhece Sam, Dean e todo o universo da série.',
    createdAt: serverTimestamp()
  });

  const initialQuestions = [
    {
      question: 'Qual é o nome do carro clássico dirigido por Dean Winchester?',
      options: ['Mustang 1967', 'Impala 1967', 'Camaro 1969', 'Charger 1970'],
      correctIndex: 1
    },
    {
      question: 'Qual é o nome do anjo que se torna um grande aliado dos irmãos?',
      options: ['Gabriel', 'Lucifer', 'Castiel', 'Metatron'],
      correctIndex: 2
    },
    {
      question: 'Como se chama o pai de Sam e Dean?',
      options: ['Bobby Singer', 'John Winchester', 'Samuel Colt', 'Azazel'],
      correctIndex: 1
    },
    {
      question: 'Qual dos irmãos é o mais velho?',
      options: ['Sam', 'Dean', 'Adam', 'Nenhum'],
      correctIndex: 1
    },
    {
      question: 'Qual personagem é conhecido como Rei do Inferno?',
      options: ['Crowley', 'Ruby', 'Balthazar', 'Chuck'],
      correctIndex: 0
    }
  ];

  for (const item of initialQuestions) {
    await addDoc(collection(db, 'movies', movieRef.id, 'questions'), {
      question: item.question,
      options: item.options,
      correctIndex: item.correctIndex,
      createdAt: serverTimestamp()
    });
  }
}

async function loadMovies() {
  movieGrid.innerHTML = '<p>Carregando filmes...</p>';
  questionMovieSelect.innerHTML = '<option value="">Selecione um filme</option>';

  const snapshot = await getDocs(collection(db, 'movies'));
  movies = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));

  if (!movies.length) {
    movieGrid.innerHTML = '<p>Nenhum filme cadastrado ainda.</p>';
    return;
  }

  movieGrid.innerHTML = '';

  movies.forEach((movie) => {
    const card = document.createElement('article');
    card.className = 'movie-card';

    card.innerHTML = `
      <img class="movie-cover" src="${movie.image}" alt="${movie.title}">
      <div class="movie-content">
        <h3>${movie.title}</h3>
        <p>${movie.description}</p>
        <button class="primary-btn" data-movie-id="${movie.id}">Começar quiz</button>
      </div>
    `;

    card.querySelector('button').addEventListener('click', () => startQuiz(movie.id));
    movieGrid.appendChild(card);

    const option = document.createElement('option');
    option.value = movie.id;
    option.textContent = movie.title;
    questionMovieSelect.appendChild(option);
  });
}

async function loadRanking() {
  rankingTableBody.innerHTML = '<tr><td colspan="4">Carregando ranking...</td></tr>';

  const rankingQuery = query(
    collection(db, 'ranking'),
    orderBy('bestScore', 'desc'),
    limit(50)
  );

  const snapshot = await getDocs(rankingQuery);

  if (snapshot.empty) {
    rankingTableBody.innerHTML = '<tr><td colspan="4">Ainda não há pontuações.</td></tr>';
    return;
  }

  rankingTableBody.innerHTML = '';

  snapshot.docs.forEach((docItem, index) => {
    const data = docItem.data();
    const tr = document.createElement('tr');

    let dateText = '-';
    if (data.updatedAt && data.updatedAt.toDate) {
      dateText = data.updatedAt.toDate().toLocaleString('pt-BR');
    }

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${data.username}</td>
      <td>${data.bestScore}</td>
      <td>${dateText}</td>
    `;

    rankingTableBody.appendChild(tr);
  });
}

async function startQuiz(movieId) {
  const quantity = Number(questionCountInput.value);

  if (!quantity || quantity < 1) {
    showToast('Escolha uma quantidade válida de perguntas.');
    return;
  }

  const movie = movies.find((item) => item.id === movieId);
  if (!movie) return;

  const snapshot = await getDocs(collection(db, 'movies', movieId, 'questions'));
  const questions = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));

  if (!questions.length) {
    showToast('Esse filme ainda não tem perguntas cadastradas.');
    return;
  }

  const total = Math.min(quantity, questions.length);

  currentQuiz = shuffleArray(questions).slice(0, total);
  currentMovie = movie;
  currentIndex = 0;
  score = 0;
  liveScore.textContent = '0';

  openPanel(quizSection);
  renderQuestion();
}

function renderQuestion() {
  answered = false;
  feedbackBox.className = 'feedback-box hidden';
  feedbackBox.textContent = '';
  nextQuestionBtn.classList.add('hidden');
  finishQuizBtn.classList.add('hidden');

  const item = currentQuiz[currentIndex];

  quizMovieName.textContent = currentMovie.title;
  quizTitle.textContent = `Quiz de ${currentMovie.title}`;
  quizProgressText.textContent = `Pergunta ${currentIndex + 1} de ${currentQuiz.length}`;
  questionText.textContent = item.question;
  answersContainer.innerHTML = '';

  item.options.forEach((option, index) => {
    const button = document.createElement('button');
    button.className = 'answer-btn';
    button.textContent = option;
    button.addEventListener('click', () => answerQuestion(index));
    answersContainer.appendChild(button);
  });
}

function answerQuestion(selectedIndex) {
  if (answered) return;
  answered = true;

  const item = currentQuiz[currentIndex];
  const buttons = answersContainer.querySelectorAll('.answer-btn');

  buttons.forEach((btn, idx) => {
    btn.disabled = true;

    if (idx === item.correctIndex) btn.classList.add('correct');
    if (idx === selectedIndex && idx !== item.correctIndex) btn.classList.add('wrong');
  });

  feedbackBox.classList.remove('hidden');

  if (selectedIndex === item.correctIndex) {
    score += 10;
    liveScore.textContent = String(score);
    feedbackBox.textContent = 'Resposta correta! Você ganhou 10 pontos.';
    feedbackBox.classList.add('correct');
    feedbackBox.classList.remove('wrong');
  } else {
    feedbackBox.textContent = `Resposta errada. A correta era: ${item.options[item.correctIndex]}`;
    feedbackBox.classList.add('wrong');
    feedbackBox.classList.remove('correct');
  }

  if (currentIndex < currentQuiz.length - 1) {
    nextQuestionBtn.classList.remove('hidden');
  } else {
    finishQuizBtn.classList.remove('hidden');
  }
}

nextQuestionBtn.addEventListener('click', () => {
  currentIndex += 1;
  renderQuestion();
});

finishQuizBtn.addEventListener('click', async () => {
  await saveScore();

  const totalPoints = currentQuiz.length * 10;
  resultTitle.textContent = `${currentMovie.title} concluído!`;
  resultScoreText.textContent = `Você fez ${score} de ${totalPoints} pontos.`;
  resultMessage.textContent = getPerformanceMessage(score, totalPoints);

  openPanel(resultSection);
  await loadRanking();
});

async function saveScore() {
  if (!currentUser) return;

  const rankingRef = doc(db, 'ranking', currentUser.uid);
  const rankingSnap = await getDoc(rankingRef);

  if (!rankingSnap.exists()) {
    await setDoc(rankingRef, {
      username: currentUsername,
      bestScore: score,
      updatedAt: serverTimestamp()
    });
    return;
  }

  const currentBest = rankingSnap.data().bestScore || 0;

  if (score > currentBest) {
    await updateDoc(rankingRef, {
      username: currentUsername,
      bestScore: score,
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(rankingRef, {
      username: currentUsername,
      updatedAt: serverTimestamp()
    });
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = normalizeUsername(document.getElementById('loginUsername').value);
  const password = document.getElementById('loginPassword').value;

  try {
    await signInWithEmailAndPassword(auth, pseudoEmailFromUsername(username), password);
    showToast('Login feito com sucesso.');
    loginForm.reset();
  } catch (error) {
    showToast('Erro no login. Verifique usuário e senha.');
    console.error(error);
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = normalizeUsername(document.getElementById('registerUsername').value);
  const password = document.getElementById('registerPassword').value;

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      pseudoEmailFromUsername(username),
      password
    );

    await setDoc(doc(db, 'users', credential.user.uid), {
      username,
      isAdmin: false,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, 'ranking', credential.user.uid), {
      username,
      bestScore: 0,
      updatedAt: serverTimestamp()
    });

    showToast('Cadastro realizado com sucesso.');
    registerForm.reset();
  } catch (error) {
    showToast('Erro no cadastro. Talvez esse usuário já exista ou a senha seja fraca.');
    console.error(error);
  }
});

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  showToast('Você saiu da conta.');
});

navHomeBtn.addEventListener('click', () => {
  if (!currentUser) return;
  openPanel(homeSection);
});

navRankingBtn.addEventListener('click', async () => {
  if (!currentUser) return;
  await loadRanking();
  openPanel(rankingSection);
});

navAdminBtn.addEventListener('click', () => {
  if (!currentUser || !currentIsAdmin) return;
  openPanel(adminSection);
});

playAgainBtn.addEventListener('click', () => {
  openPanel(homeSection);
});

seeRankingBtn.addEventListener('click', async () => {
  await loadRanking();
  openPanel(rankingSection);
});

movieForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentIsAdmin) {
    showToast('Acesso negado.');
    return;
  }

  const title = document.getElementById('movieTitle').value.trim();
  const image = document.getElementById('movieImage').value.trim();
  const description = document.getElementById('movieDescription').value.trim();

  try {
    await addDoc(collection(db, 'movies'), {
      title,
      image,
      description,
      createdAt: serverTimestamp()
    });

    movieForm.reset();
    showToast('Filme cadastrado com sucesso.');
    await loadMovies();
  } catch (error) {
    showToast('Erro ao cadastrar filme.');
    console.error(error);
  }
});

questionForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!currentIsAdmin) {
    showToast('Acesso negado.');
    return;
  }

  const movieId = questionMovieSelect.value;
  const question = document.getElementById('questionInput').value.trim();
  const options = [
    document.getElementById('option1').value.trim(),
    document.getElementById('option2').value.trim(),
    document.getElementById('option3').value.trim(),
    document.getElementById('option4').value.trim()
  ];
  const correctIndex = Number(document.getElementById('correctAnswer').value);

  try {
    await addDoc(collection(db, 'movies', movieId, 'questions'), {
      question,
      options,
      correctIndex,
      createdAt: serverTimestamp()
    });

    questionForm.reset();
    showToast('Pergunta cadastrada com sucesso.');
  } catch (error) {
    showToast('Erro ao cadastrar pergunta.');
    console.error(error);
  }
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    currentUsername = '';
    currentIsAdmin = false;
    navAdminBtn.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    openPanel(authSection);
    return;
  }

  const userSnap = await getDoc(doc(db, 'users', user.uid));

  if (userSnap.exists()) {
    currentUsername = userSnap.data().username || 'Usuário';
    currentIsAdmin = userSnap.data().isAdmin === true;
  } else {
    currentUsername = 'Usuário';
    currentIsAdmin = false;
  }

  if (currentIsAdmin) {
    navAdminBtn.classList.remove('hidden');
  } else {
    navAdminBtn.classList.add('hidden');
  }

  logoutBtn.classList.remove('hidden');

  await seedInitialData();
  await loadMovies();
  await loadRanking();
  openPanel(homeSection);
});