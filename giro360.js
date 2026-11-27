/* Inmex 360 · giro de una máquina desde un video caminando alrededor, en el teléfono (sin servidor).
   Lo mismo que hacen los visores profesionales (revisado en Spyne el 27/11: 36 fotos horizontales, el vehículo siempre
   del mismo tamaño y parado sobre el mismo disco, fondo de estudio):
   1) se leen cuadros de todo el video y se busca dónde se cierra la vuelta (vuelve a verse lo del principio);
   2) se eligen 36 cuadros parejos en la vuelta, el más nítido de cada tramo;
   3) se recorta la máquina del fondo (modelo u2netp con onnxruntime-web, en vendor/);
   4) cada cuadro se escala y se corre para que la máquina quede del mismo tamaño, con las ruedas sobre la misma línea
      y el centro sobre el centro del disco (alisado entre cuadros vecinos para que no tiemble);
   5) se dibuja sobre un estudio (pared, piso, disco), con sombra y reflejo suave.
   window.armarGiro(file, prog, opc) → { fotos:[Blob×36], info:{ n, cortadas, recorte, vuelta, segundos } } */
(function(){
const espera = (el, ev) => new Promise(r => el.addEventListener(ev, r, { once: true }));
const pausa = () => new Promise(r => setTimeout(r));
async function irA(v, t){
  if (Math.abs(v.currentTime - t) < 1e-3 && v.readyState >= 2) return;
  const p = espera(v, 'seeked'); v.currentTime = t; await p;
  if (v.requestVideoFrameCallback) await new Promise(r => { let ok = false; v.requestVideoFrameCallback(() => { ok = true; r(); }); setTimeout(() => { if (!ok) r(); }, 120); });
}
function gris(ctx, w, h){ const d = ctx.getImageData(0, 0, w, h).data, g = new Float32Array(w*h); for (let i = 0, k = 0; i < g.length; i++, k += 4) g[i] = d[k]*0.3 + d[k+1]*0.59 + d[k+2]*0.11; return g; }
function nitidez(g, w, h){ let s = 0, n = 0; for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++){ const i = y*w+x, l = 4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w]; s += l*l; n++; } return s/n; }
function difMedia(a, b){ let ma = 0, mb = 0; for (let i = 0; i < a.length; i++){ ma += a[i]; mb += b[i]; } ma /= a.length; mb /= b.length; let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs((a[i]-ma) - (b[i]-mb)); return s/a.length; }
function circ(v, k, f){ const n = v.length, o = []; for (let i = 0; i < n; i++){ const w = []; for (let j = -k; j <= k; j++) w.push(v[(i+j+n)%n]); o.push(f(w)); } return o; }
const mediana = w => { const s = [...w].sort((a, b) => a-b); return s[s.length>>1]; };
const media = w => w.reduce((a, b) => a+b, 0)/w.length;

