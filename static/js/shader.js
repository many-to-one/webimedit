/* ---------- WebGL setup and shader (complete) ---------- */
const gl = canvas.getContext('webgl');
if(!gl){ alert('WebGL not supported'); throw new Error('WebGL not supported'); }



/* Vertex shader */
const vsSrc = `
attribute vec2 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/* Fragment shader: Basic + Curve + HSL + Calibration + Mask */
const fsSrc = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;

uniform sampler2D u_mask;

/* Basic adjustments */
uniform float u_temp;   // -1..1
uniform float u_tint;   // -1..1
uniform float u_exposure;   // stops (-2..2)
uniform float u_contrast;   // -1..1
uniform float u_highlights; // -1..1
uniform float u_shadows;    // -1..1
uniform float u_whites;     // -1..1
uniform float u_blacks;     // -1..1

/* Curve (3-pt) */
uniform float u_curveShadow;
uniform float u_curveMid;
uniform float u_curveHighlight;

/* HSL bands (8*3) */
uniform float u_hue0; uniform float u_sat0; uniform float u_lig0;
uniform float u_hue1; uniform float u_sat1; uniform float u_lig1;
uniform float u_hue2; uniform float u_sat2; uniform float u_lig2;
uniform float u_hue3; uniform float u_sat3; uniform float u_lig3;
uniform float u_hue4; uniform float u_sat4; uniform float u_lig4;
uniform float u_hue5; uniform float u_sat5; uniform float u_lig5;
uniform float u_hue6; uniform float u_sat6; uniform float u_lig6;
uniform float u_hue7; uniform float u_sat7; uniform float u_lig7;

/* Calibration */
uniform float u_shadowHue;
uniform float u_shadowTint;
uniform float u_redHue; uniform float u_redSat;
uniform float u_greenHue; uniform float u_greenSat;
uniform float u_blueHue; uniform float u_blueSat;

/* Helpers: RGB <-> HSL */
vec3 rgb2hsl(vec3 c){
  float maxc = max(max(c.r,c.g),c.b);
  float minc = min(min(c.r,c.g),c.b);
  float h = 0.0; float s = 0.0; float l = (maxc + minc) * 0.5;
  if(maxc != minc){
    float d = maxc - minc;
    s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
    if(maxc == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    else if(maxc == c.g) h = (c.b - c.r) / d + 2.0;
    else h = (c.r - c.g) / d + 4.0;
    h /= 6.0;
  }
  return vec3(h,s,l);
}
float hue2rgb(float p, float q, float t){
  if(t < 0.0) t += 1.0;
  if(t > 1.0) t -= 1.0;
  if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if(t < 1.0/2.0) return q;
  if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}
vec3 hsl2rgb(vec3 hsl){
  float h=hsl.x, s=hsl.y, l=hsl.z;
  if(s==0.0) return vec3(l);
  float q = l < 0.5 ? l*(1.0+s) : l + s - l*s;
  float p = 2.0*l - q;
  return vec3( hue2rgb(p,q,h+1.0/3.0), hue2rgb(p,q,h), hue2rgb(p,q,h-1.0/3.0) );
}

/* HSL band selector (8 bands) */
void getAdjustments(int band, out float hueShift, out float satScale, out float ligScale){
  if(band==0){hueShift=u_hue0; satScale=u_sat0; ligScale=u_lig0;}
  else if(band==1){hueShift=u_hue1; satScale=u_sat1; ligScale=u_lig1;}
  else if(band==2){hueShift=u_hue2; satScale=u_sat2; ligScale=u_lig2;}
  else if(band==3){hueShift=u_hue3; satScale=u_sat3; ligScale=u_lig3;}
  else if(band==4){hueShift=u_hue4; satScale=u_sat4; ligScale=u_lig4;}
  else if(band==5){hueShift=u_hue5; satScale=u_sat5; ligScale=u_lig5;}
  else if(band==6){hueShift=u_hue6; satScale=u_sat6; ligScale=u_lig6;}
  else {hueShift=u_hue7; satScale=u_sat7; ligScale=u_lig7;}
}

/* small helpers for calibration primaries */
float weightSmooth(float dist, float sigma){ return exp(-0.5*(dist/sigma)*(dist/sigma)); }
const float RED_HUE = 0.0;
const float GREEN_HUE = 120.0/360.0;
const float BLUE_HUE = 240.0/360.0;
float hueDist(float a, float b){
  float d = abs(a - b);
  return min(d, 1.0 - d);
}

/* simple 3-pt curve */
float applyCurve(float lum) {
  if(lum < 0.5) {
    float t = lum / 0.5;
    return mix(u_curveShadow, u_curveMid, t);
  } else {
    float t = (lum - 0.5) / 0.5;
    return mix(u_curveMid, u_curveHighlight, t);
  }
}

void main(){
  vec4 tex = texture2D(u_tex, v_uv);
  vec3 rgb = tex.rgb;

  // ---------- White balance (approx) ----------
  rgb.r *= (1.0 + u_temp * 0.15);
  rgb.b *= (1.0 - u_temp * 0.15);
  rgb.g *= (1.0 + u_tint * 0.06);
  rgb = clamp(rgb, 0.0, 1.0);

  // ---------- Exposure ----------
  rgb *= pow(2.0, u_exposure);

  // ---------- Contrast around 0.5 ----------
  rgb = (rgb - 0.5) * (1.0 + u_contrast) + 0.5;

  // ---------- Local tonal adjustments ----------
  float lum = dot(rgb, vec3(0.2126,0.7152,0.0722));
  float hFactor = smoothstep(0.5, 1.0, lum);       // highlights weight
  float sFactor = 1.0 - smoothstep(0.0, 0.5, lum); // shadows weight

  // Apply highlights/shadows/whites/blacks with scaled influence
  rgb += u_highlights * 0.25 * hFactor;
  rgb += u_shadows   * 0.25 * sFactor;
  rgb += u_whites    * 0.15 * smoothstep(0.8,1.0,lum);
  rgb += u_blacks    * 0.15 * (1.0 - smoothstep(0.0,0.2,lum));

  rgb = clamp(rgb, 0.0, 1.0);

  // ---------- Tone curve (soft blend) ----------
  float curveY = applyCurve(lum);
  rgb = mix(rgb, vec3(curveY), 0.25);

  // ---------- HSL per-band ----------
  vec3 hsl = rgb2hsl(rgb);
  int band = int(floor(hsl.x * 8.0)); // 0..7
  float hueShift, satScale, ligScale;
  getAdjustments(band, hueShift, satScale, ligScale);
  hsl.x = fract(hsl.x + hueShift / 360.0);
  hsl.y = clamp(hsl.y * satScale, 0.0, 1.0);
  hsl.z = clamp(hsl.z * ligScale, 0.0, 1.0);
  rgb = hsl2rgb(hsl);

  // ---------- Shadows calibration ----------
  float lum2 = dot(rgb, vec3(0.2126,0.7152,0.0722));
  float shadowFactor = smoothstep(0.0, 0.5, 1.0 - lum2);
  if(shadowFactor > 0.0001) {
    vec3 sh = rgb2hsl(rgb);
    sh.x = fract(sh.x + (u_shadowHue / 360.0) * shadowFactor);
    sh.y = clamp(sh.y * mix(1.0, u_shadowTint, shadowFactor), 0.0, 1.0);
    rgb = hsl2rgb(sh);
  }

  // ---------- RGB primaries calibration ----------
  vec3 p = rgb2hsl(rgb);
  float dR = hueDist(p.x, RED_HUE); float wR = weightSmooth(dR, 0.08);
  p.x = fract(p.x + (u_redHue / 360.0) * wR);
  p.y = clamp(p.y * mix(1.0, u_redSat, wR), 0.0, 1.0);

  float dG = hueDist(p.x, GREEN_HUE); float wG = weightSmooth(dG, 0.08);
  p.x = fract(p.x + (u_greenHue / 360.0) * wG);
  p.y = clamp(p.y * mix(1.0, u_greenSat, wG), 0.0, 1.0);

  float dB = hueDist(p.x, BLUE_HUE); float wB = weightSmooth(dB, 0.08);
  p.x = fract(p.x + (u_blueHue / 360.0) * wB);
  p.y = clamp(p.y * mix(1.0, u_blueSat, wB), 0.0, 1.0);

  rgb = hsl2rgb(p);

  // 🧠 Apply mask alpha
  float maskAlpha = texture2D(u_mask, v_uv).a;
  gl_FragColor = vec4(rgb, tex.a * maskAlpha);
  // vec4 color = texture2D(u_tex, v_texCoord);
  // float mask = texture2D(u_mask, v_texCoord).r;  // assuming mask is grayscale
  // gl_FragColor = vec4(color.rgb, color.a * mask);

}
`;

