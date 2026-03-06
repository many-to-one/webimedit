/* ---------- Zoom logic with slider ---------- */

const zoomSlider = document.getElementById('zoomSlider'); 
const zoomVal = document.getElementById('zoomVal');

zoomSlider.addEventListener('input', () => {
  const scale = Number(zoomSlider.value) / 100;
  canvas.style.transform = `scale(${scale}) rotateX(180deg)`;
  // canvas.style.transformOrigin = 'top left';
  zoomVal.textContent = `${zoomSlider.value}%`;
});

/* ---------- Zoom logic with mouse scroll and cursor moving ---------- */

canvas.addEventListener('wheel', (event) => {
  if (!event.ctrlKey) return; // Ignore scroll unless Ctrl is held

  event.preventDefault(); // Prevent page zoom or scroll

  const delta = Math.sign(event.deltaY); // -1 for zoom in, 1 for zoom out
  let currentZoom = Number(zoomSlider.value);

  const step = 10;
  currentZoom -= delta * step;

  currentZoom = Math.max(zoomSlider.min, Math.min(zoomSlider.max, currentZoom));

  zoomSlider.value = currentZoom;
  const scale = currentZoom / 100;
  canvas.style.transform = `scale(${scale}) rotateX(180deg)`;
  zoomVal.textContent = `${currentZoom}%`;
});

let isDragging = false;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;


// canvas.onmousedown = (e) => {
//   const rect = canvas.getBoundingClientRect();
//   const x = e.clientX - rect.left;
//   const y = e.clientY - rect.top;

//   if (toolMode === 'eraser') {
//     eraseAt(x, y);
//     isErasing = true;
//   } else {
//     // your drag logic here
//     isDragging = true;
//     dragStartX = x;
//     dragStartY = y;
//   }
// };


canvas.onmousedown = (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (toolMode === 'eraser') {
    isErasing = true;
    // Don't erase here — let mousemove handle it
  } else {
    isDragging = true;
    dragStartX = x;
    dragStartY = y;
  }
};


canvas.onmouseup = () => {
  isDragging = false;
  isErasing = false;
};



canvas.oncontextmenu = (e) => e.preventDefault();
canvas.ondragstart = (e) => e.preventDefault();


function applyTransform() {
  const scale = Number(zoomSlider.value) / 100;
  canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale}) rotateX(180deg)`;
}