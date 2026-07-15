// ═══════════════════════════════════
// FOTOS — galería admin, selección, publicación, subida y compresión
// ═══════════════════════════════════
import { state, actingAsAdmin } from '../core/state.js';
import { sb, CLOUDINARY_PRESET, CLOUDINARY_URL, _dbMode } from '../core/config.js';
import { currentLang, t } from '../core/i18n.js';
import { showToast, showLoader, hideLoader } from '../ui/toast.js';
import { confirmAction } from '../ui/modals.js';
import { getActiveAllPhotos, getParticipantNumber, loadAllData } from '../core/data.js';
import { renderAdminVotingGrid, renderVotingGrid, resetVoteButtons } from './votacio.js';
import { refreshAdminDashboard } from '../screens/admin.js';
import { refreshParticipantDashboard, getButtonVisibility } from '../screens/participant.js';
import { renderVoteMosaic } from './galeria.js';
import { getActiveCalendar } from './calendari.js';

// ═══════════════════════════════════
// ADMIN GALLERY
// ═══════════════════════════════════

// Escapa text per inserir-lo en HTML de forma segura
function _escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Formata una data ISO "AAAA-MM-DD" (com es desa a reptes_calendari.voting_end)
// com "DD-MM-AAAA". Fem servir slicing de string, no new Date(), pel mateix
// motiu que getCalendariDatesHtml() a calendari.js: evita que un parsing amb
// fus horari desplaci el dia. Retorna '' si la data no és vàlida/no existeix
// (qui la crida fa fallback al text genèric en aquest cas).
function _formatDateEs(dateVal) {
  if (!dateVal || typeof dateVal !== 'string' || dateVal.length < 10) return '';
  const yyyy = dateVal.slice(0, 4), mm = dateVal.slice(5, 7), dd = dateVal.slice(8, 10);
  return `${dd}-${mm}-${yyyy}`;
}

// Nom real de l'autor. Només per al panell d'admin: aquí no s'aplica
// l'anonimat de la votació (getDisplayName), l'admin gestiona i ha de saber qui és qui.
function _authorName(userId) {
  const u = state.users.find(x => x.id === userId);
  return (u && u.name) ? u.name : '—';
}

