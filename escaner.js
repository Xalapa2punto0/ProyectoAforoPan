// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD-A3y3lM1HuF39qkmFwmd-ghTj3iIV7_A",
  authDomain: "proyecto-xi-asamblea-estatal.firebaseapp.com",
  projectId: "proyecto-xi-asamblea-estatal",
  storageBucket: "proyecto-xi-asamblea-estatal.firebasestorage.app",
  messagingSenderId: "357293578039",
  appId: "1:357293578039:web:19cfe783ed9fb938ee6cb2"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const readerEl = document.getElementById('reader');
const btnReintentar = document.getElementById('btnReintentar');
const confirmacion = document.getElementById('confirmacion');
const contadorEl = document.getElementById('contador');

let video, canvas, ctx, animationId;
let scanning = false;
let presenteCount = 0;

// Mostrar confirmación visual
function mostrarConfirmacion(texto, tipo='exito'){
  confirmacion.textContent = texto;
  confirmacion.className = tipo;
  confirmacion.style.display='flex';
  setTimeout(()=>{
    confirmacion.style.display='none';
    iniciarEscaner();
  },1500);
}

// Actualizar contador
function actualizarContador(){
  contadorEl.textContent = `Usuarios presentes: ${presenteCount}`;
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
    if(snap.data().presente){
      mostrarConfirmacion(`Ya presente ✅`,'exito');
      return;
    }
    ref.update({presente:true}).then(()=>{
      const data = snap.data();
      presenteCount++;
      actualizarContador();
      mostrarConfirmacion(`✅ ${data.nombre} (${data.municipio})`,'exito');
    });
  }).catch(err=>{
    console.error(err);
    mostrarConfirmacion('Error ❌','error');
  });
}

// Rotar imagen en canvas
function rotateCanvas(imageData, width, height, angle){
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const offCtx = offCanvas.getContext('2d');
  offCtx.putImageData(imageData,0,0);
  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = width;
  rotCanvas.height = height;
  const rotCtx = rotCanvas.getContext('2d');
  rotCtx.translate(width/2,height/2);
  rotCtx.rotate(angle*Math.PI/180);
  rotCtx.translate(-width/2,-height/2);
  rotCtx.drawImage(offCanvas,0,0);
  return rotCtx.getImageData(0,0,width,height);
}

// Escaneo frame a frame con rotaciones
function tick(){
  if(video.readyState === video.HAVE_ENOUGH_DATA){
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const boxSizeW = video.videoWidth*0.8;
    const boxSizeH = video.videoHeight*0.8;
    const offsetX = (video.videoWidth-boxSizeW)/2;
    const offsetY = (video.videoHeight-boxSizeH)/2;

    ctx.drawImage(video,offsetX,offsetY,boxSizeW,boxSizeH,0,0,canvas.width,canvas.height);

    let imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;
    for(let i=0;i<data.length;i+=4){
      const gray = 0.299*data[i]+0.587*data[i+1]+0.114*data[i+2];
      data[i]=data[i+1]=data[i+2]=gray;
    }
    ctx.putImageData(imageData,0,0);

    // Guía visual
    ctx.strokeStyle='lime';
    ctx.lineWidth=4;
    const guideSize = Math.min(canvas.width,canvas.height)*0.6;
    ctx.strokeRect((canvas.width-guideSize)/2,(canvas.height-guideSize)/2,guideSize,guideSize);

    // Intentar varias rotaciones: 0°, ±15°, ±30°
    const angles = [0,15,-15,30,-30];
    let code = null;
    for(let ang of angles){
      const rotatedData = ang===0 ? imageData : rotateCanvas(imageData,canvas.width,canvas.height,ang);
      code = jsQR(rotatedData.data,canvas.width,canvas.height);
      if(code) break;
    }
    if(code){
      cancelAnimationFrame(animationId);
      scanning=false;
      procesarQR(code.data);
      return;
    }
  }
  if(scanning) animationId=requestAnimationFrame(tick);
}

// Iniciar escáner
function iniciarEscaner(){
  if(scanning) return;
  scanning=true;

  readerEl.innerHTML='';
  video=document.createElement('video');
  video.setAttribute('playsinline',true);
  video.style.width='100%';
  readerEl.appendChild(video);

  canvas=document.createElement('canvas');
  ctx=canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})
    .then(stream=>{
      video.srcObject=stream;
      video.play();
      animationId=requestAnimationFrame(tick);
    })
    .catch(err=>{
      console.error('No se pudo acceder a la cámara',err);
      mostrarConfirmacion('Error cámara ❌','error');
    });
}

// Botón reintentar
btnReintentar.addEventListener('click',()=>{scanning=false; iniciarEscaner();});

// Inicializar
window.onload = ()=>{
  db.collection('usuarios').where('presente','==',true).get().then(snap=>{
    presenteCount = snap.size;
    actualizarContador();
  });
  iniciarEscaner();
};
