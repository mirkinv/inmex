/* Inmex 360 · filmar dentro de la app (sin abrir la cámara del celular).
   Con un input de archivo "capture", Android abre la app de cámara y, en celulares con poca memoria, cierra Chrome
   mientras se filma: al volver aparece "memoria insuficiente" y el video se pierde (le pasó a Victor el 27/11 con el g05).
   Acá la cámara se usa desde la misma página (getUserMedia + MediaRecorder) y Chrome nunca queda en segundo plano.
   filmar({ titulo, guia:'maquina'|'lugar', max:90 }) → Promise<File|null> (null = canceló). El File trae .duracion (s). */
(function(){
function filmar(opc = {}){
  return new Promise(async resolve => {
    const max = opc.max || 90, maq = opc.guia !== 'lugar';
    const d = document.createElement('div'); d.id = 'filmador';
    d.innerHTML = `<style>
#filmador{position:fixed;inset:0;z-index:60;background:#000;color:#fff;font:15px/1.35 system-ui,sans-serif;touch-action:none}
#filmador video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#filmador .fm-guia{position:absolute;left:8%;right:8%;top:22%;bottom:18%;border:3px dashed #ffffffcc;border-radius:18px;box-shadow:0 0 0 2000px #0005;pointer-events:none}
#filmador .fm-guia::after{content:'';position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border:2px solid #fff;border-radius:50%}
#filmador .fm-txt{position:absolute;left:12px;right:64px;top:10px;font-weight:600;text-shadow:0 1px 3px #000}
#filmador .fm-txt small{display:block;font-weight:400;opacity:.9}
#filmador .fm-x{position:absolute;top:8px;right:8px;width:48px;height:48px;border-radius:24px;border:0;background:#000a;color:#fff;font-size:22px}
#filmador .fm-bot{position:absolute;left:0;right:0;bottom:14px;display:flex;align-items:center;justify-content:center;gap:18px}
#filmador .fm-bot button{min-height:48px;padding:10px 16px;border-radius:12px;border:1px solid #ffffff44;background:#000a;color:#fff;font:inherit;font-weight:600}
#filmador .fm-rec{width:72px;height:72px;border-radius:50%!important;border:4px solid #fff!important;background:#e5333a!important;padding:0!important}
#filmador .fm-rec.on{background:#fff!important;box-shadow:inset 0 0 0 18px #e5333a}
#filmador .fm-t{min-width:64px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums;text-shadow:0 1px 3px #000}
#filmador .fm-gira{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;padding:24px;background:#000c;font-size:20px;font-weight:700}
@media (orientation:portrait){ #filmador.maq .fm-gira{display:flex} }
</style>
<video playsinline muted autoplay></video>${maq ? '<div class="fm-guia"></div>' : ''}
<div class="fm-txt">${opc.titulo || 'Filmar la vuelta'}<small class="fm-ayuda">${maq ? 'Que la máquina entre entera en el recuadro. Tocá el botón rojo y caminá despacio alrededor, a la misma distancia.' : 'Tocá el botón rojo y girá despacio sobre tus pies una vuelta completa.'}</small></div>
<button class="fm-x" aria-label="Cerrar">✕</button>
<div class="fm-bot"><button class="fm-can">Cancelar</button><button class="fm-rec" aria-label="Grabar"></button><span class="fm-t">0:00</span></div>
${maq ? '<div class="fm-gira">📱↔️<br>Poné el celular acostado<br><small style="font-weight:400;font-size:15px">La máquina tiene que entrar entera, con aire alrededor.</small></div>' : ''}`;
    if (maq) d.classList.add('maq');
    document.body.appendChild(d);
    const v = d.querySelector('video'), rec = d.querySelector('.fm-rec'), tt = d.querySelector('.fm-t'), ayuda = d.querySelector('.fm-ayuda');
    let stream = null, mr = null, partes = [], t0 = 0, reloj = null, lock = null, listo = false;
    const cerrar = (res) => { if (listo) return; listo = true; clearInterval(reloj); try { mr && mr.state !== 'inactive' && mr.stop(); } catch (e) {} if (stream) stream.getTracks().forEach(t => t.stop()); try { lock && lock.release(); } catch (e) {} d.remove(); resolve(res); };
    d.querySelector('.fm-x').onclick = () => cerrar(null); d.querySelector('.fm-can').onclick = () => cerrar(null);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } } });
      v.srcObject = stream; await v.play().catch(() => {});
    } catch (e) {
      ayuda.textContent = 'No pude abrir la cámara. Revisá el permiso de cámara del navegador, o filmá con la cámara del celular y elegí el video de la galería.';
      rec.disabled = true; rec.style.opacity = .4; return;
    }
    const tipos = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'], tipo = tipos.find(x => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(x)) || '';
    const fmt = s => Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2, '0');
    rec.onclick = async () => {
      if (!mr){
        if (!window.MediaRecorder){ ayuda.textContent = 'Este navegador no puede filmar acá: filmá con la cámara del celular y elegí el video de la galería.'; return; }
        try { lock = navigator.wakeLock ? await navigator.wakeLock.request('screen') : null; } catch (e) {}
        mr = new MediaRecorder(stream, tipo ? { mimeType: tipo, videoBitsPerSecond: 4e6 } : { videoBitsPerSecond: 4e6 });
        mr.ondataavailable = e => { if (e.data && e.data.size) partes.push(e.data); };
        mr.onstop = () => { const dur = (performance.now() - t0)/1000, ty = mr.mimeType || tipo || 'video/webm';
          const f = new File(partes, 'vuelta.' + (ty.includes('mp4') ? 'mp4' : 'webm'), { type: ty }); f.duracion = dur; cerrar(f); };
        mr.start(1000); t0 = performance.now(); rec.classList.add('on'); rec.setAttribute('aria-label', 'Terminar');
        ayuda.textContent = maq ? 'Caminá despacio alrededor, siempre a la misma distancia, hasta volver al principio. Después tocá el botón.' : 'Girá despacio hasta volver al principio. Después tocá el botón.';
        reloj = setInterval(() => { const s = (performance.now() - t0)/1000; tt.textContent = fmt(s); if (s >= max) rec.onclick(); }, 250);
      } else if (mr.state === 'recording'){
        const s = (performance.now() - t0)/1000;
        if (s < 8){ ayuda.textContent = 'Muy corto: seguí caminando hasta dar la vuelta completa.'; return; }
        clearInterval(reloj); ayuda.textContent = 'Guardando el video…'; mr.stop();
      }
    };
  });
}
window.filmar = filmar;
})();
