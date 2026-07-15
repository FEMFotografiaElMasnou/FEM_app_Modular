// ═══════════════════════════════════
// RANKING — cálculo client-side y render
// ═══════════════════════════════════
import { state, actingAsAdmin } from '../core/state.js';
import { t } from '../core/i18n.js';
import { getActivePublishedPhotos, getDisplayName } from '../core/data.js';

// ── Taula de punts per posició al rànquing global ───────────────
const POSITION_POINTS = [25, 18, 15, 12, 10, 8, 7, 6, 5, 4];

export function getPointsForPosition(position) {
  // position: 1-indexed
  if (position <= 10) return POSITION_POINTS[position - 1];
  // Posició 11 → 1.0099, 12 → 1.0098, 13 → 1.0097...
  const decimalOffset = (position - 10) / 10000; // 11→0.0001, 12→0.0002…
  return 1.01 - decimalOffset;
}

// Assigna punts de tabla a una llista ordenada de fotos amb score.
export function assignPositionPoints(rankedList) {
  const result = [];
  let lastAssignedPosition = 0;
  let previousScore = null;

  rankedList.forEach((item) => {
    let effectivePosition;
    if (previousScore !== null && item.score === previousScore) {
      // Empat: hereta la mateixa posició que l'anterior
      effectivePosition = lastAssignedPosition;
    } else {
      // No empat: posició consecutiva (no es salta encara que hi hagi hagut empats)
      effectivePosition = lastAssignedPosition + 1;
    }
    result.push({
      ...item,
      position: effectivePosition,
      points: getPointsForPosition(effectivePosition),
    });
    lastAssignedPosition = effectivePosition;
    previousScore = item.score;
  });

  return result;
}

// Format a 0–5 score with 2 decimals and Catalan comma (e.g. 4.2333 → "4,23")
export function formatScore(score) {
  if (typeof score !== 'number' || isNaN(score)) return '0,00';
  return score.toFixed(2).replace('.', ',');
}

export function getPhotoScoreBreakdown(photoId) {
  // Desglossament de la puntuació d'una foto: mitja per criteri + nota final.
  const empty = { creativity: 0, theme: 0, composition: 0, final: 0 };

  // 1) Trobar la foto i el seu objectiveId (publicada o no: el repte actiu pot
  //    tenir fotos pujades encara no publicades, que l'admin també vol veure)
  const photo = state.publishedPhotos.find(p => p.id === photoId)
             || state.photos.find(p => p.id === photoId);
  if (!photo || !photo.objectiveId) return empty;
  const objectiveId = photo.objectiveId;

  // 2) Set de userIds que han ENVIAT (es_esborrany=false) en aquest repte.
  const submittedUserIds = new Set();
  for (const [key, val] of Object.entries(state.submittedVoting || {})) {
    if (!val || val.es_esborrany !== false) continue;
    const sepIdx = key.lastIndexOf('__');
    if (sepIdx === -1) continue;
    const uid = key.slice(0, sepIdx);
    const oid = key.slice(sepIdx + 2);
    if (oid === String(objectiveId)) submittedUserIds.add(uid);
  }

  const totalVotants = submittedUserIds.size;
  if (totalVotants === 0) return empty;

  // 3) Vots d'aquesta foto, només dels votants que han enviat
  const photoVotes = state.votes.filter(
    v => v.photoId === photoId && submittedUserIds.has(String(v.userId))
  );
  if (photoVotes.length === 0) return empty;

  // 4) Mitja per criteri: suma dels vots vàlids / total de votants del repte
  const avgCriterion = (key) => {
    const sum = photoVotes
      .filter(v => v[key] > 0)
      .reduce((acc, v) => acc + v[key], 0);
    return sum / totalVotants;
  };

  const creativity  = avgCriterion('creativity');
  const theme       = avgCriterion('theme');
  const composition = avgCriterion('composition');

  return { creativity, theme, composition, final: (creativity + theme + composition) / 3 };
}

export function getPhotoScore(photoId) {
  // Puntuació final d'una fotografia dins del repte (mitja de les 3 mitges de criteri).
  return getPhotoScoreBreakdown(photoId).final;
}

// Rànquing detallat d'un repte concret (per id), ordenat per nota final.
//   · repte finalitzat → només les fotos que van concursar (publicades)
//   · repte no finalitzat (actual/inactiu, només visible per l'admin) → totes les
//     fotos pujades, encara que no estiguin publicades, per veure'n l'estat.
export function computeRankingForObjective(objId) {
  const obj = state.objectives.find(o => o.id === objId);
  const isFinished = !!(obj && obj.status === 'finished');
  const pool = isFinished
    ? state.publishedPhotos.filter(p => p.objectiveId === objId)
    : [...state.publishedPhotos, ...state.photos].filter(p => p.objectiveId === objId);
  return pool
    .map(photo => ({ photo, ...getPhotoScoreBreakdown(photo.id) }))
    .sort((a, b) => b.final - a.final);
}

