const viewer = new Marzipano.Viewer(document.getElementById('pano'), {
  controls: {
    mouseViewMode: 'drag',
    scrollZoom: true
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

const scenes = panoData.map((data) => {
  const source = Marzipano.ImageUrlSource.fromString(data.image);
  const geometry = new Marzipano.EquirectGeometry([{ width: 4000 }]);
  const limiter = Marzipano.RectilinearView.limit.traditional(2048, 100 * Math.PI / 180, 120 * Math.PI / 180);
  const view = new Marzipano.RectilinearView(null, limiter);
  const scene = viewer.createScene({ source, geometry, view });
  return { name: data.name, scene: scene };
});

// Inicia na primeira cena
let currentSceneIndex = 0;
scenes[currentSceneIndex].scene.switchTo();

// === Cria a seta que segue o cursor ===
const floatingArrow = document.createElement('img');
floatingArrow.src = 'imagens/arrow.png';
floatingArrow.id = 'floatingArrow';
floatingArrow.style.position = 'fixed';
floatingArrow.style.width = '50px';
floatingArrow.style.height = '50px';
floatingArrow.style.pointerEvents = 'none';
floatingArrow.style.zIndex = '9999';
floatingArrow.style.transition = 'transform 0.2s ease';
document.body.appendChild(floatingArrow);

// Atualiza posição e rotação da seta
document.addEventListener('mousemove', (event) => {
  const middle = window.innerWidth / 2;
  const mouseX = event.clientX;

  // Atualiza posição da seta
  floatingArrow.style.left = `${mouseX - 25}px`;
  floatingArrow.style.top = `${event.clientY - 25}px`;

  // Rotaciona dependendo do lado (esquerda = 180°, direita = 0°)
  if (mouseX < middle) {
    floatingArrow.style.transform = 'rotate(180deg)';
  } else {
    floatingArrow.style.transform = 'rotate(0deg)';
  }
});

// Clica para mudar de cena
document.addEventListener('click', (event) => {
  const middle = window.innerWidth / 2;
  const mouseX = event.clientX;

  if (mouseX > middle && currentSceneIndex < scenes.length - 1) {
    currentSceneIndex++;
    scenes[currentSceneIndex].scene.switchTo();
  } else if (mouseX <= middle && currentSceneIndex > 0) {
    currentSceneIndex--;
    scenes[currentSceneIndex].scene.switchTo();
  }
});
