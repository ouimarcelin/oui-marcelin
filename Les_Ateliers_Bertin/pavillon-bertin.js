const MN=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
const CP=[0,0,0,0.3,0.7,1,1,1,0.7,0.5,0,0];
const PP=[0,0,0.5,1,1,1,1,1,1,0.7,0,0];
const TP=[0.7,0.7,0.9,1,1,1,1,1,1,0.9,0.7,0.7];
const FP=[0,0,0,0,0,0,1,0,0,0,0,0];
const EV=[null,null,null,null,null,null,'FLIP',null,null,null,null,null];

function occ(){const nl=g('nb-li')||15,cy=g('oc-cy'),pe=g('oc-pe'),to=g('oc-to'),fl=g('oc-fl');return MN.map((_,i)=>Math.min(nl,Math.round(CP[i]*cy+PP[i]*pe+TP[i]*to+FP[i]*fl)));}

/* Graphique empilé : les couleurs viennent des classes .seg-* (tokens --chart-* de global.css) */
function chart(){
  const nl=g('nb-li')||15,data=occ(),px=g('px-nu')||18,el=document.getElementById('bars');
  el.innerHTML='';s('pla-v',nl);
  data.forEach((tot,i)=>{
    const parts=[['tourisme',TP[i]*g('oc-to')],['pelerins',PP[i]*g('oc-pe')],['velo',CP[i]*g('oc-cy')],['flip',FP[i]*g('oc-fl')]];
    const pct=Math.min(100,tot/nl*100);
    const col=document.createElement('div');col.className='bcol';col.title=MN[i]+' : '+tot+' lit'+(tot>1?'s':'');
    const track=document.createElement('div');track.className='btrack';
    const stk=document.createElement('div');stk.className='bstack';stk.style.height=pct+'%';
    parts.forEach(([k,v])=>{if(v>0){const sg=document.createElement('div');sg.className='seg seg-'+k;sg.style.flexGrow=v;stk.appendChild(sg);}});
    const vEl=document.createElement('span');vEl.className='bval';vEl.textContent=tot;vEl.style.bottom=`calc(${pct}% + 4px)`;
    track.append(stk,vEl);
    if(EV[i]){const ev=document.createElement('span');ev.className='bev';ev.textContent=EV[i];ev.style.bottom=`calc(${pct}% + 22px)`;track.appendChild(ev);}
    const mEl=document.createElement('span');mEl.className='bmon';mEl.textContent=MN[i];
    col.append(track,mEl);el.appendChild(col);
  });
  el.setAttribute('aria-label','Lits occupés par mois : '+data.map((v,i)=>MN[i]+' '+v).join(', '));
  const tot=data.reduce((a,b)=>a+b,0),taux=Math.round(tot/(nl*12)*100),ca=data.reduce((a,b)=>a+b*30*px,0);
  s('tx-occ',taux+' %');s('ca-occ',Math.round(ca).toLocaleString('fr-FR')+' €');s('kpi-t',taux);
  return{ca,taux};
}

