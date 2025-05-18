const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true // Habilita o zoom com o scroll do mouse
  }
});

const panoData = [
  { name: "Catraca", image: "panoramas/CATRACA.jpg" },
  { name: "Escadaria", image: "panoramas/DOURADO_ESCADARIA.jpg" },
  { name: "Safe_zone", image: "panoramas/SAFE_ZONE.jpg" },
  { name: "hell", image: "panoramas/HELL.jpg" },
  { name: "centro_patio", image: "panoramas/CENTRO_PATIOO.jpg" },
  { name: "Bom_Gosto", image: "panoramas/BOM_GOSTO.jpg" },
  { name: "impressao", image: "panoramas/FUNDO_IMPRESSAO.jpg" },
  { name: "elevadores", image: "panoramas/ELEVADORES.jpg" },
  { name: "fundo_corredor", image: "panoramas/FUNDO_CORREDOR.jpg" },
  { name: "transporte", image: "panoramas/TRANSPORTE.jpg" },
  { name: "escadaria_principal", image: "panoramas/ESCADAS_PRINCIPAL.jpg" },
  { name: "secretaria", image: "panoramas/SECRETARIA.jpg" },
  { name: "dema", image: "panoramas/DEMA.jpg" }
];

const scenes = panoData.map((data, index) => {
  const source = Marzipano.ImageUrlSource.fromString(data.image);
  const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
  const limiter = Marzipano.RectilinearView.limit.traditional(2048, 100 * Math.PI / 180, 120 * Math.PI / 180);
  const view = new Marzipano.RectilinearView(null, limiter);
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

  // hotspot voltar (cena anterior)
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
