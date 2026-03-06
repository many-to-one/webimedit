// ################################################# LAYERS LOGIC ################################################# //

// const layerSelect = document.getElementById('layerSelect');
const addLayerBtn = document.getElementById('addLayerBtn');
const layerStatus = document.getElementById('layerStatus');
const layerPanel = document.getElementById('layerPanel');


function addLayer(name = `Layer ${images[currentImageIndex].layers.length + 1}`) {
  const image = images[currentImageIndex];

  image.layers.unshift({
    name,
    visible: true,
    settings: {
      basic: { ...defaultBasicValues },
      calibration: { ...defaultCalibrationValues },
      hsl: Array(8).fill().map(() => ({ hue: 0, sat: 1, lig: 1 }))
    },
    mask: null,
  });

  image.activeLayer = 0; // newest layer becomes active
  updateLayerUI();       // re-render layer stack
  restoreSliders(image.layers[0].settings); // update sliders
  draw();                // re-render canvas
}



function switchLayer(index) {
  const image = images[currentImageIndex];
  image.activeLayer = index;
  updateLayerUI();
  restoreSliders(image.layers[index].settings);
  draw();
}

function updateLayerUI() {
  const image = images[currentImageIndex];
  layerPanel.innerHTML = '';

  image.layers.forEach((layer, i) => {
    const div = document.createElement('div');
    div.className = 'layer-item' + (i === image.activeLayer ? ' active' : '');
    div.onclick = () => switchLayer(i);

    // Thumbnail
    const thumb = document.createElement('img');
    thumb.className = 'layer-thumb';
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image.bmp, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      thumb.src = URL.createObjectURL(blob);
    }, 'image/png');

    // Editable name
    const nameInput = document.createElement('input');
    nameInput.className = 'layer-name';
    nameInput.value = layer.name;
    nameInput.oninput = (e) => {
      layer.name = e.target.value;
    };
    nameInput.onclick = nameInput.onmousedown = nameInput.onkeydown = (e) => {
      e.stopPropagation();
    };

    // Controls container
    const controls = document.createElement('div');
    controls.className = 'layer-controls';

    const eye = document.createElement('button');
    eye.textContent = layer.visible === false ? '🙈' : '👁️';
    eye.onclick = (e) => {
      e.stopPropagation();
      layer.visible = !layer.visible;
      updateLayerUI();
      draw();
    };

    const del = document.createElement('button');
    del.textContent = '🗑️';

    // del.onclick = (e) => {
    //   e.stopPropagation();
    //   image.layers.splice(i, 1);

    //   // Jeśli nie ma już żadnych warstw → usuń też główny obraz
    //   if (image.layers.length === 0) {
    //     image.bmp = null; // usuwamy bitmapę

    //     gl.viewport(0, 0, canvas.width, canvas.height);
    //     gl.clearColor(0, 0, 0, 0);
    //     gl.clear(gl.COLOR_BUFFER_BIT);
    //   }

    //   if (image.activeLayer >= image.layers.length) {
    //     image.activeLayer = image.layers.length - 1;
    //   }

    //   updateLayerUI();
    //   if (image.layers[image.activeLayer]) {
    //     restoreSliders(image.layers[image.activeLayer].settings);
    //   }
    //   draw();
    // };

    del.onclick = (e) => {
  e.stopPropagation();
  image.layers.splice(i, 1);

  // Jeśli nie ma już żadnych warstw → usuń cały obraz z galerii i z tablicy
  if (image.layers.length === 0) {
    const imgIndex = images.indexOf(image);
    if (imgIndex !== -1) {
      removeFromGallery(imgIndex);
      images.splice(imgIndex, 1); // usuń z tablicy images
    }

    // wyczyść canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    currentImageIndex = null;
    updateLayerUI();
    statusEl.textContent = "No image selected";
    return; // zakończ, bo obraz został usunięty
  }

  if (image.activeLayer >= image.layers.length) {
    image.activeLayer = image.layers.length - 1;
  }

  updateLayerUI();
  if (image.layers[image.activeLayer]) {
    restoreSliders(image.layers[image.activeLayer].settings);
  }
  draw();
};



    // Menu (⋮)
    const menuBtn = document.createElement('button');
    menuBtn.textContent = '⋮';
    menuBtn.className = 'layer-menu-btn';

    const menu = document.createElement('div');
    menu.className = 'layer-menu';
    menu.style.display = 'none';

    const addMaskOption = document.createElement('div');
      addMaskOption.textContent = 'Add Mask';
      addMaskOption.onclick = ((layerRef, bmpRef) => (e) => {
        e.stopPropagation();
        if (!layerRef.mask) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = bmpRef.width;
          maskCanvas.height = bmpRef.height;

          const maskCtx = maskCanvas.getContext('2d');
          maskCtx.fillStyle = 'rgba(255,255,255,1)';
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

          layerRef.mask = maskCanvas;

          // ✅ Create corresponding WebGL texture
          layerRef.maskTex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, layerRef.maskTex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);

          updateLayerUI();
          restoreSliders(image.layers[image.activeLayer]?.settings);
          draw();
        }

        menu.style.display = 'none';
      })(layer, image.bmp); // ← capture bmp directly


    menu.appendChild(addMaskOption);
    menuBtn.onclick = (e) => {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    };

    const menuWrapper = document.createElement('div');
    menuWrapper.style.position = 'relative';
    menuWrapper.appendChild(menuBtn);
    menuWrapper.appendChild(menu);

    controls.appendChild(eye);
    controls.appendChild(del);
    controls.appendChild(menuWrapper);

    div.appendChild(thumb);
    div.appendChild(nameInput);
    div.appendChild(controls);
    layerPanel.appendChild(div);
  });
}






addLayerBtn.addEventListener('click', () => {
  if (currentImageIndex !== null) addLayer();
});


function selectImage(index) {
  currentImageIndex = index;
  const image = images[index];
  setTextureFromImageBitmap(image.bmp);
  updateLayerUI();
  restoreSliders(image.layers[image.activeLayer].settings);
  draw();
  highlightGallery(index);
  statusEl.textContent = `Selected: ${image.name}`;
}


// ################################################# END LAYERS LOGIC ################################################# //