const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true
  }
});

const panoData = [
  { name: "Catraca", image: "../assets/minimapa/CATRACA.jpg", initialYaw: 180 },
  { name: "Escadaria", image: "../assets/minimapa/DOURADO_ESCADARIA.jpg", initialYaw: Math.PI },
  { name: "Safe_zone", image: "../assets/minimapa/SAFE_ZONE.jpg", initialYaw: 0 },
  { name: "hell", image: "../assets/minimapa/HELL.jpg", initialYaw: 0 },
  { name: "centro_patio", image: "../assets/minimapa/CENTRO_PATIOO.jpg", initialYaw: 0 },
  { name: "Bom_Gosto", image: "../assets/minimapa/BOM_GOSTO.jpg", initialYaw: 0 },
  { name: "impressao", image: "../assets/minimapa/FUNDO_IMPRESSAO.jpg", initialYaw: 0 },
  { name: "elevadores", image: "../assets/minimapa/ELEVADORES.jpg", initialYaw: 0 },
  { name: "fundo_corredor", image: "../assets/minimapa/FUNDO_CORREDOR.jpg", initialYaw: 0 },
  { name: "transporte", image: "../assets/minimapa/TRANSPORTE.jpg", initialYaw: 0 },
  { name: "escadaria_principal", image: "../assets/minimapa/ESCADAS_PRINCIPAL.jpg", initialYaw: 0 },
  { name: "secretaria", image: "../assets/minimapa/SECRETARIA.jpg", initialYaw: 0 },
  { name: "dema", image: "../assets/minimapa/DEMA.jpg", initialYaw: 0 }
];

const scenes = panoData.map((data, index) => {
  const source = Marzipano.ImageUrlSource.fromString(data.image);
  const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
  const limiter = Marzipano.RectilinearView.limit.traditional(2048, 100 * Math.PI / 180, 120 * Math.PI / 180);

  const view = new Marzipano.RectilinearView(
    { yaw: data.initialYaw || 0 },
    limiter
  );

  const scene = viewer.createScene({ source, geometry, view });

  // Hotspot para próxima cena
  if (index < panoData.length - 1) {
    const nextHotspot = document.createElement('div');
    nextHotspot.className = 'hotspot arrow next';
    nextHotspot.title = "Próxima";

    nextHotspot.addEventListener('click', () => {
      scenes[index + 1].scene.switchTo();
    });

    scene.hotspotContainer().createHotspot(nextHotspot, {
      yaw: (data.initialYaw || 0),
      pitch: 0
    });
  }

  // Hotspot para cena anterior
  if (index > 0) {
    const prevHotspot = document.createElement('div');
    prevHotspot.className = 'hotspot arrow prev';
    prevHotspot.title = "Voltar";

    prevHotspot.addEventListener('click', () => {
      scenes[index - 1].scene.switchTo();
    });

    scene.hotspotContainer().createHotspot(prevHotspot, {
      yaw: (data.initialYaw || 0) + Math.PI,
      pitch: 0
    });
  }

  return {
    name: data.name,
    scene: scene
  };
});

// Mostra a primeira cena
scenes[0].scene.switchTo();
