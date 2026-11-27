# Estado de Inmex 360

Versión publicada: 0.11.0 (27/11/2026), en https://mirkinv.github.io/inmex/ (GitHub Pages, rama main, carpeta raíz).

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

## 0.7.0: cuántos lo miran y vista previa en WhatsApp (27/11)
- Tabla `inmex_vistas` (migración 036 del Constructor): cada link abierto anota "vista" y cada toque a WhatsApp "consulta" (sin datos de la persona; no cuenta al dueño ni recargas dentro de 30 min, `anotar`). "Publicados en internet" muestra 👁 veces abierto y 💬 consultas (si la consulta con conteos falla, trae la lista sin conteos).
- Vista previa del link en WhatsApp: etiquetas og con `og.jpg` (1200×630, logo INMEX 360 y "Recorrido 360"). Es la misma para todos los links (GitHub Pages no arma una por recorrido).

## 0.8.0: inicio nuevo (27/11)
- Victor vio el inicio y dijo "parece que volvimos a lo viejo": lo nuevo estaba solo en el visor y el link. Inicio rehecho: frase de venta, "Así lo ve tu cliente" con dos ejemplos (ver360 con la calle y giro.html con la camioneta, miniaturas en `ejemplo/mini-*.jpg`), "Publicados en internet" siempre a la vista (con "Entrar" si no hay sesión), "Cargar un lugar" con la opción de video plegable (3 vueltas, por ahora la panorámica la armamos nosotros: botón WhatsApp) y fotos en el momento, "Cargar una máquina", sensores plegados al final.
- Se le preguntó (tarjeta) qué sigue: filmar y que la app arme el 360 en el teléfono, máquinas 3D publicadas por link, o las dos.

## 0.9.0: filmar la vuelta y la app arma el 360 sola (27/11)
- Victor dejó la compu y se fue ("no me decepciones"); la tarjeta de qué sigue quedó sin respuesta y se siguió con lo recomendado: primero video, después 3D por link.
- `video360.js` (`armar360(file, prog)`): el método de `herramientas/cyl2.py`+`cylh.py`+`equi.py` pasado al navegador, sin servidor. Lee ~8 cuadros por segundo (seek), mide el corrimiento entre cuadros con gradientes (no le molesta el cambio de luz), busca el cuadro donde se cierra la vuelta (da el largo y el lente), pasa cada cuadro a cilindro y pega franjas con fundido, y lo pasa a 2:1 (alto de trabajo 720, ancho hasta 4096). Lo que no se filmó se rellena con el color del borde y lo tapa el logo (tapa desde 38°). Errores claros: video corto, vuelta sin cerrar, video torcido.
- Inicio: "🎥 Filmar la vuelta (mejor calidad)" (input con capture) y "🖼️ Usar un video de la galería" (sin capture), "Cómo filmar" plegable; las fotos quedan como "beta". En el visor, "Otro punto" ofrece filmar, galería o fotos; el punto nuevo se enlaza con flechas (GPS si lo da en 2,5 s).
- Probado con un video simulado de 12 s armado desde `ejemplo/calle360.jpg` (vuelta de 400°, temblor, cambio de luz): cierra en el cuadro correcto, lente medido 48° (real 50°), cubre ±37°, 43 s en la compu. Falta probar con un video real del moto g05 (puede tardar 2 o 3 veces más).

## 0.10.0: máquinas en 3D publicadas por link (27/11)
- `ver3d.html` → Opciones → "🔗 Publicar y compartir link": misma sesión que la app (`inmex-ses`), sube el archivo abierto (GLB de KIRI/Polycam o splat, hasta 50 MB; migración 037 del Constructor abrió la carpeta `inmex` a modelos) a `inmex/<id>/modelo.<ext>` y guarda en `inmex_tours` (tipo maquina, `datos.modelo3d` + `cfg` con nombre, precio, WhatsApp, giro y puntos). Lo publicado se recuerda por archivo (`inmex3d-pub:<nombre>`); publicar otra vez actualiza datos y puntos sin volver a subir el modelo.
- El link es el mismo formato (`?t=SLUG`): `index.html` ve `datos.modelo3d` y pasa a `ver3d.html?t=`, que lo abre solo para mirar (sin Opciones, girando solo, puntos y WhatsApp normalizado con `waNum`), y cuenta vista y consulta igual que los recorridos.
- Probado en Playwright (swiftshader) con `ejemplo/camioneta.ply`: subida, datos, link, apertura del cliente, sin errores.

