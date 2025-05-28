const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true
  }
});

const panoData = [
  { name: "Catraca", image: "../assets/minimapa/CATRACA.jpg", yaw: Math.PI / 1 },
  { name: "Escadaria", image: "../assets/minimapa/DOURADO_ESCADARIA.jpg", yaw: 10 },
  { name: "Safe_zone", image: "../assets/minimapa/SAFE_ZONE.jpg", yaw: -Math.PI / 2 },
  { name: "hell", image: "../assets/minimapa/HELL.jpg", yaw: Math.PI },
  { name: "centro_patio", image: "../assets/minimapa/CENTRO_PATIOO.jpg", yaw: 1 },
  { name: "Bom_Gosto", image: "../assets/minimapa/BOM_GOSTO.jpg", yaw: 0.5 },
  { name: "impressao", image: "../assets/minimapa/FUNDO_IMPRESSAO.jpg", yaw: 1.5 },
  { name: "elevadores", image: "../assets/minimapa/ELEVADORES.jpg", yaw: 2 },
  { name: "fundo_corredor", image: "../assets/minimapa/FUNDO_CORREDOR.jpg", yaw: -1 },
  { name: "transporte", image: "../assets/minimapa/TRANSPORTE.jpg", yaw: -Math.PI },
  { name: "escadaria_principal", image: "../assets/minimapa/ESCADAS_PRINCIPAL.jpg", yaw: 0 },
  { name: "secretaria", image: "../assets/minimapa/SECRETARIA.jpg", yaw: 0 },
  { name: "dema", image: "../assets/minimapa/DEMA.jpg", yaw: 0 }
];

const scenes = panoData.map((data, index) => {
  const source = Marzipano.ImageUrlSource.fromString(data.image);
  const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
  const limiter = Marzipano.RectilinearView.limit.traditional(
    2048,
    100 * Math.PI / 180,
    120 * Math.PI / 180
  );

  const initialViewParams = {
    yaw: data.yaw || 0, // valor padrão se não for definido
    pitch: data.pitch || 0,
    fov: data.fov || Math.PI / 2
  };

  const view = new Marzipano.RectilinearView(initialViewParams, limiter);
  const scene = viewer.createScene({ source, geometry, view });

  // Hotspot Avançar
  if (index < panoData.length - 1) {
    const nextHotspot = document.createElement('div');
    nextHotspot.className = 'hotspot arrow next';
    nextHotspot.title = "Próxima";
    nextHotspot.addEventListener('click', () => {
      scenes[index + 1].scene.switchTo();
    });
    scene.hotspotContainer().createHotspot(nextHotspot, { yaw: 1.0, pitch: 0 });
  }

  // Hotspot Voltar
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

scenes[0].scene.switchTo();