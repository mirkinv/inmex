# Inmex 360 — reglas del repo

App web (un solo `index.html`) para recorridos 360 y máquinas con el celular de Victor (moto g05), sin cámara especial. Publicada con GitHub Pages desde `main`.

- Al empezar leer `ESTADO.md`; al terminar actualizarlo en el mismo commit.
- Victor no programa: decir siempre qué probar en el teléfono. Textos en castellano rioplatense, botones de 44 px o más.
- No asumir giroscopio: el giro se sigue con la imagen (`vtFrame`, `checkClosure`) y la inclinación con el acelerómetro.
- Probar antes de publicar con la escena de ejemplo (`window.__inmex`, `CAM.demo=true`) en Playwright con un celular emulado.
- La cámara y los sensores solo andan en página segura (https).
