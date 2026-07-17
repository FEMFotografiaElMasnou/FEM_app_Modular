// ═══════════════════════════════════
// PANTALLA ADMIN — dashboard i tabs / nav lateral
// FASE 4/5 (pla multi-repte, FEM_reptes.md — FET, 2026-07-17): els vells
// masters "Pujada"/"Votació" (botons de plàstic globals, un sol repte) i la
// card "Calendari" del Panell de Control queden RETIRATS d'aquí (punt 1 del
// pla, ara efectiu). Cada repte gestiona ara la seva pujada/votació amb els
// 2 desplegables de mode i les 4 dates de la seva pròpia targeta, a
// tematiques.js (setPhaseMode/updateCalendarDate, a calendari.js).
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { t } from '../core/i18n.js';
import { getActivePublishedPhotos, getActiveAllPhotos, getActiveVotes } from '../core/data.js';
import { updateVoteButtonsState } from '../features/votacio.js';
import { switchTab } from '../core/router.js';

// ═══════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════
export function refreshAdminDashboard() {
  // Guard: cridada també des d'applyTranslations() en canviar d'idioma, que pot
  // dispararse abans del login (encara sense state.currentUser).
  if (!state.currentUser) return;
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
      if (adminLabelEl) adminLabelEl.textContent = adminPhoto.published ? t('photo_published') : t('photo_pending');
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
      if (adminLabelEl) adminLabelEl.textContent = t('upload_photo_label');
    }
  }

  // Current objective info (placeholder ocult des de la iteració 2 — es deixa
  // sense tocar, no forma part de l'abast d'aquesta fase)
  const objEl = document.getElementById('current-objective-info');
  if (state.currentObjective) {
    objEl.innerHTML = `
      <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;color:var(--accent);">${state.currentObjective.title}</div>
      <div style="font-size:14px;color:var(--text-muted);margin-top:8px;">${state.currentObjective.description}</div>
    `;
  } else {
    objEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>${t('no_active_objective_short')}.</p></div>`;
  }
  updateVoteButtonsState();
}

// ═══════════════════════════════════
// TABS / SIDEBAR
// ═══════════════════════════════════
// Sidebar admin: reutilitza switchTab i sincronitza l'item actiu (iteració 1)
export function adminNav(tab) {
  switchTab('admin', tab);
  document.querySelectorAll('.admin-sidebar .sidebar-item').forEach(function (el) {
    var oc = el.getAttribute('onclick') || '';
    el.classList.toggle('active', oc.indexOf("'" + tab + "'") !== -1);
  });
  // Repinta la llista de textos en entrar-hi, per descartar edicions no
  // desades d'una visita anterior i reflectir l'estat actual del diccionari.
  if (tab === 'texts' && typeof window.renderTextsList === 'function') window.renderTextsList();
}

// Exponer en window: las llamadas desde onclick
window.refreshAdminDashboard = refreshAdminDashboard;
window.adminNav = adminNav;
