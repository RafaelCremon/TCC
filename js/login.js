function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const erroUsuario = document.getElementById("erroUsuario");
  const erroSenha = document.getElementById("erroSenha");

  // Limpa mensagens anteriores
  erroUsuario.textContent = "";
  erroSenha.textContent = "";

  const usuariosValidos = [
    { usuario: "admin", senha: "1234" }
  ];

  const autorizado = usuariosValidos.find(u => u.usuario === usuario && u.senha === senha);

  if (autorizado) {
    window.location.href = "pages/mapa.html"; // Redireciona para o mapa
  } else {
    if (!usuario) erroUsuario.textContent = "Usuário obrigatório.";
    else erroUsuario.textContent = "";

    if (!senha) erroSenha.textContent = "Senha obrigatória.";
    else erroSenha.textContent = "";

    if (usuario && senha) {
      erroSenha.textContent = "Usuário ou senha incorretos.";
    }
  }
}

const bolhas = document.getElementById("bolhas");
const bubbleSize = 20;
const maxScale = 1.4;
const gap = bubbleSize * (maxScale - 1); // 8px

function criarBolhas() {
  bolhas.innerHTML = "";

  const width = window.innerWidth;
  const height = window.innerHeight;

  const cols = Math.ceil(width / (bubbleSize + gap));
  const rows = Math.ceil(height / (bubbleSize + gap));
  const total = rows * cols;
  const maxDistance = cols + rows;

  bolhas.style.gridTemplateColumns = `repeat(${cols}, ${bubbleSize}px)`;
  bolhas.style.gridAutoRows = `${bubbleSize}px`;
  bolhas.style.gap = `${gap}px`;

  for (let i = 0; i < total; i++) {
    const li = document.createElement("li");
    const row = Math.floor(i / cols);
    const col = i % cols;
    const delay = (row + col) * 0.05;

    const distance = col + row;
    // Escala base: menor no canto superior esquerdo (distance=0), maior no inferior direito (distance=maxDistance)
    const scaleBase = 0.4 + (distance / maxDistance) * 1.0; // varia de 0.4 a 1.4

    li.style.animationDelay = `${delay}s`;

    bolhas.appendChild(li);
  }
}


criarBolhas();
window.addEventListener("resize", criarBolhas);
function login() {
  const usuario = document.getElementById("usuario");
  const senha = document.getElementById("senha");
  const erroUsuario = document.getElementById("erroUsuario");
  const erroSenha = document.getElementById("erroSenha");

  // Limpa mensagens e estilos
  erroUsuario.textContent = "";
  erroSenha.textContent = "";
  usuario.classList.remove("erro");
  senha.classList.remove("erro");

  const usuariosValidos = [
    { usuario: "admin", senha: "1234" }
  ];

  const autorizado = usuariosValidos.find(u => u.usuario === usuario.value && u.senha === senha.value);

  if (autorizado) {
    document.querySelector("button").innerText = "Carregando...";
    setTimeout(() => {
      window.location.href = "pages/mapa.html";
    }, 1000);
  } else {
    if (!usuario.value) {
      erroUsuario.textContent = "Usuário obrigatório.";
      usuario.classList.add("erro");
    }

    if (!senha.value) {
      erroSenha.textContent = "Senha obrigatória.";
      senha.classList.add("erro");
    }

    if (usuario.value && senha.value) {
      erroSenha.textContent = "Usuário ou senha incorretos.";
      senha.classList.add("erro");
      usuario.classList.add("erro");
    }
  }
}

function toggleSenha() {
  const senhaInput = document.getElementById("senha");
  senhaInput.type = senhaInput.type === "password" ? "text" : "password";
}
