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

let html5QrCode;
let running = false;

function mostrarConfirmacion(texto, tipo='exito'){
  confirmacion.textContent = texto;
  confirmacion.className = tipo;
  confirmacion.style.display='flex';
  setTimeout(()=>{
    confirmacion.style.display='none';
    iniciarEscaner(); // Reinicia automáticamente
  }, 2000);
}

function procesarCodigo(texto){
  const docId = (texto||'').trim();
  if(!docId) return;

  const ref = db.collection('usuarios').doc(docId);
  ref.get().then(snap=>{
    if(!snap.exists){
      mostrarConfirmacion('Usuario no encontrado ❌','error');
      if(running) html5QrCode.stop();
      running=false;
      return;
    }
    ref.update({presente:true}).then(()=>{
      const data = snap.data();
      mostrarConfirmacion(`✅ ${data.nombre} (${data.municipio})`,'exito');
      if(running) html5QrCode.stop();
      running=false;
    });
  }).catch(err=>{
    console.error(err);
    mostrarConfirmacion('Error al registrar ❌','error');
    if(running) html5QrCode.stop();
    running=false;
  });
}

function iniciarEscaner(){
  if(!window.Html5Qrcode) return setTimeout(iniciarEscaner,100);
  if(html5QrCode && running) html5QrCode.stop();
  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    {facingMode:"environment"},
    {fps:10, qrbox:{width:250,height:250}},
    procesarCodigo
  ).then(()=>{running=true;})
  .catch(err=>{
    console.error('No se pudo iniciar el escáner:',err);
  });
}

btnReintentar.addEventListener('click', iniciarEscaner);
window.onload = iniciarEscaner;
