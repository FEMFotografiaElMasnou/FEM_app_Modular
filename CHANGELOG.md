# Changelog — FEM VOTACIONS (versión modular)

Registro cronológico del desglose del monolito a estructura modular.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Fechas `YYYY-MM-DD`.

> Este changelog cubre **solo la modularización** (carpeta `FEM_app_Modular/`).
> El histórico funcional del producto vive en `Instrucciones/Archivos MD/.../Changelog.MD`.

---

## [0.1.19] — 2026-07-07 — App Resultats (Enric): Netlify → Vercel

> Petición (Pablo): la web de clasificaciones/resultados de Enric dejó de estar en Netlify
> (`https://fem-reptes.netlify.app/`) y ahora vive en Vercel (`https://fem-resultats.vercel.app/`).
> Los botones **"Classificació general"** y **"Resultat reptes"** de la pantalla de participante
> la cargan en un iframe, así que apuntaban a un dominio muerto.

### Cambiado
- **URL base de la App Resultats** (`js/screens/participant.js`): `RESULTATS_BASE` pasa de
  `https://fem-reptes.netlify.app/` a `https://fem-resultats.vercel.app/`. Solo cambia el host;
  los query params (`role`, `view`, `embedded`) se mantienen, la app de Enric los sigue leyendo igual.
- **Docs**: `CLAUDE.md` (nota de integraciones de Enric) actualizada a la nueva URL.

## [0.1.18] — 2026-07-05 — "← Tornar" en barra fixa a amplades intermèdies

> Petición (Pablo): en la app embebida (Resultat Repte / Classificació General), el botón
> flotante **"← Tornar"** se solapaba sobre el título de la App de Enric en ventanas de
> ancho intermedio (escritorio estrecho). En móvil y a partir de ~1300px ya estaba bien.

### Arreglado
- **Botón "← Tornar" en barra fija** (`css/participant.css`): nuevo
  `@media (min-width:641px) and (max-width:1300px)` que, en ese rango, saca el botón de
  flotar (arriba-izquierda) y lo fija en una barra superior de 44px; el iframe baja esa
  fila conservando la escala (`--iframe-zoom`, sin encoger). Mismo patrón que ya se usaba
  en móvil (≤640px). Los botones de criterio (creativitat/temàtica/composició) que "se
  mueven" son de la App de Enric (iframe cross-origin) y quedan fuera de este arreglo.

## [0.1.17] — 2026-07-04 — Calendari EN PRODUCCIÓ ✅

> Hito, sin cambios de código: Pablo aplicó `sql/reptes_calendari.sql` en el proyecto
> Supabase **Normal** (tabla + `fem_apply_calendar()` + cron `fem-calendar` a las 00:05 UTC).
> Verificado por REST: la tabla existe y el reto activo ya está programado con automatización
> ON (subida 01-06 → 17-07, votación 19-07 → 22-07; nombres se revelan solos el 23-07).
> Con esto, la feature Calendari (bloques 1 y 2) queda completa en las dos bases de datos.
> Recordatorio operativo: el cierre de temática sigue siendo manual ("Finalitzar temàtica"),
> pasada la votación hay que finalizarla para computar los puntos del ranking general.

## [0.1.16] — 2026-07-04 — Calendari visual (Bloc 2): rejilla de mes amb franges per repte

> Petición (Pablo): sustituir la card de 4 campos de fecha por un **calendario visual** tipo
> Google Calendar que sea a la vez editor e histórico: rejilla del mes con flechas ‹ ›,
> marcar rangos clicando día de apertura y día de cierre, franja azul para subida y azul
> cian para votación (translúcidas, se leen los números), y nombre del reto sobre las
> franjas de los retos acabados. Solo admin.

### Añadido
- **Rejilla de mes** (`js/features/calendari.js`: `renderCalMonth()`, `calNavMonth()`,
  `calSetMode()`, `calDayClick()`; CSS `.cal-*` en `admin.css`): semana empezando en lunes,
  hoy marcado con aro, navegación de meses, franjas de **todos** los retos de
  `reptes_calendari` (histórico incluido) con tooltip y rótulo del nombre en los acabados.
- **Edición por clics "inteligente"**: chips "📤 Marcar pujada" / "🗳️ Marcar votació" (i18n
  `cal_mark_upload`/`cal_mark_voting`). Con un chip activo: clic en un día → lo marca;
  clic en otro día → **rellena el rango automáticamente** (también hacia atrás y cruzando
  meses); clic sobre la zona ya marcada → **borra el rango** (para rectificar). Iterado con
  Pablo: la 1ª versión (clic abre / clic cierra obligatorio) no dejaba rectificar a medias.
  El rango se previsualiza al momento sobre la rejilla (borrador `calDraft`), pero **no se
  persiste hasta "Desar calendari"** (mismas validaciones de siempre). El auto-refresh no
  pisa un borrador con cambios.

### Cambiado
- **Card "CALENDARI DEL REPTE" → "CALENDARI"** (`index.html`): eliminados los 4
  `<input type="date">`; sus funciones quedan integradas en la rejilla. Sin temática
  activa la rejilla sigue visible (solo consulta del histórico); se ocultan chips y
  botones. "Automatització" y "Desar calendari" se conservan tal cual.

