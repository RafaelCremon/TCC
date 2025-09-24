const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true
  }
});

// Variável para controlar a cena atual
let currentSceneIndex = 0;

// Apenas fotos do Bloco A cadastradas
const panoData = [
  // Bloco A
  { name: "Catraca", image: "../assets/minimapa/CATRACA.jpg", bloco: "A" },
  { name: "Escadaria", image: "../assets/minimapa/DOURADO_ESCADARIA.jpg", bloco: "A" },
  { name: "fundo_corredor", image: "../assets/minimapa/FUNDO_CORREDOR.jpg", bloco: "A" },
  { name: "dema", image: "../assets/minimapa/DEMA.jpg", bloco: "A" },
  { name: "Safe_zone", image: "../assets/minimapa/SAFE_ZONE.jpg", bloco: "A" },
  { name: "hell", image: "../assets/minimapa/HELL.jpg", bloco: "A" },
  { name: "transporte", image: "../assets/minimapa/TRANSPORTE.jpg", bloco: "A" },
  { name: "centro_patio", image: "../assets/minimapa/CENTRO_PATIOO.jpg", bloco: "A" },
  { name: "Bom_Gosto", image: "../assets/minimapa/BOM_GOSTO.jpg", bloco: "A" },
  { name: "escadaria_principal", image: "../assets/minimapa/ESCADAS_PRINCIPAL.jpg", bloco: "A" },
  { name: "impressao", image: "../assets/minimapa/FUNDO_IMPRESSAO.jpg", bloco: "A" },
  { name: "elevadores", image: "../assets/minimapa/ELEVADORES.jpg", bloco: "A" },
  { name: "secretaria", image: "../assets/minimapa/SECRETARIA.jpg", bloco: "A" },

  // Bloco B
  { name: "Laboratório Biologia", image: "../assets/imagens/Fotografias TCC/Bloco B/LABORATORIO BIOLOGIA.jpg", bloco: "B" },
  { name: "Laboratório Química", image: "../assets/imagens/Fotografias TCC/Bloco B/LABORATORIO QUIMICA.jpg", bloco: "B" },
  { name: "Laboratório Química Meio", image: "../assets/imagens/Fotografias TCC/Bloco B/LABOTATORIO QUIMICA MEIO.jpg", bloco: "B" },
  { name: "Quarto Andar B", image: "../assets/imagens/Fotografias TCC/Bloco B/QUARTO ANDAR B CORRIGIDO.jpg", bloco: "B" },
  { name: "Quinto Andar B", image: "../assets/imagens/Fotografias TCC/Bloco B/QUINTO ANDAR B CORRIGIDO.jpg", bloco: "B" },
  { name: "Quinto Andar Esquerda B", image: "../assets/imagens/Fotografias TCC/Bloco B/QUINTO ANDAR ESQUERDA B CORRIGIDO.jpg", bloco: "B" },
  { name: "Quinto Andar Fundo", image: "../assets/imagens/Fotografias TCC/Bloco B/quinto andar fundo.jpg", bloco: "B" },
  { name: "Quinto Andar", image: "../assets/imagens/Fotografias TCC/Bloco B/quinto andar.jpg", bloco: "B" },
  { name: "Segundo Andar B Escada Corrigida 1", image: "../assets/imagens/Fotografias TCC/Bloco B/SEGUNDO ANDAR B ESCADA CORRIGIDA(1).jpg", bloco: "B" },
  { name: "Segundo Andar B Escada Corrigida", image: "../assets/imagens/Fotografias TCC/Bloco B/SEGUNDO ANDAR B ESCADA CORRIGIDA.jpg", bloco: "B" },

  // Bloco C
  { name: "Primeiro Andar C", image: "../assets/imagens/Fotografias TCC/Bloco C/PRIMEIRO ANDAR C.jpg", bloco: "C" },
  { name: "Primeiro Andar Escada 1", image: "../assets/imagens/Fotografias TCC/Bloco C/PRIMEIRO ANDAR ESCADA(1).jpg", bloco: "C" },
  { name: "Primeiro Andar Escada", image: "../assets/imagens/Fotografias TCC/Bloco C/PRIMEIRO ANDAR ESCADA.jpg", bloco: "C" },
  { name: "Quarto Andar Escada C 1", image: "../assets/imagens/Fotografias TCC/Bloco C/QUARTO ANDAR ESCADA C(1).jpg", bloco: "C" },
  { name: "Quarto Andar Escada C", image: "../assets/imagens/Fotografias TCC/Bloco C/QUARTO ANDAR ESCADA C.jpg", bloco: "C" },
  { name: "Quarto Andar Esquerda C", image: "../assets/imagens/Fotografias TCC/Bloco C/QUARTO ANDAR ESQUERDA C.jpg", bloco: "C" },
  { name: "Quarto C Corrigido Escada", image: "../assets/imagens/Fotografias TCC/Bloco C/QUARTO C CORRIGIDO ESCADA.jpg", bloco: "C" },
  { name: "Quarto C Corrigido", image: "../assets/imagens/Fotografias TCC/Bloco C/QUARTO C CORRIGIDO.jpg", bloco: "C" },
  { name: "Quinto Andar Escada C", image: "../assets/imagens/Fotografias TCC/Bloco C/QUINTO ANDAR ESCADA C.jpg", bloco: "C" },
  { name: "Qunto Andar Esquerda C", image: "../assets/imagens/Fotografias TCC/Bloco C/QUNTO ANDAR ESQUERDA C.jpg", bloco: "C" },
  { name: "Segundo Andar Escada C", image: "../assets/imagens/Fotografias TCC/Bloco C/SEGUNDO ANDAR ESCADA C.jpg", bloco: "C" },
  { name: "Segundo C Escada", image: "../assets/imagens/Fotografias TCC/Bloco C/SEGUNDO C ESCADA.jpg", bloco: "C" },
  { name: "Terceiro Andar Escada C 1", image: "../assets/imagens/Fotografias TCC/Bloco C/TERCEIRO ANDAR ESCADA C(1).jpg", bloco: "C" },
  { name: "Terceiro Andar Escada C", image: "../assets/imagens/Fotografias TCC/Bloco C/TERCEIRO ANDAR ESCADA C.jpg", bloco: "C" },
  { name: "Terceiro Andar Esqueda C 1", image: "../assets/imagens/Fotografias TCC/Bloco C/TERCEIRO ANDAR ESQUEDA C(1).jpg", bloco: "C" },
  { name: "Terceiro Andar Esqueda C", image: "../assets/imagens/Fotografias TCC/Bloco C/TERCEIRO ANDAR ESQUEDA C.jpg", bloco: "C" },
  { name: "Terceiro Andar Esquerda C 1", image: "../assets/imagens/Fotografias TCC/Bloco C/TERCEIRO ANDAR ESQUERDA C(1).jpg", bloco: "C" },
  { name: "Terceiro Andar Esquerda C", image: "../assets/imagens/Fotografias TCC/Bloco C/TERCEIRO ANDAR ESQUERDA C.jpg", bloco: "C" },
  { name: "Terceiro Escada C Corrigido", image: "../assets/imagens/Fotografias TCC/Bloco C/TERCEIRO ESCADA C CORRIGIDO.jpg", bloco: "C" },

  // Bloco D
  { name: "1 Andar Corredor Infat 2", image: "../assets/imagens/Fotografias TCC/Bloco D/1 ANDAR CORREDOR INFAT 2.jpg", bloco: "D" },
  { name: "1 Andar Corredor Infat", image: "../assets/imagens/Fotografias TCC/Bloco D/1 ANDAR CORREDOR INFAT.jpg", bloco: "D" },
  { name: "1 Andar Elevador Infat", image: "../assets/imagens/Fotografias TCC/Bloco D/1 ANDAR ELEVADOR INFAT.jpg", bloco: "D" },
  { name: "1 Andar Escada Atras", image: "../assets/imagens/Fotografias TCC/Bloco D/1 ANDAR ESCADA ATRAS.jpg", bloco: "D" },
  { name: "1 Andar Escadaria Infat", image: "../assets/imagens/Fotografias TCC/Bloco D/1 ANDAR ESCADARIA INFAT.jpg", bloco: "D" },
  { name: "2 Andar Auditorio D", image: "../assets/imagens/Fotografias TCC/Bloco D/2 ANDAR AUDITORIO D.jpg", bloco: "D" },
  { name: "2 Andar Corredor 1", image: "../assets/imagens/Fotografias TCC/Bloco D/2 ANDAR CORREDOR(1).jpg", bloco: "D" },
  { name: "2 Andar Corredor", image: "../assets/imagens/Fotografias TCC/Bloco D/2 ANDAR CORREDOR.jpg", bloco: "D" },
  { name: "3 Andar Sala", image: "../assets/imagens/Fotografias TCC/Bloco D/3 ANDAR SALA.jpg", bloco: "D" },
  { name: "Corredor Atras Escada", image: "../assets/imagens/Fotografias TCC/Bloco D/CORREDOR ATRAS ESCADA.jpg", bloco: "D" },
  { name: "Entrada Auditorio 1", image: "../assets/imagens/Fotografias TCC/Bloco D/ENTRADA AUDITORIO(1).jpg", bloco: "D" },
  { name: "Entrada Auditorio", image: "../assets/imagens/Fotografias TCC/Bloco D/ENTRADA AUDITORIO.jpg", bloco: "D" },
  { name: "Faixada Bloco D", image: "../assets/imagens/Fotografias TCC/Bloco D/FAIXADA BLOCO D.jpg", bloco: "D" },
  { name: "Patio Infantil", image: "../assets/imagens/Fotografias TCC/Bloco D/PATIO INFANTIL.jpg", bloco: "D" },
  { name: "Sala Professores 2", image: "../assets/imagens/Fotografias TCC/Bloco D/SALA PROFESSORES 2.jpg", bloco: "D" },

  // Infantil
  { name: "Brinquedos", image: "../assets/imagens/Fotografias TCC/Infantil/BRINQUEDOS.jpg", bloco: "INFANTIL" },

  // Biblioteca
  { name: "Biblioteca Catraca", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA CATRACA.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Central", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA CENTRAL.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Corredor Escada", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA CORREDOR ESCADA.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Escada", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA ESCADA.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Meio", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA MEIO.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Parte de Cima Escada", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA PARTE DE CIMA ESCADA.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Sala Cadeiras", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA SALA CADEIRAS.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Sala Mesas 2", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA SALA MESAS 2.jpg", bloco: "Biblioteca" },
  { name: "Biblioteca Sala PCs", image: "../assets/imagens/Fotografias TCC/Biblioteca/BIBLIOTECA SALA PCS.jpg", bloco: "Biblioteca" },
  { name: "Corredor Biblioteca", image: "../assets/imagens/Fotografias TCC/Biblioteca/CORREDOR BIBLIOTECA.jpg", bloco: "Biblioteca" },
];

