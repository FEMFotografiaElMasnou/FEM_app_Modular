// ═══════════════════════════════════
// PANTALLA PARTICIPANT — paneles, dashboard, visibilidad de botones y mosaico
// ═══════════════════════════════════
import { state, actingAsAdmin } from '../core/state.js';
import { currentLang, t, applyTranslations } from '../core/i18n.js';
import { showToast } from '../ui/toast.js';
import { getVotingProgress } from '../core/data.js';
import { renderVotingGrid, updateVoteButtonsState } from '../features/votacio.js';
import { renderRanking, renderResultatsRepte } from '../features/ranking.js';
import { updateUploadSection } from '../features/fotos.js';
import { setActiveNav, switchTab } from '../core/router.js';
import { populateGalleryFilters, renderGallery, startGalleryCarousel, stopGalleryCarousel } from '../features/galeria.js';

// ═══════════════════════════════════
// PANELES
// ═══════════════════════════════════
// Amaga tots els panells del participant (helper per no oblidar-ne cap)
function _hideAllParticipantPanels() {
  document.getElementById('participant-panel-main').classList.add('hidden');
  document.getElementById('participant-panel-voting').classList.add('hidden');
  document.getElementById('participant-panel-ranking').classList.add('hidden');
  document.getElementById('participant-panel-gallery').classList.add('hidden');
  document.getElementById('participant-panel-resultats').classList.add('hidden');
  document.getElementById('participant-panel-embedded').classList.add('hidden');
  // Sortir del mode pantalla completa de l'App embeguda (per qualsevol via de navegació)
  document.body.classList.remove('embedded-fullscreen');
  // Aturar el carrusel de la card galeria (només viu al panell principal)
  stopGalleryCarousel();
}

export function showParticipantMain() {
  _hideAllParticipantPanels();
  document.getElementById('participant-panel-main').classList.remove('hidden');
  setActiveNav('bnav-home');
  refreshParticipantDashboard();
}

export function showParticipantVoting() {
  // Allow viewing published photos even if voting is not open yet
  if (state.publishedPhotos.length === 0) {
    showToast(currentLang === 'es' ? 'No hay fotos publicadas aún 📷' : 'Encara no hi ha fotos publicades 📷', 'info');
    return;
  }
  _hideAllParticipantPanels();
  document.getElementById('participant-panel-voting').classList.remove('hidden');
  setActiveNav('bnav-vote');
  renderVotingGrid('participant-voting-grid');
}

export function showParticipantRanking() {
  _hideAllParticipantPanels();
  document.getElementById('participant-panel-ranking').classList.remove('hidden');
  setActiveNav('bnav-rank');
  renderRanking('p-ranking-current-list', 'p-ranking-general-list');
}

export function showParticipantGallery() {
  _hideAllParticipantPanels();
  document.getElementById('participant-panel-gallery').classList.remove('hidden');
  populateGalleryFilters();
  renderGallery();
}

// ── NAVEGACIÓ — Resultat Repte (natiu, amb desplegable de reptes finalitzats) ──
// Data d'un repte per ordenar cronològicament (tancament > inici)
function _objDate(o) {
  return o.end_date || o.start_date || '';
}
// Reptes que es mostren al desplegable de "Resultat Repte".
// Diferenciat per TIPUS DE COMPTE (rol real):
//   · admin       → TOTS els reptes (inclòs l'actiu i els inactius)
//   · participant → només els finalitzats
function _resultatsObjectives() {
  const isAdmin = !!(state.currentUser && state.currentUser.role === 'admin');
  return state.objectives
    .filter(o => isAdmin || o.status === 'finished')
    .slice()
    .sort((a, b) => String(_objDate(b)).localeCompare(String(_objDate(a))));  // recent → antic
}

