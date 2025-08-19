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