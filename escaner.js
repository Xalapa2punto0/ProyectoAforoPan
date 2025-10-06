// escaner.js (módulo)
import { db } from './firebase-config.js'; // asumo que exportas `db` (Firestore)
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const readerEl = document.getElementById('reader');
const mensaje = document.getElementById('mensaje');
const btnReintentar = document.getElementById('btnReintentar');
const alerta = document.getElementById('alerta');

let html5QrCode = null;
let running = false;

function mostrarAlerta(texto, tipo = 'exito') {
  alerta.textContent = texto;
  alerta.className = tipo === 'error' ? 'error' : 'exito';
  alerta.style.display = 'block';
  setTimeout(()=> { alerta.style.display = 'none'; }, 2500);
}

async function ensureHtml5Qrcode() {
  if (window.Html5Qrcode) return;
  // carga dinámica desde CDN (versión fija para estabilidad)
  const src = 'https://unpkg.com/html5-qrcode@2.3.8/minified/html5-qrcode.min.js';
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => {
      if (window.Html5Qrcode) resolve();
      else reject(new Error('Html5Qrcode no se registró en window'));
    };
    s.onerror = (e) => reject(new Error('Error cargando html5-qrcode: ' + e.message));
    document.head.appendChild(s);
  });
}

async function procesarCodigo(texto) {
  const docId = (texto || '').trim();
  if (!docId) { mensaje.textContent = 'QR vacío'; mostrarAlerta('QR vacío', 'error'); return; }

  mensaje.textContent = `Leyendo: ${docId} ...`;
  try {
    const userRef = doc(db, 'usuarios', docId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      mensaje.textContent = 'Usuario no encontrado.';
      mostrarAlerta('Usuario no encontrado', 'error');
      return;
    }
    // actualiza campo presente/asistencia
    await updateDoc(userRef, { presente: true });
    const data = snap.data();
    mensaje.textContent = `✅ Asistencia registrada: ${data.nombre} (${data.municipio})`;
    mostrarAlerta('Asistencia registrada', 'exito');
  } catch (err) {
    console.error('Error al marcar asistencia:', err);
    mensaje.textContent = 'Error al marcar asistencia';
    mostrarAlerta('Error al marcar asistencia', 'error');
  }
}

async function iniciarEscaner() {
  try {
    // asegurarse de que la librería esté cargada
    await ensureHtml5Qrcode();

    // si ya había un escáner corriendo, detenerlo
    if (html5QrCode && running) {
      await html5QrCode.stop().catch(()=>{});
      running = false;
    }

    html5QrCode = new Html5Qrcode("reader");

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    await html5QrCode.start(
      { facingMode: "environment" }, // usa trasera si existe
      config,
      (decodedText, result) => {
        // Al leer, procesar y seguir corriendo o detener según prefieras
        procesarCodigo(decodedText);
        // opcional: si quieres detener tras 1 lectura descomenta:
        // html5QrCode.stop();
      },
      (errorMessage) => {
        // errores menores mientras busca; no mostrar al usuario
        // console.debug('scan error', errorMessage);
      }
    );

    running = true;
    mensaje.textContent = 'Cámara lista. Apunta al QR.';
  } catch (err) {
    console.error('No se pudo iniciar el escáner:', err);
    mensaje.textContent = 'No se pudo acceder a la cámara. Revisa permisos/HTTPS.';
    mostrarAlerta('No se pudo acceder a la cámara', 'error');
  }
}

btnReintentar.addEventListener('click', async () => {
  try {
    if (html5QrCode && running) {
      await html5QrCode.stop();
      running = false;
    }
  } catch(e){/* ignore */}
  iniciarEscaner();
});

// arranque automático
iniciarEscaner();
