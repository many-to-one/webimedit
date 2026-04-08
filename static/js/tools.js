// =========================
// GLOBALNE STANY NARZĘDZI
// =========================
window.ABR

var toolMode = "paint";

// ERASER STATE
let isErasing = false;
let eraserRadius = 80;
let eraserPower = 1.0;
let pendingEraserPoints = [];
let isEraserRendering = false;

// BRUSH STATE
let isBrushing = false;
let brushRadius = 40;
let brushColor = "#000000";
let brushShape = "circle";
let customBrushImage = null;
let pendingBrushPoints = [];
let isBrushRendering = false;

// TRANSFORM
const importBtn = document.getElementById("tool-import");
const importLayerInput = document.getElementById("importLayerInput");

const transformSettings = document.getElementById("transformSettings");
const layerScaleInput = document.getElementById("layerScale");
const layerRotationInput = document.getElementById("layerRotation");
const layerPosXInput = document.getElementById("layerPosX");
const layerPosYInput = document.getElementById("layerPosY");

let activeTransformLayer = null;


// =========================
// ELEMENTY UI
// =========================
const eraserBtn = document.getElementById("tool-eraser");
const brushBtn  = document.getElementById("tool-brush");
const moveBtn   = document.getElementById("tool-move");
const zoomBtn   = document.getElementById("tool-zoom");

const eraserSettings = document.getElementById("eraserSettings");
const brushSettings  = document.getElementById("brushSettings");
// const canvas         = document.getElementById("canvas");
// const canvas = document.getElementById("glcanvas");


// BRUSH INPUTS
const brushColorInput  = document.getElementById("brushColor");
const brushRadiusInput = document.getElementById("brushRadius");
const brushShapeInput  = document.getElementById("brushShape");
const customBrushInput = document.getElementById("customBrushInput");

// ERASER INPUTS
const radiusSlider = document.getElementById("radiusSlider");
const powerSlider  = document.getElementById("powerSlider");

// FILL INPUTS
const fillBtn = document.getElementById("tool-fill");
const fillSettings = document.getElementById("fillSettings");
const fillColorInput = document.getElementById("fillColor");
const fillModeInput = document.getElementById("fillMode");
const applyFillBtn = document.getElementById("applyFillBtn");

let fillColor = "#ffffff";
let fillMode = "normal";


// =========================
// KURSORY
// =========================
const eraserCursor = document.createElement("div");
eraserCursor.style.position = "fixed";
eraserCursor.style.pointerEvents = "none";
eraserCursor.style.zIndex = "9999";
eraserCursor.style.width = `${eraserRadius * 2}px`;
eraserCursor.style.height = `${eraserRadius * 2}px`;
eraserCursor.style.border = "1px solid rgba(255, 0, 0, 0.8)";
eraserCursor.style.borderRadius = "50%";
eraserCursor.style.transform = "translate(-50%, -50%)";
eraserCursor.style.display = "none";
eraserCursor.style.mixBlendMode = "difference";
document.body.appendChild(eraserCursor);

const brushCursor = document.createElement("div");
brushCursor.style.position = "fixed";
brushCursor.style.pointerEvents = "none";
brushCursor.style.zIndex = "9999";
brushCursor.style.border = "1px solid rgba(0,255,0,0.8)";
brushCursor.style.borderRadius = "50%";
brushCursor.style.transform = "translate(-50%, -50%)";
brushCursor.style.display = "none";
brushCursor.style.mixBlendMode = "difference";
document.body.appendChild(brushCursor);

// =========================
// AKTYWACJA NARZĘDZI
// =========================

