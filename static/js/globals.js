// ===============================
// GLOBAL STATE
// ===============================

window.toolMode = "paint";

window.canvas = document.getElementById("canvas");

window.images = window.images || [];
window.currentImageIndex = window.currentImageIndex || 0;


// ===============================
// UI ELEMENTS
// ===============================

window.eraserBtn = document.getElementById("tool-eraser");
window.brushBtn  = document.getElementById("tool-brush");
window.moveBtn   = document.getElementById("tool-move");
window.zoomBtn   = document.getElementById("tool-zoom");

window.eraserSettings = document.getElementById("eraserSettings");
window.brushSettings  = document.getElementById("brushSettings");


// ===============================
// CURSORS
// ===============================

window.brushCursor = document.createElement("div");
brushCursor.style.position = "fixed";
brushCursor.style.pointerEvents = "none";
brushCursor.style.zIndex = "9999";
brushCursor.style.border = "1px solid rgba(0,255,0,0.8)";
brushCursor.style.borderRadius = "50%";
brushCursor.style.transform = "translate(-50%, -50%)";
brushCursor.style.display = "none";
brushCursor.style.mixBlendMode = "difference";
document.body.appendChild(brushCursor);


window.eraserCursor = document.createElement("div");
eraserCursor.style.position = "fixed";
eraserCursor.style.pointerEvents = "none";
eraserCursor.style.zIndex = "9999";
eraserCursor.style.border = "1px solid rgba(255,0,0,0.8)";
eraserCursor.style.borderRadius = "50%";
eraserCursor.style.transform = "translate(-50%, -50%)";
eraserCursor.style.display = "none";
eraserCursor.style.mixBlendMode = "difference";
document.body.appendChild(eraserCursor);


// ===============================
// TOOL ACTIVATION
// ===============================

window.activateTool = function(name) {

    toolMode = name;

    document.querySelectorAll(".toolBtn")
        .forEach(btn => btn.classList.remove("active"));

    if (name === "eraser") eraserBtn.classList.add("active");
    if (name === "brush")  brushBtn.classList.add("active");
    if (name === "move")   moveBtn.classList.add("active");
    if (name === "zoom")   zoomBtn.classList.add("active");

    eraserSettings.style.display = name === "eraser" ? "block" : "none";
    brushSettings.style.display  = name === "brush"  ? "block" : "none";

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


// ===============================
// TOOL BUTTONS
// ===============================

brushBtn.onclick  = () => activateTool("brush");
eraserBtn.onclick = () => activateTool("eraser");
moveBtn.onclick   = () => activateTool("move");
zoomBtn.onclick   = () => activateTool("zoom");


// klik poza panelem = reset tool
document.addEventListener("click", (e) => {

    const inside =
        e.target.closest("#toolPanel") ||
        e.target.closest("#toolSettings");

    if (!inside) {

        toolMode = "paint";

        document.querySelectorAll(".toolBtn")
            .forEach(btn => btn.classList.remove("active"));

        eraserSettings.style.display = "none";
        brushSettings.style.display = "none";

        brushCursor.style.display = "none";
        eraserCursor.style.display = "none";

        canvas.style.cursor = "default";
    }

});