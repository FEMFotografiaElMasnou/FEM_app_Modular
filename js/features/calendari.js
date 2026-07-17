// ═══════════════════════════════════
// CALENDARI — dates i mode (calendari/obert/tancat) de cada fase (pujada,
// votació) per repte. El motor real (aplicar el mode a la data, cada dia) el
// fa pg_cron dins de Supabase (sql/reptes_calendari_fase4.sql, funció
// fem_apply_calendar()); aquí calculem el mateix resultat AL MOMENT (sense
// esperar el cron) quan l'admin edita una data o un mode, i persistim.
//
// FASE 4/5 (pla multi-repte, FEM_reptes.md — FET, 2026-07-17): substitueix el
// vell "automation_enabled" (un únic ON/OFF per repte, botons de plàstic
// globals a la card "Calendari" del Panell de Control) per DOS desplegables
// independents PER REPTE — un per "Pujada", un per "Votació" — amb 3 estats
// cadascun:
//   · calendari → segueix les dates (equival al vell automation_enabled=true)
//   · obert     → forçat obert, per damunt del calendari
//   · tancat    → forçat tancat, per damunt del calendari
// La graella visual de mes i la card global "Calendari" del Panell de Control
// queden RETIRADES (es fa efectiu el punt 1 del pla, FEM_reptes.md): cada
// targeta de repte a l'apartat Reptes (tematiques.js) té ara els seus propis
// 4 camps de data (<input type="date"> natius) i els 2 desplegables de mode.
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { sb } from '../core/config.js';
import { t } from '../core/i18n.js';
import { showToast } from '../ui/toast.js';
import { getActiveObjectiveId, saveSettings, saveObjectives } from '../core/data.js';
import { renderRanking } from './ranking.js';

// Fila de calendari d'un repte (per defecte, l'actiu). El nom és històric:
// funciona per a QUALSEVOL objectiveId, no només per al repte "actiu" global.
export function getActiveCalendar(objectiveId) {
  const objId = objectiveId || getActiveObjectiveId();
  if (!objId) return null;
  return (state.reptesCalendari || []).find(c => c.objectiveId === objId) || null;
}

// Què dirien les dates avui per a un repte, si la fase estigués en mode
// 'calendari' (independentment del mode que tingui realment triat).
function computeWantFromDates(cal) {
  const today = new Date().toISOString().slice(0, 10);   // 'YYYY-MM-DD' (UTC, coincideix amb current_date del cron)
  const inRange = (start, end) => !!(start && end && today >= start && today <= end);
  return {
    wantUpload: inRange(cal.uploadStart, cal.uploadEnd),
    wantVoting: inRange(cal.votingStart, cal.votingEnd),
    wantReveal: !!(cal.votingEnd && today > cal.votingEnd),
  };
}

// ── Aplicar l'estat efectiu (mode + dates) d'UN repte, sense esperar el cron ──
// Recalcula uploads_enabled/voting_enabled/names_revealed del repte segons
// uploadMode/votingMode i, quan el mode és 'calendari', les dates. Només
// persisteix si canvia res. Revela noms quan la votació passa a tancada (per
// qualsevol via: mode 'tancat' manual o data de fi de calendari) — mateix
// efecte que abans feia el botó "Tancar Votacions".
export function applyPhaseModes(objectiveId) {
  const objId = objectiveId || getActiveObjectiveId();
  const cal = getActiveCalendar(objId);
  const obj = state.objectives.find(o => o.id === objId);
  if (!cal || !obj) return false;

  const { wantUpload, wantVoting, wantReveal } = computeWantFromDates(cal);
  const finalUpload = cal.uploadMode === 'obert' ? true : cal.uploadMode === 'tancat' ? false : wantUpload;
  const finalVoting = cal.votingMode === 'obert' ? true : cal.votingMode === 'tancat' ? false : wantVoting;
  const wasVotingOpen = !!obj.voting_enabled;

  // state.settings només té sentit com a mirall de l'ÚNIC repte "actiu"
  // global (state.currentObjective) — participant.js/votacio.js/fotos.js el
  // segueixen llegint. Si objId no és el repte actual, s'actualitza igualment
  // el seu propi objecte, però no es trepitja el mirall amb dades d'un altre.
  const isCurrentGlobal = objId === getActiveObjectiveId();
  let changed = false;
  if (obj.uploads_enabled !== finalUpload) {
    obj.uploads_enabled = finalUpload;
    if (isCurrentGlobal) state.settings.uploads_enabled = finalUpload;
    changed = true;
  }
  if (obj.voting_enabled !== finalVoting) {
    obj.voting_enabled = finalVoting;
    if (isCurrentGlobal) state.settings.voting_enabled = finalVoting;
    changed = true;
  }
  // Revelar noms: la votació es tanca ARA (per qualsevol via) o, en mode
  // calendari, la data de fi de votació ja ha passat.
  const closedNow = wasVotingOpen && !finalVoting;
  const revealByCalendar = cal.votingMode === 'calendari' && wantReveal;
  if ((closedNow || revealByCalendar) && !obj.names_revealed) {
    obj.names_revealed = true;
    if (isCurrentGlobal) state.settings.namesRevealed = true;
    changed = true;
    renderRanking('ranking-current-list', 'ranking-general-list');
    renderRanking('p-ranking-current-list', 'p-ranking-general-list');
  }

  if (changed) {
    saveObjectives();                     // fire-and-forget: persisteix en segon pla (objectives)
    if (isCurrentGlobal) saveSettings();  // ídem (app_settings — mirall/compat)
  }
  return changed;
}