## 0.11.0: giro de máquina como en las vidrieras profesionales (27/11)
- Victor: el giro de la camioneta "va a saltos, eso no lo paga nadie, fijate Spyne". Revisado por dentro en su Chrome: Spyne usa 36 fotos horizontales (1424×801) que se cambian una por otra; lo suave sale de las fotos: el vehículo siempre del mismo tamaño, parado sobre el mismo disco y con fondo de estudio (pared, piso, disco, sombra). Nuestro ejemplo venía de un video vertical y muy cerca (camioneta cortada en 33 de 36 fotos): se sacó del inicio hasta tener uno bueno.
- `giro360.js` (`armarGiro(file, prog)`): del video elige 36 cuadros parejos en la vuelta (busca el cierre con el primer cuadro y el más nítido de cada tramo), recorta el vehículo con u2netp (`vendor/modelos/u2netp.onnx`, onnxruntime-web 1.20.1 en `vendor/ort/`, un hilo), se queda con la mancha central (erosión para separar autos u objetos pegados y corte de lo que sobresale por arriba de los vecinos), iguala tamaño (alto) y lugar (ruedas sobre la línea del piso, centro en el disco) alisando entre vecinos, y dibuja estudio + sombra + reflejo. Salida webp 1280×720. Avisa si el video es vertical, si la máquina quedó cortada o si no pudo recortar.
- `girador.js` (`crearGirador`): precarga y decodifica todo, posición continua que sigue al dedo (un ancho ≈ una vuelta), inercia al soltar, gira sola despacio, fundido solo en el último tramo entre fotos y al quedar quieto se acomoda en la foto más cercana, pellizcar/doble toque para acercar. Lo usan el visor de la app, el link publicado y `giro.html` (`?d=&n=&x=webp&e=1`).
- Inicio → "Cargar una máquina": 🎥 Filmar la vuelta a la máquina / video de la galería, con "Cómo filmar" (celular acostado, entera con aire, una vuelta de 40–60 s a la misma distancia). Las 3 vueltas con fotos quedan como "Con fotos para el 3D (beta)". Pantalla prendida mientras arma (`wakeLock`).
- Probado en Playwright (Pixel 5) con un video de prueba armado con un auto 3D dando la vuelta con mano temblorosa sobre la calle de ejemplo: 36 fotos parejas, 0 cortadas, ~100 s en la nube (el recorte tarda ~1,8 s por foto en un hilo: en el g05 se calculan 3 a 4 minutos). Publicar y abrir el link de una máquina sigue andando.
- Falta: probar con un video real de Victor (pedido: camioneta filmada horizontal) y poner ese giro como ejemplo del inicio; medir el tiempo en el g05.

## Etapas (acordadas con Victor 25/11)
1. Piloto en el celular (hecho). 2. Guardar en internet y link para el cliente. 3. Maqueta 3D de máquinas (en curso). 4. Maqueta de casas: plano dibujado y levantado en 3D, tocar ambiente → 360. 5. Campos: contorno sobre satélite + puntos 360.

## Pendiente
- Confirmar en el moto g05 de Victor: cámara, inclinación, cierre de vuelta.
- Probar en el teléfono de Victor: filmar una vuelta, ver cuánto tarda y cómo sale; publicar y abrir el link en otro celular.
- Giro de máquina: video real de Victor, ejemplo nuevo en el inicio, tiempo en el g05 (si tarda mucho: recorte en un worker o con la GPU).
- Procesar el ZIP de fotos a modelo 3D: la compu de Victor es Lenovo IdeaCentre AIO 3 24IAP7 con i5-12450H, 12 GB y solo Intel UHD (visto en Información del sistema el 25/11, sin NVIDIA): probar Brush (WebGPU, gratis); si no alcanza, KIRI Engine Pro (USD 17,99/mes) o Scaniverse. Primera prueba real: la camioneta o la CP770.
- Subir el modelo y los ajustes a internet (etapa 2) para mandar el link por WhatsApp.

## Preguntas abiertas a Victor
- Qué es Inmex hoy y qué máquinas van primero.
