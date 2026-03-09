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
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const authSection = document.getElementById('authSection');
const homeSection = document.getElementById('homeSection');
const quizSection = document.getElementById('quizSection');
const resultSection = document.getElementById('resultSection');
const rankingSection = document.getElementById('rankingSection');

const navHomeBtn = document.getElementById('navHomeBtn');
const navRankingBtn = document.getElementById('navRankingBtn');
const adminLinkBtn = document.getElementById('adminLinkBtn');
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
  }, 3000);
}

function pseudoEmailFromUsername(username) {
  return `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@quizlocal.app`;
}

function normalizeUsername(username) {
  return username.trim().replace(/\s+/g, ' ');
}

function usernameKey(username) {
  return normalizeUsername(username).toLowerCase();
}

function hideAllPanels() {
  [authSection, homeSection, quizSection, resultSection, rankingSection].forEach((section) => {
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

  if (percent === 100) return 'Perfeito! Você zerou o quiz e foi incrível.';
  if (percent >= 80) return 'Foi muito bom! Você conhece muito bem esse universo.';
  if (percent >= 60) return 'Foi bom! Você mandou bem.';
  if (percent >= 40) return 'Dá para melhorar. Tente mais uma vez.';
  return 'Dessa vez não foi tão bem, mas você pode tentar de novo.';
}

function shuffleArray(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

async function ensureUsernameAvailable(username) {
  const ref = doc(db, 'usernames', usernameKey(username));
  const snap = await getDoc(ref);
  return !snap.exists();
}

async function reserveUsername(username, userId) {
  const ref = doc(db, 'usernames', usernameKey(username));
  await setDoc(ref, {
    username: normalizeUsername(username),
    userId,
    createdAt: serverTimestamp()
  });
}

async function ensureSeeded() {
  const settingsRef = doc(db, 'appConfig', 'seed');
  const settingsSnap = await getDoc(settingsRef);

  if (settingsSnap.exists() && settingsSnap.data().supernaturalSeeded === true) {
    return;
  }

  const movieRef = await addDoc(collection(db, 'movies'), {
    title: 'Supernatural',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    description: '50 perguntas sobre Sam, Dean, Castiel, demônios, anjos, caçadas e todo o universo de Supernatural.',
    createdAt: serverTimestamp()
  });

  const questions = [
    ['Qual é o nome do carro clássico de Dean Winchester?', ['Mustang 1967', 'Impala 1967', 'Camaro 1969', 'Chevelle 1970'], 1],
    ['Quem é o irmão mais velho?', ['Sam', 'Dean', 'Adam', 'John'], 1],
    ['Qual é o nome do pai de Sam e Dean?', ['Bobby Singer', 'Samuel Winchester', 'John Winchester', 'Azazel'], 2],
    ['Qual anjo vira grande aliado dos irmãos?', ['Uriel', 'Gabriel', 'Castiel', 'Metatron'], 2],
    ['Qual personagem é conhecido como Rei do Inferno?', ['Crowley', 'Lucifer', 'Meg', 'Balthazar'], 0],
    ['Como se chama o amigo caçador e figura paterna dos irmãos?', ['Rufus', 'Bobby Singer', 'Garth', 'Ash'], 1],
    ['Qual demônio matou Mary Winchester?', ['Abaddon', 'Azazel', 'Lilith', 'Alastair'], 1],
    ['Qual é o primeiro nome da mãe dos irmãos?', ['Jo', 'Ellen', 'Mary', 'Jessica'], 2],
    ['Qual dos irmãos estudou em Stanford?', ['Dean', 'Sam', 'Adam', 'John'], 1],
    ['Qual é o sobrenome dos protagonistas?', ['Singer', 'Mills', 'Winchester', 'Campbell'], 2],
    ['Como se chama o profeta que também é Deus na série?', ['Chuck', 'Kevin', 'Donatello', 'Jack'], 0],
    ['Quem é a mãe de demônios?', ['Ruby', 'Meg', 'Lilith', 'Eve'], 3],
    ['Como se chama o nephilim filho de Lucifer?', ['Jack', 'Adam', 'Michael', 'Kevin'], 0],
    ['Quem é a namorada de Sam no início da série?', ['Jo', 'Jess', 'Ruby', 'Sarah'], 1],
    ['Qual cavaleiro do inferno aparece muito na série?', ['Abaddon', 'Cain', 'War', 'Famine'], 1],
    ['Quem marca Dean com a Marca de Caim?', ['Crowley', 'Cain', 'Abaddon', 'Lucifer'], 1],
    ['Como se chama a irmã de Deus?', ['Darkness', 'Rowena', 'Naomi', 'Billie'], 0],
    ['Qual é o nome verdadeiro da Darkness?', ['Anna', 'Amara', 'Aurora', 'Annie'], 1],
    ['Qual personagem é mãe de Crowley?', ['Billie', 'Mary', 'Jo', 'Rowena'], 3],
    ['Quem é a bruxa poderosa de cabelo ruivo?', ['Ruby', 'Meg', 'Rowena', 'Charlie'], 2],
    ['Como se chama o filho meio-irmão de Sam e Dean?', ['Jack', 'Adam', 'Ben', 'Kevin'], 1],
    ['Qual personagem usa muito a frase “Saving people, hunting things”?', ['Dean', 'Sam', 'Bobby', 'John'], 0],
    ['Quem matou Lilith?', ['Dean', 'Castiel', 'Sam', 'Bobby'], 2],
    ['Ao matar Lilith, o que Sam acaba liberando?', ['Michael', 'The Darkness', 'Lucifer', 'Leviatãs'], 2],
    ['Qual anjo tenta constantemente controlar Castiel?', ['Naomi', 'Anna', 'Jo', 'Billie'], 0],
    ['Como se chama a hacker genial amiga dos irmãos?', ['Claire', 'Charlie', 'Jody', 'Donna'], 1],
    ['Qual personagem é xerife e aliada dos Winchesters?', ['Jody Mills', 'Bela Talbot', 'Meg', 'Jo Harvelle'], 0],
    ['Quem é o arcanjo irmão de Lucifer que possui Dean em outra linha?', ['Raphael', 'Michael', 'Gabriel', 'Uriel'], 1],
    ['Qual personagem fingiu ser o Trickster antes de revelar ser arcanjo?', ['Michael', 'Lucifer', 'Gabriel', 'Metatron'], 2],
    ['Como se chama o bunker legado aos Homens de Letras?', ['Men of Archives', 'Men of Letters Bunker', 'Hunter House', 'Legacy Vault'], 1],
    ['Quem encontra a tábua demoníaca?', ['Kevin Tran', 'Chuck', 'Donatello', 'Bobby'], 0],
    ['Qual profeta traduz as tábuas?', ['Gabriel', 'Kevin Tran', 'Samandriel', 'Garth'], 1],
    ['Qual criatura invade o purgatório com Castiel?', ['Crowley', 'Dick Roman', 'Lucifer', 'Azazel'], 1],
    ['Quem lidera os leviatãs?', ['Cain', 'Dick Roman', 'Crowley', 'Metatron'], 1],
    ['O que Bobby se torna após morrer?', ['Anjo', 'Fantasma', 'Demônio', 'Ceifador'], 1],
    ['Quem é o ceifador que depois vira Morte?', ['Billie', 'Jo', 'Naomi', 'Anna'], 0],
    ['Qual personagem vira recipiente de Lucifer por um tempo?', ['Sam', 'Dean', 'Cas', 'Nick'], 3],
    ['Como se chama o humano preferido para Lucifer fora Sam?', ['Nick', 'Cole', 'Ben', 'Kevin'], 0],
    ['Quem é a filha de Jimmy Novak?', ['Claire', 'Krissy', 'Kaia', 'Patience'], 0],
    ['Jimmy Novak é o receptáculo de qual personagem?', ['Lucifer', 'Michael', 'Castiel', 'Gabriel'], 2],
    ['Qual personagem costuma dizer “Hello, boys”?', ['Meg', 'Rowena', 'Billie', 'Jody'], 1],
    ['Quem é o vampiro amigo de Benny?', ['Dean', 'Sam', 'Bobby', 'Garth'], 0],
    ['Quem é o lobisomem/caçador excêntrico aliado dos irmãos?', ['Cole', 'Garth', 'Rufus', 'Ash'], 1],
    ['Quem treinou Dean e Sam quando jovens junto ao pai?', ['Rufus', 'John', 'Bela', 'Claire'], 1],
    ['Qual personagem feminina rouba objetos sobrenaturais valiosos?', ['Jo', 'Mary', 'Bela Talbot', 'Ruby'], 2],
    ['Quem é a demônio que teve relação próxima com Sam?', ['Meg', 'Ruby', 'Lilith', 'Abaddon'], 1],
    ['Qual é o nome do anjo adolescente resgatado por Dean e Sam?', ['Samandriel', 'Metatron', 'Uriel', 'Joshua'], 0],
    ['Quem escreve vários livros sobre a vida dos Winchester?', ['Chuck', 'Kevin', 'Bobby', 'Garth'], 0],
    ['Como se chama a organização britânica que cruza com os irmãos?', ['British Hunters', 'Men of Britain', 'British Men of Letters', 'Order of Cain'], 2],
    ['No fim de tudo, qual é a base central dos irmãos?', ['A estrada', 'O bunker', 'A casa de Bobby', 'O céu'], 1]
  ];

  for (const item of questions) {
    await addDoc(collection(db, 'movies', movieRef.id, 'questions'), {
      question: item[0],
      options: item[1],
      correctIndex: item[2],
      createdAt: serverTimestamp()
    });
  }

  await setDoc(settingsRef, {
    supernaturalSeeded: true,
    updatedAt: serverTimestamp()
  });
}

async function loadMovies() {
  movieGrid.innerHTML = '<p>Carregando filmes...</p>';

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
        <button class="primary-btn">Começar quiz</button>
      </div>
    `;

    card.querySelector('button').addEventListener('click', () => startQuiz(movie.id));
    movieGrid.appendChild(card);
  });
}

async function loadRanking() {
  rankingTableBody.innerHTML = '<tr><td colspan="4">Carregando ranking...</td></tr>';

  const rankingQuery = query(collection(db, 'ranking'), orderBy('bestScore', 'desc'), limit(50));
  const snapshot = await getDocs(rankingQuery);

  if (snapshot.empty) {
    rankingTableBody.innerHTML = '<tr><td colspan="4">Ainda não há pontuações.</td></tr>';
    return;
  }

  rankingTableBody.innerHTML = '';

  snapshot.docs.forEach((docItem, index) => {
    const data = docItem.data();

    let dateText = '-';
    if (data.updatedAt && data.updatedAt.toDate) {
      dateText = data.updatedAt.toDate().toLocaleString('pt-BR');
    }

    const tr = document.createElement('tr');
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
    showToast('Esse filme ainda não tem perguntas.');
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
  await setDoc(doc(db, 'ranking', currentUser.uid), {
    username: currentUsername,
    bestScore: score,
    updatedAt: serverTimestamp()
  }, { merge: true });

  const totalPoints = currentQuiz.length * 10;
  resultTitle.textContent = `${currentMovie.title} concluído!`;
  resultScoreText.textContent = `Você fez ${score} de ${totalPoints} pontos.`;
  resultMessage.textContent = getPerformanceMessage(score, totalPoints);

  openPanel(resultSection);
  await loadRanking();
});

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

  if (username.length < 3) {
    showToast('O nome de usuário precisa ter pelo menos 3 caracteres.');
    return;
  }

  try {
    const available = await ensureUsernameAvailable(username);

    if (!available) {
      showToast('Esse nome de usuário já existe.');
      return;
    }

    const credential = await createUserWithEmailAndPassword(
      auth,
      pseudoEmailFromUsername(username),
      password
    );

    await reserveUsername(username, credential.user.uid);

    await setDoc(doc(db, 'users', credential.user.uid), {
      username,
      usernameKey: usernameKey(username),
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
    showToast('Erro no cadastro. Talvez a senha seja fraca ou houve conflito no cadastro.');
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

playAgainBtn.addEventListener('click', () => {
  openPanel(homeSection);
});

seeRankingBtn.addEventListener('click', async () => {
  await loadRanking();
  openPanel(rankingSection);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    currentUsername = '';
    currentIsAdmin = false;
    logoutBtn.classList.add('hidden');
    adminLinkBtn.classList.add('hidden');
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
    adminLinkBtn.classList.remove('hidden');
  } else {
    adminLinkBtn.classList.add('hidden');
  }

  logoutBtn.classList.remove('hidden');

  await ensureSeeded();
  await loadMovies();
  await loadRanking();
  openPanel(homeSection);
});