// Recalcula l'estat efectiu de TOTS els reptes actius alhora (multi-repte,
// Fase 2 desbloquejat). Cridada en obrir la pantalla d'admin i en cada cicle
// d'auto-refresh (router.js) — abans només es cridava applyCalendarAutomation()
// per a l'únic repte "actiu" global.
export function applyAllActiveCalendars() {
  state.objectives.filter(o => o.status === 'active').forEach(o => applyPhaseModes(o.id));
}

// ── Canviar el mode (calendari/obert/tancat) d'una fase d'un repte ──
// Cridat pel desplegable corresponent de cada targeta (tematiques.js).
// Persisteix el mode a Supabase i recalcula l'estat efectiu a l'instant.
export async function setPhaseMode(objectiveId, phase, mode) {
  if (!objectiveId || (phase !== 'upload' && phase !== 'voting')) return false;
  if (mode !== 'calendari' && mode !== 'obert' && mode !== 'tancat') return false;

  const patch = {};
  patch[phase + '_mode'] = mode;
  // Regla de negoci heretada de l'antic toggleVotingOpen(): si es força la
  // VOTACIÓ oberta, la PUJADA es tanca a l'instant (no té sentit rebre fotos
  // noves un cop la votació ja ha començat manualment). En mode calendari el
  // marge d'1 dia entre finestres (validat a updateCalendarDate) ja ho evita.
  if (phase === 'voting' && mode === 'obert') patch.upload_mode = 'tancat';

  const { error } = await sb.from('reptes_calendari').upsert({
    objective_id: objectiveId,
    ...patch,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'objective_id' });
  if (error) {
    console.error('setPhaseMode error', error);
    showToast(t('calendar_save_error'), 'error');
    return false;
  }

  let cal = getActiveCalendar(objectiveId);
  if (!cal) {
    cal = { id: '', objectiveId, uploadStart: '', uploadEnd: '', votingStart: '', votingEnd: '', uploadMode: 'calendari', votingMode: 'calendari' };
    (state.reptesCalendari = state.reptesCalendari || []).push(cal);
  }
  if (phase === 'upload') cal.uploadMode = mode;
  if (phase === 'voting') {
    cal.votingMode = mode;
    if (mode === 'obert') cal.uploadMode = 'tancat';
  }

  applyPhaseModes(objectiveId);
  if (typeof window.renderObjectivesList === 'function') window.renderObjectivesList();
  if (typeof window.refreshAdminDashboard === 'function') window.refreshAdminDashboard();
  return true;
}

