// --- Firebase configuración ---
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Referencias DOM ---
const readerEl = document.getElementById("reader");
const confirmacion = document.getElementById("confirmacion");
const ultimoUsuarioEl = document.getElementById("ultimoUsuario");

let video, canvas, ctx, scanning = false;

// --- Mostrar confirmación ---
function mostrarConfirmacion(msg, tipo = "exito") {
  confirmacion.textContent = msg;
  confirmacion.className = tipo === "error" ? "confirmacion error" : "confirmacion";
  confirmacion.style.display = "block";
  setTimeout(() => (confirmacion.style.display = "none"), 2000);
}

// --- Procesar QR ---
async function procesarQR(qrText) {
  const docId = qrText.trim();
  if (!docId) return;

  try {
    const ref = db.collection("usuarios").doc(docId);
    const snap = await ref.get();

    if (!snap.exists) {
      mostrarConfirmacion("Usuario no encontrado ❌", "error");
      return;
    }

    const data = snap.data();
    if (!data.presente) await ref.update({ presente: true });

    ultimoUsuarioEl.textContent = `✅ ${data.nombre} (${data.municipio})`;
    mostrarConfirmacion("Usuario registrado ✅");
  } catch (err) {
    console.error(err);
    mostrarConfirmacion("Error en Firestore ❌", "error");
  }
}

// --- Detección con rotaciones ---
function rotateCanvas(imageData, width, height, angle) {
  const offCanvas = document.createElement("canvas");
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext("2d");
  offCtx.putImageData(imageData, 0, 0);
  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = width;
  rotCanvas.height = height;
  const rotCtx = rotCanvas.getContext("2d");
  rotCtx.translate(width / 2, height / 2);
  rotCtx.rotate((angle * Math.PI) / 180);
  rotCtx.translate(-width / 2, -height / 2);
  rotCtx.drawImage(offCanvas, 0, 0);
  return rotCtx.getImageData(0, 0, width, height);
}

// --- Escaneo frame a frame ---
function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    let img = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const angles = [0, 15, -15, 30, -30];
    let code = null;
    for (let a of angles) {
      const rotated = a === 0 ? img : rotateCanvas(img, canvas.width, canvas.height, a);
      code = jsQR(rotated.data, canvas.width, canvas.height);
      if (code) break;
    }

    if (code) {
      scanning = false;
      video.srcObject.getTracks().forEach((t) => t.stop());
      procesarQR(code.data);
      setTimeout(iniciarEscaner, 1500);
      return;
    }
  }
  if (scanning) requestAnimationFrame(tick);
}

// --- Iniciar escáner ---
function iniciarEscaner() {
  if (scanning) return;
  scanning = true;

  readerEl.innerHTML = "";
  video = document.createElement("video");
  video.setAttribute("playsinline", true);
  video.style.width = "100%";
  readerEl.appendChild(video);

  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
      requestAnimationFrame(tick);
    })
    .catch((err) => {
      console.error("Error cámara", err);
      mostrarConfirmacion("No se pudo acceder a la cámara ❌", "error");
    });
}

window.onload = iniciarEscaner;
