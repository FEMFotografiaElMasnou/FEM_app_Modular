// ═══════════════════════════════════
// CALENDARI — programació de dates (subida/votació) i històric per repte.
// El motor real (aplicar toggles a la data) el fa pg_cron dins de Supabase;
// aquí només editem les dates/switch i mostrem l'històric. Veure sql/reptes_calendari.sql
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { sb } from '../core/config.js';
import { currentLang } from '../core/i18n.js';
import { showToast } from '../ui/toast.js';
import { getActiveObjectiveId, loadAllData, saveSettings } from '../core/data.js';

// Fila de calendari del repte actiu (o null)
export function getActiveCalendar() {
  const objId = getActiveObjectiveId();
  if (!objId) return null;
  return (state.reptesCalendari || []).find(c => c.objectiveId === objId) || null;
}

// El calendari gestiona pujada/votació del repte actiu? (switch ON amb fila)
export function isCalendarAutomationActive() {
  const cal = getActiveCalendar();
  return !!(cal && cal.automationEnabled);
}

// ── Aplicar l'estat que dicta el calendari SENSE esperar el cron ──
// Replica la lògica de fem_apply_calendar() (sql/reptes_calendari.sql) al front:
// si el repte actiu té automatització ON, ajusta uploads/voting/names segons la
// data d'avui i, si canvia res, ho persisteix a Supabase perquè els socis també
// ho vegin. La part que toca state.settings és SÍNCRONA (els toggles es poden
// pintar tot seguit); el desat va en segon pla.
// Nota: usem la data en UTC (toISOString) per coincidir amb current_date del cron.
export function applyCalendarAutomation() {
  const cal = getActiveCalendar();
  if (!cal || !cal.automationEnabled) return false;

  const today = new Date().toISOString().slice(0, 10);   // 'YYYY-MM-DD' (UTC)
  const inRange = (start, end) => !!(start && end && today >= start && today <= end);

  const wantUpload = inRange(cal.uploadStart, cal.uploadEnd);
  const wantVoting = inRange(cal.votingStart, cal.votingEnd);
  const wantReveal = !!(cal.votingEnd && today > cal.votingEnd);

  let changed = false;
  if (state.settings.uploads_enabled !== wantUpload) { state.settings.uploads_enabled = wantUpload; changed = true; }
  if (state.settings.voting_enabled  !== wantVoting) { state.settings.voting_enabled  = wantVoting; changed = true; }
  if (wantReveal && !state.settings.namesRevealed)   { state.settings.namesRevealed   = true;       changed = true; }

  if (changed) saveSettings();   // fire-and-forget: persisteix en segon pla
  return changed;
}

// ── Render de la card d'edició (dates + switch) ──
export function renderCalendariCard() {
  const objId = getActiveObjectiveId();
  const wrap  = document.getElementById('calendari-card');
  if (!wrap) return;

  // Sense repte actiu: bloquejar
  const noObj = document.getElementById('calendari-no-obj');
  const form  = document.getElementById('calendari-form');
  if (!objId) {
    if (noObj) noObj.classList.remove('hidden');
    if (form)  form.classList.add('hidden');
    return;
  }
  if (noObj) noObj.classList.add('hidden');
  if (form)  form.classList.remove('hidden');

  const cal = getActiveCalendar();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('cal-upload-start', cal && cal.uploadStart);
  set('cal-upload-end',   cal && cal.uploadEnd);
  set('cal-voting-start', cal && cal.votingStart);
  set('cal-voting-end',   cal && cal.votingEnd);
  const auto = document.getElementById('cal-automation');
  if (auto) auto.checked = cal ? !!cal.automationEnabled : true;
  syncAutomationButton();
}

// Reflecteix l'estat del checkbox ocult al botó de plàstic
function syncAutomationButton() {
  const cb  = document.getElementById('cal-automation');
  const btn = document.getElementById('pbtn-cal-automation');
  if (cb && btn) btn.classList.toggle('on', cb.checked);
}

