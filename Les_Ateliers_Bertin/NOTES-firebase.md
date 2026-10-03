# Connexion Firebase — Realtime Database

Base connectée : `https://ateliers-bertin-default-rtdb.europe-west1.firebasedatabase.app`
(projet `ateliers-bertin`, région `europe-west1`).

## Ce qui est câblé

| Fichier | Rôle |
|---|---|
| `db.js` | Module ES : charge le SDK Firebase depuis le CDN Google (aucun build), initialise la RTDB, expose `window.BertinDB`. |
| `financements.html` / `financements.js` | Persiste **favoris (★)**, **statut de démarche** (sélecteur par carte) et **aides ajoutées à la main** ; temps réel (`onValue`). |
| `pavillon-bertin.html` / `pavillon-bertin.js` | Persiste **toutes les valeurs éditées du simulateur** (`input.editable`) : chargées au démarrage, écrites à la volée (anti-rebond 350 ms), synchronisées en temps réel entre onglets. `fn-em` exclu (miroir recalculé de `cap`). |
| `devis.html` / `devis.js` | Arbre de dossiers et fiches de devis (entreprise, montant, statut…). Les **fichiers** sont dans Google Drive (voir `NOTES-google-drive.md`) ; la base garde leur identifiant et les changements à reporter dans Drive. Lit aussi `simulateur/ph1…ph4` pour comparer les devis retenus au coût prévu de chaque phase. |

Le panneau de `plan.html` peut être branché ensuite de la même façon via `window.BertinDB`.

Chaque page qui utilise la base charge `<script type="module" src="db.js">` **avant** `global.js` et son script propre.

### API `window.BertinDB`
```
slug(texte)            -> clé RTDB stable (sans accent, a-z0-9-)
read(path)             -> Promise(valeur|null)      // sous /dossier
write(path, patch)     -> Promise(bool)             // merge + updatedAt
put(path, valeur)      -> Promise(bool)             // remplace tel quel, sans updatedAt
remove(path)           -> Promise(bool)             // supprime le nœud
watch(path, cb)        -> unsubscribe               // temps réel
getAllAides() / setAide(nom, patch) / watchAides(cb)
```
Événement `window` « bertindb-ready » émis une fois le SDK prêt.

## Modèle de données

```
dossier/
  aides/
    <slug-du-nom>/
      fav:       true|false
      statut:    "" | "a-faire" | "en-cours" | "depose" | "obtenu" | "refuse"
      updatedAt: <timestamp serveur>
  aidesAjoutees/
    <slug-du-nom>/
      name, cat, desc, montant, conditions
      updatedAt
  devis/
    driveRoot: "<id Drive>"   // dossier « Ateliers Bertin — Devis »
    driveTrash/
      <id Drive>: true        // à mettre dans la corbeille Drive dès qu'une session est ouverte
    dossiers/
      <id>/                   // "a-classer", "phase-1"… puis identifiants générés
        name, parent ("" = racine), order,
        driveId, driveDirty,  // dossier Drive correspondant ; true = nom ou place à reporter
        updatedAt
    items/
      <id>/
        folder, fileName, size, type, entreprise, objet, montantHT, tva,
        date, validite, statut ("recu" | "negocier" | "retenu" | "refuse"),
        notes, createdAt,
        driveId, driveLink, driveDirty, driveMissing,
        updatedAt
  simulateur/
    <id de l'input>: "<valeur>"      // ex. "nb-at": "5", "lr-at": "400", "cap": "300000"…
    updatedAt
```
Les aides identiques présentes dans plusieurs onglets (Chapelle / Sacristie) partagent le même `slug` : leur favori et leur statut sont donc synchronisés, ce qui est voulu (c'est la même démarche).

## Règles de la base

Les règles ont été ouvertes sur `/dossier` (Option A ci-dessous) : la persistance
fonctionne. Si un jour la console repasse en mode verrouillé, tout renverra
`Permission denied` (avertissements console) — le site continue de tourner mais
plus rien n'est sauvegardé. Console Firebase → **Realtime Database → Règles**.

### Option A — dossier privé non listé (en place actuellement)
```json
{
  "rules": {
    "dossier": {
      ".read": true,
      ".write": true
    }
  }
}
```
N'ouvre que le nœud `/dossier`. Suffisant si le lien du site n'est pas public.
Toute personne connaissant l'URL de la base peut lire/écrire `/dossier`.

### Option B — écriture réservée aux personnes connectées (recommandé en production)
```json
{
  "rules": {
    "dossier": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```
Nécessite d'activer **Firebase Authentication** (méthode e-mail ou Google),
puis de compléter `firebaseConfig` dans `db.js` (`apiKey`, `authDomain`,
`projectId` — Console → Paramètres du projet → Vos applications → Config du SDK)
et d'ajouter une brique de connexion. À faire dans un second temps.

Test rapide : cocher un favori / changer un statut sur `financements.html`, ou
modifier un chiffre sur `pavillon-bertin.html` → la valeur doit réapparaître
après rechargement et se propager en direct sur un autre onglet ouvert.

## Cache navigateur (si « mes modifs n'apparaissent pas »)

Un `python3 -m http.server` classique laisse le navigateur garder en cache les
anciens `.js` / `.css`. Utiliser plutôt **`devserver.py`** (fourni, sans cache) :

```bash
python3 Les_Ateliers_Bertin/devserver.py 3456
```

ou forcer un rechargement dur (Cmd+Shift+R). Le `.claude/launch.json` du projet
pointe déjà sur `devserver.py`.

## Hébergement

Le SDK exige une origine http(s) ; `localhost` fonctionne (serveur de preview).
En production, **Firebase Hosting** (offre gratuite) est le choix naturel :
`npm i -g firebase-tools && firebase init hosting && firebase deploy`.
Penser à ajouter le domaine dans Console → Authentication → Paramètres →
Domaines autorisés si l'option B est activée.

## Note de sécurité

`databaseURL` (et plus tard `apiKey`) sont visibles dans le code source : c'est
normal pour une app web Firebase. La protection des données repose entièrement
sur les **Security Rules** ci-dessus (et éventuellement App Check), jamais sur le
secret de ces valeurs.