// Nom real de l'autor (els reptes finalitzats no són anònims; com a la galeria).
function _authorName(userId) {
  const u = state.users.find(x => x.id === userId);
  return (u && u.name) ? u.name : '—';
}

// Pinta el rànquing detallat (nota final + 3 criteris) d'un repte finalitzat.
export function renderResultatsRepte(objId, listId) {
  const el = document.getElementById(listId);
  if (!el) return;
  const ranked = computeRankingForObjective(objId);
  if (ranked.length === 0) {
    const msg = t('no_data_voting');
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>${msg}</p></div>`;
    return;
  }
  const rankNums = ['gold', 'silver', 'bronze'];
  el.innerHTML = ranked.map(({ photo, creativity, theme, composition, final }, idx) => `
    <div class="rank-item rank-item-detailed">
      <div class="rank-num ${rankNums[idx] || ''}">${idx + 1}</div>
      <img class="rank-thumb" src="${photo.url}" alt="">
      <div class="rank-info">
        <div class="rank-name">${_authorName(photo.userId)}</div>
        <div class="rank-criteria">
          <span>${t('creativity')} ${formatScore(creativity)}</span>
          <span>${t('composition')} ${formatScore(composition)}</span>
          <span>${t('theme')} ${formatScore(theme)}</span>
        </div>
      </div>
      <div class="rank-score">${formatScore(final)}</div>
    </div>
  `).join('');
}

export function computeCurrentRanking() {
  // Solo fotos de la temática activa
  return getActivePublishedPhotos().map(photo => ({
    photo,
    score: getPhotoScore(photo.id),
  })).sort((a, b) => b.score - a.score);
}

export function computeGeneralRanking() {
  // El rànquing global només mostra punts ja acumulats al finalitzar reptes.
  return Object.entries(state.generalRanking)
    .map(([userId, data]) => {
      const user = state.users.find(u => u.id === userId);
      return {
        user: user || { name: t('unknown_user'), id: userId },
        participations: data.participations || 0,
        totalScore: data.totalScore || 0,
      };
    })
    .filter(g => g.participations > 0)
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function renderRanking(currentListId, generalListId) {
  const rankNums = ['gold','silver','bronze'];
  const isAdmin = actingAsAdmin();

  // Current
  const ranked   = computeCurrentRanking();
  const currentEl = document.getElementById(currentListId);
  if (currentEl) {
    if (!isAdmin && !state.settings.namesRevealed) {
      currentEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>${t('ranking_locked_msg')}</p></div>`;
    } else if (ranked.length === 0) {
      currentEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>${t('no_data_voting')}</p></div>`;
    } else {
      currentEl.innerHTML = ranked.map(({ photo, score }, idx) => `
        <div class="rank-item">
          <div class="rank-num ${rankNums[idx]||''}">${idx+1}</div>
          <img class="rank-thumb" src="${photo.url}" alt="">
          <div class="rank-info">
            <div class="rank-name">${getDisplayName(photo.userId)}</div>
            <div class="rank-meta">${formatScore(score)} ${t('points_label')}</div>
          </div>
          <div class="rank-score">${formatScore(score)}</div>
        </div>
      `).join('');
    }
  }

  // General — ocultar a participantes si rankingHidden está activo
  const general   = computeGeneralRanking();
  const generalEl = document.getElementById(generalListId);
  if (generalEl) {
    // Si no es admin y el ranking está oculto, mostrar mensaje
    if (!isAdmin && state.settings.rankingHidden) {
      generalEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🔒</div><p>${t('general_ranking_hidden_msg')}</p></div>`;
    } else {
      const active = general.filter(g => g.participations > 0);
      if (active.length === 0) {
        generalEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🏅</div><p>${t('no_participations')}</p></div>`;
      } else {
        generalEl.innerHTML = active.map(({ user, participations, totalScore }, idx) => `
          <div class="rank-item">
            <div class="rank-num ${rankNums[idx]||''}">${idx+1}</div>
            <div class="rank-info">
              <div class="rank-name">${user.name}</div>
              <div class="rank-meta">${participations} ${t('participations')}</div>
            </div>
            <div class="rank-score">${Math.trunc(totalScore)}</div>
          </div>
        `).join('');
      }
    }
  }
}

window.renderRanking = renderRanking;
