// Classe para gerenciar autenticação (mesma do inicial.html)
class UserManagementSystem {
  constructor() {
    this.users = this.loadUsers();
    // Carregar dados de exemplo se não houver usuários
    if (this.users.length === 0) {
      this.loadSampleData();
    }
  }

  loadUsers() {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : [];
  }

  hashPassword(password) {
    // Simples hash base64 com salt para demo
    const salt = 'escola2024';
    return btoa(salt + password + salt);
  }

  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  authenticateUser(username, password) {
    console.log('Tentando autenticar:', username);
    const user = this.users.find(u => u.username === username && u.status === 'active');
    console.log('Usuário encontrado:', user ? user.username : 'Nenhum');
    
    if (!user) {
      console.log('Usuário não encontrado ou inativo');
      return null;
    }
    
    console.log('Verificando senha...');
    const senhaCorreta = this.verifyPassword(password, user.password);
    console.log('Senha correta:', senhaCorreta);
    
    if (senhaCorreta) {
      // Atualizar último acesso
      user.lastAccess = new Date().toISOString();
      this.saveUsers();
      return user;
    }
    return null;
  }

  saveUsers() {
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  loadSampleData() {
    if (this.users.length === 0) {
      this.users = [
        {
          id: 1,
          name: 'Gustavo Medeiros',
          email: 'admin@escola.com',
          username: 'admin',
          password: this.hashPassword('admin123'),
          role: 'admin',
          phone: '(11) 99999-9999',
          status: 'active',
          createdAt: '2024-01-15',
          lastAccess: '2024-03-20T10:30:00',
          avatar: null,
          additionalInfo: {}
        },
        {
          id: 2,
          name: 'Prof. Maria Silva',
          email: 'maria.silva@escola.com',
          username: 'maria.prof',
          password: this.hashPassword('prof123'),
          role: 'professor',
          phone: '(11) 98888-8888',
          status: 'active',
          createdAt: '2024-02-01',
          lastAccess: '2024-03-19T14:20:00',
          avatar: null,
          additionalInfo: {
            subject: 'Matemática',
            department: 'Exatas'
          }
        },
        {
          id: 3,
          name: 'João Santos',
          email: 'joao.santos@aluno.escola.com',
          username: 'joao.aluno',
          password: this.hashPassword('aluno123'),
          role: 'aluno',
          phone: '(11) 97777-7777',
          status: 'active',
          createdAt: '2024-02-15',
          lastAccess: '2024-03-20T08:15:00',
          avatar: null,
          additionalInfo: {
            class: '3ºJ',
            rgm: '2012082'
          }
        },
        {
          id: 4,
          name: 'Ana Oliveira',
          email: 'ana.oliveira@email.com',
          username: 'ana.resp',
          password: this.hashPassword('resp123'),
          role: 'responsavel',
          phone: '(11) 96666-6666',
          status: 'inactive',
          createdAt: '2024-03-01',
          lastAccess: '2024-03-10T16:45:00',
          avatar: null,
          additionalInfo: {
            studentName: 'Pedro Oliveira',
            relationship: 'Mãe'
          }
        }
      ];
      this.saveUsers();
      console.log('Dados de exemplo carregados:', this.users.length, 'usuários');
    }
  }
}

// Instância global do sistema de gerenciamento
const userSystem = new UserManagementSystem();

// função de login quando ativa "Ao clicar o botão", busca esses elementos:
function login() {
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const erroUsuario = document.getElementById("erroUsuario");
  const erroSenha = document.getElementById("erroSenha");

  // Debug: verificar se o sistema de usuários está funcionando
  console.log('Tentativa de login:', { usuario, senha: senha ? '***' : 'vazia' });
  console.log('Usuários disponíveis:', userSystem.users.length);
  console.log('Usuários carregados:', userSystem.users.map(u => ({ username: u.username, status: u.status })));

  // Limpa mensagens anteriores
  erroUsuario.textContent = "";
  erroSenha.textContent = "";

  // Validações básicas
  if (!usuario.trim()) {
    erroUsuario.textContent = "Digite seu usuário";
    return;
  }

  if (!senha.trim()) {
    erroSenha.textContent = "Digite sua senha";
    return;
  }

  // Tenta autenticar com o sistema de usuários criados
  const user = userSystem.authenticateUser(usuario, senha);
  console.log('Resultado da autenticação:', user ? 'Sucesso' : 'Falhou');
  
  if (user) {
    // Salva informações da sessão
    localStorage.setItem('currentUser', JSON.stringify({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      loginTime: new Date().toISOString()
    }));

    // Log da atividade
    const activityLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    activityLogs.push({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'login',
      user: user.name,
      details: 'Login realizado com sucesso'
    });
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs));

    // Redireciona para a página inicial
    if (window._appleLoginRedirect) {
      window._appleLoginRedirect();
    } else {
      window.location.href = "pages/inicial.html";
    }
  } else {
    // Fallback para credenciais antigas (admin/1234)
    if (usuario === "admin" && senha === "1234") {
      // Salva sessão do admin legacy
      localStorage.setItem('currentUser', JSON.stringify({
        id: 0,
        name: 'Administrador',
        username: 'admin',
        email: 'admin@sistema.com',
        role: 'admin',
        loginTime: new Date().toISOString()
      }));

      if (window._appleLoginRedirect) {
        window._appleLoginRedirect();
      } else {
        window.location.href = "pages/inicial.html";
      }
    } else {
      // Credenciais inválidas
      erroUsuario.textContent = "Usuário ou senha incorretos";
      erroSenha.textContent = "Verifique suas credenciais";
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
