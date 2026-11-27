/* Inmex 360 · armar la panorámica 360 desde un video de una vuelta, en el teléfono (sin servidor).
   Mismo método que herramientas/cyl2.py + cylh.py + equi.py (probado el 26/11 con videos reales de Victor):
   1) se recorren cuadros del video y se mide cuánto se corre la imagen entre uno y otro (gradientes, robusto a la exposición);
   2) se busca el cuadro donde la vuelta se cierra (vuelve a verse lo del principio): eso da el largo de la vuelta y el lente;
   3) cada cuadro se pasa a cilindro y se pega su franja central con fundido;
   4) el cilindro se pasa a 2:1 (equirectangular); lo que no se filmó (arriba y abajo) se rellena con el color del borde
      y lo tapa el logo del visor. Devuelve {blob, info}. */
(function(){
const espera = (el, ev) => new Promise(r => el.addEventListener(ev, r, { once: true }));
async function irA(v, t){
  if (Math.abs(v.currentTime - t) < 1e-3 && v.readyState >= 2) return;
  const p = espera(v, 'seeked'); v.currentTime = t; await p;
  if (v.requestVideoFrameCallback) await new Promise(r => { let ok = false; v.requestVideoFrameCallback(() => { ok = true; r(); }); setTimeout(() => { if (!ok) r(); }, 120); });
}
// imagen de gradientes (|dx|+|dy|) en gris, chica, para medir corrimientos sin que moleste el cambio de luz
function gradientes(ctx, w, h){
  const d = ctx.getImageData(0, 0, w, h).data, g = new Float32Array(w*h), o = new Float32Array(w*h);
  for (let i = 0, k = 0; i < g.length; i++, k += 4) g[i] = d[k]*0.3 + d[k+1]*0.59 + d[k+2]*0.11;
  for (let y = 0; y < h-1; y++) for (let x = 0; x < w-1; x++){ const i = y*w+x; o[i] = Math.abs(g[i+1]-g[i]) + Math.abs(g[i+w]-g[i]); }
  let m = 0; for (let i = 0; i < o.length; i++) m += o[i]; m = m/o.length || 1; for (let i = 0; i < o.length; i++) o[i] /= m;
  return o;
}
function reducir(a, w, h){ const w2 = w>>1, h2 = h>>1, o = new Float32Array(w2*h2); for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++){ const i = 2*y*w+2*x; o[y*w2+x] = (a[i]+a[i+1]+a[i+w]+a[i+w+1])/4; } return o; }
// error medio entre a y b corrida (dx,dy): b(x,y) ≈ a(x-dx, y-dy)
function err(a, b, w, h, dx, dy, paso){
  let s = 0, n = 0; const m = 2;
  const x0 = Math.max(m, m+dx), x1 = Math.min(w-m, w-m+dx), y0 = Math.max(m, m+dy), y1 = Math.min(h-m, h-m+dy);
  if (x1-x0 < w*0.35 || y1-y0 < h*0.5) return 1e9;
  for (let y = y0; y < y1; y += paso) for (let x = x0; x < x1; x += paso){ s += Math.abs(b[y*w+x] - a[(y-dy)*w+(x-dx)]); n++; }
  return s/n;
}
// corrimiento de a hacia b: grueso a la mitad y fino a tamaño completo
function corrimiento(A, B, w, h, rx){
  const w2 = w>>1, h2 = h>>1, a2 = A.mitad, b2 = B.mitad, rx2 = Math.round(rx/2), ry2 = Math.round(h2*0.06);
  let best = 1e9, bx = 0, by = 0;
  for (let dy = -ry2; dy <= ry2; dy++) for (let dx = -rx2; dx <= rx2; dx++){ const e = err(a2, b2, w2, h2, dx, dy, 2); if (e < best){ best = e; bx = dx; by = dy; } }
  let fx = 2*bx, fy = 2*by; best = 1e9;
  for (let dy = 2*by-2; dy <= 2*by+2; dy++) for (let dx = 2*bx-2; dx <= 2*bx+2; dx++){ const e = err(A.g, B.g, w, h, dx, dy, 1); if (e < best){ best = e; fx = dx; fy = dy; } }
  return { dx: fx, dy: fy, e: best };
}

async function armar360(file, prog = () => {}, opc = {}){
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(file);
  await new Promise((ok, ko) => { v.onloadeddata = ok; v.onerror = () => ko(new Error('No pude leer el video. Probá con otro o grabalo de nuevo.')); });
  try { await v.play(); v.pause(); } catch (e) {}
  const dur = v.duration, VW = v.videoWidth, VH = v.videoHeight;
  if (!isFinite(dur) || dur < 3) throw new Error('El video es muy corto: tiene que tener la vuelta completa (al menos 8 segundos).');
  // tamaños: chico para medir, de trabajo para armar
  const sw = 128, sh = Math.round(VH*sw/VW) & ~1;
  const WH = Math.min(opc.alto || 720, VH), WW = Math.round(VW*WH/VH);
  const cs = document.createElement('canvas'); cs.width = sw; cs.height = sh; const xs = cs.getContext('2d', { willReadFrequently: true });
  // 1) medir corrimientos (unos 8 cuadros por segundo)
  const N = Math.max(60, Math.min(320, Math.round(dur*8))), T = [], F = [];
  for (let i = 0; i < N; i++){
    const t = Math.min(dur-0.05, i*dur/(N-1)); await irA(v, t);
    xs.drawImage(v, 0, 0, sw, sh); const g = gradientes(xs, sw, sh); F.push({ g, mitad: reducir(g, sw, sh) }); T.push(t);
    prog(0.45*i/N, 'Leyendo el video…');
  }
  const pos = [{ x: 0, y: 0 }], errs = [];
  for (let i = 1; i < N; i++){ const c = corrimiento(F[i-1], F[i], sw, sh, Math.round(sw*0.4)); errs.push(c.e); pos.push({ x: pos[i-1].x + c.dx, y: pos[i-1].y + c.dy }); if (i%10 === 0){ prog(0.45 + 0.15*i/N, 'Siguiendo el giro…'); await new Promise(r => setTimeout(r)); } }
  // 2) cierre de la vuelta: el cuadro que más se parece al primero después de haberse alejado
  let k = -1, kc = null, ek = [];
  for (let i = 1; i < N; i++){
    if (Math.abs(pos[i].x) < sw*2.5) continue;
    const c = corrimiento(F[0], F[i], sw, sh, Math.round(sw*0.45)); ek.push(c.e);
    if (!kc || c.e < kc.e){ kc = c; k = i; }
  }
  const medE = ek.length ? [...ek].sort((a, b) => a-b)[Math.floor(ek.length/2)] : 1e9;
  if (k < 0 || kc.e > medE*0.75) throw new Error('No se cerró la vuelta: girá completo sobre tus pies hasta volver a ver lo del principio, y un poco más.');
  const Cs = Math.abs(pos[k].x - kc.dx), sgn = Math.sign(pos[k].x - kc.dx) || 1;
  const fs = Cs/(2*Math.PI), hfov = 2*Math.atan(sw/2/fs)*180/Math.PI;
  if (hfov < 25 || hfov > 120) throw new Error('No pude medir bien la vuelta. Grabá de nuevo más despacio, sin caminar.');
  // corregir el desvío para que cierre justo
  const dxRes = (pos[k].x - kc.dx) - sgn*Cs, dyRes = pos[k].y - kc.dy;
  for (let i = 0; i <= k; i++){ pos[i].x -= dxRes*i/k; pos[i].y -= dyRes*i/k; }
  // 3) pegar franjas en el cilindro
  const esc = WW/sw, f = fs*esc, Cw = Math.round(Cs*esc);
  let ymin = 0, ymax = 0; for (let i = 0; i <= k; i++){ ymin = Math.min(ymin, pos[i].y*esc); ymax = Math.max(ymax, pos[i].y*esc); }
  const mg = Math.ceil(Math.max(-ymin, ymax)) + 4, Hc = WH + 2*mg;
  const acc = new Float32Array(Cw*Hc*3), wsum = new Float32Array(Cw*Hc);
  const cw = document.createElement('canvas'); cw.width = WW; cw.height = WH; const xw = cw.getContext('2d', { willReadFrequently: true });
  // elegir cuadros: uno cada ~1/6 del ancho de recorrido
  const paso = WW/6, sel = [0]; for (let i = 1; i <= k; i++) if (Math.abs(pos[i].x - pos[sel[sel.length-1]].x)*esc >= paso) sel.push(i);
  const S = Math.round(paso*1.6);
  for (let n = 0; n < sel.length; n++){
    const i = sel[n]; await irA(v, T[i]); xw.drawImage(v, 0, 0, WW, WH); const d = xw.getImageData(0, 0, WW, WH).data;
    const X0 = -pos[i].x*esc, Y0 = pos[i].y*esc + mg;
    for (let u = -S; u <= S; u++){
      const th = u/f, x = f*Math.tan(th) + WW/2; if (x < 1 || x > WW-2) continue;
      const wx = 1 - Math.abs(u)/(S+1), col = ((Math.round(X0 + u) % Cw) + Cw) % Cw, ic = 1/Math.cos(th), xi = x|0, fx = x - xi;
      for (let r = 0; r < WH; r++){
        const y = (r - WH/2)*ic + WH/2; if (y < 0 || y > WH-1.001) continue;
        const yi = y|0, fy = y - yi, p00 = (yi*WW + xi)*4, p01 = p00+4, p10 = p00+WW*4, p11 = p10+4;
        const row = Math.round(r - Y0 + 2*mg); if (row < 0 || row >= Hc) continue;
        const o = row*Cw + col, w0 = wx*wx;
        for (let c = 0; c < 3; c++){ const val = (d[p00+c]*(1-fx) + d[p01+c]*fx)*(1-fy) + (d[p10+c]*(1-fx) + d[p11+c]*fx)*fy; acc[o*3+c] += val*w0; }
        wsum[o] += w0;
      }
    }
    prog(0.6 + 0.3*n/sel.length, `Armando la vista 360 (${n+1} de ${sel.length})…`);
    await new Promise(r => setTimeout(r));
  }
  // filas con todo cubierto
  let top = -1, bot = -1;
  for (let r = 0; r < Hc; r++){ let c = 0; for (let x = 0; x < Cw; x++) if (wsum[r*Cw+x] > 1e-4) c++; if (c >= Cw*0.97){ if (top < 0) top = r; bot = r; } }
  if (top < 0 || bot - top < WH*0.5) throw new Error('La vuelta salió muy torcida. Grabá de nuevo con el celular derecho.');
  top += 3; bot -= 3;
  // 4) cilindro → 2:1
  const W = Math.min(opc.ancho || 4096, Cw - (Cw % 2)), H = W/2, out = new Uint8ClampedArray(W*H*4), yc = Hc/2 - mg + mg; // centro óptico
  const sx = Cw/W, colorFila = r => { const s = [0, 0, 0]; let n = 0; for (let x = 0; x < Cw; x += 4){ const o = r*Cw+x, w = wsum[o]; if (w > 0){ s[0] += acc[o*3]/w; s[1] += acc[o*3+1]/w; s[2] += acc[o*3+2]/w; n++; } } return s.map(z => z/(n||1)); };
  const cTop = colorFila(top + 6), cBot = colorFila(bot - 6);
  for (let j = 0; j < H; j++){
    const lat = (0.5 - (j+0.5)/H)*Math.PI, y = yc - f*Math.tan(Math.max(-1.45, Math.min(1.45, lat)));
    for (let i = 0; i < W; i++){
      const o = (j*W + i)*4; let rgb;
      if (y >= top && y <= bot){
        const x = Math.min(Cw-1, (i+0.5)*sx | 0), y0 = y|0, fy = y - y0, a = y0*Cw + x, b = Math.min(Hc-1, y0+1)*Cw + x, wa = wsum[a] || 1e-6, wb = wsum[b] || 1e-6;
        rgb = [0, 1, 2].map(c => (acc[a*3+c]/wa)*(1-fy) + (acc[b*3+c]/wb)*fy);
        const borde = Math.min(y - top, bot - y); if (borde < 24){ const t = borde/24, cc = y - top < bot - y ? cTop : cBot; rgb = rgb.map((z, c) => z*t + cc[c]*(1-t)); }
      } else rgb = y < top ? cTop : cBot;
      out[o] = rgb[0]; out[o+1] = rgb[1]; out[o+2] = rgb[2]; out[o+3] = 255;
    }
    if (j % 64 === 0){ prog(0.9 + 0.09*j/H, 'Terminando…'); await new Promise(r => setTimeout(r)); }
  }
  const co = document.createElement('canvas'); co.width = W; co.height = H; co.getContext('2d').putImageData(new ImageData(out, W, H), 0, 0);
  const blob = await new Promise(r => co.toBlob(r, 'image/jpeg', 0.88));
  URL.revokeObjectURL(v.src);
  const vert = Math.atan((bot - yc)/f)*180/Math.PI, vertA = Math.atan((yc - top)/f)*180/Math.PI;
  prog(1, 'Listo');
  return { blob, info: { cuadros: sel.length, vuelta: k, hfov: Math.round(hfov), arriba: Math.round(vertA), abajo: Math.round(vert), ancho: W, cierre: +(kc.e/medE).toFixed(2) } };
}
window.armar360 = armar360;
})();
