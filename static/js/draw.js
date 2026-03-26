let tex = null;

function draw() {

  // overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

  if (!tex || currentImageIndex === null) return;

  const image = images[currentImageIndex];
  const visibleLayers = image.layers.filter(l => l.visible);

  // Clear transparent background (not black)
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // ✅ Enable alpha blending so layers mix correctly
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  gl.useProgram(prog);

  // Draw layers from bottom → top
  // for (let i = visibleLayers.length - 1; i >= 0; i--) {
  //   const layer = visibleLayers[i];
  for (let i = image.layers.length - 1; i >= 0; i--) {
    const layer = image.layers[i];

    if (!layer.visible) continue;
    
    const s = layer.settings;

    const t = layer.transform || { x: 0, y: 0, scale: 1, rotation: 0 };

    // transform
    gl.uniform1f(uScaleLoc, t.scale);
    gl.uniform1f(uRotationLoc, t.rotation * Math.PI / 180);
    gl.uniform2f(uTranslateLoc, t.x, t.y);
    gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
    
    const w = layer.canvas ? layer.canvas.width  : image.bmp.width;
    const h = layer.canvas ? layer.canvas.height : image.bmp.height;
    gl.uniform2f(uLayerSizeLoc, w, h);

    // Bind main image texture (use layer.tex if exists, else global tex)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, layer.tex || tex);
    gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);

    // Bind mask texture if it exists
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, layer.maskTex || null);
    gl.uniform1i(gl.getUniformLocation(prog, "u_mask"), 1);

    // Set shader uniforms
    // for (const key in s.basic) {
    //   gl.uniform1f(basicUniforms[key], s.basic[key]);
    // }

    for (const key in s.basic) {
      gl.uniform1f(basicUniforms[key], s.basic[key]);
    }

    for (let j = 0; j < 8; j++) {
      gl.uniform1f(uniforms[`hue${j}`], s.hsl[j].hue);
      gl.uniform1f(uniforms[`sat${j}`], s.hsl[j].sat);
      gl.uniform1f(uniforms[`lig${j}`], s.hsl[j].lig);
    }

    for (const key in s.calibration) {
      gl.uniform1f(calUniforms[key], s.calibration[key]);
    }


    for (let j = 0; j < 8; j++) {
      gl.uniform1f(uniforms[`hue${j}`], s.hsl[j].hue);
      gl.uniform1f(uniforms[`sat${j}`], s.hsl[j].sat);
      gl.uniform1f(uniforms[`lig${j}`], s.hsl[j].lig);
    }

    for (const key in s.calibration) {
      gl.uniform1f(calUniforms[key], s.calibration[key]);
    }

    // Draw the quad for this layer
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Disable blending after draw (optional cleanup)
  gl.disable(gl.BLEND);

  // syncOverlay();
  // drawTransformBox(activeTransformLayer)

}



function syncOverlay() {
    const rect = glcanvas.getBoundingClientRect();

    // CSS size (to match screen)
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.top = rect.top + "px";

    // INTERNAL pixel size (to match WebGL)
    overlay.width = glcanvas.width;
    overlay.height = glcanvas.height;
}


// Funkcja wykrywania uchwytu
// function drawTransformBox() {
//     const layer = activeTransformLayer;
//     if (!layer) return;

//     const ctx = glcanvas.getContext("2d");
//     ctx.clearRect(0, 0, overlay.width, overlay.height);

//     const { x, y, scale, rotation } = layer.transform;
//     const w = layer.canvas.width;
//     const h = layer.canvas.height;

//     const cx = glcanvas.width / 2;
//     const cy = glcanvas.height / 2;

//     ctx.save();

//     // 🔥 tak samo jak w WebGL: środek canvasa + przesunięcie warstwy
//     ctx.translate(cx + x, cy + y);
//     ctx.rotate(rotation * Math.PI / 180);
//     ctx.scale(scale, scale);

//     ctx.strokeStyle = "#00aaff";
//     ctx.lineWidth = 1.5;
//     ctx.strokeRect(-w/2, -h/2, w, h);

//     const size = 8;
//     const half = size / 2;
//     const points = [
//         [-w/2, -h/2],
//         [ w/2, -h/2],
//         [ w/2,  h/2],
//         [-w/2,  h/2]
//     ];

//     ctx.fillStyle = "#00aaff";
//     for (const [px, py] of points) {
//         ctx.fillRect(px - half, py - half, size, size);
//     }

//     ctx.beginPath();
//     ctx.arc(0, -h/2 - 20, 6, 0, Math.PI*2);
//     ctx.fill();

//     ctx.restore();
// }

