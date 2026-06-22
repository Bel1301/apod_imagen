# Changelog

Todos los cambios notables de **Horizon** se documentan en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

## [2026-06-21] — Fixes buscador, imagen móvil y Tierra

### Fixed
- **Buscador (error):** se reemplazó `count=200` (que NASA resuelve trayendo 200
  días aleatorios uno por uno → timeout) por una consulta de **rango de fechas**
  (último año) en una sola query. Timeout 15s + `maxDuration` 30s + manejo de 504.
- **Imagen del día rota en móvil:** el preview ahora usa la `url` estándar (la
  `hdurl` puede pesar varios MB y fallar en móvil), con fallback automático a
  `hdurl` si la estándar falla.

### Changed
- Links **"Open on NASA"** y **"NASA APOD official"** ahora en **crema** (antes naranja).
- **Tierra parallax sin fondo negro:** `mix-blend-mode:screen` funde el negro del
  espacio con el fondo oscuro, dejando ver las estrellas detrás del globo.

## [2026-06-21] — Ajustes finales

### Changed
- **Logo Horizon (H transparente)** forzado en favicon, footer y manifest con
  `?v=3` para invalidar el cacheado del logo anterior.
- **Botones**: recoloreados a **fondo crema** (`#efe5cf`) con **texto azul oscuro**
  (`#16285c`), manteniendo las variantes Primary y Ghost/Text.
- El wordmark **HORIZON** ahora usa **Space Grotesk** en todas sus apariciones
  (splash, masthead y footer).
- La **Tierra con parallax** pasa a ser **full-bleed** (punta a punta, ancho del
  viewport, sin esquinas redondeadas); `overflow-x:hidden` en `body` evita scroll
  horizontal.
- Copyright del footer: `© 2026 MBP` → `© 2026 Horizon`.

## [2026-06-21]

### Added
- **Cache de cliente (stale-while-revalidate)** para APOD: la última respuesta
  se guarda en `localStorage` y se muestra al instante en la siguiente visita
  mientras se revalida contra la API en segundo plano. Elimina la latencia de
  espera percibida en cada carga.
- Nuevo **logo de Horizon** (una "H" formada con la Tierra) como badge del footer,
  favicon (`?v=2` para invalidar el cacheado) y `apple-touch-icon`.
- `CHANGELOG.md` (este archivo).

### Changed
- **Botones minimalistas** con sistema Primary + Ghost/Text: fondo natural
  translúcido y **texto azul** (`#8fb3ff`). El rectángulo del date, el input de
  fecha y el buscador también se simplificaron (sin glass/blur, bordes finos).
- **Tierra interactiva con parallax al cursor**: reemplaza el fondo fijo. La imagen
  sigue el movimiento del mouse con un glow sutil; en mobile se muestra estática.
  Ubicada como sección destacada antes del footer.
- **Tipografía**: la app vuelve a la fuente de sistema; **Space Grotesk** queda
  reservada exclusivamente para el título **HORIZON** de la pantalla de bienvenida.
- Footer ampliado (logo 48px, textos 13–22px, mayor espaciado) y siempre en inglés.
- Imagen de la Tierra reemplazada por `tierra.png` en alta resolución, con franja
  más alta (360px desktop / 220px mobile) y filtro de nitidez (unsharp mask SVG +
  `contrast`/`saturate`).
- Iconos PWA con `purpose: "any"` (el logo transparente ya no se recorta como maskable).
- Buscador: usa `count=200` APODs aleatorios del archivo completo (30 años) en lugar
  de la ventana de 90 días, ampliando la cobertura de resultados.

### Fixed
- La pantalla de bienvenida solo se muestra en la primera visita de la sesión
  (`sessionStorage`), no al cambiar de fecha ni al buscar.
- El selector de fecha viene seteado con el día de hoy por defecto.
- **Seguridad (OWASP):** `api/gallery.js` ya no expone `e.message` al cliente
  (information disclosure); devuelve un error genérico y registra el detalle en logs.

### Security
- Auditoría OWASP tras los cambios: XSS mitigado (`textContent` + `esc()`),
  CSP ampliada solo para Google Fonts, API key únicamente server-side, sin SSRF
  (entradas validadas/filtradas localmente), enlaces externos con `rel="noopener noreferrer"`.