// ── Editar una data d'un repte (<input type="date"> a la targeta) ──
// field: 'uploadStart' | 'uploadEnd' | 'votingStart' | 'votingEnd'
export async function updateCalendarDate(objectiveId, field, value) {
  if (!objectiveId) return false;
  const existing = getActiveCalendar(objectiveId);
  const draft = {
    uploadStart: existing ? existing.uploadStart : '',
    uploadEnd:   existing ? existing.uploadEnd   : '',
    votingStart: existing ? existing.votingStart : '',
    votingEnd:   existing ? existing.votingEnd   : '',
    uploadMode:  existing ? existing.uploadMode  : 'calendari',
    votingMode:  existing ? existing.votingMode  : 'calendari',
  };
  draft[field] = value || '';

  // Validacions (només si les dues dates del parell hi són) — mateixes regles
  // que abans tenia el "Desar calendari" global.
  if (draft.uploadStart && draft.uploadEnd && draft.uploadStart > draft.uploadEnd) {
    showToast(t('upload_close_before_open'), 'error');
    if (typeof window.renderObjectivesList === 'function') window.renderObjectivesList();
    return false;
  }
  if (draft.votingStart && draft.votingEnd && draft.votingStart > draft.votingEnd) {
    showToast(t('voting_close_before_open'), 'error');
    if (typeof window.renderObjectivesList === 'function') window.renderObjectivesList();
    return false;
  }
  if (draft.uploadEnd && draft.votingStart) {
    const diffDays = (new Date(draft.votingStart) - new Date(draft.uploadEnd)) / 86400000;
    if (diffDays < 1) {
      showToast(t('voting_min_gap'), 'error');
      if (typeof window.renderObjectivesList === 'function') window.renderObjectivesList();
      return false;
    }
  }

  const { error } = await sb.from('reptes_calendari').upsert({
    objective_id: objectiveId,
    upload_start: draft.uploadStart || null,
    upload_end:   draft.uploadEnd   || null,
    voting_start: draft.votingStart || null,
    voting_end:   draft.votingEnd   || null,
    upload_mode:  draft.uploadMode  || 'calendari',
    voting_mode:  draft.votingMode  || 'calendari',
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'objective_id' });
  if (error) {
    console.error('updateCalendarDate error', error);
    showToast(t('calendar_save_error'), 'error');
    return false;
  }

  let cal = getActiveCalendar(objectiveId);
  if (!cal) {
    cal = { id: '', objectiveId, uploadMode: 'calendari', votingMode: 'calendari' };
    (state.reptesCalendari = state.reptesCalendari || []).push(cal);
  }
  cal.uploadStart = draft.uploadStart;
  cal.uploadEnd   = draft.uploadEnd;
  cal.votingStart = draft.votingStart;
  cal.votingEnd   = draft.votingEnd;

  applyPhaseModes(objectiveId);
  if (typeof window.renderObjectivesList === 'function') window.renderObjectivesList();
  if (typeof window.refreshAdminDashboard === 'function') window.refreshAdminDashboard();
  showToast(t('calendar_saved'), 'success');
  return true;
}

// ── Dates del calendari d'un repte, com a bloc HTML de només lectura ──
// NO S'USA ACTUALMENT (revisat 2026-07-18): els reptes FINALITZATS ja NO
// mostren aquest resum de text — mostren la MATEIXA targeta que un repte
// actiu (desplegables + dates), però amb tot `disabled` (visible, bloquejat),
// mateix criteri que "Eliminar i Tornar a Pujar" quan la pujada és tancada.
// Es deixa la funció per si calgués un resum de només lectura en un altre
// lloc (p. ex. filtres de galeria).
export function getCalendariDatesHtml(objectiveId) {
  const cal = (state.reptesCalendari || []).find(c => c.objectiveId === objectiveId);
  if (!cal || !(cal.uploadStart || cal.uploadEnd || cal.votingStart || cal.votingEnd)) return '';

  // 'YYYY-MM-DD' → 'DD-MM-YY' (només per mostrar; internament tot segueix en ISO)
  const fmt = d => d ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(2, 4)}` : '—';
  const range = (a, b) => (a || b) ? `${fmt(a)} → ${fmt(b)}` : '—';

  return `<div class="obj-dates">
    <span title="${t('cal_upload_label')}">📤 ${range(cal.uploadStart, cal.uploadEnd)}</span>
    <span title="${t('cal_voting_label')}">🗳️ ${range(cal.votingStart, cal.votingEnd)}</span>
  </div>`;
}

// Exposar per als onchange inserits per tematiques.js (un joc per repte)
window.setPhaseMode = setPhaseMode;
window.updateCalendarDate = updateCalendarDate;
