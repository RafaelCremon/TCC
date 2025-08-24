// função de login quando ativa "Ao clicar o botão", busca esses elementos:
function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const erroUsuario = document.getElementById("erroUsuario");
  const erroSenha = document.getElementById("erroSenha");

  // Limpa mensagens anteriores
  erroUsuario.textContent = "";
  erroSenha.textContent = "";

  // Usuário e Senha Válidos para entrar
  const usuariosValidos = [{ usuario: "admin", senha: "1234" }];

  // Autoriza caso o Usuário e Senha inseridos forem os de cima
  const autorizado = usuariosValidos.find(u => u.usuario === usuario && u.senha === senha);

  // Se foi os autorizados, faz a transição Apple e redireciona
  if (autorizado) {
    if (window._appleLoginRedirect) {
      window._appleLoginRedirect();
    } else {
      window.location.href = "pages/inicial.html";
    }
  }
}

// NOVO: manter o ícone de olho funcionando
function toggleSenha() {
  const input = document.getElementById("senha");
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
}

/* =======================
   Bolhas originais (decorativas)
   Mantidas, porém desativadas por padrão para evitar travamentos.
   Para reativar, mude ENABLE_BUBBLES para true.
======================= */
const ENABLE_BUBBLES = false;
const bolhas = document.getElementById("bolhas");
const bubbleSize = 20;
const maxScale = 1.4;
const gap = bubbleSize * (maxScale - 1); // 8px

function criarBolhas() {
  if (!bolhas) return;
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
    const scaleBase = 0.4 + (distance / maxDistance) * 1.0; // varia de 0.4 a 1.4
    li.style.setProperty("--scale-base", scaleBase);
    li.style.animationDelay = `${delay}s`;
    bolhas.appendChild(li);
  }
}

if (ENABLE_BUBBLES && bolhas) {
  criarBolhas();
  window.addEventListener("resize", criarBolhas);
}
