// ═══════════════════════════════════
// PANTALLA ADMIN — dashboard, controles (toggles), tabs y nav lateral
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { currentLang, t } from '../core/i18n.js';
import { showToast } from '../ui/toast.js';
import { getActivePublishedPhotos, getActiveAllPhotos, getActiveVotes, getVotingProgress, saveSettings } from '../core/data.js';
import { updateVoteButtonsState } from '../features/votacio.js';
import { renderRanking } from '../features/ranking.js';
import { renderCalendariCard, isCalendarAutomationActive } from '../features/calendari.js';
import { switchTab } from '../core/router.js';

// ═══════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════
export function refreshAdminDashboard() {
  // ── Filtrado por temática activa (no mezclar temáticas pasadas)
  const activePublished = getActivePublishedPhotos();
  const activeAll       = getActiveAllPhotos();
  const activeVotes     = getActiveVotes();

  // Progreso GLOBAL: cuántas fotos tienen todos sus votos completos
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

  document.getElementById('stat-photos').textContent        = activeAll.length;
  document.getElementById('stat-votes-done').textContent    = fullyVotedPhotos;
  document.getElementById('stat-votes-total').textContent   = totalPhotos;

  // Barra PROGRÉS VOTACIONS (moguda des del panell de participant, v0.1.21):
  // progrés per VOTANTS (socis que han enviat definitiva / participants ∪ votants).
  const votingProgress = getVotingProgress();
  document.getElementById('admin-progress-bar').style.width    = votingProgress.pct + '%';
  document.getElementById('admin-progress-left').textContent   = `${votingProgress.voted}/${votingProgress.total} ${t('members_voted')}`;
  document.getElementById('admin-progress-right').textContent  = `${votingProgress.pct}%`;
  document.getElementById('admin-progress-label').textContent  = '';

  // Admin own photo upload section (solo foto de la temática activa)
  const adminPhoto = getActiveAllPhotos().find(p => p.userId === state.currentUser.id);
  const adminUploadSect = document.getElementById('admin-upload-section');
  const adminDoneSect   = document.getElementById('admin-upload-done-section');
  const adminPrevSect   = document.getElementById('admin-upload-preview-section');
  const adminLabelEl    = document.getElementById('admin-upload-status-label');
  if (adminUploadSect) {
    if (adminPhoto) {
      adminUploadSect.classList.add('hidden');
      if (adminPrevSect) adminPrevSect.classList.add('hidden');
      if (adminDoneSect) { adminDoneSect.classList.remove('hidden'); }
      if (adminLabelEl) adminLabelEl.textContent = adminPhoto.published ? 'Foto publicada ✅' : 'Foto pujada (pendent) ⏳';
      const prev = document.getElementById('admin-my-photo-preview');
      if (prev) prev.innerHTML = '<img src="'+adminPhoto.url+'" style="width:100%;border-radius:12px;">';
      // Ocultar botón "Eliminar i Tornar a Pujar" si la subida está cerrada
      if (adminDoneSect) {
        const adminDeleteBtn = adminDoneSect.querySelector('[data-i18n="delete_photo_btn"]');
        if (adminDeleteBtn) adminDeleteBtn.style.display = state.settings.uploads_enabled ? '' : 'none';
      }
    } else {
      adminUploadSect.classList.remove('hidden');
      if (adminDoneSect) adminDoneSect.classList.add('hidden');
      if (adminLabelEl) adminLabelEl.textContent = 'Puja la teva foto per participar';
    }
  }

  // Current objective info
  const objEl = document.getElementById('current-objective-info');
  if (state.currentObjective) {
    objEl.innerHTML = `
      <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;color:var(--accent);">${state.currentObjective.title}</div>
      <div style="font-size:14px;color:var(--text-muted);margin-top:8px;">${state.currentObjective.description}</div>
    `;
  } else {
    objEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>No hi ha temàtica activa.</p></div>`;
  }
  // Calendari del repte: omplir dates/switch (l'històric de dates viu a Temàtiques)
  renderCalendariCard();
  updateVoteButtonsState();
}

// ═══════════════════════════════════
// ADMIN CONTROLS (toggles)
// ═══════════════════════════════════
export async function toggleUpload() {
  // Block upload activation if no active objective/temàtica
  if (document.getElementById('toggle-upload').checked && !state.currentObjective) {
    document.getElementById('toggle-upload').checked = false;
    showToast(currentLang === 'es' ? '🔒 Crea una temática primero' : '🔒 Crea una temàtica primer', 'error');
    return;
  }
  state.settings.uploads_enabled = document.getElementById('toggle-upload').checked;
  await saveSettings();
  showToast(state.settings.uploads_enabled
    ? (currentLang === 'es' ? 'Subida de fotos activada ✅' : 'Pujada de fotos activada ✅')
    : (currentLang === 'es' ? 'Subida de fotos desactivada 🔒' : 'Pujada de fotos desactivada 🔒'), 'info');
}

export async function toggleVotingOpen() {
  // Block voting if no published photos
  if (document.getElementById('toggle-voting').checked && state.publishedPhotos.length === 0) {
    document.getElementById('toggle-voting').checked = false;
    showToast(currentLang === 'es' ? '🔒 Publica las fotos primero' : '🔒 Publica les fotos primer', 'error');
    return;
  }
  state.settings.voting_enabled = document.getElementById('toggle-voting').checked;
  if (state.settings.voting_enabled) {
    // Al abrir votación: cerrar subidas automáticamente
    state.settings.uploads_enabled = false;
    document.getElementById('toggle-upload').checked = false;
  } else {
    // Al cerrar votación: revelar nombres y ranking (antes lo hacía el botón "Tancar Votacions")
    revealNamesAndRanking();
  }
  await saveSettings();
  showToast(state.settings.voting_enabled
    ? (currentLang === 'es' ? 'Votaciones abiertas ✅ (subida de fotos cerrada)' : 'Votacions obertes ✅ (pujada de fotos tancada)')
    : (currentLang === 'es' ? 'Votaciones cerradas · nombres y ranking revelados 🏆' : 'Votacions tancades · noms i rànquing revelats 🏆'), 'success');
  refreshAdminDashboard();
}

// Revela nombres y ranking de la temática activa.
// Reutilizable: lo llama el toggle al cerrar la votación y (en el futuro) el calendario automatizado.
export function revealNamesAndRanking() {
  state.settings.namesRevealed = true;
  renderRanking('ranking-current-list', 'ranking-general-list');
  renderRanking('p-ranking-current-list', 'p-ranking-general-list');
}

// ═══════════════════════════════════
// TABS / SIDEBAR / PLASTIC BUTTONS
// ═══════════════════════════════════
// Sidebar admin: reutilitza switchTab i sincronitza l'item actiu (iteració 1)
export function adminNav(tab) {
  switchTab('admin', tab);
  document.querySelectorAll('.admin-sidebar .sidebar-item').forEach(function (el) {
    var oc = el.getAttribute('onclick') || '';
    el.classList.toggle('active', oc.indexOf("'" + tab + "'") !== -1);
  });
}

// Iteració 3: botons de plàstic com a pell dels checkboxes
export function syncPlasticButtons() {
  var locked = isCalendarAutomationActive();   // el calendari mana → pujada/votació bloquejats
  [['pbtn-upload','toggle-upload'], ['pbtn-voting','toggle-voting']].forEach(function (pair) {
    var btn = document.getElementById(pair[0]);
    var cb  = document.getElementById(pair[1]);
    if (btn && cb) {
      btn.classList.toggle('on', cb.checked);
      btn.classList.toggle('locked', locked);
    }
  });
}
export function plasticPress(btnId, cbId, fnName) {
  // Si el calendari gestiona pujada/votació, no permetre el canvi manual
  if ((cbId === 'toggle-upload' || cbId === 'toggle-voting') && isCalendarAutomationActive()) {
    showToast(currentLang === 'es'
      ? '🔒 Gestionado por el calendario (apaga la automatización para tocarlo)'
      : '🔒 Gestionat pel calendari (apaga l\'automatització per tocar-ho)', 'info');
    return;
  }
  var cb = document.getElementById(cbId);
  if (!cb) return;
  cb.checked = !cb.checked;
  var fn = window[fnName];
  if (typeof fn === 'function') fn();   // pot rebutjar el canvi (sense temàtica / sense fotos)
  syncPlasticButtons();                 // reflecteix l'estat real
}

// Exponer en window: las llamadas desde onclick + las invocadas por nombre (plasticPress)
window.refreshAdminDashboard = refreshAdminDashboard;
window.toggleUpload = toggleUpload;
window.toggleVotingOpen = toggleVotingOpen;
window.adminNav = adminNav;
window.syncPlasticButtons = syncPlasticButtons;
window.plasticPress = plasticPress;
