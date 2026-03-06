const canvas = document.getElementById('glcanvas');

const galleryEl = document.getElementById('gallery');

// Store image metadata
const images = [];
let currentImageIndex = null;
let copiedSettings = null;


const defaultBasicValues = {
  temp: 0.0, tint: 0.0,
  exposure: 0.0, contrast: 0.0,
  highlights: 0.0, shadows: 0.0, whites: 0.0, blacks: 0.0,
  curveShadow: 0.0, curveMid: 0.5, curveHighlight: 1.0
};

const defaultCalibrationValues = {
  shadowHue: 0, shadowTint: 1,
  redHue: 0, redSat: 1,
  greenHue: 0, greenSat: 1,
  blueHue: 0, blueSat: 1
};



const basicValues = {
  temp: 0.0, tint: 0.0,
  exposure: 0.0, contrast: 0.0,
  highlights: 0.0, shadows: 0.0, whites: 0.0, blacks: 0.0,
  curveShadow: 0.0, curveMid: 0.5, curveHighlight: 1.0
};

const calibrationValues = {
  shadowHue:0, shadowTint:1,
  redHue:0, redSat:1,
  greenHue:0, greenSat:1,
  blueHue:0, blueSat:1
};


const fileInput = document.getElementById('fileInput');
const statusEl = document.getElementById('status');

fileInput.addEventListener('change', async () => {
  const files = Array.from(fileInput.files);
  if (!files.length) return;

  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase();
    statusEl.textContent = `Loading ${f.name}...`;

    try {
      let bmp;

      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        bmp = await createImageBitmap(f, { premultiplyAlpha: 'default' });
      } else if (['cr2', 'nef', 'arw', 'dng', 'raf', 'rw2'].includes(ext)) {
        const formData = new FormData();
        formData.append('file', f);

        const res = await fetch('/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) throw new Error('Backend upload failed');

        const data = await res.json();
        const base64Url = data.converted;
        const blob = await fetch(base64Url).then(r => r.blob());
        bmp = await createImageBitmap(blob, { premultiplyAlpha: 'default' });
      } else {
        statusEl.textContent = `Unsupported format: ${f.name}`;
        continue;
      }

      // const image = {
      //   name: f.name,
      //   bmp,
      //   settings: {
      //     basic: { ...defaultBasicValues },
      //     calibration: { ...defaultCalibrationValues },
      //     hsl: Array(8).fill().map(() => ({ hue: 0, sat: 1, lig: 1 }))
      //   }
      // };
      const image = {
        name: f.name,
        bmp,
        layers: [
          {
            name: 'Base',
            visible: true, 
            settings: {
              basic: { ...defaultBasicValues },
              calibration: { ...defaultCalibrationValues },
              hsl: Array(8).fill().map(() => ({ hue: 0, sat: 1, lig: 1 }))
            }
          }
        ],
        activeLayer: 0
      };
      images.push(image);

      addToGallery(images.length - 1);
      statusEl.textContent = `Loaded: ${f.name}`;

      // Auto-select first image if none selected yet
      if (currentImageIndex === null) {
        selectImage(images.length - 1);
      }
    } catch (err) {
      console.error('Upload error:', err);
      statusEl.textContent = `Failed to load ${f.name}`;
    }
  }
});



/* HSL groups (dynamic) */
const colorNames = ["red","orange","yellow","green","aqua","blue","purple","magenta"];
const bandNames = ["Red","Orange","Yellow","Green","Aqua","Blue","Purple","Magenta"];
const sliders = [];
(function createHSLGroups(){
  const container = document.getElementById('hslContainer');
  for(let i=0;i<8;i++){
    const g = document.createElement('div');
    g.className = 'group';
    g.id = `hsl_${bandNames[i]}`;
    g.style.display = 'none';
    g.innerHTML = `<b>${bandNames[i]}</b>
      <div class="row"><label>Hue</label><input id="hue_${i}" type="range" min="-180" max="180" step="1" value="0"><div class="value" id="hueVal_${i}">0</div></div>
      <div class="row"><label>Sat</label><input id="sat_${i}" type="range" min="0" max="2" step="0.01" value="1"><div class="value" id="satVal_${i}">1.00</div></div>
      <div class="row"><label>Light</label><input id="lig_${i}" type="range" min="0" max="2" step="0.01" value="1"><div class="value" id="ligVal_${i}">1.00</div></div>`;
    container.appendChild(g);
    const hue = document.getElementById(`hue_${i}`);
    const sat = document.getElementById(`sat_${i}`);
    const lig = document.getElementById(`lig_${i}`);
    sliders.push({hue,sat,lig});
    hue.addEventListener('input', ()=>{ document.getElementById(`hueVal_${i}`).textContent = hue.value; draw();});
    sat.addEventListener('input', ()=>{ document.getElementById(`satVal_${i}`).textContent = Number(sat.value).toFixed(2); draw();});
    lig.addEventListener('input', ()=>{ document.getElementById(`ligVal_${i}`).textContent = Number(lig.value).toFixed(2); draw();});
  }
})();
showHSL('Red');

