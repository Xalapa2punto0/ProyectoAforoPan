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

let video, canvas, ctx, animationId;
let scanning = false;

// Mostrar confirmación visual
function mostrarConfirmacion(texto, tipo='exito'){
  confirmacion.textContent = texto;
  confirmacion.className = tipo;
  confirmacion.style.display='flex';
  setTimeout(()=>{
    confirmacion.style.display='none';
    iniciarEscaner(); // Reinicia automáticamente
  },2000);
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

// Escaneo frame a frame
function tick(){
  if(video.readyState === video.HAVE_ENOUGH_DATA){
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Recorte central del frame (80%)
    const boxSizeW = video.videoWidth * 0.8;
    const boxSizeH = video.videoHeight * 0.8;
    const offsetX = (video.videoWidth - boxSizeW)/2;
    const offsetY = (video.videoHeight - boxSizeH)/2;

    ctx.drawImage(video, offsetX, offsetY, boxSizeW, boxSizeH, 0, 0, canvas.width, canvas.height);

    // Obtener imagen y convertir a gris
    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;
    for(let i=0;i<data.length;i+=4){
      const gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
      data[i]=data[i+1]=data[i+2]=gray;
    }
    ctx.putImageData(imageData,0,0);

    // Dibujar guía visual
    ctx.strokeStyle='lime';
    ctx.lineWidth=4;
    const guideSize = Math.min(canvas.width, canvas.height)*0.6;
    ctx.strokeRect((canvas.width-guideSize)/2,(canvas.height-guideSize)/2,guideSize,guideSize);

    // Leer QR
    const code = jsQR(data, canvas.width, canvas.height);
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

// Botón reintentar
btnReintentar.addEventListener('click',()=>{scanning=false; iniciarEscaner();});
window.onload = iniciarEscaner;