export function showParticipantResultats() {
  _hideAllParticipantPanels();
  document.getElementById('participant-panel-resultats').classList.remove('hidden');
  setActiveNav('bnav-rank');

  const sel   = document.getElementById('resultats-repte-select');
  const empty = document.getElementById('resultats-empty');
  const list  = document.getElementById('resultats-list');
  const objs  = _resultatsObjectives();
  const label = sel ? sel.closest('.gallery-filter') : null;

  if (objs.length === 0) {
    // Cap repte finalitzat encara: amagar desplegable, mostrar avís
    if (label) label.style.display = 'none';
    if (list)  list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (label) label.style.display = '';
  if (empty) empty.classList.add('hidden');
  // Conservar la selecció prèvia si encara existeix; si no, el més recent
  const prev = sel ? sel.value : '';
  sel.innerHTML = objs.map(o => `<option value="${o.id}">${o.title}</option>`).join('');
  sel.value = objs.some(o => o.id === prev) ? prev : objs[0].id;
  renderResultatsRepte(sel.value, 'resultats-list');
}

export function onResultatsRepteChange() {
  const sel = document.getElementById('resultats-repte-select');
  if (sel) renderResultatsRepte(sel.value, 'resultats-list');
}

// ── Classificació General (vista interna antiga; ja no enllaçada, es manté per referència) ──
export function showParticipantClassificacio() {
  showParticipantRanking();
  switchTab('p-rank', 'general');
}

// ── APP RESULTATS (Enric) embeguda dins l'app ──
// Carrega https://fem-reptes.netlify.app/ en un iframe, passant el rol de l'usuari.
// view: 'resultats' (resultats del repte) | 'classificacio' (rànquing acumulat).
const RESULTATS_BASE = 'https://fem-reptes.netlify.app/';

export function openEmbedded(view) {
  const role = state.currentUser ? state.currentUser.role : 'participant';
  document.getElementById('iframe-resultats').src =
    `${RESULTATS_BASE}?role=${role}&view=${view}&embedded=true`;
  // El títol el pinta la pròpia App d'Enric dins l'iframe; no en dupliquem un de nostre.
  _hideAllParticipantPanels();
  document.getElementById('participant-panel-embedded').classList.remove('hidden');
  // Mode pantalla completa: l'iframe omple la finestra i els controls de FEM suren a sobre
  document.body.classList.add('embedded-fullscreen');
}

export function closeEmbedded() {
  document.getElementById('iframe-resultats').src = '';   // aturar la càrrega de l'iframe
  showParticipantMain();
}

// ═══════════════════════════════════
// PARTICIPANT DASHBOARD
// ═══════════════════════════════════
export function refreshParticipantDashboard() {
  // Set role badge — skip if admin is using the pill as a toggle
  const roleBadge = document.getElementById('participant-role-badge');
  if (roleBadge && state.currentUser && !state.adminViewingAsParticipant) {
    roleBadge.textContent = state.currentUser.role === 'admin'
      ? 'Admin'
      : (currentLang === 'es' ? 'Socio' : 'Soci');
  }

  const obj = state.currentObjective;
  document.getElementById('participant-objective-name').textContent = obj ? obj.title : '—';
  document.getElementById('participant-objective-desc').textContent = obj
    ? (obj.description || '')
    : (currentLang === 'es' ? 'Sin temática activa' : 'Cap temàtica activa');

  // Progrés de votació per VOTANTS: socis que han enviat definitiva / participants ∪ votants
  const { voted, total, pct } = getVotingProgress();
  document.getElementById('participant-progress-bar').style.width   = pct + '%';
  document.getElementById('participant-progress-left').textContent  =
    `${voted}/${total} ${t('members_voted')}`;
  document.getElementById('participant-progress-right').textContent = `${pct}%`;

  // Sección de subida: siempre con la lógica normal
  updateUploadSection();

  // Re-apply all data-i18n translations (nav cards, labels, etc.)
  applyTranslations();
  updateVoteButtonsState();
  // Aplicar visibilitat de nav-cards (estat repte + forçats admin)
  applyParticipantButtonVisibility();

  // Carrusel de la card galeria: només si la card és visible i som al panell principal
  const galCard    = document.getElementById('nav-card-gallery');
  const mainVisible = !document.getElementById('participant-panel-main').classList.contains('hidden');
  const galVisible  = galCard && galCard.style.display !== 'none';
  if (mainVisible && galVisible) startGalleryCarousel();
  else stopGalleryCarousel();
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIBILITAT DE BOTONS PARTICIPANT
// ═══════════════════════════════════════════════════════════════════════════
export function getButtonVisibility() {
  const s = state.settings;
  const hasObjective = !!state.currentObjective;
  // Lògica de l'estat del repte
  const logicShowUpload    = hasObjective && s.uploads_enabled;
  const logicShowVote      = hasObjective && s.voting_enabled;
  const logicShowResultats     = true;   // sempre visible: obre l'App Resultats (Enric), amb desplegable de reptes finalitzats
  const logicShowClassificacio = true;
  // Aplicar forçats d'admin (override → ocultar)
  return {
    showUpload:        logicShowUpload        && !s.force_hide_upload,
    showVote:          logicShowVote          && !s.force_hide_vote,
    showResultats:     logicShowResultats     && !s.force_hide_resultats,
    showClassificacio: logicShowClassificacio && !s.force_hide_classificacio,
  };
}

// Aplicar visibilitat sobre les nav-cards del participant
export function applyParticipantButtonVisibility() {
  if (!state.currentUser || actingAsAdmin()) return;
  const v = getButtonVisibility();
  const setDisplay = (id, show) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? '' : 'none';
  };
  setDisplay('nav-card-vote',          v.showVote);
  setDisplay('nav-card-resultats',     v.showResultats);
  setDisplay('nav-card-classificacio', v.showClassificacio);
  // Galeria: visible si hi ha algun repte finalitzat; l'admin (rol real) també
  // la veu si hi ha repte actual, perquè a la galeria veu el repte en curs.
  const hasFinished = state.objectives.some(o => o.status === 'finished');
  const isAdminRole = !!(state.currentUser && state.currentUser.role === 'admin');
  setDisplay('nav-card-gallery', hasFinished || (isAdminRole && !!state.currentObjective));
}

// Exponer en window las funciones usadas desde onclick del HTML
window.showParticipantMain = showParticipantMain;
window.showParticipantVoting = showParticipantVoting;
window.showParticipantRanking = showParticipantRanking;
window.showParticipantResultats = showParticipantResultats;
window.onResultatsRepteChange = onResultatsRepteChange;
window.showParticipantClassificacio = showParticipantClassificacio;
window.openEmbedded = openEmbedded;
window.closeEmbedded = closeEmbedded;
window.showParticipantGallery = showParticipantGallery;
window.refreshParticipantDashboard = refreshParticipantDashboard;