function showHSL(color){
  if(!color) return;
  for(let b of bandNames){
    const el = document.getElementById(`hsl_${b}`);
    if(el) el.style.display = (b===color) ? 'block' : 'none';
  }
}



// Add thumbnail to gallery
// function addToGallery(index) {
//   const bmp = images[index].bmp;
//   const thumbCanvas = document.createElement('canvas');
//   thumbCanvas.width = 80;
//   thumbCanvas.height = 60;
//   const ctx = thumbCanvas.getContext('2d');
//   ctx.drawImage(bmp, 0, 0, thumbCanvas.width, thumbCanvas.height);
//   thumbCanvas.toBlob(blob => {
//     const img = document.createElement('img');
//     img.width = 80;
//     img.height = 60;
//     img.style.cursor = 'pointer';
//     img.style.border = '2px solid transparent';
//     img.src = URL.createObjectURL(blob);
//     img.onclick = () => selectImage(index);
//     galleryEl.appendChild(img);
//   }, 'image/png');
// }

function addToGallery(index) {
  const bmp = images[index].bmp;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 80;
  thumbCanvas.height = 60;
  const ctx = thumbCanvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, thumbCanvas.width, thumbCanvas.height);
  thumbCanvas.toBlob(blob => {
    const img = document.createElement('img');
    img.width = 80;
    img.height = 60;
    img.style.cursor = 'pointer';
    img.style.border = '2px solid transparent';
    img.src = URL.createObjectURL(blob);
    img.dataset.index = index;   // ✅ zapisz indeks
    img.onclick = () => selectImage(index);
    galleryEl.appendChild(img);
  }, 'image/png');
}

function removeFromGallery(index) {
  const thumb = galleryEl.querySelector(`img[data-index="${index}"]`);
  if (thumb) {
    galleryEl.removeChild(thumb);
  }
}



function selectImage(index) {
  currentImageIndex = index;
  const image = images[index];
  const settings = image.settings || {};

  // Defensive layer selection
  let layer = null;
  if (Array.isArray(image.layers) && image.activeLayer != null) {
    layer = image.layers[image.activeLayer];
  }

  setTextureFromImageBitmap(image.bmp, layer);
  applySettings(settings);
  draw();
  highlightGallery(index);
  statusEl.textContent = `Selected: ${image.name}`;

    // Restore sliders
  for (const [sliderId, { key, label, format }] of Object.entries(sliderMap)) {
    const slider = document.getElementById(sliderId);
    const labelEl = document.getElementById(label);
    if (!slider || !labelEl) continue;

    const val = settings[key] ?? parseFloat(slider.defaultValue);
    slider.value = val;
    labelEl.textContent = format ? format(val) : val;
  }
}





function applySettings(settings) {

  console.log('applySettings -----', settings)

  const data = new Float32Array([
    settings.exposure ?? 0,
    settings.contrast ?? 0,
    settings.highlights ?? 0,
    settings.shadows ?? 0,
    settings.whites ?? 0,
    settings.blacks ?? 0,
    settings.temperature ?? 0,
    settings.tint ?? 0,
    settings.curveShadow ?? 0,
    settings.curveMid ?? 0.5,
    settings.curveHighlight ?? 1,
    settings.shadowHue ?? 0,
    settings.shadowTint ?? 1,
    settings.redHue ?? 0,
    settings.redSat ?? 1,
    settings.greenHue ?? 0,
    settings.greenSat ?? 1,
    settings.blueHue ?? 0,
    settings.blueSat ?? 1
  ]);

  // device.queue.writeBuffer(uniformBuffer, 0, data);
}


// Highlight selected thumbnail
function highlightGallery(index) {
  Array.from(galleryEl.children).forEach((el, i) => {
    el.style.border = i === index ? '2px solid #00f' : '2px solid transparent';
  });
}

// Copy/paste settings
function copySettings() {
  if (currentImageIndex !== null) {
    copiedSettings = getEditSettings(images[currentImageIndex]);
    statusEl.textContent = 'Settings copied';
  }
}
function pasteSettings() {
  if (copiedSettings && currentImageIndex !== null) {
    applySettings(images[currentImageIndex], copiedSettings);
    statusEl.textContent = 'Settings pasted';
  }
}

// Keyboard shortcuts (optional)
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'c') copySettings();
  if (e.ctrlKey && e.key === 'v') pasteSettings();
});


