  const PARCELS = {
    19: {
      label: 'Annexe du Pavillon Bertin',
      title: 'Annexe du Pavillon Bertin',
      desc:  'Bâtiment historique central — futur pôle d\'artisanat d\'art et de résidences.',
      panel: {
        eyebrow: '01 — Dépendance',
        title:   'Annexe du <em>Pavillon Bertin</em>',
        subtitle: 'Réhabilitation · Phase 2 · 2027',
        desc:    'Dépendance directe du pavillon principal, cette annexe complète l\'ensemble bâti. Sa reconversion est prévue en ateliers de travail partagés et espaces de stockage pour les artisans résidents.',
        stats: [
          { val: '~240', unit: 'm²', lbl: 'Surface totale' },
          { val: 'Ph. 2', unit: '',  lbl: 'Phase de travaux' },
          { val: '2027', unit: '',   lbl: 'Début des travaux' },
          { val: '4+', unit: '',     lbl: 'Ateliers prévus' },
        ],
        tags: ['Ateliers partagés', 'Stockage'],
        cta:  { label: 'Voir les aides disponibles', href: 'financements.html' },
        financements: [],
      }
    },
    51: {
      label: 'Chapelle',
      title: 'Chapelle de l\'ancien hôpital',
      desc:  'Édifice néo-roman du XIXe — reconversion culturelle et artistique.',
      panel: {
        eyebrow: '02 — Édifice patrimonial',
        title:   'La <em>Chapelle</em>',
        subtitle: 'Construction 1895 · Néo-roman · Conservation intégrale',
        desc:    'Cœur patrimonial du site, la chapelle de l\'ancien hôpital conserve ses volumes intérieurs d\'origine — voûtes en pierre de taille, baies cintrées et charpente bois. La réhabilitation prévoit un usage polyvalent en journée et des résidences d\'artistes en rotation.',
        stats: [
          { val: '~420', unit: 'm²', lbl: 'Surface totale' },
          { val: '1895', unit: '',   lbl: 'Année de construction' },
          { val: 'Ph. 1', unit: '',  lbl: 'Phase prioritaire' },
          { val: '2026', unit: '',   lbl: 'Début des travaux' },
        ],
        tags: ['Artisanat d\'art', 'Résidences', 'Patrimoine'],
        cta:  { label: 'Voir les aides disponibles', href: 'financements.html?bat=chapelle' },
        financements: [
          { cat: 'etat',   name: 'Subvention travaux SPR (DRAC)',       amount: '~15 %' },
          { cat: 'etat',   name: 'Subvention études préalables',         amount: 'Aide partielle' },
          { cat: 'fiscal', name: 'Label Fondation du Patrimoine',         amount: 'Max 10 000 €' },
          { cat: 'fiscal', name: 'Déficit foncier (droit commun)',        amount: '10 700 €/an' },
          { cat: 'fiscal', name: 'Déduction fiscale label IR',            amount: '100 % / 3 ans' },
          { cat: 'fiscal', name: 'TVA à taux réduit (10 %)',              amount: 'Travaux éligibles' },
          { cat: 'fiscal', name: 'Fondations privées (VMF, Mérimée…)',    amount: 'Variable' },
          { cat: 'dept',   name: 'Partenariat Ville de Parthenay',        amount: 'Abondement + accomp.' },
        ],
      }
    },
    52: {
      label: 'Sacristie',
      title: 'Sacristie de la chapelle',
      desc:  'Annexe de la chapelle — petite salle voûtée à reconvertir.',
      panel: {
        eyebrow: '03 — Annexe de la chapelle',
        title:   'La <em>Sacristie</em>',
        subtitle: 'Réhabilitation · Phase 1 · 2026',
        desc:    'Petite salle voûtée accolée à la chapelle, la sacristie offre un espace intime idéal pour des ateliers de petite lutherie, bijouterie ou enluminure. Volume compact, fort potentiel.',
        stats: [
          { val: '~65', unit: 'm²',  lbl: 'Surface totale' },
          { val: 'Ph. 1', unit: '',  lbl: 'Phase prioritaire' },
          { val: '2026', unit: '',   lbl: 'Début des travaux' },
          { val: '2–3', unit: '',    lbl: 'Artisans accueillis' },
        ],
        tags: ['Lutherie', 'Bijouterie', 'Ateliers fins'],
        cta:  { label: 'Voir les aides disponibles', href: 'financements.html?bat=sacristie' },
        financements: [
          { cat: 'etat',   name: 'Subvention travaux SPR (DRAC)',       amount: '~15 %' },
          { cat: 'etat',   name: 'Subvention études préalables',         amount: 'Aide partielle' },
          { cat: 'fiscal', name: 'Label Fondation du Patrimoine',         amount: 'Max 10 000 €' },
          { cat: 'fiscal', name: 'Déduction fiscale label IR',            amount: '100 % / 3 ans' },
          { cat: 'fiscal', name: 'TVA à taux réduit (10 %)',              amount: 'Travaux éligibles' },
          { cat: 'fiscal', name: 'Fondations privées (VMF, Mérimée…)',    amount: 'Variable' },
          { cat: 'dept',   name: 'Partenariat Ville de Parthenay',        amount: 'Abondement + accomp.' },
        ],
      }
    },
    53: {
      label: 'Pavillon Bertin',
      title: 'Pavillon Bertin',
      desc:  'Bâtiment principal de l\'ancien hospice — futur centre du projet.',
      panel: {
        eyebrow: '04 — Bâtiment principal',
        title:   'Pavillon <em>Bertin</em>',
        subtitle: 'Réhabilitation complète · Phase 1 & 2 · 2026–2027',
        desc:    'Édifice central de l\'ancien hospice, le Pavillon Bertin accueillera l\'ensemble des fonctions structurantes du projet : accueil, boutique, espaces de co-working et logements des artisans en résidence longue durée.',
        stats: [
          { val: '~680', unit: 'm²', lbl: 'Surface totale' },
          { val: 'Ph. 1', unit: '',  lbl: 'Phase prioritaire' },
          { val: '2026', unit: '',   lbl: 'Début des travaux' },
          { val: '550k', unit: '€',  lbl: 'Investissement total' },
        ],
        tags: ['Accueil', 'Co-working', 'Résidences'],
        cta:  { label: 'Voir la simulation financière', href: 'pavillon-bertin.html' },
        financements: [
          { cat: 'etat',   name: 'DRAC — Patrimoine & Culture',       amount: 'Jusqu\'à 40 %' },
          { cat: 'etat',   name: 'Fondation du Patrimoine',            amount: '10–50 %' },
          { cat: 'etat',   name: 'INMA — Métiers d\'art',              amount: 'Ingénierie + subv.' },
          { cat: 'etat',   name: 'DGD — volet culture',                amount: 'Via collectivité' },
          { cat: 'europe', name: 'FEDER',                               amount: '50–60 %' },
          { cat: 'europe', name: 'LEADER — Développement rural',       amount: '30–50 %' },
          { cat: 'region', name: 'Région NA — Immobilier artisanal',   amount: '15–30 %' },
          { cat: 'region', name: 'Région NA — Hébergement touristique',amount: 'Jusqu\'à 20 %' },
          { cat: 'dept',   name: 'Conseil Départemental 79',           amount: '10–20 %' },
          { cat: 'dept',   name: 'CCPG',                                amount: 'Aide + ingénierie' },
          { cat: 'fiscal', name: 'Malraux / Déficit foncier',          amount: '22–30 %' },
          { cat: 'fiscal', name: 'Banque des Territoires',              amount: 'Prêt bonifié' },
          { cat: 'fiscal', name: 'Label Vélo Francette',                amount: '20–40 %' },
        ],
      }
    },
  };

  const CAT_COLORS = { etat:'var(--cat-etat)', europe:'var(--cat-europe)', region:'var(--cat-region)', dept:'var(--cat-dept)', fiscal:'var(--cat-fiscal)' };

  /* Difficulté d'obtention estimée (1 = très accessible → 5 = structurellement fermé à une SCI privée).
     Cf. NOTES-difficulte-aides.md. Les clés sont les libellés courts utilisés ci-dessus. */
  const DIFF = {
    'Subvention travaux SPR (DRAC)': 4,
    'Subvention études préalables': 3,
    'Label Fondation du Patrimoine': 3,
    'Déficit foncier (droit commun)': 2,
    'Déduction fiscale label IR': 3,
    'TVA à taux réduit (10 %)': 1,
    'Fondations privées (VMF, Mérimée…)': 4,
    'Partenariat Ville de Parthenay': 2,
    'DRAC — Patrimoine & Culture': 4,
    'Fondation du Patrimoine': 4,
    "INMA — Métiers d'art": 3,
    'DGD — volet culture': 5,
    'FEDER': 5,
    'LEADER — Développement rural': 5,
    'Région NA — Immobilier artisanal': 3,
    'Région NA — Hébergement touristique': 4,
    'Conseil Départemental 79': 4,
    'CCPG': 3,
    'Malraux / Déficit foncier': 4,
    'Banque des Territoires': 5,
    'Label Vélo Francette': 2,
  };
  const DIFF_LABEL = ['', 'Très accessible', 'Accessible', 'Modéré', 'Difficile', 'Très difficile'];
  function diffBar(name) {
    const n = DIFF[name];
    if (!n) return '';
    const cells = Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
    return `<span class="sp-fin-diff lvl-${n}" title="Difficulté d'obtention : ${n}/5 — ${DIFF_LABEL[n]}">${cells}</span>`;
  }

  /* Site officiel de demande, par libellé court. Cf. financements.html pour le détail. */
  const APPLY = {
    'Subvention travaux SPR (DRAC)': 'https://www.culture.gouv.fr/catalogue-des-demarches-et-subventions/subvention/etudes-et-travaux-sur-monuments-historiques',
    'Subvention études préalables': 'https://www.culture.gouv.fr/catalogue-des-demarches-et-subventions/subvention/etudes-et-travaux-sur-monuments-historiques',
    'Label Fondation du Patrimoine': 'https://www.fondation-patrimoine.org/c/soumettre-un-projet/defiscaliser-travaux/232',
    'Déficit foncier (droit commun)': 'https://www.impots.gouv.fr/particulier/les-revenus-fonciers',
    'Déduction fiscale label IR': 'https://www.fondation-patrimoine.org/c/soumettre-un-projet/defiscaliser-travaux/232',
    'TVA à taux réduit (10 %)': 'https://www.impots.gouv.fr/professionnel/questions/quel-taux-de-tva-appliquer-pour-les-travaux-realises-dans-les-logements',
    'Fondations privées (VMF, Mérimée…)': 'https://www.sauvegardeartfrancais.fr/nos-projets/edifices/',
    'Partenariat Ville de Parthenay': 'https://www.parthenay.fr/utile/urbanisme/fondationdupatrimoine',
    'DRAC — Patrimoine & Culture': 'https://www.culture.gouv.fr/regions/drac-nouvelle-aquitaine',
    'Fondation du Patrimoine': 'https://www.fondation-patrimoine.org/c/soumettre-un-projet/defiscaliser-travaux/232',
    "INMA — Métiers d'art": 'https://www.culture.gouv.fr/catalogue-des-demarches-et-subventions/appels-a-projets-candidatures/aide-a-l-installation-ou-a-la-modernisation-d-ateliers-d-artisanat-d-art-aima',
    'DGD — volet culture': 'https://www.culture.gouv.fr/catalogue-des-demarches-et-subventions/subvention/dotation-generale-de-decentralisation-dgd',
    'FEDER': 'https://www.europe-en-nouvelle-aquitaine.eu/',
    'LEADER — Développement rural': 'https://www.pays-gatine.com/fonds-europeens-2021-2027.html',
    'Région NA — Immobilier artisanal': 'https://les-aides.nouvelle-aquitaine.fr/',
    'Région NA — Hébergement touristique': 'https://entreprises.nouvelle-aquitaine.fr/',
    'Conseil Départemental 79': 'https://www.deux-sevres.fr/services-en-ligne/aides-et-subventions/guide-des-aides',
    'CCPG': 'https://www.cc-parthenay-gatine.fr/',
    'Malraux / Déficit foncier': 'https://www.impots.gouv.fr/particulier/immeubles-speciaux-0',
    'Banque des Territoires': 'https://www.banquedesterritoires.fr/pret-action-coeur-de-ville',
    'Label Vélo Francette': 'https://www.francevelotourisme.com/devenir-accueil-velo',
  };
  function applyLink(name) {
    const u = APPLY[name];
    return u ? `<a class="sp-fin-link" href="${u}" target="_blank" rel="noopener noreferrer" title="Site officiel de demande" aria-label="Site officiel de demande"><svg class="icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 8l4-4M5 4h3v3"/></svg></a>` : '';
  }

  /* ── REFS DOM ── */
  const tooltip  = document.getElementById('tooltip');
  const ttLabel  = document.getElementById('tt-label');
  const ttTitle  = document.getElementById('tt-title');
  const ttDesc   = document.getElementById('tt-desc');
  const wrap     = document.querySelector('.map-wrap');
  const panel    = document.getElementById('side-panel');
  const spClose  = document.getElementById('sp-close');
  let   activeNum = null;

  /* ── PANNEAU ── */
  function openPanel(data) {
    const p = data.panel;
    document.getElementById('sp-eyebrow').textContent = p.eyebrow;
    document.getElementById('sp-title').innerHTML     = p.title;
    document.getElementById('sp-subtitle').textContent= p.subtitle;
    document.getElementById('sp-desc').textContent    = p.desc;
    document.getElementById('sp-stats').innerHTML = p.stats.map(s =>
      `<div class="sp-stat">
        <div class="val">${s.val}<em>${s.unit}</em></div>
        <div class="lbl">${s.lbl}</div>
      </div>`
    ).join('');
    const fins = p.financements || [];
    document.getElementById('sp-fin').innerHTML = fins.length
      ? `<div class="sp-fin-hd">
           <span class="sp-fin-lbl">Aides &amp; Financements</span>
           <span class="sp-fin-cnt">${fins.length} dispositifs</span>
         </div>
         <div class="sp-fin-list">${fins.map(f =>
           `<div class="sp-fin-item">
              <div class="sp-fin-r1">
                <span class="sp-fin-dot" style="background:${CAT_COLORS[f.cat]}"></span>
                <span class="sp-fin-name">${f.name}</span>
              </div>
              <div class="sp-fin-r2">
                ${diffBar(f.name)}
                <span class="sp-fin-amt">${f.amount}</span>
                ${applyLink(f.name)}
              </div>
            </div>`
         ).join('')}</div>
         <p class="sp-fin-note">Les barres indiquent la difficulté d'obtention estimée, de 1 à 5.</p>
         <a class="sp-fin-more" href="financements.html">Voir le détail complet <svg class="icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a>`
      : `<div class="sp-fin-hd"><span class="sp-fin-lbl">Aides &amp; Financements</span></div>
         <p class="sp-fin-empty">À identifier — prochaine version du dossier.</p>`;
    document.getElementById('sp-tags').innerHTML =
      p.tags.map(t => `<span class="tag">${t}</span>`).join('');
    document.getElementById('sp-cta').innerHTML =
      `<a href="${p.cta.href}">${p.cta.label}</a>`;
    panel.classList.add('open');
    document.body.classList.add('panel-open');
    tooltip.classList.remove('show');
  }

  function closePanel() {
    panel.classList.remove('open');
    document.body.classList.remove('panel-open');
    activeNum = null;
    document.querySelectorAll('#BUILDINGS path.is-active').forEach(p => p.classList.remove('is-active'));
  }

  spClose.addEventListener('click', e => { e.stopPropagation(); closePanel(); });
  panel.addEventListener('click',   e => e.stopPropagation());
  wrap.addEventListener('click',    () => closePanel());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  /* ── BÂTIMENTS ── */
  document.querySelectorAll('#BUILDINGS path').forEach((path, i) => {
    const num  = i + 1;
    const data = PARCELS[num];

    if (!data) { path.style.cursor = 'default'; return; }

    path.classList.add('interactive-parcel');

    path.addEventListener('mouseenter', () => {
      ttLabel.textContent = data.label;
      ttTitle.textContent = data.title;
      ttDesc.textContent  = data.desc;
      tooltip.classList.add('show');
    });
    path.addEventListener('mousemove', e => {
      const r = wrap.getBoundingClientRect();
      let x = e.clientX - r.left + 16;
      let y = e.clientY - r.top  - 55;
      if (x + 260 > r.width) x = e.clientX - r.left - 260;
      if (y < 8) y = 8;
      tooltip.style.left = x + 'px';
      tooltip.style.top  = y + 'px';
    });
    path.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    path.addEventListener('click', e => {
      e.stopPropagation();
      if (activeNum === num) { closePanel(); return; }
      activeNum = num;
      document.querySelectorAll('#BUILDINGS path.is-active').forEach(p => p.classList.remove('is-active'));
      path.classList.add('is-active');
      openPanel(data);
    });
  });