window.activateTool = function(name) {

    toolMode = name;

    // reset active btn
    document.querySelectorAll(".toolBtn")
        .forEach(btn => btn.classList.remove("active"));

    if (name === "eraser") eraserBtn.classList.add("active");
    if (name === "brush")  brushBtn.classList.add("active");
    if (name === "fill")   fillBtn.classList.add("active");
    if (name === "move")   moveBtn.classList.add("active");
    if (name === "zoom")   zoomBtn.classList.add("active");

    // 🔥 KLUCZOWE: ukryj WSZYSTKIE panele
    allSettingsPanels.forEach(p => p.style.display = "none");

    // 🔥 pokaż tylko właściwy
    if (name === "eraser") eraserSettings.style.display = "block";
    if (name === "brush")  brushSettings.style.display  = "block";
    if (name === "transform") {
        transformSettings.style.display = "block";
        // if (activeTransformLayer) drawTransformBox(activeTransformLayer.transform.scale);
        console.log("moveBtn clicked", moveBtn);
        let visibleBox = document.getElementById("transBox");
        let boxHandles = document.querySelectorAll('.handle');
        if (!visibleBox) {
            drawTransformBox(activeTransformLayer.transform.scale);
            draw();
        };
        
        if (visibleBox.style.display === "none") {
            visibleBox.style.display = "block";
            boxHandles.forEach(h => h.style.display = "block");
        console.log("transBox active")
        } else {   
            transformSettings.style.display = "none";
            visibleBox.style.display = "none";
            boxHandles.forEach(h => h.style.display = "none");
        }
    }

    // kursory
    if (name === "brush") {
        canvas.style.cursor = "none";
        brushCursor.style.display = "block";
        eraserCursor.style.display = "none";
    }

    if (name === "fill") fillSettings.style.display = "block";

    else if (name === "eraser") {
        canvas.style.cursor = "none";
        eraserCursor.style.display = "block";
        brushCursor.style.display = "none";
    }

    else {
        canvas.style.cursor = "default";
        brushCursor.style.display = "none";
        eraserCursor.style.display = "none";
    }
};

// kliknięcia narzędzi
importBtn.onclick = () => importLayerInput.click();
eraserBtn.onclick = () => activateTool("eraser");
brushBtn.onclick  = () => activateTool("brush");
fillBtn.onclick = () => activateTool("fill");
moveBtn.onclick   = () => activateTool("transform");
zoomBtn.onclick   = () => activateTool("zoom");

// klik poza panelami = powrót do paint
document.addEventListener("click", (e) => {
    const clickedInsideTools =
        e.target.closest("#toolPanel") ||
        e.target.closest("#toolSettings");

    if (!clickedInsideTools) {
        toolMode = "paint";
        document.querySelectorAll(".toolBtn").forEach(btn => btn.classList.remove("active"));
        eraserSettings.style.display = "none";
        brushSettings.style.display  = "none";
        canvas.style.cursor = "default";
        eraserCursor.style.display = "none";
        brushCursor.style.display = "none";
    }
});

// =========================
// ERASER – INPUTY
// =========================
radiusSlider.oninput = (e) => {
    eraserRadius = parseInt(e.target.value);
};

powerSlider.oninput = (e) => {
    eraserPower = parseFloat(e.target.value);
};

// =========================
// BRUSH – INPUTY
// =========================
brushColorInput.oninput = e => brushColor = e.target.value;
brushRadiusInput.oninput = e => brushRadius = parseInt(e.target.value);
brushShapeInput.onchange = e => {
    brushShape = e.target.value;
    if (brushShape === "custom") customBrushInput.click();
};

customBrushInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();

    // Używamy globalnego ABR z window
    const abr = window.ABR.from(buffer);

    // Weź pierwszy brush
    const brush = abr.brushes[0];

    // Konwersja na obraz
    const image = brush.toImage();

    customBrushImage = image;
};


// =========================
//     FILL 
// =========================
fillColorInput.oninput = e => fillColor = e.target.value;
fillModeInput.onchange = e => fillMode = e.target.value;

applyFillBtn.onclick = () => {
    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    if (!layer.canvas) {
        const c = document.createElement("canvas");
        c.width = image.bmp.width;
        c.height = image.bmp.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(image.bmp, 0, 0);
        layer.canvas = c;

        layer.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, layer.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    const ctx = layer.canvas.getContext("2d");
    ctx.globalCompositeOperation = fillMode;
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);

    gl.bindTexture(gl.TEXTURE_2D, layer.tex);

    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        layer.canvas
    );

    draw();
};

