/* ============================================================
   DRIVE.JS — connexion Google Drive (Google Identity Services + API REST v3)
   ------------------------------------------------------------
   Autorisation « drive.file » : le site ne voit que les fichiers et dossiers
   qu'il a lui-même créés dans le Drive de la personne connectée.
   Le jeton d'accès (valable 1 h) reste dans sessionStorage, jamais dans la base.
   Configuration : renseigner CLIENT_ID (voir NOTES-google-drive.md).

   API exposée sur window.BertinDrive :
     configured() / connected()          -> bool
     connect()                           -> Promise   (à appeler depuis un clic)
     disconnect()
     onChange(cb)                        -> fonction de désabonnement
     get(id) / exists(id)
     createFolder(nom, parentId)         -> fichier
     update(id, patch, ajouterParent, retirerParents)
     trash(id)                           // corbeille Drive, récupérable
     upload(file, parentId, onProgress)  -> fichier { id, name, parents, webViewLink }
   Les erreurs portent un code : "auth" | "not-found" | "http" | "not-configured" | "gis-not-loaded".
   ============================================================ */
(function () {
  'use strict';

  /* Identifiant client OAuth (public, non secret), ex. "1234567890-abc.apps.googleusercontent.com" */
  const CLIENT_ID = '923550495375-llh7brrdge5sg98n74uavbtu55j83cb5.apps.googleusercontent.com';

  const SCOPE  = 'https://www.googleapis.com/auth/drive.file';
  const FILES  = 'https://www.googleapis.com/drive/v3/files';
  const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
  const FIELDS = 'id,name,parents,trashed,webViewLink';
  const KEY    = 'bertin-drive-token';

  let token = null, expiresAt = 0, tokenClient = null, pendingAuth = null, expiryTimer;
  const listeners = new Set();

  const configured = () => Boolean(CLIENT_ID);
  const connected  = () => Boolean(token) && Date.now() < expiresAt - 60000;
  const notify     = () => listeners.forEach(cb => cb());

  function driveError(code, detail) {
    const err = new Error(detail ? `${code} : ${detail}` : code);
    err.code = code;
    return err;
  }

  function setToken(value, expiresInSec) {
    token = value || null;
    expiresAt = token ? Date.now() + expiresInSec * 1000 : 0;
    try {
      if (token) sessionStorage.setItem(KEY, JSON.stringify({ token, expiresAt }));
      else sessionStorage.removeItem(KEY);
    } catch {}
    clearTimeout(expiryTimer);
    if (token) expiryTimer = setTimeout(notify, Math.max(0, expiresAt - 60000 - Date.now()));
    notify();
  }

  // jeton encore valide après un rechargement de la page
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (saved && saved.expiresAt - 60000 > Date.now()) setToken(saved.token, (saved.expiresAt - Date.now()) / 1000);
  } catch {}

  /* ── CONNEXION ── */
  function connect() {
    return new Promise((resolve, reject) => {
      if (!configured()) return reject(driveError('not-configured'));
      const oauth = window.google?.accounts?.oauth2;
      if (!oauth) return reject(driveError('gis-not-loaded'));
      if (!tokenClient) {
        tokenClient = oauth.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          callback: resp => {
            const p = pendingAuth;
            pendingAuth = null;
            if (resp.error) return p?.reject(driveError('auth', resp.error));
            setToken(resp.access_token, Number(resp.expires_in) || 3600);
            p?.resolve();
          },
          error_callback: err => {
            const p = pendingAuth;
            pendingAuth = null;
            p?.reject(driveError('auth', err?.type || 'popup'));
          },
        });
      }
      pendingAuth = { resolve, reject };
      tokenClient.requestAccessToken({ prompt: '' });   // consentement demandé la première fois seulement
    });
  }

  function disconnect() {
    if (token && window.google?.accounts?.oauth2) window.google.accounts.oauth2.revoke(token, () => {});
    setToken(null);
  }

  /* ── REQUÊTES ── */
  async function call(url, { method = 'GET', body } = {}) {
    if (!connected()) throw driveError('auth', 'non connecté');
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json; charset=UTF-8' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) { setToken(null); throw driveError('auth', 'jeton expiré'); }
    if (res.status === 404) throw driveError('not-found');
    if (!res.ok) throw driveError('http', `${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  }

  const get = id => call(`${FILES}/${encodeURIComponent(id)}?fields=${FIELDS}`);

  const exists = id => get(id).then(
    f => !f.trashed,
    err => { if (err.code === 'not-found') return false; throw err; }
  );

  const createFolder = (name, parent) => call(`${FILES}?fields=${FIELDS}`, {
    method: 'POST',
    body: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parent] },
  });

  function update(id, patch = {}, addParent = '', removeParents = '') {
    const q = new URLSearchParams({ fields: FIELDS });
    if (addParent) q.set('addParents', addParent);
    if (removeParents) q.set('removeParents', removeParents);
    return call(`${FILES}/${encodeURIComponent(id)}?${q}`, { method: 'PATCH', body: patch });
  }

  const trash = id => update(id, { trashed: true });

  /* ── ENVOI DE FICHIERS ── */
  function send(method, url, headers, body, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
      xhr.onload = () => {
        if (xhr.status === 401) { setToken(null); return reject(driveError('auth', 'jeton expiré')); }
        if (xhr.status < 200 || xhr.status >= 300) return reject(driveError('http', `${xhr.status} ${xhr.responseText}`));
        try { resolve(JSON.parse(xhr.responseText)); } catch { reject(driveError('http', 'réponse illisible')); }
      };
      xhr.onerror = () => reject(driveError('http', 'réseau'));
      xhr.send(body);
    });
  }

  async function upload(file, parent, onProgress) {
    if (!connected()) throw driveError('auth', 'non connecté');
    const meta = { name: file.name, parents: [parent] };
    const type = file.type || 'application/octet-stream';

    // envoi « resumable » : ouverture d'une session, puis contenu avec suivi de progression
    const init = await fetch(`${UPLOAD}?uploadType=resumable&fields=${FIELDS}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': type,
      },
      body: JSON.stringify(meta),
    });
    if (init.status === 401) { setToken(null); throw driveError('auth', 'jeton expiré'); }
    if (!init.ok) throw driveError('http', `${init.status} ${await init.text()}`);
    const session = init.headers.get('Location');
    if (session) return send('PUT', session, { 'Content-Type': type }, file, onProgress);

    // en-tête Location illisible : envoi en une seule requête « multipart »
    const boundary = 'bertin' + Math.random().toString(36).slice(2);
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
      `--${boundary}\r\nContent-Type: ${type}\r\n\r\n`, file, `\r\n--${boundary}--`,
    ]);
    return send('POST', `${UPLOAD}?uploadType=multipart&fields=${FIELDS}`, {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    }, body, onProgress);
  }

  window.BertinDrive = {
    configured, connected, connect, disconnect,
    onChange: cb => { listeners.add(cb); return () => listeners.delete(cb); },
    get, exists, createFolder, update, trash, upload,
  };
})();
