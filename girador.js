/* Inmex 360 · visor de giro suave (36 fotos o las que haya).
   - todas las fotos se bajan y se decodifican antes de mostrar (no hay saltos por carga);
   - la posición es continua: entre dos fotos se funden (la de abajo y la siguiente encima con transparencia);
   - sigue al dedo (un ancho de pantalla ≈ una vuelta) y al soltar sigue girando con inercia y frena solo;
   - gira sola despacio hasta que la tocan; pellizcar o doble toque acerca, y con zoom se arrastra para mirar.
   crearGirador(contenedor, urls, { auto:true, alListo, alTocar }) → { ir(pos), auto(bool), destruir() } */
(function(){
function crearGirador(box, urls, opc = {}){
  const N = urls.length; if (!N) return null;
  box.classList.add('girador');
  if (!document.getElementById('girador-css')){
    const st = document.createElement('style'); st.id = 'girador-css';
    st.textContent = `.girador{position:relative;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}
.girador .gi-capa{position:absolute;inset:0;transform-origin:0 0;will-change:transform}
.girador img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;-webkit-user-drag:none}
.girador .gi-carga{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#000a;color:#fff;padding:10px 16px;border-radius:12px;font:600 15px system-ui}
.girador .gi-carga i{display:block;height:4px;margin-top:8px;background:#ffffff33;border-radius:2px}.girador .gi-carga i b{display:block;height:100%;width:0;background:#4f8cff;border-radius:2px}`;
    document.head.appendChild(st);
  }
  box.style.background = opc.fondo || '#000';
  box.innerHTML = '<div class="gi-capa"><img class="gi-a" alt=""><img class="gi-b" alt=""></div><div class="gi-carga">Cargando el giro…<i><b></b></i></div>';
  const capa = box.querySelector('.gi-capa'), A = box.querySelector('.gi-a'), B = box.querySelector('.gi-b'), carga = box.querySelector('.gi-carga');
  let pos = 0, vel = 0, auto = opc.auto !== false, listo = false, vivo = true, ultimo = -1, ua = -1, ub = -1;
  let zoom = 1, px = 0, py = 0;
  // precarga y decodificación
  let ok = 0;
  const imgs = urls.map(u => { const im = new Image(); im.decoding = 'async'; im.src = u; return im; });
  Promise.all(imgs.map(im => (im.decode ? im.decode() : new Promise(r => im.onload = r)).catch(() => {}).then(() => { ok++; const b = carga.querySelector('b'); if (b) b.style.width = Math.round(ok/N*100) + '%'; })))
    .then(() => { if (!vivo) return; carga.remove(); listo = true; dibujar(true); opc.alListo && opc.alListo(); });
  const mod = k => ((k % N) + N) % N;
  function dibujar(forzar){
    const p = mod(pos), i = Math.floor(p), f = p - i, j = mod(i+1);
    if (forzar || i !== ua){ A.src = urls[i]; ua = i; }
    if (forzar || j !== ub){ B.src = urls[j]; ub = j; }
    // la foto queda nítida la mayor parte del recorrido y se funde con la siguiente solo en el último tramo
    const u = Math.max(0, Math.min(1, (f - 0.55)/0.45)), op = Math.round(u*u*(3 - 2*u)*100)/100; if (op !== ultimo){ B.style.opacity = op; ultimo = op; }
    capa.style.transform = `translate(${px}px,${py}px) scale(${zoom})`;
  }
  // bucle: auto, inercia
  let t0 = performance.now();
  function paso(t){
    if (!vivo) return; const dt = Math.min(0.05, (t - t0)/1000); t0 = t;
    if (listo && !arr){
      if (Math.abs(vel) > 0.6){ pos += vel*dt; vel *= Math.pow(0.04, dt); dibujar(); }   // frena en ~1 s
      else if (auto){ pos += (opc.velAuto || N/14)*dt; dibujar(); }                       // una vuelta cada 14 s
      else { const r = Math.round(pos), d = r - pos; if (Math.abs(d) > 0.004){ pos += d*Math.min(1, dt*10); dibujar(); } else if (d){ pos = r; dibujar(); } } // quieto: se acomoda en la foto más cercana (sin doble imagen)
    }
    requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
  // dedo
  const pts = new Map(); let arr = null, pin = null, tapT = 0;
  const fpp = () => N/(box.clientWidth*1.05);   // fotos por píxel
  const limitar = () => { const w = box.clientWidth, h = box.clientHeight; px = Math.min(0, Math.max(w - w*zoom, px)); py = Math.min(0, Math.max(h - h*zoom, py)); if (zoom <= 1.001){ zoom = 1; px = 0; py = 0; } };
  function zoomEn(z, cx, cy){ const r = box.getBoundingClientRect(); const x = cx - r.left, y = cy - r.top; const nz = Math.max(1, Math.min(4, z)); px = x - (x - px)*nz/zoom; py = y - (y - py)*nz/zoom; zoom = nz; limitar(); dibujar(); }
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('button,a,input')) return;
    box.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    auto = false; vel = 0; opc.alTocar && opc.alTocar();
    if (pts.size === 1){ arr = { x: e.clientX, y: e.clientY, pos, px, py, t: performance.now(), hist: [{ t: performance.now(), x: e.clientX }] };
      const ahora = performance.now(); if (ahora - tapT < 300){ zoomEn(zoom > 1.2 ? 1 : 2.2, e.clientX, e.clientY); arr = null; tapT = 0; } else tapT = ahora; }
    else if (pts.size === 2){ const [a, b] = [...pts.values()]; pin = { d: Math.hypot(a.x-b.x, a.y-b.y), z: zoom }; arr = null; }
    box.style.cursor = 'grabbing';
  });
  box.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pin && pts.size === 2){ const [a, b] = [...pts.values()]; zoomEn(pin.z*Math.hypot(a.x-b.x, a.y-b.y)/pin.d, (a.x+b.x)/2, (a.y+b.y)/2); return; }
    if (!arr) return;
    if (zoom > 1){ px = arr.px + (e.clientX - arr.x); py = arr.py + (e.clientY - arr.y); limitar(); dibujar(); return; }
    pos = arr.pos - (e.clientX - arr.x)*fpp(); dibujar();
    const t = performance.now(); arr.hist.push({ t, x: e.clientX }); while (arr.hist.length > 2 && t - arr.hist[0].t > 90) arr.hist.shift();
  });
  const soltar = e => {
    if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId);
    if (pts.size < 2) pin = null;
    if (arr && zoom <= 1 && pts.size === 0){ const h = arr.hist, a = h[0], b = h[h.length-1], dt = (b.t - a.t)/1000; if (dt > 0.01 && performance.now() - b.t < 80) vel = Math.max(-N*1.5, Math.min(N*1.5, -(b.x - a.x)/dt*fpp())); }
    if (pts.size === 0){ arr = null; box.style.cursor = 'grab'; }
  };
  box.addEventListener('pointerup', soltar); box.addEventListener('pointercancel', soltar);
  box.addEventListener('wheel', e => { e.preventDefault(); zoomEn(zoom*Math.exp(-e.deltaY*0.0015), e.clientX, e.clientY); }, { passive: false });
  addEventListener('resize', () => { limitar(); dibujar(); });
  return {
    ir(p){ pos = p; vel = 0; dibujar(); }, get pos(){ return pos; }, get listo(){ return listo; },
    auto(v){ auto = v === undefined ? !auto : !!v; vel = 0; return auto; }, get girando(){ return auto; },
    zoom(z){ const r = box.getBoundingClientRect(); zoomEn(z, r.left + r.width/2, r.top + r.height/2); },
    destruir(){ vivo = false; box.innerHTML = ''; }
  };
}
window.crearGirador = crearGirador;
})();