## [0.1.15] — 2026-07-04 — Retocs Calendari + mòbil (feedback de la prova en Test)

> Petición (Pablo), tras probar 0.1.14 con Live Server en modo Test: el apagado de la
> automatización no desbloqueaba los toggles hasta pulsar "Desar calendari"; fechas del
> histórico amontonadas en escritorio y en formato americano; y en móvil, unificar la ✕
> de salir en las dos pantallas y aprovechar el ancho con las cards Controls + Vista i BD.

### Cambiado
- **Switch "Automatització" se guarda al instante** (`js/features/calendari.js`):
  `toggleCalAutomation()` ahora persiste solo `automation_enabled` (upsert) al pulsarlo,
  actualiza el estado local y (des)bloquea los toggles Pujada/Votació al momento — ya no
  hace falta "Desar calendari" para eso (las **fechas** sí se siguen desando con el botón).
  Al encenderlo aplica el calendario inmediatamente; si falla el guardado, revierte y avisa.
- **Històric de reptes**: fechas en formato `DD-MM-YY`, en una sola línea (`white-space:nowrap`)
  y celdas con `padding` — antes se amontonaban en escritorio. Los `<input type="date">` de la
  card siguen el formato del navegador (no es controlable desde la app).
- **Topbar admin en móvil**: botón "Sortir" → ✕ compacta, mismo patrón que el participant
  (`index.html`, `css/base.css`; solo CSS, sin JS).
- **Històric de reptes → tarjetas de Temàtiques**: eliminada la card "Històric de reptes" del
  dashboard (quedaba cargado); las fechas de cada reto (📤 pujada · 🗳️ votació, `dd-mm-aa`) se
  muestran ahora dentro de cada tarjeta de la pantalla Temàtiques (`renderCalendariHistoric()`
  → `getCalendariDatesHtml(objectiveId)` en `calendari.js`, usada por `tematiques.js`; estilo
  `.obj-dates` en `base.css`). El estado Obert/Tancat ya lo daba el badge propio de la temática.
- Descartado tras probarlo (iba a entrar en esta versión): cards Controls + Vista i BD lado a
  lado en móvil — el contenido no cabía; se quedan apiladas como antes.

### Arreglado
- **Participant real sin botón de salir en móvil** (`js/core/router.js`, `index.html`,
  `css/base.css`): el inline `display:none` sobre la ✕ ganaba al CSS del media query y el
  "Sortir" de texto lo oculta el CSS móvil → sin salida. Ahora para el participant normal
  manda el CSS (escritorio texto, móvil ✕); el caso admin⇄participant fuerza la ✕ con
  `display:flex` inline y se comporta igual que antes.

## [0.1.14] — 2026-07-03 — Calendari automatitzat de reptes (cron + sincronització toggles)

> Petición (Pablo): automatizar la apertura/cierre de subida y votación con un calendario de
> fechas por reto, aplicado por **pg_cron** en Supabase. Los toggles de pujada/votació deben
> **coincidir siempre** con el calendario (no descuadrarse). Versión **limpia sin snapshot**:
> los contadores participantes/votantes no se congelan (se recalculan de datos crudos, ADR-015).
> Además, pulido de la UI de la card: botones plásticos, tarjetas ajustadas y card BD solo en móvil.

### Añadido
- **Tabla `reptes_calendari`** (`sql/reptes_calendari.sql`): 4 fechas (`upload_start/end`,
  `voting_start/end`) + `automation_enabled` por reto. RLS abierta (clave anon), FK a `objectives`.
- **Función `fem_apply_calendar()` + cron `fem-calendar`** (pg_cron, diario 00:05 UTC): pone
  `uploads_enabled`/`voting_enabled` en `app_settings` según las fechas del reto activo y revela
  `names_revealed` al pasar `voting_end`. Idempotente.
- **`calendari.js` enganchado** (`js/screens/admin.js` lo importa y llama en
  `refreshAdminDashboard()`): `renderCalendariCard()` (editar 4 fechas + switch),
  `renderCalendariHistoric()` (histórico con estado Obert/Tancat derivado de las fechas),
  `saveCalendari()`.
- **`applyCalendarAutomation()`** (`js/features/calendari.js`): replica el motor en el front —
  si el reto activo tiene automatización ON, ajusta uploads/voting/names según la fecha (UTC) y
  lo **persiste sin esperar al cron**. `isCalendarAutomationActive()` para el bloqueo.
- **`toggleCalAutomation()`**: botón de plástico del switch de automatización.

### Cambiado
- **Toggles Pujada/Votació** (`js/core/router.js`, `js/screens/admin.js`): con automatización
  ON los manda el calendario y quedan **bloqueados** (clase `.locked`); `plasticPress` rechaza el
  cambio manual con toast. `applyCalendarAutomation()` se invoca en `showAdminScreen` y en el
  auto-refresh `_refreshUI`, antes de pintar los toggles.
