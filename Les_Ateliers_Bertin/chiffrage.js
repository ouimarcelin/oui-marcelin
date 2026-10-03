/* ── CHIFFRAGE DES TRAVAUX — fourchettes basse et haute, par catégorie, poste et bâtiment ──
   Données : cahier des charges, plans et diagnostics de la Ville (2004, 2015, septembre–octobre 2025),
   prix 2026 hors taxes. Hypothèses, quantités et sources : NOTES-chiffrage.md.
   Chaque poste porte soit des montants par bâtiment [bas, haut], soit un taux [bas, haut]
   appliqué aux travaux du bâtiment (somme des catégories marquées travaux: true).
   Les tableaux ci-dessous sont l’estimation d’origine : tout est modifiable depuis la page
   (bouton Modifier), les modifications sont enregistrées dans Firebase et localStorage. */
(function () {
  'use strict';

  const BATIMENTS = [
    { id: 'pav', nom: 'Pavillon Bertin',       court: 'Pavillon',        surface: 780, info: 'Cave, rez-de-chaussée, étage et combles' },
    { id: 'mdj', nom: 'Maison des Jeux',       court: 'Maison des Jeux', surface: 181, info: 'Rez-de-chaussée, en bon état' },
    { id: 'cha', nom: 'Chapelle et sacristie', court: 'Chapelle',        surface: 250, info: 'Hors dossier de vente de la Ville' },
    { id: 'sq',  nom: 'Square Bertin',         court: 'Square',          surface: 330, info: 'Square et passages' },
  ];
  const BERTIN = ['pav', 'mdj', 'sq'];                   // périmètre des phases 1 à 4 et de la cour du prévisionnel
  const PREVI = ['ph1', 'ph2', 'ph3', 'ph4', 'ph5'];
  const PREVI_DEFAUT = 550000;

  const BLOCS = [
    { id: 'preparer',  nom: 'Préparer le projet' },
    { id: 'enveloppe', nom: 'Restaurer l’enveloppe' },
    { id: 'interieur', nom: 'Aménager et équiper' },
    { id: 'abords',    nom: 'Abords et marges' },
  ];

  const CATEGORIES = [
    { id: 'etudes', bloc: 'preparer', travaux: false, nom: 'Études et maîtrise d’œuvre',
      resume: 'Relevés, diagnostics, architecte, bureaux d’études et contrôles obligatoires',
      postes: [
        { nom: 'Relevé de géomètre', desc: 'Plans, coupes et façades cotés : les plans de la Ville datent de 2004 et 2015 et restent partiels.',
          base: 'Forfait par bâtiment', pav: [3500, 7000], mdj: [1200, 2500], cha: [1800, 3500], sq: [800, 1800] },
        { nom: 'Repérage amiante et plomb avant travaux', desc: 'Obligatoire avant le chantier, avec sondages destructifs : les diagnostics de vente de 2025 ne suffisent pas.',
          base: '≈ 2 à 4 €/m² et analyses de laboratoire', pav: [2500, 5000], mdj: [800, 1600], cha: [1000, 2500] },
        { nom: 'Diagnostic de structure', desc: 'Charpentes, planchers et maçonneries : ce que l’on garde, ce que l’on renforce, ce que l’on remplace.',
          base: 'Bureau d’études, forfait', pav: [2500, 6000], mdj: [800, 2000], cha: [1500, 3500] },
        { nom: 'Diagnostic patrimonial', desc: 'État sanitaire et histoire du bâti, attendus par l’Architecte des Bâtiments de France et utiles aux dossiers d’aides.',
          base: 'Architecte du patrimoine, forfait', pav: [4000, 9000], mdj: [1000, 2500], cha: [2500, 6000] },
        { nom: 'Architecte du patrimoine', desc: 'Mission complète : conception, permis et échanges avec l’ABF, consultation des entreprises, suivi du chantier jusqu’à la réception.',
          base: '9 à 11 % des travaux', taux: [0.09, 0.11] },
        { nom: 'Bureaux d’études techniques', desc: 'Structure, électricité, plomberie, chauffage, thermique et acoustique : calculs et plans d’exécution.',
          base: '2 à 3 % des travaux', taux: [0.02, 0.03] },
        { nom: 'Contrôle technique', desc: 'Obligatoire pour un lieu qui reçoit du public : solidité, sécurité incendie, accessibilité.',
          base: '0,7 à 1 % des travaux', taux: [0.007, 0.01] },
        { nom: 'Coordination sécurité et santé', desc: 'Obligatoire dès que plusieurs entreprises travaillent en même temps sur le chantier.',
          base: '0,6 à 1 % des travaux', taux: [0.006, 0.01] },
      ] },

    { id: 'demarches', bloc: 'preparer', travaux: false, nom: 'Assurances, démarches et financement',
      resume: 'Assurance dommages-ouvrage, frais du prêt, servitudes et obligations liées au site',
      postes: [
        { nom: 'Assurances du chantier', desc: 'Dommages-ouvrage, obligatoire pour le maître d’ouvrage : elle fait réparer vite les désordres graves pendant dix ans. Tous risques chantier en complément.',
          base: '1,5 à 2,8 % des travaux', taux: [0.015, 0.028] },
        { nom: 'Frais du prêt', desc: 'Frais de dossier, garantie (hypothèque ou caution) et intérêts payés pendant le chantier, avant le remboursement.',
          base: '≈ 0,8 à 1,8 % des travaux, selon le prêt', taux: [0.008, 0.018] },
        { nom: 'Servitudes et actes', desc: 'Façade est en limite du terrain du Département : servitudes de vue, de passage et de tour d’échelle, réseaux partagés avec l’ancien hôpital.',
          base: 'Notaire et géomètre (la division du terrain est payée par la Ville)', pav: [1500, 5000] },
        { nom: 'Stationnement', desc: 'Le cahier des charges demande une réponse au besoin de places : location ou concession dans un parking proche.',
          base: 'Selon les exigences du plan de sauvegarde', ecart: 'Basse : aucune place exigée · Haute : concession de longue durée', pav: [0, 10000] },
        { nom: 'Archéologie et taxe d’aménagement', desc: 'Le terrain est en zone archéologique : un diagnostic peut être prescrit si l’on creuse (drainage, fosse d’ascenseur, réseaux).',
          base: 'Seulement en cas de prescription ou de surface créée', pav: [0, 6000], sq: [0, 4000] },
        { nom: 'Frais divers', desc: 'Constat d’affichage du permis, reprographie, occupation du domaine public pendant le chantier.',
          base: 'Forfait', pav: [1500, 4000], mdj: [300, 800], cha: [500, 1500], sq: [300, 800] },
      ] },

    { id: 'preparation', bloc: 'preparer', travaux: true, nom: 'Préparation et dépollution',
      resume: 'Installation du chantier, échafaudages, curage, retrait de l’amiante et du plomb',
      postes: [
        { nom: 'Installation de chantier', desc: 'Clôtures, base vie, branchements provisoires, bennes et protection de la voirie dans une rue étroite du quartier médiéval.',
          base: 'Forfait par bâtiment', pav: [9000, 16000], mdj: [1500, 4000], cha: [2500, 5000], sq: [1000, 3000] },
        { nom: 'Échafaudages', desc: 'Montage, location pendant quatre à six mois et démontage, pour les façades et les toitures.',
          base: '≈ 570 m² de façades × 25 à 40 €/m² (Pavillon)', pav: [14000, 22000], mdj: [3000, 5000], cha: [7000, 14000] },
        { nom: 'Curage intérieur', desc: 'Dépose des cloisons, faux plafonds, revêtements et équipements de l’ancien hôpital, évacuation en décharge.',
          base: '≈ 780 m² × 15 à 28 €/m² (Pavillon)', pav: [12000, 22000], mdj: [1000, 3500], cha: [2000, 6000] },
        { nom: 'Désamiantage', desc: 'Dalles de sol de deux pièces de l’étage, conduits et débris en fibres-ciment dans les caves et le grenier. Entreprise certifiée et mesures d’air.',
          base: 'Diagnostics 2025 : 6 matériaux amiantés au Pavillon, 2 à la Maison des Jeux', ecart: 'Haute : amiante caché sous d’autres revêtements',
          pav: [8000, 25000], mdj: [1000, 4000], cha: [0, 5000] },
        { nom: 'Traitement du plomb', desc: 'Peintures au plomb dégradées à décaper ou recouvrir avant d’accueillir hôtes et locataires. La chapelle, ancien cabinet de radiologie, peut cacher des protections en plomb.',
          base: 'Constat de risque d’exposition au plomb 2025 : classe 3 relevée', pav: [4000, 14000], cha: [0, 6000] },
      ] },

    { id: 'toiture', bloc: 'enveloppe', travaux: true, nom: 'Toiture et charpente',
      resume: 'Ardoises, charpente, gouttières et lucarnes',
      postes: [
        { nom: 'Couverture en ardoise', desc: 'Remplacement des ardoises cassées, faîtage, solins et souches de cheminée, ou réfection complète en ardoise naturelle sur voliges neuves.',
          base: '≈ 400 m² × 55 à 190 €/m² (Pavillon)', ecart: 'Basse : remaniage · Haute : réfection complète',
          pav: [22000, 75000], mdj: [3000, 7000], cha: [6000, 25000] },
        { nom: 'Charpente', desc: 'Traitement contre les insectes et les champignons, remplacement des bois abîmés près des gouttières, renforts pour aménager les combles.',
          base: 'Selon le diagnostic de structure', pav: [8000, 25000], mdj: [800, 4000], cha: [2000, 10000] },
        { nom: 'Gouttières et descentes', desc: 'Exigé par la Ville dans les cinq ans : conforter ou remplacer gouttières, chéneaux et descentes d’eaux pluviales, en zinc avec dauphins en fonte.',
          base: '≈ 60 m de gouttières et 50 m de descentes (Pavillon)', pav: [8000, 16000], mdj: [1500, 4000], cha: [2500, 7000] },
        { nom: 'Lucarnes et fenêtres de toit', desc: 'Éclairer les deux logements des combles : restauration ou création de lucarnes, châssis de toit de type patrimoine validés par l’ABF.',
          base: '4 à 6 ouvertures × 2 000 à 4 000 €', pav: [8000, 24000] },
      ] },

    { id: 'facades', bloc: 'enveloppe', travaux: true, nom: 'Façades et structure',
      resume: 'Ravalement à la chaux, pierre de taille, maçonneries, planchers et cave',
      postes: [
        { nom: 'Ravalement à la chaux', desc: 'Nettoyage doux, rejointoiement et enduits à la chaux, seuls admis sur le bâti ancien du secteur sauvegardé. Nettoyage de la chapelle en partie couvert par le prix Sésame.',
          base: '≈ 460 m² × 60 à 120 €/m² (Pavillon)', ecart: 'Basse : nettoyage et reprises · Haute : enduits refaits partout',
          pav: [28000, 55000], mdj: [5000, 10000], cha: [10000, 25000] },
        { nom: 'Pierre de taille', desc: 'Encadrements de fenêtres, appuis, bandeaux et corniches en calcaire : ragréages et remplacement des pierres abîmées.',
          base: 'Selon l’état relevé depuis l’échafaudage', pav: [6000, 18000], mdj: [0, 3000], cha: [3000, 10000] },
        { nom: 'Maçonneries et fissures', desc: 'Reprise des fissures, des linteaux et des appuis, agrafages et reprises ponctuelles sous les murs.',
          base: 'Selon le diagnostic de structure', pav: [5000, 20000], mdj: [1000, 4000], cha: [2000, 8000] },
        { nom: 'Planchers', desc: 'Renforcer ou remplacer les planchers bois pour les charges d’une auberge et de logements, avec isolation acoustique entre les niveaux.',
          base: '≈ 400 m² concernés × 15 à 80 €/m²', ecart: 'Basse : renforts ponctuels · Haute : planchers de l’étage et des combles refaits', pav: [6000, 32000] },
        { nom: 'Assainissement de la cave', desc: 'Drainage le long des murs, ventilation, traitement des remontées d’humidité et sol, pour ranger vélos et matériel au sec.',
          base: '≈ 180 m² de caves, 60 m de drainage', pav: [12000, 30000] },
      ] },

    { id: 'menuiseries', bloc: 'enveloppe', travaux: true, nom: 'Menuiseries extérieures',
      resume: 'Fenêtres, portes, volets, garde-corps et vitraux',
      postes: [
        { nom: 'Fenêtres', desc: 'Exigé par la Ville dans les cinq ans. Restauration des fenêtres bois quand elles le permettent, sinon fenêtres neuves en chêne ou mélèze, avec petits-bois et double vitrage mince.',
          base: '≈ 38 fenêtres × 1 200 à 2 500 € (Pavillon)', ecart: 'Basse : surtout des restaurations · Haute : tout en neuf sur mesure',
          pav: [45000, 95000], mdj: [3000, 12000] },
        { nom: 'Portes extérieures', desc: 'Porte d’entrée à deux vantaux, portes latérales et accès de la cave, restaurées ou refaites à l’identique.',
          base: '≈ 5 portes × 2 000 à 4 500 € (Pavillon)', pav: [10000, 22000], mdj: [1500, 6000], cha: [2000, 8000] },
        { nom: 'Volets ou persiennes', desc: 'Seulement si l’ABF demande de restituer l’aspect d’origine.',
          base: '0 à 38 volets × 500 €', ecart: 'Basse : non demandés', pav: [0, 18000] },
        { nom: 'Garde-corps et ferronneries', desc: 'Garde-corps devant les fenêtres basses de l’étage pour la sécurité des hôtes, grilles de soupiraux.',
          base: '≈ 20 garde-corps × 250 à 600 €', pav: [5000, 12000], mdj: [0, 2000], cha: [0, 3000] },
        { nom: 'Vitraux', desc: 'Restauration des vitraux de la chapelle et verrières de protection, en partie réalisable dans l’atelier du vitrailliste.',
          base: 'Selon la part faite en atelier', cha: [3000, 22000] },
      ] },

    { id: 'interieurs', bloc: 'interieur', travaux: true, nom: 'Aménagements intérieurs',
      resume: 'Isolation, cloisons et plafonds, portes, escaliers, sols et peintures',
      postes: [
        { nom: 'Isolation des murs', desc: 'Isolants respirants (chaux-chanvre, fibre de bois) qui laissent sécher les murs anciens. Priorité à l’auberge et aux logements.',
          base: '200 à 400 m² × 60 à 90 €/m²', ecart: 'Basse : auberge et logements · Haute : aussi les ateliers',
          pav: [12000, 36000], mdj: [0, 4000], cha: [0, 5000] },
        { nom: 'Isolation de la toiture', desc: 'Rampants des combles aménagés et plancher du grenier. Indispensable pour louer : les logements classés G sont interdits à la location depuis 2025, les F le seront en 2028.',
          base: '≈ 280 m² × 40 à 85 €/m² (Pavillon)', pav: [11000, 24000], mdj: [0, 4000] },
        { nom: 'Cloisons et plafonds', desc: 'Chambres, logements et ateliers ; parois et plafonds coupe-feu entre l’auberge, les ateliers et les logements.',
          base: '≈ 530 m² aménagés × 55 à 105 €/m²', pav: [30000, 55000], mdj: [2000, 6000], cha: [1500, 6000] },
        { nom: 'Portes intérieures', desc: 'Environ trente portes, dont les portes coupe-feu des chambres ; restauration des portes anciennes.',
          base: '≈ 30 portes × 400 à 900 €', pav: [12000, 28000], mdj: [1000, 4000], cha: [800, 3000] },
        { nom: 'Escaliers', desc: 'Grand escalier à restaurer et à mettre aux normes (main courante, hauteur du garde-corps, marches visibles), accès aux combles.',
          base: 'Selon l’état et l’avis du contrôleur technique', pav: [4000, 16000] },
        { nom: 'Sols', desc: 'Sols résistants pour les ateliers, parquet ou sol souple pour l’auberge et les logements, carrelage des pièces d’eau ; sols anciens conservés quand c’est possible.',
          base: '≈ 710 m² × 30 à 65 €/m² (Pavillon)', pav: [22000, 45000], mdj: [0, 5000], cha: [2000, 10000] },
        { nom: 'Peintures et finitions', desc: 'Murs, plafonds et boiseries, avec des peintures minérales adaptées au bâti ancien.',
          base: '≈ 2 000 m² × 11 à 20 €/m² (Pavillon)', pav: [22000, 40000], mdj: [2500, 7000], cha: [4000, 12000] },
      ] },

    { id: 'technique', bloc: 'interieur', travaux: true, nom: 'Électricité, plomberie, chauffage',
      resume: 'Réseaux neufs, sanitaires, chauffage, ventilation et raccordements',
      postes: [
        { nom: 'Électricité', desc: 'Installation neuve : tableau et compteur par atelier et par logement, prises renforcées et triphasé pour les ateliers, éclairage, réseau informatique.',
          base: '≈ 780 m² × 65 à 110 €/m² (Pavillon)', pav: [50000, 85000], mdj: [3000, 8000], cha: [3000, 12000] },
        { nom: 'Plomberie et sanitaires', desc: 'Deux blocs douches et WC pour l’auberge dont un accessible, salles d’eau des deux logements, éviers des ateliers, eau chaude.',
          base: 'Une vingtaine d’appareils sanitaires (Pavillon)', pav: [50000, 80000], mdj: [1000, 5000], cha: [2000, 8000] },
        { nom: 'Chauffage', desc: 'Solution électrique performante en fourchette basse, pompe à chaleur air-eau et radiateurs en fourchette haute ; unités extérieures cachées à la vue.',
          base: '≈ 40 à 55 kW de besoins (Pavillon)', ecart: 'Basse : électrique performant · Haute : pompe à chaleur air-eau',
          pav: [28000, 65000], mdj: [0, 6000], cha: [5000, 15000] },
        { nom: 'Ventilation', desc: 'Extraction dans les pièces d’eau, la cuisine partagée et les logements ; renouvellement d’air des ateliers.',
          base: 'Ventilation mécanique simple flux', pav: [8000, 18000], mdj: [0, 3000], cha: [0, 4000] },
        { nom: 'Réseaux et raccordements', desc: 'Séparer les réseaux hérités de l’ancien hôpital et créer des branchements propres : électricité, eau, assainissement, fibre.',
          base: 'Demandé par le cahier des charges de la Ville', pav: [10000, 22000], mdj: [3000, 7000], cha: [1000, 4000] },
      ] },

    { id: 'securite', bloc: 'interieur', travaux: true, nom: 'Sécurité et accessibilité',
      resume: 'Alarme, compartimentage, dégagements, accès de plain-pied et ascenseur',
      postes: [
        { nom: 'Alarme et détection incendie', desc: 'Alarme adaptée au classement du lieu qui reçoit du public, détecteurs dans les chambres, vérifications avant l’ouverture.',
          base: 'Selon le classement retenu par la commission de sécurité', pav: [4000, 14000], mdj: [1000, 3000], cha: [1000, 3000] },
        { nom: 'Éclairage de secours et signalétique', desc: 'Blocs de secours, plans d’évacuation, extincteurs et pictogrammes.',
          base: 'Forfait', pav: [3000, 7000], mdj: [800, 2000], cha: [800, 2000] },
        { nom: 'Compartimentage et désenfumage', desc: 'Escalier fermé par des parois coupe-feu, portes à fermeture automatique, ouverture de désenfumage en haut de l’escalier.',
          base: 'Forfait', pav: [8000, 22000] },
        { nom: 'Second escalier', desc: 'Seulement si la commission de sécurité l’exige, selon le nombre de couchages et la place des logements au-dessus de l’auberge.',
          base: 'Escalier de secours intérieur ou extérieur', ecart: 'Basse : non exigé avec 15 couchages', pav: [0, 35000] },
        { nom: 'Accès de plain-pied', desc: 'Le rez-de-chaussée du Pavillon est surélevé au-dessus de la cave : rampe ou plateforme élévatrice, seuils et cheminements adaptés.',
          base: 'Rampe ≈ 8 000 €, plateforme jusqu’à 20 000 €', pav: [8000, 20000], mdj: [1000, 4000], cha: [2000, 8000] },
        { nom: 'Ascenseur', desc: 'Pour desservir l’auberge et les logements. Une dérogation est possible dans un bâtiment patrimonial quand les services sont aussi offerts au rez-de-chaussée.',
          base: 'Création d’une gaine dans l’existant', ecart: 'Basse : dérogation accordée · Haute : ascenseur créé', pav: [0, 90000] },
      ] },

    { id: 'equipements', bloc: 'interieur', travaux: false, nom: 'Équipement des lieux',
      resume: 'Cuisines, literie, box, vélos, ateliers et cloche',
      postes: [
        { nom: 'Cuisine partagée et laverie', desc: 'Cuisine équipée pour les hôtes de l’auberge, lave-linge et sèche-linge professionnels.',
          base: 'Forfait', pav: [10000, 22000] },
        { nom: 'Literie et mobilier de l’auberge', desc: 'Quinze couchages avec matelas classés au feu, casiers, rideaux ignifugés, tables de la salle commune.',
          base: '15 lits × 650 à 1 300 €', pav: [10000, 20000] },
        { nom: 'Cuisines des logements', desc: 'Deux cuisines équipées pour les logements loués à l’année.',
          base: '2 × 4 000 à 8 000 €', pav: [8000, 16000] },
        { nom: 'Box et garage à vélos', desc: 'Box grillagés pour les artisans, arceaux, borne de recharge et kit de réparation (label Accueil Vélo).',
          base: 'Cave du Pavillon', pav: [7000, 16000] },
        { nom: 'Ateliers et exposition', desc: 'Aspiration des poussières et des fumées, éclairage de travail, cimaises et éclairage d’exposition.',
          base: 'Forfait par lieu', pav: [3000, 14000], mdj: [2000, 8000], cha: [1000, 6000] },
        { nom: 'Accueil autonome', desc: 'Serrures à code ou boîtes à clés connectées pour l’auberge et les box.',
          base: 'Forfait', pav: [2000, 8000] },
        { nom: 'Cloche de la chapelle', desc: 'Retour de la cloche, beffroi et électrification, en partie couverts par le prix Sésame.',
          base: 'Forfait', cha: [4000, 12000] },
      ] },

    { id: 'square', bloc: 'abords', travaux: true, nom: 'Square Bertin',
      resume: 'Murs, portails, sols, eaux pluviales, éclairage, plantations et mémoire du lieu',
      postes: [
        { nom: 'Murs et portails', desc: 'Restauration des murs de clôture, des grilles et des portails en fer forgé.',
          base: 'Selon l’état relevé', sq: [8000, 24000] },
        { nom: 'Sols du square', desc: 'Reprises du revêtement existant ou sol neuf (pavés, stabilisé), avec un cheminement accessible jusqu’aux entrées.',
          base: '≈ 330 m² × 25 à 120 €/m²', ecart: 'Basse : reprises · Haute : pavage neuf', sq: [8000, 40000] },
        { nom: 'Eaux pluviales', desc: 'Caniveaux et infiltration des eaux des toitures et du square.',
          base: 'Forfait', sq: [3000, 12000] },
        { nom: 'Éclairage extérieur', desc: 'Bornes et éclairage discret des façades.',
          base: 'Forfait', sq: [3000, 12000] },
        { nom: 'Plantations et mobilier', desc: 'Arbres et massifs, bancs, arceaux à vélos, corbeilles.',
          base: 'Forfait', sq: [3500, 12000] },
        { nom: 'Totems et horloge', desc: 'Panneaux sur l’histoire du lieu, restauration et remise en marche de l’horloge ancienne.',
          base: 'Forfait', sq: [3500, 14000] },
      ] },

    { id: 'marges', bloc: 'abords', travaux: false, nom: 'Imprévus et hausse des prix',
      resume: 'La marge indispensable sur un bâtiment ancien',
      postes: [
        { nom: 'Provision pour imprévus', desc: 'Un bâtiment ancien réserve toujours des surprises une fois les murs ouverts : bois pourris, planchers fragiles, réseaux cachés.',
          base: '8 à 12 % des travaux', taux: [0.08, 0.12] },
        { nom: 'Révision des prix', desc: 'Hausse du coût de la construction (indice BT01) entre la signature des devis et la fin du chantier, sur deux à trois ans.',
          base: '1,5 à 3 % des travaux', taux: [0.015, 0.03] },
      ] },
  ];

  /* Cartes « Hypothèses et limites ». Dans les textes, [libellé](adresse) devient un lien. */
  const FAITS = [
    { id: 'bati', titre: 'Ce que l’on sait du bâti', lignes: [
      { titre: 'Pavillon Bertin', texte: 'trois niveaux sur cave, environ 27,7 × 9 m au sol. Rez-de-chaussée et étage d’environ 200 m² chacun, combles d’environ 200 m² au sol, cinq caves. Toiture en ardoise. Se dégrade faute d’usage.' },
      { titre: 'Maison des Jeux', texte: 'rez-de-chaussée de 114 m² et combles aménageables de 67 m², chauffée et entretenue, en bon état.' },
      { titre: 'Square Bertin', texte: 'environ 250 m², 330 m² avec les passages.' },
      { titre: 'Chapelle et sacristie', texte: 'environ 250 m², ancien cabinet de radiologie jusqu’en 1990, label de la Fondation du patrimoine et prix Sésame de 20 000 €. Aucun diagnostic consulté.' },
    ] },
    { id: 'diagnostics', titre: 'Diagnostics et règles', lignes: [
      { titre: 'Amiante (2025)', texte: 'dalles de sol de deux pièces de l’étage et conduits en fibres-ciment dans les caves et le grenier du Pavillon ; deux conduits à la Maison des Jeux.' },
      { titre: 'Plomb (2025)', texte: 'peintures dégradées contenant du plomb dans le Pavillon.' },
      { titre: 'Secteur sauvegardé', texte: 'Pavillon et partie nord de la Maison des Jeux à conserver ou à restaurer, avis de l’Architecte des Bâtiments de France, terrain en zone archéologique.' },
      { titre: 'Conditions de la vente', texte: 'fenêtres, gouttières et descentes du Pavillon refaites dans les cinq ans, activité culturelle ou artistique pendant cinq ans.' },
    ] },
    { id: 'programme', titre: 'Programme chiffré', lignes: [
      { titre: '', texte: 'Cinq ateliers au rez-de-chaussée du Pavillon, auberge de quinze couchages à l’étage, deux logements dans les combles, stockage et vélos en cave.' },
      { titre: '', texte: 'Atelier et exposition au rez-de-chaussée de la Maison des Jeux.' },
      { titre: '', texte: 'Prix 2026 d’entreprises de la région, hors taxes. Honoraires, assurances et imprévus calculés en pourcentage des travaux.' },
    ] },
    { id: 'exclus', titre: 'Non compris', lignes: [
      { titre: '', texte: 'Achat de l’ensemble Bertin (133 000 €) et frais de notaire.' },
      { titre: '', texte: 'Aménagement des combles de la Maison des Jeux, mobilier des artisans, frais d’exploitation.' },
      { titre: '', texte: 'Aides et subventions, à déduire ensuite (voir [Financements](financements.html)).' },
      { titre: 'TVA', texte: '20 % sur les ateliers, l’auberge et les honoraires, 10 % sur les logements (5,5 % pour l’énergie). Récupérable seulement si la SCI est assujettie ; sinon, compter environ 18 à 20 % de plus.' },
    ] },
  ];

  const svg = d => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    etudes:      '<path d="M7 3.5h6.5l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M13.5 3.5v5h5M9 13h6M9 16.5h4"/>',
    demarches:   '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    preparation: '<path d="M3.5 18.5h17"/><path d="M5.5 18.5v-3a6.5 6.5 0 0 1 13 0v3"/><path d="M10 9.2V6.5h4v2.7"/>',
    toiture:     '<path d="M2.5 12.5 12 4.5l9.5 8"/><path d="M5.5 10v9.5h13V10"/>',
    facades:     '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 9.7h17M3.5 14.3h17M9 5v4.7M15 9.7v4.6M9 14.3V19"/>',
    menuiseries: '<rect x="5.5" y="3.5" width="13" height="17" rx="1.5"/><path d="M12 3.5v17M5.5 11h13"/>',
    interieurs:  '<rect x="4" y="3.5" width="13" height="5.5" rx="1.5"/><path d="M17 6.2h2.5v5.3H11v3"/><rect x="9.5" y="14.5" width="3" height="6" rx="1"/>',
    technique:   '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
    securite:    '<path d="M12 3.5c.6 3.2 5 4.8 5 9.6a5 5 0 0 1-10 0c0-2.1 1-3.6 2.1-4.6.3 1.6 1.1 2.6 2.1 3.1.6-2.7-.5-5.2.8-8.1z"/>',
    equipements: '<path d="M3 18V7"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.5"/>',
    square:      '<path d="M5 20V10.5a7 7 0 0 1 14 0V20"/><path d="M3 20h18"/>',
    marges:      '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    autre:       '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 12.5h8M8 16h5"/>',
  };
  const CHEVRON = svg('<path d="M6 9l6 6 6-6"/>');
  const PLUS = svg('<path d="M12 5v14M5 12h14"/>');

  /* ── DONNÉES MODIFIABLES ──
     Les tableaux ci-dessus sont l’estimation d’origine. Les modifications sont enregistrées
     en entier, en texte JSON, dans localStorage et dans Firebase (dossier/chiffrage/donnees).
     La valeur « defaut » en base signifie : estimation d’origine rétablie. */
  const KEY = 'chiffrage-donnees';
  const PATH = 'chiffrage/donnees';

  const num = v => (Number.isFinite(+v) ? +v : 0);
  const pair = v => (Array.isArray(v) ? [num(v[0]), num(v[1])] : null);
  const text = v => (typeof v === 'string' ? v : '');

  function normalize(raw) {
    if (!raw || !Array.isArray(raw.batiments) || !Array.isArray(raw.blocs) || !Array.isArray(raw.categories)) return null;
    const batiments = raw.batiments.filter(b => b && b.id).map(b => ({
      id: String(b.id), nom: text(b.nom), court: text(b.court) || text(b.nom), surface: num(b.surface), info: text(b.info),
    }));
    const blocs = raw.blocs.filter(b => b && b.id).map(b => ({ id: String(b.id), nom: text(b.nom) }));
    if (!batiments.length || !blocs.length) return null;
    const blocIds = new Set(blocs.map(b => b.id));
    const categories = raw.categories.filter(c => c && c.id).map(c => ({
      id: String(c.id), bloc: blocIds.has(c.bloc) ? c.bloc : blocs[0].id, travaux: !!c.travaux,
      nom: text(c.nom), resume: text(c.resume),
      postes: (Array.isArray(c.postes) ? c.postes : []).filter(Boolean).map(p => {
        const out = { nom: text(p.nom), desc: text(p.desc), base: text(p.base) };
        if (text(p.ecart)) out.ecart = p.ecart;
        if (pair(p.taux)) out.taux = pair(p.taux);
        else batiments.forEach(b => { const v = pair(p[b.id]); if (v) out[b.id] = v; });
        return out;
      }),
    }));
    /* données enregistrées avant l’ajout des cartes : on reprend celles d’origine */
    const faits = (Array.isArray(raw.faits) ? raw.faits : FAITS).filter(f => f && f.id).map(f => ({
      id: String(f.id), titre: text(f.titre),
      lignes: (Array.isArray(f.lignes) ? f.lignes : []).filter(Boolean).map(l => ({ titre: text(l.titre), texte: text(l.texte) })),
    }));
    return { v: 1, batiments, blocs, categories, faits };
  }
  const parse = json => { try { return normalize(JSON.parse(json)); } catch { return null; } };
  const DEFAUT = JSON.stringify(normalize({ batiments: BATIMENTS, blocs: BLOCS, categories: CATEGORIES, faits: FAITS }));

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch { return null; }
    return null;
  }

  let data = parse(store(KEY)) || parse(DEFAUT);
  const serial = () => JSON.stringify(normalize(data));
  const catById = id => data.categories.find(c => c.id === id);

  /* ── CALCULS ── */
  let ALL, BAT, BASE;                                     // BASE : travaux par bâtiment, assiette des taux
  function compute() {
    ALL = data.batiments.map(b => b.id);
    BAT = Object.fromEntries(data.batiments.map(b => [b.id, b]));
    BASE = Object.fromEntries(ALL.map(id => [id, [0, 0]]));
    data.categories.filter(c => c.travaux).forEach(c => c.postes.forEach(p => {
      if (!p.taux) ALL.forEach(id => { if (p[id]) { BASE[id][0] += p[id][0]; BASE[id][1] += p[id][1]; } });
    }));
    if (scope !== 'all' && !BAT[scope]) scope = 'all';
  }

  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sum = list => list.reduce(add, [0, 0]);
  const amount = (p, id) => (p.taux ? [p.taux[0] * BASE[id][0], p.taux[1] * BASE[id][1]] : p[id] || [0, 0]);
  const posteTotal = (p, ids) => sum(ids.map(id => amount(p, id)));
  const catTotal = (c, ids) => sum(c.postes.map(p => posteTotal(p, ids)));
  const blocTotal = (id, ids) => sum(data.categories.filter(c => c.bloc === id).map(c => catTotal(c, ids)));
  const grandTotal = ids => sum(data.categories.map(c => catTotal(c, ids)));
  const worksTotal = ids => sum(ids.map(id => BASE[id]));
  const where = (p, ids) => ids.filter(id => amount(p, id)[1] > 0);

  /* ── FORMATAGE ── */
  const round = (n, step) => Math.round(n / step) * step;
  const nb = n => n.toLocaleString('fr-FR');
  const eur = n => nb(round(n, 100)) + ' €';
  const eurK = n => nb(round(n, 1000)) + ' €';
  const kEur = n => (n === 0 ? '0' : nb(Math.round(n / 1000)) + ' k€');
  const span = (v, f = kEur) => `${f(v[0])} – ${f(v[1])}`;
  const perM2 = (v, surface) => (surface > 0 ? `${nb(round(v[0] / surface, 10))} – ${nb(round(v[1] / surface, 10))} €` : '—');
  const parseNum = v => { const n = parseFloat(String(v).replace(/[\s  ]/g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  const pct = t => nb(+(t * 100).toFixed(2));
  const catName = c => c.nom || 'Catégorie sans nom';
  const posteName = p => p.nom || 'Poste sans nom';
  const COUNT = ['aucune', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
    'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf', 'vingt'];

  const el = (tag, cls, content) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content != null) node.textContent = content;
    return node;
  };

  /* ── ÉTAT ── */
  let scope = store('chiffrage-batiment') || 'all';
  let editing = false;
  const ids = () => (scope === 'all' ? ALL : [scope]);
  const scopeName = () => (scope === 'all' ? 'tout le site' : BAT[scope].nom);
  const open = new Set();
  const stash = new WeakMap();                            // valeurs mises de côté quand un poste change de mode de calcul

  const filters   = document.getElementById('filters');
  const chart     = document.getElementById('chart');
  const tooltip   = document.getElementById('chart-tooltip');
  const drivers   = document.getElementById('drivers');
  const table     = document.getElementById('cost-table');
  const toggleAll = document.getElementById('toggle-all');
  const buildings = document.getElementById('buildings');
  const facts     = document.getElementById('facts');
  const resetBtn  = document.getElementById('reset-data');
  const editNote  = document.getElementById('edit-note');
  const editBtns  = [...document.querySelectorAll('[data-edit-toggle]')];

  /* ── RENDU ── */
  function render() {
    const active = document.activeElement;
    const key = focusKey(active);
    let range = null;
    try { if (key && active.selectionStart != null) range = [active.selectionStart, active.selectionEnd]; } catch { range = null; }
    compute();
    renderFilters();
    renderKpis();
    renderChart();
    renderDrivers();
    renderTable();
    renderBuildings();
    renderFacts();
    renderCompare();
    renderCount();
    if (key) restoreFocus(key, range);
  }

  /* Après une saisie : on recalcule tout sans reconstruire les champs en cours d’édition. */
  function refresh() {
    compute();
    renderFilters();
    renderKpis();
    renderChart();
    renderDrivers();
    renderCompare();
    renderCount();
    document.querySelectorAll('[data-sum]').forEach(paint);
  }

  const FOCUS_KEYS = ['edit', 'cat', 'poste', 'bat', 'bloc', 'fait', 'ligne', 'i', 'toggle', 'mode'];
  function focusKey(node) {
    if (!node || !node.dataset || !(node.dataset.edit || node.dataset.toggle || node.dataset.mode)) return null;
    return node.tagName.toLowerCase() + FOCUS_KEYS
      .filter(k => node.dataset[k] != null)
      .map(k => `[data-${k}="${CSS.escape(node.dataset[k])}"]`).join('');
  }
  function restoreFocus(key, range) {
    const node = document.querySelector(key);
    if (!node) return;
    node.focus({ preventScroll: true });
    if (range) try { node.setSelectionRange(range[0], range[1]); } catch { /* champ sans sélection */ }
  }

  /* Cellules de montant recalculables : data-sum = total | bloc:id | cat:id | poste:cat:index | bat:id | m2:id */
  function paint(node) {
    const [kind, a, b] = node.dataset.sum.split(':');
    const sel = kind === 'bat' || kind === 'm2' ? [a] : ids();
    let v;
    if (kind === 'bloc') v = blocTotal(a, sel);
    else if (kind === 'cat') { const c = catById(a); if (!c) return; v = catTotal(c, sel); }
    else if (kind === 'poste') { const p = catById(a)?.postes[+b]; if (!p) return; v = posteTotal(p, sel); }
    else if (BAT[a] || kind === 'total') v = grandTotal(sel);
    else return;
    const f = node.dataset.f === 'e' ? eur : eurK;
    if (kind === 'm2') node.textContent = perM2(v, BAT[a].surface);
    else node.textContent = node.dataset.i != null ? f(v[+node.dataset.i]) : span(v, f);
  }
  function sumCell(tag, cls, key, i, f) {
    const node = el(tag, cls);
    node.dataset.sum = key;
    if (i != null) node.dataset.i = i;
    if (f) node.dataset.f = f;
    paint(node);
    return node;
  }

  function field(tag, cls, edit, value, keys, label, placeholder) {
    const node = el(tag, cls);
    if (tag === 'input') { node.type = 'text'; node.autocomplete = 'off'; }
    node.value = value;
    node.dataset.edit = edit;
    Object.entries(keys).forEach(([k, v]) => { node.dataset[k] = v; });
    node.setAttribute('aria-label', label);
    if (placeholder) node.placeholder = placeholder;
    return node;
  }
  function numField(edit, value, keys, label) {
    const node = field('input', 'editable', edit, value, keys, label);
    node.inputMode = 'decimal';
    return node;
  }
  function actionButton(cls, attr, keys, label, icon) {
    const btn = el('button', cls, label);
    btn.type = 'button';
    btn.dataset[attr.name] = attr.value;
    btn.dataset.label = label;
    Object.entries(keys).forEach(([k, v]) => { btn.dataset[k] = v; });
    if (icon) btn.insertAdjacentHTML('afterbegin', icon);
    return btn;
  }

  function renderFilters() {
    filters.textContent = '';
    [{ id: 'all', nom: 'Tout le site' }, ...data.batiments].forEach(b => {
      const btn = el('button', 'chip' + (scope === b.id ? ' is-active' : ''), b.nom || 'Bâtiment sans nom');
      btn.type = 'button';
      btn.dataset.scope = b.id;
      btn.setAttribute('aria-pressed', String(scope === b.id));
      filters.appendChild(btn);
    });
  }

  function renderKpis() {
    const t = grandTotal(ids());
    s('kpi-low', nb(round(t[0], 1000)));
    s('kpi-high', nb(round(t[1], 1000)));
    s('kpi-mid', nb(round((t[0] + t[1]) / 2, 1000)));
    const b = BAT[scope];
    s('kpi-note', b
      ? `${b.nom} · ≈ ${nb(b.surface)} m²` + (b.surface > 0 ? ` · soit ${perM2(t, b.surface)} par m²` : '')
      : data.batiments.map(x => x.nom).filter(Boolean).join(', '));
    s('table-scope', scope === 'all' ? 'Tout le site' : BAT[scope].nom);
  }

  function renderCount() {
    const n = data.categories.length;
    s('cat-count', `${COUNT[n] || nb(n)} catégorie${n > 1 ? 's' : ''} de dépenses`);
  }

  function renderChart() {
    const sel = ids();
    const rows = data.categories.map(c => ({ c, v: catTotal(c, sel) })).filter(r => r.v[1] > 0);
    const total = grandTotal(sel);
    const max = Math.max(1, ...rows.map(r => r.v[1]));
    const step = [5e3, 1e4, 2e4, 2.5e4, 5e4, 1e5, 2e5, 2.5e5, 5e5].find(st => max / st <= 5) || 1e6;
    const top = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = 0; v <= top + 1; v += step) ticks.push(v);
    const x = v => (v / top) * 100;

    chart.textContent = '';
    const axis = el('div', 'rc-axis');
    const axisPlot = el('span', 'rc-plot');
    ticks.forEach(t => {
      const label = el('span', 'rc-tick', kEur(t));
      label.style.left = x(t) + '%';
      axisPlot.appendChild(label);
    });
    axis.append(el('span', 'rc-label'), axisPlot, el('span', 'rc-value'));
    chart.appendChild(axis);

    data.blocs.forEach(b => {
      const cats = rows.filter(r => r.c.bloc === b.id);
      if (!cats.length) return;
      chart.appendChild(el('p', 'rc-bloc', b.nom));
      cats.forEach(({ c, v }) => {
        const row = el('button', 'rc-row');
        row.type = 'button';
        row.dataset.cat = c.id;
        row.dataset.share = String(Math.round(((v[0] + v[1]) / (total[0] + total[1])) * 100));
        row.setAttribute('aria-label', `${catName(c)} : de ${eurK(v[0])} à ${eurK(v[1])}. Voir le détail.`);
        const plot = el('span', 'rc-plot');
        ticks.forEach(t => {
          const grid = el('i', 'rc-grid');
          grid.style.left = x(t) + '%';
          plot.appendChild(grid);
        });
        const low = el('span', 'rc-low');
        low.style.width = x(Math.max(0, v[0])) + '%';
        const ext = el('span', 'rc-ext');
        ext.style.left = `calc(${x(Math.max(0, v[0]))}% + ${v[0] > 0 ? 2 : 0}px)`;
        ext.style.width = `max(4px, calc(${x(v[1] - v[0])}% - ${v[0] > 0 ? 2 : 0}px))`;
        plot.append(low, ext);
        row.append(el('span', 'rc-label', catName(c)), plot, el('span', 'rc-value', span(v)));
        chart.appendChild(row);
      });
    });
  }

  function showTooltip(row) {
    const c = catById(row.dataset.cat);
    if (!c) return;
    const v = catTotal(c, ids());
    tooltip.textContent = '';
    tooltip.append(
      el('p', 'tt-value', `${eurK(v[0])} – ${eurK(v[1])}`),
      el('p', 'tt-label', catName(c)),
      el('p', 'tt-meta', `≈ ${row.dataset.share} % du total · ${c.postes.filter(p => posteTotal(p, ids())[1] > 0).length} postes`)
    );
    tooltip.hidden = false;
    const card = chart.getBoundingClientRect();
    const bar = row.querySelector('.rc-ext').getBoundingClientRect();
    const w = tooltip.offsetWidth;
    const left = Math.min(Math.max(bar.right - card.left - w / 2, 0), card.width - w);
    tooltip.style.left = left + 'px';
    tooltip.style.top = (row.getBoundingClientRect().top - card.top - tooltip.offsetHeight - 6) + 'px';
  }
  const hideTooltip = () => { tooltip.hidden = true; };

  function renderDrivers() {
    const sel = ids();
    const list = [];
    data.categories.forEach(c => c.postes.forEach(p => {
      if (p.taux) return;                              // honoraires et imprévus suivent les travaux : ce sont des effets, pas des causes
      const v = posteTotal(p, sel);
      if (v[1] > v[0]) list.push({ p, v, gap: v[1] - v[0] });
    }));
    list.sort((a, b) => b.gap - a.gap);
    drivers.textContent = '';
    list.slice(0, 6).forEach(({ p, v, gap }) => {
      const li = el('li', 'driver');
      const txt = el('div', 'driver-text');
      txt.append(el('p', 'driver-name', posteName(p)), el('p', 'driver-desc', p.ecart || p.base));
      const amt = el('div', 'driver-amt');
      amt.append(el('p', 'driver-gap', '+ ' + eurK(gap)), el('p', 'driver-range', span(v)));
      li.append(txt, amt);
      drivers.appendChild(li);
    });
  }

  function renderTable() {
    const sel = ids();
    table.classList.toggle('is-editing', editing);
    table.querySelectorAll('tbody, tfoot').forEach(node => node.remove());

    data.blocs.forEach(b => {
      const cats = data.categories.filter(c => c.bloc === b.id && (editing || catTotal(c, sel)[1] > 0));
      if (!cats.length && !editing) return;
      const blocBody = el('tbody', 'bloc');
      const blocRow = el('tr', 'bloc-row');
      const blocHead = el('th', '', editing ? null : b.nom);
      blocHead.scope = 'colgroup';
      if (editing) blocHead.appendChild(field('input', 'field field--bloc', 'bloc-nom', b.nom, { bloc: b.id }, 'Nom du bloc', 'Nom du bloc'));
      blocRow.append(blocHead, sumCell('td', 'num', 'bloc:' + b.id, 0), sumCell('td', 'num', 'bloc:' + b.id, 1));
      blocBody.appendChild(blocRow);
      table.appendChild(blocBody);

      cats.forEach(c => table.appendChild(editing ? catEditor(c) : catView(c, sel)));

      if (editing) {
        const addBody = el('tbody', 'add-cat');
        const tr = el('tr');
        const td = el('td');
        td.colSpan = 3;
        td.appendChild(actionButton('add-btn', { name: 'add', value: 'cat' }, { bloc: b.id }, 'Ajouter une catégorie', PLUS));
        tr.appendChild(td);
        addBody.appendChild(tr);
        table.appendChild(addBody);
      }
    });

    const foot = el('tfoot');
    const row = el('tr', 'total-row');
    const label = el('th', '', 'Total, ' + scopeName());
    label.scope = 'row';
    row.append(label, sumCell('td', 'num', 'total', 0), sumCell('td', 'num', 'total', 1));
    foot.appendChild(row);
    table.appendChild(foot);

    const cats = visibleCats();
    toggleAll.textContent = cats.length && cats.every(c => open.has(c.id)) ? 'Tout replier' : 'Tout déplier';
  }
  const visibleCats = () => data.categories.filter(c => editing || catTotal(c, ids())[1] > 0);

  function catView(c, sel) {
    const isOpen = open.has(c.id);
    const body = el('tbody', 'cat' + (isOpen ? ' is-open' : ''));
    body.id = 'cat-' + c.id;
    const head = el('tr', 'cat-row');
    const th = el('th');
    th.scope = 'rowgroup';
    const btn = el('button', 'cat-toggle');
    btn.type = 'button';
    btn.dataset.toggle = c.id;
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.innerHTML = `<span class="cat-ico">${svg(ICON[c.id] || ICON.autre)}</span>`;
    const txt = el('span', 'cat-text');
    txt.append(el('span', 'cat-name', catName(c)), el('span', 'cat-sub', c.resume));
    btn.appendChild(txt);
    btn.insertAdjacentHTML('beforeend', CHEVRON);
    th.appendChild(btn);
    head.append(th, sumCell('td', 'num', 'cat:' + c.id, 0), sumCell('td', 'num', 'cat:' + c.id, 1));
    body.appendChild(head);

    c.postes.forEach((p, i) => {
      if (posteTotal(p, sel)[1] <= 0) return;
      const tr = el('tr', 'poste-row');
      tr.hidden = !isOpen;
      const name = el('th');
      name.scope = 'row';
      const meta = el('span', 'p-meta');
      if (p.base) meta.appendChild(el('span', 'p-base', p.base));
      if (p.ecart) meta.appendChild(el('span', 'p-gap', p.ecart));
      if (sel.length > 1) where(p, sel).forEach(id => meta.appendChild(el('span', 'p-where', BAT[id].court || BAT[id].nom)));
      name.append(el('span', 'p-name', posteName(p)), el('span', 'p-desc', p.desc), meta);
      const key = `poste:${c.id}:${i}`;
      tr.append(name, sumCell('td', 'num', key, 0, 'e'), sumCell('td', 'num', key, 1, 'e'));
      body.appendChild(tr);
    });
    return body;
  }

  function catEditor(c) {
    const isOpen = open.has(c.id);
    const keys = { cat: c.id };
    const body = el('tbody', 'cat' + (isOpen ? ' is-open' : ''));
    body.id = 'cat-' + c.id;
    const head = el('tr', 'cat-row');
    const th = el('th');
    th.scope = 'rowgroup';
    const wrap = el('div', 'cat-edit');
    wrap.insertAdjacentHTML('beforeend', `<span class="cat-ico">${svg(ICON[c.id] || ICON.autre)}</span>`);

    const blocLabel = el('label', 'cat-opt');
    const select = el('select', 'field');
    select.dataset.edit = 'cat-bloc';
    select.dataset.cat = c.id;
    data.blocs.forEach(b => {
      const option = el('option', '', b.nom || 'Bloc sans nom');
      option.value = b.id;
      option.selected = b.id === c.bloc;
      select.appendChild(option);
    });
    const selectWrap = el('span', 'select');
    selectWrap.appendChild(select);
    selectWrap.insertAdjacentHTML('beforeend', CHEVRON);
    blocLabel.append(el('span', '', 'Bloc'), selectWrap);

    const check = el('label', 'cat-opt cat-check');
    const box = el('input');
    box.type = 'checkbox';
    box.checked = c.travaux;
    box.dataset.edit = 'cat-travaux';
    box.dataset.cat = c.id;
    check.append(box, el('span', '', 'Compte dans les travaux'));

    const opts = el('div', 'cat-opts');
    opts.append(blocLabel, check, actionButton('btn-del', { name: 'del', value: 'cat' }, keys, 'Supprimer la catégorie'));

    const top = el('div', 'cat-head');
    top.append(
      field('input', 'field field--title', 'cat-nom', c.nom, keys, 'Nom de la catégorie', 'Nouvelle catégorie'),
      sumCell('span', 'cat-sum', 'cat:' + c.id)
    );
    const fields = el('div', 'cat-fields');
    fields.append(
      top,
      field('input', 'field', 'cat-resume', c.resume, keys, 'Résumé de la catégorie', 'Résumé en une ligne'),
      opts
    );

    const toggle = el('button', 'cat-chevron');
    toggle.type = 'button';
    toggle.dataset.toggle = c.id;
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', `${isOpen ? 'Replier' : 'Déplier'} les postes de ${catName(c)}`);
    toggle.innerHTML = CHEVRON;

    wrap.append(fields, toggle);
    th.colSpan = 3;                                       // éditeur sur toute la largeur, total dans l’en-tête
    th.appendChild(wrap);
    head.appendChild(th);
    body.appendChild(head);

    c.postes.forEach((p, i) => body.appendChild(posteEditor(c, p, i, isOpen)));

    const addRow = el('tr', 'add-row');
    addRow.hidden = !isOpen;
    const td = el('td');
    td.colSpan = 3;
    td.appendChild(actionButton('add-btn', { name: 'add', value: 'poste' }, keys, 'Ajouter un poste', PLUS));
    addRow.appendChild(td);
    body.appendChild(addRow);
    return body;
  }

  function posteEditor(c, p, i, isOpen) {
    const keys = { cat: c.id, poste: i };
    const tr = el('tr', 'poste-row poste-edit');
    tr.hidden = !isOpen;
    const td = el('td');
    td.colSpan = 3;
    const box = el('div', 'pe');

    const head = el('div', 'pe-head');
    head.append(
      field('input', 'field field--title', 'poste-nom', p.nom, keys, 'Nom du poste', 'Nouveau poste'),
      sumCell('span', 'pe-sum', `poste:${c.id}:${i}`, null, 'e'),
      actionButton('btn-del', { name: 'del', value: 'poste' }, keys, 'Supprimer')
    );

    const desc = field('textarea', 'field', 'poste-desc', p.desc, keys, 'Description du poste', 'Ce que couvre cette dépense');
    desc.rows = 2;

    const labeled = (label, input) => {
      const node = el('label', 'pe-field');
      node.append(el('span', 'pe-label', label), input);
      return node;
    };
    const meta = el('div', 'pe-meta');
    meta.append(
      labeled('Base de calcul', field('input', 'field', 'poste-base', p.base, keys, 'Base de calcul', 'Quantité × prix, forfait…')),
      labeled('Écart entre basse et haute', field('input', 'field', 'poste-ecart', p.ecart || '', keys, 'Écart entre basse et haute', 'Facultatif'))
    );

    const seg = el('div', 'seg');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Mode de calcul');
    [['montants', 'Montants par bâtiment'], ['taux', 'Pourcentage des travaux']].forEach(([mode, label]) => {
      const btn = el('button', '', label);
      btn.type = 'button';
      btn.dataset.mode = mode;
      btn.dataset.cat = c.id;
      btn.dataset.poste = i;
      btn.setAttribute('aria-pressed', String(mode === (p.taux ? 'taux' : 'montants')));
      seg.appendChild(btn);
    });

    const grid = el('div', 'pe-amounts');
    const unit = p.taux ? '%' : '€';
    const cols = el('div', 'pe-line pe-line--head');
    cols.append(el('span'), el('span', 'pe-col', `Basse (${unit})`), el('span', 'pe-col', `Haute (${unit})`));
    grid.appendChild(cols);
    const rows = p.taux
      ? [{ label: 'Des travaux du bâtiment', values: p.taux.map(pct), edit: 'poste-taux', extra: {} }]
      : data.batiments.map(b => ({ label: b.court || b.nom, values: (p[b.id] || [0, 0]).map(nb), edit: 'poste-amt', extra: { bat: b.id } }));
    rows.forEach(r => {
      const line = el('div', 'pe-line');
      line.appendChild(el('span', 'pe-bat', r.label));
      [0, 1].forEach(j => line.appendChild(numField(r.edit, r.values[j], { ...keys, ...r.extra, i: j },
        `${posteName(p)}, ${r.label}, fourchette ${j ? 'haute' : 'basse'}`)));
      markInvalid(line);
      grid.appendChild(line);
    });

    const calc = el('div', 'pe-calc');
    calc.append(seg, grid);
    box.append(head, desc, meta, calc);
    td.appendChild(box);
    tr.appendChild(td);
    return tr;
  }

  /* Fourchette haute sous la basse : bordure rouge sur la paire. */
  function markInvalid(line) {
    const inputs = line.querySelectorAll('input.editable');
    if (inputs.length !== 2) return;
    const bad = parseNum(inputs[1].value) < parseNum(inputs[0].value);
    inputs.forEach(input => (bad ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid')));
  }

  function renderBuildings() {
    buildings.textContent = '';
    data.batiments.forEach(b => {
      const tr = el('tr', scope === b.id ? 'is-current' : '');
      const th = el('th');
      th.scope = 'row';
      const surface = el('td', 'num');
      if (editing) {
        const box = el('div', 'b-edit');
        box.append(
          field('input', 'field field--title', 'bat-nom', b.nom, { bat: b.id }, 'Nom du bâtiment'),
          field('input', 'field', 'bat-info', b.info, { bat: b.id }, `Description de ${b.nom}`)
        );
        th.appendChild(box);
        surface.append(numField('bat-surface', nb(b.surface), { bat: b.id }, `Surface de ${b.nom} en m²`), el('span', 'b-unit', 'm²'));
      } else {
        const btn = el('button', 'b-link');
        btn.type = 'button';
        btn.dataset.scope = b.id;
        btn.append(el('span', 'b-name', b.nom), el('span', 'b-info', b.info));
        th.appendChild(btn);
        surface.textContent = `≈ ${nb(b.surface)} m²`;
      }
      tr.append(th, surface, sumCell('td', 'num', 'bat:' + b.id), sumCell('td', 'num', 'm2:' + b.id));
      buildings.appendChild(tr);
    });
  }

  /* ── CARTES D’HYPOTHÈSES ── */
  const faitById = id => data.faits.find(f => f.id === id);

  /* [libellé](adresse) devient un lien, le reste est du texte */
  function inline(texte) {
    const nodes = [];
    const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    let last = 0, m;
    while ((m = re.exec(texte))) {
      if (m.index > last) nodes.push(document.createTextNode(texte.slice(last, m.index)));
      const a = el('a', 'link', m[1]);
      a.href = m[2];
      if (/^https?:/.test(m[2])) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      nodes.push(a);
      last = re.lastIndex;
    }
    if (last < texte.length) nodes.push(document.createTextNode(texte.slice(last)));
    return nodes;
  }

  function renderFacts() {
    facts.textContent = '';
    data.faits.forEach(f => facts.appendChild(editing ? faitEditor(f) : faitView(f)));
    if (editing) facts.appendChild(actionButton('add-card', { name: 'add', value: 'fait' }, {}, 'Ajouter une carte', PLUS));
  }

  function faitView(f) {
    const card = el('article', 'card fact-card');
    card.appendChild(el('h3', 'card-title', f.titre || 'Carte sans titre'));
    const list = el('ul', 'fact-list');
    f.lignes.forEach(l => {
      if (!l.titre && !l.texte) return;
      const li = el('li');
      if (l.titre) li.append(el('strong', '', l.titre), document.createTextNode(' : '));
      inline(l.texte).forEach(node => li.appendChild(node));
      list.appendChild(li);
    });
    card.appendChild(list);
    return card;
  }

  function faitEditor(f) {
    const keys = { fait: f.id };
    const card = el('article', 'card fact-card fact-edit');
    const head = el('div', 'fe-head');
    head.append(
      field('input', 'field', 'fait-titre', f.titre, keys, 'Titre de la carte', 'Titre de la carte'),
      actionButton('btn-del', { name: 'del', value: 'fait' }, keys, 'Supprimer')
    );
    const list = el('ul', 'fact-list fe-list');
    f.lignes.forEach((l, i) => {
      const lineKeys = { ...keys, ligne: i };
      const li = el('li', 'fe-line');
      const texte = field('textarea', 'field', 'ligne-texte', l.texte, lineKeys, 'Texte de la ligne', 'Texte de la ligne');
      texte.rows = 3;
      li.append(
        field('input', 'field field--title', 'ligne-titre', l.titre, lineKeys, 'Début de ligne en gras', 'Début en gras (facultatif)'),
        texte,
        actionButton('btn-del', { name: 'del', value: 'ligne' }, lineKeys, 'Supprimer la ligne')
      );
      list.appendChild(li);
    });
    card.append(head, list, actionButton('add-btn', { name: 'add', value: 'ligne' }, keys, 'Ajouter une ligne', PLUS));
    return card;
  }

  /* ── COMPARAISON AVEC LE PRÉVISIONNEL (phases 1 à 4 et cour) ── */
  const prevDefault = {}, prevRemote = {};
  function prevTotal() {
    const known = PREVI.filter(k => k in prevRemote || k in prevDefault);
    if (!known.length) return PREVI_DEFAUT;
    return PREVI.reduce((t, k) => t + (k in prevRemote ? prevRemote[k] : prevDefault[k] || 0), 0);
  }
  function renderCompare() {
    const bertin = BERTIN.filter(id => BAT[id]);
    const prev = prevTotal(), works = worksTotal(bertin), all = grandTotal(bertin);
    s('cmp-prev', eurK(prev));
    s('cmp-works', `${eurK(works[0])} à ${eurK(works[1])}`);
    s('cmp-total', `${eurK(all[0])} à ${eurK(all[1])}`);
    const verdict = document.getElementById('cmp-verdict');
    let msg;
    if (prev < works[0]) msg = `Le montant prévu reste sous la fourchette basse, même pour les seuls travaux. Avec les honoraires, les assurances et les imprévus, il manque au moins ${eurK(all[0] - prev)}.`;
    else if (prev < all[0]) msg = `Le montant prévu couvre les travaux en fourchette basse, mais pas les honoraires, les assurances et les imprévus : il manque au moins ${eurK(all[0] - prev)}.`;
    else if (prev <= all[1]) msg = 'Le montant prévu entre dans la fourchette, honoraires et imprévus compris.';
    else msg = 'Le montant prévu dépasse la fourchette haute.';
    verdict.textContent = msg;
    verdict.classList.toggle('is-warn', prev < all[0]);
  }

  fetch('pavillon-bertin.html')
    .then(r => (r.ok ? r.text() : ''))
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      PREVI.forEach(k => {
        const input = doc.getElementById(k);
        if (input) prevDefault[k] = parseFloat(input.value) || 0;
      });
      renderCompare();
    })
    .catch(() => {});

  /* ── ENREGISTREMENT ── */
  const PENDING = 'chiffrage-a-envoyer';                 // modifications locales pas encore acceptées par la base
  const saveState = document.getElementById('save-state');
  const setState = msg => { saveState.textContent = msg; };
  let saveTimer = null, lastSent = null, offlineWarned = false;
  function scheduleSave() {
    clearTimeout(saveTimer);
    setState('Enregistrement…');
    saveTimer = setTimeout(save, 500);
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = null;
    const json = serial();
    store(KEY, json);
    store(PENDING, '1');
    if (!window.BertinDB) { setState('Enregistré sur cet appareil seulement'); return; }
    lastSent = json;
    window.BertinDB.put(PATH, json).then(ok => {
      if (ok) {
        if (!saveTimer && lastSent === json) { store(PENDING, null); setState('Enregistré dans la base'); }
        return;
      }
      setState('Enregistré sur cet appareil seulement');
      if (offlineWarned) return;
      offlineWarned = true;
      showToast('Base indisponible : modifications gardées sur cet appareil');
    });
  }
  function applyRemote(value) {
    if (typeof value !== 'string') {                     // rien en base
      if (store(PENDING) && store(KEY)) { save(); return; }   // envoi resté en attente (hors ligne) : on le termine
      if (saveTimer) return;
      store(KEY, null);                                  // sinon la base a été vidée : estimation d’origine
      if (serial() !== DEFAUT) { data = parse(DEFAUT); disarm(); render(); }
      return;
    }
    if (saveTimer || value === lastSent) return;         // saisie en cours ou écho de notre propre envoi
    store(PENDING, null);
    if (value === 'defaut') {
      store(KEY, null);
      lastSent = value;
      if (serial() !== DEFAUT) { data = parse(DEFAUT); disarm(); render(); }
      return;
    }
    const next = parse(value);
    if (!next) return;
    store(KEY, value);
    lastSent = value;
    if (value === serial()) return;
    data = next;
    disarm();
    render();
  }
  function commit() {
    scheduleSave();
    render();
  }
  window.addEventListener('pagehide', () => { if (saveTimer) save(); });

  function initDB() {
    window.BertinDB.watch('simulateur', values => {
      PREVI.forEach(k => { if (values[k] !== undefined) prevRemote[k] = parseFloat(values[k]) || 0; });
      renderCompare();
    });
    window.BertinDB.watch(PATH, applyRemote);
  }

  /* ── CONFIRMATION DES SUPPRESSIONS ──
     Premier clic : le bouton devient « Confirmer » pendant 4 secondes ; second clic : action. */
  let armed = null, armedTimer;
  function disarm() {
    clearTimeout(armedTimer);
    if (armed) {
      armed.classList.remove('is-armed');
      armed.textContent = armed.dataset.label;
    }
    armed = null;
  }
  function confirmFirst(btn, message) {
    if (armed === btn) { disarm(); return true; }
    disarm();
    armed = btn;
    btn.classList.add('is-armed');
    btn.textContent = 'Confirmer';
    showToast(message);
    armedTimer = setTimeout(disarm, 4000);
    return false;
  }

  /* ── MODIFICATIONS ── */
  function update(node) {
    const d = node.dataset, v = node.value;
    const c = d.cat ? catById(d.cat) : null;
    const p = c && d.poste != null ? c.postes[+d.poste] : null;
    const b = d.bat ? data.batiments.find(x => x.id === d.bat) : null;
    const f = d.fait ? faitById(d.fait) : null;
    const l = f && d.ligne != null ? f.lignes[+d.ligne] : null;
    if ((d.cat && !c) || (d.poste != null && !p) || (d.bat && !b) || (d.fait && !f) || (d.ligne != null && !l)) return;
    switch (d.edit) {
      case 'bloc-nom': {
        const bloc = data.blocs.find(x => x.id === d.bloc);
        if (bloc) bloc.nom = v;
        table.querySelectorAll(`option[value="${CSS.escape(d.bloc)}"]`).forEach(o => { o.textContent = v || 'Bloc sans nom'; });
        break;
      }
      case 'cat-nom':     c.nom = v; break;
      case 'cat-resume':  c.resume = v; break;
      case 'cat-bloc':    c.bloc = v; break;
      case 'cat-travaux': c.travaux = node.checked; break;
      case 'poste-nom':   p.nom = v; break;
      case 'poste-desc':  p.desc = v; break;
      case 'poste-base':  p.base = v; break;
      case 'poste-ecart': if (v.trim()) p.ecart = v; else delete p.ecart; break;
      case 'poste-amt': {
        const values = p[d.bat] || [0, 0];
        values[+d.i] = parseNum(v);
        if (values[0] || values[1]) p[d.bat] = values;
        else delete p[d.bat];
        break;
      }
      case 'poste-taux':  p.taux[+d.i] = parseNum(v) / 100; break;
      case 'bat-nom':     b.nom = v; break;
      case 'bat-info':    b.info = v; break;
      case 'bat-surface': b.surface = parseNum(v); break;
      case 'fait-titre':  f.titre = v; break;
      case 'ligne-titre': l.titre = v; break;
      case 'ligne-texte': l.texte = v; break;
    }
  }

  function onInput(ev) {
    const node = ev.target.closest('[data-edit]');
    if (!node || node.tagName === 'SELECT' || node.type === 'checkbox') return;
    update(node);
    if (node.classList.contains('editable')) markInvalid(node.parentElement);
    scheduleSave();
    refresh();
  }
  function onChange(ev) {
    const node = ev.target.closest('[data-edit]');
    if (!node) return;
    if (node.tagName === 'SELECT' || node.type === 'checkbox') {
      update(node);
      scheduleSave();
      node.tagName === 'SELECT' ? render() : refresh();
      return;
    }
    if (node.classList.contains('editable')) {          // remise en forme des nombres en quittant le champ
      node.value = node.dataset.edit === 'poste-taux' ? pct(parseNum(node.value) / 100) : nb(parseNum(node.value));
    }
  }

  function addCategory(blocId) {
    const c = { id: 'c' + Date.now().toString(36), bloc: blocId, travaux: true, nom: '', resume: '', postes: [] };
    data.categories.push(c);
    open.add(c.id);
    commit();
    document.querySelector(`[data-edit="cat-nom"][data-cat="${c.id}"]`)?.focus();
  }
  function addPoste(catId) {
    const c = catById(catId);
    if (!c) return;
    c.postes.push({ nom: '', desc: '', base: '' });
    open.add(c.id);
    commit();
    document.querySelector(`[data-edit="poste-nom"][data-cat="${c.id}"][data-poste="${c.postes.length - 1}"]`)?.focus();
  }
  function addFait() {
    const f = { id: 'f' + Date.now().toString(36), titre: '', lignes: [{ titre: '', texte: '' }] };
    data.faits.push(f);
    commit();
    document.querySelector(`[data-edit="fait-titre"][data-fait="${f.id}"]`)?.focus();
  }
  function addLigne(faitId) {
    const f = faitById(faitId);
    if (!f) return;
    f.lignes.push({ titre: '', texte: '' });
    commit();
    document.querySelector(`[data-edit="ligne-texte"][data-fait="${f.id}"][data-ligne="${f.lignes.length - 1}"]`)?.focus();
  }
  function removeFait(btn) {
    const f = faitById(btn.dataset.fait);
    if (!f) return;
    if (btn.dataset.del === 'fait') {
      if (!confirmFirst(btn, `Cliquez à nouveau pour supprimer la carte « ${f.titre || 'sans titre'} »`)) return;
      data.faits.splice(data.faits.indexOf(f), 1);
      commit();
      showToast('Carte supprimée');
      return;
    }
    const index = +btn.dataset.ligne;
    if (!f.lignes[index]) return;
    if (!confirmFirst(btn, 'Cliquez à nouveau pour supprimer cette ligne')) return;
    f.lignes.splice(index, 1);
    commit();
    showToast('Ligne supprimée');
  }

  function remove(btn) {
    const c = catById(btn.dataset.cat);
    if (!c) return;
    if (btn.dataset.del === 'cat') {
      if (!confirmFirst(btn, `Cliquez à nouveau pour supprimer « ${catName(c)} » et tous ses postes`)) return;
      data.categories.splice(data.categories.indexOf(c), 1);
      open.delete(c.id);
      commit();
      showToast('Catégorie supprimée');
    } else {
      const index = +btn.dataset.poste;
      if (!c.postes[index]) return;
      if (!confirmFirst(btn, `Cliquez à nouveau pour supprimer « ${posteName(c.postes[index])} »`)) return;
      c.postes.splice(index, 1);
      commit();
      showToast('Poste supprimé');
    }
  }
  function setMode(btn) {
    const p = catById(btn.dataset.cat)?.postes[+btn.dataset.poste];
    const toTaux = btn.dataset.mode === 'taux';
    if (!p || toTaux === !!p.taux) return;
    const prev = stash.get(p) || {};
    if (toTaux) {
      const amounts = {};
      ALL.forEach(id => { if (p[id]) { amounts[id] = p[id]; delete p[id]; } });
      stash.set(p, { ...prev, amounts });
      p.taux = prev.taux || [0, 0];
    } else {
      stash.set(p, { ...prev, taux: p.taux });
      delete p.taux;
      Object.assign(p, prev.amounts || {});
    }
    commit();
  }

  function setEditing(on) {
    editing = on;
    disarm();
    hideTooltip();
    document.body.classList.toggle('is-editing', on);
    editBtns.forEach(btn => {
      btn.textContent = on ? 'Terminé' : 'Modifier';
      btn.classList.toggle('btn-primary', on);
      btn.classList.toggle('btn-neutral', !on);
      btn.setAttribute('aria-pressed', String(on));
    });
    resetBtn.hidden = !on;
    editNote.hidden = !on;
    saveState.hidden = !on;
    if (!on && saveTimer) save();
    render();
  }

  function resetAll() {
    if (!confirmFirst(resetBtn, 'Cliquez à nouveau pour revenir à l’estimation d’origine : toutes les modifications seront perdues')) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    data = parse(DEFAUT);
    store(KEY, null);
    store(PENDING, null);
    if (window.BertinDB) {
      lastSent = 'defaut';
      window.BertinDB.put(PATH, 'defaut').then(ok => setState(ok ? 'Enregistré dans la base' : 'Enregistré sur cet appareil seulement'));
    }
    render();
    showToast('Estimation d’origine rétablie');
  }

  /* ── ÉVÉNEMENTS ── */
  function setScope(id) {
    if (id !== 'all' && !BAT[id]) return;
    scope = id;
    store('chiffrage-batiment', id);
    hideTooltip();
    render();
  }

  filters.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-scope]');
    if (btn) setScope(btn.dataset.scope);
  });

  buildings.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-scope]');
    if (!btn) return;
    setScope(btn.dataset.scope);
    document.getElementById('synthese').scrollIntoView({ behavior: 'smooth' });
  });

  chart.addEventListener('pointerover', ev => { const row = ev.target.closest('.rc-row'); if (row) showTooltip(row); });
  chart.addEventListener('pointerleave', hideTooltip);
  chart.addEventListener('focusin', ev => { const row = ev.target.closest('.rc-row'); if (row) showTooltip(row); });
  chart.addEventListener('focusout', hideTooltip);
  chart.addEventListener('click', ev => {
    const row = ev.target.closest('.rc-row');
    if (!row) return;
    open.add(row.dataset.cat);
    renderTable();
    document.getElementById('cat-' + row.dataset.cat)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  table.addEventListener('click', ev => {
    const toggle = ev.target.closest('[data-toggle]');
    if (toggle) {
      const id = toggle.dataset.toggle;
      open.has(id) ? open.delete(id) : open.add(id);
      renderTable();
      table.querySelector(`[data-toggle="${CSS.escape(id)}"]`)?.focus();
      return;
    }
    const addBtn = ev.target.closest('[data-add]');
    if (addBtn) { addBtn.dataset.add === 'cat' ? addCategory(addBtn.dataset.bloc) : addPoste(addBtn.dataset.cat); return; }
    const delBtn = ev.target.closest('[data-del]');
    if (delBtn) { remove(delBtn); return; }
    const modeBtn = ev.target.closest('[data-mode]');
    if (modeBtn) setMode(modeBtn);
  });

  facts.addEventListener('click', ev => {
    const addBtn = ev.target.closest('[data-add]');
    if (addBtn) { addBtn.dataset.add === 'fait' ? addFait() : addLigne(addBtn.dataset.fait); return; }
    const delBtn = ev.target.closest('[data-del]');
    if (delBtn) removeFait(delBtn);
  });

  [table, buildings, facts].forEach(node => {
    node.addEventListener('input', onInput);
    node.addEventListener('change', onChange);
  });

  toggleAll.addEventListener('click', () => {
    const cats = visibleCats();
    const all = cats.every(c => open.has(c.id));
    cats.forEach(c => (all ? open.delete(c.id) : open.add(c.id)));
    renderTable();
  });

  editBtns.forEach(btn => btn.addEventListener('click', () => setEditing(!editing)));
  resetBtn.addEventListener('click', resetAll);

  render();
  window.BertinDB ? initDB() : window.addEventListener('bertindb-ready', initDB);
})();
