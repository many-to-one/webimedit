// =========================
// LASSO CANVAS SETUP
// =========================
const lassoCanvas = document.getElementById("lassoCanvas");
lassoCanvas.width = glcanvas.width;
lassoCanvas.height = glcanvas.height;

lassoCanvas.style.position = "absolute";
lassoCanvas.style.left = "0px";
lassoCanvas.style.top = "0px";
lassoCanvas.style.pointerEvents = "none";
lassoCanvas.style.zIndex = "999998";

// =========================
// LASSO STATE
// =========================
let lassoPoints = [];
let lassoActive = false;
let previewPoint = null;

// =========================
// MOUSE EVENTS
// =========================
glcanvas.addEventListener("click", e => {
    const p = getMousePos(e);

    if (!lassoActive) {
        lassoActive = true;
        lassoPoints = [p];
        previewPoint = null;
        drawLasso();
        return;
    }

    // check closing
    const first = lassoPoints[0];
    const dx = p.x - first.x;
    const dy = p.y - first.y;

    if (lassoPoints.length > 2 && Math.sqrt(dx*dx + dy*dy) < 10) {
        closeLasso();
        return;
    }

    lassoPoints.push(p);
    previewPoint = null;
    drawLasso();
});

glcanvas.addEventListener("mousemove", e => {
    if (!lassoActive) return;
    previewPoint = getMousePos(e);
    drawLasso();
});

// =========================
// GET MOUSE POSITION
// =========================

function getMousePos(e) {
    const rect = lassoCanvas.getBoundingClientRect();

    const scaleX = lassoCanvas.width  / rect.width;
    const scaleY = lassoCanvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const yScreen = (e.clientY - rect.top);
    const y = (rect.height - yScreen) * scaleY; // odwrócenie + skala

    console.log("Mouse pos (canvas):", { x, y });

    return { x, y };
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


// =========================
// DRAW LASSO
// =========================
function drawLasso() {
    const ctx = lassoCanvas.getContext("2d");
    ctx.clearRect(0, 0, lassoCanvas.width, lassoCanvas.height);

    if (lassoPoints.length === 0) return;

    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);

    for (let p of lassoPoints) {
        ctx.lineTo(p.x, p.y);
    }

    if (previewPoint) {
        ctx.lineTo(previewPoint.x, previewPoint.y);
    }

    ctx.strokeStyle = "#00aaff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // draw points
    for (let p of lassoPoints) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00aaff";
        ctx.fill();
    }
}

// =========================
// CLOSE LASSO
// =========================
function closeLasso() {
    lassoActive = false;
    previewPoint = null;

    const ctx = lassoCanvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    for (let p of lassoPoints) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.stroke();

    createLassoMask();
}

// =========================
// MASK CANVAS
// =========================
let lassoMaskCanvas = document.createElement("canvas");
lassoMaskCanvas.width = glcanvas.width;
lassoMaskCanvas.height = glcanvas.height;

// =========================
// CREATE MASK
// =========================
function createLassoMask() {
    const ctx = lassoMaskCanvas.getContext("2d");

    ctx.clearRect(0, 0, lassoMaskCanvas.width, lassoMaskCanvas.height);

    ctx.beginPath();
    ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
    for (let p of lassoPoints) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();

    uploadMaskToWebGL();
}

// =========================
// UPLOAD MASK TO WEBGL
// =========================
let maskTexture = gl.createTexture();

function uploadMaskToWebGL() {
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);

    // flip Y so mask matches WebGL UV
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        lassoMaskCanvas
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}