- **UI de la card Calendari** (`index.html`, `css/admin.css`): switch "Automatització" +
  "Desar calendari" → botones `.plastic-btn` (mismo estilo que Pujada/Votació, iconos rayo y
  disquete); cards calendari/històric con `card-fit` (ancho ajustado al contenido).
- **Card "Vista i base de dades"** (`index.html`): clase `.only-mobile` → oculta en escritorio
  (los badges Admin ⇄ / NORMAL ya están en la topbar), visible en móvil.
- **`data.js`** (`loadAllData`): el select de `reptes_calendari` ya no pide columnas de snapshot.

### Notas / limitaciones
- **Sin snapshot**: la tabla no guarda `participants/voters/closed_at` (se recalculan de los
  datos crudos). El estado Obert/Tancat del histórico se deriva de `today > voting_end`.
- El **cierre/finalización de temática sigue manual** ("Finalitzar temàtica"): ni el cron ni el
  toggle acumulan al ranking general. Automatizarlo queda pendiente (la señal correcta es pasar
  `voting_end`, **no** `voting = false`).
- El bloqueo de toggles depende del estado **persistido**: tras apagar la automatización hay que
  "Desar calendari" para desbloquear pujada/votació.
- SQL aplicado de momento en proyecto **Test**; pendiente aplicarlo en **Normal**.

---

## [0.1.13] — 2026-07-02 — Progrés de votacions per votants + tancament unificat

> Petición (Pablo): el contador de progreso debe mostrar **cuántos socios han votado**,
> no cuántas fotos están completamente votadas (con muchos votantes la barra apenas se
> movía). Los que no suben foto también pueden votar y el admin que participa cuenta.
> Además: quitar el número de socio de las fotos y eliminar el botón "Tancar Votacions"
> del 100%, fusionando el revelado de nombres/ranking en el toggle de votación.

### Añadido
- **`getVotingProgress()`** (`js/core/data.js`): progreso por votantes de la temática
  activa. `voted` = socios que han **enviado votación definitiva**
  (`seguiment_votacio.es_esborrany === false`); `total` = participantes (subieron foto)
  ∪ los que enviaron; `pct = voted/total`.
- **`revealNamesAndRanking()`** (`js/screens/admin.js`): pone `namesRevealed = true` y
  re-renderiza los rankings (admin + participante). Reutilizable — la llamará el futuro
  calendario automatizado.
- **Contador de fotos** en la pestaña Fotos del admin (`index.html` `#admin-gallery-count`,
  `js/features/fotos.js`): "Total: N · Publicades: X · Pendents: Y" (ES/CA).

### Cambiado
- **Barra PROGRÉS VOTACIONS (participante)** (`js/screens/participant.js`): usa
  `getVotingProgress()` → muestra "voted/total votants" + %. Antes contaba fotos
  completamente votadas / total fotos (`requiredVotesPerPhoto = nº fotos − 1`).
- **Cierre de votación unificado** (`js/screens/admin.js`, `toggleVotingOpen`): al apagar
  el toggle de votación se revelan nombres y ranking (antes lo hacía el botón del 100%).
- **i18n** (`js/core/i18n.js`): `members_voted` "imatges votades/imágenes votadas" →
  "votants/votantes".

### Eliminado
- **Botón "Tancar Votacions"** del 100% (`index.html` `#btn-close-voting`, función
  `closeVoting()` y su `window.*` en `js/screens/admin.js`; import `confirmAction` que
  quedaba sin uso). El cierre se hace con el toggle, con el revelado fusionado.
- **Número de socio** en las fotos: pie "Participant #N" del grid de votación
  (`js/features/votacio.js`) y `#N` del overlay de la galería del admin
  (`js/features/fotos.js`, se conserva el icono ✅/⏳ de publicada/pendiente).

### Notas / limitaciones
- La barra de progreso **solo** se ve en la pantalla de participante; en el dashboard del
  admin los `admin-progress-*` siguen siendo placeholders ocultos (sin barra).
- Votar sin subir foto y que el admin cuente al participar ya funcionaban; no se tocó esa
  lógica.

---

## [0.1.12] — 2026-06-28 — Iteració de la Galeria (carrusel + filtres + repte actual)

> Petición (Pablo): iterar la galería según `Galeria de imagenes.md`. Card de portada
> como carrusel, comportamiento de los desplegables reto/autor, y que el admin vea el
> reto actual. Dato de dominio confirmado: **cada socio sube una sola foto por reto**.

### Añadido
- **Carrusel en la card GALERIA** de la pantalla principal (`index.html`,
  `css/participant.css`, `js/features/galeria.js`): capas `<img>` que se funden lento
  con brillo bajo (`brightness(.32)`, `transition opacity 1.5s`), con el label "GALERIA /
  Fotos dels reptes finalitzats" legible encima. `startGalleryCarousel()` /
  `stopGalleryCarousel()` son idempotentes (no parpadean con el auto-refresh) y limpian
  el `setInterval`. Se arrancan/paran desde `refreshParticipantDashboard()` y
  `_hideAllParticipantPanels()` (`js/screens/participant.js`).
- **Cards por reto** en la galería: nuevo contenedor `.gallery-objective-card`
  (`css/participant.css`) que agrupa la cabecera del reto + su rejilla de fotos.

