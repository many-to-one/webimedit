// Save logic
// const saveStatus = document.getElementById('saveStatus');
// const fileTypeSelect = document.getElementById('fileTypeSelect');

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
  // const baseName = filenameInput.value.trim() || 'canvas-image';
  const baseName = filenameInput?.value?.trim() || 'canvas-image';
  saveWebGLCanvas(baseName);
});





// ---------------------------------------

// "GET /ai/image?url=https%3A%2F%2Fbfldeliveryscus.blob.core.windows.net%2Fresults%2F2026%2F04%2F24%2Fa3b50756f0db4bdab5d9284b54cedf69_sample.jpeg%3Fse%3D2026-04-24T17%253A35%253A04Z%26sp%3Dr%26sv%3D2026-02-06%26sr%3Db%26rsct%3Dimage%2Fjpeg%26sig%3Dsbq4wZDiy8e5x0%2FztiN0eNA31%2F9pDJ%252BHTzUHHeoOtTg%253D HTTP/1.1" 200 OK
// "GET /ai/image?url=https%3A%2F%2Fbfldeliveryprodeu4.blob.core.windows.net%2Fresults%2F2026%2F04%2F24%2F67b3bd064a3a426da2ff097e2785b956_sample.jpeg%3Fse%3D2026-04-24T17%253A26%253A13Z%26sp%3Dr%26sv%3D2026-02-06%26sr%3Db%26rsct%3Dimage%2Fjpeg%26sig%3DvtRpR4QOMTrBl3%2F%2FNyanWgSzUIOh5gY4PzrfJkyBdmw%253D HTTP/1.1" 200 OK
// "GET /ai/image?url=https%3A%2F%2Fbfldeliveryscus.blob.core.windows.net%2Fresults%2F2026%2F04%2F24%2F3cba618134ad4e23aa5f344fe8e76b19_sample.jpeg%3Fse%3D2026-04-24T18%253A50%253A05Z%26sp%3Dr%26sv%3D2026-02-06%26sr%3Db%26rsct%3Dimage%2Fjpeg%26sig%3D9J1%2FgMhJnqWQGZPZIoWmLV%2Fe10cTZy%252B4GAJdb8L82Kw%253D HTTP/1.1" 200 OK