function applyFill() {
    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    // jeśli warstwa nie ma canvasu, tworzymy go
    if (!layer.canvas) {
        const c = document.createElement("canvas");
        c.width = image.bmp.width;
        c.height = image.bmp.height;
        const ctx = c.getContext("2d");
        ctx.drawImage(image.bmp, 0, 0);
        layer.canvas = c;

        layer.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, layer.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    const ctx = layer.canvas.getContext("2d");
    ctx.globalCompositeOperation = fillMode;
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, layer.canvas.width, layer.canvas.height);

    // aktualizacja tekstury WebGL
    gl.bindTexture(gl.TEXTURE_2D, layer.tex);

    setTextureDefaults(gl);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        layer.canvas
    );

    draw();
}


// Funkcja do obliczania bounding box warstwy
function getBoundingBox(layer) {
    const hw = (layer.canvas.width * layer.transform.scale) / 2;
    const hh = (layer.canvas.height * layer.transform.scale) / 2;
    const points = [
        {x: -hw, y: -hh},
        {x: hw, y: -hh},
        {x: hw, y: hh},
        {x: -hw, y: hh}
    ];

    const cos = Math.cos(layer.transform.rotation * Math.PI / 180);
    const sin = Math.sin(layer.transform.rotation * Math.PI / 180);
    points.forEach(p => {
        const rx = p.x * cos - p.y * sin;
        const ry = p.x * sin + p.y * cos;
        p.x = rx + layer.transform.x;
        p.y = ry + layer.transform.y;
    });

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {minX, maxX, minY, maxY};
}


let _layer;
importLayerInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    // 🔥 używamy createImageBitmap — tak jak przy basic layer
    const bmp = await createImageBitmap(file, { premultiplyAlpha: 'default' });

    const image = images[currentImageIndex];

    const newLayer = createEmptyLayer(
        `Imported ${file.name}`,
        bmp.width,
        bmp.height,
        bmp,
    );

    // 🔥 Ustaw warstwę w centrum WebGL
    newLayer.transform.x = 0;
    newLayer.transform.y = 0;
    newLayer.transform.scale = 1;
    newLayer.transform.rotation = 0;


    // nadpisujemy canvas warstwy poprawnym obrazem
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    _layer = c
    const ctx = c.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    newLayer.canvas = c;

    image.layers.unshift(newLayer);

    image.layers[0].settings = {
              basic: { ...defaultBasicValues },
              calibration: { ...defaultCalibrationValues },
              hsl: Array(8).fill().map(() => ({ hue: 0, sat: 1, lig: 1 }))
            }
    image.activeLayer = 0;
    activeTransformLayer = newLayer;

    console.log("LAYER IMAGE", image.layers[0].canvas.style)
            
    updateLayerUI();
    // drawTransformBox(newLayer.transform.scale);
    draw();
};


// moveBtn.onclick = () => {
//     console.log("moveBtn clicked", moveBtn);
//     let visibleBox = document.getElementById("transBox");
//     let boxHandles = document.querySelectorAll('.handle');
//     if (!visibleBox) {
//         drawTransformBox(activeTransformLayer.transform.scale);
//         draw();
//     };
    
//     if (visibleBox.style.display === "none") {
//         visibleBox.style.display = "block";
//         boxHandles.forEach(h => h.style.display = "block");
//     console.log("transBox active")
//     } else {   
//         visibleBox.style.display = "none";
//         boxHandles.forEach(h => h.style.display = "none");
//     }
// };


let activeTransformLayerWidth;
let activeTransformLayerHeight;

// Obsługa suwaków transformacji
layerScaleInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.scale = parseFloat(e.target.value);
    console.log('activeTransformLayer', activeTransformLayer)
    drawTransformBox(activeTransformLayer.transform.scale)
    draw();
};

