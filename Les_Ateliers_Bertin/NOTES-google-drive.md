# Connexion Google Drive — page Devis

Les fichiers des devis sont enregistrés dans le Google Drive de la personne
connectée. La base Firebase ne garde que les informations (dossier, entreprise,
montant, statut…) et l'identifiant du fichier dans Drive.

## Mise en place (une seule fois, environ 10 minutes)

Le site a besoin d'un **identifiant client OAuth**. Il est public (visible dans
le code, comme la config Firebase) : ce n'est pas un mot de passe.

1. Ouvrir <https://console.cloud.google.com/> avec le compte Google qui recevra
   les devis, puis créer un projet (ex. « Ateliers Bertin »).
2. **API et services → Bibliothèque** : chercher « Google Drive API » → **Activer**.
3. **Google Auth Platform** (ou « Écran de consentement OAuth ») :
   - type d'application **Externe**, nom « Ateliers Bertin », e-mail d'assistance ;
   - **Audience** : laisser en mode *Test* et ajouter son adresse Gmail dans
     **Utilisateurs test** (et celles des associés éventuels) ;
   - **Accès aux données** : ajouter le champ d'application
     `https://www.googleapis.com/auth/drive.file`.
4. **Clients → Créer un client** : type **Application Web**.
   - **Origines JavaScript autorisées** : `http://localhost:3456`
     et, plus tard, l'adresse du site en ligne (ex. `https://ateliers-bertin.web.app`).
   - Aucune URI de redirection n'est nécessaire.
5. Copier l'**ID client** (`…apps.googleusercontent.com`) dans `drive.js` :
   ```js
   const CLIENT_ID = '1234567890-abc.apps.googleusercontent.com';
   ```
6. Recharger `devis.html` → **Connecter Google Drive** dans la colonne Dossiers.
   Google affiche un avertissement « application non validée » tant que le projet
   est en mode Test : c'est normal pour un usage personnel.

## Fonctionnement

- Autorisation `drive.file` : le site ne voit **que les fichiers et dossiers qu'il a
  créés**, jamais le reste du Drive.
- Au premier envoi, le site crée le dossier **« Ateliers Bertin — Devis »** à la
  racine du Drive, puis un sous-dossier par dossier du site (créé au besoin).
- Le site est la référence. Renommer ou déplacer un dossier ou un devis sur le site
  le renomme ou le déplace dans Drive. **L'inverse n'est pas vrai** : un fichier
  déplacé à la main dans Drive sera remis à sa place à la prochaine modification.
- Supprimer sur le site place le fichier ou le dossier dans la **corbeille de Drive**
  (récupérable 30 jours).
- Les changements faits sans session Drive ouverte sont marqués `driveDirty` dans la
  base et reportés à la prochaine connexion, sur n'importe quel appareil.
- Les fichiers déposés sans connexion attendent dans la page ; ils sont perdus si
  on la ferme avant de connecter Drive (le navigateur demande confirmation).
- La session Google dure environ une heure ; ensuite, un clic sur
  **Connecter Google Drive** suffit (pas de nouveau consentement).
- Ouvrir et télécharger passent par les liens Drive : il faut être connecté à
  Google dans le navigateur avec un compte qui a accès au fichier.

## Limites

- Prévu pour **un compte Google** qui détient les fichiers. Un associé peut consulter
  les devis si le dossier « Ateliers Bertin — Devis » est partagé avec lui dans Drive ;
  s'il connecte son propre compte, les nouveaux envois iront dans son Drive à lui.
- Les informations des devis (montants, entreprises, noms de fichiers) restent dans
  la base Firebase, ouverte en lecture et en écriture (voir `NOTES-firebase.md`,
  option B pour la protéger).
