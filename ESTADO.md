# Estado de Inmex 360

Versión publicada: 0.2.0 (25/11/2026), en https://mirkinv.github.io/inmex/ (GitHub Pages, rama main, carpeta raíz).

## Hecho
- Modo Lugar: guía en esfera; las fotos se sacan solas al apuntar al punto naranja. Vuelta rápida (10 fotos) o esfera completa (21, por columnas: horizonte, arriba y abajo en el mismo rumbo).
- Giro con giroscopio si hay; si no (moto g05 de Victor), seguimiento con la imagen de la cámara. Al cerrar la vuelta se calibra el lente (`checkClosure`).
- Armado en el teléfono: encastre por correlación, panorámica 2048×1024, techo y piso difuminados. Visor 360 con flechas entre puntos (GPS o a mano) y mapa.
- Modo Máquina: anillo de 24 fotos con la anterior transparente, segunda vuelta, fotos de detalle; visor para girar con el dedo.
- Guardado solo en el teléfono (IndexedDB).
- 0.2.0: datos sobre la foto (ℹ️ con título, detalle y foto; Opciones → "Agregar dato sobre la foto"), ficha por recorrido o máquina (precio, dónde está, descripción, botón "Consultar por WhatsApp"; el número queda recordado), descarte de fotos movidas (`nitidez`/`movida`: menos de 45 % de la mediana de las anteriores) y visor que gira solo hasta que lo tocan (360 y máquina).
- Probado en un celular simulado con la escena de ejemplo (`?` enlace "Probar con una escena de ejemplo").

## Pendiente
- Confirmar en el moto g05 de Victor: cámara, inclinación, cierre de vuelta.
- Guardar recorridos en internet y link para el cliente (0.3). Se le preguntó a Victor dónde: base Supabase nueva solo para Inmex (recomendado), dentro del Constructor, o archivo para mandar.
- Modelo 3D real de máquinas (Gaussian splatting) con las mismas fotos.

## Preguntas abiertas a Victor
- Qué es Inmex hoy y qué máquinas van primero.
- (Respondido 25/11) Su PC no tiene NVIDIA (Intel UHD, 12 GB): el 3D real se procesa en la nube.
