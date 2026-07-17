// ═══════════════════════════════════
// TEMÀTIQUES — lista, finalización y CRUD (sin DELETE desde UI)
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { t, applyTranslations } from '../core/i18n.js';
import { showToast, showLoader, hideLoader } from '../ui/toast.js';
import { confirmAction, openModal, closeModal } from '../ui/modals.js';
import { saveObjectives, saveSettings } from '../core/data.js';
import { getPhotoScore, assignPositionPoints, renderRanking } from './ranking.js';
import { renderAdminGallery } from './fotos.js';
import { updateVoteButtonsState } from './votacio.js';
import { refreshAdminDashboard } from '../screens/admin.js';
import { getCalendariDatesHtml } from './calendari.js';

export function renderObjectivesList() {
  const el = document.getElementById('objectives-list');
  if (state.objectives.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>${t('no_objectives')}</p></div>`;
    return;
  }
  el.innerHTML = state.objectives.map(obj => {
    const isActive   = obj.status === 'active';
    const isFinished = obj.status === 'finished';
    const statusBadge = isActive
      ? `<span class="badge badge-green">● ${t("active_badge")}</span>`
      : isFinished
        ? `<span class="badge badge-gray">✓ ${t("finished_badge")}</span>`
        : `<span class="badge badge-yellow">${t("inactive_badge")}</span>`;
    const finalizeBtn = isActive
      ? `<button type="button" class="btn btn-danger btn-sm" onclick="finalizeObjective('${obj.id}')">${t("finalize_btn")}</button>`
      : '';
    const editBtn = !isFinished
      ? `<button type="button" class="btn btn-secondary btn-sm" onclick="openObjectiveModal('${obj.id}')">${t("edit_btn")}</button>`
      : '';
    return `
    <div class="objective-item">
      <div class="obj-info">
        <div class="obj-title">${obj.title}</div>
        <div class="obj-desc">${obj.description || ''}</div>
        ${getCalendariDatesHtml(obj.id)}
      </div>
      ${statusBadge}
      ${editBtn}
      ${finalizeBtn}
    </div>`;
  }).join('');
  // Re-apply translations to newly rendered elements
  applyTranslations();
}

export async function finalizeObjective(id) {
  confirmAction(
    t('confirm_finalize_title'),
    t('confirm_finalize_msg'),
    async () => {
      showLoader(t('finalizing_objective'));
      const obj = state.objectives.find(o => o.id === id);
      if (!obj) { hideLoader(); return; }

      // 1. CALCULAR POSICIONS I GUARDAR PUNTS AL RÀNQUING GLOBAL
      const rankedPhotos = state.publishedPhotos
        .map(photo => ({ photo, score: getPhotoScore(photo.id) }))
        .sort((a, b) => b.score - a.score);
      const withPoints = assignPositionPoints(rankedPhotos);

      for (const { photo, points } of withPoints) {
        const userId = photo.userId;
        if (!state.generalRanking[userId]) {
          state.generalRanking[userId] = { totalScore: 0, participations: 0 };
        }
        state.generalRanking[userId].totalScore += points;
        state.generalRanking[userId].participations += 1;
      }

      // 2. Marcar temática como finalizada
      obj.status = 'finished';
      obj.end_date = new Date().toISOString().split('T')[0];
      // FASE 2: el repte finalitzat també tanca els seus propis flags (font de
      // veritat des d'ara), no només el mirall global.
      obj.uploads_enabled = false;
      obj.voting_enabled  = false;
      state.currentObjective = null;
      await saveObjectives();

      // 3. Desactivar uploads y voting (mirall global — la resta de pantalles
      // encara el llegeixen; sense repte actiu, tot false és correcte)
      state.settings.uploads_enabled = false;
      state.settings.voting_enabled  = false;
      state.settings.namesRevealed   = false;
      await saveSettings(); // Esto también guarda el generalRanking
      document.getElementById('toggle-upload').checked = false;
      document.getElementById('toggle-voting').checked = false;

      // 4. Limpiar estado local (els registres es conserven a Supabase per historial)
      state.photos = [];
      state.publishedPhotos = [];
      state.votes = [];
      state.selectedPhotos = new Set();

      // 6. Refrescar UI
      renderObjectivesList();
      renderAdminGallery();
      refreshAdminDashboard();
      renderRanking('ranking-current-list', 'ranking-general-list');
      updateVoteButtonsState();
      hideLoader();
      showToast(t("objective_finalized"), "success");
    }
  );
}

export function openObjectiveModal(id) {
  document.getElementById('obj-edit-id').value = id || '';
  if (id) {
    const obj = state.objectives.find(o => o.id === id);
    document.getElementById('obj-modal-title').textContent = t('edit_objective_title');
    document.getElementById('obj-title').value  = obj.title;
    document.getElementById('obj-desc').value   = obj.description;
    document.getElementById('obj-status').value = obj.status;
  } else {
    document.getElementById('obj-modal-title').textContent = t('new_objective_btn');
    document.getElementById('obj-title').value  = '';
    document.getElementById('obj-desc').value   = '';
    document.getElementById('obj-status').value = 'active';
  }
  openModal('modal-objective');
}

export async function saveObjective() {
  const id          = document.getElementById('obj-edit-id').value;
  const title       = document.getElementById('obj-title').value.trim();
  const description = document.getElementById('obj-desc').value.trim();
  const status      = document.getElementById('obj-status').value;

  if (!title) { showToast(t('title_required'), 'error'); return; }

  // FASE 2 (pla multi-repte, FEM_reptes.md — FET): ja no es bloqueja crear un
  // repte nou si n'hi ha un altre actiu o no finalitzat. Abans hi havia aquí
  // un bloqueig ("objective_already_active"/"objective_not_finished") que
  // limitava l'app a un sol repte actiu a la vegada; es retira a propòsit.
  //
  // AVÍS (encara vigent): crear un 2n repte actiu ja no peta ni es bloqueja,
  // però la UI d'avui (Panell de Control, Calendari, masters) encara només
  // sap mostrar/gestionar UN repte — el que trobi primer
  // `state.objectives.find(o => o.status === 'active')` (línia de sota i a
  // data.js). El 2n repte actiu quedaria "actiu" a la BD però sense manera
  // de gestionar-ne el calendari/masters ni de rebre fotos fins la Fase 4/6.
  // No crear un 2n repte actiu real fins que aquestes fases estiguin fetes.

  if (id) {
    // Editing existing: only update title and description, keep status unchanged
    const obj = state.objectives.find(o => o.id === id);
    if (obj) { obj.title = title; obj.description = description; }
  } else {
    // New objective is always created as active
    state.objectives.push({
      id: 'obj_' + Date.now(), title, description, status: 'active',
      uploads_enabled: false, voting_enabled: false,
      start_date: new Date().toISOString().split('T')[0], end_date: '',
      created_by: state.currentUser.id,
    });
  }

  state.currentObjective = state.objectives.find(o => o.status === 'active') || null;
  await saveObjectives();
  closeModal('modal-objective');
  renderObjectivesList();
  refreshAdminDashboard();
  showToast(t('objective_saved'), 'success');
}

// Exponer en window las funciones usadas desde onclick del HTML
window.renderObjectivesList = renderObjectivesList;
window.finalizeObjective = finalizeObjective;
window.openObjectiveModal = openObjectiveModal;
window.saveObjective = saveObjective;
