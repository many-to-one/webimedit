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




function startRotate(e) {
    const layer = activeTransformLayer;

    const rect = document.getElementById("transBox").getBoundingClientRect();

    // środek ramki (i warstwy)
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const startAngle = layer.transform.rotation;

    // początkowy kąt względem środka
    const startX = e.clientX - cx;
    const startY = e.clientY - cy;
    const startTheta = Math.atan2(startY, startX);

    function onMove(ev) {
        const x = ev.clientX - cx;
        const y = ev.clientY - cy;

        const theta = Math.atan2(y, x);

        // różnica kątów
        const delta = theta - startTheta;

        // konwersja na stopnie
        const deg = delta * 180 / Math.PI;

        layer.transform.rotation = startAngle + deg;

        drawTransformBox(layer.transform.scale);
        draw();
    }

    function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
}