// Função para pegar o parâmetro da URL
function getBlocoFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('bloco');
}

const blocoSelecionado = getBlocoFromUrl();
const panoFiltrado = blocoSelecionado
  ? panoData.filter(data => data.bloco === blocoSelecionado)
  : [];

// Só cria cenas se houver fotos para o bloco selecionado
const scenes = panoFiltrado.map((data, index) => {
  const source = Marzipano.ImageUrlSource.fromString(data.image);
  const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
  const limiter = Marzipano.RectilinearView.limit.traditional(
    2048,
    100 * Math.PI / 180,
    120 * Math.PI / 180
  );

  const initialViewParams = (index === 1)
    ? { yaw: 10 }
    : null;

  const view = new Marzipano.RectilinearView(initialViewParams, limiter);
  const scene = viewer.createScene({ source, geometry, view });

  // Sistema de navegação aprimorado - Setas direcionais grandes
  if (index < panoFiltrado.length - 1) {
    const nextHotspot = document.createElement('div');
    nextHotspot.className = 'nav-arrow next-arrow';
    nextHotspot.innerHTML = `
      <div class="arrow-circle">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
          <path d="M8 5l7 7-7 7" stroke="white" stroke-width="3" fill="none"/>
        </svg>
      </div>
      <div class="arrow-label">Avançar</div>
    `;
    nextHotspot.title = `Ir para: ${panoFiltrado[index + 1].name}`;
    nextHotspot.addEventListener('click', () => {
      currentSceneIndex = index + 1;
      scenes[currentSceneIndex].scene.switchTo({ transitionDuration: 500 });
      updateNavigationUI();
    });
    scene.hotspotContainer().createHotspot(nextHotspot, { yaw: 1.2, pitch: -0.1 });
  }

  if (index > 0) {
    const prevHotspot = document.createElement('div');
    prevHotspot.className = 'nav-arrow prev-arrow';
    prevHotspot.innerHTML = `
      <div class="arrow-circle">
        <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
          <path d="M16 19l-7-7 7-7" stroke="white" stroke-width="3" fill="none"/>
        </svg>
      </div>
      <div class="arrow-label">Voltar</div>
    `;
    prevHotspot.title = `Voltar para: ${panoFiltrado[index - 1].name}`;
    prevHotspot.addEventListener('click', () => {
      currentSceneIndex = index - 1;
      scenes[currentSceneIndex].scene.switchTo({ transitionDuration: 500 });
      updateNavigationUI();
    });
    scene.hotspotContainer().createHotspot(prevHotspot, { yaw: -1.2, pitch: -0.1 });
  }

  // Hotspots de navegação rápida (pontos de interesse)
  if (panoFiltrado.length > 2) {
    // Adiciona hotspots para pular para locais específicos
    if (index === 0 && panoFiltrado.length > 2) {
      const skipHotspot = document.createElement('div');
      skipHotspot.className = 'nav-point skip-point';
      skipHotspot.innerHTML = `
        <div class="point-circle">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <circle cx="12" cy="12" r="8" fill="rgba(255,255,255,0.9)"/>
            <path d="M12 6v6l4 2" stroke="black" stroke-width="2" fill="none"/>
          </svg>
        </div>
      `;
      skipHotspot.title = `Pular para: ${panoFiltrado[Math.floor(panoFiltrado.length/2)].name}`;
      skipHotspot.addEventListener('click', () => {
        currentSceneIndex = Math.floor(panoFiltrado.length/2);
        scenes[currentSceneIndex].scene.switchTo({ transitionDuration: 700 });
        updateNavigationUI();
      });
      scene.hotspotContainer().createHotspot(skipHotspot, { yaw: 0, pitch: -0.3 });
    }
  }

  return {
    name: data.name,
    scene: scene,
    index: index
  };
});