/* ---------- recorte con u2netp ---------- */
let sesion = null;
function cargarScript(src){ return new Promise((ok, ko) => { if (window.ort) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => ko(new Error('script')); document.head.appendChild(s); }); }
async function abrirModelo(base){
  if (sesion) return sesion;
  await cargarScript(base + 'ort/ort.wasm.min.js');
  ort.env.wasm.wasmPaths = new URL(base + 'ort/', location.href).href; ort.env.wasm.numThreads = 1;
  sesion = await ort.InferenceSession.create(base + 'modelos/u2netp.onnx', { executionProviders: ['wasm'] });
  return sesion;
}
const S = 320, MEAN = [0.485, 0.456, 0.406], STD = [0.229, 0.224, 0.225];
// devuelve Float32Array S×S con 0..1 (1 = máquina)
let lienzoM = null;
async function mascara(ses, fuente){
  if (!lienzoM){ lienzoM = document.createElement('canvas'); lienzoM.width = S; lienzoM.height = S; }
  const c = lienzoM, x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(fuente, 0, 0, S, S); const d = x.getImageData(0, 0, S, S).data;
  let mx = 1; for (let i = 0; i < d.length; i += 4) mx = Math.max(mx, d[i], d[i+1], d[i+2]);
  const t = new Float32Array(3*S*S);
  for (let i = 0, k = 0; i < S*S; i++, k += 4) for (let ch = 0; ch < 3; ch++) t[ch*S*S+i] = (d[k+ch]/mx - MEAN[ch])/STD[ch];
  const out = await ses.run({ [ses.inputNames[0]]: new ort.Tensor('float32', t, [1, 3, S, S]) });
  const p = out[ses.outputNames[0]].data; let mi = 1e9, ma = -1e9; for (let i = 0; i < p.length; i++){ if (p[i] < mi) mi = p[i]; if (p[i] > ma) ma = p[i]; }
  const m = new Float32Array(S*S); for (let i = 0; i < m.length; i++) m[i] = (p[i]-mi)/((ma-mi) || 1);
  return m;
}
// se queda con la mancha más grande que toca el centro de la imagen (saca árboles, otros autos, etc.)
function erosion(b, r){ const o = new Uint8Array(S*S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++){ let k = 1; for (let dy = -r; dy <= r && k; dy++) for (let dx = -r; dx <= r && k; dx++){ const xx = x+dx, yy = y+dy; if (xx < 0 || yy < 0 || xx >= S || yy >= S || !b[yy*S+xx]) k = 0; } o[y*S+x] = k; } return o; }
function limpiar(m){
  // se achica la máscara antes de separar manchas: así lo que apenas toca a la máquina (otro auto, un árbol) queda aparte
  const n = S*S, base = new Uint8Array(n); for (let i = 0; i < n; i++) base[i] = m[i] > 0.45 ? 1 : 0;
  const ero = erosion(base, 4), lab = new Int32Array(n), on = i => ero[i] === 1; let id = 0; const tam = [0];
  for (let i = 0; i < n; i++){ if (!on(i) || lab[i]) continue; id++; let c = 0; const st = [i]; lab[i] = id;
    while (st.length){ const j = st.pop(); c++; const x = j%S, y = (j/S)|0;
      if (x > 0 && !lab[j-1] && on(j-1)){ lab[j-1] = id; st.push(j-1); } if (x < S-1 && !lab[j+1] && on(j+1)){ lab[j+1] = id; st.push(j+1); }
      if (y > 0 && !lab[j-S] && on(j-S)){ lab[j-S] = id; st.push(j-S); } if (y < S-1 && !lab[j+S] && on(j+S)){ lab[j+S] = id; st.push(j+S); } }
    tam.push(c); }
  if (!id) return null;
  // puntaje: tamaño, castigando lo que está lejos del centro
  const cx = new Float64Array(id+1), cy = new Float64Array(id+1);
  for (let i = 0; i < n; i++) if (lab[i]){ cx[lab[i]] += i%S; cy[lab[i]] += (i/S)|0; }
  let best = 0, bs = -1; for (let k = 1; k <= id; k++){ const dx = cx[k]/tam[k]/S - 0.5, dy = cy[k]/tam[k]/S - 0.55; const sc = tam[k]*(1 - Math.min(0.8, Math.hypot(dx, dy)*1.4)); if (sc > bs){ bs = sc; best = k; } }
  if (tam[best] < n*0.01) return null;
  // dilato un poco la mancha elegida y conservo el borde suave del modelo
  const keep = new Uint8Array(n); for (let i = 0; i < n; i++) if (lab[i] === best) keep[i] = 1;
  const o = new Float32Array(n), R = 7;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++){ const i = y*S+x; let k = keep[i];
    if (!k && m[i] > 0.05){ let mio = 0, otro = 0; // vuelve el borde de la máquina, pero no lo que está más cerca de otra mancha
      for (let dy = -R; dy <= R && !otro; dy++) for (let dx = -R; dx <= R && !otro; dx++){ const xx = x+dx, yy = y+dy; if (xx < 0 || yy < 0 || xx >= S || yy >= S) continue; const l = lab[yy*S+xx]; if (l === best) mio = 1; else if (l) otro = 1; }
      k = mio && !otro; }
    o[i] = k ? m[i] : 0; }
  return o;
}
// caja de la máquina en coordenadas 0..1 (percentiles, para que un pelito no la agrande)
function caja(m){
  const cols = new Float32Array(S), rows = new Float32Array(S); let tot = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++){ const v = m[y*S+x] > 0.5 ? 1 : 0; cols[x] += v; rows[y] += v; tot += v; }
  const pct = (a, p) => { let s = 0; for (let i = 0; i < S; i++){ s += a[i]; if (s >= tot*p) return i/S; } return 1; };
  const borde = (cols[0] + cols[1] > S*0.08) || (cols[S-1] + cols[S-2] > S*0.08) || (rows[0] + rows[1] > S*0.08);
  return { x0: pct(cols, 0.01), x1: pct(cols, 0.99), y0: pct(rows, 0.01), y1: pct(rows, 0.995), area: tot/(S*S), cortada: borde };
}

