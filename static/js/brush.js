// let isBrushing = false;
// let brushRadius = 40;
// let brushColor = "#000000";
// let brushShape = "circle";
// let customBrushImage = null;

// // UI
// const brushSettings = document.getElementById("brushSettings");
// const brushColorInput = document.getElementById("brushColor");
// const brushRadiusInput = document.getElementById("brushRadius");
// const brushShapeInput = document.getElementById("brushShape");
// const customBrushInput = document.getElementById("customBrushInput");

// brushColorInput.oninput = e => brushColor = e.target.value;
// brushRadiusInput.oninput = e => brushRadius = parseInt(e.target.value);
// brushShapeInput.onchange = e => {
//   brushShape = e.target.value;
//   if (brushShape === "custom") customBrushInput.click();
// };

// customBrushInput.onchange = e => {
//   const file = e.target.files[0];
//   if (!file) return;

//   const img = new Image();
//   img.onload = () => customBrushImage = img;
//   img.src = URL.createObjectURL(file);
// };

// // cursor
// const brushCursor = document.createElement("div");
// brushCursor.style.position = "fixed";
// brushCursor.style.pointerEvents = "none";
// brushCursor.style.zIndex = "9999";
// brushCursor.style.border = "1px solid rgba(0,255,0,0.8)";
// brushCursor.style.borderRadius = "50%";
// brushCursor.style.transform = "translate(-50%, -50%)";
// brushCursor.style.display = "none";
// brushCursor.style.mixBlendMode = "difference";
// document.body.appendChild(brushCursor);

// // batch
// let pendingBrushPoints = [];
// let isBrushRendering = false;

// // activate tool
// function activateBrush() {
//   toolMode = "brush";

//   document.querySelectorAll(".toolBtn").forEach(btn => btn.classList.remove("active"));
//   brushBtn.classList.add("active");

//   eraserSettings.style.display = "none";
//   brushSettings.style.display = "block";

//   canvas.style.cursor = "none"; // używamy własnego kursora
// }

// // click
// brushBtn.onclick = activateBrush;

// // mousemove
// canvas.addEventListener("mousemove", e => {
//   brushCursor.style.left = `${e.clientX}px`;
//   brushCursor.style.top = `${e.clientY}px`;

//   if (toolMode === "brush") {
//     brushCursor.style.display = "block";
//     brushCursor.style.width = `${brushRadius * 2}px`;
//     brushCursor.style.height = `${brushRadius * 2}px`;
//   } else {
//     brushCursor.style.display = "none";
//   }

//   if (toolMode !== "brush" || !isBrushing) return;

//   const rect = canvas.getBoundingClientRect();
//   pendingBrushPoints.push({
//     x: e.clientX - rect.left,
//     y: e.clientY - rect.top
//   });

//   if (!isBrushRendering) requestAnimationFrame(processBrushQueue);
// });

// // mousedown
// canvas.addEventListener("mousedown", e => {
//   if (toolMode !== "brush") return;

//   isBrushing = true;

//   const rect = canvas.getBoundingClientRect();
//   pendingBrushPoints.push({
//     x: e.clientX - rect.left,
//     y: e.clientY - rect.top
//   });

//   if (!isBrushRendering) requestAnimationFrame(processBrushQueue);
// });

// // mouseup
// canvas.addEventListener("mouseup", () => {
//   isBrushing = false;
// });

// // batch processing
// function processBrushQueue() {
//   isBrushRendering = true;

//   if (pendingBrushPoints.length === 0) {
//     isBrushRendering = false;
//     return;
//   }

//   const image = images[currentImageIndex];
//   const layer = image.layers[image.activeLayer];

//   // init layer canvas
//   if (!layer.canvas) {
//     const c = document.createElement("canvas");
//     c.width = image.bmp.width;
//     c.height = image.bmp.height;
//     const ctx = c.getContext("2d");
//     ctx.drawImage(image.bmp, 0, 0);
//     layer.canvas = c;

//     layer.tex = gl.createTexture();
//     gl.bindTexture(gl.TEXTURE_2D, layer.tex);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//   }

//   const rect = canvas.getBoundingClientRect();
//   const scaleX = layer.canvas.width / rect.width;
//   const scaleY = layer.canvas.height / rect.height;

//   const ctx = layer.canvas.getContext("2d");
//   ctx.globalCompositeOperation = "source-over";
//   ctx.fillStyle = brushColor;

//   for (const p of pendingBrushPoints) {
//     const x = p.x * scaleX;
//     const y = p.y * scaleY;

//     if (brushShape === "circle") {
//       ctx.beginPath();
//       ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
//       ctx.fill();
//     }

//     if (brushShape === "square") {
//       ctx.fillRect(x - brushRadius, y - brushRadius, brushRadius * 2, brushRadius * 2);
//     }

//     if (brushShape === "custom" && customBrushImage) {
//       ctx.drawImage(
//         customBrushImage,
//         x - brushRadius,
//         y - brushRadius,
//         brushRadius * 2,
//         brushRadius * 2
//       );
//     }
//   }

//   pendingBrushPoints = [];

//   // update GPU texture
//   gl.bindTexture(gl.TEXTURE_2D, layer.tex);
//   gl.texImage2D(
//     gl.TEXTURE_2D,
//     0,
//     gl.RGBA,
//     gl.RGBA,
//     gl.UNSIGNED_BYTE,
//     layer.canvas
//   );

//   draw();

//   requestAnimationFrame(processBrushQueue);
// }