// Função para atualizar a UI de navegação
function updateNavigationUI() {
  const navInfo = document.getElementById('nav-info');
  if (navInfo && scenes.length > 0) {
    navInfo.innerHTML = `
      <div class="current-location">${scenes[currentSceneIndex].name}</div>
      <div class="location-counter">${currentSceneIndex + 1} de ${scenes.length}</div>
    `;
  }
}

// Adiciona controles de teclado estilo Google Street View
document.addEventListener('keydown', (e) => {
  if (scenes.length === 0) return;
  
  switch(e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      if (currentSceneIndex < scenes.length - 1) {
        currentSceneIndex++;
        scenes[currentSceneIndex].scene.switchTo({ transitionDuration: 400 });
        updateNavigationUI();
      }
      break;
    case 'ArrowLeft':
    case 'ArrowDown':
      if (currentSceneIndex > 0) {
        currentSceneIndex--;
        scenes[currentSceneIndex].scene.switchTo({ transitionDuration: 400 });
        updateNavigationUI();
      }
      break;
    case 'Home':
      currentSceneIndex = 0;
      scenes[0].scene.switchTo({ transitionDuration: 600 });
      updateNavigationUI();
      break;
    case 'End':
      currentSceneIndex = scenes.length - 1;
      scenes[currentSceneIndex].scene.switchTo({ transitionDuration: 600 });
      updateNavigationUI();
      break;
  }
});

// Só inicia se houver cenas (fotos)
if (scenes.length > 0) {
  currentSceneIndex = 0;
  scenes[0].scene.switchTo();
  
  // Cria a UI de navegação
  const navUI = document.createElement('div');
  navUI.id = 'nav-info';
  navUI.className = 'navigation-ui';
  document.body.appendChild(navUI);
  
  updateNavigationUI();
  
  // Adiciona instruções de navegação
  const instructions = document.createElement('div');
  instructions.className = 'navigation-instructions';
  instructions.innerHTML = `
    <div class="instructions-content">
      <div class="instruction-item">
        <span class="key">↑ ↓ ← →</span> Navegar entre locais
      </div>
      <div class="instruction-item">
        <span class="key">Clique</span> nas setas para avançar/voltar
      </div>
      <div class="instruction-item">
        <span class="key">Home/End</span> Ir ao início/fim
      </div>
    </div>
  `;
  document.body.appendChild(instructions);
  
  // Remove instruções após alguns segundos
  setTimeout(() => {
    instructions.style.opacity = '0';
    setTimeout(() => instructions.remove(), 500);
  }, 4000);
}