import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const movieForm = document.getElementById('movieForm');
const questionForm = document.getElementById('questionForm');
const questionMovieSelect = document.getElementById('questionMovieSelect');
const adminMovieList = document.getElementById('adminMovieList');
const logoutBtn = document.getElementById('logoutBtn');
const toast = document.getElementById('toast');

let currentUser = null;
let currentIsAdmin = false;
let movies = [];

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

async function loadMovies() {
  questionMovieSelect.innerHTML = '<option value="">Selecione um filme</option>';
  adminMovieList.innerHTML = '<p>Carregando filmes...</p>';

  const snapshot = await getDocs(collection(db, 'movies'));
  movies = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));

  if (!movies.length) {
    adminMovieList.innerHTML = '<p>Nenhum filme cadastrado.</p>';
    return;
  }

  adminMovieList.innerHTML = '';

  movies.forEach((movie) => {
    const option = document.createElement('option');
    option.value = movie.id;
    option.textContent = movie.title;
    questionMovieSelect.appendChild(option);

    const item = document.createElement('div');
    item.className = 'admin-movie-item';
    item.innerHTML = `
      <strong>${movie.title}</strong>
      <span>${movie.description}</span>
    `;
    adminMovieList.appendChild(item);
  });
}

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

  if (!movieId) {
    showToast('Selecione um filme.');
    return;
  }

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

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'index.html';
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const userSnap = await getDoc(doc(db, 'users', user.uid));

  if (!userSnap.exists()) {
    window.location.href = 'index.html';
    return;
  }

  currentIsAdmin = userSnap.data().isAdmin === true;

  if (!currentIsAdmin) {
    window.location.href = 'index.html';
    return;
  }

  await loadMovies();
});