function recalc(){
  const{ca:caAu}=chart();
  const lrAt=[1,2,3,4,5].map(i=>g('lr-at'+i)),ttAt=lrAt.reduce((a,b)=>a+b,0)*12;
  const nbLi=g('nb-li')||15,pxNu=g('px-nu'),ttAu=caAu;
  const nbAp=g('nb-ap'),lrAp=g('lr-ap'),ttAp=nbAp*lrAp*12;
  const stMn=g('st-mn'),ttSt=stMn*12;
  const nbEv=g('nb-ev'),pxEv=g('px-ev'),ttEv=nbEv*pxEv;
  const GTR=ttAt+ttAu+ttAp+ttSt+ttEv;
  s('d-at',fmt(ttAt)+'/an');lrAt.forEach((v,i)=>s('c-at'+(i+1),fmt(v*12)));s('tt-at',fmt(ttAt));
  s('d-au',fmt(ttAu)+'/an');s('c-au-px',pxNu+' €/nuit × '+nbLi+' lits');s('tt-au',fmt(ttAu));
  s('d-ap',fmt(ttAp)+'/an');s('c-ap-nb',nbAp+' apparts');s('c-ap-lr',fmt(lrAp)+'/mois');s('tt-ap',fmt(ttAp));
  s('d-st',fmt(ttSt)+'/an');s('c-st',fmt(stMn)+'/mois');s('tt-st',fmt(ttSt));
  s('d-ev',fmt(ttEv)+'/an');s('c-ev-nb',nbEv+' évén.');s('c-ev-px',fmt(pxEv)+'/évén.');s('tt-ev',fmt(ttEv));
  s('gtr',fmt(GTR));s('kpi-r',fmtK(GTR));
  const K=g('cap'),tx=g('tx-em')/100,du=g('du-em'),txm=tx/12,nm=du*12;
  let men=0;
  if(txm>0&&nm>0)men=K*(txm*Math.pow(1+txm,nm))/(Math.pow(1+txm,nm)-1);else if(nm>0)men=K/nm;
  const ttEm=men*12,txGe=g('tx-ge')/100,ttGe=ttAu*txGe,flMn=g('fl-mn'),ttFl=flMn*12;
  const asMn=g('as-mn'),enMn=g('en-mn'),coMn=g('co-mn'),ttAs=(asMn+enMn+coMn)*12;
  const GTC=ttEm+ttGe+ttFl+ttAs,RES=GTR-GTC;
  s('d-em',fmt(ttEm)+'/an');s('c-cap',fmt(K));s('c-tx',(tx*100).toFixed(1)+' %');s('c-du',du+' ans');
  s('c-men',Math.round(men).toLocaleString('fr-FR')+' €/mois');s('tt-em',fmt(ttEm));
  s('d-ge',fmt(ttGe)+'/an');s('c-ge',Math.round(txGe*100)+' % × '+fmt(ttAu));s('tt-ge',fmt(ttGe));
  s('d-fl',fmt(ttFl)+'/an');s('c-fl',fmt(flMn)+'/mois');s('tt-fl',fmt(ttFl));
  s('d-as',fmt(ttAs)+'/an');s('c-as',fmt(asMn*12));s('c-en',fmt(enMn*12));s('c-co',fmt(coMn*12));s('tt-as',fmt(ttAs));
  s('gtc',fmt(GTC));
  const rEl=document.getElementById('g-res');
  rEl.textContent=(RES>=0?'+ ':'− ')+Math.abs(Math.round(RES)).toLocaleString('fr-FR')+' €';
  rEl.className='res-v '+(RES>=0?'pos':'neg');
  s('f-res',fmt(GTR)+' − '+fmt(GTC)+' = '+fmt(RES));
  s('kpi-res',(RES>=0?'+':'−')+fmtK(Math.abs(RES)));
  document.getElementById('kpi-res').closest('.kpi')?.classList.toggle('is-negative',RES<0);
  const p1=g('ph1'),p2=g('ph2'),p3=g('ph3'),p4=g('ph4'),p5=g('ph5'),TTR=p1+p2+p3+p4+p5;
  s('tt-tr',fmt(TTR));s('kpi-inv',fmtK(TTR));
  const fAp=g('fn-ap'),fEm=g('fn-em'),fSu=g('fn-su'),fFo=g('fn-fo'),TFN=fAp+fEm+fSu+fFo;
  const BDG=TTR||550000,pct=v=>Math.min(100,BDG>0?Math.round(v/BDG*100):0);
  s('tt-fn',fmt(TFN));
  document.getElementById('fb-ap').style.width=pct(fAp)+'%';
  document.getElementById('fb-em').style.width=pct(fEm)+'%';
  document.getElementById('fb-su').style.width=pct(fSu)+'%';
  document.getElementById('fb-fo').style.width=pct(fFo)+'%';
  s('fp-ap',pct(fAp)+' % du budget. Fonds propres.');
  s('fp-em',pct(fEm)+' % du budget. Sur '+du+' ans à '+(tx*100).toFixed(1)+' %, soit '+Math.round(men).toLocaleString('fr-FR')+' €/mois.');
  s('fp-su',pct(fSu)+' % du budget. Région, Département, DRAC, DETR, Leader.');
  s('fp-fo',pct(fFo)+' % du budget. Souscription publique et mécénat.');
  const solde=BDG-TFN,sEl=document.getElementById('fn-solde');
  sEl.textContent=solde>0?'Solde à couvrir : '+fmt(solde):'Budget entièrement couvert';
  sEl.classList.toggle('is-warn',solde>0);sEl.classList.toggle('is-ok',solde<=0);
  document.getElementById('fn-em').value=K;

  /* Conclusion : besoin d'emprunt → capacité annuelle → durée → année de fin */
  const BES=Math.max(0,TTR-fSu-fFo-fAp),ecart=fEm-BES;
  s('cc-tr',fmt(TTR));s('cc-su',fmt(fSu));s('cc-fo',fmt(fFo));s('cc-ap',fmt(fAp));s('cc-besoin',fmt(BES));
  s('cc-besoin-note',Math.abs(ecart)<1?'Égal à l\'emprunt prévu':'Emprunt prévu : '+fmt(fEm)+(ecart>0?', soit '+fmt(ecart)+' de trop':', soit '+fmt(-ecart)+' de moins'));
  const CHX=ttGe+ttFl+ttAs,CAP=GTR-CHX;
  s('cc-rec',fmt(GTR));s('cc-chg',fmt(CHX));s('cc-cap',fmt(CAP)+'/an');
  s('cc-cap-note',CAP>0&&ttEm>0?'Couvre '+(CAP/ttEm).toFixed(1).replace('.',',')+' fois l\'annuité prévue ('+fmt(ttEm)+')':'Annuité prévue : '+fmt(ttEm));
  s('cc-k',fmt(BES));s('cc-a',fmt(CAP)+'/an');s('cc-tx',(tx*100).toFixed(1).replace('.',',')+' %');
  /* Nombre de mensualités n pour rembourser BES avec CAP/12 par mois : n = −ln(1 − BES·i / m) / ln(1+i) */
  const m=CAP/12,im=tx/12,debut=Math.round(g('cc-debut'))||2028;
  let nr=null;
  if(BES<=0)nr=0;
  else if(m>0&&im===0)nr=BES/m;
  else if(m>BES*im)nr=-Math.log(1-BES*im/m)/Math.log(1+im);
  const fEl=document.getElementById('cc-fin');
  if(nr===null){
    s('cc-duree','Impossible');
    s('cc-int-note',CAP<=0?'Les charges dépassent les recettes':'La capacité ne couvre pas les intérêts');
    fEl.textContent='Jamais';fEl.className='res-v neg';
    s('cc-fin-f','Augmentez les recettes, baissez les charges ou le besoin d\'emprunt.');
  }else{
    const mois=Math.ceil(nr),an=Math.floor(mois/12),rm=mois%12;
    const duree=mois===0?'Aucune':(an?an+' an'+(an>1?'s':''):'')+(an&&rm?' et ':'')+(rm?rm+' mois':'');
    const inter=Math.max(0,nr*m-BES);
    s('cc-duree',duree);
    s('cc-int-note',mois===0?'Rien à emprunter':'Dont '+fmt(inter)+' d\'intérêts');
    const fin=mois===0?debut:debut+Math.ceil(mois/12)-1;
    fEl.textContent=fin;fEl.className='res-v pos';
    s('cc-fin-f',mois===0?'Travaux couverts sans emprunt.':debut+' + '+duree+'. Ensuite, le lieu dégage '+fmt(CAP)+' par an.');
  }
}

