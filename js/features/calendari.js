// ═══════════════════════════════════
// CALENDARI — programació de dates (subida/votació) i històric per repte.
// El motor real (aplicar toggles a la data) el fa pg_cron dins de Supabase;
// aquí només editem les dates/switch i mostrem l'històric. Veure sql/reptes_calendari.sql
// ═══════════════════════════════════
import { state } from '../core/state.js';
import { sb } from '../core/config.js';
import { currentLang, t } from '../core/i18n.js';
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

// ═══ CALENDARI VISUAL (rejilla de mes) ═══
// La card és alhora l'històric (franges de tots els reptes, amb nom als acabats)
// i l'editor del repte actiu: amb un chip actiu, clic marca el dia, un altre clic
// omple el rang automàticament i clic sobre el marcat l'esborra. Res no es
// persisteix fins a "Desar calendari" (esborrany a calDraft).
const _avui = new Date();
let calView  = { year: _avui.getFullYear(), month: _avui.getMonth() };  // mes mostrat (month 0-11)
let calMode  = null;   // 'upload' | 'voting' | null — chip actiu
let calDraft = null;   // esborrany de dates del repte actiu (dirty = canvis sense desar)

const MONTHS_CA = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DOW_CA = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];
const DOW_ES = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

// y/m(0-11)/d → 'YYYY-MM-DD' (els rangs es comparen com a strings ISO)
const isoDate = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ── Render de la card (estat del draft + switch + rejilla) ──
export function renderCalendariCard() {
  const wrap = document.getElementById('calendari-card');
  if (!wrap) return;

  const objId = getActiveObjectiveId();
  const noObj = document.getElementById('calendari-no-obj');
  const form  = document.getElementById('calendari-form');
  // Sense repte actiu es pot consultar l'històric igualment; només s'amaga l'edició
  if (noObj) noObj.classList.toggle('hidden', !!objId);
  if (form)  form.classList.remove('hidden');

  // Esborrany del repte actiu: es crea/refresca des de l'estat persistit,
  // però MAI es trepitgen canvis pendents (dirty) — l'auto-refresh passa per aquí
  if (objId) {
    const cal = getActiveCalendar();
    if (!calDraft || calDraft.objectiveId !== objId) {
      calDraft = {
        objectiveId: objId,
        uploadStart: cal ? cal.uploadStart : '', uploadEnd: cal ? cal.uploadEnd : '',
        votingStart: cal ? cal.votingStart : '', votingEnd: cal ? cal.votingEnd : '',
        dirty: false,
      };
      calMode = null;
    } else if (!calDraft.dirty && cal) {
      calDraft.uploadStart = cal.uploadStart; calDraft.uploadEnd = cal.uploadEnd;
      calDraft.votingStart = cal.votingStart; calDraft.votingEnd = cal.votingEnd;
    }
  } else {
    calDraft = null; calMode = null;
  }

  const auto = document.getElementById('cal-automation');
  if (auto) { const cal = getActiveCalendar(); auto.checked = cal ? !!cal.automationEnabled : true; }
  syncAutomationButton();
  renderCalMonth();
}

// ── Render del mes visible (títol, chips i rejilla) ──
function renderCalMonth() {
  const titleEl = document.getElementById('cal-month-title');
  const grid    = document.getElementById('cal-grid');
  if (!titleEl || !grid) return;

  const isES  = currentLang === 'es';
  const objId = getActiveObjectiveId();
  titleEl.textContent = `${(isES ? MONTHS_ES : MONTHS_CA)[calView.month]} ${calView.year}`;

  // Chips i botons d'acció: només amb repte actiu
  const modeRow    = document.getElementById('cal-mode-row');
  const actionsRow = document.getElementById('cal-actions-row');
  if (modeRow)    modeRow.style.display    = objId ? '' : 'none';
  if (actionsRow) actionsRow.style.display = objId ? '' : 'none';
  const chipU = document.getElementById('cal-mode-upload');
  const chipV = document.getElementById('cal-mode-voting');
  if (chipU) chipU.classList.toggle('active', calMode === 'upload');
  if (chipV) chipV.classList.toggle('active', calMode === 'voting');

  // Rangs a pintar: tots els reptes de reptes_calendari; el repte actiu surt del draft
  // (previsualització dels canvis abans de desar). Nom del repte només als acabats.
  const ranges = [];
  (state.reptesCalendari || []).forEach(c => {
    if (calDraft && c.objectiveId === calDraft.objectiveId) return;   // el pinta el draft
    const o = state.objectives.find(o => o.id === c.objectiveId);
    const name = (o && o.status === 'finished') ? o.title : (o ? o.title : c.objectiveId);
    if (c.uploadStart && c.uploadEnd) ranges.push({ start: c.uploadStart, end: c.uploadEnd, cls: 'cal-up',   name });
    if (c.votingStart && c.votingEnd) ranges.push({ start: c.votingStart, end: c.votingEnd, cls: 'cal-vote', name });
  });
  if (calDraft) {
    if (calDraft.uploadStart && calDraft.uploadEnd) ranges.push({ start: calDraft.uploadStart, end: calDraft.uploadEnd, cls: 'cal-up',   name: '' });
    if (calDraft.votingStart && calDraft.votingEnd) ranges.push({ start: calDraft.votingStart, end: calDraft.votingEnd, cls: 'cal-vote', name: '' });
  }

  const daysInMonth = new Date(calView.year, calView.month + 1, 0).getDate();
  const firstDow    = (new Date(calView.year, calView.month, 1).getDay() + 6) % 7;  // dilluns = 0
  const avui        = new Date();
  const todayIso    = isoDate(avui.getFullYear(), avui.getMonth(), avui.getDate());

  let html = (isES ? DOW_ES : DOW_CA).map(d => `<div class="cal-dow">${d}</div>`).join('');
  for (let i = 0; i < firstDow; i++) html += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dIso = isoDate(calView.year, calView.month, d);
    let cls = 'cal-day', label = '', tip = '';
    for (const r of ranges) {
      if (dIso < r.start || dIso > r.end) continue;
      cls += ' ' + r.cls;
      if (dIso === r.start) cls += ' r-start';
      if (dIso === r.end)   cls += ' r-end';
      if (r.name) {
        tip = r.name;
        // Nom del repte al 1r dia de la franja i al 1r dia de cada setmana que travessa
        const col = (firstDow + d - 1) % 7;
        if (dIso === r.start || col === 0) label = r.name;
      }
    }
    if (dIso === todayIso)     cls += ' cal-today';
    if (calMode && objId)      cls += ' clickable';
    html += `<div class="${cls}"${tip ? ` title="${tip}"` : ''}${objId ? ` onclick="calDayClick('${dIso}')"` : ''}>`
          + `<span class="cal-num">${d}</span>${label ? `<span class="cal-name">${label}</span>` : ''}</div>`;
  }
  grid.innerHTML = html;
}