### Cambiado
- **Desplegables reto/autor excluyentes** (`onGalleryFilterChange`): al elegir un valor
  concreto en uno, el otro vuelve a "Todos". Como hay 1 foto por reto/autor, nunca
  coinciden ambos concretos.
- **Render por casos** (`renderGallery`):
  - Por defecto / reto concreto → **cards por reto** (más nuevo arriba), dentro rejilla
    **alfabética por autor**; label de cada foto = autor.
  - Autor concreto → rejilla **cronológica** (nuevo→antiguo); label de cada foto =
    **nombre del reto**.
- **El admin ve el reto actual** (`getFinishedGalleryPhotos`, `_visibleObjectiveIds`):
  por **rol real** (`currentUser.role === 'admin'`, también en "veure com a participant"),
  la galería incluye el reto activo `state.currentObjective`. La fuente añade además las
  fotos **no publicadas** del reto actual (las subidas aún no publicadas). La card de
  galería se muestra al admin aunque no haya retos finalizados, si hay reto activo
  (`applyParticipantButtonVisibility`).

### Notas / limitaciones
- Durante la votación el admin verá el **autor** de las fotos del reto actual aunque no
  estén reveladas (decisión a confirmar si molesta).
- El carrusel de la card también incluye, para el admin, fotos del reto actual.
- El carrusel carga las imágenes a tamaño completo de Cloudinary (sin miniaturas): a
  vigilar rendimiento; pendiente optimizar si hace falta.
- La rama de cabeceras `.gallery-group-header` se reutiliza dentro de las cards.

---

## [0.1.11] — 2026-06-28 — "Resultat Repte" → App d'Enric a pantalla completa

> Petición (Pablo): que el botón **"RESULTAT REPTE"** abra directamente la App
> Resultats de Enric (como ya hacía "CLASSIFICACIÓ GENERAL"), embebida dentro de
> FEM y ocupando toda la ventana para que no se vea encogida.

### Cambiado
- **Botón "RESULTAT REPTE"** (`index.html`): de `showParticipantResultats()` (vista
  nativa con desplegable) a `openEmbedded('resultat')` — App de Enric en iframe con
  `?role=<rol>&view=resultat&embedded=true`. El rol se calcula solo desde el usuario.
- **Panel embebido a pantalla completa** (`css/participant.css`): el iframe pasa a
  ocupar toda la ventana (`100vw × 100dvh`, `position:fixed`) mediante la clase
  `body.embedded-fullscreen`, que pone `openEmbedded()` y quita
  `_hideAllParticipantPanels()` (`js/screens/participant.js`) al salir por cualquier vía.
- **Zoom del iframe** ajustable con la variable `--iframe-zoom` (por defecto `1.15`)
  vía `transform: scale` — parche para agrandar el contenido de Enric desde fuera.
- **Botón "← Tornar"** flotante sobre el iframe (margen izquierdo) y un poco más grande.

### Eliminado
- **Título duplicado** del panel embebido (`#embedded-title` en `index.html` + su
  asignación en `participant.js`): el título lo pinta la propia App de Enric dentro
  del iframe; nuestro `<h2>` blanco sobraba.
- **Controles flotantes** de FEM (usuario/idioma/salir) arriba a la derecha: se
  descartan por decisión de Pablo (queda más limpio; siguen en la página principal).

### Notas / limitaciones
- La vista nativa `showParticipantResultats()` / `onResultatsRepteChange()` y el panel
  `#participant-panel-resultats` quedan en el código **sin enlazar** (referencia).
- **Cross-origin**: no se pueden ajustar las fuentes internas de la App de Enric desde
  FEM; `--iframe-zoom` es la única palanca. La solución definitiva sería rehacer la
  pantalla nativa dentro de FEM en lugar de embeber.
- Posible barra de scroll horizontal mínima por `100vw` en Windows (a vigilar).

---

## [0.1.10] — 2026-06-27 — Despliegue como sitio estático (Netlify)

> Objetivo: publicar la app online. Es HTML/CSS/JS puro sin build, así que cualquier
> hosting estático sirve. Se decanta por **Netlify** (mismo hosting que la App Resultats
> de Enric) por ser gratis con repos privados.

### Añadido
- `vercel.json` — config para servir como estático en Vercel (`framework: null`, sin build).
  Se creó porque Vercel detectaba `server.js` y trataba el proyecto como Node. Se conserva
  por si en el futuro se usa Vercel.
- `netlify.toml` — config de Netlify: sitio estático servido desde la raíz (`publish = "."`,
  sin `command`). Cada `push` a `main` redespliega automáticamente.

### Eliminado (del repo, no del disco local)
- `server.js` e `Iniciar_FEM.bat` — eran el **arranque local de desarrollo** (servidor estático
  en `localhost`), no forman parte de la app desplegada. Se sacan del control de versiones con
  `git rm --cached` y se ignoran en `.gitignore`; siguen en el disco de Pablo para uso local.

### Notas
- **GitHub Pages descartado**: el repo es privado y Pages en privados requiere plan de pago.
- **Vercel descartado de momento**: empujaba al plan Pro (proyecto bajo organización/Team).