// gl_FragColor = vec4(rgb, tex.a);

/* ---------- compile + link helpers ---------- */
function compileShader(type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if(!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    const msg = gl.getShaderInfoLog(sh);
    console.error("Shader compile error:", msg);
    throw new Error(msg);
  }
  return sh;
}
function linkProgram(vs, fs){
  const p = gl.createProgram();
  gl.attachShader(p, vs); gl.attachShader(p, fs);
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)){
    const msg = gl.getProgramInfoLog(p);
    console.error("Program link error:", msg);
    throw new Error(msg);
  }
  return p;
}

const prog = linkProgram(compileShader(gl.VERTEX_SHADER, vsSrc), compileShader(gl.FRAGMENT_SHADER, fsSrc));
gl.useProgram(prog);

/* ---------- quad attributes ---------- */
const quad = new Float32Array([
  -1, -1,  0, 0,
   1, -1,  1, 0,
  -1,  1,  0, 1,
   1,  1,  1, 1,
]);
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

const a_pos = gl.getAttribLocation(prog, "a_pos");
const a_uv  = gl.getAttribLocation(prog, "a_uv");
gl.enableVertexAttribArray(a_pos);
gl.enableVertexAttribArray(a_uv);
gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 16, 0);
gl.vertexAttribPointer(a_uv,  2, gl.FLOAT, false, 16, 8);