// ── Navegació de mes (fletxes ‹ ›). El rang a mig marcar sobreviu entre mesos ──
export function calNavMonth(delta) {
  let m = calView.month + delta, y = calView.year;
  if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
  calView = { year: y, month: m };
  renderCalMonth();
}

// ── Chip de mode: què estàs marcant (tornar a clicar el chip actiu el desactiva) ──
export function calSetMode(mode) {
  calMode = calMode === mode ? null : mode;
  if (calMode) {
    showToast(t('cal_mode_hint'), 'info');
  }
  renderCalMonth();
}

// ── Clic en un dia (chip actiu) — el calendari omple sol: ──
// · sense rang → marca aquest dia (rang d'1 dia)
// · amb rang i clic a fora → estén el rang fins al dia clicat (omple entremig)
// · clic sobre el rang ja marcat → l'esborra sencer (per rectificar)
export function calDayClick(dateIso) {
  if (!calDraft) return;
  if (!calMode) {
    showToast(t('cal_choose_mode_first'), 'info');
    return;
  }
  const ks = calMode === 'upload' ? 'uploadStart' : 'votingStart';
  const ke = calMode === 'upload' ? 'uploadEnd'   : 'votingEnd';
  const start = calDraft[ks], end = calDraft[ke];

  if (start && end && dateIso >= start && dateIso <= end) {
    calDraft[ks] = ''; calDraft[ke] = '';                       // esborrar el rang
  } else if (!start || !end) {
    calDraft[ks] = dateIso; calDraft[ke] = dateIso;             // primer dia marcat
  } else if (dateIso < start) {
    calDraft[ks] = dateIso;                                     // omplir cap enrere
  } else {
    calDraft[ke] = dateIso;                                     // omplir cap endavant
  }
  calDraft.dirty = true;
  renderCalMonth();
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
  const objId = getActiveObjectiveId();
  if (!objId) { showToast(t('no_active_objective_short'), 'error'); return; }

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
    showToast(t('automation_save_error'), 'error');
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

  showToast(cb.checked ? t('automation_enabled_msg') : t('automation_disabled_msg'), 'success');
}

// ── Guardar dates + switch (upsert per objective_id) — llegeix de l'esborrany ──
export async function saveCalendari() {
  const objId = getActiveObjectiveId();
  if (!objId || !calDraft) { showToast(t('no_active_objective_short'), 'error'); return; }

  const uStart = calDraft.uploadStart || null;
  const uEnd   = calDraft.uploadEnd   || null;
  const vStart = calDraft.votingStart || null;
  const vEnd   = calDraft.votingEnd   || null;
  const auto   = !!(document.getElementById('cal-automation') && document.getElementById('cal-automation').checked);

  // Validacions (només si les dues dates del parell hi són)
  if (uStart && uEnd && uStart > uEnd) {
    showToast(t('upload_close_before_open'), 'error'); return;
  }
  if (vStart && vEnd && vStart > vEnd) {
    showToast(t('voting_close_before_open'), 'error'); return;
  }
  // Marge d'1 dia entre tancar subida i obrir votació
  if (uEnd && vStart) {
    const diffDays = (new Date(vStart) - new Date(uEnd)) / 86400000;
    if (diffDays < 1) {
      showToast(t('voting_min_gap'), 'error');
      return;
    }
  }

  // Il·luminar el botó mentre dura el desat (mateix efecte .on que els toggles)
  const saveBtn = document.getElementById('pbtn-cal-save');
  if (saveBtn) saveBtn.classList.add('on');
  try {
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
      showToast(t('calendar_save_error'), 'error');
      return;
    }

    if (calDraft) calDraft.dirty = false;   // desat: l'esborrany torna a seguir l'estat persistit
    await loadAllData();
    renderCalendariCard();
    // Refrescar les dates a les targetes de Temàtiques (via window per evitar import circular)
    if (typeof window.renderObjectivesList === 'function') window.renderObjectivesList();
    showToast(t('calendar_saved'), 'success');
  } finally {
    if (saveBtn) saveBtn.classList.remove('on');
  }
}

// ── Dates del calendari d'un repte, com a bloc HTML per a la targeta de Temàtiques ──
// (substitueix la card "Històric de reptes" del dashboard; l'estat Obert/Tancat ja el
// dóna el badge propi de la temàtica, aquí només les dates)
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

// Exposar per als onclick del HTML
window.saveCalendari = saveCalendari;
window.toggleCalAutomation = toggleCalAutomation;
window.calNavMonth = calNavMonth;
window.calSetMode = calSetMode;
window.calDayClick = calDayClick;
