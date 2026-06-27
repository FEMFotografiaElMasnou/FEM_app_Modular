FEM FOTOGRAFIA EL MASNOU

Integració App Reptes + App Resultats

Instruccions tècniques per a l'app Reptes (Pablo)

Juny 2026

1. Context i Objectiu

El projecte FEM Fotografia El Masnou consta de dues aplicacions web independents que cal integrar:





Ambdues apps consulten la mateixa base de dades Supabase (projecte: ogqqcgbgcqowvywaolln).



Aquest document descriu els canvis que cal fer a l'App Reptes per resoldre dos problemes:

La sessió de l'usuari es perd cada cop que es recarrega el navegador.

L'App Resultats no té manera de saber quin usuari és connectat ni quin rol té.



2. Diagnosi dels Problemes Actuals

2.1 Pèrdua de sessió en recarregar

El login actual funciona així:

Es carreguen tots els usuaris de Supabase a memòria.

Es compara l'email/usuari i contrasenya introduïts amb les dades carregades.

Si coincideix, es desa l'usuari a state.currentUser (variable JS en memòria).



El problema: state.currentUser és una variable JavaScript que existeix només mentre la pàgina està carregada. En prémer F5 o recarregar el navegador, desapareix i l'usuari ha de tornar a fer login.

2.2 Incompatibilitat amb l'App Resultats

L'App Resultats (Enric) filtra el contingut segons el rol de l'usuari:

Admin → veu tots els reptes (actius, finalitzats, inactius).

Participant o sense sessió → veu només els reptes finalitzats.



Per fer aquest filtre, l'App Resultats necessita saber el rol de l'usuari en el moment d'obrir-se. Com que les dues apps no comparteixen cap mecanisme de sessió, ara mateix això és impossible.



3. Solució: Persistència de Sessió amb sessionStorage

La solució no requereix canviar el sistema de login ni la base de dades. Només cal afegir tres blocs de codi molt concrets a l'app existent.



📌  sessionStorage manté les dades mentre el navegador té la pestanya oberta. En tancar la pestanya o el navegador, s'esborra automàticament. És el comportament correcte per a una app d'associació.

⚠️  No es desa mai la contrasenya. Només es guarden id, name i role — dades no sensibles.



3.1 Bloc 1 — Desar la sessió en fer login correctament

Ubicació: funció handleLogin(), just després de la línia state.currentUser = user;



Afegir aquest codi a continuació:

// Persistir sessió a sessionStorage

sessionStorage.setItem('fem_user', JSON.stringify({

  id:   user.id,

  name: user.name,

  role: user.role

}));



3.2 Bloc 2 — Esborrar la sessió en fer logout

Ubicació: funció logout(), just després de state.currentUser = null;



Afegir aquesta línia:

sessionStorage.removeItem('fem_user');



3.3 Bloc 3 — Restaurar la sessió en inicialitzar l'app

Ubicació: funció init() o equivalent, just abans de mostrar la pantalla de login. Ha de ser el primer que s'executa.



Afegir aquest bloc:

// Comprovar si ja hi ha sessió guardada

const savedSession = sessionStorage.getItem('fem_user');

if (savedSession) {

  try {

    const saved = JSON.parse(savedSession);

    // Esperar que les dades de Supabase estiguin carregades

    await loadAllData();

    // Cercar l'usuari complet a state.users

    const fullUser = state.users.find(u => u.id === saved.id);

    if (fullUser) {

      state.currentUser = fullUser;

      if (fullUser.role === 'admin') {

        showAdminScreen();

      } else {

        showParticipantScreen();

      }

      return; // no mostrar pantalla de login

    }

  } catch (_) {}

  sessionStorage.removeItem('fem_user'); // sessió invàlida, esborrar

}

// Si no hi ha sessió vàlida, mostrar login normalment



📌  El bloc cerca l'usuari complet a state.users (carregat de Supabase) en lloc de confiar cegament en el que hi ha guardat. Això garanteix que si un admin ha canviat el rol de l'usuari, el canvi es reflecteix a la pròxima sessió.



4. Integració amb l'App Resultats

Un cop implementada la persistència de sessió, cal que l'App Reptes passi el rol de l'usuari a l'App Resultats en el moment d'obrir-la.



El mecanisme és simple: passar el rol com a paràmetre a la URL.



4.1 Obertura de l'App Resultats

Allà on l'app obri o enlla l'App Resultats (botó, navegació, iframe, etc.), cal afegir el rol a la URL:



Si s'obre en una nova pestanya:

window.open('FEM-Resultat_Ranquing.html?role=' + state.currentUser.role);



Si s'obre com a iframe:

document.getElementById('iframe-resultats').src =

  'FEM-Resultat_Ranquing.html?role=' + state.currentUser.role;



Si és un enllaç HTML:

// Generar dinàmicament l'href amb el rol

const role = state.currentUser ? state.currentUser.role : 'participant';

document.getElementById('link-resultats').href =

  'FEM-Resultat_Ranquing.html?role=' + role;



📌  Si l'usuari no està connectat o state.currentUser és null, usar 'participant' com a rol per defecte. Això garanteix que sense sessió sempre es mostren només els reptes finalitzats.



5. Resum de Canvis



📌  L'App Resultats (Enric) ja està adaptada per llegir el paràmetre role de la URL i aplicar el filtre corresponent. Cap canvi addicional és necessari per part d'Enric un cop Pablo implementi aquests quatre canvis.