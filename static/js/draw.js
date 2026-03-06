let tex = null;

function draw() {
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
  for (let i = visibleLayers.length - 1; i >= 0; i--) {
    const layer = visibleLayers[i];
    const s = layer.settings;

    // Bind main image texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex); // gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);

    // Bind mask texture if it exists
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, layer.maskTex || null);
    gl.uniform1i(gl.getUniformLocation(prog, "u_mask"), 1);

    // Set shader uniforms
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

    // Draw the quad for this layer
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Disable blending after draw (optional cleanup)
  gl.disable(gl.BLEND);
}


// function draw() {
//   if (currentImageIndex === null) return;

//   const image = images[currentImageIndex];
//   const visibleLayers = image.layers.filter(l => l.visible);

//   // Jeśli nie ma żadnych warstw ani bmp → wyczyść canvas
//   if (visibleLayers.length === 0 && !image.bmp) {
//     gl.viewport(0, 0, canvas.width, canvas.height);
//     gl.clearColor(0, 0, 0, 0);
//     gl.clear(gl.COLOR_BUFFER_BIT);
//     return;
//   }

//   // Clear transparent background
//   gl.viewport(0, 0, canvas.width, canvas.height);
//   gl.clearColor(0, 0, 0, 0);
//   gl.clear(gl.COLOR_BUFFER_BIT);

//   // Enable alpha blending
//   gl.enable(gl.BLEND);
//   gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

//   gl.useProgram(prog);

//   // Draw layers from bottom → top
//   for (let i = visibleLayers.length - 1; i >= 0; i--) {
//     const layer = visibleLayers[i];
//     const s = layer.settings;

//     // ✅ Bind layer texture (not always global tex)
//     gl.activeTexture(gl.TEXTURE0);
//     gl.bindTexture(gl.TEXTURE_2D, layer.tex || tex); // jeśli warstwa ma własną teksturę, użyj jej
//     gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);

//     // Bind mask texture if it exists
//     gl.activeTexture(gl.TEXTURE1);
//     gl.bindTexture(gl.TEXTURE_2D, layer.maskTex || null);
//     gl.uniform1i(gl.getUniformLocation(prog, "u_mask"), 1);

//     // Set shader uniforms
//     for (const key in s.basic) {
//       gl.uniform1f(basicUniforms[key], s.basic[key]);
//     }

//     for (let j = 0; j < 8; j++) {
//       gl.uniform1f(uniforms[`hue${j}`], s.hsl[j].hue);
//       gl.uniform1f(uniforms[`sat${j}`], s.hsl[j].sat);
//       gl.uniform1f(uniforms[`lig${j}`], s.hsl[j].lig);
//     }

//     for (const key in s.calibration) {
//       gl.uniform1f(calUniforms[key], s.calibration[key]);
//     }

//     // Draw quad
//     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
//   }

//   gl.disable(gl.BLEND);
// }
