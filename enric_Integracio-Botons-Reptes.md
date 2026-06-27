FEM FOTOGRAFIA EL MASNOU

Integració App Reptes + App Resultats

Document 2: Botons de navegació a l'App Reptes

Instruccions per a Pablo · Juny 2026

1. Context

La home del participant de l'App Reptes ja té dos botons creats visualment però sense funcionalitat:

Resultat Repte — ha de mostrar els resultats detallats del repte actiu (puntuacions per foto i per criteri).

Classificació General — ha de mostrar el rànquing acumulat entre tots els reptes finalitzats.



Aquests dos botons han de carregar el contingut de l'App Resultats (FEM-Resultat_Ranquing.html) directament dins l'àrea principal de l'App Reptes, sense obrir noves pestanyes ni abandonar la pàgina. L'usuari ha de percebre-ho com una funcionalitat més de la mateixa app.



📌  Les dues funcionalitats s'activen per separat, cadascuna des del seu botó. Són contextos d'ús diferents i no cal que l'usuari pugui navegar entre elles un cop dins.



2. Mecanisme: iframe integrat

La solució més senzilla és usar un iframe que es mostra quan l'usuari prem un dels dos botons, ocupant l'àrea principal de l'app mentre la topbar d'en Pablo es manté visible.



El flux és el següent:

L'usuari prem "Resultat Repte" o "Classificació General".

L'àrea principal de la home s'amaga.

Es mostra un iframe que ocupa tot l'espai disponible i carrega l'App Resultats amb els paràmetres correctes.

La topbar d'en Pablo (nom d'usuari, idioma, sortir) segueix visible a la part superior.

Un botó "← Tornar" permet tancar l'iframe i recuperar la home.



📌  L'App Resultats detectarà que s'executa dins un iframe i amagarà automàticament la seva pròpia topbar i títol per evitar duplicitats visuals. No cal cap configuració addicional per part d'Enric.



3. Paràmetres que cal passar a la URL

L'App Resultats llegeix tres paràmetres de la URL per saber com comportar-se:





URLs resultants per a cada botó:



Botó "Resultat Repte":

FEM-Resultat_Ranquing.html?role=ROLE&view=resultats&embedded=true



Botó "Classificació General":

FEM-Resultat_Ranquing.html?role=ROLE&view=classificacio&embedded=true



On ROLE es substitueix dinàmicament pel rol de l'usuari connectat:

const role = state.currentUser ? state.currentUser.role : 'participant';



4. Codi a implementar

4.1 Estructura HTML a afegir

Afegir aquest bloc just abans del tancament de </body>, fora de qualsevol screen existent:



<div id="screen-embedded" style="

  display:none; position:fixed; inset:0; z-index:50;

  flex-direction:column; background:var(--bg, #0d1b2a);">



  <div style="display:flex; align-items:center; gap:12px;

    padding:10px 20px; background:var(--bg, #0d1b2a);

    border-bottom:1px solid rgba(255,255,255,.1);">

    <button onclick="closeEmbedded()" style="

      background:none; border:1px solid rgba(255,255,255,.25);

      color:#fff; border-radius:6px; padding:6px 14px;

      cursor:pointer; font-size:13px;">← Tornar

    </button>

    <span id="embedded-title" style="font-size:13px; font-weight:700;

      letter-spacing:.1em; text-transform:uppercase;

      color:rgba(255,255,255,.5);">

    </span>

  </div>



  <iframe id="iframe-resultats" src="" frameborder="0"

    style="flex:1; width:100%; border:none;">

  </iframe>

</div>



4.2 Funcions JavaScript a afegir

Afegir aquestes dues funcions al bloc de JavaScript de l'app:



// Obre l'App Resultats integrada dins l'app

function openEmbedded(view) {

  const role = state.currentUser ? state.currentUser.role : 'participant';

  const titles = {

    resultats:     'Resultat Repte',

    classificacio: 'Classificació General'

  };

  const url = 'FEM-Resultat_Ranquing.html'

    + '?role=' + role

    + '&view=' + view

    + '&embedded=true';



  document.getElementById('iframe-resultats').src = url;

  document.getElementById('embedded-title').textContent = titles[view] || '';



  // Amagar totes les pantalles i mostrar la vista integrada

  document.querySelectorAll('.screen').forEach(function(s) {

    s.style.display = 'none';

  });

  const emb = document.getElementById('screen-embedded');

  emb.style.display = 'flex';

}



// Tanca la vista integrada i torna a la home del participant

function closeEmbedded() {

  document.getElementById('iframe-resultats').src = '';

  document.getElementById('screen-embedded').style.display = 'none';

  showParticipantScreen();

}



4.3 Connectar els botons existents

Localitzar els botons "Resultat Repte" i "Classificació General" a la home del participant i afegir-los l'onclick:



Botó Resultat Repte:

onclick="openEmbedded('resultats')"



Botó Classificació General:

onclick="openEmbedded('classificacio')"



⚠️  Si els botons ja tenen un onclick assignat, substituir-lo pel nou. No afegir-ne un segon.



5. Verificació

Un cop implementat, comprovar:

El botó "Resultat Repte" obre la vista de resultats per repte dins la mateixa pàgina, sense sortir de l'app.

El botó "Classificació General" obre directament la classificació acumulada.

La topbar d'en Pablo segueix visible mentre es visualitza el contingut integrat.

El botó "← Tornar" tanca la vista i recupera la home del participant correctament.

Un usuari admin veu tots els reptes; un participant només els finalitzats.

En recarregar el navegador, l'app recupera la sessió (requereix el Document 1 implementat).



📌  Aquest document complementa el Document 1 (sessionStorage). Els dos s'han d'implementar conjuntament per tenir la integració completa.