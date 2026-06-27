// ═══════════════════════════════════
// PANTALLA PARTICIPANT — paneles, dashboard, visibilidad de botones y mosaico
// ═══════════════════════════════════
import { state, actingAsAdmin } from '../core/state.js';
import { currentLang, t, applyTranslations } from '../core/i18n.js';
import { showToast } from '../ui/toast.js';
import { getActivePublishedPhotos, getActiveVotes, getActiveAllPhotos } from '../core/data.js';
import { renderVotingGrid, updateVoteButtonsState } from '../features/votacio.js';
import { renderRanking } from '../features/ranking.js';
import { updateUploadSection } from '../features/fotos.js';
import { setActiveNav, switchTab } from '../core/router.js';
import { openFullscreen } from '../ui/lightbox.js';

// ═══════════════════════════════════
// PANELES
// ═══════════════════════════════════
export function showParticipantMain() {
  document.getElementById('participant-panel-main').classList.remove('hidden');
  document.getElementById('participant-panel-voting').classList.add('hidden');
  document.getElementById('participant-panel-ranking').classList.add('hidden');
  setActiveNav('bnav-home');
  refreshParticipantDashboard();
}

export function showParticipantVoting() {
  // Allow viewing published photos even if voting is not open yet
  if (state.publishedPhotos.length === 0) {
    showToast(currentLang === 'es' ? 'No hay fotos publicadas aún 📷' : 'Encara no hi ha fotos publicades 📷', 'info');
    return;
  }
  document.getElementById('participant-panel-main').classList.add('hidden');
  document.getElementById('participant-panel-voting').classList.remove('hidden');
  document.getElementById('participant-panel-ranking').classList.add('hidden');
  setActiveNav('bnav-vote');
  renderVotingGrid('participant-voting-grid');
}

export function showParticipantRanking() {
  document.getElementById('participant-panel-main').classList.add('hidden');
  document.getElementById('participant-panel-voting').classList.add('hidden');
  document.getElementById('participant-panel-ranking').classList.remove('hidden');
  setActiveNav('bnav-rank');
  renderRanking('p-ranking-current-list', 'p-ranking-general-list');
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

  // Upload section + botón "Veure Fotos"
  const myPhoto = getActiveAllPhotos().find(p => p.userId === state.currentUser.id);
  const btnViewPhotos = document.getElementById('btn-view-photos');
  const mosaicSection = document.getElementById('photo-mosaic-section');

  // El botón "Veure Fotos" se muestra siempre que haya temática activa
  if (btnViewPhotos) {
    btnViewPhotos.style.display = state.currentObjective ? 'inline-flex' : 'none';
  }
  // Si el mosaico estaba abierto al refrescar, repintar contenido
  if (mosaicSection && !mosaicSection.classList.contains('hidden')) {
    renderPhotoMosaic();
  }

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
}

// ═══════════════════════════════════
// PHOTO MOSAIC (embebido)
// ═══════════════════════════════════
export function getMosaicPhotosList() {
  const photos = getActivePublishedPhotos();
  return photos.map((p, idx) => ({ url: p.url, fileName: `foto_${idx + 1}.jpg` }));
}

export function togglePhotoMosaic() {
  const section = document.getElementById('photo-mosaic-section');
  const btn = document.getElementById('btn-view-photos');
  if (!section) return;

  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    if (btn) btn.classList.add('active');
    renderPhotoMosaic();
  } else {
    section.classList.add('hidden');
    if (btn) btn.classList.remove('active');
  }
}

export function renderPhotoMosaic() {
  const grid = document.getElementById('photo-mosaic-grid');
  const emptyMsg = document.getElementById('photo-mosaic-empty');
  if (!grid || !emptyMsg) return;

  const photos = getMosaicPhotosList();

  if (photos.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    emptyMsg.classList.remove('hidden');
    return;
  }

  grid.style.display = 'grid';
  emptyMsg.classList.add('hidden');

  grid.innerHTML = photos.map((photo, idx) => `
    <div class="mosaic-photo" onclick="openMosaicLightbox(${idx})">
      <img src="${photo.url}" alt="Foto ${idx + 1}" loading="lazy">
    </div>
  `).join('');

  // Guardar lista para el lightbox
  window._mosaicPhotosList = photos;
}

export function openMosaicLightbox(index) {
  const photos = window._mosaicPhotosList || [];
  if (photos.length === 0) return;
  const photo = photos[index];
  openFullscreen(photo.url, photo.fileName, photos, index);
}

// Exponer en window las funciones usadas desde onclick del HTML
window.showParticipantMain = showParticipantMain;
window.showParticipantVoting = showParticipantVoting;
window.showParticipantRanking = showParticipantRanking;
window.showParticipantResultats = showParticipantResultats;
window.showParticipantClassificacio = showParticipantClassificacio;
window.refreshParticipantDashboard = refreshParticipantDashboard;
window.togglePhotoMosaic = togglePhotoMosaic;
window.openMosaicLightbox = openMosaicLightbox;