---

## [0.1.9] — 2026-06-27 — Reskin base: estilo de la App Resultats (Enric)

> Petición (Pablo): que toda la app adopte el estilo elegante de la web de Enric
> (tipografías y colores). Fase 1 ("base y vemos"): variables + fuentes. Pendiente
> afinar los colores hardcodeados (rgba/inline) en una segunda tanda.

### Cambiado
- **Tipografías** (`index.html` carga Google Fonts; variables en `css/base.css`):
  - Cuerpo `--font-body`: Inter → **Barlow**.
  - Nueva `--font-cond`: **Barlow Condensed**, aplicada a **botones** (`.btn`) y **labels**
    de formulario (`.form-group label`) — el uso condensado característico de Enric.
  - Títulos `--font-display`: **Bebas Neue** (ya se usaba; sin cambios).
- **Paleta** (`:root` de `css/base.css`) alineada con Enric, más sobria y mate:
  fondo `#091929`, superficies `#0d2137`/`#102748`/`#163254`, **bordes sólidos** `#1a3566`
  (antes azul translúcido brillante), apagado `#5b7aa8` (más tenue), acento `#4b8ef5`,
  oro `#f5a623`. Nueva variable `--gold`.
- **Fondo un poco más oscuro** (petición de Pablo): `--bg` `#091929` → `#06121e`, `--bg2` → `#08182a`,
  conservando el brillo radial y la textura (solo se baja la base, el glow sigue resaltando).
- Como la app usa variables CSS de forma consistente, el cambio se propaga a ~todas las pantallas.

### No cambiado (a propósito)
- **Fondo con brillo radial + textura de ruido**: se mantiene (decisión de Pablo).
- Colores **hardcodeados** (rgba en CSS y ~94 estilos inline del HTML): quedan para una 2ª tanda.

### Pendiente de verificación manual
- Revisar en navegador login, admin y participante: legibilidad del texto en Barlow, contraste
  del `--text-muted` más tenue, y que botones/labels en Barlow Condensed no queden apretados.

---

## [0.1.8] — 2026-06-27 — Resultados: Classificació General (Enric embebida) + Resultat Repte nativo

> Implementa el **Documento 2 de Enric** (`enric_Integracio-Botons-Reptes.md`). Complementa la
> persistencia de sesión del Documento 1 (ya en 0.1.4), que pasa el rol a la App Resultats.

### Verificado (cambió respecto al bloqueo de 0.1.4)
- La web de Enric **ya lee los parámetros de URL**. La URL buena es la **raíz**
  `https://fem-reptes.netlify.app/` (la `FEM-Resultat_Ranquing.html` de los documentos da **404**).
  <!-- → movida a Vercel: https://fem-resultats.vercel.app/ (v0.1.19) -->
  - `role` → `admin` ve todos los retos; `participant`/sin sesión solo los finalizados.
  - `view=resultats` → resultados del reto · `view=classificacio` → ranking acumulado (`switchToGeneral`).
  - `embedded=true` → su CSS `body.embedded` **oculta su topbar/título/controles** (no se duplican).

### Añadido — Classificació General (Enric, embebida)
- **Panel embebido** `participant-panel-embedded` dentro de `screen-participant` (así la topbar
  y la bottom-nav nuestras **siguen visibles**): un `<iframe id="iframe-resultats">` + botón "← Tornar".
- Funciones `openEmbedded(view)` / `closeEmbedded()` en `js/screens/participant.js` (expuestas en
  `window`). Construyen la URL `…/?role=&view=&embedded=true` con el rol de `state.currentUser`
  (o `participant` por defecto). `closeEmbedded()` vacía el `src` del iframe y vuelve a la home.
- Clave i18n `embedded_back` (CA "← Tornar" / ES "← Volver").
- Enlazan a Enric: `nav-card-classificacio` (home) y `bnav-rank` (🏆 Ranking, bottom-nav móvil),
  ambos con `openEmbedded('classificacio')`.

### Añadido — Resultat Repte (NATIVO, sin iframe)
> Motivo: el modo `embedded` de Enric oculta su selector de retos (`#repteSelect` está en
> `.controls-row`, que su CSS esconde). En vez de depender de un cambio en su web, se reconstruye
> la vista de resultados por reto con el motor de cálculo que la app **ya tenía**.
- `nav-card-resultats` (home) → `showParticipantResultats()` (vista propia, no Enric).
- Nuevo panel `participant-panel-resultats`: **desplegable de retos** (reciente→antiguo)
  + ranking **detallado por criterios** (Creativitat / Composició / Temàtica + nota total).
- **Diferenciado por tipo de cuenta (rol real)**: el **admin** ve **todos** los retos en el
  desplegable (incluido el actual y los inactivos); el **participante**, solo los **finalizados**.
  Misma regla que la App Resultats de Enric. Implica que el admin también los ve en modo
  "veure com a participant" (excepción consciente a la réplica exacta del socio).
