/* ---------- uniform locations ---------- */
/* basic */
const basicUniforms = {
  temp: gl.getUniformLocation(prog, "u_temp"),
  tint: gl.getUniformLocation(prog, "u_tint"),
  exposure: gl.getUniformLocation(prog, "u_exposure"),
  contrast: gl.getUniformLocation(prog, "u_contrast"),
  highlights: gl.getUniformLocation(prog, "u_highlights"),
  shadows: gl.getUniformLocation(prog, "u_shadows"),
  whites: gl.getUniformLocation(prog, "u_whites"),
  blacks: gl.getUniformLocation(prog, "u_blacks"),
  curveShadow: gl.getUniformLocation(prog, "u_curveShadow"),
  curveMid: gl.getUniformLocation(prog, "u_curveMid"),
  curveHighlight: gl.getUniformLocation(prog, "u_curveHighlight")
};

/* HSL */
const uniforms = {};
for(let i=0;i<8;i++){
  uniforms[`hue${i}`] = gl.getUniformLocation(prog, `u_hue${i}`);
  uniforms[`sat${i}`] = gl.getUniformLocation(prog, `u_sat${i}`);
  uniforms[`lig${i}`] = gl.getUniformLocation(prog, `u_lig${i}`);
}

/* calibration */
const calUniforms = {
  shadowHue: gl.getUniformLocation(prog, "u_shadowHue"),
  shadowTint: gl.getUniformLocation(prog, "u_shadowTint"),
  redHue: gl.getUniformLocation(prog, "u_redHue"),
  redSat: gl.getUniformLocation(prog, "u_redSat"),
  greenHue: gl.getUniformLocation(prog, "u_greenHue"),
  greenSat: gl.getUniformLocation(prog, "u_greenSat"),
  blueHue: gl.getUniformLocation(prog, "u_blueHue"),
  blueSat: gl.getUniformLocation(prog, "u_blueSat")
};