/* ---------- estudio ---------- */
function estudio(W, H, piso, sinDisco){
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const hz = H*0.56;
  // pared pareja arriba (así se puede estirar con el color del borde en pantallas altas) y una luz suave en el centro
  let g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#dfe1e4'); g.addColorStop(1, '#f3f4f5');
  x.fillStyle = g; x.fillRect(0, 0, W, hz);
  g = x.createRadialGradient(W/2, hz*0.85, 0, W/2, hz*0.85, W*0.34); g.addColorStop(0, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, hz);
  g = x.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#cdd0d4'); g.addColorStop(0.35, '#e8e9eb'); g.addColorStop(0.8, '#f4f4f5'); g.addColorStop(1, '#f4f4f5');
  x.fillStyle = g; x.fillRect(0, hz, W, H-hz);
  // curva suave entre pared y piso
  g = x.createLinearGradient(0, hz-H*0.05, 0, hz+H*0.05); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(160,164,170,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, hz-H*0.05, W, H*0.1);
  if (sinDisco) return c;
  // disco giratorio
  const rx = W*0.36, ry = H*0.085, cy = piso - ry*0.25;
  g = x.createRadialGradient(W/2, cy, 0, W/2, cy, rx); g.addColorStop(0, '#f7f7f8'); g.addColorStop(0.85, '#e9eaec'); g.addColorStop(1, '#d6d8db');
  x.save(); x.translate(W/2, cy); x.scale(1, ry/rx); x.beginPath(); x.arc(0, 0, rx, 0, Math.PI*2); x.restore(); x.fillStyle = g; x.fill();
  x.save(); x.translate(W/2, cy); x.scale(1, ry/rx); x.beginPath(); x.arc(0, 0, rx, 0, Math.PI*2); x.restore(); x.lineWidth = 2; x.strokeStyle = 'rgba(120,124,130,.45)'; x.stroke();
  x.save(); x.translate(W/2, cy+3); x.scale(1, ry/rx); x.beginPath(); x.arc(0, 0, rx, 0.05*Math.PI, 0.95*Math.PI); x.restore(); x.lineWidth = 3; x.strokeStyle = 'rgba(90,94,100,.25)'; x.stroke();
  return c;
}

