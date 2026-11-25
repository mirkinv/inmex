# Estado de Inmex 360

Versión publicada: 0.3.0 (25/11/2026), en https://mirkinv.github.io/inmex/ (GitHub Pages, rama main, carpeta raíz).

## Hecho
- Modo Lugar: guía en esfera; las fotos se sacan solas al apuntar al punto naranja. Vuelta rápida (10 fotos) o esfera completa (21, por columnas: horizonte, arriba y abajo en el mismo rumbo).
- Giro con giroscopio si hay; si no (moto g05 de Victor), seguimiento con la imagen de la cámara. Al cerrar la vuelta se calibra el lente (`checkClosure`).
- Armado en el teléfono: encastre por correlación, panorámica 2048×1024, techo y piso difuminados. Visor 360 con flechas entre puntos (GPS o a mano) y mapa.
- Modo Máquina: anillo de 24 fotos con la anterior transparente, segunda vuelta, fotos de detalle; visor para girar con el dedo.
- Guardado solo en el teléfono (IndexedDB).
- 0.3.0: datos sobre la foto (ℹ️ con título, detalle y foto; Opciones → "Agregar dato sobre la foto"), ficha por recorrido o máquina (precio, dónde está, descripción, botón "Consultar por WhatsApp"; el número queda recordado), descarte de fotos movidas (`nitidez`/`movida`: detalle fino relativo al contraste, menos de 40 % de la mediana de las últimas 5; como mucho un reintento seguido para no trabar) y visor que gira solo hasta que lo tocan (360 y máquina).
- Probado en un celular simulado con la escena de ejemplo (`?` enlace "Probar con una escena de ejemplo").

## Hecho en 0.2.0 (etapa 3 empezada: maqueta 3D de máquinas)
- Modo Máquina guía 3 vueltas para el 3D (agachado, pecho, brazo arriba). Detalles con nombre propio ("Otro…") y numerados si se repiten.
- "Descargar fotos para el 3D (ZIP)" en Opciones de la máquina (ZIP sin compresión armado en el teléfono, `zipStore`).
- `ver3d.html`: visor de modelos Gaussian splat (.ply/.spz/.splat) con Spark 2.4 + three 0.180 en `vendor/` (sin CDN). Abre archivo del teléfono o `?m=modelo&c=ajustes.json`. Puntos = vista guardada + nombre (se marcan con el círculo del centro), carteles sobre el modelo, dar vueltas solo, WhatsApp, precio, dar vuelta/girar el modelo, descargar ajustes. Ejemplo dibujado en `ejemplo/`.
- Probado con Playwright (Pixel 5 simulado, swiftshader): carga, puntos, X y Cancelar, botones ≥ 44 px, ZIP válido.

## Calibración (25/11, después del video de la cocina)
- Prueba de esfera completa con el moto g05: 5 de 21 fotos en 2:20, se traba al apuntar al techo liso; resultado con huecos y uniones. Causa: el moto g05 no tiene giróscopo, brújula ni magnetómetro (solo acelerómetro); el seguimiento por imagen falla en superficies lisas.
- Decisiones de Victor: rehacer la captura y comprar cámara 360 con el primer cliente que pague; INMEX sirve para todo (CP770, campo, casas, servicio); los clientes también van a sacar fotos con su celular (tiene que andar en cualquiera, sin giróscopo); para mostrar: "profesional o nada".
- Rumbo: dejar de perseguir puntos en pantalla. Captura por video de vuelta (2–3 vueltas lentas a distintas alturas) y armado de la panorámica fuera de la captura (más cuadros, mejor encastre), techo y piso tapados con el logo. Primero probar la calidad con un video real de Victor antes de programarlo.

## Etapas (acordadas con Victor 25/11)
1. Piloto en el celular (hecho). 2. Guardar en internet y link para el cliente. 3. Maqueta 3D de máquinas (en curso). 4. Maqueta de casas: plano dibujado y levantado en 3D, tocar ambiente → 360. 5. Campos: contorno sobre satélite + puntos 360.

## Pendiente
- Confirmar en el moto g05 de Victor: cámara, inclinación, cierre de vuelta.
- Guardar recorridos en internet y link para el cliente (etapa 2). Se le preguntó a Victor dónde (25/11): base Supabase nueva solo para Inmex (recomendado), dentro del Constructor, o archivo para mandar.
- Procesar el ZIP de fotos a modelo 3D: la compu de Victor es Lenovo IdeaCentre AIO 3 24IAP7 con i5-12450H, 12 GB y solo Intel UHD (visto en Información del sistema el 25/11, sin NVIDIA): probar Brush (WebGPU, gratis); si no alcanza, KIRI Engine Pro (USD 17,99/mes) o Scaniverse. Primera prueba real: la camioneta o la CP770.
- Subir el modelo y los ajustes a internet (etapa 2) para mandar el link por WhatsApp.

## Preguntas abiertas a Victor
- Qué es Inmex hoy y qué máquinas van primero.
- Dónde guardar los tours para el link (tarjeta del 25/11).
