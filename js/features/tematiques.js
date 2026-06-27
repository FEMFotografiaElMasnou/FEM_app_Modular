// ═══════════════════════════════════
// TEMÀTIQUES — lista, finalización y CRUD (sin DELETE desde UI)
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { currentLang, t, applyTranslations } from '../core/i18n.js';
import { showToast, showLoader, hideLoader } from '../ui/toast.js';
import { confirmAction, openModal, closeModal } from '../ui/modals.js';
import { saveObjectives, saveSettings } from '../core/data.js';
import { getPhotoScore, assignPositionPoints, renderRanking } from './ranking.js';
import { renderAdminGallery } from './fotos.js';
import { updateVoteButtonsState } from './votacio.js';
import { refreshAdminDashboard } from '../screens/admin.js';

export function renderObjectivesList() {
  const el = document.getElementById('objectives-list');
  if (state.objectives.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>No hi ha temàtiques. Crea'n una per començar.</p></div>`;
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
      showLoader(currentLang === 'es' ? 'Finalizando temática...' : 'Finalitzant temàtica...');
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
      state.currentObjective = null;
      await saveObjectives();

      // 3. Desactivar uploads y voting
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
    document.getElementById('obj-modal-title').textContent = 'EDITAR TEMÀTICA';
    document.getElementById('obj-title').value  = obj.title;
    document.getElementById('obj-desc').value   = obj.description;
    document.getElementById('obj-status').value = obj.status;
  } else {
    document.getElementById('obj-modal-title').textContent = 'NOVA TEMÀTICA';
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

  // Block creating a new objective if there's an active one with pending votes
  if (!id) {
    const activeObj = state.objectives.find(o => o.status === 'active');
    if (activeObj) {
      showToast(t('objective_already_active'), 'error');
      return;
    }
    const hasUnfinished = state.objectives.some(o => o.status !== 'finished');
    if (hasUnfinished) {
      showToast(t('objective_not_finished'), 'error');
      return;
    }
  }

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
