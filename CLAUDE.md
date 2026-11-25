# Inmex 360 — reglas del repo

App web (`index.html` para capturar y ver; `ver3d.html` para modelos 3D) para recorridos 360 y máquinas con el celular de Victor (moto g05), sin cámara especial. Publicada con GitHub Pages desde `main`.

- Al empezar leer `ESTADO.md`; al terminar actualizarlo en el mismo commit.
- Victor no programa: decir siempre qué probar en el teléfono. Textos en castellano rioplatense, botones de 44 px o más.
- No asumir giroscopio: el giro se sigue con la imagen (`vtFrame`, `checkClosure`) y la inclinación con el acelerómetro.
- Probar antes de publicar con la escena de ejemplo (`window.__inmex`, `CAM.demo=true`) en Playwright con un celular emulado.
- La cámara y los sensores solo andan en página segura (https).
- `ver3d.html` usa módulos de `vendor/` (three 0.180, Spark 2.4, OrbitControls) con importmap: no cambiar a CDN. Probar con `ver3d.html?m=ejemplo/camioneta.ply&c=ejemplo/ajustes.json` (Chromium con `--use-angle=swiftshader`).
- Toda hoja lleva X arriba a la derecha y Cancelar.
