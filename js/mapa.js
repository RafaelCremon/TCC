const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true
  }
});

// Apenas fotos do Bloco A cadastradas
const panoData = [
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

  // Hotspot Avançar (próxima cena)
  if (index < panoFiltrado.length - 1) {
    const nextHotspot = document.createElement('div');
    nextHotspot.className = 'hotspot arrow next';
    nextHotspot.title = "Próxima";
    nextHotspot.addEventListener('click', () => {
      scenes[index + 1].scene.switchTo();
    });
    scene.hotspotContainer().createHotspot(nextHotspot, { yaw: 1.0, pitch: 0 });
  }

  // Hotspot Voltar (cena anterior)
  if (index > 0) {
    const prevHotspot = document.createElement('div');
    prevHotspot.className = 'hotspot arrow prev';
    prevHotspot.title = "Voltar";
    prevHotspot.addEventListener('click', () => {
      scenes[index - 1].scene.switchTo();
    });
    scene.hotspotContainer().createHotspot(prevHotspot, { yaw: -1.0, pitch: 0 });
  }

  return {
    name: data.name,
    scene: scene
  };
});

// Só inicia se houver cenas (fotos)
if (scenes.length > 0) {
  scenes[0].scene.switchTo();
}