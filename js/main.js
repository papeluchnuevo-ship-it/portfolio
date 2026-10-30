/* ==========================================================
   main.js — Portfolio d'Elif Sila Kaplan
   Aucune dépendance. Tout est commenté pour être relu et modifié.
   ========================================================== */
(function () {
  'use strict';

  var LARGEUR_BUREAU = 1512;   // cadre Figma « Bureau – Desktop »
  var HAUTEUR_BUREAU = 982;
  var POINT_MOBILE = 820;      // en dessous : version « téléphone » de secours
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function estMobile() { return window.innerWidth <= POINT_MOBILE; }
  function echelle() { return parseFloat(getComputedStyle(document.body).getPropertyValue('--s')) || 1; }

  /* ---------- 1. Mise à l'échelle du bureau ---------- */
  function ajusterEchelle() {
    var s = 1;
    if (!estMobile()) {
      s = Math.min(window.innerWidth / LARGEUR_BUREAU, window.innerHeight / HAUTEUR_BUREAU);
      s = Math.max(0.62, Math.min(1.25, s));
    }
    document.body.style.setProperty('--s', s.toFixed(4));
  }

  /* ---------- 2. Horloge de la barre de menu ---------- */
  function majHorloge() {
    var d = new Date();
    var jour = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
    jour = jour.charAt(0).toUpperCase() + jour.slice(1);
    var heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    var elDate = document.getElementById('date');
    var elHeure = document.getElementById('heure');
    if (elDate) elDate.textContent = jour;
    if (elHeure) elHeure.textContent = heure;
  }

  /* ---------- 3. Fenêtres ---------- */
  var fenetres = {
    apropos: document.getElementById('fen-apropos'),
    projets: document.getElementById('fen-projets')
  };
  var ordreZ = 10;

  function premierPlan(fen) { ordreZ += 1; fen.style.zIndex = ordreZ; }

  function ouvrir(nom) {
    var fen = fenetres[nom];
    if (!fen) return;
    if (fen.hidden) {
      fen.style.left = ''; fen.style.top = '';          // position d'origine
      fen.hidden = false;
    }
    premierPlan(fen);
    var contenu = fen.querySelector('.fenetre__contenu');
    if (contenu && !estMobile()) contenu.focus({ preventScroll: true });
  }

  function fermer(fen) { fen.hidden = true; }

  function fenetreAuPremierPlan() {
    var visibles = Object.keys(fenetres).map(function (k) { return fenetres[k]; }).filter(function (f) { return !f.hidden; });
    visibles.sort(function (a, b) { return (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0); });
    return visibles[0];
  }

  // Menu « À propos de moi » et dossiers du bureau : un seul clic ouvre la fenêtre
  document.querySelectorAll('[data-ouvrir]').forEach(function (el) {
    var nom = el.getAttribute('data-ouvrir');
    el.addEventListener('click', function () { ouvrir(nom); });
  });

  Object.keys(fenetres).forEach(function (k) {
    var fen = fenetres[k];
    fen.addEventListener('pointerdown', function () { premierPlan(fen); });
    fen.querySelectorAll('[data-fermer]').forEach(function (b) { b.addEventListener('click', function () { fermer(fen); }); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var f = fenetreAuPremierPlan(); if (f) fermer(f); }
  });

  /* ---------- 4. Déplacer une fenêtre (par le haut de la barre latérale) ---------- */
  document.querySelectorAll('.fenetre__poignee').forEach(function (poignee) {
    var fen = poignee.closest('.fenetre');
    var depart = null;
    poignee.addEventListener('pointerdown', function (e) {
      if (estMobile() || e.target.closest('.feu')) return;
      depart = { x: e.clientX, y: e.clientY, left: fen.offsetLeft, top: fen.offsetTop };
      poignee.setPointerCapture(e.pointerId);
    });
    poignee.addEventListener('pointermove', function (e) {
      if (!depart) return;
      var s = echelle();
      var left = depart.left + (e.clientX - depart.x) / s;
      var top = depart.top + (e.clientY - depart.y) / s;
      left = Math.max(-fen.offsetWidth + 120, Math.min(LARGEUR_BUREAU - 120, left));
      top = Math.max(0, Math.min(HAUTEUR_BUREAU - 80, top));
      fen.style.left = left + 'px';
      fen.style.top = top + 'px';
    });
    function fin() { depart = null; }
    poignee.addEventListener('pointerup', fin);
    poignee.addEventListener('pointercancel', fin);
  });

  /* ---------- 5. Fenêtre « À propos » : onglets qui font défiler ---------- */
  (function () {
    var fen = fenetres.apropos;
    var contenu = fen.querySelector('.fenetre__contenu');
    var onglets = fen.querySelectorAll('.onglet');

    function decalage(el) {
      var s = echelle();
      return (el.getBoundingClientRect().top - contenu.getBoundingClientRect().top) / s + contenu.scrollTop;
    }

    onglets.forEach(function (o) {
      o.addEventListener('click', function () {
        var cible = document.getElementById(o.getAttribute('data-cible'));
        if (!cible) return;
        contenu.scrollTo({ top: Math.max(0, decalage(cible) - 32), behavior: reduit ? 'auto' : 'smooth' });
      });
    });

    contenu.addEventListener('scroll', function () {
      var actif = onglets[0];
      onglets.forEach(function (o) {
        var cible = document.getElementById(o.getAttribute('data-cible'));
        if (cible && decalage(cible) - 120 <= contenu.scrollTop) actif = o;
      });
      var fond = contenu.scrollTop + contenu.clientHeight >= contenu.scrollHeight - 4;
      if (fond) actif = onglets[onglets.length - 1];
      onglets.forEach(function (o) { o.classList.toggle('est-actif', o === actif); });
    }, { passive: true });
  })();

  /* ---------- 6. Fenêtre « Projets » : changer de projet ---------- */
  (function () {
    var fen = fenetres.projets;
    var contenu = document.getElementById('contenu-projets');
    var onglets = fen.querySelectorAll('.fenetre__liste .onglet');
    var pages = fen.querySelectorAll('.page-projet');

    function afficher(nom) {
      pages.forEach(function (p) { p.hidden = (p.id !== 'projet-' + nom); });
      onglets.forEach(function (o) { o.classList.toggle('est-actif', o.getAttribute('data-projet') === nom); });
      contenu.scrollTo({ top: 0, behavior: 'instant' });
    }

    fen.querySelectorAll('[data-projet]').forEach(function (b) {
      b.addEventListener('click', function () { afficher(b.getAttribute('data-projet')); });
    });
  })();

  /* ---------- 7. Widget carrousel (défilement vertical infini) ---------- */
  (function () {
    var piste = document.getElementById('piste');
    var pointsEl = document.getElementById('points');
    if (!piste) return;
    var images = Array.prototype.slice.call(piste.children);
    var n = images.length, index = 0;
    var copie = images[0].cloneNode(true);       // copie de la 1re image, pour boucler sans saut visible
    copie.setAttribute('alt', ''); copie.setAttribute('aria-hidden', 'true');
    piste.appendChild(copie);

    for (var i = 0; i < n; i++) pointsEl.appendChild(document.createElement('i'));
    var points = pointsEl.children;

    function hauteur() { return piste.parentElement.clientHeight; }
    function calibrer() {                       // chaque image fait exactement la hauteur visible du widget
      var h = hauteur() + 'px';
      for (var k = 0; k < piste.children.length; k++) piste.children[k].style.height = h;
    }
    function afficher() {
      calibrer();
      piste.style.transform = 'translateY(' + (-index * hauteur()) + 'px)';
      for (var j = 0; j < n; j++) points[j].classList.toggle('est-actif', j === (index % n));
    }
    function suivant() { index += 1; afficher(); }

    piste.addEventListener('transitionend', function () {
      if (index >= n) {
        piste.classList.add('sans-transition'); index = 0; afficher();
        void piste.offsetHeight; piste.classList.remove('sans-transition');
      }
    });
    window.addEventListener('resize', function () { piste.classList.add('sans-transition'); afficher(); void piste.offsetHeight; piste.classList.remove('sans-transition'); });

    afficher();
    if (!reduit) {
      var minuteur = setInterval(suivant, 3000);
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { clearInterval(minuteur); } else { minuteur = setInterval(suivant, 3000); }
      });
    }
  })();

  /* ---------- 8. Widget rappels (compteur) ---------- */
  (function () {
    var boites = document.querySelectorAll('#rappels input');
    var nombre = document.getElementById('rappels-nombre');
    function maj() {
      var restant = 0;
      boites.forEach(function (b) { if (!b.checked) restant += 1; });
      nombre.textContent = restant;
    }
    boites.forEach(function (b) { b.addEventListener('change', maj); });
    maj();
  })();

  /* ---------- 9. Vidéos de démonstration (chargées au clic) ---------- */
  document.querySelectorAll('.demo-lecture').forEach(function (b) {
    b.addEventListener('click', function () {
      var video = document.createElement('video');
      video.src = b.getAttribute('data-video');
      video.controls = true; video.autoplay = true; video.playsInline = true;
      video.setAttribute('aria-label', 'Vidéo de démonstration');
      b.replaceWith(video);
      video.focus();
    });
  });

  /* ---------- Démarrage ---------- */
  ajusterEchelle();
  majHorloge();
  setInterval(majHorloge, 20000);
  window.addEventListener('resize', ajusterEchelle);
  if (!estMobile()) ouvrir('apropos');      // à l'arrivée : la fenêtre « À propos de moi » est ouverte
})();