export function renderAdminGallery() {
  const grid      = document.getElementById('admin-gallery');
  // Solo fotos de la temática activa (las pasadas se ven desde Gestión de Temáticas)
  const allPhotos = getActiveAllPhotos();

  // Contador de fotos (total · publicadas · pendientes) en la cabecera
  const countEl = document.getElementById('admin-gallery-count');
  if (countEl) {
    const total     = allPhotos.length;
    const published = allPhotos.filter(p => p.published).length;
    const pending   = total - published;
    countEl.textContent = currentLang === 'es'
      ? `Total: ${total} · Publicadas: ${published} · Pendientes: ${pending}`
      : `Total: ${total} · Publicades: ${published} · Pendents: ${pending}`;
  }

  if (allPhotos.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">📷</div><p>No s'han rebut fotos encara.</p></div>`;
    return;
  }

  grid.innerHTML = allPhotos.map(photo => {
    const isSelected = state.selectedPhotos.has(photo.id);
    const num = getParticipantNumber(photo.userId);
    const fname = photo.fileName || 'foto_' + num + '.jpg';
    const author = _escape(_authorName(photo.userId));
    const caption = _escape(photo.caption);
    return `
      <div class="gallery-item ${isSelected ? 'selected' : ''}" onclick="toggleSelectPhoto('${photo.id}')" data-id="${photo.id}">
        <div class="gallery-thumb">
          <img src="${photo.url}" alt="Photo" loading="lazy" ondblclick="event.stopPropagation(); openFullscreen('${photo.url}', '${fname}')" title="Clic: seleccionar · Doble clic: ampliar" style="cursor:pointer;">
          <div class="gallery-actions">
            <button type="button" class="gallery-act-btn" onclick="event.stopPropagation(); openFullscreen('${photo.url}', '${fname}')" title="Ampliar">🔍</button>
            <button type="button" class="gallery-act-btn" onclick="event.stopPropagation(); downloadPhoto('${photo.url}', '${fname}')" title="Descarregar">⬇</button>
          </div>
          <div class="check-overlay">✓</div>
          <div class="participant-num">
            ${photo.published ? '✅' : '⏳'}
          </div>
        </div>
        <div class="gallery-meta">
          <div class="gallery-author">#${num} · ${author}</div>
          ${caption ? `<div class="gallery-caption" title="${caption}">${caption}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Mostrar/ocultar botón eliminar según selección activa
  const btnDelete = document.getElementById('btn-delete-selected');
  if (btnDelete) {
    state.selectedPhotos.size > 0 ? btnDelete.classList.remove('hidden') : btnDelete.classList.add('hidden');
  }
}

export function toggleSelectPhoto(photoId) {
  state.selectedPhotos.has(photoId) ? state.selectedPhotos.delete(photoId) : state.selectedPhotos.add(photoId);
  renderAdminGallery();
}

export async function deleteSelectedPhotos() {
  if (state.selectedPhotos.size === 0) { showToast(t('select_photo'), 'error'); return; }
  confirmAction('Eliminar Fotos', `Vols eliminar ${state.selectedPhotos.size} foto(s)?`, async () => {
    const ids = [...state.selectedPhotos];
    // Delete votes referencing these photos first (FK)
    await sb.from('votes').delete().in('photo_id', ids);
    await sb.from('photo_submissions').delete().in('id', ids);
    state.selectedPhotos.clear();
    state.selectMode = false;
    document.getElementById('btn-delete-selected').classList.add('hidden');
    await loadAllData();
    renderAdminGallery();
    refreshAdminDashboard();
    showToast(t('photos_deleted'), 'success');
  });
}

export async function publishSelectedPhotos() {
  const btn = document.getElementById('btn-publish');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.innerHTML = '<span class="loader"></span>'; btn.disabled = true; }
  showLoader(currentLang === 'es' ? 'Publicando fotos...' : 'Publicant fotos...');

  const toPublish = state.selectedPhotos.size > 0
    ? state.photos.filter(p => state.selectedPhotos.has(p.id))
    : [...state.photos];

  if (toPublish.length === 0) {
    showToast(t('no_pending_photos'), 'error');
    hideLoader();
    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
    return;
  }

  // Update published=true in Supabase for each photo
  const ids = toPublish.map(p => p.id);
  await sb.from('photo_submissions').update({ published: true }).in('id', ids);

  state.selectedPhotos.clear();
  document.getElementById('btn-delete-selected').classList.add('hidden');

  await loadAllData();
  hideLoader();
  if (btn) { btn.innerHTML = origText || (currentLang === 'es' ? 'Publicar Fotos' : 'Publicar Fotos'); btn.disabled = false; }

  renderAdminGallery();
  renderAdminVotingGrid();
  refreshAdminDashboard();
  showToast(toPublish.length + ' foto(s) publicada(s) ✅', 'success');
}

// ═══════════════════════════════════
// UPLOAD SECTION (función común)
// ═══════════════════════════════════
export function updateUploadSection() {
  // Solo cuenta como "ya subida" si pertenece a la temática activa
  const myPhoto    = getActiveAllPhotos().find(p => p.userId === state.currentUser.id);
  const uploadSect = document.getElementById('upload-section');
  const doneSect   = document.getElementById('upload-done-section');
  const prevSect   = document.getElementById('upload-preview-section');
  const labelEl    = document.getElementById('upload-status-label');
  const uploadZone = document.getElementById('upload-zone');
  const closedMsg  = document.getElementById('upload-closed-msg');
  const closedText = document.getElementById('upload-closed-text');
  const objectiveCard = document.getElementById('card-objective-photo');
  const voteSection    = document.getElementById('vote-mosaic-section');
  const voteTitleEl    = document.getElementById('vote-mosaic-title');
  const voteSubEl      = document.getElementById('vote-mosaic-sub');

  // VOTACIÓ OBERTA: TOTA la targeta "Repte + La meva foto" es substitueix per
  // la de Votar (mateixa mida que Galeria), amb "Votar el repte: [nom]" com a
  // títol i la data fi de votació com a subtítol. Lligat al repte, no un botó
  // global — té sentit de cara a múltiples reptes actius en el futur (cadascun
  // tindrà el seu propi accés a Votar).
  if (getButtonVisibility().showVote) {
    if (objectiveCard) objectiveCard.classList.add('hidden');
    if (voteSection) {
      voteSection.classList.remove('hidden');
      const objTitle = state.currentObjective ? state.currentObjective.title : '—';
      if (voteTitleEl) {
        voteTitleEl.textContent = currentLang === 'es'
          ? `Votar el reto: ${objTitle}`
          : `Votar el repte: ${objTitle}`;
      }
      if (voteSubEl) {
        // Data fi de votació real: ve de reptes_calendari.voting_end (fila del
        // repte actiu), NO de objectives.end_date (que és un altre camp, no
        // gestionat pel calendari). getActiveCalendar() ja fa aquest lookup.
        const cal = getActiveCalendar();
        const endDate = cal ? _formatDateEs(cal.votingEnd) : '';
        voteSubEl.textContent = endDate
          ? (currentLang === 'es' ? `Votaciones abiertas hasta el ${endDate}` : `Votacions obertes fins el ${endDate}`)
          : t('nav_vote_sub');
      }
      renderVoteMosaic('vote-mosaic-grid', 6);
    }
    return;
  }
  if (voteSection)    voteSection.classList.add('hidden');
  if (objectiveCard)  objectiveCard.classList.remove('hidden');

  // OVERRIDE ADMIN: si force_hide_upload està actiu, ocultar tota la secció
  if (!actingAsAdmin() && state.settings.force_hide_upload) {
    if (uploadSect) uploadSect.classList.add('hidden');
    if (prevSect)   prevSect.classList.add('hidden');
    if (doneSect)   doneSect.classList.add('hidden');
    return;
  }

  if (myPhoto) {
    uploadSect.classList.add('hidden');
    prevSect.classList.add('hidden');
    doneSect.classList.remove('hidden');
    labelEl.textContent = myPhoto.published ? t('photo_published') : t('photo_pending');
    document.getElementById('my-photo-preview').innerHTML =
      `<img src="${myPhoto.url}" style="width:100%;border-radius:12px;">`;
    // Precarregar el títol/descripció ja desat al camp editable, i amagar el
    // botó "Desar canvis" fins que l'usuari hi torni a fer un canvi real.
    const captionEditEl = document.getElementById('caption-edit-input');
    if (captionEditEl) captionEditEl.value = myPhoto.caption || '';
    const saveCaptionBtn = document.getElementById('btn-save-caption');
    if (saveCaptionBtn) saveCaptionBtn.classList.add('hidden');
    // Ocultar botón "Eliminar i Tornar a Pujar" si la subida está cerrada
    const deleteBtn = doneSect.querySelector('[data-i18n="delete_photo_btn"]');
    if (deleteBtn) deleteBtn.style.display = state.settings.uploads_enabled ? '' : 'none';
  } else if ((!state.settings.uploads_enabled || state.settings.voting_enabled) && !actingAsAdmin()) {
    uploadSect.classList.remove('hidden');
    if (uploadZone) uploadZone.classList.add('hidden');
    if (closedMsg) { closedMsg.classList.remove('hidden'); closedText.textContent = currentLang === 'es' ? 'La subida de fotos está cerrada.' : 'La pujada de fotos està tancada.'; }
    if (labelEl) labelEl.textContent = currentLang === 'es' ? 'Subida cerrada' : 'Pujada tancada';
    doneSect.classList.add('hidden');
  } else {
    uploadSect.classList.remove('hidden');
    if (uploadZone) uploadZone.classList.remove('hidden');
    if (closedMsg) closedMsg.classList.add('hidden');
    doneSect.classList.add('hidden');
    if (labelEl) labelEl.textContent = t('nav_upload_sub') || (currentLang === 'es' ? 'Sube tu foto al concurso' : 'Puja la teva foto per participar');
  }
}

// ═══════════════════════════════════
// PHOTO UPLOAD
// ═══════════════════════════════════
export function dragOver(e, ctx)  { e.preventDefault(); document.getElementById((ctx||'')+'upload-zone').classList.add('drag-over'); }
export function dragLeave(ctx)  { const el = document.getElementById((ctx?ctx+'-':'')+'upload-zone'); if(el) el.classList.remove('drag-over'); }
export function dropFile(e, ctx)  { e.preventDefault(); dragLeave(ctx); const f = e.dataTransfer.files[0]; if (f) previewFile(f, ctx); }
export function handleFileSelect(e, ctx) { const f = e.target.files[0]; if (f) previewFile(f, ctx); }

export function previewFile(file, ctx) {
  if (!file.type.startsWith('image/')) { showToast(t('select_valid_image'), 'error'); return; }
  // No file size limit — photographers upload full quality originals
  state.pendingFile = file;
  state.pendingCtx  = ctx || '';
  const pfx = ctx ? ctx + '-' : '';
  const reader = new FileReader();
  reader.onload = e => {
    const zone = document.getElementById(pfx + 'upload-zone');
    if (zone) zone.classList.add('hidden');
    const wrap = document.getElementById(pfx + 'upload-preview-wrap');
    if (wrap) wrap.innerHTML = `<img src="${e.target.result}" style="width:100%;"><button type="button" class="remove-btn" onclick="cancelPreview('${ctx||''}')">✕</button>`;
    const sect = document.getElementById(pfx + 'upload-preview-section');
    if (sect) sect.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

export function cancelPreview(ctx) {
  state.pendingFile = null;
  state.pendingCtx  = '';
  const pfx = ctx ? ctx + '-' : '';
  const zone = document.getElementById(pfx + 'upload-zone');
  if (zone) zone.classList.remove('hidden');
  const sect = document.getElementById(pfx + 'upload-preview-section');
  if (sect) sect.classList.add('hidden');
  const wrap = document.getElementById(pfx + 'upload-preview-wrap');
  if (wrap) wrap.innerHTML = '';
  const inp = document.getElementById(pfx + 'file-input');
  if (inp) inp.value = '';
  const cap = document.getElementById(pfx + 'caption-input');
  if (cap) cap.value = '';
}

// ═══════════════════════════════════
// IMAGE COMPRESSION (Canvas API) + EXIF PRESERVATION
// ═══════════════════════════════════
export function compressImage(file, maxWidth = 4800, maxHeight = 4800, quality = 0.88) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;

      // STEP 1: Try to extract EXIF from original (only works on JPG)
      let exifObj = null;
      try {
        if (typeof piexif !== 'undefined' && file.type === 'image/jpeg') {
          exifObj = piexif.load(dataUrl);
          // Remove GPS block for privacy
          if (exifObj && exifObj['GPS']) {
            exifObj['GPS'] = {};
          }
        }
      } catch (err) {
        console.warn('EXIF read failed, continuing without metadata:', err);
        exifObj = null;
      }

      // STEP 2: Resize with canvas
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            // STEP 3: Re-inject EXIF (if we had it)
            if (exifObj) {
              const compressedReader = new FileReader();
              compressedReader.onload = (ev) => {
                try {
                  const exifStr = piexif.dump(exifObj);
                  const newDataUrl = piexif.insert(exifStr, ev.target.result);
                  // Convert dataURL back to Blob → File
                  const byteString = atob(newDataUrl.split(',')[1]);
                  const ab = new ArrayBuffer(byteString.length);
                  const ia = new Uint8Array(ab);
                  for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                  }
                  const finalBlob = new Blob([ab], { type: 'image/jpeg' });
                  resolve(new File([finalBlob], file.name, { type: 'image/jpeg' }));
                } catch (err) {
                  console.warn('EXIF inject failed, using image without metadata:', err);
                  resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }
              };
              compressedReader.onerror = () => {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              };
              compressedReader.readAsDataURL(blob);
            } else {
              // No EXIF available, return compressed image as-is
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadPhoto() {
  if (!state.pendingFile) { showToast(t('select_photo_first'), 'error'); return; }

  const ctx = state.pendingCtx || '';
  const pfx = ctx ? ctx + '-' : '';
  const btn = document.getElementById('btn-' + (ctx ? ctx + '-' : '') + 'upload-confirm') || document.getElementById('btn-upload-confirm');
  if (!btn) { showToast('Error: botó no trobat', 'error'); return; }

  const origBtnText = btn.textContent;
  btn.innerHTML = '<span class="loader"></span> Comprimint...';
  btn.disabled  = true;
  showLoader(t('compressing'));

  // Safety timeout: hide loader after 60s no matter what
  const loaderTimeout = setTimeout(() => {
    hideLoader();
    btn.innerHTML = origBtnText;
    btn.disabled  = false;
  }, 60000);

  try {
    // Compress image before upload to stay under Cloudinary's 10MB limit
    const fileToUpload = await compressImage(state.pendingFile);

    showLoader(t('uploading'));
    btn.innerHTML = '<span class="loader"></span> Pujant...';

    // Validate preset is configured
    if (!CLOUDINARY_PRESET || CLOUDINARY_PRESET === 'YOUR_PRESET') {
      throw new Error('Cloudinary upload preset not configured');
    }

    const formData = new FormData();
    formData.append('file',          fileToUpload);
    formData.append('upload_preset', CLOUDINARY_PRESET);

    const objName = state.currentObjective
      ? state.currentObjective.title.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_àáèéíïòóúüçñ]/gi, '')
      : 'general';
    // En mode Test, les fotos van a una carpeta separada per no barrejar-les amb producció
    const baseFolder = _dbMode === 'test' ? 'FemReptes_TEST' : 'FemReptes';
    formData.append('folder', baseFolder + '/' + objName);

    const res  = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
    const data = await res.json();

    if (data.error) throw new Error('Cloudinary: ' + data.error.message);
    if (!data.secure_url) throw new Error('Resposta inesperada de Cloudinary');

    // Títol/descripció opcional de l'autor (camp de text de la preview)
    const capEl   = document.getElementById(pfx + 'caption-input');
    const caption = capEl ? capEl.value.trim() : '';

    // Build the photo row for Supabase
    const photoRow = {
      id:           'photo_' + Date.now(),
      user_id:      state.currentUser.id,
      objective_id: state.currentObjective ? state.currentObjective.id : '',
      file_name:    state.pendingFile.name,
      file_url:     data.secure_url,
      original_url: data.secure_url,
      file_size:    String(fileToUpload.size || ''),
      published:    false,
      revealed:     false,
      submitted_at: new Date().toISOString(),
      caption:      caption,
    };

    showLoader(t('saving_cloud'));

    // Save to Supabase
    let saveOk = false;
    // First delete any existing photo for this user+objective, then insert
    await sb.from('photo_submissions').delete()
      .eq('user_id', state.currentUser.id)
      .eq('objective_id', photoRow.objective_id);
    const { error: insertErr } = await sb.from('photo_submissions').insert([photoRow]);
    saveOk = !insertErr;
    if (insertErr) console.error('Photo insert error:', insertErr);

    clearTimeout(loaderTimeout);
    hideLoader();

    if (!saveOk) {
      // Photo is in Cloudinary but NOT in Supabase - warn user
      showToast(
        currentLang === 'es'
          ? '⚠️ Foto subida a la nube, pero no se pudo guardar el registro. Contacta al administrador.'
          : "⚠️ Foto pujada al núvol, però no s'ha pogut desar el registre. Contacta l'administrador.",
        'error'
      );
      btn.innerHTML = origBtnText;
      btn.disabled  = false;
      return;
    }

    // Reload full state to sync
    await loadAllData();

    cancelPreview(ctx);
    if (actingAsAdmin()) {
      refreshAdminDashboard();
      renderAdminGallery();
    } else {
      refreshParticipantDashboard();
    }
    showToast(t('photo_uploaded'), 'success');

  } catch(err) {
    clearTimeout(loaderTimeout);
    hideLoader();
    console.error('Upload error:', err);

    // Show specific error message
    let msg = 'Error en pujar la foto.';
    if (err.message.includes('Invalid Upload Preset') || err.message.includes('preset')) {
      msg = 'Error: Upload Preset de Cloudinary no vàlid. Comprova la configuració.';
    } else if (err.message.includes('File size') || err.message.includes('too large')) {
      msg = 'Error: La foto és massa gran fins i tot després de comprimir.';
    } else if (err.message.includes('401') || err.message.includes('403')) {
      msg = 'Error: Sense permisos per pujar a Cloudinary. Comprova el preset.';
    } else {
      msg = 'Error: ' + err.message;
    }
    showToast(msg, 'error');
  }

  btn.innerHTML = origBtnText;
  btn.disabled  = false;
}

export async function deleteMyPhoto() {
  confirmAction(t('confirm_delete_photo'), t('confirm_delete_photo_msg'), async () => {
    const uid = state.currentUser.id;
    await sb.from('photo_submissions').delete()
      .eq('user_id', uid)
      .eq('objective_id', state.currentObjective ? state.currentObjective.id : '');
    await loadAllData();
    // Reset vote buttons to original state since photo context changed
    resetVoteButtons();
    if (actingAsAdmin()) {
      refreshAdminDashboard();
      renderAdminGallery();
      renderAdminVotingGrid();
    } else {
      refreshParticipantDashboard();
      renderVotingGrid('participant-voting-grid');
    }
    showToast(t('photo_deleted'), 'info');
  });
}

// ═══════════════════════════════════
// EDICIÓ DEL TÍTOL/DESCRIPCIÓ (un cop la foto ja està pujada)
// ═══════════════════════════════════
// Desa el nou títol/descripció de la foto ja pujada per l'usuari actual.
// El botó "Desar canvis" (#btn-save-caption) només és visible quan
// index.html detecta que el text ha canviat respecte al valor precarregat.
export async function saveCaptionEdit() {
  const input = document.getElementById('caption-edit-input');
  if (!input) return;
  const newCaption = input.value.trim();
  const uid   = state.currentUser.id;
  const objId = state.currentObjective ? state.currentObjective.id : '';
  const btn   = document.getElementById('btn-save-caption');

  if (btn) btn.disabled = true;
  showLoader(currentLang === 'es' ? 'Guardando...' : 'Desant...');

  const { error } = await sb.from('photo_submissions')
    .update({ caption: newCaption })
    .eq('user_id', uid)
    .eq('objective_id', objId);

  hideLoader();
  if (btn) btn.disabled = false;

  if (error) {
    console.error('Caption update error:', error);
    showToast(currentLang === 'es' ? 'Error al guardar el título.' : 'Error en desar el títol.', 'error');
    return;
  }

  await loadAllData();
  if (actingAsAdmin()) {
    refreshAdminDashboard();
  } else {
    refreshParticipantDashboard();
  }
  if (btn) btn.classList.add('hidden');
  showToast(currentLang === 'es' ? '¡Título guardado! ✅' : 'Títol desat! ✅', 'success');
}

// Exponer en window las funciones usadas desde onclick del HTML
window.toggleSelectPhoto = toggleSelectPhoto;
window.deleteSelectedPhotos = deleteSelectedPhotos;
window.publishSelectedPhotos = publishSelectedPhotos;
window.dragOver = dragOver;
window.dragLeave = dragLeave;
window.dropFile = dropFile;
window.handleFileSelect = handleFileSelect;
window.cancelPreview = cancelPreview;
window.uploadPhoto = uploadPhoto;
window.deleteMyPhoto = deleteMyPhoto;
window.saveCaptionEdit = saveCaptionEdit;
