// Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const readerEl = document.getElementById('reader');
const btnReintentar = document.getElementById('btnReintentar');
const confirmacion = document.getElementById('confirmacion');

let video;
let canvas, ctx;
let animationId;
let scanning = false;

// Mostrar confirmación
function mostrarConfirmacion(texto, tipo='exito'){
  confirmacion.textContent = texto;
  confirmacion.className = tipo;
  confirmacion.style.display='flex';
  setTimeout(()=>{confirmacion.style.display='none'; iniciarEscaner();},2000);
}

// Procesar QR
function procesarQR(qrText){
  const docId = (qrText||'').trim();
  if(!docId) return;

  const ref = db.collection('usuarios').doc(docId);
  ref.get().then(snap=>{
    if(!snap.exists){
      mostrarConfirmacion('Usuario no encontrado ❌','error');
      return;
    }
    ref.update({presente:true}).then(()=>{
      const data = snap.data();
      mostrarConfirmacion(`✅ ${data.nombre} (${data.municipio})`,'exito');
    });
  }).catch(err=>{
    console.error(err);
    mostrarConfirmacion('Error al registrar ❌','error');
  });
}

// Loop para leer QR desde el video
function tick(){
  if(video.readyState === video.HAVE_ENOUGH_DATA){
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);
    if(code){
      cancelAnimationFrame(animationId);
      scanning=false;
      procesarQR(code.data);
      return;
    }
  }
  if(scanning) animationId = requestAnimationFrame(tick);
}

// Iniciar escáner
function iniciarEscaner(){
  if(scanning) return;
  scanning=true;

  readerEl.innerHTML='';
  video = document.createElement('video');
  video.setAttribute('playsinline',true);
  video.style.width='100%';
  readerEl.appendChild(video);

  canvas = document.createElement('canvas');
  ctx = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})
    .then(stream=>{
      video.srcObject = stream;
      video.play();
      animationId = requestAnimationFrame(tick);
    })
    .catch(err=>{
      console.error('No se pudo acceder a la cámara',err);
      mostrarConfirmacion('Error cámara ❌','error');
    });
}

btnReintentar.addEventListener('click',()=>{scanning=false; iniciarEscaner();});
window.onload = iniciarEscaner;