- **Reto no finalizado muestra las fotos subidas aunque no estén publicadas**: en un reto
  finalizado el ranking solo incluye las fotos que concursaron (`publishedPhotos`); en el reto
  actual/inactivo (que solo ve el admin) incluye también las **no publicadas** (`state.photos`),
  para que el admin vea el estado real. `getPhotoScoreBreakdown` ahora localiza la foto en ambas
  listas. (Sin fuga de anonimato: solo el admin ve retos no finalizados.)
- En `js/features/ranking.js`:
  - `getPhotoScoreBreakdown(photoId)` → `{ creativity, theme, composition, final }`. `getPhotoScore`
    pasa a delegar en ella (mismo resultado, sin cambiar comportamiento).
  - `computeRankingForObjective(objId)` y `renderResultatsRepte(objId, listId)`. Usa el **nombre real**
    del autor (retos finalizados no son anónimos, como la galería).
- `showParticipantResultats()` / `onResultatsRepteChange()` en `participant.js` (en `window`).
- CSS `.rank-criteria` en `css/base.css` (fila fina con las 3 notas, responsive).
- **Visibilidad**: la card "Resultat Repte" pasa a estar **siempre visible** (antes solo con reto
  activo y nombres revelados). Si aún no hay retos finalizados, muestra aviso y oculta el desplegable.
  Sigue respetando el override de admin `force_hide_resultats`.

### No cambiado (a propósito)
- El **cálculo de puntuación** y la vista interna antigua (`showParticipantClassificacio`, panel
  `participant-panel-ranking` con pestañas) **se conservan** sin enlazar. Reversible.

### Pendiente de verificación manual
- En navegador (HTTP, no `file://`):
  - **Resultat Repte**: el desplegable lista los retos finalizados; al cambiarlo se actualiza el
    ranking con las notas por criterio y la nota total; sin finalizados, sale el aviso.
  - **Classificació General** y **🏆 Ranking** (móvil): cargan la web de Enric sin su topbar
    (embedded) y "← Tornar" vuelve a la home. Como admin se ven todos los retos; como participante,
    solo finalizados. Recargar (F5) dentro: la sesión se mantiene.

---

## [0.1.7] — 2026-06-27 — Galería histórica de retos finalizados

> Petición (origen Enric): poder revisar todas las fotos de retos ya cerrados,
> también para las reuniones de valoración del club. Acceso desde el participante.