function drawTransformBox(scale_) {
    const layer = activeTransformLayer;
    if (!layer) return;
    console.log('drawTransformBox layer', layer)
    console.log('drawTB moveBtn', moveBtn)

    const image = images[currentImageIndex];
    const card = document.querySelector('.card-img');
    if (!card) return; // zabezpieczenie

    // usuń starą ramkę i uchwyty
    const oldBox = document.getElementById("transBox");
    if (oldBox) oldBox.remove();
    const oldHandles = document.querySelectorAll('.handle');
    oldHandles.forEach(h => h.remove());

    // Oblicz skalę pomiędzy WebGL canvas a HTML canvas
    const canvasRect = glcanvas.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    
    const htmlScaleX = canvasRect.width / glcanvas.width;
    const htmlScaleY = canvasRect.height / glcanvas.height;
    
    // Środek canvasu w HTML pixel space
    const midXInHTML = glcanvas.width / 2 * htmlScaleX;
    const midYInHTML = glcanvas.height / 2 * htmlScaleY;
    
    // Pozycja środka warstwy w viewport (dla position fixed)
    const centerXInHTML = canvasRect.left + midXInHTML + layer.transform.x * htmlScaleX;
    const centerYInHTML = canvasRect.top + midYInHTML + layer.transform.y * htmlScaleY;
    
    // Wymiary ramki (oryginalne wymiary * scale * htmlScale)
    const boxWidth = layer.canvas.width * layer.transform.scale * htmlScaleX;
    const boxHeight = layer.canvas.height * layer.transform.scale * htmlScaleY;

    // stwórz nową ramkę
    let box = document.createElement('div');
    box.id = "transBox";
    box.style.display = "block";
    box.style.position = "fixed";
    box.style.left = centerXInHTML + "px";
    box.style.top = centerYInHTML + "px";
    box.style.width = boxWidth + "px";
    box.style.height = boxHeight + "px";
    box.style.border = "2px solid #00aaff";
    box.style.pointerEvents = "none";
    box.style.zIndex = "999999";
    box.style.transform = `translate(-50%, -50%) rotate(${layer.transform.rotation}deg)`;
    box.style.transformOrigin = "center";
    
    document.body.appendChild(box);

    // Oblicz pozycje uchwytów po rotacji
    const cos = Math.cos(layer.transform.rotation * Math.PI / 180);
    const sin = Math.sin(layer.transform.rotation * Math.PI / 180);

    const handles = [
        {name: "tl", relX: -layer.canvas.width * layer.transform.scale / 2, relY: -layer.canvas.height * layer.transform.scale / 2},
        {name: "tm", relX: 0, relY: -layer.canvas.height * layer.transform.scale / 2},
        {name: "tr", relX: layer.canvas.width * layer.transform.scale / 2, relY: -layer.canvas.height * layer.transform.scale / 2},
        {name: "ml", relX: -layer.canvas.width * layer.transform.scale / 2, relY: 0},
        {name: "mr", relX: layer.canvas.width * layer.transform.scale / 2, relY: 0},
        {name: "bl", relX: -layer.canvas.width * layer.transform.scale / 2, relY: layer.canvas.height * layer.transform.scale / 2},
        {name: "bm", relX: 0, relY: layer.canvas.height * layer.transform.scale / 2},
        {name: "br", relX: layer.canvas.width * layer.transform.scale / 2, relY: layer.canvas.height * layer.transform.scale / 2}
    ];

    handles.forEach(h => {
        const rx = h.relX * cos - h.relY * sin;
        const ry = h.relX * sin + h.relY * cos;
        const handleXInHTML = centerXInHTML + rx * htmlScaleX;
        const handleYInHTML = centerYInHTML + ry * htmlScaleY;

        const dot = document.createElement("div");
        dot.className = "handle " + h.name;
        dot.style.position = "fixed";  // użyj fixed dla pozycji absolutnej względem viewport
        dot.style.left = handleXInHTML - 5 + "px";
        dot.style.top = handleYInHTML - 5 + "px";
        dot.style.width = "10px";
        dot.style.height = "10px";
        dot.style.background = "#00aaff";
        dot.style.border = "1px solid #fff";
        dot.style.cursor = "pointer";
        dot.style.pointerEvents = "auto";
        dot.style.zIndex = "1000000";
        document.body.appendChild(dot);  // dodaj do body
    });

    // Rotate handle
    const rotRelY = -layer.canvas.height * layer.transform.scale / 2 - 20 / htmlScaleY;
    const rotRX = 0 * cos - rotRelY * sin;
    const rotRY = 0 * sin + rotRelY * cos;
    const rotXInHTML = centerXInHTML + rotRX * htmlScaleX;
    const rotYInHTML = centerYInHTML + rotRY * htmlScaleY;

    const rot = document.createElement("div");
    rot.className = "handle rotate";
    rot.style.position = "fixed";
    rot.style.left = rotXInHTML - 5 + "px";
    rot.style.top = rotYInHTML - 5 + "px";
    rot.style.width = "10px";
    rot.style.height = "10px";
    rot.style.background = "#ffaa00";
    rot.style.border = "1px solid #fff";
    rot.style.cursor = "pointer";
    rot.style.pointerEvents = "auto";
    rot.style.zIndex = "1000000";
    document.body.appendChild(rot);

    console.log('drawTransformBox scale_', scale_)
}



