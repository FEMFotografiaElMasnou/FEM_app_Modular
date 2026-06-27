# Changelog — FEM VOTACIONS (versión modular)

Registro cronológico del desglose del monolito a estructura modular.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Fechas `YYYY-MM-DD`.

> Este changelog cubre **solo la modularización** (carpeta `FEM_app_Modular/`).
> El histórico funcional del producto vive en `Instrucciones/Archivos MD/.../Changelog.MD`.

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