async function armarGiro(file, prog = () => {}, opc = {}){
  const N = opc.n || 36, OW = opc.ancho || 1280, OH = Math.round(OW*9/16), base = opc.base || 'vendor/';
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; const vurl = URL.createObjectURL(file); v.src = vurl;
  await new Promise((ok, ko) => { v.onloadeddata = ok; v.onerror = () => ko(new Error('No pude leer el video. Probá con otro o grabalo de nuevo.')); });
  try { await v.play(); v.pause(); } catch (e) {}
  let dur = v.duration; const VW = v.videoWidth, VH = v.videoHeight;
  // los videos filmados en la app (MediaRecorder) no traen el largo: se lo averigua yendo al final
  if (!isFinite(dur)){
    await new Promise(r => { const ok = () => { if (isFinite(v.duration)){ v.removeEventListener('durationchange', ok); r(); } }; v.addEventListener('durationchange', ok); v.currentTime = 1e7; setTimeout(r, 5000); });
    dur = isFinite(v.duration) ? v.duration : (file.duracion || 0);
    if (v.currentTime > 0.01){ const p = espera(v, 'seeked'); v.currentTime = 0; await Promise.race([p, new Promise(r => setTimeout(r, 3000))]); }
  }
  if (!isFinite(dur) || dur < 4) throw new Error('El video es muy corto: tiene que tener la vuelta completa alrededor de la máquina (al menos 15 segundos).');
  const vertical = VH > VW;
  const modelo = abrirModelo(base).catch(e => { console.warn('modelo', e); return null; });

  // 1) se recorre el video de corrido (sin saltar: con videos largos de celular cada salto obliga a decodificar mucho)
  //    y de cada cuadro tomado se guarda: gris chiquito (cierre de la vuelta), nitidez y un JPEG de trabajo (no imágenes grandes en memoria)
  const WH = Math.min(720, vertical ? VW : VH), WW = Math.round(VW*WH/(vertical ? VW : VH)), WHh = Math.round(VH*WH/(vertical ? VW : VH));
  const sw = 96, sh = Math.max(2, Math.round(VH*sw/VW)), cs = document.createElement('canvas'); cs.width = sw; cs.height = sh; const xs = cs.getContext('2d');
  const cw = document.createElement('canvas'); cw.width = WW; cw.height = WHh; const cwx = cw.getContext('2d');
  const fps = Math.min(6, (N*8)/dur), C = [];
  const tomar = t => { xs.drawImage(v, 0, 0, sw, sh); const g = gris(xs, sw, sh); C.push({ t, g, ni: nitidez(g, sw, sh) }); };
  const reproducir = opc.saltando ? false : !!v.requestVideoFrameCallback;
  // pasa el video de corrido desde el principio hasta tHasta y llama f(t) en cada cuadro que muestra
  async function pasar(tHasta, f, p0, p1, msg){
    if (v.currentTime > 0.01){ const p = espera(v, 'seeked'); v.currentTime = 0; await p; }
    v.playbackRate = opc.velocidad || 2;
    await new Promise((ok, ko) => {
      let quieto = 0, ult = -1, fin = false; const terminar = () => { if (fin) return; fin = true; clearInterval(vig); v.pause(); ok(); };
      const cb = (now, meta) => { if (fin) return; const t = meta.mediaTime; f(t); prog(p0 + (p1-p0)*Math.min(1, t/tHasta), msg); if (t >= tHasta) return terminar(); if (!v.ended) v.requestVideoFrameCallback(cb); };
      v.requestVideoFrameCallback(cb); v.onended = terminar;
      // si el celular frena la reproducción, se la vuelve a arrancar; si no arranca más, se sigue con lo que hay
      const vig = setInterval(() => { if (v.ended) return terminar(); if (v.currentTime === ult){ if (++quieto > 8) terminar(); else v.play().catch(() => {}); } else { quieto = 0; ult = v.currentTime; } }, 500);
      v.play().catch(() => { clearInterval(vig); ko(new Error('No pude reproducir el video en el celular. Probá con otro.')); });
    });
  }
  if (reproducir){ let prox = 0; await pasar(dur, t => { if (t >= prox){ tomar(t); prox = t + 1/fps; } }, 0, 0.2, 'Leyendo el video…'); }
  if (C.length < N*2){ // sin reproducción (navegador viejo) o salió corto: a los saltos
    C.length = 0; const M = N*3;
    for (let i = 0; i < M; i++){ const t = Math.min(dur-0.05, i*dur/(M-1)); await irA(v, t); tomar(t); prog(0.2*i/M, 'Leyendo el video…'); }
  }
  const M = C.length, T = C.map(c => c.t), G = C.map(c => c.g), NI = C.map(c => c.ni);
  // cierre: después del 70 % del video, el cuadro más parecido al primero
  const e0 = G.map(g => difMedia(G[0], g)), desde = Math.floor(M*0.7);
  let fin = M-1, be = 1e9; for (let i = desde; i < M; i++) if (e0[i] < be){ be = e0[i]; fin = i; }
  const tipico = mediana(e0.slice(Math.floor(M*0.2), Math.floor(M*0.6)));
  const cerro = be < tipico*0.6;
  if (!cerro) fin = M-1;
  const tFin = T[fin];
  // 2) un cuadro por tramo: el más nítido (los demás JPEG se sueltan)
  const elegidos = [];
  for (let k = 0; k < N; k++){
    const a = tFin*k/N, b = tFin*(k+1)/N; let bi = -1, bn = -1;
    for (let i = 0; i < M; i++) if (T[i] >= a && T[i] < b && NI[i] > bn){ bn = NI[i]; bi = i; }
    if (bi < 0){ let bd = 1e9; for (let i = 0; i < M; i++){ const d = Math.abs(T[i] - a); if (d < bd){ bd = d; bi = i; } } }
    elegidos.push(T[bi]);
  }
  C.length = 0;
  // segunda pasada: se guardan como JPEG solo esos 36 cuadros (de a uno, sin juntar imágenes grandes)
  const jpgs = new Array(N).fill(null), pend = [];
  const guardar = k => { cwx.drawImage(v, 0, 0, WW, WHh); pend.push(new Promise(r => cw.toBlob(b => { jpgs[k] = b; r(); }, 'image/jpeg', 0.9))); };
  if (reproducir){ let k = 0; await pasar(elegidos[N-1] + 0.05, t => { while (k < N && t >= elegidos[k] - 0.02){ guardar(k); k++; } }, 0.2, 0.3, 'Eligiendo las 36 fotos…'); }
  await Promise.all(pend);
  for (let k = 0; k < N; k++) if (!jpgs[k]){ await irA(v, elegidos[k]); cwx.drawImage(v, 0, 0, WW, WHh); jpgs[k] = await new Promise(r => cw.toBlob(r, 'image/jpeg', 0.9)); prog(0.2 + 0.1*k/N, 'Eligiendo las 36 fotos…'); }
  // 3) recortar la máquina en cada cuadro elegido
  const ses = await modelo;
  if (!ses && !opc.sinRecorte) prog(0.3, 'No pude cargar el recorte: va con el fondo original.');
  const cuadros = [];
  for (let k = 0; k < N; k++){
    const jpg = jpgs[k];
    let m = null, bx = null;
    if (ses){ try { const bm = await createImageBitmap(jpg); const mf = limpiar(await mascara(ses, bm)); bm.close && bm.close();
      if (mf){ bx = caja(mf); m = new Uint8Array(S*S); for (let i = 0; i < m.length; i++) m[i] = Math.round(mf[i]*255); } } catch (e) { console.warn(e); } }
    cuadros.push({ jpg, m, bx });
    prog(0.3 + 0.5*(k+1)/N, `Recortando la máquina ${k+1} de ${N}…`); await pausa();
  }
  v.removeAttribute('src'); v.load(); URL.revokeObjectURL(vurl); cw.width = 1;
  const conCaja = cuadros.filter(q => q.bx);
  const recorte = conCaja.length >= N*0.6;
  // 4) tamaño y lugar parejos
  const fondo = estudio(OW, OH, OH*0.78);
  let cxs, ys, hs;
  if (recorte){
    // los cuadros sin caja toman la del vecino
    for (let k = 0; k < N; k++) if (!cuadros[k].bx){ for (let d = 1; d < N; d++){ const q = cuadros[(k+d)%N].bx || cuadros[(k-d+N)%N].bx; if (q){ cuadros[k].bx = { ...q, prestada: true }; break; } } }
    cxs = cuadros.map(q => (q.bx.x0 + q.bx.x1)/2*WW); ys = cuadros.map(q => q.bx.y1*WHh); hs = cuadros.map(q => (q.bx.y1 - q.bx.y0)*WHh);
    cxs = circ(circ(cxs, 2, mediana), 2, media); ys = circ(circ(ys, 2, mediana), 2, media); hs = circ(circ(hs, 4, mediana), 3, media);
    // lo que sobresale muy por encima de lo que miden los vecinos no es la máquina (un auto o un árbol de atrás pegado): se corta
    const hRaw = cuadros.map(q => (q.bx.y1 - q.bx.y0)*WHh), hMin = circ(hRaw, 4, w => Math.min(...w));
    for (let k = 0; k < N; k++){ const q = cuadros[k]; if (!q.m) continue; const lim = Math.floor((ys[k] - hMin[k]*1.1)/WHh*S);
      if (lim > 0){ for (let i = 0; i < lim*S; i++) q.m[i] = 0; } }
  }
  const anchos = recorte ? cuadros.map((q, k) => (q.bx.x1 - q.bx.x0)*WW/hs[k]) : [];
  // alto objetivo: 34 % del cuadro, achicado si la vista más larga no entra en el 84 % del ancho
  let Ht = OH*0.34; if (recorte){ const maxR = Math.max(...anchos); Ht = Math.min(Ht, OW*0.84/maxR); }
  const piso = OH*0.78, fotos = [];
  const out = document.createElement('canvas'); out.width = OW; out.height = OH; const ox = out.getContext('2d');
  const tmp = document.createElement('canvas'), tx = tmp.getContext('2d'), rf = document.createElement('canvas'), rx = rf.getContext('2d');
  const mk = document.createElement('canvas'); mk.width = S; mk.height = S; const mx = mk.getContext('2d');
  for (let k = 0; k < N; k++){
    const q = cuadros[k];
    q.c = typeof createImageBitmap === 'function' ? await createImageBitmap(q.jpg) : await new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = ko; im.src = URL.createObjectURL(q.jpg); });
    ox.globalAlpha = 1; ox.filter = 'none';
    if (recorte && q.m){
      ox.drawImage(fondo, 0, 0);
      const s = Ht/hs[k], dx = OW/2 - cxs[k]*s, dy = piso - ys[k]*s, w = WW*s, h = WHh*s;
      // máquina sola: cuadro + máscara como transparencia
      const id = mx.createImageData(S, S); for (let i = 0; i < S*S; i++){ const a = Math.max(0, Math.min(1, (q.m[i]/255-0.25)/0.5)); id.data[i*4+3] = a*255; } mx.putImageData(id, 0, 0);
      tmp.width = WW; tmp.height = WHh; tx.globalCompositeOperation = 'source-over'; tx.filter = 'none'; tx.drawImage(q.c, 0, 0);
      tx.globalCompositeOperation = 'destination-in'; tx.filter = 'blur(1px)'; tx.drawImage(mk, 0, 0, WW, WHh); tx.filter = 'none'; tx.globalCompositeOperation = 'source-over';
      // sombra de contacto: la silueta aplastada contra el piso
      const anch = (q.bx.x1 - q.bx.x0)*WW*s;
      let g = ox.createRadialGradient(OW/2, piso, 0, OW/2, piso, anch*0.62); g.addColorStop(0, 'rgba(0,0,0,.42)'); g.addColorStop(0.6, 'rgba(0,0,0,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ox.save(); ox.translate(OW/2, piso); ox.scale(1, 0.13); ox.translate(-OW/2, -piso); ox.fillStyle = g; ox.fillRect(0, piso - anch, OW, anch*2); ox.restore();
      ox.save(); ox.filter = 'blur(6px) brightness(0)'; ox.globalAlpha = 0.55; ox.translate(0, piso); ox.scale(1, 0.06); ox.translate(0, -piso); ox.drawImage(tmp, dx, dy, w, h); ox.restore();
      // reflejo suave en el piso
      rf.width = OW; rf.height = OH; rx.globalCompositeOperation = 'source-over'; rx.save(); rx.translate(0, piso*2); rx.scale(1, -1); rx.drawImage(tmp, dx, dy, w, h); rx.restore();
      g = rx.createLinearGradient(0, piso, 0, piso + Ht*0.45); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      rx.globalCompositeOperation = 'destination-in'; rx.fillStyle = g; rx.fillRect(0, 0, OW, OH); rx.globalCompositeOperation = 'source-over';
      ox.save(); ox.globalAlpha = 0.16; ox.drawImage(rf, 0, 0); ox.restore();
      ox.filter = 'none'; ox.globalAlpha = 1; ox.drawImage(tmp, dx, dy, w, h);
    } else {
      // sin recorte: se encuadra el cuadro entero (centrado) sobre fondo oscuro
      ox.fillStyle = '#0b1120'; ox.fillRect(0, 0, OW, OH);
      const s = Math.min(OW/WW, OH/WHh); ox.drawImage(q.c, (OW-WW*s)/2, (OH-WHh*s)/2, WW*s, WHh*s);
    }
    const b = await new Promise(r => out.toBlob(r, 'image/webp', 0.84)) || await new Promise(r => out.toBlob(r, 'image/jpeg', 0.86));
    fotos.push(b); if (q.c.close) q.c.close(); q.c = null; q.jpg = null; q.m = null; prog(0.82 + 0.18*(k+1)/N, 'Armando el estudio…'); await pausa();
  }
  return { fotos, info: { n: N, vertical, cerro, recorte, vuelta: tFin, segundos: dur, cortadas: cuadros.filter(q => q.bx && q.bx.cortada && !q.bx.prestada).length } };
}
window.armarGiro = armarGiro;
// color para estirar el estudio arriba y abajo en pantallas altas (mismo borde que estudio())
window.FONDO_ESTUDIO = 'linear-gradient(#dfe1e4 0%, #dfe1e4 50%, #f4f4f5 50%, #f4f4f5 100%)';
// estudio sin disco para estirarlo a los costados cuando la pantalla es más ancha que la foto (celular acostado)
let fondoURL = null;
window.fondoEstudio = () => fondoURL || (fondoURL = estudio(640, 360, 360*0.78, true).toDataURL('image/jpeg', 0.9));
})();
