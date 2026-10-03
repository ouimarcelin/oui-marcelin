/* ── ICÔNES ── */
const STAR_SVG='<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>';
const ARROW_SVG='<svg class="icon apply-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 8l4-4M5 4h3v3"/></svg>';

/* ── ONGLETS ── */
const controlsBar = document.querySelector('.controls-bar');
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    controlsBar.style.display = btn.dataset.tab === 'pavillon' ? '' : 'none';
  });
});

const BADGE_MAP={etat:'<span class="badge badge-state">État</span>',europe:'<span class="badge badge-europe">Europe</span>',region:'<span class="badge badge-region">Région</span>',dept:'<span class="badge badge-dept">Département</span>',fiscal:'<span class="badge badge-fiscal">Fiscal</span>'};
let currentFilter='all',favOnly=false;

/* Échappe le texte saisi ou lu en base avant de l'injecter en HTML */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function updateCounts(){
  const cats=['etat','europe','region','dept','fiscal'];let favTotal=0;
  cats.forEach(cat=>{const cards=document.querySelectorAll(`#tab-pavillon .card[data-category="${cat}"]`);let visible=0;cards.forEach(c=>{if(c.dataset.hidden!=='true')visible++;if(c.dataset.fav==='true')favTotal++;});const el=document.getElementById('count-'+cat);if(el)el.textContent=visible+' aide'+(visible>1?'s':'');});
  document.getElementById('total-count').textContent=document.querySelectorAll('#tab-pavillon .card').length;
  document.getElementById('fav-count').textContent=favTotal;
}

function applyFilters(){
  document.querySelectorAll('#tab-pavillon .card').forEach(card=>{const catMatch=currentFilter==='all'||card.dataset.category===currentFilter;const favMatch=!favOnly||card.dataset.fav==='true';card.dataset.hidden=(!catMatch||!favMatch)?'true':'false';});
  ['etat','europe','region','dept','fiscal'].forEach(cat=>{const section=document.querySelector(`#tab-pavillon .category[data-category="${cat}"]`);const visible=document.querySelectorAll(`#tab-pavillon .card[data-category="${cat}"]:not([data-hidden="true"])`).length;if(section)section.dataset.hidden=visible===0?'true':'false';});
  const anyVisible=document.querySelectorAll('#tab-pavillon .card:not([data-hidden="true"])').length;document.getElementById('empty-state').classList.toggle('visible',anyVisible===0&&favOnly);updateCounts();
}

document.querySelectorAll('.filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentFilter=btn.dataset.filter;applyFilters();});});
document.getElementById('fav-toggle').addEventListener('click',function(){favOnly=!favOnly;this.classList.toggle('active',favOnly);this.setAttribute('aria-pressed',String(favOnly));applyFilters();});

function setFavBtn(btn,on){if(!btn)return;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));}
function toggleFav(btn){const card=btn.closest('.card');const isFav=card.dataset.fav==='true';card.dataset.fav=isFav?'false':'true';setFavBtn(btn,!isFav);showToast(isFav?'Retiré des favoris':'Ajouté aux favoris');if(window.BertinDB)window.BertinDB.setAide(cardName(card),{fav:!isFav});if(favOnly)applyFilters();updateCounts();}

function showForm(){document.getElementById('add-trigger').style.display='none';document.getElementById('add-form').style.display='block';document.getElementById('f-name').focus();}
function hideForm(){document.getElementById('add-trigger').style.display='';document.getElementById('add-form').style.display='none';['f-name','f-desc','f-montant','f-conditions'].forEach(id=>document.getElementById(id).value='');}

