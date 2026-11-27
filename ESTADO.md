# Estado de Inmex 360

Versión publicada: 0.6.0 (27/11/2026), en https://mirkinv.github.io/inmex/ (GitHub Pages, rama main, carpeta raíz).

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

## Prueba con videos reales (26/11)
- Spyne probado por Victor en el moto g05: guía con silueta por ángulo, detección del vehículo, video de vuelta obligatorio, cola de subida… y todo terminó "Failed to process". Tomamos la guía, no el resultado.
- Vista 360 desde un video de una vuelta (`herramientas/cyl2.py` estima la distancia focal con la vuelta completa, `cylh.py` arma el cilindro con franjas centrales y peso por nitidez, `equi.py` lo pasa a 2:1). Una vuelta vertical cubre ±27°: `ver360.html` limita la inclinación (`v=12`) para que se vea solo lo real. Ejemplo `ejemplo/calle360.jpg`.
- Giro de la camioneta desde un video caminando alrededor (`det.py` detecta el vehículo con YOLO11n-seg ONNX, `spin2.py` elige 36 cuadros nítidos y los centra). Visor `giro.html` (arrastrar, girar sola, WhatsApp). Ejemplo `ejemplo/camioneta-giro/`.
- Lecciones de captura: para el 360, 3 vueltas (derecha, inclinada arriba, inclinada abajo) y girar sobre los pies sin caminar; para el giro, celular horizontal, 4–5 m de distancia con la máquina entera en cuadro y paso parejo.

## Modelo 3D con KIRI (26/11)
- Victor escaneó una cubierta con KIRI Engine (Photo Scan, máscara automática, 4K, exporta OBJ). `ver3d.html` ahora abre también mallas .glb (GLTFLoader en `vendor/addons/loaders`, luces hemisférica + direccional). El OBJ de KIRI se convierte a GLB acá (trimesh) antes de cargarlo.
- Pedido de Victor: un solo visor para escenas 360, vehículos y detalles, con puntos (info, observación, foto, precio, video, WhatsApp) colocados tocando. El giro por cuadros no le sirve: quiere "render 360" → modelo 3D.

## Competencia revisada (27/11) y 0.4.0
- Informe: https://claude.ai/artifact/6zP5KdeekoZUCNUxgHvmVz (Matterport, Kuula, CloudPano, Polycam, KIRI, Luma, Sketchfab, revisados en el Chrome de Victor con sus cuentas gratis). Nadie hace 360 con celular sin giróscopo; todos venden el link para compartir. Máquinas 3D: KIRI gratis (ilimitado, 150 fotos, GLB); Polycam de respaldo para cromados; Luma ya no hace 3D.
- `ver360.html` 0.4.0: logo INMEX 360 tapando piso y techo como Kuula (`logo=0` lo saca, `c` = ángulo desde donde tapa, 35 por defecto; `l` = logo propio en el piso), con el logo se puede mirar hasta 80° (`v`), pellizcar para acercar, entrada animada como Matterport (`intro=0` la saca), botones Consultar por WhatsApp (`w`), Compartir (menú del celular o copia el link) y Pantalla completa.

## 0.5.0: publicar y compartir por link (etapa 2, 27/11)
- Victor eligió guardar dentro de la base del Constructor (Supabase tgyleckvjeqpndhhjksq; el plan gratis no deja una tercera base), en una sección aparte: tablas `inmex_tours` (slug del link, tipo, nombre, `datos` jsonb, `publico`, `deleted_at`) e `inmex_editores`, y la carpeta pública de fotos `inmex` (`<id del tour>/<clave>.jpg`). Migración en el repo del Constructor: `supabase/migrations/035_inmex.sql`. No tiene `empresa_id`: no es dato de una empresa; se puede mudar copiando tablas y carpeta.
- Opciones → "🔗 Publicar y compartir link": entra con el usuario del Constructor (queda guardado en el teléfono, `inmex-ses`), sube solo las fotos que faltan (`p.remoto.subidas`, si se corta sigue desde ahí con Reintentar) y guarda los datos sin las fotos sueltas de la captura (`datosPublicos`). Publicar otra vez actualiza el mismo link. Hoja final: Mandar por WhatsApp, Copiar, Compartir y "Ver cómo lo ve el cliente".
- Link `https://mirkinv.github.io/inmex/?t=SLUG` (`abrirRemoto`): abre directo el visor solo para mirar (sin Opciones, Inicio ni Otro punto; datos ℹ️ y ficha sin Editar/Quitar), Ficha solo si tiene datos y botón "💬 Consultar" si hay WhatsApp. Las fotos se bajan de la carpeta pública (`blobRemoto`).
- Solo publica quien está en `inmex_editores` (hoy Victor). Probado: anónimo y otro usuario no pueden cargar ni subir fotos (RLS); Playwright simulado con lugar (2 puntos, dato ℹ️, ficha) y máquina (8 fotos + detalle), segunda publicación sin volver a subir fotos, link roto con aviso.

## 0.6.0: el pack profesional en la app (27/11, Victor afuera 5 h: "mejorá lo que tengas que mejorar")
- Inicio → "Publicados en internet": lista de lo publicado por este usuario (lee `inmex_tours` con `user_id` de la sesión), con Link, "Sacar" (confirma; `publico=false`, el link muestra "No encontré esta vista") y "Volver a publicar" (mismo link). "Cerrar sesión en este celular". En Guardados, "🔗 publicado".
- Visor de la app con logo INMEX 360 tapando piso y techo como en `ver360.html` (`ponerTapas`: color del borde de la foto; vuelta rápida tapa desde 38°, esfera completa desde 72°). Opciones → "Sacar/Poner el logo del piso y techo" (`p.logo`).
- Opciones → "📌 Que empiece mirando para acá" (`pt.vista`), también en el link.
- Link del cliente: entrada animada la primera vez (de lejos y mirando al piso con el logo hasta la vista elegida), botón "Más" (Compartir, Pantalla completa, mapa de los puntos si tienen GPS).
- "▶ Recorrido" (visita guiada como Matterport, `guia`): gira hacia cada dato ℹ️ y lo muestra 4,5 s, después mira la flecha y pasa al punto siguiente; sin datos da una vuelta lenta. Se para con "⏹ Parar" o tocando la vista. En la app y en el link.
- Probado en Playwright (Pixel 5): publicar, lista, sacar y volver a publicar, intro, Más, recorrido guiado de 2 puntos, máquina por link, sin errores.

## Etapas (acordadas con Victor 25/11)
1. Piloto en el celular (hecho). 2. Guardar en internet y link para el cliente. 3. Maqueta 3D de máquinas (en curso). 4. Maqueta de casas: plano dibujado y levantado en 3D, tocar ambiente → 360. 5. Campos: contorno sobre satélite + puntos 360.

## Pendiente
- Confirmar en el moto g05 de Victor: cámara, inclinación, cierre de vuelta.
- Probar en el teléfono de Victor: publicar un recorrido real y abrir el link en otro celular.
- Procesar el ZIP de fotos a modelo 3D: la compu de Victor es Lenovo IdeaCentre AIO 3 24IAP7 con i5-12450H, 12 GB y solo Intel UHD (visto en Información del sistema el 25/11, sin NVIDIA): probar Brush (WebGPU, gratis); si no alcanza, KIRI Engine Pro (USD 17,99/mes) o Scaniverse. Primera prueba real: la camioneta o la CP770.
- Subir el modelo y los ajustes a internet (etapa 2) para mandar el link por WhatsApp.

## Preguntas abiertas a Victor
- Qué es Inmex hoy y qué máquinas van primero.