// Botó de plàstic "Automatització": commuta el checkbox i DESA el switch a l'instant
// (només el switch; les dates segueixen desant-se amb "Desar calendari"). Cal persistir-ho
// al moment perquè el bloqueig dels toggles i el cron llegeixen automation_enabled de la BD:
// si quedés només en pantalla, el cron re-aplicaria el calendari a les 00:05.
export async function toggleCalAutomation() {
  const cb = document.getElementById('cal-automation');
  if (!cb) return;
  const isES  = currentLang === 'es';
  const objId = getActiveObjectiveId();
  if (!objId) { showToast(isES ? 'No hay temática activa' : 'No hi ha temàtica activa', 'error'); return; }

  cb.checked = !cb.checked;
  syncAutomationButton();

  const { error } = await sb.from('reptes_calendari').upsert({
    objective_id:       objId,
    automation_enabled: cb.checked,
    updated_at:         new Date().toISOString(),
  }, { onConflict: 'objective_id' });

  if (error) {
    console.error('toggleCalAutomation error', error);
    cb.checked = !cb.checked;   // revertir: no s'ha pogut desar
    syncAutomationButton();
    showToast(isES ? '❌ Error al guardar la automatización' : '❌ Error en desar l\'automatització', 'error');
    return;
  }

  // Reflectir-ho a l'estat local sense esperar cap recàrrega
  let cal = getActiveCalendar();
  if (!cal) {
    cal = { id: '', objectiveId: objId, uploadStart: '', uploadEnd: '', votingStart: '', votingEnd: '', automationEnabled: cb.checked };
    (state.reptesCalendari = state.reptesCalendari || []).push(cal);
  } else {
    cal.automationEnabled = cb.checked;
  }

  // ON: el calendari mana ja → aplicar dates i repintar els toggles amb l'estat resultant
  if (cb.checked) applyCalendarAutomation();
  const cbU = document.getElementById('toggle-upload');
  const cbV = document.getElementById('toggle-voting');
  if (cbU) cbU.checked = !!state.settings.uploads_enabled;
  if (cbV) cbV.checked = !!state.settings.voting_enabled;
  if (typeof window.syncPlasticButtons === 'function') window.syncPlasticButtons();

  showToast(cb.checked
    ? (isES ? '⚡ Automatización activada: el calendario manda' : '⚡ Automatització activada: el calendari mana')
    : (isES ? 'Automatización desactivada: toggles manuales' : 'Automatització desactivada: toggles manuals'), 'success');
}

// ── Guardar dates + switch (upsert per objective_id) ──
export async function saveCalendari() {
  const objId = getActiveObjectiveId();
  if (!objId) { showToast(currentLang === 'es' ? 'No hay temática activa' : 'No hi ha temàtica activa', 'error'); return; }

  const val = id => {
    const el = document.getElementById(id);
    const v = el ? el.value.trim() : '';
    return v || null;
  };
  const uStart = val('cal-upload-start');
  const uEnd   = val('cal-upload-end');
  const vStart = val('cal-voting-start');
  const vEnd   = val('cal-voting-end');
  const auto   = !!(document.getElementById('cal-automation') && document.getElementById('cal-automation').checked);

  const isES = currentLang === 'es';

  // Validacions (només si les dues dates del parell hi són)
  if (uStart && uEnd && uStart > uEnd) {
    showToast(isES ? 'La subida no puede cerrar antes de abrir' : 'La pujada no pot tancar abans d\'obrir', 'error'); return;
  }
  if (vStart && vEnd && vStart > vEnd) {
    showToast(isES ? 'La votación no puede cerrar antes de abrir' : 'La votació no pot tancar abans d\'obrir', 'error'); return;
  }
  // Marge d'1 dia entre tancar subida i obrir votació
  if (uEnd && vStart) {
    const diffDays = (new Date(vStart) - new Date(uEnd)) / 86400000;
    if (diffDays < 1) {
      showToast(isES
        ? 'La votación debe abrir al menos 1 día después de cerrar la subida'
        : 'La votació ha d\'obrir com a mínim 1 dia després de tancar la pujada', 'error');
      return;
    }
  }

  const { error } = await sb.from('reptes_calendari').upsert({
    objective_id:       objId,
    upload_start:       uStart,
    upload_end:         uEnd,
    voting_start:       vStart,
    voting_end:         vEnd,
    automation_enabled: auto,
    updated_at:         new Date().toISOString(),
  }, { onConflict: 'objective_id' });

  if (error) {
    console.error('saveCalendari error', error);
    showToast(isES ? '❌ Error al guardar el calendario' : '❌ Error en desar el calendari', 'error');
    return;
  }

  await loadAllData();
  renderCalendariCard();
  // Refrescar les dates a les targetes de Temàtiques (via window per evitar import circular)
  if (typeof window.renderObjectivesList === 'function') window.renderObjectivesList();
  showToast(isES ? '✅ Calendario guardado' : '✅ Calendari desat', 'success');
}

// ── Dates del calendari d'un repte, com a bloc HTML per a la targeta de Temàtiques ──
// (substitueix la card "Històric de reptes" del dashboard; l'estat Obert/Tancat ja el
// dóna el badge propi de la temàtica, aquí només les dates)
export function getCalendariDatesHtml(objectiveId) {
  const cal = (state.reptesCalendari || []).find(c => c.objectiveId === objectiveId);
  if (!cal || !(cal.uploadStart || cal.uploadEnd || cal.votingStart || cal.votingEnd)) return '';

  const isES = currentLang === 'es';
  // 'YYYY-MM-DD' → 'DD-MM-YY' (només per mostrar; internament tot segueix en ISO)
  const fmt = d => d ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(2, 4)}` : '—';
  const range = (a, b) => (a || b) ? `${fmt(a)} → ${fmt(b)}` : '—';

  return `<div class="obj-dates">
    <span title="${isES ? 'Subida' : 'Pujada'}">📤 ${range(cal.uploadStart, cal.uploadEnd)}</span>
    <span title="${isES ? 'Votación' : 'Votació'}">🗳️ ${range(cal.votingStart, cal.votingEnd)}</span>
  </div>`;
}

// Exposar per als onclick del HTML
window.saveCalendari = saveCalendari;
window.toggleCalAutomation = toggleCalAutomation;