document.getElementById('cap').addEventListener('input',function(){document.getElementById('fn-em').value=this.value;recalc();});
document.getElementById('fn-em').addEventListener('input',function(){document.getElementById('cap').value=this.value;recalc();});
document.querySelectorAll('input.editable').forEach(inp=>{if(inp.id==='cap'||inp.id==='fn-em')return;inp.addEventListener('input',recalc);});
recalc();

/* ── PERSISTANCE FIREBASE — valeurs éditées du simulateur ──
   Chemin RTDB : dossier/simulateur/<id de l'input> = "<valeur>"
   Charge au démarrage, écrit à la volée (anti-rebond 350 ms), synchro temps réel. */
(function(){
  const PATH='simulateur';
  /* fn-em est un miroir de cap (recalculé) → on ne le persiste pas séparément */
  const fields=()=>[...document.querySelectorAll('input.editable')].filter(i=>i.id&&i.id!=='fn-em');
  let applying=false; const timers={};

  function applyRemote(data){
    if(!data) return;
    applying=true;
    fields().forEach(inp=>{
      const v=data[inp.id];
      if(v!=null && String(inp.value)!==String(v)) inp.value=v;
    });
    applying=false;
    recalc();
  }
  function save(inp){
    if(applying||!window.BertinDB||!inp.id) return;
    clearTimeout(timers[inp.id]);
    timers[inp.id]=setTimeout(()=>window.BertinDB.write(PATH,{[inp.id]:inp.value}),350);
  }
  function init(){
    if(!window.BertinDB) return;
    fields().forEach(inp=>inp.addEventListener('input',()=>save(inp)));
    window.BertinDB.watch(PATH,applyRemote);   // 1er chargement + temps réel
  }
  window.BertinDB?init():window.addEventListener('bertindb-ready',init);
})();