document.addEventListener("mousedown", e => {
    if (e.target.classList.contains("rotate")) {
        startRotate(e);
        return;
    }

    if (e.target.classList.contains("handle")) {
        const handle = e.target.classList[1];
        startResize(handle, e);
    }
});

document.addEventListener("scroll", () => {
    // console.log("scroll");
    if (activeTransformLayer) drawTransformBox(activeTransformLayer.transform.scale);
    draw();
});




layerRotationInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.rotation = parseFloat(e.target.value);
    drawTransformBox(activeTransformLayer.transform.scale);
    draw();
};

layerPosXInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.x = parseFloat(e.target.value);
    drawTransformBox(activeTransformLayer.transform.scale);
    draw();
};

layerPosYInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.y = parseFloat(e.target.value);
    drawTransformBox(activeTransformLayer.transform.scale);
    draw();
};

// NEW TRANSFORM LOGIC

//mowe
document.addEventListener("keydown", e => { 
    if (!activeTransformLayer) return;

    const step = e.ctrlKey ? 10 : 0; // tylko z Ctrl

    if (step === 0) return;

    switch (e.key) {
        case "ArrowUp":
            activeTransformLayer.transform.y -= step;
            break;
        case "ArrowDown":
            activeTransformLayer.transform.y += step;
            break;
        case "ArrowLeft":
            activeTransformLayer.transform.x -= step;
            break;
        case "ArrowRight":
            activeTransformLayer.transform.x += step;
            break;
    }

    drawTransformBox(activeTransformLayer.transform.scale);
    draw();
});



// Przesuwanie
let isDraggingLayer = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

