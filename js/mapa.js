const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true
  }
});

const panoData = [
  { name: "Catraca", image: "../assets/minimapa/CATRACA.jpg", initialYaw: 10 },
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
  const limiter = Marzipano.RectilinearView.limit.traditional(2048, Math.PI / 2, Math.PI / 2);
  const view = new Marzipano.RectilinearView({ yaw: data.initialYaw || 0 }, limiter);
  const scene = viewer.createScene({ source, geometry, view });

  scene.view = view;

  return { name: data.name, scene, view };
});

let currentIndex = 0;

const forwardArrow = document.createElement('div');
forwardArrow.className = 'hotspot arrow forward';
forwardArrow.title = "Avançar/Retornar"; // Título pode ser mais genérico agora
document.getElementById('pano').appendChild(forwardArrow);

forwardArrow.addEventListener('click', () => {
  const yaw = scenes[currentIndex].view.yaw();

  // Lógica INVERTIDA:
  // Se a seta aponta para "frente" (cos(yaw) >= 0), a foto RETORNA
  if (Math.cos(yaw) >= 0 && currentIndex > 0) { // Garante que não vai para índice negativo
    currentIndex--;
  }
  // Se a seta aponta para "trás" (cos(yaw) < 0), a foto AVANÇA
  else if (Math.cos(yaw) < 0 && currentIndex < scenes.length - 1) { // Garante que não excede o array
    currentIndex++;
  }
  scenes[currentIndex].scene.switchTo();
});

function updateArrowRotation() {
  const yaw = scenes[currentIndex].view.yaw();
  const degrees = yaw * (180 / Math.PI);
  forwardArrow.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
  requestAnimationFrame(updateArrowRotation);
}

scenes[currentIndex].scene.switchTo();
updateArrowRotation();