const defaultSettings = {
  zoom: 100,
  temperature: 0,
  tint: 0,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  curveShadow: 0,
  curveMid: 0.5,
  curveHighlight: 1,
  shadowHue: 0,
  shadowTint: 1,
  redHue: 0,
  redSat: 1,
  greenHue: 0,
  greenSat: 1,
  blueHue: 0,
  blueSat: 1
};


const sliderMap = {
  zoomSlider:       { panel: 'basic', key: 'zoom',        label: 'zoomVal',        format: v => `${v}%` },
  temp:             { panel: 'basic', key: 'temp',        label: 'tempVal' },
  tint:             { panel: 'basic', key: 'tint',        label: 'tintVal' },
  exposure:         { panel: 'basic', key: 'exposure',    label: 'exposureVal',    format: v => v.toFixed(2) },
  contrast:         { panel: 'basic', key: 'contrast',    label: 'contrastVal',    format: v => v.toFixed(2) },
  highlights:       { panel: 'basic', key: 'highlights',  label: 'highlightsVal',  format: v => v.toFixed(2) },
  shadows:          { panel: 'basic', key: 'shadows',     label: 'shadowsVal',     format: v => v.toFixed(2) },
  whites:           { panel: 'basic', key: 'whites',      label: 'whitesVal',      format: v => v.toFixed(2) },
  blacks:           { panel: 'basic', key: 'blacks',      label: 'blacksVal',      format: v => v.toFixed(2) },
  curveShadow:      { panel: 'basic', key: 'curveShadow', label: 'curveShadowVal', format: v => v.toFixed(2) },
  curveMid:         { panel: 'basic', key: 'curveMid',    label: 'curveMidVal',    format: v => v.toFixed(2) },
  curveHighlight:   { panel: 'basic', key: 'curveHighlight', label: 'curveHighlightVal', format: v => v.toFixed(2) },

  shadowHue:        { panel: 'calibration', key: 'shadowHue',   label: 'shadowHueVal' },
  shadowTint:       { panel: 'calibration', key: 'shadowTint',  label: 'shadowTintVal',  format: v => v.toFixed(2) },
  redHue:           { panel: 'calibration', key: 'redHue',      label: 'redHueVal' },
  redSat:           { panel: 'calibration', key: 'redSat',      label: 'redSatVal',      format: v => v.toFixed(2) },
  greenHue:         { panel: 'calibration', key: 'greenHue',    label: 'greenHueVal' },
  greenSat:         { panel: 'calibration', key: 'greenSat',    label: 'greenSatVal',    format: v => v.toFixed(2) },
  blueHue:          { panel: 'calibration', key: 'blueHue',     label: 'blueHueVal' },
  blueSat:          { panel: 'calibration', key: 'blueSat',     label: 'blueSatVal',     format: v => v.toFixed(2) },
};

// Dynamically add HSL sliders
for (let i = 0; i < 8; i++) {
  sliderMap[`hue_${i}`] = { panel: 'hsl', index: i, key: 'hue', label: `hueVal_${i}` };
  sliderMap[`sat_${i}`] = { panel: 'hsl', index: i, key: 'sat', label: `satVal_${i}`, format: v => v.toFixed(2) };
  sliderMap[`lig_${i}`] = { panel: 'hsl', index: i, key: 'lig', label: `ligVal_${i}`, format: v => v.toFixed(2) };
}

for (const [sliderId, config] of Object.entries(sliderMap)) {
  const slider = document.getElementById(sliderId);
  const labelEl = document.getElementById(config.label);
  if (!slider || !labelEl) continue;

  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    labelEl.textContent = config.format ? config.format(val) : val;

    const image = images[currentImageIndex];
    const layer = image.layers[image.activeLayer];

    if (config.panel === 'hsl') {
      layer.settings.hsl[config.index][config.key] = val;
    } else {
      layer.settings[config.panel][config.key] = val;
    }

    draw();
  });
}





function updateSetting(panel, key, value) {
  console.log('updateSetting panel ------', panel)
  console.log('updateSetting ------ k, v', key, value)
  if (currentImageIndex !== null) {
    const image = images[currentImageIndex];
    image.settings[panel][key] = value;
    draw();
  }
}



function restoreSliders(settings) {
  for (const [sliderId, config] of Object.entries(sliderMap)) {
    const slider = document.getElementById(sliderId);
    const labelEl = document.getElementById(config.label);
    if (!slider || !labelEl) continue;

    let val;
    if (config.panel === 'hsl') {
      val = settings.hsl[config.index][config.key];
    } else {
      val = settings[config.panel][config.key];
    }

    slider.value = val;
    labelEl.textContent = config.format ? config.format(val) : val;
  }
}