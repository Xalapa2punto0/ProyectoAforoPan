import { db } from './firebase-config.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { BrowserMultiFormatReader } from 'https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/+esm';

const video = document.getElementById('video');
const mensaje = document.getElementById('mensaje');

const codeReader = new BrowserMultiFormatReader();
codeReader
  .listVideoInputDevices()
  .then(videoInputDevices => {
    const deviceId = videoInputDevices[0]?.deviceId;
    codeReader.decodeFromVideoDevice(deviceId, video, async (result, err) => {
      if (result) {
        const docId = result.getText(); // El QR debe contener el nombre del documento
        try {
          const usuarioRef = doc(db, "usuarios", docId);
          const snapshot = await getDoc(usuarioRef);
          if (!snapshot.exists()) {
            mensaje.textContent = `Usuario no encontrado: ${docId}`;
            return;
          }
          await setDoc(usuarioRef, { presente: true }, { merge: true });
          mensaje.textContent = `Asistencia marcada: ${snapshot.data().nombre} (${snapshot.data().municipio})`;
        } catch(e) {
          mensaje.textContent = "Error al marcar asistencia";
          console.error(e);
        }
      }
    });
  })
  .catch(err => console.error(err));
