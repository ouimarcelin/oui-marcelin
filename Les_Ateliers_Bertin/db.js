/* ============================================================
   DB.JS — connexion Firebase Realtime Database (module ES, sans build)
   ------------------------------------------------------------
   Le SDK se charge depuis le CDN Google, aucune étape de build.
   La config ci-dessous est PUBLIQUE (non secrète) : la sécurité
   repose sur les Security Rules de la base, pas sur le secret de
   la clé. Voir NOTES-firebase.md.

   API exposée sur window.BertinDB :
     slug(texte)                     -> clé RTDB stable
     read(path)             -> Promise(valeur|null)
     write(path, patch)     -> Promise(bool)   (merge + updatedAt)
     watch(path, cb)        -> unsubscribe     (temps réel)
     getAllAides()          -> Promise({ <slug>: {fav, statut, ...} })
     setAide(nom, patch)    -> Promise(bool)
     watchAides(cb)         -> unsubscribe
   window : événement "bertindb-ready" émis une fois le SDK initialisé.
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getDatabase, ref, get, set, update, remove as removeRef, onValue, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://ateliers-bertin-default-rtdb.europe-west1.firebasedatabase.app",
  // Décommenter pour activer Firebase Auth plus tard
  // (Console Firebase → Paramètres du projet → Vos applications → Configuration du SDK) :
  // apiKey:     "TODO",
  // authDomain: "ateliers-bertin.firebaseapp.com",
  // projectId:  "ateliers-bertin",
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

/* racine de travail dans la base — les règles peuvent être limitées à ce nœud */
const ROOT = "dossier";

const slug = (s) => (s || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);

const full = (path) => `${ROOT}/${String(path).replace(/^\/+/, "")}`;

async function read(path) {
  try {
    const snap = await get(ref(db, full(path)));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.warn(`[BertinDB] lecture "${path}" impossible — vérifier les règles RTDB :`, e.message);
    return null;
  }
}

async function write(path, patch) {
  try {
    await update(ref(db, full(path)), { ...patch, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.warn(`[BertinDB] écriture "${path}" refusée — vérifier les règles RTDB :`, e.message);
    return false;
  }
}

/* remplace la valeur telle quelle (sans updatedAt) — pour les valeurs simples */
async function put(path, value) {
  try {
    await set(ref(db, full(path)), value);
    return true;
  } catch (e) {
    console.warn(`[BertinDB] écriture "${path}" refusée — vérifier les règles RTDB :`, e.message);
    return false;
  }
}

async function remove(path) {
  try {
    await removeRef(ref(db, full(path)));
    return true;
  } catch (e) {
    console.warn(`[BertinDB] suppression "${path}" refusée — vérifier les règles RTDB :`, e.message);
    return false;
  }
}

function watch(path, cb) {
  return onValue(
    ref(db, full(path)),
    (snap) => cb(snap.exists() ? snap.val() : {}),
    (e) => console.warn(`[BertinDB] abonnement "${path}" échoué :`, e.message)
  );
}

window.BertinDB = {
  slug, read, write, put, remove, watch,
  getAllAides: ()          => read("aides").then((v) => v || {}),
  setAide:     (nom, patch) => write(`aides/${slug(nom)}`, patch),
  watchAides:  (cb)         => watch("aides", cb),
};

window.dispatchEvent(new Event("bertindb-ready"));