### Añadido
- **Pantalla/panel Galería** para participantes (el admin entra con "veure com a
  participant"): muestra **solo** fotos de temáticas finalizadas (`status: 'finished'`),
  con el **nombre del autor**. Nuevo módulo `js/features/galeria.js`.
- **Tarjeta GALERIA** colocada **al lado de la card "La meva foto"** (50/50 en escritorio,
  apiladas en móvil). Visible solo si hay algún reto finalizado.
- **Dos filtros** (desplegables) con agrupación en cabeceras ("box fino"):
  - Reto: "tots els reptes" → agrupa por reto (cronológico, reciente→antiguo).
  - Reto concreto + "tots els autors" → agrupa por autor (alfabético).
  - Ambos concretos → cuadrícula directa.
- En el **visor a pantalla completa** se añade el **nombre del autor** debajo (fuente Arial),
  **solo cuando se abre desde la galería** (el autor se pasa en la lista de fotos). En la
  votación las fotos siguen **anónimas**. Reutiliza el zoom/swipe/teclado ya existentes.
- Textos CA/ES de la galería en `js/core/i18n.js`.

### Eliminado
- Botón **"Veure Fotos"** y el **mosaico embebido** del reto actual (HTML, funciones JS
  `togglePhotoMosaic`/`renderPhotoMosaic`/`getMosaicPhotosList`/`openMosaicLightbox` e imports
  huérfanos). Su función queda cubierta por la nueva galería.

### Pendiente de verificación manual
- Probar en navegador con una temática finalizada y fotos publicadas: filtros, agrupación,
  visor con autor, y el reparto foto/galería en escritorio y móvil.

---

## [0.1.6] — 2026-06-27 — Modo Test aislado: carpeta Cloudinary propia + auto-login + sello visual

> Objetivo: poder trastear en la BD de pruebas con tranquilidad, sin ensuciar producción
> ni teclear login cada vez, y sabiendo siempre de un vistazo que estás en Test.

### Añadido
- **Carpeta Cloudinary separada para Test** (`js/features/fotos.js`): en modo test las fotos
  suben a `FemReptes_TEST/<temàtica>` en vez de `FemReptes/<temàtica>`. Antes ambas BD
  compartían carpeta (los registros iban a la BD test, pero los archivos al mismo Cloudinary).
  No requiere tocar el panel de Cloudinary (el preset ya acepta el parámetro `folder`);
  la carpeta se crea sola al subir la primera foto en test.
- **Auto-login al ir a Test** (`js/core/config.js` `switchDbMode` + `enterAsEmail` en
  `js/screens/login.js`): al cambiar a test ya no pide usuario/contraseña; reentra con el
  **mismo email** en la BD de test (sin guardar contraseñas). Si ese email no existe en test,
  cae al login normal. **Volver a Normal (producción) sigue pidiendo login** por seguridad.
- **Sello "TEST"** (`index.html` `#test-stamp` + `css/base.css`): estampado rojo fijo abajo a la
  derecha, visible solo en modo test (`_updateTestStamp()`), `pointer-events:none` para no
  estorbar clics. Se actualiza en boot, al cambiar de BD y al renderizar el panel admin.

### Notas
- Para que el auto-login funcione, el **mismo email** debe existir en ambos proyectos Supabase.
- El sentido Test→Normal es intencionadamente más estricto (login) por entrar en producción.

---

## [0.1.5] — 2026-06-27 — Título/descripción opcional en las fotos

> Petición de Enric: que el autor pueda dar una orientación de qué quiere transmitir con su foto.

### ⚠️ REQUIERE cambio en Supabase (ejecutar ANTES de usar)
```sql
ALTER TABLE photo_submissions ADD COLUMN caption text;
```
Sin esta columna, `loadAllData()` falla (pide `caption` en el SELECT) y la app no carga datos.

### Añadido
- Campo de texto **opcional** (un único cuadro título/descripción, máx. 300 caracteres) en la
  pantalla de subir foto, tanto para socio como para admin (`index.html`).
- Traducciones CA/ES (`caption_label`, `caption_placeholder`) en `js/core/i18n.js`.
- El texto se guarda en `photo_submissions.caption` al subir (`js/features/fotos.js`) y se carga
  en `state` (`js/core/data.js`, campo `caption`).
- Se muestra en el **visor a pantalla completa** (lightbox): el visor busca el texto por la URL
  de la foto (`js/ui/lightbox.js`), así no hubo que tocar las llamadas que abren el visor.

### Notas
- Decisión (Pablo): se muestra **solo al ver la foto en grande**, no en la cuadrícula de votación
  (en móvil las fotos se ven pequeñas). Matiz: si se amplía una foto **durante** la votación, el
  texto también aparece; si en algún caso quisiera transmitir identidad, rompería el anonimato.
  Es opcional y responsabilidad del autor; ajustable si se quiere ocultar durante la votación.

---

## [0.1.4] — 2026-06-27 — Persistencia de sesión (no re-login al refrescar)

> Adaptación a la versión modular del **Documento 1 de Enric**
> (`Enric_Integracio-Reptes-Resultats.md`).

### Añadido
- Persistencia de sesión con `sessionStorage` en `js/screens/login.js`:
  - Helpers `saveSession()` / `readSession()` / `clearSession()` (guardan solo `id, name, role`;
    nunca la contraseña).
  - `init()` restaura la sesión al arrancar: si hay sesión válida, entra directo a la pantalla
    (admin o participante) sin pasar por el login. Busca el usuario completo en `state.users`
    (datos frescos de Supabase), así que un cambio de rol se refleja al recargar.
  - Se guarda la sesión al hacer login, al crear contraseña nueva (reset) y al registrarse.
  - Se borra al hacer `logout()` (y por tanto también al cambiar de BD Normal/Test y al darse de baja).

### Notas
- `sessionStorage` se borra al cerrar la pestaña (comportamiento buscado para una app de club).
- Todo va envuelto en `try/catch` por si el navegador bloquea el almacenamiento (modo privado):
  si falla, simplemente no persiste y se comporta como antes.

### Pendiente — Documento 2 de Enric (botón "Resultats" → web de Enric embebida)
- URL de la app de Enric: **https://fem-reptes.netlify.app/** (Netlify; la app vive en la raíz `/`,
  NO en `FEM-Resultat_Ranquing.html`, que da 404).
  <!-- → movida a Vercel: https://fem-resultats.vercel.app/ (v0.1.19) -->
- El iframe es técnicamente posible (su servidor **no** envía `X-Frame-Options` ni CSP que lo bloqueen).
- **BLOQUEO funcional:** la versión desplegada **no lee** los parámetros que prometía el documento:
  no usa `role` (no filtra por rol), ni `view` (no abre directo en resultats/classificacio; navega
  con sus botones internos), ni `embedded=true` (no oculta su barra superior → se vería duplicada).
- **Decisión (Pablo):** un único botón **"Resultats/Resultados"** (según idioma) que muestre la web
  de Enric embebida tapando su barra superior. A la espera de que **Enric actualice su web** (o pase
  su código para integrarlo aquí). Hasta entonces, NO se tocan los botones del ranking.

---

## [0.1.3] — 2026-06-27 — "Veure com a participant" ahora es réplica exacta del participante

### Añadido
- Helper `actingAsAdmin()` en `js/core/state.js`: devuelve `true` solo si el usuario es admin
  **y NO** está en modo "veure com a participant". Es la nueva regla central para decidir si
  la vista debe comportarse como admin o como socio.

### Arreglado
- Cuando un admin pulsaba "veure com a participant", la pantalla se veía como la del socio pero
  las funciones seguían tratándolo como admin. Ahora la experiencia es **idéntica** a la de un
  participante real. Se reemplazó `currentUser.role === 'admin'` por `actingAsAdmin()` en los
  6 puntos que afectan a la vista participante:
  - `screens/participant.js` — visibilidad de las nav-cards (Votar/Resultats/Classificació).
  - `features/ranking.js` — el ranking de la temàtica respeta el candado hasta revelar noms.
  - `features/fotos.js` — sección de subida respeta `force_hide_upload` y subida cerrada; y el
    refresco tras subir/borrar foto actualiza la pantalla correcta.
  - `ui/lightbox.js` — el botón de descarga solo aparece en modo admin real.
  - `core/router.js` — el auto-refresco (polling) actualiza la pantalla visible correcta.

