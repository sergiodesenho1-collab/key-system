let rooms = {};
let keys = {};
let keyHistory = [];

let selectedKey = "";
let stream = null;
let detectedUser = null;

/* =========================
   SALAS
========================= */
const listRooms = [
  "Sala 01","Sala 02","Sala 03","Sala 04","Sala 05",
  "Sala 06","Sala 07","Sala 08","Sala 09","Sala 10",
  "Lab 01","Lab 02","Lab 03",
  "Enfermagem 01","Enfermagem 02",
  "Cozinha 01","Cozinha 02",
  "Auditório"
];

/* =========================
   INIT
========================= */
window.onload = () => {
  const user = requireLogin();
  if (!user) return;

  loadDashboardState();

  const select = document.getElementById("keySelect");
  if (select) {
    listRooms.forEach(r => {
      if (!rooms[r]) rooms[r] = "Livre";
      if (!keys[r]) keys[r] = "Livre";

      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      select.appendChild(opt);
    });

    renderAll();
  }

  const registerList = document.getElementById("registeredFaces");
  if (registerList) renderRegisteredFaces();
};

/* =========================
   CAMERA
========================= */
async function startCamera(videoId) {
  const video = document.getElementById(videoId);
  if (!video) return;

  stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  document.querySelectorAll("video").forEach(video => {
    if (video.srcObject) {
      video.srcObject = null;
    }
  });
}

function saveFacesDB() {
  localStorage.setItem("facesDB", JSON.stringify(facesDB));
  localStorage.setItem("faces", JSON.stringify(facesDB));
}

function loadFacesDB() {
  const savedFacesDB = JSON.parse(localStorage.getItem("facesDB")) || [];
  const savedFaces = JSON.parse(localStorage.getItem("faces")) || [];
  const merged = [...savedFacesDB];

  savedFaces.forEach(face => {
    if (!merged.some(f => f.email.toLowerCase() === face.email.toLowerCase())) {
      merged.push(face);
    }
  });

  facesDB = merged;
}

function saveDashboardState() {
  localStorage.setItem("rooms", JSON.stringify(rooms));
  localStorage.setItem("keys", JSON.stringify(keys));
  localStorage.setItem("keyHistory", JSON.stringify(keyHistory));
}

function loadDashboardState() {
  try {
    const savedRooms = JSON.parse(localStorage.getItem("rooms"));
    const savedKeys = JSON.parse(localStorage.getItem("keys"));
    const savedHistory = JSON.parse(localStorage.getItem("keyHistory"));

    if (savedRooms && typeof savedRooms === "object") {
      rooms = savedRooms;
    }
    if (savedKeys && typeof savedKeys === "object") {
      keys = savedKeys;
    }
    if (Array.isArray(savedHistory)) {
      keyHistory = savedHistory;
    }
  } catch (e) {
    console.warn("Falha ao carregar estado do dashboard", e);
  }
}

function getCurrentUser() {
  return localStorage.getItem("currentUser");
}

function getCurrentUserName() {
  const email = getCurrentUser();
  if (!email) return null;

  const user = findFaceByEmail(email);
  return user ? user.name : email;
}

function getLoginPath() {
  const path = window.location.pathname;
  return path.includes("/frontend/") ? "../" : "index.html";
}

function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = getLoginPath();
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = getLoginPath();
}

/* =========================
   FACE DB
========================= */
let facesDB = [];
loadFacesDB();

function captureFace() {
  const video = document.getElementById("videoRegister");
  const canvas = document.getElementById("canvas");
  const name = document.getElementById("faceName");
  const email = document.getElementById("faceEmail");
  const matricula = document.getElementById("faceMatricula");

  if (!video || !canvas) return;
  if (!name?.value || !email?.value || !matricula?.value) {
    document.getElementById("faceMsg").innerText =
      "⚠ Preencha nome, e-mail e matrícula para cadastrar.";
    return;
  }

  const ctx = canvas.getContext("2d");
  canvas.width = 300;
  canvas.height = 220;

  ctx.drawImage(video, 0, 0, 300, 220);

  facesDB.push({
    name: name.value,
    email: email.value,
    matricula: matricula.value,
    image: canvas.toDataURL("image/png"),
    registeredAt: new Date().toLocaleString()
  });

  saveFacesDB();
  renderRegisteredFaces();

  document.getElementById("faceMsg").innerText =
    "✔ Rosto cadastrado com sucesso.";
}

