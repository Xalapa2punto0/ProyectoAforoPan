// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-A3y3lM1HuF39qkmFwmd-ghTj3iIV7_A",
  authDomain: "proyecto-xi-asamblea-estatal.firebaseapp.com",
  projectId: "proyecto-xi-asamblea-estatal",
  storageBucket: "proyecto-xi-asamblea-estatal.firebasestorage.app",
  messagingSenderId: "357293578039",
  appId: "1:357293578039:web:19cfe783ed9fb938ee6cb2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // <--- db debe ser instancia de Firestore
export { db };
