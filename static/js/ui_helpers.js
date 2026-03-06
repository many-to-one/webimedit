/* ---------- helpers to wire UI sliders to JS state ---------- */
function wireBasic(id, field, fmt = v => v.toFixed(2), transform = v => v){
  const el = document.getElementById(id);
  const valEl = document.getElementById(id + 'Val');
  if(!el) { console.warn('Missing slider', id); return; }
  if(valEl) valEl.textContent = fmt(basicValues[field]);
  el.addEventListener('input', ()=>{
    const raw = Number(el.value);
    basicValues[field] = transform(raw);
    if(valEl) valEl.textContent = fmt(raw);
    draw();
  });
}

/* map slider ranges => shader domain */
wireBasic('temp', 'temp', v => `${v}`, v => v/100.0);
wireBasic('tint', 'tint', v => `${v}`, v => v/100.0);
wireBasic('exposure', 'exposure', v => Number(v).toFixed(2), v => v);
wireBasic('contrast', 'contrast', v => Number(v).toFixed(2), v => v);
wireBasic('highlights', 'highlights', v => Number(v).toFixed(2), v => v);
wireBasic('shadows', 'shadows', v => Number(v).toFixed(2), v => v);
wireBasic('whites', 'whites', v => Number(v).toFixed(2), v => v);
wireBasic('blacks', 'blacks', v => Number(v).toFixed(2), v => v);

wireBasic('curveShadow', 'curveShadow', v => Number(v).toFixed(2), v => v);
wireBasic('curveMid', 'curveMid', v => Number(v).toFixed(2), v => v);
wireBasic('curveHighlight', 'curveHighlight', v => Number(v).toFixed(2), v => v);

/* ---------- calibration wiring ---------- */
function wireCal(id, field, fmt = v => v.toFixed(2), transform = v => v){
  const el = document.getElementById(id);
  const valEl = document.getElementById(id + 'Val');
  if(!el) { console.warn('Missing calib slider', id); return; }
  if(valEl) valEl.textContent = fmt(calibrationValues[field]);
  el.addEventListener('input', ()=>{
    const raw = Number(el.value);
    calibrationValues[field] = transform(raw);
    if(valEl) valEl.textContent = fmt(raw);
    draw();
  });
}

wireCal('shadowHue','shadowHue', v => `${v}`, v => v);
wireCal('shadowTint','shadowTint', v => Number(v).toFixed(2), v => v);

wireCal('redHue','redHue', v => `${v}`, v => v);
wireCal('redSat','redSat', v => Number(v).toFixed(2), v => v);
wireCal('greenHue','greenHue', v => `${v}`, v => v);
wireCal('greenSat','greenSat', v => Number(v).toFixed(2), v => v);
wireCal('blueHue','blueHue', v => `${v}`, v => v);
wireCal('blueSat','blueSat', v => Number(v).toFixed(2), v => v);

/* ---------- small sanity logs (helpful during dev) ---------- */
// console.log('Uniform locations basicUniforms:', basicUniforms);
// console.log('HSL uniform map sample:', uniforms.hue0, uniforms.sat0, uniforms.lig0);
// console.log('Calibration uniform map sample:', calUniforms.shadowHue, calUniforms.redHue);