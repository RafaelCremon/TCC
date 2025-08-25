// Lógica original para o menu de opções dos blocos
const mapButton = document.getElementById("mapButton");
const optionsMenu = document.getElementById("optionsMenu");

mapButton.addEventListener("click", () => {
    optionsMenu.classList.toggle("active");
});


// --- NOVO CÓDIGO PARA CONTROLAR A SIDEBAR ---

// Seleciona os novos elementos do DOM
const toggleButton = document.getElementById('toggleSidebarBtn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

// Função que abre/fecha a sidebar adicionando/removendo a classe 'visible'
function toggleSidebar() {
  sidebar.classList.toggle('visible');
  overlay.classList.toggle('visible');
}

// Adiciona o evento de clique ao botão "hambúrguer"
toggleButton.addEventListener('click', toggleSidebar);

// Adiciona o evento de clique ao overlay para fechar a sidebar quando clicar fora dela
overlay.addEventListener('click', toggleSidebar);

// Alternância de tema claro/escuro
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
toggleThemeBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  document.body.classList.toggle('dark-mode');
  // Salva preferência no localStorage
  if(document.body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
    trocarLogoTema('dark');
  } else {
    localStorage.setItem('theme', 'light');
    trocarLogoTema('light');
  }
});

// Função para trocar a logo conforme tema
function trocarLogoTema(theme) {
  var logo = document.getElementById('headerLogo');
  if (!logo) return;
  if (theme === 'dark') {
    logo.src = '../assets/imagens/INVERSO.png';
  } else {
    logo.src = '../assets/imagens/LOGO.png';
  }
}

// Aplica o tema salvo ao carregar
if(localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  trocarLogoTema('dark');
} else {
  trocarLogoTema('light');
}

// Função de atalhos para ser chamada pelo HTML
window.carregarAtalhos = function() {
  const atalhos = JSON.parse(localStorage.getItem('atalhosSelecionados')) || [];
  const container = document.querySelector('.shortcut-buttons');
  if (!container) return;
  container.innerHTML = '';
  atalhos.slice(0, 4).forEach(atalho => {
    if (atalho && atalho.nome && atalho.src) {
      const btn = document.createElement('button');
      btn.className = 'add-shortcut-btn atalho-preenchido';
      btn.title = atalho.nome;
      btn.style.display = 'flex';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.innerHTML = `
        <img src="${atalho.src}" alt="${atalho.alt || ''}" style="width:28px;height:28px;margin-bottom:2px;">
        <span style="font-size:11px;color:#222;">${atalho.nome}</span>
      `;
      if (atalho.nome === "Mini Mapa") {
        btn.onclick = function(e) {
          e.stopPropagation();
          // Garante que o container do botão tem position: relative
          if (btn.parentNode) {
            btn.parentNode.style.position = 'relative';
          }
          let opcoes = document.getElementById('miniMapaOpcoes');
          if (!opcoes) {
            opcoes = document.createElement('div');
            opcoes.id = 'miniMapaOpcoes';
            opcoes.className = 'mini-mapa-opcoes-popup';
            opcoes.innerHTML = `
              <button onclick=\"window.location.href='tour.html?bloco=A'\"><svg viewBox='0 0 24 24' fill='none' stroke-width='2'><path d='M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z'/></svg>Bloco A</button>
              <button onclick=\"window.location.href='tour.html?bloco=B'\"><svg viewBox='0 0 24 24' fill='none' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M8 12h8'/></svg>Bloco B</button>
              <button onclick=\"window.location.href='tour.html?bloco=C'\"><svg viewBox='0 0 24 24' fill='none' stroke-width='2'><rect x='4' y='4' width='16' height='16' rx='4'/></svg>Bloco C</button>
              <button onclick=\"window.location.href='tour.html?bloco=D'\"><svg viewBox='0 0 24 24' fill='none' stroke-width='2'><rect x='4' y='4' width='16' height='16' rx='4'/></svg>Bloco D</button>
              <button onclick=\"window.location.href='tour.html?bloco=INFANTIL'\"><svg viewBox='0 0 24 24' fill='none' stroke-width='2'><ellipse cx='12' cy='12' rx='10' ry='6'/></svg>Infantil</button>
              <button onclick=\"window.location.href='tour.html?bloco=Biblioteca'\"><svg viewBox='0 0 24 24' fill='none' stroke-width='2'><rect x='5' y='5' width='14' height='14' rx='2'/><line x1='5' y1='9' x2='19' y2='9'/><line x1='5' y1='15' x2='19' y2='15'/></svg>Biblioteca</button>
            `;
            opcoes.style.position = 'absolute';
            opcoes.style.left = '50%';
            opcoes.style.bottom = '100%';
            opcoes.style.transform = 'translateX(-50%)';
            btn.parentNode.insertBefore(opcoes, btn);
            setTimeout(() => opcoes.classList.add('show'), 10);
          } else {
            opcoes.classList.remove('show');
            setTimeout(() => opcoes.remove(), 180);
          }
        };
      } else if (atalho.nome === "Lanchonetes") {
        btn.onclick = () => window.location.href = 'lanchonetes.html';
      }
      container.appendChild(btn);
    } else {
      const btn = document.createElement('button');
      btn.className = 'add-shortcut-btn';
      btn.textContent = '+';
      btn.onclick = () => window.location.href = 'atalhos.html';
      container.appendChild(btn);
    }
  });
  for (let i = atalhos.length; i < 4; i++) {
    const btn = document.createElement('button');
    btn.className = 'add-shortcut-btn';
    btn.textContent = '+';
    btn.onclick = () => window.location.href = 'atalhos.html';
    container.appendChild(btn);
  }
}