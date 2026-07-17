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
- Hosting: **Vercel** (sitio estático, `vercel.json`). Repo público en GitHub:
  `https://github.com/FEMFotografiaElMasnou/FEM_app_Modular`. Proyecto Vercel:
  `https://vercel.com/femfotografiaiapps/fem-app/`, vinculado al dominio
  `https://www.femfotografiaelmasnou.cat`. El deploy a Vercel se dispara
  **automáticamente** con cada push a GitHub — ya NO hace falta el
  `git pull && npx vercel --prod` manual (actualizado 2026-07-13; la limitación
  del plan Hobby con colaboradores externos que motivaba el paso manual ya no
  aplica / no se reproduce en la práctica). `netlify.toml` eliminado (2026-07-09), ya no se usa Netlify.
- Modo BD: conmutable **Normal / Test** (dos proyectos Supabase), persistido en `localStorage`.

## Comandos
- **Servir en local** — los módulos ES **no funcionan por `file://`** (doble clic), hace falta HTTP:
  - VS Code → extensión **Live Server** → clic derecho en `index.html` → "Open with Live Server".
  - o terminal en esta carpeta: `npx serve` · `python -m http.server 8000` · `node server.js` (si existe el lanzador).
- **Validar un módulo** — `node --check js/ruta/al/modulo.js` (solo sintaxis, no resuelve imports).
- **Desplegar** — `git push` a GitHub; Vercel despliega automáticamente el sitio
  (vinculado a `https://www.femfotografiaelmasnou.cat`), sirviendo los archivos
  tal cual, sin cambios respecto al monolito. No hace falta ningún comando de
  Vercel manual.

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
- **Integraciones de Enric (YA aplicadas)**: `Enric_Integracio-Reptes-Resultats.md` (persistencia de sesión, v0.1.4) y `enric_Integracio-Botons-Reptes.md` (App Resultats embebida, v0.1.8). La App Resultats vive en la **raíz** `https://fem-resultats.vercel.app/` (antes en Netlify; movida a Vercel el 2026-07-07) y lee `?role=&view=&embedded=true`.
- **Decisión de arquitectura**: módulos ES por pantalla + puente `window.*` para `onclick`. Al cerrar la fase, actualizar ADR-001.

## Pla — Revisió de l'admin i suport multi-repte (en curs, 2026-07-17)

> Origen: revisió de l'apartat admin demanada per Pablo (Panell de Control i Reptes).
> Abans de tocar res d'aquest pla, **llegir aquesta secció sencera i el codi implicat**
> (és el mateix criteri que "Flujo de trabajo" de dalt: revisar bé abans de canviar).

### Punt de partida important
Els commits `f341dc8` i `043abc8` (targeta Repte+Foto unificada, targeta Votar amb
mosaic) van preparar la **UI** perquè cada repte tingui un bloc autocontingut, però
el motor de dades segueix essent d'**un sol repte actiu** arreu:
- `state.currentObjective` és singular.
- `saveObjective()` (tematiques.js) bloqueja crear un repte si ja n'hi ha un actiu o
  no finalitzat.
- `uploads_enabled` / `voting_enabled` / `namesRevealed` són flags **globals** a
  `app_settings`, no per repte.
- El cron `fem_apply_calendar()` (Supabase) escull `where status='active' limit 1`.

La taula `reptes_calendari` és l'excepció: ja guarda les 4 dates per `objective_id`,
i és la base de les fases 2/3 de sota.

### Decisions preses (Pablo, 2026-07-17)
1. **Estat del repte**: es manté com a badge de lectura (actiu/finalitzat), lligat
   únicament al botó "Finalitzar" — NO es converteix en un desplegable editable.
2. **Calendari per repte**: opció simple — `<input type="date">` natius (4 per
   repte, amb icona que obre el picker del navegador), NO es replica la graella
   visual mensual actual un cop per repte.
3. **Multi-repte actiu**: es desbloqueja. Ha d'existir la possibilitat de tenir
   més d'un repte amb `status='active'` alhora.
