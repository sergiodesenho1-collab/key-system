let stream = null;
let faceMatcher = null;
let faceApiReady = false;
const modelPath = './models';

/* =========================
   CAMERA
========================= */
async function startCamera(videoId) {
  const video = document.getElementById(videoId);

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("Erro ao abrir câmera: " + err);
  }
}

/* =========================
   PARAR CAMERA
========================= */
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

function setMessage(id, text, timeout = 4000) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = text;
  if (timeout > 0) {
    setTimeout(() => {
      if (el.innerText === text) {
        el.innerText = "";
      }
    }, timeout);
  }
}

/* =========================
   CARREGAR MODELOS IA
========================= */
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
}

/* =========================
   PEGAR FACES DO STORAGE
========================= */
function getFaces() {
  return JSON.parse(localStorage.getItem("faces")) || [];
}

function saveFaces(faces) {
  localStorage.setItem("faces", JSON.stringify(faces));
}

function findUserByEmail(email) {
  const lower = email?.toLowerCase();
  return getFaces().find(face => face.email.toLowerCase() === lower);
}

function captureImageFromVideo(video, canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width = 300;
  canvas.height = 220;
  ctx.drawImage(video, 0, 0, 300, 220);
  return canvas.toDataURL("image/png");
}

/* =========================
   TREINAR MODELO
========================= */
function trainFaces() {
  const faces = getFaces().filter(face => face.descriptor && face.descriptor.length);

  if (!faces.length) {
    faceMatcher = null;
    return;
  }

  const labeled = faces.map(face =>
    new faceapi.LabeledFaceDescriptors(
      face.name,
      [new Float32Array(face.descriptor)]
    )
  );

  faceMatcher = new faceapi.FaceMatcher(labeled);
}

/* =========================
   CADASTRAR ROSTO
========================= */
async function captureFaceLogin() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvasLogin");
  const name = document.getElementById("faceName").value;
  const email = document.getElementById("faceEmail").value;
  const matricula = document.getElementById("faceMatricula").value;

  if (!name || !email || !matricula) {
    alert("Preencha nome, e-mail e matrícula para cadastrar.");
    return;
  }

  const faces = getFaces();
  if (faces.find(face => face.email.toLowerCase() === email.toLowerCase())) {
    alert("E-mail já cadastrado.");
    return;
  }

  let descriptor = null;
  let image = null;

  image = captureImageFromVideo(video, canvas);

  if (faceApiReady) {
    const detection = await faceapi
      .detectSingleFace(video)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setMessage("faceMsg", "❌ Nenhum rosto detectado");
      return;
    }

    descriptor = Array.from(detection.descriptor);
  }

  faces.push({
    name,
    email,
    matricula,
    descriptor,
    image,
    registeredAt: new Date().toLocaleString()
  });

  saveFaces(faces);
  trainFaces();
  renderRegisteredUsers();

  setMessage("faceMsg", "✔ Rosto cadastrado com sucesso");
}

/* =========================
   MOSTRAR BOX CADASTRO
========================= */
function showRegisterBox() {
  const box = document.getElementById("registerBox");

  if (box.style.display === "none") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

/* =========================
   LOGIN FACIAL
========================= */
async function authenticateFace() {
  const video = document.getElementById("video");
  const email = document.getElementById("loginEmail").value;
  const msg = document.getElementById("loginMsg");
  const users = getFaces();

  if (!faceApiReady || !faceMatcher) {
    if (!users.length) {
      setMessage("loginMsg", "❌ Nenhum usuário cadastrado.");
      return;
    }

    const user = email
      ? users.find(face => face.email.toLowerCase() === email.toLowerCase())
      : users[users.length - 1];

    if (!user) {
      setMessage("loginMsg", "❌ E-mail não cadastrado.");
      return;
    }

    setMessage("loginMsg", `⚠ Sistema facial indisponível. Entrando como ${user.name}`, 6000);
    localStorage.setItem("currentUser", user.email);
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);
    return;
  }

  const detection = await faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    setMessage("loginMsg", "❌ Nenhum rosto detectado");
    return;
  }

  const result = faceMatcher.findBestMatch(detection.descriptor);

  if (result.label === "unknown") {
    setMessage("loginMsg", "❌ Usuário não reconhecido");
    return;
  }

  setMessage("loginMsg", "✔ Bem-vindo " + result.label, 6000);
  const user = users.find(face => face.name === result.label);
  localStorage.setItem("currentUser", user?.email || result.label);

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 1200);
}

/* =========================
   LOGIN MANUAL
========================= */
function login() {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;

  if (!email || !pass) {
    alert("Preencha todos os campos");
    return;
  }

  const faces = getFaces();
  const user = faces.find(face => face.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    alert("E-mail não cadastrado. Cadastre o rosto primeiro.");
    return;
  }

  if (user.matricula !== pass) {
    alert("Senha incorreta.");
    return;
  }

  localStorage.setItem("currentUser", email);
  window.location.href = "dashboard.html";
}

/* =========================
   IR PARA DASHBOARD
========================= */
function goToDashboard() {
  window.location.href = "dashboard.html";
}

/* =========================
   INIT SISTEMA
========================= */
window.onload = async () => {
  try {
    await loadModels();
    faceApiReady = true;
    trainFaces();

    setMessage("loginMsg", "✔ Sistema pronto para uso", 6000);
  } catch (e) {
    faceApiReady = false;
    setMessage("loginMsg", "⚠ Sistema facial não carregou. Use login por e-mail/senha.", 8000);
    console.warn("Face API não carregou", e);
  }
};