// =========================
// GLOBALNE STANY NARZĘDZI
// =========================
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

    document.querySelectorAll(".toolBtn").forEach(btn => btn.classList.remove("active"));
    if (name === "eraser") eraserBtn.classList.add("active");
    if (name === "brush")  brushBtn.classList.add("active");
    if (name === "move")   moveBtn.classList.add("active");
    if (name === "zoom")   zoomBtn.classList.add("active");

    eraserSettings.style.display = name === "eraser" ? "block" : "none";
    brushSettings.style.display  = name === "brush"  ? "block" : "none";

    if (name === "eraser") {
        canvas.style.cursor = "none";
        eraserCursor.style.display = "block";
        brushCursor.style.display = "none";
    } else if (name === "brush") {
        canvas.style.cursor = "none";
        brushCursor.style.display = "block";
        eraserCursor.style.display = "none";
    } else {
        canvas.style.cursor = "default";
        eraserCursor.style.display = "none";
        brushCursor.style.display = "none";
    }
};

// kliknięcia narzędzi
eraserBtn.onclick = () => activateTool("eraser");
brushBtn.onclick  = () => activateTool("brush");
moveBtn.onclick   = () => activateTool("move");
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

customBrushInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => customBrushImage = img;
    img.src = URL.createObjectURL(file);
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
        const scaleX = baseW / rect.width;
        const scaleY = baseH / rect.height;
        const scale = (scaleX + scaleY) / 2;
        eraserCursor.style.display = "block";
        eraserCursor.style.width  = `${(eraserRadius / scale) * 2}px`;
        eraserCursor.style.height = `${(eraserRadius / scale) * 2}px`;
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
        const scaleX = baseW / rect.width;
        const scaleY = baseH / rect.height;
        const scale = (scaleX + scaleY) / 2;
        brushCursor.style.display = "block";
        brushCursor.style.width  = `${(brushRadius / scale) * 2}px`;
        brushCursor.style.height = `${(brushRadius / scale) * 2}px`;
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
    const scaleX = layer.mask.width / rect.width;
    const scaleY = layer.mask.height / rect.height;

    const ctx = layer.mask.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";

    for (const p of pendingEraserPoints) {
        const normX = p.x * scaleX;
        const normY = p.y * scaleY;

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
        ctx.drawImage(image.bmp, 0, 0);
        layer.canvas = c;

        layer.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, layer.tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = layer.canvas.width / rect.width;
    const scaleY = layer.canvas.height / rect.height;

    const ctx = layer.canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = brushColor;

    for (const p of pendingBrushPoints) {
        const x = p.x * scaleX;
        const y = p.y * scaleY;

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
