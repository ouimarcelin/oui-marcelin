# Structure du site — Ateliers Bertin

Site statique multipage. Aucune build, aucune dépendance : ouvrir un `.html`
directement ou servir le dossier (`python3 devserver.py 3456`).

## Où se trouve quoi

| Page                  | HTML                  | CSS propre            | JS propre               |
|-----------------------|-----------------------|----------------------|-------------------------|
| Accueil               | `index.html`          | `index.css`          | —                       |
| Simulation financière | `pavillon-bertin.html`| `pavillon-bertin.css`| `pavillon-bertin.js`    |
| Financements          | `financements.html`   | `financements.css`   | `financements.js`       |
| Plan du site          | `plan.html`           | `plan.css`           | `plan.js`               |
| Devis des travaux     | `devis.html`          | `devis.css`          | `devis.js`              |
| Chiffrage des travaux | `chiffrage.html`      | `chiffrage.css`      | `chiffrage.js`          |

Les montants d'origine du chiffrage (fourchettes par poste et par bâtiment) sont dans
`chiffrage.js` ; tout est modifiable depuis la page et enregistré dans Firebase
(`chiffrage/donnees`). Hypothèses, quantités et sources dans `NOTES-chiffrage.md`.
La page lit le total des phases du prévisionnel (`ph1` à `ph5`, valeurs Firebase
si présentes) pour la comparaison, comme la page Devis.

Chaque page charge, dans l'ordre : `global.css` puis `<page>.css` ;
`global.js` puis `<page>.js`. Le CSS de page surcharge le global, jamais l'inverse.

## Partagé

- **`global.css`** — le seul endroit pour les couleurs, la typo, les rayons,
  ombres, durées (section 02 « DESIGN TOKENS »). Il contient aussi les
  composants communs : en-tête et menu mobile, sous-navigation de page,
  boutons (`.btn-primary`, `.btn-secondary`, `.btn-neutral`, `.btn-danger`), liens (`.link`),
  pastilles (`.chip`), étiquettes (`.badge` + `--tone`, `.tag`), chiffres clés
  (`.stat-value`), champs éditables (`input.editable`, `.field`, `.select`), pied de page, animations.
- **`global.js`** — utilitaires communs : `fmt` `fmtK` `g` `s` `e` (formatage),
  `toggle` (accordéons), `showToast`, page active dans la navigation, menu
  mobile, section active de la sous-navigation, apparition au scroll, compteurs.
- **`db.js`** — base Firebase (`window.BertinDB`), voir `NOTES-firebase.md`.
- **`drive.js`** — connexion Google Drive pour la page Devis (`window.BertinDrive`),
  voir `NOTES-google-drive.md`.
- **Typographie** — police système (San Francisco sur Apple), Inter en repli.
  Le dossier `fonts/` (Satoshi) n'est plus utilisé.

## Conventions

- En-tête (`.site-header`) et pied de page (`.site-footer`) sont dupliqués dans
  les 6 pages (le plan n'a pas de pied de page) : ajouter un lien = modifier les 6 fichiers.
- Chaque `<head>` contient `<script>document.documentElement.classList.add('js')</script>` :
  les classes `.reveal` / `.scroll-reveal` ne masquent le contenu que si JS est actif.
- Aucune couleur littérale (`#hex`, `rgba(...)`) dans le CSS de page :
  toujours un token de `global.css` (`--cat-*` pour les catégories d'aides,
  `--chart-*` pour le graphique d'occupation). Exception assumée et localisée :
  la palette « papier » de la carte dans `plan.css`.
- Écriture en casse normale : pas de libellés en capitales espacées ni de
  numérotation décorative (« 01 — »).
- Groupes d'éléments en `display:flex/grid` + `gap`, pas de marges au coup par coup.
- Icônes = SVG inline (`<svg class="icon">`, trait `currentColor`), jamais d'emoji.
- `.claude/launch.json` : config du serveur de preview local (port 3456).
