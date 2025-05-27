// === Função de Login (validação de usuário e senha simulada em JS) ===
function login() {
  // Obtém os elementos do formulário
  const usuario = document.getElementById("usuario");
  const senha = document.getElementById("senha");

  // Obtém os elementos de erro (mensagens que aparecerão em vermelho)
  const erroUsuario = document.getElementById("erroUsuario");
  const erroSenha = document.getElementById("erroSenha");

  // Limpa mensagens de erro anteriores e remove estilos de erro
  erroUsuario.textContent = "";
  erroSenha.textContent = "";
  usuario.classList.remove("erro");
  senha.classList.remove("erro");

  // Lista de usuários válidos (dados fictícios para testes)
  const usuariosValidos = [
    { usuario: "admin", senha: "1234" } // Exemplo de usuário autorizado
  ];

  // Procura nas credenciais se algum usuário bate com os dados informados
  const autorizado = usuariosValidos.find(u => 
    u.usuario === usuario.value && u.senha === senha.value
  );

  if (autorizado) {
    // Se credenciais estiverem corretas, mostra "Carregando..." e redireciona
    document.querySelector("button").innerText = "Carregando...";
    setTimeout(() => {
      window.location.href = "pages/mapa.html"; // Página de destino após login
    }, 1000);
  } else {
    // Verifica se campos foram deixados em branco e exibe mensagens específicas
    if (!usuario.value) {
      erroUsuario.textContent = "Usuário obrigatório.";
      usuario.classList.add("erro");
    }

    if (!senha.value) {
      erroSenha.textContent = "Senha obrigatória.";
      senha.classList.add("erro");
    }

    // Caso ambos tenham sido preenchidos, mas estão incorretos
    if (usuario.value && senha.value) {
      erroSenha.textContent = "Usuário ou senha incorretos.";
      usuario.classList.add("erro");
      senha.classList.add("erro");
    }
  }
}

// === Alterna entre mostrar e esconder a senha ===
function toggleSenha() {
  const senhaInput = document.getElementById("senha");
  senhaInput.type = senhaInput.type === "password" ? "text" : "password";
}

// === Animação de fundo com bolhas (elemento decorativo visual) ===
const bolhas = document.getElementById("bolhas"); // Container das bolhas
const bubbleSize = 20;           // Tamanho padrão de cada bolha (px)
const maxScale = 1.4;            // Escala máxima de crescimento das bolhas
const gap = bubbleSize * (maxScale - 1); // Espaçamento entre bolhas

// Cria a grade de bolhas animadas dinamicamente com base no tamanho da janela
function criarBolhas() {
  bolhas.innerHTML = ""; // Limpa bolhas anteriores (caso resize)

  // Obtém dimensões da janela do navegador
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Calcula número de colunas e linhas necessárias para preencher a tela
  const cols = Math.ceil(width / (bubbleSize + gap));
  const rows = Math.ceil(height / (bubbleSize + gap));
  const total = rows * cols; // Quantidade total de bolhas
  const maxDistance = cols + rows; // Para cálculo proporcional de delay/escala

  // Define o layout em grid para o container de bolhas
  bolhas.style.gridTemplateColumns = `repeat(${cols}, ${bubbleSize}px)`;
  bolhas.style.gridAutoRows = `${bubbleSize}px`;
  bolhas.style.gap = `${gap}px`;

  // Cria bolhas dinamicamente
  for (let i = 0; i < total; i++) {
    const li = document.createElement("li"); // Cada bolha é um <li>
    const row = Math.floor(i / cols);        // Linha da bolha
    const col = i % cols;                    // Coluna da bolha
    const delay = (row + col) * 0.05;        // Delay para efeito em onda

    const distance = col + row;
    const scaleBase = 0.4 + (distance / maxDistance) * 1.0; // Escala opcional

    li.style.animationDelay = `${delay}s`;  // Define o tempo de início da animação
    bolhas.appendChild(li);                 // Adiciona bolha ao container
  }
}

// Gera bolhas ao iniciar a página
criarBolhas();

// Regenera bolhas ao redimensionar a janela
window.addEventListener("resize", criarBolhas);