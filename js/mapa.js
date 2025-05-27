const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true // Habilita o zoom com o scroll do mouse
  }
});

const panoData = [
  { name: "Catraca", image: "../assets/minimapa/CATRACA.jpg" },
  { name: "Escadaria", image: "../assets/minimapa/DOURADO_ESCADARIA.jpg" },
  { name: "Safe_zone", image: "../assets/minimapa/SAFE_ZONE.jpg" },
  { name: "hell", image: "../assets/minimapa/HELL.jpg" },
  { name: "centro_patio", image: "../assets/minimapa/CENTRO_PATIOO.jpg" },
  { name: "Bom_Gosto", image: "../assets/minimapa/BOM_GOSTO.jpg" },
  { name: "impressao", image: "../assets/minimapa/FUNDO_IMPRESSAO.jpg" },
  { name: "elevadores", image: "../assets/minimapa/ELEVADORES.jpg" },
  { name: "fundo_corredor", image: "../assets/minimapa/FUNDO_CORREDOR.jpg" },
  { name: "transporte", image: "../assets/minimapa/TRANSPORTE.jpg" },
  { name: "escadaria_principal", image: "../assets/minimapa/ESCADAS_PRINCIPAL.jpg" },
  { name: "secretaria", image: "../assets/minimapa/SECRETARIA.jpg" },
  { name: "dema", image: "../assets/minimapa/DEMA.jpg" }
];

const scenes = panoData.map((data, index) => {
  const source = Marzipano.ImageUrlSource.fromString(data.image);
  const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
  const limiter = Marzipano.RectilinearView.limit.traditional(
    2048,
    100 * Math.PI / 180,
    120 * Math.PI / 180
  );

  // Define o yaw inicial apenas para a segunda imagem (índice 1)
  const initialViewParams = (index === 1)
    ? { yaw: 10 } // Ajuste esse valor se necessário (ex: Math.PI, Math.PI/2 etc.)
    : null;

  const view = new Marzipano.RectilinearView(initialViewParams, limiter);
  const scene = viewer.createScene({ source, geometry, view });

  // Hotspot Avançar (próxima cena)
  if (index < panoData.length - 1) {
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

// Inicia a primeira cena
scenes[0].scene.switchTo();
