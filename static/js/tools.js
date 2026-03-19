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
    if (name === "move")   moveBtn.classList.add("active");
    if (name === "zoom")   zoomBtn.classList.add("active");

    // 🔥 KLUCZOWE: ukryj WSZYSTKIE panele
    allSettingsPanels.forEach(p => p.style.display = "none");

    // 🔥 pokaż tylko właściwy
    if (name === "eraser") eraserSettings.style.display = "block";
    if (name === "brush")  brushSettings.style.display  = "block";
    if (name === "transform") transformSettings.style.display = "block";

    // kursory
    if (name === "brush") {
        canvas.style.cursor = "none";
        brushCursor.style.display = "block";
        eraserCursor.style.display = "none";
    }

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

// customBrushInput.onchange = e => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const img = new Image();
//     img.onload = () => customBrushImage = img;
//     img.src = URL.createObjectURL(file);
// };
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


// =========================
// TRANSFORM
// =========================

// Import obrazu jako nowej warstwy
importLayerInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
        const image = images[currentImageIndex];

        const newLayer = createEmptyLayer(
            `Imported ${file.name}`,
            img.width,
            img.height,
            img
        );

        // tworzymy canvas warstwy
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d");
        // const ctx = c.getContext("2d", { alpha: true });
        ctx.drawImage(img, 0, 0);
        // newLayer.canvas = c;

        // tekstura WebGL
        newLayer.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, newLayer.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);

        // image.layers.push(newLayer);
        image.layers.unshift(newLayer);
        image.activeLayer = 0;

        activeTransformLayer = newLayer;

        updateLayerUI();
        draw();
    };

    img.src = URL.createObjectURL(file);
};


// Obsługa suwaków transformacji
layerScaleInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.scale = parseFloat(e.target.value);
    draw();
};

layerRotationInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.rotation = parseFloat(e.target.value);
    draw();
};

layerPosXInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.x = parseFloat(e.target.value);
    draw();
};

layerPosYInput.oninput = e => {
    if (!activeTransformLayer) return;
    activeTransformLayer.transform.y = parseFloat(e.target.value);
    draw();
};



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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const ctx = layer.mask.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";

    for (const p of pendingEraserPoints) {

        const t = layer.transform;
        const normX = ((p.x * scaleX) - t.x) / t.scale;
        const normY = ((p.y * scaleY) - t.y) / t.scale;

        const grad = ctx.createRadialGradient(normX, normY, 0, normX, normY, eraserRadius);
        grad.addColorStop(0, `rgba(0,0,0,${eraserPower})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(normX - eraserRadius, normY - eraserRadius, eraserRadius * 2, eraserRadius * 2);
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const ctx = layer.canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = brushColor;

    for (const p of pendingBrushPoints) {

        const t = layer.transform;
        const x = ((p.x * scaleX) - t.x) / t.scale;
        const y = ((p.y * scaleY) - t.y) / t.scale;

        if (brushShape === "circle") {
            ctx.beginPath();
            ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (brushShape === "square") {
            ctx.fillRect(x - brushRadius, y - brushRadius, brushRadius * 2, brushRadius * 2);
        } else if (brushShape === "custom" && customBrushImage) {
            ctx.drawImage(
                customBrushImage,
                x - brushRadius,
                y - brushRadius,
                brushRadius * 2,
                brushRadius * 2
            );
        }
    }

    pendingBrushPoints = [];

    gl.bindTexture(gl.TEXTURE_2D, layer.tex);
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