glcanvas.addEventListener("mousedown", e => {
    if (!activeTransformLayer) return;

    // tylko jeśli Ctrl jest wciśnięty
    if (!e.ctrlKey) return;

    const rect = glcanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (glcanvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (glcanvas.height / rect.height);


    // obliczamy offset, żeby warstwa nie skakała
    dragOffsetX = activeTransformLayer.transform.x - mx;
    dragOffsetY = activeTransformLayer.transform.y - my;

    isDraggingLayer = true;
});

glcanvas.addEventListener("mousemove", e => {
    if (!isDraggingLayer || !activeTransformLayer) return;

    const rect = glcanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (glcanvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (glcanvas.height / rect.height);


    activeTransformLayer.transform.x = mx + dragOffsetX;
    activeTransformLayer.transform.y = my + dragOffsetY;
    drawTransformBox(activeTransformLayer.transform.scale);
    draw();
});

glcanvas.addEventListener("mouseup", () => {
    isDraggingLayer = false;
});

glcanvas.addEventListener("mouseleave", () => {
    isDraggingLayer = false;
});


// scale
let draggingHandle = null;

document.addEventListener("mousedown", e => {
    if (e.target.classList.contains("rotate")) {
        startRotate(e);
        draggingHandle = "rotate";
        return;
    }

    if (e.target.classList.contains("handle")) {
        const handle = e.target.classList[1];
        draggingHandle = handle;
        startResize(handle, e);
    } else {
        draggingHandle = null;
    }
});

// Skalowanie podczas przeciągania
document.addEventListener("mousemove", e => {
    if (!draggingHandle) return;

    const rect = glcanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (glcanvas.width / rect.width);
    const my = (e.clientY - rect.top)  * (glcanvas.height / rect.height);

    const layer = activeTransformLayer;

    if (draggingHandle === "rotate") {
        const dx = mx - layer.transform.x;
        const dy = my - layer.transform.y;
        layer.transform.rotation = Math.atan2(dy, dx) * 180 / Math.PI;
    } else {
        // Proporcjonalne skalowanie wokół środka
        const centerX = layer.transform.x;
        const centerY = layer.transform.y;
        const w = layer.canvas.width * layer.transform.scale;
        const h = layer.canvas.height * layer.transform.scale;

        let originalDist;
        switch (draggingHandle) {
            case "tl":
            case "tr":
            case "bl":
            case "br":
                originalDist = Math.sqrt((w/2)**2 + (h/2)**2);
                break;
            case "tm":
            case "bm":
                originalDist = h/2;
                break;
            case "ml":
            case "mr":
                originalDist = w/2;
                break;
        }

        const dx = mx - centerX;
        const dy = my - centerY;
        let newDist;
        switch (draggingHandle) {
            case "tl":
            case "tr":
            case "bl":
            case "br":
                newDist = Math.sqrt(dx**2 + dy**2);
                break;
            case "tm":
                newDist = Math.abs(dy);
                break;
            case "bm":
                newDist = Math.abs(dy);
                break;
            case "ml":
                newDist = Math.abs(dx);
                break;
            case "mr":
                newDist = Math.abs(dx);
                break;
        }

        if (originalDist > 0) {
            layer.transform.scale = (newDist / originalDist) * layer.transform.scale;
            layer.transform.scale = Math.max(0.05, layer.transform.scale);
        }
    }

    drawTransformBox(layer.transform.scale);
    draw();
});

document.addEventListener("mouseup", () => {
    draggingHandle = null;
});




// =========================




// =========================
function setTextureDefaults(gl) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
}
// =========================



// =========================
// HELPERS
// =========================
function convertMouseToLayerCoords(mouseX, mouseY, layer, layerWidth, layerHeight) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const xCanvas = mouseX * scaleX;
    const yCanvas = mouseY * scaleY;
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    const t = layer.transform || { x: 0, y: 0, scale: 1, rotation: 0 };

    // convert screen-space canvas point to layer-space origin at layer center
    let localX = (xCanvas - canvasCenterX - t.x) / t.scale;
    let localY = (yCanvas - canvasCenterY - t.y) / t.scale;

    // undo rotation
    if (t.rotation && t.rotation !== 0) {
        const rad = -t.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotatedX = localX * cos - localY * sin;
        const rotatedY = localX * sin + localY * cos;
        localX = rotatedX;
        localY = rotatedY;
    }

    return {
        x: localX + layerWidth / 2,
        y: localY + layerHeight / 2
    };
}

// =========================
// MOUSEMOVE – KURSORY + KOLEJKI
// =========================
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

    // eraser cursor
    eraserCursor.style.left = `${e.clientX}px`;
    eraserCursor.style.top  = `${e.clientY}px`;

    if (toolMode === "eraser") {
        const image = images[currentImageIndex];
        const layer = image.layers[image.activeLayer];
        const baseW = layer.mask ? layer.mask.width : image.bmp.width;
        const baseH = layer.mask ? layer.mask.height : image.bmp.height;
        const scaleX = canvas.width / rect.width;
        const screenRadius = eraserRadius * layer.transform.scale * scaleX;

        eraserCursor.style.display = "block";
        eraserCursor.style.width  = `${screenRadius}px`;
        eraserCursor.style.height = `${screenRadius}px`;
    } else {
        eraserCursor.style.display = "none";
    }

    // brush cursor
    brushCursor.style.left = `${e.clientX}px`;
    brushCursor.style.top  = `${e.clientY}px`;

    if (toolMode === "brush") {
        const image = images[currentImageIndex];
        const layer = image.layers[image.activeLayer];
        const baseW = layer.canvas ? layer.canvas.width : image.bmp.width;
        const baseH = layer.canvas ? layer.canvas.height : image.bmp.height;
        const scaleX = canvas.width / rect.width;
        const screenRadius = brushRadius * layer.transform.scale * scaleX;
        brushCursor.style.display = "block";
        brushCursor.style.width  = `${screenRadius}px`;
        brushCursor.style.height = `${(screenRadius)}px`;
    } else {
        brushCursor.style.display = "none";
    }

    // eraser drawing
    if (toolMode === "eraser" && isErasing) {
        pendingEraserPoints.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        if (!isEraserRendering) requestAnimationFrame(processEraserQueue);
    }

    // brush drawing
    if (toolMode === "brush" && isBrushing) {
        pendingBrushPoints.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        if (!isBrushRendering) requestAnimationFrame(processBrushQueue);
    }
});

