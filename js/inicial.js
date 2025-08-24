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
        btn.onclick = () => window.location.href = 'tour.html?bloco=A';
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