### No cambiado (a propósito)
- El rol **real** se sigue usando donde toca: login (a qué pantalla ir), gestión de socios,
  lógica del toggle admin↔participant y texto del badge. El nombre/foto del admin en modo
  participante siguen siendo los suyos (es identidad, no función).

### Pendiente de verificación manual
- Probar en navegador: como admin, entrar en "veure com a participant" y comprobar que botones,
  ranking (candado), subida de foto y descargas se comportan igual que para un socio normal.

---

## [0.1.2] — 2026-06-26 — Lanzador local (arregla el "login no reacciona")

### Añadido
- `server.js` — mini-servidor estático Node (sin dependencias) que sirve la carpeta por HTTP
  con los Content-Type correctos. Crítico: `.js` → `text/javascript` (lo exigen los módulos ES).
  Bloquea path traversal y prueba puertos consecutivos si el 8000 está ocupado.
- `Iniciar_FEM.bat` — doble clic: arranca `node server.js` y abre el navegador en
  `http://localhost:8000`. Recupera el flujo "doble clic" sirviendo por HTTP.
- Aviso anti-`file://` en `index.html` (script normal, no module): si se abre por doble clic,
  muestra instrucciones para usar `Iniciar_FEM.bat` en vez de dejar los botones muertos.

### Arreglado
- "El login no reacciona": se servía por `file://` y el navegador bloqueaba los módulos ES.
  Ahora, con el lanzador, la app carga por HTTP y el botón ENTRAR responde. **No se tocó la
  lógica del login.** Verificado: `server.js` devuelve `text/javascript` para `js/main.js`,
  `text/css` para el CSS y 404 para rutas inexistentes.

### Pendiente de verificación manual
- Smoke-test end-to-end en navegador con Supabase real (login admin/participante, votar, ranking).

---

## [0.1.1] — 2026-06-26 — CLAUDE.md descriptivo + diagnóstico del login

### Cambiado
- `CLAUDE.md` reescrito al formato de la plantilla `AGENTS.md` (Stack, Comandos, Estructura,
  Convenciones, No hagas, Flujo de trabajo, Documentación). Pasa de ser un plan de desglose a
  un **documento descriptivo de la app** (qué es, para qué sirve, cómo está organizada).

### Diagnosticado (pendiente de arreglar — tarea aparte)
- Bug "el login no reacciona": **no es un bug de código**. Causa = abrir `index.html` por
  `file://` (doble clic); el navegador bloquea los módulos ES, `main.js` no arranca y los
  `onclick` quedan muertos. Verificado que sintaxis, imports/exports y `window.*` están OK.
  Solución prevista: lanzador local (`.bat` + mini-servidor Node) que sirva por HTTP.

---

## [0.1.0] — 2026-06-13 — Desglose del monolito a estructura modular

### Añadido
- Estructura modular a partir de `Test/Index_60.html` (monolito, 5.706 líneas):
  - `index.html` (núcleo) + `css/` (base, login, admin, participant) + `js/` con
    `core/` (state, config, i18n, data, router), `ui/` (toast, modals, lightbox),
    `features/` (ranking, votacio, fotos, socis, tematiques) y `screens/` (login, admin,
    participant), orquestado por `js/main.js`.
- Patrón de carga: módulos ES con `import/export` para dependencias internas y
  `window.*` para las funciones llamadas desde `onclick` del HTML.

### Cambiado (mínimos, sin tocar lógica)
- `_hasUnsavedVotes` → `window._hasUnsavedVotes` (se reasigna entre módulos; los `import`
  de ES son de solo lectura).
- Botón de descarga del lightbox: usa `downloadCurrentFullscreen()` en lugar de la global
  `_fullscreenFileName` (ahora de ámbito de módulo).
- El JS se sirve como `<script type="module" src="js/main.js">`.

### Verificado
- Validación estática: sintaxis ESM (`node --check`), resolución de `import/export`,
  cobertura `onclick`→`window` y ausencia de llamadas cruzadas huérfanas. Todo OK.
- **Prueba en navegador (2026-06-13): el login reacciona correctamente** al servir la app
  por HTTP con un servidor local (`python -m http.server 8000`). La app carga y responde.

### Nota de desarrollo
- Abrir con doble clic (`file://`) **no funciona**: el navegador bloquea los módulos ES por
  política de mismo origen (CORS). En local hay que servir por HTTP (Live Server de VS Code,
  `python -m http.server` o `npx serve`). En Vercel funciona directo, sin cambios.

### Pendiente
- Copiar `manifest.json` y `sw.js` desde la raíz de producción (PWA) cuando se despliegue.
- Smoke-test completo comparando contra el monolito (subir/publicar foto, votar + enviar,
  ranking, finalitzar temàtica, socis, CA/ES, lightbox/zoom, modo Normal/Test).