function findFaceByEmail(email) {
  return facesDB.find(face => face.email.toLowerCase() === email.toLowerCase());
}

function recognizeFace() {
  if (facesDB.length === 0) return null;
  return facesDB[facesDB.length - 1];
}

function authenticateFace() {
  const video = document.getElementById("video");
  const message = document.getElementById("loginMsg");
  const email = document.getElementById("loginEmail")?.value;

  if (!video) return;
  if (facesDB.length === 0) {
    if (message) message.innerText = "⚠ Nenhum rosto cadastrado. Registre antes de autenticar.";
    return;
  }

  const face = email ? findFaceByEmail(email) : recognizeFace();
  if (!face) {
    if (message) message.innerText = "⚠ Nenhum usuário encontrado com esse e-mail.";
    return;
  }

  detectedUser = face;
  if (message) {
    message.innerText = `✔ Rosto detectado: ${face.name}. Agora faça login com o e-mail e a senha cadastrados.`;
  }
}

function login() {
  const email = document.getElementById("loginEmail")?.value;
  const password = document.getElementById("loginPassword")?.value;
  const message = document.getElementById("loginMsg");

  if (!email || !password) {
    if (message) message.innerText = "⚠ Preencha e-mail e senha para entrar.";
    return;
  }

  const face = findFaceByEmail(email);
  if (!face || face.matricula !== password) {
    if (message) message.innerText = "❌ E-mail ou senha inválidos.";
    return;
  }

  if (facesDB.length > 0 && !detectedUser) {
    if (message) message.innerText = "⚠ Use a autenticação por câmera antes de entrar.";
    return;
  }

  if (facesDB.length > 0 && detectedUser && detectedUser.email !== face.email) {
    if (message) message.innerText = "❌ O rosto detectado não corresponde ao usuário.";
    return;
  }

  if (message) message.innerText = `✔ Bem-vindo(a), ${face.name}! Acesso liberado.`;
}

function showRegisterBox() {
  const box = document.getElementById("registerBox");
  if (!box) return;
  box.style.display = box.style.display === "none" ? "block" : "none";
}

function captureFaceLogin() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvasLogin");
  const name = document.getElementById("faceName");
  const email = document.getElementById("faceEmail");
  const matricula = document.getElementById("faceMatricula");
  const message = document.getElementById("faceMsg");

  if (!video || !canvas) return;
  if (!name?.value || !email?.value || !matricula?.value) {
    if (message) message.innerText = "⚠ Preencha nome, e-mail e matrícula para cadastrar.";
    return;
  }

  const ctx = canvas.getContext("2d");
  canvas.width = 300;
  canvas.height = 220;
  ctx.drawImage(video, 0, 0, 300, 220);

  facesDB.push({
    name: name.value,
    email: email.value,
    matricula: matricula.value,
    image: canvas.toDataURL("image/png"),
    registeredAt: new Date().toLocaleString()
  });

  saveFacesDB();
  renderRegisteredFaces();

  if (message) message.innerText = "✔ Rosto cadastrado com sucesso.";
}

/* =========================
   CHAVE -> CAMERA
========================= */
function openCameraForKey() {
  selectedKey = document.getElementById("keySelect").value;

  const form = document.getElementById("keyForm");
  if (!form) return;

  form.style.display = "block";

  startCamera("video");

  const face = recognizeFace();

  const result = document.getElementById("faceResult");
  if (result) {
    result.innerText = face
      ? "✔ Reconhecido: " + face.name
      : "⚠ Nenhum rosto reconhecido";
  }

  detectedUser = face;
}