4. **Accés a votar**: no és un botó nou dins la targeta — el parell existent
   `card-objective-photo` ↔ `vote-mosaic-section` (que ja se substitueixen l'un a
   l'altre segons `voting_enabled`) es repetirà sencer, un cop per repte actiu.
5. **Calendari automàtic vs. masters manuals — REVISAT 2026-07-18** (substitueix
   el disseny de "botó de plàstic + `automation_enabled`" de la Fase 2): a cada
   targeta de repte, un desplegable **per fase** (un per Pujada, un per
   Votació) amb 3 estats: `Calendari` (segueix les dates), `Obert` (forçat,
   per davant del calendari), `Tancat` (forçat, per davant del calendari).
   `automation_enabled` (un sol switch per repte, Fase 2) queda **substituït**
   per aquests dos camps independents (`upload_mode`/`voting_mode`), un per
   fase — ja no té sentit un únic interruptor que taps totes dues finestres
   alhora. Color del desplegable: `Calendari` en el color neutre del text,
   `Obert` en verd, `Tancat` en vermell — indica el MODE triat, no si avui
   està realment obert (per això hi ha el comptador de fotos/vots al costat).
   Pendent de valorar més endavant una manera més visual de mostrar l'estat
   (icones, badges...); de moment surt amb el canvi de color del text.
   Implicació tècnica per la Fase 4/5: `upload_mode`/`voting_mode` (valors
   `calendari`/`obert`/`tancat`) aniran a `reptes_calendari` (substituint
   `automation_enabled`); `objectives.uploads_enabled`/`voting_enabled`
   (Fase 2) es mantenen com "l'estat efectiu resultant" que llegeix la resta
   de l'app — si el mode és `calendari` es calculen de les dates com ara; si
   és `obert`/`tancat` es forcen, independentment de l'altra fase i del
   calendari.
6. **Pujada tancada amb foto ja pujada**: el botó "Eliminar i Tornar a Pujar" i
   el peu de foto es veuen sempre, però queden `disabled` quan `uploads_enabled`
   és `false` — no s'amaguen. Editar el peu de foto va lligat a la mateixa
   acció que pujar/canviar foto (mateix flag, `uploads_enabled`).

### Fases
0. ~~Simplificar "Progrés de votacions" → "Votacions rebudes: n"~~ **FET (v0.1.28)**,
   dins del Panell de Control. Transitori: quan es faci la Fase 4, aquesta
   informació es mourà dins de cada targeta de repte i la card global desapareixerà.
1. Deixar els botons "Controls" i "Calendari" on són (sense tocar) fins que les
   fases de sota estiguin fetes.
2. ~~**BD (Supabase, Normal i Test)** + masters per repte~~ **FET (v0.1.29)**.
   Descoberta clau abans de fer-ho: `objectives.uploads_enabled`/`voting_enabled`
   ja existien a la BD però eren lletra morta (ningú els llegia) — la feina real
   ha estat: afegir `objectives.names_revealed`, reescriure `fem_apply_calendar()`
   perquè iteri tots els reptes actius amb automatització ON (abans `limit 1`) i
   escrigui cadascun al seu propi repte (no a `app_settings`), treure el
   bloqueig de `saveObjective()` que impedia >1 repte `active`, i connectar els
   masters (`toggleUpload`/`toggleVotingOpen`, `admin.js`) i el calendari
   (`applyCalendarAutomation`, `calendari.js`) perquè llegeixin/escriguin el
   repte actiu en lloc dels flags globals d'`app_settings` (que es mantenen com
   a mirall a `state.settings` perquè `participant.js`/`votacio.js`/`fotos.js`/
   `router.js`/`ranking.js` no calgui tocar-los encara). Els masters ja no es
   bloquegen quan el calendari mana: un clic manual sempre funciona i
   desactiva l'automatització d'aquell repte de forma permanent (decisió #5
   de dalt). SQL a aplicar (pendent que ho facis tu a Supabase, Normal i
   Test): `sql/reptes_calendari_fase2.sql`.
   **Avís vigent**: crear un 2n repte actiu ja no peta, però la UI encara
   només gestiona el primer que troba — no crear-ne un de veritat fins la
   Fase 4/6.
3. **Nucli JS (llista de reptes actius)** — `getActiveObjectiveId()`,
   `getActivePublishedPhotos()`, `getActiveVotes()`, `getVotingProgress()`
   (`core/data.js`) i `getActiveCalendar()`/`applyCalendarAutomation()`/
   `toggleCalAutomation()`/`saveCalendari()` (`features/calendari.js`) passen a
   acceptar un `objectiveId` explícit en lloc de mirar sempre l'únic repte
   "actiu" global (`state.currentObjective`, que continua sent singular i
   agafant només el primer actiu que troba).
4. **UI admin — targeta de repte** (`tematiques.js` `renderObjectivesList()` +
   `admin.css`): disseny de 2 files (Fila 1: nom/descripció + masters
   pujada/votació amb comptador + estat; Fila 2: 4 dates amb `<input type="date">`
   + icona). Aquí es retiren del Panell de Control les cards "Controls" i
   "Calendari" (es fa efectiu el punt 1). Els masters de la Fila 1 ja NO són
   els botons de plàstic actuals: són **dos desplegables** (Pujada / Votació),
   3 estats cada un (`Calendari`/`Obert`/`Tancat`) — decisió revisada del punt 5
   de dalt.
5. **Migrar `automation_enabled` → `upload_mode`/`voting_mode`** (SQL:
   `reptes_calendari`, substitueix la columna única per dues amb 3 valors;
   `admin.js`/`calendari.js`: `isCalendarAutomationActive()`/`syncPlasticButtons()`/
   `plasticPress()`/`disableAutomationForActiveObjective()` de la Fase 2 es
   reescriuen per als dos desplegables per fase, un per targeta de repte
   (avui n'hi ha un de sol per a tota la pantalla).
6. **Costat participant** (`index.html` hero-grid, `fotos.js`
   `updateUploadSection()`): repetir la parella `card-objective-photo` ↔
   `vote-mosaic-section` un cop per repte actiu; `showParticipantVoting()` rebent
   `objectiveId`. Depèn de 3. Candidata a tractar-se com a tasca separada un cop
   tancat l'admin.
7. Verificació manual (2 reptes actius simultanis, calendaris independents,
   galeria/ranking sense barrejar-se) + actualitzar aquest changelog i el SQL.

Ordre: 0 fet → 1 (sense acció) → 2 fet → 3 → 4 → 5 → (6 a decidir quan) → 7.
Cada fase és una tasca a part (una a la vegada, com marca "Flujo de trabajo").
