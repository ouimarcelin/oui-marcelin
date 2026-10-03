/* ── DEVIS — arbre de dossiers, glisser-déposer, fichiers dans Google Drive ──
   Métadonnées (Firebase)  : dossier/devis/{dossiers, items, driveRoot, driveTrash}
   Fichiers (Google Drive) : dossier « Ateliers Bertin — Devis », même arborescence que le site.
   Le site est la référence : ses changements sont reportés dans Drive, pas l'inverse.
   Voir NOTES-firebase.md et NOTES-google-drive.md. */
(function () {
  'use strict';

  const INBOX = 'a-classer';
  const DRIVE_ROOT_NAME = 'Ateliers Bertin — Devis';

  const DEFAULT_FOLDERS = {
    [INBOX]:   { name: 'À classer',                         parent: '', order: 0 },
    'phase-1': { name: 'Phase 1 — Maison des Jeux',         parent: '', order: 1 },
    'phase-2': { name: 'Phase 2 — Cave',                    parent: '', order: 2 },
    'phase-3': { name: 'Phase 3 — Ateliers RDC',            parent: '', order: 3 },
    'phase-4': { name: 'Phase 4 — Auberge et appartements', parent: '', order: 4 },
    'cour':    { name: 'Cour',                              parent: '', order: 5 },
  };
  /* dossier de phase -> champ de coût dans le prévisionnel */
  const PHASE_COST = { 'phase-1': 'ph1', 'phase-2': 'ph2', 'phase-3': 'ph3', 'phase-4': 'ph4' };

  const STATUTS = [
    ['recu',     'Reçu',       'var(--muted)'],
    ['negocier', 'À négocier', 'var(--warning)'],
    ['retenu',   'Retenu',     'var(--positive)'],
    ['refuse',   'Refusé',     'var(--negative)'],
  ];
  const STATUT = Object.fromEntries(STATUTS.map(([k, label, tone]) => [k, { label, tone }]));
  const TVA = [['20', '20 %'], ['10', '10 %'], ['5.5', '5,5 %']];

  const svg = d => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    folder:   svg('<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
    tray:     svg('<path d="M3.5 13h4.75l1.5 2.5h4.5l1.5-2.5h4.75"/><path d="M6 5.5h12l2.5 7.5v4.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V13z"/>'),
    stack:    svg('<path d="M12 4 3.5 8.5 12 13l8.5-4.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>'),
    doc:      svg('<path d="M7 3.5h6.5l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M13.5 3.5v5h5"/>'),
    chevron:  svg('<path d="m9 6 6 6-6 6"/>'),
    plus:     svg('<path d="M12 5v14M5 12h14"/>'),
    upload:   svg('<path d="M12 15V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 14.5v4a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-4"/>'),
    trash:    svg('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5"/>'),
    cloud:    svg('<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5z"/>'),
    external: svg('<path d="M14 4.5h5.5V10M19.5 4.5 11 13"/><path d="M17.5 13.5v5a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 6 6.5h5"/>'),
  };

  /* ── ÉTAT ── */
  const Drive = window.BertinDrive;
  const state = { folders: structuredClone(DEFAULT_FOLDERS), items: {}, driveRoot: '', driveTrash: {} };
  let current  = store('devis-current') || '';   // dossier affiché ('' = tous les devis)
  let selected = null;                            // devis ouvert dans le panneau
  let renaming = null, renameDraft = '';
  let drag     = null;                            // { kind: 'item' | 'folder', id } pendant un glisser interne
  let online   = false;
  let uploadTarget = INBOX;
  let armed = null, armedTimer;                   // suppression en attente de confirmation : 'item:<id>' | 'folder:<id>'
  const collapsed = new Set(JSON.parse(store('devis-collapsed') || '[]'));
  const uploads   = new Map();                    // id -> { item, file, progress, started } : pas encore dans Drive
  const verified  = new Set();                    // dossiers Drive dont l'existence a été vérifiée
  const costDefault = {}, costRemote = {};

  const explorer  = document.getElementById('explorer');
  const tree      = document.getElementById('tree');
  const content   = document.getElementById('content');
  const detail    = document.getElementById('detail');
  const driveBox  = document.getElementById('drive');
  const fileInput = document.getElementById('file-input');
  const db = () => (online ? window.BertinDB : null);

  /* ── UTILITAIRES ── */
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch { return null; }
  }
  const uid   = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc   = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num   = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const sum   = list => list.reduce((t, it) => t + num(it.montantHT), 0);
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const size  = b => b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' Ko' : (b / 1048576).toFixed(1).replace('.', ',') + ' Mo';
  const ext   = name => (name.includes('.') ? name.split('.').pop().slice(0, 4).toUpperCase() : '');
  const dateFr = d => (d ? new Date(d + 'T00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
  const driveFolderUrl = id => `https://drive.google.com/drive/folders/${encodeURIComponent(id)}`;

  const children = parent => Object.entries(state.folders)
    .filter(([, f]) => (f.parent || '') === parent)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0) || String(a.name).localeCompare(b.name, 'fr', { numeric: true }));
  const itemsIn = folder => Object.entries(state.items)
    .filter(([, it]) => it.folder === folder)
    .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0));
  const deepItems = folder => [
    ...itemsIn(folder).map(([, it]) => it),
    ...children(folder).flatMap(([id]) => deepItems(id)),
  ];
  function pathTo(id) {
    const path = [];
    for (let f = id, guard = 0; f && state.folders[f] && guard < 50; f = state.folders[f].parent, guard++) path.unshift(f);
    return path;
  }
  const isInside = (id, ancestor) => pathTo(id).includes(ancestor);
  const folderName = id => (id ? state.folders[id]?.name ?? '' : 'Tous les devis');
  const expandTo = id => { pathTo(id).forEach(f => collapsed.delete(f)); saveCollapsed(); };
  const saveCollapsed = () => store('devis-collapsed', JSON.stringify([...collapsed]));
  const costOf = key => (key in costRemote ? costRemote[key] : costDefault[key]) || 0;

  /* ── PERSISTANCE (Firebase) ── */
  function saveFolder(id, patch) {
    state.folders[id] = { ...state.folders[id], ...patch };
    db()?.write(`devis/dossiers/${id}`, patch);
  }
  function saveItem(id, patch) {
    if (!state.items[id]) return;
    Object.assign(state.items[id], patch);
    if (!uploads.has(id)) db()?.write(`devis/items/${id}`, patch);   // un devis en cours d'envoi est écrit à la fin
  }

  let pendingId = null, pending = {}, pendingTimer;
  function flush() {
    clearTimeout(pendingTimer);
    if (pendingId && !uploads.has(pendingId) && Object.keys(pending).length) db()?.write(`devis/items/${pendingId}`, pending);
    pendingId = null;
    pending = {};
  }

  const isLegacy = it => Number(it.chunks) > 0 && !it.driveId;   // fichier gardé dans la base par la première version
  const hasDriveWork = () => uploads.size > 0 || Object.keys(state.driveTrash).length > 0
    || Object.values(state.items).some(isLegacy)
    || Object.values(state.folders).some(f => f.driveDirty)
    || Object.values(state.items).some(it => it.driveDirty);

  function applyRemote(data) {
    const folders = data.dossiers || {};
    if (!Object.keys(folders).length) {            // première ouverture : dossiers par défaut
      Object.entries(DEFAULT_FOLDERS).forEach(([id, f]) => window.BertinDB.write(`devis/dossiers/${id}`, f));
      return;
    }
    if (!folders[INBOX]) window.BertinDB.write(`devis/dossiers/${INBOX}`, DEFAULT_FOLDERS[INBOX]);
    state.folders = folders;
    state.items = { ...(data.items || {}) };
    uploads.forEach((u, id) => { state.items[id] = u.item; });
    state.driveRoot = data.driveRoot || '';
    state.driveTrash = data.driveTrash || {};
    render();
    if (hasDriveWork()) flushDrive();
  }

  function setSync(ok) {
    const el = document.getElementById('sync');
    el.classList.toggle('is-on', ok);
    el.classList.toggle('is-off', !ok);
    el.querySelector('span').textContent = ok ? 'Enregistré en ligne' : 'Hors ligne : rien n’est enregistré';
  }

  /* ── SYNCHRONISATION GOOGLE DRIVE ──
     Chaque changement marque l'élément « driveDirty » dans la base ; flushDrive() applique
     tout ce qui est en attente dès qu'une session Drive est ouverte (y compris sur un autre appareil).
     Ordre : envois, dossiers (du haut vers le bas), devis, puis mises à la corbeille. */
  const depth = id => pathTo(id).length;

  async function driveFolderOk(driveId) {
    if (!driveId) return false;
    if (verified.has(driveId)) return true;
    const ok = await Drive.exists(driveId);
    if (ok) verified.add(driveId);
    return ok;
  }

  async function ensureRoot() {
    if (await driveFolderOk(state.driveRoot)) return state.driveRoot;
    const folder = await Drive.createFolder(DRIVE_ROOT_NAME, 'root');
    verified.add(folder.id);
    state.driveRoot = folder.id;
    await db()?.put('devis/driveRoot', folder.id);
    return folder.id;
  }

  /* identifiant Drive du dossier du site, créé au besoin */
  async function ensureFolder(fid) {
    const f = fid && state.folders[fid];
    if (!f) return ensureRoot();
    if (await driveFolderOk(f.driveId)) return f.driveId;
    const parent = await ensureFolder(f.parent || '');
    const created = await Drive.createFolder(f.name, parent);
    verified.add(created.id);
    saveFolder(fid, { driveId: created.id, driveDirty: false });
    return created.id;
  }

  async function placeInDrive(driveId, parent, name) {
    const file = await Drive.get(driveId);
    if (file.trashed) { const err = new Error('not-found'); err.code = 'not-found'; throw err; }
    const parents = file.parents || [];
    const add = parents.includes(parent) ? '' : parent;
    const remove = parents.filter(p => p !== parent).join(',');
    const patch = name && file.name !== name ? { name } : {};
    if (add || remove || patch.name) await Drive.update(driveId, patch, add, remove);
  }

  async function syncFolder(fid) {
    const f = state.folders[fid];
    if (!f) return;
    if (await driveFolderOk(f.driveId)) {
      await placeInDrive(f.driveId, await ensureFolder(f.parent || ''), f.name);
      saveFolder(fid, { driveDirty: false });
    } else {
      saveFolder(fid, { driveId: '', driveDirty: false });   // recréé à la prochaine utilisation
    }
  }

  async function syncItem(id) {
    const it = state.items[id];
    if (!it) return;
    if (!it.driveId) { saveItem(id, { driveDirty: false }); return; }
    try {
      await placeInDrive(it.driveId, await ensureFolder(it.folder));
      saveItem(id, { driveDirty: false });
    } catch (err) {
      if (err.code !== 'not-found') throw err;
      saveItem(id, { driveDirty: false, driveMissing: true });
    }
  }

  async function trashInDrive(driveId) {
    try { await Drive.trash(driveId); } catch (err) { if (err.code !== 'not-found') throw err; }
    verified.delete(driveId);
    delete state.driveTrash[driveId];
    await db()?.remove(`devis/driveTrash/${driveId}`);
  }

  async function uploadOne(id) {
    const u = uploads.get(id);
    if (!u || u.started) return;
    u.started = true;
    u.progress = 0;
    paintProgress(id);
    const folder = u.item.folder;
    let file;
    try {
      file = await Drive.upload(u.file, await ensureFolder(folder), p => { u.progress = p; paintProgress(id); });
    } catch (err) {
      u.started = false;
      if (err.code === 'auth') throw err;               // repris après reconnexion
      if (uploads.get(id) === u) { uploads.delete(id); delete state.items[id]; }
      render();
      showToast(`Échec de l’envoi de « ${u.file.name} »`);
      console.warn('[Devis] envoi vers Google Drive impossible :', err);
      return;
    }
    if (uploads.get(id) !== u) {                        // supprimé pendant l'envoi
      await Drive.trash(file.id).catch(() => {});
      return;
    }
    uploads.delete(id);
    const item = { ...u.item, driveId: file.id, driveLink: file.webViewLink || '', driveDirty: u.item.folder !== folder };
    state.items[id] = item;
    await db()?.write(`devis/items/${id}`, item);
    render();
    showToast('Devis enregistré dans Google Drive');
  }

  /* première version : fichier découpé en base64 dans dossier/devisFichiers -> copié dans Drive, puis retiré de la base */
  async function migrateLegacy(id) {
    const it = state.items[id];
    const data = await db()?.read(`devisFichiers/${id}`);
    if (!data) { saveItem(id, { chunks: null, driveMissing: true }); return; }
    const parts = Array.isArray(data)
      ? data
      : Object.keys(data).filter(k => /^\d+$/.test(k)).sort((a, b) => a - b).map(k => data[k]);
    const bin = atob(parts.join(''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const file = new File([bytes], it.fileName, { type: it.type || 'application/octet-stream' });
    const driveFile = await Drive.upload(file, await ensureFolder(it.folder));
    if (!state.items[id]) { await Drive.trash(driveFile.id).catch(() => {}); return; }   // supprimé entre-temps
    saveItem(id, { driveId: driveFile.id, driveLink: driveFile.webViewLink || '', chunks: null, uploading: null, driveDirty: false });
    await db()?.remove(`devisFichiers/${id}`);
  }

  async function runSync() {
    for (const id of [...uploads.keys()]) await uploadOne(id);
    for (const id of Object.keys(state.items).filter(id => isLegacy(state.items[id]))) await migrateLegacy(id);
    const folders = Object.keys(state.folders).filter(id => state.folders[id].driveDirty).sort((a, b) => depth(a) - depth(b));
    for (const id of folders) await syncFolder(id);
    const items = Object.keys(state.items).filter(id => state.items[id].driveDirty && !uploads.has(id));
    for (const id of items) await syncItem(id);
    for (const driveId of Object.keys(state.driveTrash)) await trashInDrive(driveId);
  }

  let flushing = null, flushAgain = false, pauseUntil = 0, retryTimer;
  function flushDrive(force) {
    if (!online || !Drive.connected() || (!force && Date.now() < pauseUntil)) { renderDrive(); return; }
    if (flushing) { flushAgain = true; return; }
    flushing = (async () => {
      do { flushAgain = false; await runSync(); } while (flushAgain);
    })()
      .catch(err => {
        if (err.code === 'auth') {
          showToast('Reconnectez Google Drive pour terminer l’enregistrement');
        } else {
          console.warn('[Devis] Google Drive :', err);
          showToast('Google Drive ne répond pas, nouvel essai dans 30 secondes');
          pauseUntil = Date.now() + 30000;
          clearTimeout(retryTimer);
          retryTimer = setTimeout(() => flushDrive(true), 30000);
        }
      })
      .finally(() => { flushing = null; render(); });
  }

  /* ── RENDU ── */
  function render() {
    if (current && !state.folders[current]) current = '';
    if (selected && !state.items[selected]) selected = null;
    store('devis-current', current);
    renderTree();
    renderContent();
    renderDetail();
    renderStats();
    renderDrive();
  }

  function renderStats() {
    const all = Object.values(state.items);
    s('st-count', all.length);
    s('st-retenu', fmt(sum(all.filter(it => it.statut === 'retenu'))));
    s('st-examen', all.filter(it => it.statut === 'recu' || it.statut === 'negocier').length);
  }

  function renderDrive() {
    const waiting = [...uploads.values()].filter(u => !u.started).length;
    const dirty = hasDriveWork();
    if (!Drive.configured()) {
      driveBox.innerHTML = `<p class="drive-line">${ICON.cloud}<span>Google Drive n’est pas encore configuré</span></p>`;
    } else if (Drive.connected()) {
      driveBox.innerHTML = `
        <p class="drive-line is-on">${ICON.cloud}<span>${dirty ? 'Envoi vers Google Drive…' : 'Google Drive connecté'}</span></p>
        <div class="drive-actions">
          ${state.driveRoot ? `<a class="link" href="${driveFolderUrl(state.driveRoot)}" target="_blank" rel="noopener">Ouvrir dans Drive</a>` : '<span></span>'}
          <button class="drive-off" type="button" data-drive="disconnect">Déconnecter</button>
        </div>`;
    } else {
      driveBox.innerHTML = `
        <button class="btn btn-neutral btn-sm drive-connect" type="button" data-drive="connect">${ICON.cloud}Connecter Google Drive</button>
        ${waiting ? `<p class="caption">${waiting > 1 ? `${waiting} fichiers en attente` : '1 fichier en attente'} d’envoi</p>`
          : dirty ? '<p class="caption">Des changements attendent d’être reportés dans Drive</p>' : ''}`;
    }
  }

  function folderRow(id, f, depthLevel) {
    const kids = children(id);
    const open = !collapsed.has(id);
    const count = deepItems(id).length;
    const icon = id === INBOX ? ICON.tray : ICON.folder;
    const caret = kids.length
      ? `<button class="tree-caret${open ? ' is-open' : ''}" type="button" data-toggle="${id}" aria-expanded="${open}" aria-label="${open ? 'Replier' : 'Déplier'} ${esc(f.name)}">${ICON.chevron}</button>`
      : '<span class="tree-caret"></span>';
    const label = renaming === id
      ? `<div class="tree-link">${icon}<input class="rename" value="${esc(renameDraft)}" aria-label="Nom du dossier"></div>`
      : `<button class="tree-link" type="button" data-open="${id}"${current === id ? ' aria-current="true"' : ''}>${icon}<span class="tree-name">${esc(f.name)}</span>${count ? `<span class="tree-count">${count}</span>` : ''}</button>`;
    return `<li>
      <div class="tree-row${current === id ? ' is-current' : ''}" style="--depth:${depthLevel}" data-drop="${id}" data-folder="${id}" draggable="${id !== INBOX && renaming !== id}">${caret}${label}</div>
      ${kids.length && open ? `<ul>${kids.map(([cid, c]) => folderRow(cid, c, depthLevel + 1)).join('')}</ul>` : ''}
    </li>`;
  }

  function renderTree() {
    const total = Object.keys(state.items).length;
    tree.innerHTML = `<ul>
      <li><div class="tree-row${current === '' ? ' is-current' : ''}" data-drop="">
        <span class="tree-caret"></span>
        <button class="tree-link" type="button" data-open=""${current === '' ? ' aria-current="true"' : ''}>${ICON.stack}<span class="tree-name">Tous les devis</span>${total ? `<span class="tree-count">${total}</span>` : ''}</button>
      </div></li>
      ${children('').map(([id, f]) => folderRow(id, f, 0)).join('')}
    </ul>`;
    if (renaming) {
      const input = tree.querySelector('.rename');
      if (input && document.activeElement !== input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  function cheapest(entries) {
    const priced = entries.filter(([, it]) => num(it.montantHT) > 0 && it.statut !== 'refuse');
    if (priced.length < 2) return null;
    return priced.reduce((a, b) => (num(b[1].montantHT) < num(a[1].montantHT) ? b : a))[0];
  }

  const uploadLabel = u => (u.started ? `Envoi ${Math.round(u.progress * 100)} %` : 'En attente de Drive');

  function itemRow(id, it, best) {
    const expired = it.validite && it.validite < today() && it.statut !== 'retenu' && it.statut !== 'refuse';
    const sub = [it.objet, it.entreprise ? it.fileName : '', dateFr(it.date)].filter(Boolean).map(esc);
    if (expired) sub.push('<span class="expired">Expiré</span>');
    if (it.driveMissing) sub.push('<span class="expired">Absent de Drive</span>');
    if (isLegacy(it)) sub.push('À copier dans Drive');
    const u = uploads.get(id);
    let amount;
    if (u) amount = `<span class="muted" data-progress="${id}">${uploadLabel(u)}</span>`;
    else if (num(it.montantHT)) amount = `${fmt(num(it.montantHT))}${best === id ? '<small>Moins cher</small>' : ''}`;
    else amount = '<span class="muted">Montant à saisir</span>';
    const st = STATUT[it.statut] || STATUT.recu;
    return `<li class="row row--item${selected === id ? ' is-selected' : ''}" draggable="true" data-item="${id}">
      <button class="row-main" type="button" data-select="${id}">${ICON.doc}<span class="row-text"><span class="row-title">${esc(it.entreprise || it.fileName)}</span><span class="row-sub">${sub.join(' · ') || 'Informations à compléter'}</span></span></button>
      <span class="row-amount">${amount}</span>
      <span class="row-status"><span class="badge" style="--tone:${st.tone}">${st.label}</span></span>
    </li>`;
  }

  function subfolderRow(id, f) {
    const deep = deepItems(id);
    const retenu = sum(deep.filter(it => it.statut === 'retenu'));
    return `<li class="row row--folder" draggable="${id !== INBOX}" data-folder="${id}" data-drop="${id}">
      <button class="row-main" type="button" data-open="${id}">${id === INBOX ? ICON.tray : ICON.folder}<span class="row-text"><span class="row-title">${esc(f.name)}</span><span class="row-sub">${deep.length ? `${deep.length} devis` : 'Vide'}</span></span></button>
      <span class="row-amount">${retenu ? `${fmt(retenu)}<small>retenus</small>` : ''}</span>
      <span class="row-status"></span>
    </li>`;
  }

  function renderContent() {
    const isRoot = current === '';
    const kids = children(current);
    const items = isRoot ? [] : itemsIn(current);
    const deep = isRoot ? Object.values(state.items) : deepItems(current);
    const retenu = sum(deep.filter(it => it.statut === 'retenu'));
    const editable = !isRoot && current !== INBOX;
    const driveId = isRoot ? state.driveRoot : state.folders[current]?.driveId;
    content.dataset.drop = current;

    const crumbs = ['', ...pathTo(current)].map((id, i, all) => (i === all.length - 1
      ? `<span aria-current="page">${esc(folderName(id))}</span>`
      : `<button type="button" data-open="${id}" data-drop="${id}">${esc(folderName(id))}</button>`
    )).join(ICON.chevron);

    const cost = costOf(PHASE_COST[current]);
    const budget = cost ? `<div class="budget${retenu > cost ? ' is-over' : ''}">
        <div class="budget-line"><span>Coût prévu dans le prévisionnel</span><b>${fmt(cost)}</b></div>
        <div class="budget-bar"><i style="width:${Math.min(100, retenu / cost * 100)}%"></i></div>
        <p class="caption">${retenu > cost ? `Dépassement de ${fmt(retenu - cost)}` : `${fmt(cost - retenu)} encore disponibles`} par rapport aux devis retenus (HT).</p>
      </div>` : '';

    const best = cheapest(items);
    const rows = [...kids.map(([id, f]) => subfolderRow(id, f)), ...items.map(([id, it]) => itemRow(id, it, best))];

    content.innerHTML = `
      <nav class="crumbs" aria-label="Emplacement">${crumbs}</nav>
      <div class="content-head">
        <div>
          <h2 class="content-title">${esc(folderName(current))}</h2>
          <p class="content-summary">${deep.length} devis${retenu ? ` · ${fmt(retenu)} retenus HT` : ''}</p>
        </div>
        <div class="content-actions">
          <button class="btn btn-neutral btn-sm" type="button" data-new-folder>${ICON.plus}${isRoot ? 'Nouveau dossier' : 'Sous-dossier'}</button>
          ${editable ? `<button class="btn btn-neutral btn-sm" type="button" data-rename>Renommer</button>
          <button class="btn btn-neutral btn-sm btn-danger${armed === `folder:${current}` ? ' is-armed' : ''}" type="button" data-delete-folder>${armed === `folder:${current}` ? 'Confirmer' : 'Supprimer'}</button>` : ''}
          ${driveId ? `<a class="btn btn-neutral btn-sm" href="${driveFolderUrl(driveId)}" target="_blank" rel="noopener">${ICON.external}Drive</a>` : ''}
        </div>
      </div>
      ${budget}
      <button class="dropzone" type="button" data-browse data-drop="${current}">
        ${ICON.upload}
        <span><strong>Déposez vos devis ici</strong> ou cliquez pour choisir des fichiers</span>
        <span class="caption">PDF, image ou document, enregistré dans votre Google Drive${isRoot ? ' · rangé dans « À classer »' : ''}</span>
      </button>
      ${rows.length ? `<ul class="rows">${rows.join('')}</ul>` : '<p class="empty">Ce dossier est vide.</p>'}`;
  }

  function folderOptions(sel) {
    const out = [];
    (function walk(parent, level) {
      children(parent).forEach(([id, f]) => {
        out.push(`<option value="${id}"${id === sel ? ' selected' : ''}>${' '.repeat(level)}${esc(f.name)}</option>`);
        walk(id, level + 1);
      });
    })('', 0);
    return out.join('');
  }

  const field = (label, control, extra = '') => `<label class="field${extra}"><span>${label}</span>${control}</label>`;

  function detailActions(id, it) {
    const u = uploads.get(id);
    if (u) return `<p class="caption">${u.started ? 'Envoi vers Google Drive…' : 'En attente de connexion à Google Drive.'}</p>`;
    if (isLegacy(it)) return '<p class="caption">Fichier ajouté avant l’arrivée de Google Drive : il y sera copié dès la connexion.</p>';
    if (!it.driveId || it.driveMissing) return '<p class="caption">Fichier introuvable dans Google Drive.</p>';
    const view = it.driveLink || `https://drive.google.com/file/d/${encodeURIComponent(it.driveId)}/view`;
    return `<a class="btn btn-primary btn-sm" href="${esc(view)}" target="_blank" rel="noopener">Ouvrir dans Drive</a>
      <a class="btn btn-neutral btn-sm" href="https://drive.google.com/uc?export=download&amp;id=${encodeURIComponent(it.driveId)}" target="_blank" rel="noopener">Télécharger</a>`;
  }

  function renderDetail() {
    const it = selected && state.items[selected];
    // ne pas écraser un champ en cours de saisie : seuls les boutons du fichier sont rafraîchis
    if (it && detail.dataset.id === selected && detail.contains(document.activeElement)) {
      const actions = detail.querySelector('#detail-actions');
      if (actions) actions.innerHTML = detailActions(selected, it);
      updateTTC();
      return;
    }
    detail.dataset.id = selected || '';
    if (!it) {
      detail.innerHTML = `<div class="detail-empty">${ICON.doc}<p>Sélectionnez un devis pour voir et compléter ses informations.</p></div>`;
      return;
    }
    detail.innerHTML = `
      <div class="detail-file">
        <div class="file-thumb">${ICON.doc}<span>${esc(ext(it.fileName))}</span></div>
        <div class="file-meta">
          <p class="file-name">${esc(it.fileName)}</p>
          <p class="caption">${size(it.size || 0)}${it.createdAt ? ` · ajouté le ${new Date(it.createdAt).toLocaleDateString('fr-FR')}` : ''}</p>
        </div>
      </div>
      <div class="detail-actions" id="detail-actions">${detailActions(selected, it)}</div>
      <form class="fields" autocomplete="off" onsubmit="return false">
        ${field('Entreprise', `<input name="entreprise" value="${esc(it.entreprise)}" placeholder="Nom de l'entreprise">`)}
        ${field('Objet ou lot', `<input name="objet" value="${esc(it.objet)}" placeholder="Électricité, menuiseries…">`)}
        <div class="field-pair">
          ${field('Montant HT', `<input name="montantHT" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(it.montantHT)}" placeholder="0">`)}
          ${field('TVA', `<select name="tva">${TVA.map(([v, l]) => `<option value="${v}"${String(it.tva ?? '20') === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`)}
        </div>
        <p class="ttc">Montant TTC <b id="ttc">—</b></p>
        <div class="field-pair field-pair--even">
          ${field('Date du devis', `<input name="date" type="date" value="${esc(it.date)}">`)}
          ${field('Valable jusqu’au', `<input name="validite" type="date" value="${esc(it.validite)}">`)}
        </div>
        ${field('Statut', `<select name="statut">${STATUTS.map(([k, l]) => `<option value="${k}"${(it.statut || 'recu') === k ? ' selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${field('Dossier', `<select name="folder">${folderOptions(it.folder)}</select>`)}
        ${field('Notes', `<textarea name="notes" rows="4" placeholder="Délais, points à négocier, contact…">${esc(it.notes)}</textarea>`)}
      </form>
      <button class="link-danger${armed === `item:${selected}` ? ' is-armed' : ''}" type="button" data-delete-item>${armed === `item:${selected}` ? 'Confirmer la suppression' : `${ICON.trash}Supprimer ce devis`}</button>`;
    updateTTC();
  }

  function updateTTC() {
    const el = detail.querySelector('#ttc');
    const it = selected && state.items[selected];
    if (!el || !it) return;
    const ht = num(it.montantHT);
    el.textContent = ht ? fmt(ht * (1 + num(it.tva ?? 20) / 100)) : '—';
  }

  function paintProgress(id) {
    const el = content.querySelector(`[data-progress="${id}"]`);
    const u = uploads.get(id);
    if (el && u) el.textContent = uploadLabel(u);
  }

  /* ── CONFIRMATION DES SUPPRESSIONS ──
     Premier clic : le bouton devient « Confirmer » pendant 4 secondes ; second clic : suppression.
     (Pas de confirm() natif, bloqué par certains navigateurs intégrés.) */
  function disarm() {
    clearTimeout(armedTimer);
    armed = null;
    content.querySelectorAll('[data-delete-folder].is-armed').forEach(b => { b.classList.remove('is-armed'); b.textContent = 'Supprimer'; });
    detail.querySelectorAll('[data-delete-item].is-armed').forEach(b => { b.classList.remove('is-armed'); b.innerHTML = `${ICON.trash}Supprimer ce devis`; });
  }
  function confirmFirst(btn, key, label, message) {
    if (armed === key) { disarm(); return true; }
    disarm();
    armed = key;
    btn.classList.add('is-armed');
    btn.textContent = label;
    showToast(message);
    armedTimer = setTimeout(disarm, 4000);
    return false;
  }

  /* ── ACTIONS SUR LES DOSSIERS ── */
  function openFolder(id) {
    flush();
    current = id;
    selected = null;
    expandTo(id);
    render();
  }

  function newFolder(parent) {
    const id = uid();
    saveFolder(id, { name: 'Nouveau dossier', parent, order: Date.now() });
    if (parent) expandTo(parent);
    render();
    startRename(id);
  }

  function startRename(id) {
    if (!state.folders[id] || id === INBOX) return;
    expandTo(state.folders[id].parent || '');
    renaming = id;
    renameDraft = state.folders[id].name;
    renderTree();
    tree.querySelector('.rename')?.select();
  }

  function commitRename(save) {
    if (!renaming) return;
    const id = renaming, name = renameDraft.trim();
    renaming = null;
    const f = state.folders[id];
    if (save && name && f && name !== f.name) saveFolder(id, { name, driveDirty: Boolean(f.driveId) });
    render();
    flushDrive();
  }

  function deleteFolder(id) {
    const f = state.folders[id];
    if (!f || id === INBOX) return;
    const kids = children(id), items = itemsIn(id);
    const dest = f.parent || '';
    kids.forEach(([cid, c]) => saveFolder(cid, { parent: dest, driveDirty: Boolean(c.driveId) }));
    items.forEach(([iid, it]) => saveItem(iid, { folder: dest || INBOX, driveDirty: Boolean(it.driveId) }));
    if (f.driveId) {
      state.driveTrash[f.driveId] = true;
      db()?.put(`devis/driveTrash/${f.driveId}`, true);
    }
    delete state.folders[id];
    db()?.remove(`devis/dossiers/${id}`);
    if (current === id) current = dest;
    render();
    showToast('Dossier supprimé');
    flushDrive();
  }

  function canMoveFolder(id, parent) {
    const f = state.folders[id];
    return !!f && id !== INBOX && (parent === '' || !!state.folders[parent])
      && id !== parent && !isInside(parent, id) && (f.parent || '') !== parent;
  }
  function moveFolder(id, parent) {
    if (!canMoveFolder(id, parent)) return false;
    saveFolder(id, { parent, order: Date.now(), driveDirty: Boolean(state.folders[id].driveId) });
    if (parent) expandTo(parent);
    flushDrive();
    return true;
  }
  function moveItem(id, folder) {
    const it = state.items[id];
    if (!it || !state.folders[folder] || it.folder === folder) return false;
    saveItem(id, { folder, driveDirty: Boolean(it.driveId) });
    flushDrive();
    return true;
  }

  /* ── DEVIS ── */
  function addFiles(list, folder) {
    const files = [...list];
    if (!files.length) return;
    if (!Drive.configured()) { showToast('Google Drive n’est pas encore configuré'); return; }
    if (!online) { showToast('Base indisponible : impossible d’ajouter des devis'); return; }
    folder = state.folders[folder] ? folder : INBOX;
    flush();
    current = folder;
    expandTo(folder);
    files.forEach(file => {
      const id = uid();
      const item = {
        folder, fileName: file.name, size: file.size, type: file.type || '',
        entreprise: '', objet: '', montantHT: '', tva: '20', date: '', validite: '',
        statut: 'recu', notes: '', createdAt: Date.now(),
      };
      uploads.set(id, { item, file, progress: 0, started: false });
      state.items[id] = item;
      selected = id;
    });
    render();
    if (Drive.connected()) flushDrive(true);
    else showToast('Connectez Google Drive pour envoyer les fichiers');
  }

  function deleteItem(id) {
    const it = state.items[id];
    if (!it) return;
    if (pendingId === id) { clearTimeout(pendingTimer); pendingId = null; pending = {}; }
    const wasUploading = uploads.delete(id);
    delete state.items[id];
    if (selected === id) selected = null;
    if (!wasUploading) {
      db()?.remove(`devis/items/${id}`);
      if (isLegacy(it)) db()?.remove(`devisFichiers/${id}`);
      if (it.driveId) {
        state.driveTrash[it.driveId] = true;
        db()?.put(`devis/driveTrash/${it.driveId}`, true);
      }
    }
    render();
    showToast('Devis supprimé');
    flushDrive();
  }

  /* ── CLICS ── */
  explorer.addEventListener('click', ev => {
    const btn = ev.target.closest('button');
    if (!btn || !explorer.contains(btn)) return;
    if (btn.dataset.toggle) {
      const id = btn.dataset.toggle;
      collapsed.has(id) ? collapsed.delete(id) : collapsed.add(id);
      saveCollapsed();
      renderTree();
    } else if (btn.hasAttribute('data-open')) {
      openFolder(btn.dataset.open);
    } else if (btn.dataset.select) {
      flush();
      selected = btn.dataset.select;
      renderContent();
      renderDetail();
      content.querySelector(`[data-select="${selected}"]`)?.focus();
    } else if (btn.hasAttribute('data-browse')) {
      uploadTarget = current || INBOX;
      fileInput.click();
    } else if (btn.id === 'new-root') {
      newFolder('');
    } else if (btn.hasAttribute('data-new-folder')) {
      newFolder(current);
    } else if (btn.hasAttribute('data-rename')) {
      startRename(current);
    } else if (btn.hasAttribute('data-delete-folder')) {
      const hint = children(current).length || itemsIn(current).length ? ' Son contenu remontera d’un niveau.' : '';
      if (confirmFirst(btn, `folder:${current}`, 'Confirmer', `Cliquez à nouveau pour supprimer « ${folderName(current)} ».${hint}`)) deleteFolder(current);
    } else if (btn.hasAttribute('data-delete-item')) {
      const hint = state.items[selected]?.driveId ? ' Le fichier ira dans la corbeille de Google Drive.' : '';
      if (confirmFirst(btn, `item:${selected}`, 'Confirmer la suppression', `Cliquez à nouveau pour supprimer ce devis.${hint}`)) deleteItem(selected);
    } else if (btn.dataset.drive === 'connect') {
      Drive.connect()
        .then(() => { showToast('Google Drive connecté'); flushDrive(true); })
        .catch(err => {
          if (err.code === 'gis-not-loaded') showToast('Google se charge encore, réessayez dans un instant');
          else if (!/popup_closed/.test(err.message)) showToast('Connexion à Google Drive impossible');
        });
    } else if (btn.dataset.drive === 'disconnect') {
      Drive.disconnect();
    }
  });

  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files, uploadTarget);
    fileInput.value = '';
  });

  window.addEventListener('beforeunload', ev => {
    if (uploads.size) { ev.preventDefault(); ev.returnValue = ''; }
  });

  /* ── RENOMMAGE DANS L'ARBRE ── */
  tree.addEventListener('dblclick', ev => {
    const row = ev.target.closest('.tree-row[data-folder]');
    if (row) startRename(row.dataset.folder);
  });
  tree.addEventListener('input', ev => { if (ev.target.classList.contains('rename')) renameDraft = ev.target.value; });
  tree.addEventListener('keydown', ev => {
    if (!ev.target.classList.contains('rename')) return;
    if (ev.key === 'Enter')  { ev.preventDefault(); commitRename(true); }
    if (ev.key === 'Escape') { ev.preventDefault(); commitRename(false); }
  });
  /* Validation différée : un rendu de l'arbre (mise à jour venue de la base) remplace le champ
     et lui retire le focus ; modifier le DOM dans ce blur ferait échouer le rendu en cours. */
  tree.addEventListener('focusout', ev => {
    if (!ev.target.classList.contains('rename')) return;
    setTimeout(() => {
      const input = tree.querySelector('.rename');
      if (renaming && (!input || document.activeElement !== input)) commitRename(true);
    }, 0);
  });

  /* ── PANNEAU DE DÉTAILS ── */
  detail.addEventListener('input', ev => {
    const f = ev.target;
    if (!f.name || f.tagName === 'SELECT' || !selected || !state.items[selected]) return;
    if (pendingId && pendingId !== selected) flush();
    state.items[selected][f.name] = f.value;
    pendingId = selected;
    pending[f.name] = f.value;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(flush, 400);
    updateTTC();
    renderContent();
    renderStats();
  });

  detail.addEventListener('change', ev => {
    const f = ev.target;
    if (f.tagName !== 'SELECT' || !selected) return;
    if (f.name === 'folder') {
      flush();
      if (moveItem(selected, f.value)) {
        current = f.value;
        expandTo(current);
        render();
        showToast(`Déplacé dans « ${folderName(current)} »`);
      }
      return;
    }
    saveItem(selected, { [f.name]: f.value });
    updateTTC();
    renderContent();
    renderStats();
  });

  /* ── GLISSER-DÉPOSER ──
     Fichiers du bureau -> un dossier (arbre, ligne, fil d'Ariane, zone de dépôt ou contenu affiché).
     Devis et dossiers de la page -> un autre dossier. */
  const hasFiles = ev => [...(ev.dataTransfer?.types || [])].includes('Files');
  const elementOf = node => (node && node.nodeType === 1 ? node : node?.parentElement);
  let dropEl = null, fileDepth = 0, hoverId = null, hoverTimer;

  function setDropEl(el) {
    if (dropEl === el) return;
    dropEl?.classList.remove('is-drop');
    dropEl = el;
    el?.classList.add('is-drop');
  }
  function endDrag() {
    drag = null;
    fileDepth = 0;
    clearTimeout(hoverTimer);
    hoverId = null;
    setDropEl(null);
    document.body.classList.remove('is-dragging-files');
    document.querySelectorAll('.is-dragging').forEach(el => el.classList.remove('is-dragging'));
  }
  function accepts(ev, target) {
    if (hasFiles(ev)) return true;
    if (drag?.kind === 'item') return target !== '' && state.items[drag.id]?.folder !== target;
    if (drag?.kind === 'folder') return canMoveFolder(drag.id, target);
    return false;
  }

  document.addEventListener('dragstart', ev => {
    const row = elementOf(ev.target)?.closest('[data-item], [data-folder]');
    if (!row || row.getAttribute('draggable') !== 'true') return;
    drag = row.dataset.item ? { kind: 'item', id: row.dataset.item } : { kind: 'folder', id: row.dataset.folder };
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', drag.id);
    row.classList.add('is-dragging');
  });
  document.addEventListener('dragend', endDrag);

  document.addEventListener('dragenter', ev => {
    if (!hasFiles(ev)) return;
    fileDepth++;
    document.body.classList.add('is-dragging-files');
  });
  document.addEventListener('dragleave', ev => {
    if (!hasFiles(ev) || --fileDepth > 0) return;
    endDrag();
  });

  document.addEventListener('dragover', ev => {
    if (hasFiles(ev)) ev.preventDefault();   // empêche le navigateur d'ouvrir le fichier
    const el = elementOf(ev.target)?.closest('[data-drop]');
    if (el && accepts(ev, el.dataset.drop)) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = hasFiles(ev) ? 'copy' : 'move';
      setDropEl(el);
    } else {
      if (hasFiles(ev)) ev.dataTransfer.dropEffect = 'none';
      setDropEl(null);
    }
    // survol prolongé d'un dossier replié : on le déplie
    const fid = el?.closest('.tree-row')?.dataset.folder || null;
    if (fid !== hoverId) {
      clearTimeout(hoverTimer);
      hoverId = fid;
      if (fid && collapsed.has(fid)) {
        hoverTimer = setTimeout(() => { collapsed.delete(fid); saveCollapsed(); renderTree(); }, 700);
      }
    }
  });

  document.addEventListener('drop', ev => {
    const el = dropEl;
    const files = hasFiles(ev) ? ev.dataTransfer.files : null;
    const d = drag;
    if (files || el) ev.preventDefault();
    endDrag();
    if (!el) return;
    const target = el.dataset.drop;
    if (files?.length) { addFiles(files, target || INBOX); return; }
    if (d?.kind === 'item' && moveItem(d.id, target)) {
      render();
      showToast(`Déplacé dans « ${folderName(target)} »`);
    } else if (d?.kind === 'folder' && moveFolder(d.id, target)) {
      render();
      showToast(target ? `Dossier déplacé dans « ${folderName(target)} »` : 'Dossier déplacé à la racine');
    }
  });

  /* ── COÛTS DES PHASES (prévisionnel) ── */
  fetch('pavillon-bertin.html')
    .then(r => (r.ok ? r.text() : ''))
    .then(html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      Object.values(PHASE_COST).forEach(key => {
        const input = doc.getElementById(key);
        if (input) costDefault[key] = num(input.value);
      });
      renderContent();
    })
    .catch(() => {});

  /* ── DÉMARRAGE ── */
  function init() {
    online = true;
    setSync(true);
    window.BertinDB.watch('devis', applyRemote);
    window.BertinDB.watch('simulateur', values => {
      Object.values(PHASE_COST).forEach(key => { if (values[key] !== undefined) costRemote[key] = num(values[key]); });
      renderContent();
    });
  }

  Drive.onChange(() => { renderDrive(); renderContent(); renderDetail(); if (Drive.connected()) flushDrive(true); });
  render();
  window.BertinDB ? init() : window.addEventListener('bertindb-ready', init);
  setTimeout(() => { if (!online) setSync(false); }, 5000);
})();