function cardHTML(d){
  return `<div class="card-top"><div class="card-name">${esc(d.name)}</div><div class="card-actions">${BADGE_MAP[d.cat]||''}<button class="fav-btn active" type="button" onclick="toggleFav(this)" aria-pressed="true" aria-label="Favori">${STAR_SVG}</button></div></div><div class="card-difficulty" title="Difficulté d'obtention non évaluée"><span class="diff-label">Difficulté</span><span class="diff-num">à évaluer</span></div>${d.desc?`<p class="card-desc">${esc(d.desc)}</p>`:''}${d.montant?`<div class="card-montant">${esc(d.montant)}</div>`:''}${d.conditions?`<p class="card-conditions"><strong>Conditions :</strong> ${esc(d.conditions)}</p>`:''}<div class="tags"><span class="tag">Ajouté manuellement</span></div><a class="card-apply" href="https://aides-territoires.beta.gouv.fr/" target="_blank" rel="noopener noreferrer">Chercher le dispositif <span class="apply-src">Aides-territoires</span>${ARROW_SVG}</a>`;
}
function makeCard(d){
  const section=document.querySelector(`#tab-pavillon .category[data-category="${d.cat}"] .category-header`);
  if(!section)return null;
  const card=document.createElement('div');card.className='card';card.dataset.category=d.cat;card.dataset.fav='true';card.dataset.added='true';
  card.innerHTML=cardHTML(d);
  section.insertAdjacentElement('afterend',card);
  return card;
}
function addCard(){
  const name=document.getElementById('f-name').value.trim(),cat=document.getElementById('f-category').value;
  const desc=document.getElementById('f-desc').value.trim(),montant=document.getElementById('f-montant').value.trim(),conditions=document.getElementById('f-conditions').value.trim();
  if(!name){document.getElementById('f-name').focus();return;}
  const d={name,cat,desc,montant,conditions};
  const card=makeCard(d);
  if(window.BertinDB){window.BertinDB.write(`aidesAjoutees/${window.BertinDB.slug(name)}`,d);window.BertinDB.setAide(name,{fav:true});}
  hideForm();applyFilters();injectStatut(card);showToast('Aide ajoutée');card&&card.scrollIntoView({behavior:'smooth',block:'center'});
}
updateCounts();

/* ── PERSISTANCE FIREBASE — favoris, statut de démarche, aides ajoutées ── */
const STATUTS=[['','Statut'],['a-faire','À faire'],['en-cours','Dossier en cours'],['depose','Déposé'],['obtenu','Obtenu'],['refuse','Refusé']];
function cardName(card){return card.querySelector('.card-name').textContent.replace(/\s+/g,' ').trim();}
function paintStatut(wrap){const sel=wrap.querySelector('.cs-sel');wrap.className='card-statut'+(sel.value?' s-'+sel.value:'');}
function injectStatut(card){
  if(!card||card.querySelector('.card-statut'))return;
  const wrap=document.createElement('label');wrap.className='card-statut';
  const dot=document.createElement('span');dot.className='cs-dot';
  const sel=document.createElement('select');sel.className='cs-sel';sel.setAttribute('aria-label','Statut de la démarche');
  STATUTS.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;sel.appendChild(o);});
  sel.addEventListener('click',e=>e.stopPropagation());
  sel.addEventListener('change',()=>{paintStatut(wrap);card.dataset.statut=sel.value;if(window.BertinDB)window.BertinDB.setAide(cardName(card),{statut:sel.value});});
  wrap.append(dot,sel);
  const anchor=card.querySelector('.card-difficulty')||card.querySelector('.card-top');
  if(anchor)anchor.insertAdjacentElement('afterend',wrap);
}
function setStatut(card,v){const w=card.querySelector('.card-statut');if(!w)return;const s=w.querySelector('.cs-sel');s.value=v||'';paintStatut(w);card.dataset.statut=s.value;}
function applyAideState(map){
  map=map||{};
  document.querySelectorAll('.card').forEach(card=>{
    injectStatut(card);
    const st=map[window.BertinDB.slug(cardName(card))];
    if(!st)return;
    const wantFav=st.fav===true;
    if(card.dataset.fav!==String(wantFav)){card.dataset.fav=String(wantFav);setFavBtn(card.querySelector('.fav-btn'),wantFav);}
    if(st.statut!=null)setStatut(card,st.statut);
  });
  if(favOnly)applyFilters();else updateCounts();
}
function renderAdded(map){
  map=map||{};
  Object.entries(map).forEach(([slug,d])=>{
    if(!d||!d.name)return;
    const exists=[...document.querySelectorAll('#tab-pavillon .card .card-name')].some(n=>window.BertinDB.slug(n.textContent.replace(/\s+/g,' ').trim())===slug);
    if(!exists){const c=makeCard(d);injectStatut(c);}
  });
}
function initPersistence(){
  if(!window.BertinDB)return;
  document.querySelectorAll('.card').forEach(injectStatut);        // selects visibles tout de suite
  window.BertinDB.read('aidesAjoutees').then(renderAdded);         // reconstruit les aides ajoutées
  window.BertinDB.watchAides(applyAideState);                      // favoris + statut, temps réel
}
window.BertinDB?initPersistence():window.addEventListener('bertindb-ready',initPersistence);

/* ── DEEP-LINK (financements.html?bat=chapelle) ── */
const urlBat = new URLSearchParams(window.location.search).get('bat');
if (urlBat) {
  const btn = document.querySelector(`.tab-btn[data-tab="${urlBat}"]`);
  if (btn) btn.click();
}