/* =========================
   CONFIRMAR
========================= */
function confirmAccess() {
  const manual = document.getElementById("manualName")?.value;
  const user = detectedUser?.name || manual;

  if (!user) return alert("Identifique o usuário!");

  const time = new Date().toLocaleString();

  rooms[selectedKey] = "Ocupada";
  keys[selectedKey] = "Ocupada";

  keyHistory.push({
    key: selectedKey,
    user,
    timeOut: time,
    timeReturn: null
  });

  saveDashboardState();
  stopCamera();

  const form = document.getElementById("keyForm");
  if (form) form.style.display = "none";

  const input = document.getElementById("manualName");
  if (input) input.value = "";

  detectedUser = null;

  renderAll();
}

/* =========================
   DEVOLUÇÃO
========================= */
function returnKey(index) {
  const item = keyHistory[index];
  if (!item || item.timeReturn) return;

  item.timeReturn = new Date().toLocaleString();

  rooms[item.key] = "Livre";
  keys[item.key] = "Livre";

  saveDashboardState();
  renderAll();
}

/* =========================
   RENDER
========================= */
function renderRooms() {
  const list = document.getElementById("roomList");
  if (!list) return;

  list.innerHTML = "";

  for (let r in rooms) {
    const ativo = keyHistory.find(k => k.key === r && !k.timeReturn);

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      🚪 ${r} - ${ativo ? "🔴 Ocupada" : "🟢 Livre"}
      ${ativo ? `<br>👤 ${ativo.user}` : ""}
    `;

    list.appendChild(div);
  }
}

function renderUsers() {
  const list = document.getElementById("userList");
  if (!list) return;

  list.innerHTML = "";

  keyHistory.filter(k => !k.timeReturn).forEach(u => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      👤 ${u.user}<br>
      🚪 ${u.key}<br>
      🔴 Em uso
    `;

    list.appendChild(div);
  });
}

function renderAccess() {
  const list = document.getElementById("accessList");
  if (!list) return;

  list.innerHTML = "";

  [...keyHistory].reverse().forEach(a => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      🔑 ${a.key}<br>
      👤 ${a.user}<br>
      🟢 Entrada: ${a.timeOut}<br>
      ${a.timeReturn ? "🔴 Saída: " + a.timeReturn : "🟡 Em uso"}
    `;

    list.appendChild(div);
  });
}

function renderHome() {
  const loggedUser = document.getElementById("loggedUser");
  if (loggedUser) {
    loggedUser.innerText = getCurrentUserName() || "Nenhum";
  }

  document.getElementById("totalKeys").innerText =
    keyHistory.filter(k => !k.timeReturn).length;

  document.getElementById("totalRooms").innerText =
    Object.values(rooms).filter(v => v === "Ocupada").length;

  const last = keyHistory[keyHistory.length - 1];
  if (last) {
    document.getElementById("lastUser").innerText =
      `${last.user} - ${last.key}`;
  }
}

function renderRegisteredFaces() {
  const list = document.getElementById("registeredFaces");
  if (!list) return;

  list.innerHTML = "";

  facesDB.forEach(face => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <strong>${face.name}</strong><br>
      ✉ ${face.email}<br>
      🆔 ${face.matricula}<br>
      📅 ${face.registeredAt}
    `;
    list.appendChild(div);
  });
}

function renderKeyHistory() {
  const list = document.getElementById("keyHistory");
  if (!list) return;

  list.innerHTML = "";

  [...keyHistory].reverse().forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      🔑 ${item.key}<br>
      👤 ${item.user}<br>
      🟢 Entrada: ${item.timeOut}<br>
      ${item.timeReturn ? `🔴 Saída: ${item.timeReturn}` : "🟡 Em uso"}
      ${!item.timeReturn ? `<br><button onclick="returnKey(${keyHistory.length - 1 - index})">Devolver</button>` : ""}
    `;

    list.appendChild(div);
  });
}

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.toggle("active", section.id === sectionId);
  });
}

function renderAll() {
  renderHome();
  renderRooms();
  renderUsers();
  renderAccess();
  renderKeyHistory();
  renderRegisteredFaces();
}