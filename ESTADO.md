# Estado de Inmex 360

Versión publicada: 0.2.0 (25/11/2026), en https://mirkinv.github.io/inmex/ (GitHub Pages, rama main, carpeta raíz).

## Hecho
- Modo Lugar: guía en esfera; las fotos se sacan solas al apuntar al punto naranja. Vuelta rápida (10 fotos) o esfera completa (21, por columnas: horizonte, arriba y abajo en el mismo rumbo).
- Giro con giroscopio si hay; si no (moto g05 de Victor), seguimiento con la imagen de la cámara. Al cerrar la vuelta se calibra el lente (`checkClosure`).
- Armado en el teléfono: encastre por correlación, panorámica 2048×1024, techo y piso difuminados. Visor 360 con flechas entre puntos (GPS o a mano) y mapa.
- Modo Máquina: anillo de 24 fotos con la anterior transparente, segunda vuelta, fotos de detalle; visor para girar con el dedo.
- Guardado solo en el teléfono (IndexedDB).
- Probado en un celular simulado con la escena de ejemplo (`?` enlace "Probar con una escena de ejemplo").

## Hecho en 0.2.0 (etapa 3 empezada: maqueta 3D de máquinas)
- Modo Máquina guía 3 vueltas para el 3D (agachado, pecho, brazo arriba). Detalles con nombre propio ("Otro…") y numerados si se repiten.
- "Descargar fotos para el 3D (ZIP)" en Opciones de la máquina (ZIP sin compresión armado en el teléfono, `zipStore`).
- `ver3d.html`: visor de modelos Gaussian splat (.ply/.spz/.splat) con Spark 2.4 + three 0.180 en `vendor/` (sin CDN). Abre archivo del teléfono o `?m=modelo&c=ajustes.json`. Puntos = vista guardada + nombre (se marcan con el círculo del centro), carteles sobre el modelo, dar vueltas solo, WhatsApp, precio, dar vuelta/girar el modelo, descargar ajustes. Ejemplo dibujado en `ejemplo/`.
- Probado con Playwright (Pixel 5 simulado, swiftshader): carga, puntos, X y Cancelar, botones ≥ 44 px, ZIP válido.

## Etapas (acordadas con Victor 25/11)
1. Piloto en el celular (hecho). 2. Guardar en internet y link para el cliente. 3. Maqueta 3D de máquinas (en curso). 4. Maqueta de casas: plano dibujado y levantado en 3D, tocar ambiente → 360. 5. Campos: contorno sobre satélite + puntos 360.

## Pendiente
- Confirmar en el moto g05 de Victor: cámara, inclinación, cierre de vuelta.
- Guardar recorridos en internet y link para el cliente (siguiente etapa).
- Procesar el ZIP de fotos a modelo 3D: la compu de Victor es Lenovo IdeaCentre AIO 3 24IAP7 (Intel integrada o, según configuración, NVIDIA MX550 4 GB): probar Brush (WebGPU, gratis); si no alcanza, KIRI Engine Pro (USD 17,99/mes) o Scaniverse. Primera prueba real: la camioneta o la CP770.
- Subir el modelo y los ajustes a internet (etapa 2) para mandar el link por WhatsApp.

## Preguntas abiertas a Victor
- Qué es Inmex hoy y qué máquinas van primero.
- Confirmar qué placa tiene la compu (Administrador de tareas → Rendimiento → GPU).
