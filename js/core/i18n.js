// ═══════════════════════════════════
// I18N - TRANSLATIONS
// ═══════════════════════════════════
export const TRANSLATIONS = {
  ca: {
    // Foto: títol/descripció opcional de l'autor
    caption_label: 'Títol / descripció (opcional)',
    caption_placeholder: 'Què vols transmetre amb la teva foto? (opcional)',
    // Nav
    logo_subtitle: 'Sistema de votació',
    dashboard: 'Panel de Control', photos: 'Fotos', voting: 'Votació',
    ranking: 'Ranking', objectives: 'Temàtiques', members: 'Socis',
    logout: 'Sortir', welcome: 'Benvingut',
    // Login
    login_title: 'ACCÉS', login_tab: 'Iniciar Sessió', register_tab: 'Registrar-se',
    username_label: 'Usuari / Email', password_label: 'Contrasenya',
    enter_btn: 'ENTRAR', connecting: 'Connectant...',
    // Register
    fullname_label: 'Nom Complet', email_label: 'Email',
    confirm_pass_label: 'Confirma la Contrasenya',
    create_account_btn: 'CREAR COMPTE',
    register_note: "El teu compte es crearà com a Soci. Podràs participar al concurs quan l'administrador activi la pujada de fotos.",
    // Dashboard
    active_objective: 'TEMÀTICA ACTUAL', my_photo: 'LA MEVA FOTO',
    upload_photo_label: 'Puja la teva foto per participar',
    photo_pending: 'Foto pujada (pendent) ⏳', photo_published: 'Foto publicada ✅',
    voting_progress: 'PROGRÉS DE VOTACIONS', members_voted: 'votants',
    close_voting_btn: 'Tancar Votacions i Revelar Noms',
    // Photos
    manage_photos: 'GESTIÓ DE FOTOS', photos_subtitle: 'Fotos rebudes dels participants',
    publish_btn: 'Publicar Fotos', delete_selected: 'Eliminar Seleccionades',
    no_photos: "No s'han rebut fotos encara.",
    // Voting
    voting_title: 'VOTACIÓ', save_votes_btn: 'Enviar Vots',
    your_photo: '⭐ La teva foto', creativity: 'Creativitat',
    theme: 'Temàtica', composition: 'Composició',
    voting_closed: "Les votacions no estan obertes encara 🔒",
    voting_closed_label: 'Votació tancada',
    already_voted: "Ja has votat ✅",
    // Ranking
    current_ranking: 'Temàtica Actual', general_ranking: 'Ranking General',
    ranking_title: 'RANKING GENERAL', participations: 'participació(ns)',
    // Objectives
    objectives_title: 'GESTIÓ DE TEMÀTIQUES', new_objective_btn: 'Nova Temàtica',
    obj_title_label: 'Títol', obj_desc_label: 'Descripció',
    finalize_btn: 'Finalitzar', edit_btn: 'Editar', delete_btn: 'Eliminar',
    active_badge: 'Actiu', finished_badge: 'Finalitzat', inactive_badge: 'Inactiu',
    save_btn: 'Guardar', cancel_btn: 'Cancel·lar',
    no_objectives: "No hi ha temàtiques. Crea'n una per començar.",
    confirm_upload_btn: 'Confirmar Pujada',
    no_active_objective: "No hi ha temàtica activa. Crea'n una a la pestanya Temàtiques.",
    members_total: 'Total Socis',
    finalize_confirm_title: 'Finalitzar Temàtica',
    finalize_confirm_msg: "Finalitzar el concurs? Ja no es podran afegir ni modificar vots. Aquesta acció no es pot desfer.",
    // Members
    members_title: 'GESTIÓ DE SOCIS', new_member_btn: 'Nou Soci',
    member_name: 'Nom', member_email: 'Email / Usuari', member_role: 'Rol',
    member_photo: 'Foto', member_voted: 'Votat', member_actions: 'Contrasenya',
    member_uploaded: 'Foto pujada', member_voted_h: 'Ha Votat',
    member_reset_pwd: 'Reset', member_reset_confirm_title: 'Resetejar contrasenya',
    member_reset_confirm_msg: 'Segur que vols resetejar la contrasenya de {name}? El soci haurà de crear-ne una de nova al pròxim accés. Les seves puntuacions i fotos NO es perden.',
    member_reset_done: '✓ Contrasenya resetejada',
    new_pwd_modal_title: 'CREA UNA NOVA CONTRASENYA',
    new_pwd_modal_msg: 'L\'administrador ha resetejat la teva contrasenya. Introdueix-ne una de nova per continuar.',
    new_pwd_label: 'Nova contrasenya',
    new_pwd_repeat: 'Repeteix la contrasenya',
    new_pwd_save: 'Desar i entrar',
    new_pwd_mismatch: 'Les contrasenyes no coincideixen',
    new_pwd_short: 'La contrasenya ha de tenir almenys 4 caràcters',
    yes_btn: 'Sí, resetejar',
    // Settings
    uploads_toggle: 'Pujada de fotos', voting_toggle: 'Votacions obertes',
    cal_mark_upload: 'Marcar pujada', cal_mark_voting: 'Marcar votació',
    reveal_toggle: 'Revelar Noms',
    reveal_hint: '🔒 Tanca les votacions primer',
    hide_ranking_toggle: 'Ocultar Ranking General',
    // Upload
    upload_zone_title: 'Selecciona o arrossega la teva foto',
    upload_zone_subtitle: 'JPG, PNG, WEBP · Es comprimirà automàticament',
    confirm_upload_btn: 'Confirmar Pujada', cancel_btn2: 'Cancel·lar',
    delete_photo_btn: '🗑 Eliminar i Tornar a Pujar',
    // Toasts / Messages
    no_delete_self: 'No pots eliminar el teu propi compte',
    delete_member: 'Eliminar Soci',
    confirm_delete_member: "Eliminar {name} i totes les seves dades (fotos, vots)? Aquesta acció no es pot desfer.",
    member_deleted: 'Soci i totes les seves dades eliminats ✅',
    votes_saved: 'Vots guardats! ✅',
    photo_uploaded: 'Foto pujada correctament! ✅',
    photo_deleted: "Foto eliminada. Pots pujar-ne una de nova.",
    objective_saved: 'Temàtica guardada! ✅',
    objective_finalized: 'Concurs finalitzat! ✅',
    member_saved: 'Soci guardat! ✅',
    account_created: 'Compte creat! Benvingut/da',
    account_deleted: "Compte eliminat correctament. Fins aviat!",
    // Unsubscribe
    unsubscribe_title: 'Donar-se de Baixa',
    unsubscribe_msg: "Estàs segur que vols eliminar el teu compte? Es perdran totes les teves dades (foto, vots). Aquesta acció no es pot desfer.",
    unsubscribe_btn: '🚪 Baixa',
    // Confirm modal
    photos_received: 'Han Pujat',
    total_members: 'Total Socis',
    objective_modal_hint: 'Temàtica actual del concurs',
    confirm_yes: 'Confirmar', confirm_no: 'Cancel·lar',
    nav_home: 'Inici',
    nav_vote: 'VOTAR',
    nav_vote_sub: 'Accedeix a la votació de fotos',
    nav_ranking: 'RANKING',
    nav_ranking_sub: 'Veure la classificació',
    nav_resultats: 'RESULTAT REPTE',
    nav_resultats_sub: 'Resultats dels reptes finalitzats',
    nav_classificacio: 'CLASSIFICACIÓ GENERAL',
    nav_classificacio_sub: 'Classificació acumulada',
    nav_class_general: 'Class.General',
    nav_class_reptes: 'Reptes',
    view_db_subtitle: 'Alterna vista i base de dades',
    view_as_participant: 'Veure com a participant',
    nav_gallery: 'GALERIA',
    nav_gallery_sub: 'Fotos dels reptes finalitzats',
    embedded_back: '← Tornar',
    gallery_title: 'GALERIA',
    gallery_filter_objective: 'Repte',
    gallery_filter_author: 'Autor',
    gallery_all_objectives: 'Tots els reptes',
    gallery_all_authors: 'Tots els autors',
    gallery_empty: 'Encara no hi ha reptes finalitzats.',
    nav_upload: 'PUJAR FOTO',
    nav_upload_sub: 'Puja la teva foto al concurs',
    // Force-hide toggles (admin)
    force_hide_section: 'Forçar ocultació de botons',
    force_hide_upload: 'Ocultar botó Pujar foto',
    force_hide_vote: 'Ocultar botó Votar',
    force_hide_resultats: 'Ocultar botó Resultat repte',
    force_hide_classificacio: 'Ocultar botó Classificació General',
    // Dashboard stats
    members_label: 'Participants',
    contest_management: 'Gestió del concurs',
    active_objective_sub: 'Temàtica actual del concurs',
    // Loader messages
    saving_cloud: 'Guardant al núvol...',
    compressing: 'Comprimint imatge...',
    uploading: 'Pujant foto...',
    connecting: 'Connectant...',
    loading: 'Carregant...',
    creating_account: 'Creant compte...',
    saving_votes_loader: 'Guardant vots...',
    // Extra toast messages
    email_exists: 'Aquest email/usuari ja existeix',
    title_required: 'El títol és obligatori',
    photos_deleted: 'Fotos eliminades ✅',
    pass_required: 'La contrasenya és obligatòria',
    no_pending_photos: 'No hi ha fotos pendents de publicar',
    no_change_own_role: 'No pots canviar el teu propi rol',
    name_updated: 'Nom actualitzat ✅',
    name_email_required: 'Nom i email/usuari són obligatoris',
    select_photo: 'Selecciona almenys una foto',
    select_photo_first: 'Selecciona una foto primer',
    select_valid_image: 'Selecciona una imatge vàlida',
    voting_closed_revealed: 'Votacions tancades i noms revelats! 🏆',
    sheets_error: '❌ Error amb Supabase. Comprova la URL i la clau.',
    objective_already_active: "❌ Ja hi ha una temàtica activa. Finalitza-la abans de crear-ne una de nova.",
    objective_not_finished: "❌ La temàtica anterior no ha estat finalitzada. Canvia-la a Finalitzada primer.",
    role_changed: 'Rol canviat a',
    member_role_name: 'Soci',
    confirm_close_voting: 'Tancar Votacions',
    confirm_close_voting_msg: "Estàs segur que vols tancar les votacions i revelar els noms?",
    confirm_delete_photo: 'Eliminar Foto',
    confirm_delete_photo_msg: "Vols eliminar la teva foto i pujar-ne una de diferent?",
    confirm_finalize_title: 'Finalitzar Temàtica',
    confirm_finalize_msg: "Finalitzar el concurs? Ja no es podran afegir ni modificar vots.",
    // Spectator mode
    spectator_mode: 'Espectador',
    participate_mode: 'Participar',
    view_photos: 'Veure Fotos',
    spectator_viewing: 'Mode visualització',
    no_photos_yet: 'Encara no hi ha fotos publicades',
    photo_of: 'de',
  },
  es: {
    // Foto: título/descripción opcional del autor
    caption_label: 'Título / descripción (opcional)',
    caption_placeholder: '¿Qué quieres transmitir con tu foto? (opcional)',
    // Nav
    logo_subtitle: 'Sistema de votación',
    dashboard: 'Panel de Control', photos: 'Fotos', voting: 'Votación',
    ranking: 'Ranking', objectives: 'Temáticas', members: 'Socios',
    logout: 'Salir', welcome: 'Bienvenido',
    // Login
    login_title: 'ACCESO', login_tab: 'Iniciar Sesión', register_tab: 'Registrarse',
    username_label: 'Usuario / Email', password_label: 'Contraseña',
    enter_btn: 'ENTRAR', connecting: 'Conectando...',
    // Register
    fullname_label: 'Nombre Completo', email_label: 'Email',
    confirm_pass_label: 'Confirma la Contraseña',
    create_account_btn: 'CREAR CUENTA',
    register_note: 'Tu cuenta se creará como Socio. Podrás participar en el concurso cuando el administrador active la subida de fotos.',
    // Dashboard
    active_objective: 'TEMÁTICA ACTUAL', my_photo: 'MI FOTO',
    upload_photo_label: 'Sube tu foto para participar',
    photo_pending: 'Foto subida (pendiente) ⏳', photo_published: 'Foto publicada ✅',
    voting_progress: 'PROGRESO DE VOTACIONES', members_voted: 'votantes',
    close_voting_btn: 'Cerrar Votaciones y Revelar Nombres',
    // Photos
    manage_photos: 'GESTIÓN DE FOTOS', photos_subtitle: 'Fotos recibidas de los participantes',
    publish_btn: 'Publicar Fotos', delete_selected: 'Eliminar Seleccionadas',
    no_photos: 'No se han recibido fotos todavía.',
    // Voting
    voting_title: 'VOTACIÓN', save_votes_btn: 'Enviar Votos',
    your_photo: '⭐ Tu foto', creativity: 'Creatividad',
    theme: 'Temática', composition: 'Composición',
    voting_closed: 'Las votaciones no están abiertas todavía 🔒',
    already_voted: 'Ya has votado ✅',
    // Ranking
    current_ranking: 'Temática Actual', general_ranking: 'Ranking General',
    ranking_title: 'RANKING GENERAL', participations: 'participación(es)',
    // Objectives
    objectives_title: 'GESTIÓN DE TEMÁTICAS', new_objective_btn: 'Nueva Temática',
    obj_title_label: 'Título', obj_desc_label: 'Descripción',
    finalize_btn: 'Finalizar', edit_btn: 'Editar', delete_btn: 'Eliminar',
    active_badge: 'Activa', finished_badge: 'Finalizada', inactive_badge: 'Inactiva',
    save_btn: 'Guardar', cancel_btn: 'Cancelar',
    no_objectives: 'No hay temáticas. Crea una para empezar.',
    finalize_confirm_title: 'Finalizar Temática',
    finalize_confirm_msg: "¿Finalizar el concurso? Ya no se podrán añadir ni modificar votos. Esta acción no se puede deshacer.",
    // Members
    members_title: 'GESTIÓN DE SOCIOS', new_member_btn: 'Nuevo Socio',
    member_name: 'Nombre', member_email: 'Email / Usuario', member_role: 'Rol',
    member_photo: 'Foto', member_voted: 'Votado', member_actions: 'Contraseña',
    member_uploaded: 'Foto subida', member_voted_h: 'Ha Votado',
    member_reset_pwd: 'Reset', member_reset_confirm_title: 'Resetear contraseña',
    member_reset_confirm_msg: '¿Seguro que quieres resetear la contraseña de {name}? El socio tendrá que crear una nueva en el próximo acceso. Sus puntuaciones y fotos NO se pierden.',
    member_reset_done: '✓ Contraseña reseteada',
    new_pwd_modal_title: 'CREA UNA NUEVA CONTRASEÑA',
    new_pwd_modal_msg: 'El administrador ha reseteado tu contraseña. Introduce una nueva para continuar.',
    new_pwd_label: 'Nueva contraseña',
    new_pwd_repeat: 'Repite la contraseña',
    new_pwd_save: 'Guardar y entrar',
    new_pwd_mismatch: 'Las contraseñas no coinciden',
    new_pwd_short: 'La contraseña debe tener al menos 4 caracteres',
    yes_btn: 'Sí, resetear',
    // Settings
    uploads_toggle: 'Subida de fotos', voting_toggle: 'Votaciones abiertas',
    cal_mark_upload: 'Marcar subida', cal_mark_voting: 'Marcar votación',
    reveal_toggle: 'Revelar Nombres',
    reveal_hint: '🔒 Cierra las votaciones primero',
    hide_ranking_toggle: 'Ocultar Ranking General',
    // Upload
    upload_zone_title: 'Selecciona o arrastra tu foto',
    upload_zone_subtitle: 'JPG, PNG, WEBP · Se comprimirá automáticamente antes de subir',
    confirm_upload_btn: 'Confirmar Subida', cancel_btn2: 'Cancelar',
    delete_photo_btn: '🗑 Eliminar y Volver a Subir',
    // Toasts / Messages
    no_delete_self: 'No puedes eliminar tu propia cuenta',
    delete_member: 'Eliminar Socio',
    confirm_delete_member: "¿Eliminar a {name} y todos sus datos (fotos, votos)? Esta acción no se puede deshacer.",
    member_deleted: 'Socio y todos sus datos eliminados ✅',
    votes_saved: "¡Votos guardados! ✅",
    photo_uploaded: "¡Foto subida correctamente! ✅",
    photo_deleted: 'Foto eliminada. Puedes subir una nueva.',
    objective_saved: "¡Temática guardada! ✅",
    objective_finalized: "¡Concurso finalizado! ✅",
    member_saved: "¡Socio guardado! ✅",
    account_created: "¡Cuenta creada! Bienvenido/a",
    account_deleted: "Cuenta eliminada correctamente. ¡Hasta pronto!",
    // Unsubscribe
    unsubscribe_title: 'Darse de Baja',
    unsubscribe_msg: "¿Estás seguro de que quieres eliminar tu cuenta? Se perderán todos tus datos (foto, votos). Esta acción no se puede deshacer.",
    unsubscribe_btn: '🚪 Baja',
    // Confirm modal
    photos_received: 'Han Subido',
    total_members: 'Total Socios',
    objective_modal_hint: 'Temática actual del concurso',
    confirm_yes: 'Confirmar', confirm_no: 'Cancelar',
    nav_home: 'Inicio',
    nav_vote: 'VOTAR',
    nav_vote_sub: 'Accede a la votación de fotos',
    nav_ranking: 'RANKING',
    nav_ranking_sub: 'Ver la clasificación',
    nav_resultats: 'RESULTADO RETO',
    nav_resultats_sub: 'Resultados de los retos finalizados',
    nav_classificacio: 'CLASIFICACIÓN GENERAL',
    nav_classificacio_sub: 'Clasificación acumulada',
    nav_class_general: 'Clas.General',
    nav_class_reptes: 'Retos',
    view_db_subtitle: 'Alterna vista y base de datos',
    view_as_participant: 'Ver como participante',
    nav_gallery: 'GALERÍA',
    nav_gallery_sub: 'Fotos de los retos finalizados',
    embedded_back: '← Volver',
    gallery_title: 'GALERÍA',
    gallery_filter_objective: 'Reto',
    gallery_filter_author: 'Autor',
    gallery_all_objectives: 'Todos los retos',
    gallery_all_authors: 'Todos los autores',
    gallery_empty: 'Aún no hay retos finalizados.',
    nav_upload: 'SUBIR FOTO',
    nav_upload_sub: 'Sube tu foto al concurso',
    // Force-hide toggles (admin)
    force_hide_section: 'Forzar ocultación de botones',
    force_hide_upload: 'Ocultar botón Subir foto',
    force_hide_vote: 'Ocultar botón Votar',
    force_hide_resultats: 'Ocultar botón Resultado reto',
    force_hide_classificacio: 'Ocultar botón Clasificación General',
    // Dashboard stats
    members_label: 'Participantes',
    contest_management: 'Gestión del concurso',
    active_objective_sub: 'Temática actual del concurso',
    // Loader messages
    saving_cloud: 'Guardando en la nube...',
    compressing: 'Comprimiendo imagen...',
    uploading: 'Subiendo foto...',
    connecting: 'Conectando...',
    loading: 'Cargando...',
    creating_account: 'Creando cuenta...',
    saving_votes_loader: 'Guardando votos...',
    // Extra toast messages
    email_exists: 'Este email/usuario ya existe',
    title_required: 'El título es obligatorio',
    photos_deleted: 'Fotos eliminadas ✅',
    pass_required: 'La contraseña es obligatoria',
    no_pending_photos: 'No hay fotos pendientes de publicar',
    no_change_own_role: 'No puedes cambiar tu propio rol',
    name_updated: 'Nombre actualizado ✅',
    name_email_required: 'Nombre y email/usuario son obligatorios',
    select_photo: 'Selecciona al menos una foto',
    select_photo_first: 'Selecciona una foto primero',
    select_valid_image: 'Selecciona una imagen válida',
    voting_closed_revealed: '¡Votaciones cerradas y nombres revelados! 🏆',
    sheets_error: '❌ Error con Supabase. Comprueba la URL y la clave.',
    objective_already_active: '❌ Ya hay una temática activa. Finalízala antes de crear una nueva.',
    objective_not_finished: '❌ La temática anterior no ha sido finalizada. Cámbiala a Finalizada primero.',
    role_changed: 'Rol cambiado a',
    member_role_name: 'Socio',
    confirm_close_voting: 'Cerrar Votaciones',
    confirm_close_voting_msg: '¿Seguro que quieres cerrar las votaciones y revelar los nombres?',
    confirm_delete_photo: 'Eliminar Foto',
    confirm_delete_photo_msg: '¿Quieres eliminar tu foto y subir una diferente?',
    confirm_finalize_title: 'Finalizar Temática',
    confirm_finalize_msg: '¿Finalizar el concurso? Ya no se podrán añadir ni modificar votos.',
    // Spectator mode
    spectator_mode: 'Espectador',
    participate_mode: 'Participar',
    view_photos: 'Ver Fotos',
    spectator_viewing: 'Modo visualización',
    no_photos_yet: 'Aún no hay fotos publicadas',
    photo_of: 'de',
  }
};

export let currentLang = localStorage.getItem('femrank_lang') || 'ca';

export function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
         (TRANSLATIONS['ca'][key]) || key;
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('femrank_lang', lang);
  applyTranslations();
}

export function applyTranslations() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) el.textContent = val;
  });
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  // Update ALL language toggle buttons (multiple sets on page)
  document.querySelectorAll('.lang-btn-ca').forEach(btn => {
    btn.classList.toggle('active', currentLang === 'ca');
  });
  document.querySelectorAll('.lang-btn-es').forEach(btn => {
    btn.classList.toggle('active', currentLang === 'es');
  });
}

// Exponer en window las funciones usadas desde onclick del HTML
window.setLang = setLang;
window.t = t;
window.applyTranslations = applyTranslations;
