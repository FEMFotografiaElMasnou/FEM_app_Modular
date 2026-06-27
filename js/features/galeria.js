// ═══════════════════════════════════
// GALERIA HISTÒRICA — fotos de reptes finalitzats, amb filtres repte/autor
// ═══════════════════════════════════
// Mostra només fotos de temàtiques amb status 'finished'. Visible per als socis
// (l'admin hi accedeix amb "veure com a participant"). El visor a pantalla
// completa (lightbox) es reutilitza tal qual; aquí només construïm la llista.
import { state } from '../core/state.js';
import { currentLang, t } from '../core/i18n.js';
import { openFullscreen } from '../ui/lightbox.js';

// Estat dels filtres (àmbit de mòdul). 'all' = tots.
let _galFilterObj    = 'all';
let _galFilterAuthor = 'all';

// Data d'un repte per ordenar cronològicament (tancament > inici > id)
function _objDate(obj) {
  return obj.end_date || obj.start_date || '';
}

// Nom de l'autor a partir del seu id
function _authorName(userId) {
  const u = state.users.find(x => x.id === userId);
  return (u && u.name) ? u.name : '—';
}

// Totes les fotos publicades que pertanyen a reptes finalitzats, enriquides.
export function getFinishedGalleryPhotos() {
  const finishedIds = new Set(
    state.objectives.filter(o => o.status === 'finished').map(o => o.id)
  );
  return state.publishedPhotos
    .filter(p => finishedIds.has(p.objectiveId))
    .map(p => {
      const obj = state.objectives.find(o => o.id === p.objectiveId);
      return {
        id:             p.id,
        url:            p.url,
        fileName:       p.fileName || 'foto.jpg',
        caption:        p.caption || '',
        authorId:       p.userId,
        authorName:     _authorName(p.userId),
        objectiveId:    p.objectiveId,
        objectiveTitle: obj ? obj.title : '—',
        objDate:        obj ? _objDate(obj) : '',
      };
    });
}

// Llista de reptes finalitzats, més recents a dalt (per al desplegable)
function _finishedObjectivesSorted() {
  return state.objectives
    .filter(o => o.status === 'finished')
    .slice()
    .sort((a, b) => String(_objDate(b)).localeCompare(String(_objDate(a))));
}

// Omple els dos desplegables (repte i autor) a partir de les fotos disponibles
export function populateGalleryFilters() {
  const photos = getFinishedGalleryPhotos();
  const objSel = document.getElementById('gallery-filter-objective');
  const authSel = document.getElementById('gallery-filter-author');
  if (!objSel || !authSel) return;

  // ── Desplegable REPTE (cronològic, recent → antic)
  const objs = _finishedObjectivesSorted();
  objSel.innerHTML =
    `<option value="all">${t('gallery_all_objectives')}</option>` +
    objs.map(o => `<option value="${o.id}">${_escape(o.title)}</option>`).join('');
  objSel.value = _galFilterObj;

  // ── Desplegable AUTOR (alfabètic). Només autors que tenen alguna foto.
  const authorMap = new Map();
  photos.forEach(p => { if (!authorMap.has(p.authorId)) authorMap.set(p.authorId, p.authorName); });
  const authors = [...authorMap.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }));
  authSel.innerHTML =
    `<option value="all">${t('gallery_all_authors')}</option>` +
    authors.map(([id, name]) => `<option value="${id}">${_escape(name)}</option>`).join('');
  authSel.value = _galFilterAuthor;
}

// Llegeix els selects i repinta
export function onGalleryFilterChange() {
  const objSel  = document.getElementById('gallery-filter-objective');
  const authSel = document.getElementById('gallery-filter-author');
  _galFilterObj    = objSel ? objSel.value : 'all';
  _galFilterAuthor = authSel ? authSel.value : 'all';
  renderGallery();
}

// Pinta el mosaic aplicant filtres + regla d'agrupació
export function renderGallery() {
  const grid  = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid || !empty) return;

  let photos = getFinishedGalleryPhotos();
  if (_galFilterObj    !== 'all') photos = photos.filter(p => p.objectiveId === _galFilterObj);
  if (_galFilterAuthor !== 'all') photos = photos.filter(p => p.authorId === _galFilterAuthor);

  if (photos.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    window._galleryPhotosList = [];
    return;
  }
  empty.classList.add('hidden');

  // Regla d'agrupació:
  //  - Repte = "tots"            → agrupa per repte (cronològic, recent→antic)
  //  - Repte concret + autor"tots"→ agrupa per autor (alfabètic)
  //  - Tots dos concrets         → una sola graella sense capçaleres
  let groups; // [{ title, photos }]
  if (_galFilterObj === 'all') {
    const byObj = new Map();
    photos.forEach(p => {
      if (!byObj.has(p.objectiveId)) byObj.set(p.objectiveId, { title: p.objectiveTitle, date: p.objDate, photos: [] });
      byObj.get(p.objectiveId).photos.push(p);
    });
    groups = [...byObj.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  } else if (_galFilterAuthor === 'all') {
    const byAuthor = new Map();
    photos.forEach(p => {
      if (!byAuthor.has(p.authorId)) byAuthor.set(p.authorId, { title: p.authorName, photos: [] });
      byAuthor.get(p.authorId).photos.push(p);
    });
    groups = [...byAuthor.values()].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  } else {
    groups = [{ title: null, photos }];
  }

  // Llista plana en l'ordre visual (per a la navegació del visor)
  const flat = [];
  let html = '';
  for (const g of groups) {
    if (g.title) html += `<div class="gallery-group-header">${_escape(g.title)}</div>`;
    html += '<div class="gallery-mosaic-grid">';
    for (const p of g.photos) {
      const idx = flat.length;
      flat.push({ url: p.url, fileName: p.fileName, author: p.authorName });
      const meta = [p.caption, p.authorName].filter(Boolean);
      html += `
        <div class="gallery-photo" onclick="openGalleryLightbox(${idx})">
          <img src="${p.url}" alt="${_escape(p.fileName)}" loading="lazy">
          <div class="gallery-photo-meta">
            ${p.caption ? `<div class="gallery-photo-caption">${_escape(p.caption)}</div>` : ''}
            <div class="gallery-photo-author">${_escape(p.authorName)}</div>
          </div>
        </div>`;
    }
    html += '</div>';
  }
  grid.innerHTML = html;
  window._galleryPhotosList = flat;
}

// Obre el visor a pantalla completa amb tota la llista filtrada
export function openGalleryLightbox(index) {
  const photos = window._galleryPhotosList || [];
  if (photos.length === 0) return;
  const photo = photos[index];
  openFullscreen(photo.url, photo.fileName, photos, index);
}

// Escapa text per inserir-lo en HTML de forma segura
function _escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Exposa en window les funcions usades des d'onclick del HTML
window.onGalleryFilterChange = onGalleryFilterChange;
window.openGalleryLightbox   = openGalleryLightbox;
