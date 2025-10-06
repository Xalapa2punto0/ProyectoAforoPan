import { db } from './firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { BrowserMultiFormatReader } from 'https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/+esm';

const video = document.getElementById('video');
const mensaje = document.getElementById('mensaje');
const btnReintentar = document.getElementById('btnReintentar');
const alerta = document.getElementById('alerta');
const codeReader = new BrowserMultiFormatReader();

let currentStream = null;
let scanning = false;

btnReintentar.addEventListener("click", () => {
  detenerCamara();
  iniciarCamara();
});

function mostrarAlerta(texto, tipo) {
  alerta.textContent = texto;
  alerta.className = tipo === 'exito' ? 'exito' : 'error';
  setTimeout(() => alerta.className = 'oculto', 2500);
}

async function iniciarCamara() {
  try {
    // Solicita permisos antes de asignar el stream
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    currentStream = stream;

    video.srcObject = stream;
    await video.play(); // 🔹 esto fuerza que el video muestre lo que ve la cámara
    mensaje.textContent = "Cámara lista. Escanea el código QR.";

    if (!scanning) {
      scanning = true;
      escanearQR();
    }

  } catch (error) {
    console.error("Error al iniciar cámara:", error);
    mensaje.textContent = "No se pudo acceder a la cámara. Revisa permisos o HTTPS.";
    mostrarAlerta("No se pudo acceder a la cámara", "error");
  }
}

function detenerCamara() {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  scanning = false;
}

async function escanearQR() {
  try {
    const result = await codeReader.decodeOnceFromVideoDevice(undefined, video);
    if (result) procesarQR(result.getText().trim());
  } catch (err) {
    console.warn("Esperando lectura QR...");
    if (scanning) setTimeout(escanearQR, 500);
  }
}

async function procesarQR(docId) {
  if (!docId) return;
  try {
    const ref = doc(db, "usuarios", docId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      mensaje.textContent = "Usuario no encontrado.";
      mostrarAlerta("Usuario no encontrado", "error");
    } else {
      await setDoc(ref, { presente: true }, { merge: true });
      mensaje.textContent = `✅ Asistencia registrada: ${snap.data().nombre} (${snap.data().municipio})`;
      mostrarAlerta("Asistencia registrada", "exito");
    }
  } catch (e) {
    console.error("Error al registrar asistencia:", e);
    mensaje.textContent = "Error al registrar asistencia.";
    mostrarAlerta("Error al registrar", "error");
  }

  setTimeout(escanearQR, 2000);
}

iniciarCamara();
