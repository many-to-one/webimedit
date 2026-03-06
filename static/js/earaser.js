let toolMode = 'paint';
let isErasing = false;
let eraserRadius = 80;
let eraserPower = 1.0;

// batching dla gumki
let pendingEraserPoints = [];
let isRendering = false;

// ELEMENTY UI – WSPÓLNE
const eraserBtn = document.getElementById('tool-eraser');
const brushBtn  = document.getElementById('tool-brush');
const moveBtn   = document.getElementById('tool-move');
const zoomBtn   = document.getElementById('tool-zoom');

const eraserSettings = document.getElementById('eraserSettings');
const brushSettings  = document.getElementById('brushSettings');
const canvas         = document.getElementById('canvas');


// klik poza panelem = dezaktywacja narzędzi
document.addEventListener('click', (e) => {
  const clickedInsideTools =
    e.target.closest('#toolPanel') ||
    e.target.closest('#toolSettings');

  if (!clickedInsideTools) {
    toolMode = 'paint';

    document.querySelectorAll('.toolBtn')
      .forEach(btn => btn.classList.remove('active'));

    eraserSettings.style.display = 'none';
    canvas.style.cursor = 'default';
  }
});

// 🔹 Funkcja aktywująca narzędzie
function activateTool(name) {
  toolMode = name;

  document.querySelectorAll('.toolBtn').forEach(btn => btn.classList.remove('active'));

  if (name === 'eraser') eraserBtn.classList.add('active');
  if (name === 'brush') brushBtn.classList.add('active');
  if (name === 'move') moveBtn.classList.add('active');
  if (name === 'zoom') zoomBtn.classList.add('active');

  // if (name === 'brush') {
  //   brushSettings.style.display = 'block';
  //   eraserSettings.style.display = 'none';
  // }

  eraserSettings.style.display = name === 'eraser' ? 'block' : 'none';
  canvas.style.cursor = name === 'eraser' ? 'crosshair' : 'default';
}

// 🔹 Kliknięcia narzędzi
eraserBtn.onclick = () => activateTool('eraser');
brushBtn.onclick = () => activateTool('brush');
moveBtn.onclick = () => activateTool('move');
zoomBtn.onclick = () => activateTool('zoom');

// 🔹 Customowy okrąg kursora
const eraserCursor = document.createElement('div');
eraserCursor.style.position = 'fixed';
eraserCursor.style.pointerEvents = 'none';
eraserCursor.style.zIndex = '9999';
eraserCursor.style.width = `${eraserRadius * 2}px`;
eraserCursor.style.height = `${eraserRadius * 2}px`;
eraserCursor.style.border = '1px solid rgba(255, 0, 0, 0.8)';
eraserCursor.style.borderRadius = '50%';
eraserCursor.style.transform = 'translate(-50%, -50%)';
eraserCursor.style.display = 'none';
eraserCursor.style.mixBlendMode = 'difference';
document.body.appendChild(eraserCursor);

// 🔹 Slidery gumki
document.getElementById('radiusSlider').oninput = (e) => {
  eraserRadius = parseInt(e.target.value);
};

document.getElementById('powerSlider').oninput = (e) => {
  eraserPower = parseFloat(e.target.value);
};

// 🔹 Ruch kursora + kolejka punktów do gumki
canvas.onmousemove = (e) => {
  eraserCursor.style.left = `${e.clientX}px`;
  eraserCursor.style.top = `${e.clientY}px`;

  if (toolMode === 'eraser') {
    eraserCursor.style.display = 'block';

    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    const rect = canvas.getBoundingClientRect();
    const baseW = layer.mask ? layer.mask.width : image.bmp.width;
    const baseH = layer.mask ? layer.mask.height : image.bmp.height;
    const scaleX = baseW / rect.width;
    const scaleY = baseH / rect.height;
    const scale = (scaleX + scaleY) / 2;

    eraserCursor.style.width = `${(eraserRadius / scale) * 2}px`;
    eraserCursor.style.height = `${(eraserRadius / scale) * 2}px`;
  } else {
    eraserCursor.style.display = 'none';
  }

  if (toolMode === 'eraser' && isErasing) {
    const rect = canvas.getBoundingClientRect();
    pendingEraserPoints.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    if (!isRendering) requestAnimationFrame(processEraserQueue);
  }

};

// 🔹 Erasing – start
canvas.addEventListener('mousedown', e => {
  if (toolMode !== 'eraser') return;
  isErasing = true;

  const rect = canvas.getBoundingClientRect();
  pendingEraserPoints.push({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  });

  if (!isRendering) requestAnimationFrame(processEraserQueue);
});

canvas.addEventListener('mouseup', () => {
  isErasing = false;
});

// 🔹 Przetwarzanie kolejki punktów gumki (batching)
function processEraserQueue() {
  isRendering = true;

  if (pendingEraserPoints.length === 0) {
    isRendering = false;
    return;
  }

  const image = images[currentImageIndex];
  const layer = image.layers[image.activeLayer];

  if (!layer.mask) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = image.bmp.width;
    maskCanvas.height = image.bmp.height;
    const initCtx = maskCanvas.getContext('2d');
    initCtx.fillStyle = 'rgba(255,255,255,1)';
    initCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    layer.mask = maskCanvas;
    layer.maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, layer.maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  const rect = canvas.getBoundingClientRect();
  const scaleX = layer.mask.width / rect.width;
  const scaleY = layer.mask.height / rect.height;

  const ctx = layer.mask.getContext('2d');
  ctx.globalCompositeOperation = 'destination-out';

  for (const p of pendingEraserPoints) {
    const normX = p.x * scaleX;
    const normY = p.y * scaleY;

    const grad = ctx.createRadialGradient(normX, normY, 0, normX, normY, eraserRadius);
    grad.addColorStop(0, `rgba(0,0,0,${eraserPower})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(normX - eraserRadius, normY - eraserRadius, eraserRadius * 2, eraserRadius * 2);
  }

  pendingEraserPoints = [];

  updateMaskTexture(layer);
  draw();

  requestAnimationFrame(processEraserQueue);
}

// 🔹 Zachowana funkcja eraseAt – teraz korzysta z kolejki
function eraseAt(x, y) {
  pendingEraserPoints.push({ x, y });
  if (!isRendering) requestAnimationFrame(processEraserQueue);
}