// =========================
// MOUSEDOWN / MOUSEUP
// =========================
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();

    if (toolMode === "fill") {
        applyFill();
        return;
    }

    if (toolMode === "eraser") {
        isErasing = true;
        pendingEraserPoints.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        if (!isEraserRendering) requestAnimationFrame(processEraserQueue);
    }

    if (toolMode === "brush") {
        isBrushing = true;
        pendingBrushPoints.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        if (!isBrushRendering) requestAnimationFrame(processBrushQueue);
    }

});

canvas.addEventListener("mouseup", () => {
    isErasing = false;
    isBrushing = false;
});

// =========================
// ERASER – BATCH PROCESS
// =========================
function processEraserQueue() {
    isEraserRendering = true;

    if (pendingEraserPoints.length === 0) {
        isEraserRendering = false;
        return;
    }

    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    if (!layer.mask) {
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = image.bmp.width;
        maskCanvas.height = image.bmp.height;
        const initCtx = maskCanvas.getContext("2d");
        initCtx.fillStyle = "rgba(255,255,255,1)";
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
    const layerWidth = layer.mask ? layer.mask.width : image.bmp.width;
    const layerHeight = layer.mask ? layer.mask.height : image.bmp.height;

    const ctx = layer.mask.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";

    for (const p of pendingEraserPoints) {
        const point = convertMouseToLayerCoords(p.x, p.y, layer, layerWidth, layerHeight);

        const grad = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, eraserRadius);
        grad.addColorStop(0, `rgba(0,0,0,${eraserPower})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(point.x - eraserRadius, point.y - eraserRadius, eraserRadius * 2, eraserRadius * 2);
    }

    pendingEraserPoints = [];

    updateMaskTexture(layer);
    draw();

    requestAnimationFrame(processEraserQueue);
}

// =========================
// BRUSH – BATCH PROCESS
// =========================
function processBrushQueue() {
    isBrushRendering = true;

    if (pendingBrushPoints.length === 0) {
        isBrushRendering = false;
        return;
    }

    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    if (!layer.canvas) {
        const c = document.createElement("canvas");
        c.width = image.bmp.width;
        c.height = image.bmp.height;
        const ctx = c.getContext("2d");
        // const ctx = c.getContext("2d", { alpha: true });
        ctx.drawImage(image.bmp, 0, 0);
        layer.canvas = c;

        layer.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, layer.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); // 🔥 ważne
    }

    const rect = canvas.getBoundingClientRect();
    const layerWidth = layer.canvas ? layer.canvas.width : image.bmp.width;
    const layerHeight = layer.canvas ? layer.canvas.height : image.bmp.height;

    const ctx = layer.canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = brushColor;

    for (const p of pendingBrushPoints) {
        const point = convertMouseToLayerCoords(p.x, p.y, layer, layerWidth, layerHeight);

        if (brushShape === "circle") {
            ctx.beginPath();
            ctx.arc(point.x, point.y, brushRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (brushShape === "square") {
            ctx.fillRect(point.x - brushRadius, point.y - brushRadius, brushRadius * 2, brushRadius * 2);
        } else if (brushShape === "custom" && customBrushImage) {
            ctx.drawImage(
                customBrushImage,
                point.x - brushRadius,
                point.y - brushRadius,
                brushRadius * 2,
                brushRadius * 2
            );
        }
    }

    pendingBrushPoints = [];

    gl.bindTexture(gl.TEXTURE_2D, layer.tex);
    setTextureDefaults(gl);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        layer.canvas
    );

    draw();

    requestAnimationFrame(processBrushQueue);
}



// document.addEventListener("click", e => {
//     console.log("click", e.target);
//     image = images[currentImageIndex];
//     layer = image.layers[image.activeLayer];
//     console.log("active layer", layer.transform);

//      // 5. Punkt kliknięcia
//     const px = e.clientX;
//     const py = e.clientY;
//     console.log("click at", px, py);

// });

