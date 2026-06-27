// ═══════════════════════════════════
// PANTALLA PARTICIPANT — paneles, dashboard, visibilidad de botones y mosaico
// ═══════════════════════════════════
import { state, actingAsAdmin } from '../core/state.js';
import { currentLang, t, applyTranslations } from '../core/i18n.js';
import { showToast } from '../ui/toast.js';
import { getActivePublishedPhotos, getActiveVotes } from '../core/data.js';
import { renderVotingGrid, updateVoteButtonsState } from '../features/votacio.js';
import { renderRanking } from '../features/ranking.js';
import { updateUploadSection } from '../features/fotos.js';
import { setActiveNav, switchTab } from '../core/router.js';
import { populateGalleryFilters, renderGallery } from '../features/galeria.js';

// ═══════════════════════════════════
// PANELES
// ═══════════════════════════════════
// Amaga tots els panells del participant (helper per no oblidar-ne cap)
function _hideAllParticipantPanels() {
  document.getElementById('participant-panel-main').classList.add('hidden');
  document.getElementById('participant-panel-voting').classList.add('hidden');
  document.getElementById('participant-panel-ranking').classList.add('hidden');
  document.getElementById('participant-panel-gallery').classList.add('hidden');
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

// ── NAVEGACIÓ — Resultat Repte / Classificació General ──
export function showParticipantResultats() {
  showParticipantRanking();
  switchTab('p-rank', 'current');
}

export function showParticipantClassificacio() {
  showParticipantRanking();
  switchTab('p-rank', 'general');
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

  // Progress GLOBAL: cuántas fotos tienen todos sus votos completos
  const activePublished = getActivePublishedPhotos();
  const activeVotes     = getActiveVotes();
  const totalPhotos = activePublished.length;
  const totalVoters = totalPhotos; // Cada participante con foto puede votar
  const requiredVotesPerPhoto = totalVoters - 1; // Todos votan menos el dueño

  // Contar cuántas fotos tienen todos sus votos
  let fullyVotedPhotos = 0;
  for (const photo of activePublished) {
    const votesForPhoto = activeVotes.filter(v => v.photoId === photo.id).length;
    if (votesForPhoto >= requiredVotesPerPhoto) {
      fullyVotedPhotos++;
    }
  }

  const pct = totalPhotos > 0 ? Math.round((fullyVotedPhotos / totalPhotos) * 100) : 0;
  document.getElementById('participant-progress-bar').style.width   = pct + '%';
  document.getElementById('participant-progress-left').textContent  =
    `${fullyVotedPhotos}/${totalPhotos} ${t('members_voted')}`;
  document.getElementById('participant-progress-right').textContent = `${pct}%`;

  // Sección de subida: siempre con la lógica normal
  updateUploadSection();

  // Re-apply all data-i18n translations (nav cards, labels, etc.)
  applyTranslations();
  updateVoteButtonsState();
  // Aplicar visibilitat de nav-cards (estat repte + forçats admin)
  applyParticipantButtonVisibility();
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
  const logicShowResultats     = hasObjective && state.settings.namesRevealed;   // (4b) visible en tancar votacions
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
  // Galeria: només visible si hi ha almenys un repte finalitzat
  const hasFinished = state.objectives.some(o => o.status === 'finished');
  setDisplay('nav-card-gallery', hasFinished);
}

// Exponer en window las funciones usadas desde onclick del HTML
window.showParticipantMain = showParticipantMain;
window.showParticipantVoting = showParticipantVoting;
window.showParticipantRanking = showParticipantRanking;
window.showParticipantResultats = showParticipantResultats;
window.showParticipantClassificacio = showParticipantClassificacio;
window.showParticipantGallery = showParticipantGallery;
window.refreshParticipantDashboard = refreshParticipantDashboard;
