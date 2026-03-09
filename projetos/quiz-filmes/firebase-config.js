import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCnaqucwCYfeNYRNZWTjxoybYDc5R5-2lI',
  authDomain: 'quiz-filme-6cbf4.firebaseapp.com',
  projectId: 'quiz-filme-6cbf4',
  storageBucket: 'quiz-filme-6cbf4.firebasestorage.app',
  messagingSenderId: '247174519652',
  appId: '1:247174519652:web:4981a91be7cb21826db871'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };