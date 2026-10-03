# Chiffrage des travaux — hypothèses et sources

Page `chiffrage.html`, données dans `chiffrage.js` (`BATIMENTS`, `CATEGORIES`).
Estimation d'avant-projet établie en septembre 2026 : montants hors taxes, prix 2026,
hors achat du bâtiment. Elle cadre le budget ; elle ne remplace ni l'avant-projet de
l'architecte ni les devis.

## Modifier le chiffrage depuis la page

- Bouton « Modifier » (sections Détail et Bâtiments) : noms, descriptions, bases de calcul,
  écarts, montants bas et haut par bâtiment ou pourcentages, blocs, catégories (bloc,
  « compte dans les travaux ») et bâtiments (nom, description, surface) deviennent éditables.
- « Ajouter un poste » en bas de chaque catégorie ouverte, « Ajouter une catégorie » en bas
  de chaque bloc. Suppression en deux clics (le bouton passe à « Confirmer » pendant 4 s).
- Cartes « Hypothèses et limites » (`FAITS` dans `chiffrage.js`) : titre, lignes (début en
  gras + texte), ajout et suppression de lignes et de cartes. Dans un texte,
  `[libellé](adresse)` devient un lien.
- Enregistrement automatique : le jeu de données complet, en JSON, dans
  `dossier/chiffrage/donnees` (Firebase) et `localStorage` (`chiffrage-donnees`).
  La valeur `defaut` en base signifie « estimation d'origine rétablie » (bouton
  « Rétablir l'estimation d'origine »). Base vide = estimation d'origine, sauf si
  l'appareil a un envoi resté en attente (`localStorage` `chiffrage-a-envoyer`, base
  injoignable au moment de la saisie) : il est alors renvoyé. L'état d'enregistrement
  s'affiche à côté des boutons pendant la modification.
- Le fichier `chiffrage.js` n'est jamais réécrit par la page.
- Les tableaux `BATIMENTS`, `BLOCS`, `CATEGORIES` de `chiffrage.js` restent l'estimation
  d'origine : les changer n'a d'effet visible qu'après avoir rétabli l'estimation d'origine.

## Méthode

- 12 catégories réparties en 4 blocs (préparer, enveloppe, aménager et équiper, abords et marges).
- Chaque poste porte un montant `[bas, haut]` par bâtiment (`pav`, `mdj`, `cha`, `sq`),
  ou un `taux: [bas, haut]` appliqué aux **travaux** du bâtiment.
- Travaux = catégories `travaux: true` : préparation et dépollution, toiture, façades et
  structure, menuiseries, aménagements intérieurs, électricité-plomberie-chauffage,
  sécurité et accessibilité, square. Hors assiette : études, démarches, équipement des
  lieux, imprévus.
- Taux retenus : architecte du patrimoine 9–11 %, bureaux d'études 2–3 %, contrôle
  technique 0,7–1 %, coordination SPS 0,6–1 %, assurances 1,5–2,8 %, frais du prêt
  0,8–1,8 %, imprévus 8–12 %, révision des prix 1,5–3 %.
- Fourchette basse : tout se passe bien (remaniage de toiture, fenêtres restaurées, pas
  d'ascenseur ni de second escalier, chauffage électrique performant). Fourchette haute :
  cumul des options prudentes. Le cumul des hautes est un plafond, pas une prévision.

## Données du bâti — Ville de Parthenay

Appel à candidature pour la cession de l'ensemble Bertin (cahier des charges v20251007
et annexes 1 à 5) : https://www.parthenay.fr/actualites/vente-appel-a-candidature-5890

- Ensemble : Pavillon Bertin (à l'est) et Maison des associations de jeux (ancien
  bâtiment de dialyse, au sud) autour du square Bertin, sur une partie de la parcelle
  AM 152 (division à la charge de la Ville). La chapelle et la sacristie (AM 151) ont
  été vendues par la Ville en 2024.
- Pavillon : rez-de-chaussée, étage et combles accessibles, sur cave. RDC : pièces de
  41, 21, 12 et 50 m² plus une entité indépendante d'environ 46 m² ; étage : couloir
  central et pièces de 10 à 32 m² ; combles d'environ 200 m² au sol ; 5 caves.
  « Processus de dégradation progressive », « importante réhabilitation ».
- Plan du Pavillon (services techniques, 5 août 2004) : largeur intérieure 8,00 m,
  longueur hors œuvre ≈ 27,7 m, baies de 1,10 m espacées de 2,50 m, escalier tournant.
- Maison des Jeux (plan SARL Juste Mesure, 7 janvier 2015) : RDC 114,32 m² utiles
  (SHOB 147,13 m²), combles 66,97 m² ; « régulièrement occupé, entretenu et chauffé ;
  il présente un bon état ».
- Square Bertin ≈ 250 m² ; extérieurs avec passages ≈ 330 m².
- Plan de sauvegarde (PSMV) du Site patrimonial remarquable : Pavillon et partie nord de
  la Maison des Jeux « à conserver ou à restaurer », partie sud « pouvant être conservé,
  remplacé ou amélioré » ; avis de l'ABF. Fiche d'urbanisme du 29/09/2025 : secteur
  sauvegardé, zone archéologique, droit de préemption.
- À prévoir : servitudes de vue, de passage et de tour d'échelle avec le Département
  (façade est en limite de l'AM 140), séparation des réseaux de l'ancien hôpital,
  réponse au stationnement, accessibilité (accès du Pavillon non adaptés).
- Conditions suspensives : autorisation d'urbanisme, garantie de financement du projet
  global. Conditions résolutoires : activité culturelle ou artistique pendant 5 ans ;
  restauration extérieure du Pavillon (huisseries, menuiseries, gouttières, descentes
  d'eaux pluviales) dans les 5 ans. Clause anti-spéculative : 50 % de la plus-value en
  cas de revente sous 5 ans.
- Estimation des Domaines : 133 000 €. Vente à la SCI Robin Deschamps (Radio Gâtine,
  juillet 2026) :
  https://radiogatine.fr/news/on-veut-creer-un-pole-d-artisanat-la-ville-vend-l-ensemble-bertin-au-vitrailliste-cyril-deschamps-4758

## Diagnostics — CAPTE IMMO, visite du 09/09/2025

- Pavillon (rapport 18787, 18 pièces, construit avant 1949, non soumis à DPE)
  - Amiante : conduits en fibres-ciment dégradés dans les caves 1, 4 et 5, dalles de sol
    des pièces 4 et 9 de l'étage (dégradées), débris de conduit dans le grenier 5.
    Préconisations EP, AC1 et AC2. Faux plafonds du RDC sans amiante. Couverture en ardoise.
  - Plomb (CREP) : 893 unités de diagnostic ; revêtements dégradés contenant du plomb
    (classe 3) et revêtements de classes 1 et 2.
- Maison des Jeux (rapport 18760, DPE vierge)
  - Amiante : conduit en fibres-ciment peint dans la salle 2 (non dégradé), conduit dans le
    grenier (dégradé), évaluation périodique. Placards et combles au-dessus de la salle 1
    non visités : investigations complémentaires à faire. Couverture en ardoise.

## Chapelle et sacristie

Hors dossier de la Ville ; aucun diagnostic consulté. Environ 250 m² pour la chapelle et
la sacristie. Ancien cabinet de radiologie jusqu'en 1990, label de la Fondation du
patrimoine, prix Sésame de 20 000 € (juillet 2026) pour le nettoyage des façades, les
vitraux et le retour de la cloche :
https://radiogatine.fr/news/c-est-un-coup-d-accelerateur-pour-moi-cyril-deschamps-remporte-les-20-000-euros-du-prix-sesame-4756
Radio Gâtine date la chapelle des années 1930, alors que `plan.js` indique 1895 : à vérifier.

## Quantités retenues pour le Pavillon

| Élément | Quantité |
|---|---|
| Planchers | ≈ 780 m² (cave 180 + 3 niveaux de 200) |
| Surfaces aménagées | ≈ 530 m² (ateliers, auberge, logements) |
| Toiture en ardoise | ≈ 400 m² |
| Façades | ≈ 460 m² hors baies, ≈ 570 m² d'échafaudage |
| Menuiseries extérieures | ≈ 38 fenêtres et 5 portes |
| Zinguerie | ≈ 60 m de gouttières, 50 m de descentes |
| Chauffage | ≈ 40 à 55 kW de besoins |

## Prix de référence 2025–2026

- Couverture en ardoise naturelle : 100 à 300 €/m² posée —
  https://www.travaux.com/couverture-toiture/guide-des-prix/prix-de-linstallation-dune-toiture-ardoise
- Ravalement pierre avec rejointoiement : 60 à 120 €/m², restauration complète 120 à 300 €/m² —
  https://www.travaux.com/energie-renouvelable-diagnostic/guide-des-prix/prix-facade-en-pierre
- Fenêtre bois double vitrage en secteur ABF : ≈ 1 400 à 2 800 € posée (2 vantaux 120 × 120) —
  https://www.travaux.com/fenetre-porte/guide-des-prix/combien-coute-une-fenetre-en-bois
- Désamiantage : 40 à 150 €/m² ; repérage avant travaux 2 à 4 €/m² —
  https://www.travaux.com/demolition-evacuation/guide-des-prix/prix-du-desamiantage
- Remontées capillaires : injection 40 à 200 €/ml, drainage 120 à 300 €/ml —
  https://www.travaux.com/construction-renovation-maison/guide-des-prix/prix-traitement-remontee-capillaire
- Isolation intérieure chaux-chanvre : 80 à 150 €/m² —
  https://www.prix-pose.com/isolation-chanvre
- Électricité : 60 à 120 €/m² en tertiaire, 125 à 205 €/m² en rénovation complète de logement —
  https://rivage-ic.fr/quels-frais-prevoir-en-2025/
- Plateforme élévatrice PMR : 7 000 à 20 000 € ; ascenseur avec gaine en bâtiment ancien :
  jusqu'à 80 000 € et plus — https://www.travaux.com/ascenseurs/guide-des-prix/prix-plateforme-elevatrice
- Honoraires d'architecte en réhabilitation lourde : 12 à 16 %, 8 à 9 % au-delà de 250 000 € HT —
  https://www.hemea.com/fr/architecture/architecte/prix
- Coordination SPS 0,5 à 2 %, contrôle technique ≈ 0,3 % en moyenne —
  https://www.rochefaure.fr/coordination-sps-prix-forfaitaire-ou-pourcentage-du-montant-des-travaux/
- Assurance dommages-ouvrage : 1 à 5 %, 1,5 à 3,5 % en rénovation lourde —
  https://www.argusdelassurance.com/assurance-dommages/construction/assurance-dommage-ouvrage-prix-et-obligations-en-2025.234411
- Échafaudage : 8 à 25 €/m² par mois, montage et démontage 15 à 45 €/m² —
  https://www.travaux.com/construction-renovation-maison/guide-des-prix/un-echafaudage
- Indice BT01 : 133,2 (octobre 2025), 137,5 (avril 2026), 135,7 (juin 2026) —
  https://www.habitatpresto.com/pro/conseils/administratif-fiscalite/indice-bt-01-index-bt

## À mettre à jour

- Remplacer les fourchettes par les montants des devis retenus au fil de la consultation.
- `plan.js` affiche des surfaces (Pavillon ~680 m², Chapelle ~420 m², Sacristie ~65 m²,
  Annexe ~240 m²) et une date (chapelle 1895) qui ne concordent pas avec les données ci-dessus.
