const HANDLE_DIR = {
    tl: { x: -1, y: -1 },
    tm: { x:  0, y: -1 },
    tr: { x:  1, y: -1 },
    ml: { x: -1, y:  0 },
    mr: { x:  1, y:  0 },
    bl: { x: -1, y:  1 },
    bm: { x:  0, y:  1 },
    br: { x:  1, y:  1 }
};

function startResize(handle, e) {
    const dir = HANDLE_DIR[handle];
    const layer = activeTransformLayer;

    const startX = e.clientX;
    const startY = e.clientY;

    const startScale = layer.transform.scale;

    const w = layer.canvas.width;
    const h = layer.canvas.height;

    // odległość od środka warstwy
    const diag = Math.sqrt(w*w + h*h);

    function onMove(ev) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        // projekcja ruchu na kierunek uchwytu
        const proj = dx * dir.x + dy * dir.y;

        // zmiana skali proporcjonalna do przekątnej
        const delta = proj / diag;

        const newScale = Math.max(0.05, startScale + delta);

        layer.transform.scale = newScale;

        drawTransformBox(newScale);
        draw();
    }

    function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
}
