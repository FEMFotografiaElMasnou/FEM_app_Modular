# FEM VOTACIONS — App de votación fotográfica (versión modular)

App web para el club **FEM Fotografia El Masnou** (~50 socios). Cada temática, los socios
suben una foto, votan las del resto (creatividad, temática, composición) y la app calcula un
ranking por temática y un ranking general acumulado. Esta carpeta (`FEM_app_Modular/`) es la
versión **modular** del antiguo monolito `Index_60.html`: misma funcionalidad, repartida en
módulos por pantalla y por función.

## Stack
- Lenguaje: HTML + CSS + **JavaScript con módulos ES nativos** (`import`/`export`). Sin framework.
- Runtime / build: **ninguno** — no hay build step ni bundler. El navegador carga los módulos tal cual.
- Base de datos: **Supabase** (Postgres + API REST/JS). La seguridad real recae en las RLS, no en ocultar la clave anon.
- Imágenes: **Cloudinary** (cloud `dz1n0g9yg`, preset `Fem_Apps`).
- Hosting: **Netlify** (sitio estático, `netlify.toml`; redeploy automático al hacer push a `main`). Repo privado, por eso no GitHub Pages. `vercel.json` se conserva por si se vuelve a Vercel.
- Modo BD: conmutable **Normal / Test** (dos proyectos Supabase), persistido en `localStorage`.

## Comandos
- **Servir en local** — los módulos ES **no funcionan por `file://`** (doble clic), hace falta HTTP:
  - VS Code → extensión **Live Server** → clic derecho en `index.html` → "Open with Live Server".
  - o terminal en esta carpeta: `npx serve` · `python -m http.server 8000` · `node server.js` (si existe el lanzador).
- **Validar un módulo** — `node --check js/ruta/al/modulo.js` (solo sintaxis, no resuelve imports).
- **Desplegar** — push a Vercel; sirve los archivos tal cual, sin cambios respecto al monolito.

## Estructura del proyecto
- `index.html` — núcleo: contenedores de pantalla (login/admin/participant) + modales. Carga `js/main.js` como módulo.
- `css/` — `base.css` (variables, reset, layout), `login.css`, `admin.css`, `participant.css`.
- `js/main.js` — punto de entrada: importa todo el grafo, ata listeners globales y arranca `init()`.
- `js/core/` — `state` (fuente única de verdad), `config` (cliente Supabase + Cloudinary + modo BD),
  `i18n` (traducciones CA/ES), `data` (`loadAllData` y guardado en Supabase), `router` (pantallas, nav, auto-refresh).
- `js/ui/` — `toast` (loader + avisos), `modals` (abrir/cerrar/confirmar), `lightbox` (zoom, swipe, descarga).
- `js/features/` — `ranking`, `votacio`, `fotos`, `socis`, `tematiques`.
- `js/screens/` — `login`, `admin`, `participant` (orquestan las features).
- Referencia histórica (NO tocar): monolito `Test/Index_60.html` (5.706 líneas), origen del desglose.

## Convenciones
- **`onclick` → `window.*`**: las funciones llamadas desde `onclick=` del HTML se exponen en `window`
  (ej. `window.handleLogin = handleLogin`). Entre módulos, las dependencias van por `import/export`.
- **`state` es la única fuente de verdad** (`js/core/state.js`). Los módulos lo importan, no duplican estado.
  `_hasUnsavedVotes` vive en `window` porque se reasigna entre módulos.
- **Roles**: `admin` (temáticas, socios, publicar fotos, abrir/cerrar votación, modo BD) y `participant` (subir foto, votar, ranking).
- **i18n**: todo texto visible pasa por `t(key)` / `data-i18n`; idiomas catalán (`ca`, por defecto) y castellano (`es`).
- **Comportamiento idéntico al monolito**: modularizar ≠ refactorizar lógica. Conservar nombres de funciones.

## No hagas
- No abrir la app por **`file://`** (doble clic): el navegador bloquea los módulos ES y nada reacciona. Servir siempre por HTTP.
- No tocar el monolito **`Index_60.html`**: es la referencia, se conserva intacto.
- No **mezclar** modularización con cambios de lógica: si ves un bug, anótalo y arréglalo en una tarea aparte.
- No **borrar nada de Supabase desde el frontend** (ADR-015). El cliente no elimina datos del servidor.
- No subir claves sensibles más allá de la anon de Supabase (diseñada para ir en el cliente).

## Flujo de trabajo
- **Revisa SIEMPRE bien el código antes de cambiar nada**: lee las funciones implicadas y quién
  las llama, para no romper lo que ya funciona. Si algo no cuadra o detectas un riesgo, **avísale a Pablo**.
- Antes de una tarea no trivial, propón un plan y espera el OK de Pablo.
- Una tarea (un deber) a la vez; al terminar, di qué cambiaste para revisarlo. No juntar deberes distintos.
- Si no estás seguro al 80%, pregunta. No inventes.
- Tras tocar un módulo, valida sintaxis y prueba con servidor local antes de dar la iteración por buena.

## Documentación
- **RAG del producto** (fuente de verdad funcional, fuera de esta carpeta):
  `D:\Mis proyectos\FEM_Reptes\Instrucciones\Archivos MD\...` → `PRD.MD`, `Components.MD`, `Decisions.MD` (ADRs), `Changelog.MD`, `Setup.MD`.
  Antes de tocar lógica, releer `Components.MD` y `Decisions.MD`.
- **Changelog de la modularización**: `CHANGELOG.md` (en esta carpeta).
- **Integraciones de Enric (YA aplicadas)**: `Enric_Integracio-Reptes-Resultats.md` (persistencia de sesión, v0.1.4) y `enric_Integracio-Botons-Reptes.md` (App Resultats embebida, v0.1.8). La App Resultats vive en la **raíz** `https://fem-reptes.netlify.app/` y lee `?role=&view=&embedded=true`.
- **Decisión de arquitectura**: módulos ES por pantalla + puente `window.*` para `onclick`. Al cerrar la fase, actualizar ADR-001.
