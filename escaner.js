// Configura Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const readerEl = document.getElementById('reader');
const mensaje = document.getElementById('mensaje');
const btnReintentar = document.getElementById('btnReintentar');
const alerta = document.getElementById('alerta');

let html5QrCode;
let running = false;

function mostrarAlerta(texto, tipo='exito'){
  alerta.textContent = texto;
  alerta.className = tipo==='error'?'error':'exito';
  alerta.style.display='block';
  setTimeout(()=>alerta.style.display='none',2500);
}

function procesarCodigo(texto){
  const docId = (texto||'').trim();
  if(!docId) return;

  mensaje.textContent = `Leyendo: ${docId}...`;
  const ref = db.collection('usuarios').doc(docId);

  ref.get().then(snap=>{
    if(!snap.exists){
      mensaje.textContent='Usuario no encontrado.';
      mostrarAlerta('Usuario no encontrado','error');
      return;
    }
    ref.update({presente:true}).then(()=>{
      const data = snap.data();
      mensaje.textContent = `✅ Asistencia: ${data.nombre} (${data.municipio})`;
      mostrarAlerta('Asistencia registrada','exito');
      if(running) html5QrCode.stop();
      running=false;
    });
  }).catch(err=>{
    console.error(err);
    mostrarAlerta('Error al registrar asistencia','error');
  });
}

// Función que espera a que Html5Qrcode exista
function waitForHtml5Qrcode(callback){
  if(window.Html5Qrcode) callback();
  else setTimeout(()=>waitForHtml5Qrcode(callback),100);
}

function iniciarEscaner(){
  waitForHtml5Qrcode(async ()=>{
    try{
      if(html5QrCode && running) await html5QrCode.stop();

      html5QrCode = new Html5Qrcode("reader");
      const config = {fps:10, qrbox:{width:250,height:250}};
      await html5QrCode.start({facingMode:"environment"},config,procesarCodigo);

      running=true;
      mensaje.textContent='Cámara lista. Apunta al QR.';
    }catch(err){
      console.error('No se pudo iniciar el escáner:',err);
      mostrarAlerta('Error de cámara','error');
    }
  });
}

btnReintentar.addEventListener('click',iniciarEscaner);
iniciarEscaner();
