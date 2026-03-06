// Save logic
const saveStatus = document.getElementById('saveStatus');
const fileTypeSelect = document.getElementById('fileTypeSelect');

async function saveWebGLCanvas(filenameBase = 'canvas-image') {
  const width = canvas.width;
  const height = canvas.height;
  // const gl = canvas.getContext('webgl');
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: true });

  saveStatus.textContent = 'Preparing download…';

  // Read pixels
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);


  // Offscreen canvas
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const ctx = off.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(pixels);

  // Flip vertically
  ctx.save();
  ctx.translate(0, height);
  ctx.scale(1, -1);
  ctx.putImageData(imageData, 0, 0);
  ctx.restore();

  // Determine type and extension
  const ext = fileTypeSelect.value; // "png", "jpeg", "webp"
  const mime = `image/${ext}`;
  const filename = `${filenameBase}.${ext}`;

  try {
    const blob = await new Promise(res => off.toBlob(res, mime, 0.92));

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: `${ext.toUpperCase()} Image`, accept: { [mime]: [`.${ext}`] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        saveStatus.textContent = 'File saved successfully ✔';
        return;
      } catch (err) {
        console.warn('Picker failed, falling back:', err);
      }
    }

    // Fallback: auto-download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    saveStatus.textContent = 'Download started ⬇';
  } catch (err) {
    console.error('Save failed:', err);
    saveStatus.textContent = 'Save failed ✖';
  }
}

saveBtn.addEventListener('click', () => {
  draw(); // ensure GPU buffer is up to date
  const baseName = filenameInput.value.trim() || 'canvas-image';
  saveWebGLCanvas(baseName);
});
