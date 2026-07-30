// ==========================================
// CONSTANTS
// ==========================================
const MONTHS = ["Janvye","Fevriye","Mas","Avril","Me","Jen","Jiyè","Out","Septanm","Oktòb","Novanm","Desanm"];
const DAYS = ["Dimanch","Lendi","Madi","Mèkredi","Jedi","Vandredi","Samdi"];
const DAYS_SHORT = ["Dim","Len","Mad","Mèk","Jed","Van","Sam"];

const STATUSES = [
  {key:'inbox', label:'Resepsyon'},
  {key:'planned', label:'Planifye'},
  {key:'in-progress', label:'An Kou'},
  {key:'completed', label:'Fini'},
  {key:'archived', label:'Achive'},
];
const PRIORITY = {low:'Ba', medium:'Mwayen', high:'Wo', urgent:'Ijan'};
// Modilè — ajoute yon kle isit si ou bezwen nouvo kategori/estati Goal
const GOAL_CATEGORY = {personal:'Pèsonèl', finance:'Finans', learning:'Aprantisaj', health:'Sante', career:'Karyè', projects:'Pwojè', custom:'Pèsonalize'};
// Pati 41/50: 3 nouvo estati otomatik ajoute (almost-complete, delayed, failed).
// 'paused' ak 'archived' rete la kòm chwa MANYÈL sèlman (otomatik la pa janm chwazi yo).
const GOAL_STATUS = {'not-started':'Poko kòmanse', 'in-progress':'An kou', 'almost-complete':'Prèske Fini', completed:'Konplete', delayed:'An Reta', failed:'Echwe', paused:'Sispann', archived:'Achive'};
// Pati 41/50: koulè pou chak estati (sitou pou distenge 'delayed'/'failed' vizyèlman)
const GOAL_STATUS_STYLE = {
  'not-started': { bg:'var(--surface-2)', fg:'var(--text-dim)' },
  'in-progress': { bg:'var(--blue-soft, rgba(59,130,246,.14))', fg:'var(--blue)' },
  'almost-complete': { bg:'var(--orange-soft)', fg:'var(--orange)' },
  completed: { bg:'var(--green-soft)', fg:'var(--green)' },
  delayed: { bg:'var(--orange-soft)', fg:'var(--orange)' },
  failed: { bg:'var(--red-soft, rgba(229,72,77,.14))', fg:'var(--red, #e5484d)' },
  paused: { bg:'var(--surface-2)', fg:'var(--text-faint)' },
  archived: { bg:'var(--surface-2)', fg:'var(--text-faint)' },
};
const GOAL_LINK_TYPES = [
  { key:'habitIds', label:'Abitid', icon:'flame' },
  { key:'financeIds', label:'Finans', icon:'wallet' },
  { key:'calendarIds', label:'Kalandriye', icon:'calendar' },
  { key:'learningIds', label:'Aprantisaj', icon:'graduation-cap' },
  { key:'projectIds', label:'Pwojè', icon:'folder-kanban' },
];
const PROJECT_STATUSES = [
  {key:'idea', label:'Ide'},
  {key:'todo', label:'Todo'},
  {key:'in-progress', label:'An Kou'},
  {key:'testing', label:'Tès'},
  {key:'completed', label:'Fini'},
];
const EVENT_TYPES = {
  event:{label:'Evènman', color:'var(--blue)'},
  deadline:{label:'Dat Limit', color:'var(--red)'},
  birthday:{label:'Anivèsè', color:'var(--orange)'},
  study:{label:'Sesyon Etid', color:'var(--green)'},
  appointment:{label:'Randevou', color:'var(--blue)'},
};

function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// Fòmate yon nonm ki ka gen desimal san fòse yon "round" agresif — prezève presizyon (max 2 chif apre pwen an, retire zewo initil)
function fmtNum(n, maxDecimals){
  maxDecimals = maxDecimals === undefined ? 2 : maxDecimals;
  n = Number(n) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits:0, maximumFractionDigits: maxDecimals });
}
function uid(){ return 'id'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function priorityColor(p){ return {urgent:'var(--red)',high:'var(--orange)',medium:'var(--blue)',low:'var(--green)'}[p]||'var(--text-faint)'; }
function priorityBg(p){ return {urgent:'var(--red-soft)',high:'var(--orange-soft)',medium:'var(--blue-soft)',low:'var(--green-soft)'}[p]||'var(--surface-2)'; }
function priorityRank(p){ return {low:1,medium:2,high:3,urgent:4}[p]||0; }
function fmtHTG(n){
  n = Number(n) || 0;
  const safe = Math.round(n * 100) / 100; // korije "bri" floating-point san efase presizyon santim nan
  return safe.toLocaleString('en-US', { minimumFractionDigits:0, maximumFractionDigits:2 }) + ' HTG';
}
// ---- Sipò multi-diviz pou Finance (Kat Debi an USD) — pa touche fmtHTG, jis ajoute yon fòma parapò ----
function fmtUSD(n){
  n = Number(n) || 0;
  const safe = Math.round(n * 100) / 100; // menm teknik pwoteksyon floating-point ke fmtHTG, san pèdi santim
  return '$' + safe.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtMoney(n, currency){ return currency === 'USD' ? fmtUSD(n) : fmtHTG(n); }
// ---- Performance: debounce pou evite re-rann sou chak tap klavye lè w ap filtre/chèche ----
function debounce(fn, wait){
  let t;
  return function(...args){ clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

// ==========================================
// STORE (localStorage)
// ==========================================
const LS = { tasks:'oslife.tasks', templates:'oslife.templates', events:'oslife.events',
  habits:'oslife.habits', gami:'oslife.gami', tx:'oslife.tx', wallets:'oslife.wallets', budgets:'oslife.budgets',
  plans:'oslife.plans', projects:'oslife.projects', notes:'oslife.notes', noteFolders:'oslife.noteFolders',
  journal:'oslife.journal', healthLogs:'oslife.healthLogs', healthGoals:'oslife.healthGoals',
  goals:'oslife.goals', learning:'oslife.learning', categories:'oslife.categories', coachChat:'oslife.coachChat',
  coachBackendUrl:'oslife.coachBackendUrl', dataUsageLogs:'oslife.dataUsageLogs', dataUsageApps:'oslife.dataUsageApps',
  scoreHistory:'oslife.scoreHistory', activity:'oslife.activity', missions:'oslife.missions',
  missionsHistory:'oslife.missionsHistory', achievements:'oslife.achievements',
  notifications:'oslife.notifications', personalization:'oslife.personalization', security:'oslife.security',
  autoBackup:'oslife.autoBackup', statsPrefs:'oslife.statsPrefs', waterMigratedV2:'oslife.waterMigratedV2',
  pendingGoalFinancialActions:'oslife.pendingGoalFinancialActions', customTxCats:'oslife.customTxCats' };
// Kle ki kenbe done sansib — yo dwe toujou chifre anvan yo antre nan LocalStorage/IndexedDB.
const ENCRYPTED_KEYS = new Set([LS.wallets, LS.tx, LS.budgets, LS.plans, LS.notes, LS.noteFolders, LS.journal]);
// Nòt: LS.security pa chifre paske li dwe li SENKWÒN nan demaraj (anvan lock overlay a),
// e li deja kenbe PIN/modpas la kòm hash sale — jamè an tèks klè.
function loadLS(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e){ return fallback; } }
// ==========================================
// ERROR HANDLING — deteksyon, mesaj senp pou itilizatè a, ak opsyon pou rekipere.
// Pa janm montre erè teknik (stack trace, "Database Error", elatriye) dirèkteman bay itilizatè a.
// ==========================================
function friendlyStorageError(retryFn){
  if (typeof showToast === 'function') showToast('Gen yon pwoblèm pandan sove done ou. Nou ap eseye retabli li.');
  if (typeof retryFn === 'function'){
    setTimeout(() => {
      retryFn().then(ok => {
        if (ok === false && typeof showToast === 'function'){
          showToast('Done a poko sove. Ekspòte yon backup nan Paramèt pou pwoteje travay ou.');
        }
      }).catch(()=>{});
    }, 800);
  }
}
function saveLS(key, val){
  try{
    localStorage.setItem(key, JSON.stringify(val));
    idbSet(key, val).catch(()=>{});
    return true;
  }catch(e){
    console.error('Erè sovgad (saveLS):', key, e);
    friendlyStorageError(async () => { try{ localStorage.setItem(key, JSON.stringify(val)); return true; }catch(e2){ return false; } });
    return false;
  }
}

// ==========================================
// STORAGE — Local-First Architecture
// Primary: IndexedDB (gwo kapasite, dirab)
// Secondary: LocalStorage (aksè rapid senkwòn pou UI a)
// ==========================================
const IDB_NAME = 'oslife-db', IDB_STORE = 'kv';
let _idbOpenPromise = null;
function idbOpen(){
  if (_idbOpenPromise) return _idbOpenPromise;
  _idbOpenPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)){ reject(new Error('IndexedDB pa disponib')); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _idbOpenPromise;
}
async function idbSet(key, val){
  try{
    const db = await idbOpen();
    return await new Promise(resolve => {
      const t = db.transaction(IDB_STORE, 'readwrite');
      t.objectStore(IDB_STORE).put(val, key);
      t.oncomplete = () => resolve(true);
      t.onerror = () => resolve(false);
    });
  }catch(e){ return false; }
}
async function idbGet(key){
  try{
    const db = await idbOpen();
    return await new Promise(resolve => {
      const t = db.transaction(IDB_STORE, 'readonly');
      const req = t.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
  }catch(e){ return undefined; }
}
// Si LocalStorage vid/efase men IndexedDB gen done (kota, mòd privé, efasman aksidantèl) — restore.
async function restoreFromIndexedDBIfMissing(){
  for (const key of Object.values(LS)){
    try{
      if (localStorage.getItem(key) == null){
        const backup = await idbGet(key);
        if (backup !== undefined){
          localStorage.setItem(key, typeof backup === 'string' ? backup : JSON.stringify(backup));
        }
      }
    }catch(e){ /* ignore per-key restore errors */ }
  }
}

// ==========================================
// DATA ENCRYPTION — AES-GCM (Web Crypto API)
// Aplike sou: Finance, Journal, Notes, Private settings (Profile lè li ajoute)
// Kle a jenere yon sèl fwa epi rete sou aparèy la — okenn done sansib pa janm ekri an tèks klè.
// ==========================================
const ENC_PREFIX = 'OSENC1:';
let _cryptoKeyCache = null;
async function getCryptoKey(){
  if (_cryptoKeyCache) return _cryptoKeyCache;
  let raw = localStorage.getItem('oslife._dek');
  let keyBytes;
  if (raw){
    keyBytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  } else {
    keyBytes = crypto.getRandomValues(new Uint8Array(32));
    localStorage.setItem('oslife._dek', btoa(String.fromCharCode(...keyBytes)));
  }
  _cryptoKeyCache = await crypto.subtle.importKey('raw', keyBytes, { name:'AES-GCM' }, false, ['encrypt','decrypt']);
  return _cryptoKeyCache;
}
async function encryptJSON(val){
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(val));
  const cipher = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, data);
  const ivB64 = btoa(String.fromCharCode(...iv));
  const cB64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
  return ENC_PREFIX + ivB64 + ':' + cB64;
}
async function decryptJSON(raw, fallback){
  if (raw == null) return fallback;
  if (typeof raw === 'string' && raw.startsWith(ENC_PREFIX)){
    try{
      const parts = raw.slice(ENC_PREFIX.length).split(':');
      const iv = Uint8Array.from(atob(parts[0]), c => c.charCodeAt(0));
      const cipher = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
      const key = await getCryptoKey();
      const plainBuf = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, cipher);
      return JSON.parse(new TextDecoder().decode(plainBuf));
    }catch(e){
      console.error('Erè dekripte done sansib:', e);
      return fallback;
    }
  }
  // Done ansyen (anvan chifreman) — li nòmalman, y ap chifre otomatikman nan pwochen sovgad la.
  try{ return JSON.parse(raw); }catch(e){ return fallback; }
}
let _pendingSecureSaves = 0;
async function secureSave(lsKey, val){
  _pendingSecureSaves++;
  try{
    const enc = await encryptJSON(val);
    localStorage.setItem(lsKey, enc);
    await idbSet(lsKey, enc);
    return true;
  }catch(e){
    console.error('Erè sovgad sekirize:', lsKey, e);
    friendlyStorageError(async () => {
      try{ const enc2 = await encryptJSON(val); localStorage.setItem(lsKey, enc2); await idbSet(lsKey, enc2); return true; }
      catch(e2){ return false; }
    });
    return false;
  } finally { _pendingSecureSaves--; }
}
window.addEventListener('beforeunload', (e) => {
  if (_pendingSecureSaves > 0){ e.preventDefault(); e.returnValue = ''; }
});

function seedTasks(){
  const now = new Date();
  const d1 = new Date(now); d1.setHours(now.getHours()+5);
  const d2 = new Date(now); d2.setDate(now.getDate()+2);
  return [
    { id:uid(), title:'Fini pwopozisyon BWdepot la', description:'', priority:'urgent', category:'BWdepot', tags:['pwojè'],
      deadline:d1.toISOString().slice(0,16), reminder:{enabled:true}, subtasks:[{id:uid(),text:'Fè maket la',done:true},{id:uid(),text:'Voye bay kliyan an',done:false}],
      attachments:[], notes:'', status:'in-progress', recurring:{enabled:false,freq:'weekly'}, createdAt:now.toISOString(), completedAt:null },
    { id:uid(), title:'Reponn kliyan MW Store', description:'', priority:'high', category:'MW Store', tags:[],
      deadline:d2.toISOString().slice(0,16), reminder:{enabled:false}, subtasks:[], attachments:[], notes:'', status:'planned',
      recurring:{enabled:false,freq:'weekly'}, createdAt:now.toISOString(), completedAt:null },
    { id:uid(), title:'Peye fakti entènèt', description:'', priority:'medium', category:'Finans', tags:[],
      deadline:'', reminder:{enabled:false}, subtasks:[], attachments:[], notes:'', status:'completed',
      recurring:{enabled:false,freq:'weekly'}, createdAt:now.toISOString(), completedAt:now.toISOString() },
  ];
}
function seedEvents(){
  const today = new Date();
  const d = off => { const x=new Date(today); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); };
  return [
    { id:uid(), title:'Leson JavaScript — Fonksyon Flèch', description:'', date:d(0), time:'14:00', location:'', category:'study', reminder:{enabled:true}, recurrence:'none' },
    { id:uid(), title:'Rankont ak kliyan BWdepot', description:'', date:d(3), time:'10:30', location:'Pétion-Ville', category:'appointment', reminder:{enabled:true}, recurrence:'none' },
  ];
}
function seedHabits(){
  const today = new Date();
  const iso = off => { const x=new Date(today); x.setDate(x.getDate()-off); return x.toISOString().slice(0,10); };
  return [
    { id:uid(), name:'Li 20 minit', description:'Li yon liv oswa atik chak jou', frequency:'daily', reminder:true, category:'Aprantisaj', goal:'30 jou san rate',
      completions:[iso(0),iso(1),iso(3),iso(4),iso(5),iso(6)], createdAt:today.toISOString() },
    { id:uid(), name:'Egzèsis matinal', description:'15 minit egzèsis fizik', frequency:'daily', reminder:true, category:'Sante', goal:'Konsistans chak jou',
      completions:[iso(0),iso(2),iso(3)], createdAt:today.toISOString() },
  ];
}
function seedWallets(){
  return [
    { id:uid(), name:'Cash', type:'cash', balance:3200 },
    { id:uid(), name:'MonCash', type:'moncash', balance:5250 },
    { id:uid(), name:'Sogebank', type:'bank', balance:4000 },
  ];
}
function seedTx(w){
  // Pa gen tranzaksyon demo pa default ankò — itilizatè a kòmanse ak yon lis vid.
  return [];
}
function seedPlans(w){
  const today = new Date();
  const iso = off => { const x=new Date(today); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); };
  const mon = w.find(x=>x.type==='moncash');
  return [
    { id:uid(), operator:'Digicel', type:'unlimited', name:'Illimix 30', price:1900, duration:30, isUnlimited:true,
      startDate:iso(-28), expireDate:iso(2), walletId:mon?.id||'', notes:'', status:'active', createdAt:today.toISOString() },
    { id:uid(), operator:'Natcom', type:'internet', name:'Data Pass 5G', price:500, duration:5, isUnlimited:false,
      startDate:iso(-20), expireDate:iso(-15), walletId:mon?.id||'', notes:'', status:'expired', createdAt:today.toISOString() },
    { id:uid(), operator:'Natcom', type:'internet', name:'Data Pass 5G', price:500, duration:5, isUnlimited:false,
      startDate:iso(-13), expireDate:iso(-8), walletId:mon?.id||'', notes:'', status:'expired', createdAt:today.toISOString() },
    { id:uid(), operator:'Natcom', type:'internet', name:'Data Pass 5G', price:500, duration:5, isUnlimited:false,
      startDate:iso(-6), expireDate:iso(-1), walletId:mon?.id||'', notes:'', status:'expired', createdAt:today.toISOString() },
  ];
}

function seedProjects(){
  const today = new Date();
  const iso = off => { const x=new Date(today); x.setDate(x.getDate()+off); return x.toISOString().slice(0,10); };
  return [
    { id:uid(), name:'Refonte sit OSLIFE', description:'Amelyore koub UX pou modil finans lan', status:'in-progress',
      deadline: iso(12), tasks:[{id:uid(),text:'Fè wireframe',done:true},{id:uid(),text:'Entegre API',done:false},{id:uid(),text:'Tès QA',done:false}],
      files:[], notes:'', createdAt: today.toISOString() },
    { id:uid(), name:'Lansman kanpay maketing', description:'', status:'idea',
      deadline: iso(30), tasks:[{id:uid(),text:'Defini objektif',done:false}], files:[], notes:'', createdAt: today.toISOString() },
    { id:uid(), name:'Migrasyon done kliyan', description:'Deplase done nan nouvo baz done a', status:'testing',
      deadline: iso(3), tasks:[{id:uid(),text:'Ekspòte done',done:true},{id:uid(),text:'Enpòte done',done:true},{id:uid(),text:'Valide entegrite',done:false}],
      files:[], notes:'', createdAt: today.toISOString() },
  ];
}
function seedNoteFolders(){
  return [ {id:'f-general', name:'Jeneral'}, {id:'f-travay', name:'Travay'}, {id:'f-ide', name:'Ide'} ];
}
function seedNotes(){
  const today = new Date();
  return [
    { id:uid(), title:'Byenveni nan Nòt', folderId:'f-general', tags:['gid'],
      bodyHtml:'<p>Sa a se yon nòt egzanp. Ou ka itilize <b>tèks gra</b>, <i>italik</i>, lis, ak plis ankò.</p>', pinned:true, archived:false,
      createdAt: today.toISOString(), updatedAt: today.toISOString() },
    { id:uid(), title:'Ide pou pwojè', folderId:'f-ide', tags:['ide','pwojè'],
      bodyHtml:'<p>Lis kèk ide pou devlope pi devan...</p>', pinned:false, archived:false,
      createdAt: today.toISOString(), updatedAt: today.toISOString() },
  ];
}

function seedJournal(){
  const today = new Date();
  const iso = off => { const x=new Date(today); x.setDate(x.getDate()-off); return x.toISOString().slice(0,10); };
  return [
    { id:uid(), date: iso(2), mood:4, text:'Jodi a te yon bon jounen. Mwen fè byen nan travay ak BWdepot la e mwen te gen tan pou li yon ti kras.',
      tags:['travay','refleksyon'], photos:[], createdAt: today.toISOString(), updatedAt: today.toISOString() },
    { id:uid(), date: iso(1), mood:3, text:'Jounen nòmal, anpil reyinyon men mwen rive fini sa m te planifye a.',
      tags:['travay'], photos:[], createdAt: today.toISOString(), updatedAt: today.toISOString() },
    { id:uid(), date: iso(0), mood:5, text:'Mwen santi m trè motive jodi a! Egzèsis maten an te ede anpil.',
      tags:['sante','motivasyon'], photos:[], createdAt: today.toISOString(), updatedAt: today.toISOString() },
  ];
}
function seedHealthLogs(){
  const today = new Date();
  const iso = off => { const x=new Date(today); x.setDate(x.getDate()-off); return x.toISOString().slice(0,10); };
  return [
    { date: iso(3), water:1250, sleep:6.5, exercise:20, mood:3 },
    { date: iso(2), water:1750, sleep:7, exercise:0, mood:3 },
    { date: iso(1), water:2000, sleep:7.5, exercise:30, mood:4 },
  ];
}

let tasks = loadLS(LS.tasks, seedTasks());
let templates = loadLS(LS.templates, []);
let events = loadLS(LS.events, seedEvents());
let habits = loadLS(LS.habits, seedHabits());
let gami = loadLS(LS.gami, { xp:0, badges:[] });
let wallets = loadLS(LS.wallets, seedWallets());
let tx = loadLS(LS.tx, seedTx(wallets));
let budgets = loadLS(LS.budgets, { period:'monthly', limits:{ 'Manje':6000, 'Transpò':3000, 'Entènèt':2500, 'Abònman':1500 } });
// Dlo/Bwason/Custom pa dwe janm gen limit bidjè — yo se kategori espesyal ki pa itilize sistèm bidjè a
if (budgets.limits){ delete budgets.limits['Dlo']; delete budgets.limits['Bwason']; delete budgets.limits['Custom']; }
let plans = loadLS(LS.plans, seedPlans(wallets));
let dataUsageLogs = loadLS(LS.dataUsageLogs, []);
let dataUsageApps = loadLS(LS.dataUsageApps, ['Instagram','Facebook','WhatsApp','TikTok','YouTube','Messenger']);
let projects = loadLS(LS.projects, seedProjects());
let noteFolders = loadLS(LS.noteFolders, seedNoteFolders());
let notes = loadLS(LS.notes, seedNotes());
let activeFolderFilter = '';
let journal = loadLS(LS.journal, seedJournal());
let healthLogs = loadLS(LS.healthLogs, seedHealthLogs());
let healthGoals = loadLS(LS.healthGoals, { water:2000, sleep:8, exercise:30 });
// ---- Migrasyon inik: ansyen sistèm "Dlo an vè" (0-8) → nouvo sistèm kantite egzat an ml ----
// Ansyen done te kenbe valè tou piti (0-8 vè). Nouvo sistèm nan kenbe ml dirèkteman (pi gwo valè, pw. 2000).
// Yon sèl fwa, konvèti ansyen valè yo (×250ml pa vè) pou istorik la rete kòrèk.
if (!loadLS(LS.waterMigratedV2, false)){
  if ((healthGoals.water||0) > 0 && healthGoals.water <= 20) healthGoals.water = Math.round(healthGoals.water * 250);
  healthLogs.forEach(l => { if ((l.water||0) > 0 && l.water <= 20) l.water = Math.round(l.water * 250); });
  saveLS(LS.healthGoals, healthGoals);
  saveLS(LS.healthLogs, healthLogs);
  saveLS(LS.waterMigratedV2, true);
}
function normalizeGoals(arr){
  return (arr||[]).map(g => {
    if (!g.category) g.category = 'personal';
    if (!g.status){
      const pct = goalMilestoneProgress ? goalMilestoneProgress(g) : (g.progress||0);
      g.status = pct >= 100 ? 'completed' : (pct > 0 ? 'in-progress' : 'not-started');
    }
    if (g.estimatedValue === undefined) g.estimatedValue = null;
    if (g.isFinancial === undefined) g.isFinancial = false;
    if (g.currentSavings === undefined) g.currentSavings = null;
    if (g.walletId === undefined) g.walletId = null;
    if (g.notes === undefined) g.notes = '';
    if (!g.links) g.links = { habitIds:[], financeIds:[], calendarIds:[], learningIds:[], projectIds:[] };
    else GOAL_LINK_TYPES.forEach(t => { if (!Array.isArray(g.links[t.key])) g.links[t.key] = []; });
    if (!Array.isArray(g.linkedLearningCourses)) g.linkedLearningCourses = [];
    // Pati 41/50: GOAL — estati otomatik. Default TRUE pou tout Objektif,
    // SOF si moun nan te deja mete l manyèlman sou 'paused'/'archived' —
    // nan ka sa a nou respekte chwa manyèl la e nou pa aktive otomatik la.
    if (g.autoStatus === undefined) g.autoStatus = !(g.status === 'paused' || g.status === 'archived');
    // Pati 39/50: GOAL <-> GOAL — depandans. g.dependsOn se yon lis ID lòt
    // Objektif ki dwe konplete anvan/ansanm ak sa a (opsyonèl, pa obligatwa).
    if (!Array.isArray(g.dependsOn)) g.dependsOn = [];
    if (!g.dependencyCompletedSnapshot || typeof g.dependencyCompletedSnapshot !== 'object') g.dependencyCompletedSnapshot = {};
    return g;
  });
}
let goals = normalizeGoals(loadLS(LS.goals, seedGoals()));
// Pati 39/50: netwaye referans depandans ki pwen sou Objektif ki pa egziste ankò
// (pw. si yon Objektif te efase pandan g.dependsOn te gen ID li).
(function cleanDanglingGoalDependencies(){
  const ids = new Set(goals.map(g => g.id));
  goals.forEach(g => {
    g.dependsOn = g.dependsOn.filter(id => ids.has(id) && id !== g.id);
  });
})();
let pendingGoalFinancialActions = loadLS(LS.pendingGoalFinancialActions, []);
function persistPendingGoalFinancialActions(){ saveLS(LS.pendingGoalFinancialActions, pendingGoalFinancialActions); }
let learning = loadLS(LS.learning, { xp:0, hearts:5, streak:0, lastStudyDate:null, completed:[], badges:[], startedCourses:[] });
learning.lessonLog = learning.lessonLog || [];
learning.startedCourses = learning.startedCourses || learning.startedRoadmaps || [];
learning.xpLog = learning.xpLog || [];
let missionsState = loadLS(LS.missions, { date:'', claimed:[], goalsReviewed:false });
let missionsHistory = loadLS(LS.missionsHistory, []);
let unlockedAchievements = loadLS(LS.achievements, []);

// ==========================================
// GOAL <-> HABIT — sistèm koneksyon debaz (Pati 1/50)
// Pa modifye modil Goal ak Habit yo — jis konekte yo.
// - Goal.linkedHabitIds : lis ID Habit ki lye ak objektif la
// - Habit.goalId        : ID Goal ke abitid la fè pati (oswa null)
// Migrasyon san danje: ajoute chan yo sèlman si yo pa egziste deja,
// pou done ki te la anvan rete konpatib.
// ==========================================
goals.forEach(g => { if (!Array.isArray(g.linkedHabitIds)) g.linkedHabitIds = []; });
habits.forEach(h => { if (h.goalId === undefined) h.goalId = null; });

function linkHabitToGoal(goalId, habitId){
  const g = goals.find(x => x.id === goalId);
  const h = habits.find(x => x.id === habitId);
  if (!g || !h) return false;
  if (!Array.isArray(g.linkedHabitIds)) g.linkedHabitIds = [];
  if (h.goalId && h.goalId !== goalId) unlinkHabitFromGoal(h.goalId, habitId);
  if (!g.linkedHabitIds.includes(habitId)) g.linkedHabitIds.push(habitId);
  h.goalId = goalId;
  persistGoals();
  persistHabits();
  return true;
}

// ==========================================
// GOAL <-> FINANCE — koneksyon debaz (Pati 16/50)
// Pa touche Wallet/Finance modil la ankò (sa vin pita) — se sèlman de nouvo
// chan SOU Goal la: `isFinancial` (mak si se yon Objektif Finansye) ak
// `currentSavings` (Sere Deja). "Kou" reyitilize chan `estimatedValue` ki
// egziste deja (pa gen dupliyata) e "Rete" pa janm sove — li toujou KALKILE
// an dirèk: estimatedValue - currentSavings.
// ==========================================
function computeGoalFinancialRemaining(g){
  if (!g) return 0;
  const cost = Number(g.estimatedValue) || 0;
  const saved = Number(g.currentSavings) || 0;
  return Math.round((cost - saved) * 100) / 100;
}

// ==========================================
// GOAL FINANSYE — pousantaj konplete (Pati 17/50)
// Sèvi ak menm de chan Pati 16 yo (estimatedValue, currentSavings) — pa gen
// nouvo chan. Pousantaj la limite ant 0 ak 100 (menm si moun nan sere plis
// pase kou a).
// ==========================================
function computeGoalFinancialProgressPct(g){
  if (!g) return 0;
  const cost = Number(g.estimatedValue) || 0;
  const saved = Number(g.currentSavings) || 0;
  if (cost <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((saved / cost) * 100)));
}

function updateGoalFinancialFieldsVisibility(){
  const isFinancial = document.getElementById('goalIsFinancial').checked;
  document.getElementById('goalFinancialFields').hidden = !isFinancial;
  document.getElementById('goalFinancialRemainingRow').hidden = !isFinancial;
  document.getElementById('goalSourceWalletRow').hidden = !isFinancial;
}

// ==========================================
// GOAL <-> WALLET — preparasyon koneksyon (Pati 18/50)
// Sèlman yon REFERANS (goal.walletId) sou yon Wallet ki egziste deja — pa
// touche `wallets` modil la, pa kreye okenn tranzaksyon, pa deplase lajan.
// Lis la senpleman li done Wallet ki egziste deja (Kach/Bank/MonCash/elatriye).
// ==========================================
function renderGoalSourceWalletOptions(selectedId){
  const sel = document.getElementById('goalSourceWallet');
  const current = selectedId || '';
  sel.innerHTML = '<option value="">— Pa chwazi —</option>' +
    wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)} (${WALLET_TYPE_LABELS[w.type] || 'Lòt'})</option>`).join('');
  sel.value = current;
}

function renderGoalFinancialRemaining(){
  const costInput = document.getElementById('goalEstimatedValue');
  const savedInput = document.getElementById('goalCurrentSavings');
  document.getElementById('goalCostDisplay').value = costInput.value || '';
  const draft = {
    estimatedValue: parseFloat(costInput.value) || 0,
    currentSavings: parseFloat(savedInput.value) || 0
  };
  const remaining = computeGoalFinancialRemaining(draft);
  const pct = computeGoalFinancialProgressPct(draft);
  document.getElementById('goalFinancialRemaining').textContent = remaining;
  document.getElementById('goalFinancialSaved').textContent = draft.currentSavings;
  document.getElementById('goalFinancialProgressPct').textContent = pct + '%';
  document.getElementById('goalFinancialProgressBar').style.width = pct + '%';
}

document.getElementById('goalIsFinancial').addEventListener('change', updateGoalFinancialFieldsVisibility);
['goalEstimatedValue','goalCurrentSavings'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderGoalFinancialRemaining);
});

// ==========================================
// GOAL <-> FINANCE — estati sinkwonizasyon (Pati 28/50)
// Yon seksyon LIT SÈLMAN nan detay Objektif la — OKENN nouvo done pa
// estoke; chak chan KALKILE an dirèk apati done ki egziste deja:
// g.walletId / g.habitContributions (Pati 12/18), `tx` ki gen goalId
// (Pati 26), ak g.currentSavings (deja senkwonize otomatik pa Pati 21).
// Kòm se yon lekti pi, li otomatikman "ajou" chak fwa li rele — pa gen
// risk doublon paske nou pa kreye/modifye okenn dosye isit la.
// ==========================================
function computeGoalFinanceSyncStatus(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !g.isFinancial) return null;
  const linkedHabits = getHabitsForGoal(goalId).filter(h =>
    g.habitContributions && g.habitContributions[h.id] && Number(g.habitContributions[h.id].amount) > 0
  );
  const habitNames = linkedHabits.map(h => h.name).filter(Boolean);
  const walletIds = new Set();
  linkedHabits.forEach(h => {
    const cfg = g.habitContributions[h.id];
    if (cfg && cfg.walletId) walletIds.add(cfg.walletId);
  });
  if (g.walletId) walletIds.add(g.walletId);
  const walletNames = Array.from(walletIds).map(id => {
    const w = wallets.find(x => x.id === id);
    return w ? w.name : null;
  }).filter(Boolean);
  const goalTx = tx.filter(t => t.goalId === goalId)
    .slice()
    .sort((a,b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')));
  const lastTx = goalTx.length ? goalTx[goalTx.length - 1] : null;
  return {
    walletNames,
    habitNames,
    totalSaved: Number(g.currentSavings) || 0,
    lastTransactionDate: lastTx ? lastTx.date : null,
    remaining: computeGoalFinancialRemaining(g),
  };
}

function renderGoalFinanceSyncStatus(){
  const box = document.getElementById('goalFinanceSyncStatus');
  if (!box) return;
  if (!editingGoalId){ box.hidden = true; return; }
  const status = computeGoalFinanceSyncStatus(editingGoalId);
  if (!status){ box.hidden = true; return; }
  box.hidden = false;
  document.getElementById('goalSyncWallet').textContent = status.walletNames.length ? status.walletNames.join(', ') : '— Pa gen —';
  document.getElementById('goalSyncHabit').textContent = status.habitNames.length ? status.habitNames.join(', ') : '— Pa gen —';
  document.getElementById('goalSyncSaved').textContent = fmtNum(status.totalSaved);
  document.getElementById('goalSyncLastTx').textContent = status.lastTransactionDate || '— Poko gen —';
  document.getElementById('goalSyncRemaining').textContent = fmtNum(status.remaining);
}

// ==========================================
// GOAL <-> CALENDAR — koneksyon otomatik (Pati 29/50)
// Lè yon Objektif gen yon Dat Limit (g.deadline), nou kreye/mete ajou 2
// Evènman nan `events` (menm modil Kalandriye orijinal la, `persistEvents()`
// deja egziste — pa gen nouvo achitekti): 1) Dat Limit Objektif la (ak yon
// rezime Etap/Milestones nan deskripsyon an paske Etap yo pa gen pwòp dat
// pa yo nan modèl done a), 2) yon Rapèl Pwogrè kèk jou anvan Dat Limit la.
// Chak Evènman make ak `goalId` + `goalEventType` pou nou ka idantifye l
// san ekivok pita — sa garanti nou SÈLMAN touche Evènman ki soti nan
// Objektif sa a, nou pa janm modifye okenn lòt Evènman itilizatè a te
// kreye manyèlman. Si Dat Limit la retire, Evènman korespondan an retire
// tou (pa rete "zonbi"). Rele fonksyon sa a chak fwa yon Objektif sove
// (kreye/modifye) — sa kouvri tou chanjman nan Etap yo, paske yo sove nan
// menm moman an.
// ==========================================
function offsetDateBefore(dateStr, days){
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0,10);
}

function findGoalCalendarEvent(goalId, eventType){
  return events.find(e => e.goalId === goalId && e.goalEventType === eventType);
}

const GOAL_CALENDAR_REMINDER_DAYS_BEFORE = 3;

function syncGoalCalendarEvents(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return;
  const hasDeadline = !!g.deadline;
  const doneCount = (g.milestones||[]).filter(m => m.done).length;
  const totalCount = (g.milestones||[]).length;
  const milestonesLine = totalCount ? `Etap: ${doneCount}/${totalCount} konplete.` : '';
  let changed = false;

  // ---- Dat Limit (deadline) ----
  const deadlineEvt = findGoalCalendarEvent(goalId, 'deadline');
  if (hasDeadline){
    if (deadlineEvt){
      deadlineEvt.title = `🎯 Dat Limit Objektif: ${g.title}`;
      deadlineEvt.date = g.deadline;
      deadlineEvt.description = milestonesLine;
    } else {
      events.push({
        id: uid(), title: `🎯 Dat Limit Objektif: ${g.title}`, description: milestonesLine,
        date: g.deadline, time: '09:00', location: '', category: 'deadline',
        reminder: { enabled: true }, recurrence: 'none', goalId, goalEventType: 'deadline',
      });
    }
    changed = true;
  } else if (deadlineEvt){
    events = events.filter(e => e !== deadlineEvt);
    changed = true;
  }

  // ---- Rapèl Pwogrè (reminder), sèlman si gen ase tan anvan Dat Limit la ----
  const reminderEvt = findGoalCalendarEvent(goalId, 'reminder');
  const reminderDate = hasDeadline ? offsetDateBefore(g.deadline, GOAL_CALENDAR_REMINDER_DAYS_BEFORE) : null;
  const showReminder = !!(hasDeadline && reminderDate && reminderDate >= todayISO());
  if (showReminder){
    if (reminderEvt){
      reminderEvt.title = `⏰ Rapèl Pwogrè: ${g.title}`;
      reminderEvt.date = reminderDate;
      reminderEvt.description = milestonesLine;
    } else {
      events.push({
        id: uid(), title: `⏰ Rapèl Pwogrè: ${g.title}`, description: milestonesLine,
        date: reminderDate, time: '09:00', location: '', category: 'event',
        reminder: { enabled: true }, recurrence: 'none', goalId, goalEventType: 'reminder',
      });
    }
    changed = true;
  } else if (reminderEvt){
    events = events.filter(e => e !== reminderEvt);
    changed = true;
  }

  if (changed) persistEvents();
}

function removeGoalCalendarEvents(goalId){
  const before = events.length;
  events = events.filter(e => e.goalId !== goalId); // sèlman Evènman ki soti nan Objektif sa a
  if (events.length !== before) persistEvents();
}

// ==========================================
// GOAL <-> LEARNING — koneksyon ak modil Aprantisaj (Pati 30/50)
// Yon Objektif ka lye ak youn oswa plizyè Kou nan LEARNING_COURSES
// (g.linkedLearningCourses — nouvo chan, jis yon lis courseKey, pa gen
// dupliyata done Kou/Leson). Pwogrè a JANM antre alamen pou yon Objektif
// konsa — li KALKILE dirèkteman apati `learning.completed` (sèl sous verite
// modil Aprantisaj la — Pati sa a pa touche fason yon leson konplete, sa
// rete responsablite modil Learning la, ki viv nan learning.html/course.html
// e senkwonize nan `syncLearningState()` ki egziste deja). Nou sèlman LI
// `courseProgress()` (deja egziste, Pati Learning orijinal la) epi kopye
// rezilta a sou g.progress lè gen Kou lye — sa anpeche nenpòt "validasyon
// manyèl fo" pou Objektif Aprantisaj yo.
// ==========================================
function computeGoalLearningProgress(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !Array.isArray(g.linkedLearningCourses) || !g.linkedLearningCourses.length) return null;
  const valid = g.linkedLearningCourses.filter(k => LEARNING_COURSES[k]);
  if (!valid.length) return null;
  const total = valid.reduce((s,k) => s + courseProgress(k).pct, 0);
  return Math.round(total / valid.length);
}

// Aplike pwogrè kalkile a sou g.progress — sèlman lè gen Kou lye (menm lojik
// pwoteksyon ak syncGoalSavingsFromHabits Pati 21: pa kraze yon valè manyèl
// pou yon Objektif ki pa itilize Aprantisaj ditou).
function syncGoalLearningProgress(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return false;
  const pct = computeGoalLearningProgress(goalId);
  if (pct === null) return false;
  if (g.progress !== pct){
    g.progress = pct;
    if (pct >= 100 && g.status !== 'archived' && g.status !== 'paused') g.status = 'completed';
    persistGoals();
  }
  return true;
}

// Rele apati syncLearningState() (Pati Learning orijinal la, ki deja rele
// otomatikman lè paj la chaje/reprann fokis) — sa fè Pwogrè Objektif la
// "konfime pa Learning" san nou pa janm bezwen kreye yon nouvo hook nan
// modil Aprantisaj la.
function syncAllGoalsLearningProgress(){
  goals.forEach(g => {
    if (Array.isArray(g.linkedLearningCourses) && g.linkedLearningCourses.length){
      syncGoalLearningProgress(g.id);
    }
  });
}

let goalLearningDraft = [];

function renderGoalLearningLinksList(){
  const wrap = document.getElementById('goalLearningLinksList');
  if (!wrap) return;
  const keys = typeof LEARNING_COURSE_KEYS !== 'undefined' ? LEARNING_COURSE_KEYS : Object.keys(LEARNING_COURSES);
  wrap.innerHTML = keys.map(key => {
    const course = LEARNING_COURSES[key];
    const checked = goalLearningDraft.includes(key);
    const pct = courseProgress(key).pct;
    return `<label class="milestone-row" style="cursor:pointer;">
      <input type="checkbox" class="goalLearningCourseChk" data-key="${key}" ${checked?'checked':''}>
      <span><b>${escapeHtml(course.title)}</b> <span style="color:var(--text-faint);font-size:11px;">(${pct}% konplete)</span></span>
    </label>`;
  }).join('');
  wrap.querySelectorAll('.goalLearningCourseChk').forEach(cb => cb.addEventListener('change', e => {
    const key = e.target.dataset.key;
    if (e.target.checked){ if (!goalLearningDraft.includes(key)) goalLearningDraft.push(key); }
    else { goalLearningDraft = goalLearningDraft.filter(k => k !== key); }
    renderGoalLearningLinksList();
    renderGoalLearningProgressPreview();
  }));
  const createBtn = document.getElementById('goalCreateLearningHabitsBtn');
  if (createBtn) createBtn.hidden = !goalLearningDraft.length;
  renderGoalLearningProgressPreview();
  if (typeof renderGoalProgressPreview === 'function') renderGoalProgressPreview();
  if (typeof renderGoalAutoStatusPreview === 'function') renderGoalAutoStatusPreview();
  if (window.lucide) lucide.createIcons();
}

function renderGoalLearningProgressPreview(){
  const row = document.getElementById('goalLearningProgressRow');
  if (!row) return;
  if (!goalLearningDraft.length){ row.hidden = true; return; }
  const total = goalLearningDraft.reduce((s,k) => s + (LEARNING_COURSES[k] ? courseProgress(k).pct : 0), 0);
  const pct = Math.round(total / goalLearningDraft.length);
  row.hidden = false;
  document.getElementById('goalLearningProgressBar').style.width = pct + '%';
  document.getElementById('goalLearningProgressPct').textContent = pct + '%';
}

// ==========================================
// GOAL <-> LEARNING — kontribisyon konfime (Pati 31/50)
// Lekti sèl. Sous verite se learning.completed/courseProgress() (Pati 8/50),
// pa gen okenn nouvo chan sou Learning, pa gen mòd manyèl pou modifye pwogrè.
// "Tan Etid Estime" itilize menm konvansyon ki deja egziste nan kòd la
// (lessonLog.length * konstant, wè lign ~2926 ak ~5247) — se yon estimasyon
// derive dirèkteman soti nan kantite leson KONFIME konplete, pa yon envansyon.
// ==========================================
function renderGoalLearningContribution(){
  const wrap = document.getElementById('goalLearningContributionList');
  if (!wrap) return;
  if (!editingGoalId){ wrap.innerHTML = ''; return; }
  const g = goals.find(x => x.id === editingGoalId);
  const keys = g && Array.isArray(g.linkedLearningCourses) ? g.linkedLearningCourses.filter(k => LEARNING_COURSES[k]) : [];
  if (!g || !keys.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen Kou Aprantisaj lye ak Objektif sa a.</span>';
    return;
  }
  const MIN_PER_LESSON = 5; // estimasyon, menm lojik ak konvansyon egzistan an
  let totalDone = 0, totalLessons = 0;
  const rows = keys.map(key => {
    const course = LEARNING_COURSES[key];
    const p = courseProgress(key);
    totalDone += p.done; totalLessons += p.total;
    return `<div class="milestone-row" style="justify-content:space-between;">
      <span><b>${escapeHtml(course.title)}</b></span>
      <span class="pill" style="background:var(--blue-soft);color:var(--blue);">${p.done}/${p.total} leson · ${p.pct}%</span>
    </div>`;
  }).join('');
  const studyDays = (learning.studyDates || []).length;
  const estMinutes = totalDone * MIN_PER_LESSON;
  const contributionPct = keys.length ? Math.round(keys.reduce((s,k) => s + courseProgress(k).pct, 0) / keys.length) : 0;
  wrap.innerHTML = rows + `
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Jou Etid (tout Aprantisaj)</span>
      <span class="pill" style="background:var(--surface-2);color:var(--text-dim);">${studyDays}</span>
    </div>
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Tan Etid Estime</span>
      <span class="pill" style="background:var(--surface-2);color:var(--text-dim);">${estMinutes} min</span>
    </div>
    <div class="milestone-row" style="justify-content:space-between;border-top:1px solid var(--border);margin-top:4px;padding-top:8px;">
      <b>Kontribisyon nan Objektif</b>
      <b style="color:var(--blue);">${contributionPct}%</b>
    </div>`;
}

// "Kreye Abitid Aprantisaj apati Objektif la" — kreye YON Abitid pou chak
// Kou lye ki poko gen Abitid (evite dupliyata: verifye `learningCourseKey`
// + `goalId` anvan kreyasyon), lye l ak Objektif la (h.goalId, menm chan ak
// lyen Abitid orijinal la, Pati 8/50) pou l parèt nan lis Abitid Lye a.
document.getElementById('goalCreateLearningHabitsBtn')?.addEventListener('click', () => {
  if (!editingGoalId || !goalLearningDraft.length) return;
  let createdCount = 0;
  goalLearningDraft.forEach(key => {
    const course = LEARNING_COURSES[key];
    if (!course) return;
    const alreadyExists = habits.some(h => h.goalId === editingGoalId && h.learningCourseKey === key);
    if (alreadyExists) return;
    habits.push({
      id: uid(), name: `Etidye ${course.title}`, description: `Abitid otomatik kreye apati Objektif la pou Kou "${course.title}"`,
      frequency: 'daily', reminder: true, category: 'Aprantisaj', goal: '',
      completions: [], createdAt: new Date().toISOString(),
      goalId: editingGoalId, learningCourseKey: key,
    });
    createdCount++;
  });
  if (createdCount){
    persistHabits();
    if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
    showToast(`${createdCount} Abitid Aprantisaj kreye ✓`);
  } else {
    showToast('Abitid yo deja egziste pou Kou sa yo');
  }
});

function unlinkHabitFromGoal(goalId, habitId){
  const g = goals.find(x => x.id === goalId);
  const h = habits.find(x => x.id === habitId);
  if (g && Array.isArray(g.linkedHabitIds)) g.linkedHabitIds = g.linkedHabitIds.filter(id => id !== habitId);
  if (h && h.goalId === goalId) h.goalId = null;
  persistGoals();
  persistHabits();
  return true;
}

function getHabitsForGoal(goalId){
  return habits.filter(h => h.goalId === goalId);
}

function getGoalForHabit(habitId){
  const h = habits.find(x => x.id === habitId);
  if (!h || !h.goalId) return null;
  return goals.find(g => g.id === h.goalId) || null;
}

function persistTasks(){ saveLS(LS.tasks, tasks); refreshDashboardTaskWidget(); lifeEngineRefresh(); }
function persistEvents(){ saveLS(LS.events, events); lifeEngineRefresh(); }
function persistTemplates(){ saveLS(LS.templates, templates); }
function persistHabits(){ saveLS(LS.habits, habits); refreshDashboardHabitWidget(); lifeEngineRefresh(); }
function persistGami(){ saveLS(LS.gami, gami); renderLevelPanels(); }
function persistMissions(){ saveLS(LS.missions, missionsState); }
function persistAchievements(){ saveLS(LS.achievements, unlockedAchievements); }

// ==========================================
// LEVEL SYSTEM — nivo ak non ki debloke rekonpans
// ==========================================
const LEVEL_TITLES = [
  { min:1,  label:'Debutan' },
  { min:5,  label:'Aprenti' },
  { min:10, label:'Moun Disipline' },
  { min:20, label:'Ekspè Lavi' },
  { min:35, label:'Veteran' },
  { min:50, label:'Mèt Lavi' },
  { min:75, label:'Lejand' },
];
function totalLifeXP(){ return (gami.xp||0) + (learning.xp||0); }
function getLevelInfo(xp){
  const level = Math.floor((xp||0) / 100) + 1;
  let title = LEVEL_TITLES[0].label;
  LEVEL_TITLES.forEach(t => { if (level >= t.min) title = t.label; });
  const pctInLevel = (xp||0) % 100;
  return { level, title, pctInLevel, xpToNext: 100 - pctInLevel };
}
const UNLOCK_DEFS = [
  { level:1,  type:'Tèm',        icon:'palette',  label:'Tèm Nwa (default)' },
  { level:3,  type:'Tèm',        icon:'sun',       label:'Tèm Klè' },
  { level:5,  type:'Badj',       icon:'award',     label:'"Kòmansman Solid"' },
  { level:10, type:'Reyalizasyon', icon:'trophy',  label:'"Moun Disipline"' },
  { level:20, type:'Rekonpans',  icon:'gift',      label:'Rapò Semenn Detaye' },
  { level:35, type:'Badj',       icon:'shield',    label:'"Veteran"' },
  { level:50, type:'Reyalizasyon', icon:'crown',   label:'"Mèt Lavi"' },
];
function renderLevelPanels(){
  const info = getLevelInfo(totalLifeXP());
  const badgeEl = document.getElementById('coachLevelBadge');
  if (badgeEl){
    badgeEl.textContent = 'Lv.'+info.level;
    document.getElementById('coachLevelTitle').textContent = info.title;
    document.getElementById('coachLevelXpLbl').textContent = totalLifeXP() + ' XP';
    document.getElementById('coachLevelBarFill').style.width = info.pctInLevel + '%';
    document.getElementById('coachLevelNext').textContent = info.xpToNext + ' XP';
    const grid = document.getElementById('unlockGrid');
    if (grid){
      grid.innerHTML = UNLOCK_DEFS.map(u => {
        const unlocked = info.level >= u.level;
        return `<span class="unlock-chip ${unlocked?'unlocked':'locked'}"><i data-lucide="${unlocked?u.icon:'lock'}"></i>${u.type} · ${u.label} ${unlocked?'':'(Lv.'+u.level+')'}</span>`;
      }).join('');
    }
  }
  const habitBadge = document.getElementById('xpLevelBadge');
  if (habitBadge){
    const gamiInfo = getLevelInfo(gami.xp);
    habitBadge.textContent = 'Lv.'+gamiInfo.level;
    habitBadge.title = gamiInfo.title;
  }
  const learnBadge = document.getElementById('learnLevelBadge');
  if (learnBadge){
    const learnInfo = getLevelInfo(learning.xp);
    learnBadge.textContent = 'Lv.'+learnInfo.level;
    learnBadge.title = learnInfo.title;
  }
  if (window.lucide) lucide.createIcons();
}
function persistWallets(){ secureSave(LS.wallets, wallets); }
function persistTx(){ secureSave(LS.tx, tx); refreshDashboardFinanceWidget(); lifeEngineRefresh(); }
function persistBudgets(){ secureSave(LS.budgets, budgets); }
function persistPlans(){ secureSave(LS.plans, plans); refreshDashboardInternetWidget(); lifeEngineRefresh(); }
function persistDataUsageLogs(){ saveLS(LS.dataUsageLogs, dataUsageLogs); }
function persistDataUsageApps(){ saveLS(LS.dataUsageApps, dataUsageApps); }
function persistProjects(){ saveLS(LS.projects, projects); }

// ==========================================
// GOAL <-> PROJECT — konneksyon lyen envès (Pati 32/50)
// Yon Project ka lye ak YON SÈL Goal (p.goalId). g.links.projectIds pa
// touche (se yon lòt sistèm, lyen jeneral). Sous verite pwogrè se
// g.progress; p.status swiv li otomatikman — pa gen mòd manyèl pou
// bat sync la pandan p.goalId aktif.
// ==========================================
function syncProjectStatusFromGoal(p){
  if (!p || !p.goalId) return false;
  const g = goals.find(x => x.id === p.goalId);
  if (!g) return false;
  // Pati 49/50 fix: `g.progress` sèl se yon chan manyèl ki pa toujou ajou (pw. Objektif
  // ki swiv pa Milestones/Finans/Aprantisaj kite `g.progress` a 0 pandan pwogrè REYÈL la
  // (goalMilestoneProgress, sous verite ki itilize toupatou nan rès sistèm nan — Goal List,
  // Dashboard, Statistics, Auto-Status) rive 100%). Sa te fè Project rete "idea"/"in-progress"
  // menm lè Objektif la reyèlman fini. Nou itilize goalMilestoneProgress(g) pou rete konsistan.
  const pct = goalMilestoneProgress(g);
  const newStatus = pct >= 100 ? 'completed' : pct >= 51 ? 'testing' : pct >= 1 ? 'in-progress' : 'idea';
  if (p.status !== newStatus){ p.status = newStatus; return true; }
  return false;
}
function syncAllProjectStatusesFromGoals(){
  let changed = false;
  projects.forEach(p => { if (syncProjectStatusFromGoal(p)) changed = true; });
  if (changed) persistProjects();
}
function persistNoteFolders(){ secureSave(LS.noteFolders, noteFolders); }
function persistNotes(){ secureSave(LS.notes, notes); }
function persistJournal(){ secureSave(LS.journal, journal); refreshDashboardJournalWidget(); }
function persistHealthLogs(){ saveLS(LS.healthLogs, healthLogs); refreshDashboardHealthWidget(); }
function persistHealthGoals(){ saveLS(LS.healthGoals, healthGoals); }

// ==========================================
// NAVIGATION + VIEW ROUTER
// ==========================================
const NAV_ITEMS = [
  { section: "Prensipal", items: [
    { icon: "layout-dashboard", label: "Dashboard", active: true, view:"dashboard" },
    { icon: "calendar", label: "Kalandriye", view:"calendar" },
    { icon: "check-square", label: "Travay", view:"tasks" },
    { icon: "flame", label: "Abitid", view:"habits" },
  ]},
  { section: "Lavi", items: [
    { icon: "wallet", label: "Finans", view:"finance" },
    { icon: "graduation-cap", label: "Aprantisaj", view:"learning" },
    { icon: "target", label: "Objektif", view:"goals" },
    { icon: "folder-kanban", label: "Pwojè", view:"projects" },
    { icon: "trophy", label: "Achievements", view:"achievements" },
  ]},
  { section: "Pèsonèl", items: [
    { icon: "notebook-pen", label: "Nòt", view:"notes" },
    { icon: "book-heart", label: "Jounal", view:"journal" },
    { icon: "heart-pulse", label: "Sante", view:"health" },
    { icon: "wifi", label: "Entènèt", view:"internet" },
    { icon: "history", label: "Istwa Lavi", view:"timeline" },
  ]},
  { section: "Sistèm", items: [
    { icon: "bar-chart-3", label: "Estatistik", view:"statistics" },
    { icon: "sparkles", label: "Coach AI", view:"coach" },
    { icon: "settings", label: "Paramèt", view:"settings" },
  ]},
];

const navGroup = document.getElementById("navGroup");
NAV_ITEMS.forEach(group => {
  const label = document.createElement("div");
  label.className = "nav-label";
  label.textContent = group.section;
  navGroup.appendChild(label);
  group.items.forEach(item => {
    const el = document.createElement("div");
    el.className = "nav-item" + (item.active ? " active" : "");
    el.title = item.label;
    el.dataset.view = item.view || "";
    el.innerHTML = `<i data-lucide="${item.icon}"></i><span>${item.label}</span>`;
    el.addEventListener("click", () => {
      if (item.view) showView(item.view);
      else showToast("Modil sa a ap vini pi devan ✨");
    });
    navGroup.appendChild(el);
  });
});

// ---- MOBILE: bottom-nav 5-item + "Plis" bottom sheet ----
const MOBILE_PRIMARY_VIEWS = ['dashboard', 'tasks', 'coach', 'finance'];
document.querySelectorAll('#mobileBottomNav .nav-item[data-view]').forEach(el => {
  el.addEventListener('click', () => showView(el.dataset.view));
});

const mobileMoreGrid = document.getElementById('mobileMoreGrid');
NAV_ITEMS.forEach(group => {
  group.items.forEach(item => {
    if (!item.view || MOBILE_PRIMARY_VIEWS.includes(item.view)) return;
    const el = document.createElement('div');
    el.className = 'mobile-more-item';
    el.dataset.view = item.view;
    el.innerHTML = `<i data-lucide="${item.icon}"></i><span>${item.label}</span>`;
    el.addEventListener('click', () => { showView(item.view); closeMobileMoreSheet(); });
    mobileMoreGrid.appendChild(el);
  });
});

function openMobileMoreSheet(){
  document.getElementById('mobileMoreOverlay').classList.add('open');
  document.getElementById('mobileMoreSheet').classList.add('open');
  if (window.lucide) lucide.createIcons();
}
function closeMobileMoreSheet(){
  document.getElementById('mobileMoreOverlay').classList.remove('open');
  document.getElementById('mobileMoreSheet').classList.remove('open');
}
document.getElementById('mobileMoreBtn').addEventListener('click', openMobileMoreSheet);
document.getElementById('mobileMoreOverlay').addEventListener('click', closeMobileMoreSheet);

function showView(view){
  if (view === 'learning'){ window.location.href = 'learning.html'; return; }
  document.querySelectorAll('.view').forEach(v => v.hidden = (v.id !== 'view-' + view));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  trackModuleVisit(view);
  if (view === 'dashboard') renderMissions();
  if (view === 'tasks') renderTasks();
  if (view === 'calendar') renderCalendar();
  if (view === 'habits') renderHabits();
  if (view === 'finance') renderFinance();
  if (view === 'internet') renderPlans();
  if (view === 'projects') renderProjects();
  if (view === 'notes') renderNotes();
  if (view === 'journal') renderJournal();
  if (view === 'health') renderHealth();
  if (view === 'goals'){
    renderGoals();
    markGoalsReviewed();
  }
  if (view === 'coach') renderCoachView();
  if (view === 'achievements') renderAchievementsView();
  if (view === 'timeline') renderTimelineView();
  if (view === 'statistics') renderStatisticsView();
  if (view === 'settings') renderSettingsView();
  if (window.lucide) lucide.createIcons();
}
document.getElementById('seeAllActivityBtn').addEventListener('click', () => showView('timeline'));

// ==========================================
// GREETING + CLOCK
// ==========================================
function updateGreeting(){
  const now = new Date();
  const h = now.getHours();
  const period = h < 12 ? "Bonjou" : h < 18 ? "Bon apremidi" : "Bonswa";
  document.getElementById("greetingText").textContent = `${period}, Wilguentz 👋`;
  document.getElementById("dateText").textContent = `Jodi a se ${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}
updateGreeting();
setInterval(updateGreeting, 60_000);

// ==========================================
// LIFE SCORE DIAL
// ==========================================
const CATEGORIES_DEFAULT = [
  { key: "productivity", label: "Pwodiktivite", value: 78, color: "var(--blue)" },
  { key: "learning", label: "Aprantisaj", value: 62, color: "var(--orange)" },
  { key: "finance", label: "Finans", value: 55, color: "var(--blue)" },
  { key: "health", label: "Sante", value: 70, color: "var(--green)" },
  { key: "discipline", label: "Disiplin", value: 81, color: "var(--green)" },
  { key: "goals", label: "Objektif", value: 65, color: "var(--orange)" },
];
const savedCategoryValues = loadLS(LS.categories, null);
const CATEGORIES = CATEGORIES_DEFAULT.map(c => ({
  ...c,
  value: (savedCategoryValues && typeof savedCategoryValues[c.key] === 'number') ? savedCategoryValues[c.key] : c.value,
}));
function persistCategories(){
  const map = {};
  CATEGORIES.forEach(c => { map[c.key] = c.value; });
  saveLS(LS.categories, map);
}
const catGrid = document.getElementById("catGrid");
let scoreArc, scoreNumEl, scoreDisplayed = 0;
function renderCatGrid(){
  catGrid.innerHTML = '';
  CATEGORIES.forEach(c => {
    const row = document.createElement("div");
    row.className = "cat-row";
    row.innerHTML = `<span class="cat-dot" style="background:${c.color}"></span><span class="name">${c.label}</span><span class="val">${c.value}</span>`;
    catGrid.appendChild(row);
  });
}
renderCatGrid();
const CIRC = 2 * Math.PI * 64;
function renderLifeScore(){
  scoreArc = document.getElementById("scoreArc");
  scoreNumEl = document.getElementById("scoreNum");
  const overall = Math.round(CATEGORIES.reduce((s,c)=>s+c.value,0) / CATEGORIES.length);
  scoreArc.style.strokeDasharray = `${CIRC}`;
  scoreArc.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)";
  requestAnimationFrame(() => { scoreArc.style.strokeDashoffset = `${CIRC * (1 - overall / 100)}`; });
  (function step(){
    scoreDisplayed += Math.ceil((overall - scoreDisplayed) / 6) || (overall > scoreDisplayed ? 1 : 0);
    if (scoreDisplayed >= overall) scoreDisplayed = overall;
    scoreNumEl.textContent = scoreDisplayed;
    if (scoreDisplayed < overall) requestAnimationFrame(step);
  })();
}
renderLifeScore();

// ==========================================
// LIFE SCORE — ISTORIK (Previous / Improvement / History)
// ==========================================
let scoreHistory = loadLS(LS.scoreHistory, []); // [{date:'YYYY-MM-DD', value:Number}]
function persistScoreHistory(){ saveLS(LS.scoreHistory, scoreHistory); }
function currentOverallScore(){
  return Math.round(CATEGORIES.reduce((s,c)=>s+c.value,0) / CATEGORIES.length);
}
function recordScoreHistory(){
  const t = todayISO();
  const overall = currentOverallScore();
  const last = scoreHistory[scoreHistory.length - 1];
  if (last && last.date === t) last.value = overall;
  else scoreHistory.push({ date:t, value:overall });
  if (scoreHistory.length > 30) scoreHistory = scoreHistory.slice(-30);
  persistScoreHistory();
  renderScoreHistoryUI();
}
function renderScoreHistoryUI(){
  const prevEl = document.getElementById('scorePrevNum');
  const deltaEl = document.getElementById('scoreDeltaNum');
  const sparkEl = document.getElementById('scoreSparkline');
  if (!prevEl || !sparkEl) return;
  const overall = currentOverallScore();
  const priorEntries = scoreHistory.filter(e => e.date !== todayISO());
  const prev = priorEntries.length ? priorEntries[priorEntries.length - 1].value : null;
  prevEl.textContent = prev === null ? '–' : prev;
  if (prev === null){
    deltaEl.textContent = '–';
    deltaEl.className = '';
  } else {
    const delta = overall - prev;
    deltaEl.textContent = (delta > 0 ? '+' : '') + delta;
    deltaEl.className = delta > 0 ? 'up' : (delta < 0 ? 'down' : '');
  }
  const last7 = scoreHistory.slice(-7);
  const maxV = Math.max(1, ...last7.map(e=>e.value));
  sparkEl.innerHTML = last7.map(e => {
    const h = Math.max(4, Math.round((e.value / maxV) * 32));
    const isToday = e.date === todayISO();
    return `<div class="bar${isToday?' today':''}" style="height:${h}px" title="${e.date}: ${e.value}"></div>`;
  }).join('');
}
function bumpCategory(key, delta){
  const c = CATEGORIES.find(x => x.key === key);
  if (!c) return;
  c.value = Math.max(0, Math.min(100, c.value + delta));
  renderCatGrid();
  scoreDisplayed = 0;
  renderLifeScore();
  persistCategories();
  recordScoreHistory();
}
function setCategory(key, val){
  const c = CATEGORIES.find(x => x.key === key);
  if (!c || val === c.value) return;
  c.value = Math.max(0, Math.min(100, Math.round(val)));
  renderCatGrid();
  scoreDisplayed = 0;
  renderLifeScore();
  persistCategories();
  recordScoreHistory();
}

// ==========================================
// LIFE ENGINE — kouch entelijans santral ki konekte tout modil yo
// ==========================================

// ---- Koneksyon 1: Tasks → Goals ----
// Lè yon tach ki lye ak yon objektif fini, ogmante pwogrè objektif la,
// bay XP, epi amelyore Life Score.
function applyTaskCompletionToGoal(task){
  if (!task || !task.goalId) return;
  const g = goals.find(x => x.id === task.goalId);
  if (!g) return;
  if (g.milestones && g.milestones.length){
    const next = g.milestones.find(m => !m.done);
    if (next) next.done = true;
  } else {
    g.progress = Math.max(0, Math.min(100, (g.progress || 0) + 15));
  }
  persistGoals();
  gami.xp += 10;
  persistGami();
  bumpCategory('goals', 3);
  bumpCategory('productivity', 1);
  renderActivity([{ icon:'target', color:'var(--green)', text:`Tach <b>"${escapeHtml(task.title)}"</b> fè objektif <b>"${escapeHtml(g.title)}"</b> avanse`, time:'kounye a' }]);
  showToast(`Objektif "${g.title}" avanse ✓ +10 XP`);
  if (document.getElementById('view-goals') && !document.getElementById('view-goals').hidden) renderGoals();
  refreshDashboardGoalsWidget();
}

// ---- Dashboard: widget Objektif dinamik (te fikse an dur anvan) ----
function refreshDashboardGoalsWidget(){
  const wrap = document.getElementById('dashGoalsWrap');
  if (!wrap) return;
  if (!goals.length){
    wrap.innerHTML = '<div class="stat-line" style="color:var(--text-faint);">Ou poko gen objektif.</div>';
    return;
  }
  const sorted = goals.slice().sort((a,b) => goalMilestoneProgress(b) - goalMilestoneProgress(a) === 0
    ? new Date(a.deadline||'2999-01-01') - new Date(b.deadline||'2999-01-01') : goalMilestoneProgress(a) - goalMilestoneProgress(b));
  const top = sorted.slice(0,2);
  const deadlinesThisMonth = goals.filter(g => g.deadline && g.deadline.slice(0,7) === todayISO().slice(0,7)).length;
  wrap.innerHTML = top.map(g => {
    const pct = goalMilestoneProgress(g);
    return `<div class="stat-line"><span>${escapeHtml(g.title)}</span><b>${pct}%</b></div>
      <div class="mini-progress"><span style="width:${pct}%;background:${priorityColor(g.priority)}"></span></div>`;
  }).join('') + `<div class="stat-line"><span style="color:var(--text-faint);">${deadlinesThisMonth} dat limit mwa sa a</span></div>`;
}

// ---- Koneksyon 2: Learning → Calendar ----
// Lè itilizatè a kòmanse yon nouvo roadmap, kreye yon sesyon etid nan
// kalandriye a otomatikman, ak yon rapèl.
// Courses are now started from the standalone learning.html/course.html pages,
// which already push into learning.startedCourses before index.html ever reloads.
// This detects any course started there that hasn't had its calendar reminder
// created yet, and creates it — preserving the Learning -> Calendar connection
// across the page split.
function syncCalendarForNewRoadmaps(){
  learning.startedCourses = learning.startedCourses || [];
  learning.calendarSuggested = learning.calendarSuggested || [];
  learning.startedCourses.forEach(courseKey => {
    if (learning.calendarSuggested.includes(courseKey)) return;
    const course = LEARNING_COURSES[courseKey];
    if (!course) return;
    learning.calendarSuggested.push(courseKey);
    const tomorrow = isoOffset(todayISO(), 1);
    events.push({
      id: uid(), title: `Sesyon Etid — ${course.title}`, description: 'Kreye otomatikman pa Life Engine ou kòmanse yon nouvo kou.',
      date: tomorrow, time: '18:00', location: '', category: 'study', reminder: { enabled: true }, recurrence: 'none',
    });
    persistEvents();
    renderActivity([{ icon:'calendar', color:'var(--green)', text:`Life Engine ajoute yon sesyon etid <b>"${escapeHtml(course.title)}"</b> demen nan kalandriye w`, time:'kounye a' }]);
    showToast(`Sesyon etid ajoute nan kalandriye pou demen 6:00 PM`);
  });
  persistLearning();
}

// ---- Koneksyon 3: Calendar → AI (Rezime AI Jodi a) ----
// Analize evènman k ap vini yo, tach ijan, objektif, abitid, ak plan
// entènèt pou bay yon rezime ak priyorite reyèl — pa tèks fiks.
function renderAiBriefing(){
  const bodyEl = document.getElementById('aiBriefingBody');
  const listEl = document.getElementById('aiBriefingList');
  const subEl = document.getElementById('aiBriefingSub');
  if (!bodyEl) return;

  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  subEl.textContent = `Prepare pou ou a ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

  const todayStr = todayISO();
  const urgentTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived' && (t.priority === 'urgent' || t.priority === 'high'));
  const todayTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived' && t.deadline && t.deadline.slice(0,10) === todayStr);
  const activePlan = getActivePlan();
  const planLeft = activePlan ? planDaysLeft(activePlan) : null;
  const upcomingEvents = events.filter(e => e.date >= todayStr && e.date <= isoOffset(todayStr, 2))
    .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  const habitsLeftToday = habits.filter(hb => !(hb.completions||[]).includes(todayStr));

  let bodyParts = [];
  bodyParts.push(todayTasks.length ? `Jodi a ou gen <b>${todayTasks.length} tach</b> ak dat limit` : (urgentTasks.length ? `Ou gen <b>${urgentTasks.length} tach ijan/wo</b> k ap tann` : `Ou pa gen tach ijan pou kounye a`));
  if (planLeft !== null) bodyParts.push(planLeft <= 3 ? `plan entènèt ou ap fini nan <b>${planLeft} jou</b>` : `plan entènèt ou ap la ankò pou <b>${planLeft} jou</b>`);
  if (upcomingEvents.length) bodyParts.push(`ou gen <b>${upcomingEvents.length} evènman</b> nan 2 pwochen jou yo`);
  bodyParts.push(habitsLeftToday.length ? `ou poko fè <b>${habitsLeftToday.length} abitid</b> jodi a` : `ou fè tout abitid ou jodi a 🎉`);
  bodyEl.innerHTML = bodyParts.join(', ') + '.';

  const items = [];
  const avgGoalProgress = goals.length ? Math.round(goals.reduce((s,g)=>s+goalMilestoneProgress(g),0)/goals.length) : null;
  if (avgGoalProgress !== null) items.push(`<div class="item"><i data-lucide="check-circle-2" style="color:var(--green)"></i> Objektif ou yo rive <b>${avgGoalProgress}%</b> an mwayèn.</div>`);
  const habitCat = CATEGORIES.find(c=>c.key==='discipline');
  if (habitCat) items.push(`<div class="item"><i data-lucide="flame" style="color:var(--orange)"></i> Disiplin ou nan Life Score se <b>${habitCat.value}</b>.</div>`);
  if (planLeft !== null && planLeft <= 3) items.push(`<div class="item"><i data-lucide="alert-triangle" style="color:var(--red)"></i> Plan entènèt ap ekspire byento — panse renouvle l.</div>`);
  if (upcomingEvents[0]) items.push(`<div class="item"><i data-lucide="calendar-clock" style="color:var(--blue)"></i> Pwochen evènman: <b>${escapeHtml(upcomingEvents[0].title)}</b> — ${upcomingEvents[0].date === todayStr ? "jodi a" : "demen"} ${upcomingEvents[0].time||''}.</div>`);
  listEl.innerHTML = items.slice(0,3).join('');

  const ctaBtn = document.getElementById('startLessonBtn');
  if (ctaBtn){
    const nextStudy = upcomingEvents.find(e => e.category === 'study');
    if (nextStudy){
      ctaBtn.innerHTML = `<i data-lucide="book-open"></i> ${escapeHtml(nextStudy.title)} — ${nextStudy.date===todayStr?'jodi a':'demen'}`;
      ctaBtn.onclick = () => showView('calendar');
    } else if (urgentTasks[0]){
      ctaBtn.innerHTML = `<i data-lucide="check-square"></i> Fè "${escapeHtml(urgentTasks[0].title)}" anvan lòt bagay`;
      ctaBtn.onclick = () => showView('tasks');
    } else {
      ctaBtn.innerHTML = `<i data-lucide="sparkles"></i> Ou ajou — kontinye konsa`;
      ctaBtn.onclick = () => showView('goals');
    }
  }
  if (window.lucide) lucide.createIcons();
}

// ---- Notification Center — magazen pèsistan pou notifikasyon entèlijan ----
let notifications = loadLS(LS.notifications, []);
function persistNotifications(){ saveLS(LS.notifications, notifications); }

function pushNotification({ icon, color, title, body, view, dedupeKey }){
  if (dedupeKey && notifications.some(n => n.dedupeKey === dedupeKey)) return;
  notifications.unshift({
    id: uid(), icon, color, title, body, view: view || null,
    dedupeKey: dedupeKey || null, ts: new Date().toISOString(), read: false,
  });
  if (notifications.length > 60) notifications.length = 60;
  persistNotifications();
  renderNotificationBell();
}

function renderNotificationBell(){
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const unread = notifications.filter(n => !n.read).length;
  badge.hidden = unread === 0;
  badge.textContent = unread > 9 ? '9+' : String(unread);
  const panel = document.getElementById('notifPanel');
  if (panel && !panel.hidden) renderNotificationPanel();
}

function renderNotificationPanel(){
  const body = document.getElementById('notifPanelBody');
  if (!body) return;
  if (!notifications.length){
    body.innerHTML = '<div class="notif-empty">Ou pa gen notifikasyon pou kounye a 🎉</div>';
    return;
  }
  body.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <div class="notif-ic" style="background:color-mix(in srgb, ${n.color} 16%, transparent); color:${n.color}"><i data-lucide="${n.icon}"></i></div>
      <div class="notif-body">
        <div class="title">${escapeHtml(n.title)}</div>
        <div class="desc">${n.body}</div>
        <div class="time">${relativeTime(n.ts)}</div>
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
  body.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', () => {
      const n = notifications.find(x => x.id === el.dataset.id);
      if (!n) return;
      n.read = true;
      persistNotifications();
      renderNotificationBell();
      document.getElementById('notifPanel').hidden = true;
      if (n.view) showView(n.view);
    });
  });
}

document.getElementById('notifBellBtn').addEventListener('click', e => {
  e.stopPropagation();
  const panel = document.getElementById('notifPanel');
  panel.hidden = !panel.hidden;
  if (!panel.hidden) renderNotificationPanel();
});
document.getElementById('notifMarkAllBtn').addEventListener('click', e => {
  e.stopPropagation();
  notifications.forEach(n => n.read = true);
  persistNotifications();
  renderNotificationBell();
  renderNotificationPanel();
});
document.addEventListener('click', e => {
  const wrap = document.getElementById('notifWrap');
  const panel = document.getElementById('notifPanel');
  if (wrap && panel && !wrap.contains(e.target)) panel.hidden = true;
});
renderNotificationBell();

// ---- Koneksyon 4: Smart Automations — rezo règ "Si X, Alò Y" ----
function runSmartAutomations(){
  const t = todayISO();

  // Si → Plan entènèt ap ekspire demen | Alò → kreye notifikasyon
  refreshPlanStatuses();
  plans.filter(p => p.status === 'active').forEach(p => {
    const left = planDaysLeft(p);
    if (left !== null && left <= 1){
      pushNotification({
        icon:'wifi', color:'var(--red)', title:'Plan Entènèt ap ekspire',
        body: left === 0 ? `Plan <b>"${escapeHtml(p.name)}"</b> ekspire jodi a.` : `Plan <b>"${escapeHtml(p.name)}"</b> ap ekspire demen — panse renouvle l.`,
        view:'internet', dedupeKey:`plan-${p.id}-${t}`,
      });
    }
  });

  // Si → Dat limit yon objektif ap pwoche | Alò → AI kreye yon rekòmandasyon
  goals.forEach(g => {
    if (!g.deadline) return;
    const pct = goalMilestoneProgress(g);
    if (pct >= 100) return;
    const daysLeft = Math.ceil((new Date(g.deadline) - new Date(t)) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 3){
      pushNotification({
        icon:'target', color:'var(--orange)', title:'Objektif prèske rive',
        body:`Ou gen <b>${daysLeft} jou</b> pou fini "${escapeHtml(g.title)}" (${pct}% fèt) — ogmante rit la pou rive.`,
        view:'goals', dedupeKey:`goal-${g.id}-${t}`,
      });
    }
  });

  // Si → Itilizatè sispann etidye | Alò → AI ankouraje l retounen
  if (learning.completed.length && learning.lastStudyDate){
    const daysSince = Math.floor((new Date(t) - new Date(learning.lastStudyDate)) / 86400000);
    if (daysSince >= 3){
      pushNotification({
        icon:'graduation-cap', color:'var(--orange)', title:'Manke w nan aprantisaj',
        body:`Sa fè <b>${daysSince} jou</b> depi ou pa etidye. Yon ti leson jodi a ka fè yon gwo diferans!`,
        view:'learning', dedupeKey:`learning-gap-${t}`,
      });
    }
  }

  // Si → Limit bidjè rive | Alò → montre avètisman
  const spentByCat = monthExpenseByCategory();
  const monthKey = t.slice(0,7);
  Object.entries(budgets.limits || {}).forEach(([cat, limit]) => {
    const s = spentByCat[cat] || 0;
    if (limit > 0 && s >= limit){
      pushNotification({
        icon:'alert-triangle', color:'var(--red)', title:'Limit Bidjè Rive',
        body:`Ou depase limit bidjè <b>"${escapeHtml(cat)}"</b> mwa sa a (${fmtHTG(s)} / ${fmtHTG(limit)}).`,
        view:'finance', dedupeKey:`budget-${cat}-${monthKey}`,
      });
    }
  });

  // Si → Yon abitid manke | Alò → sijere rekiperasyon
  habits.forEach(h => {
    const y = isoOffset(t,-1), y2 = isoOffset(t,-2);
    const set = new Set(h.completions || []);
    if (set.has(y2) && !set.has(y)){
      pushNotification({
        icon:'flame', color:'var(--orange)', title:'Ou manke yon abitid',
        body:`Ou manke <b>"${escapeHtml(h.name)}"</b> yè. Fè l jodi a pou rekòmanse yon nouvo seri.`,
        view:'habits', dedupeKey:`habit-miss-${h.id}-${y}`,
      });
    }
  });
}

// ---- Koneksyon 5: Smart Reminders — rapèl entèlijan olye de mesaj jenerik ----
function buildSmartReminderText(task){
  if (task.goalId){
    const g = goals.find(x => x.id === task.goalId);
    if (g) return `Ou toujou gen yon tach enpòtan (<b>"${escapeHtml(task.title)}"</b>) ki ka afekte objektif <b>"${escapeHtml(g.title)}"</b> ou.`;
  }
  if (task.priority === 'urgent') return `Ou gen yon tach <b>ijan</b> ("${escapeHtml(task.title)}") ki poko fèt.`;
  return `Ou toujou gen yon tach enpòtan ("${escapeHtml(task.title)}") ki ka afekte objektif ou.`;
}

function runSmartReminders(){
  const t = todayISO();
  tasks.filter(task => task.status !== 'completed' && task.status !== 'archived' && task.reminder?.enabled && task.deadline)
    .forEach(task => {
      const dueDate = task.deadline.slice(0,10);
      if (dueDate <= t){
        pushNotification({
          icon:'bell', color:'var(--blue)', title:'Rapèl Entèlijan',
          body: buildSmartReminderText(task),
          view:'tasks', dedupeKey:`reminder-${task.id}-${t}`,
        });
      }
    });
}

// ==========================================
// GOAL <-> NOTIFICATION — rapèl entelijan pou Objektif (Pati 42/50)
// PA gen nouvo motè notifikasyon isit — nou rele SÈLMAN pushNotification()
// ki egziste deja (Notification Center pi wo a), menm jan
// runSmartAutomations()/runSmartReminders() fè l pou Plan/Tach. Chak rapèl
// baze SÈLMAN sou done Objektif ki egziste deja: dat limit (g.deadline),
// Timeline pwogrè (g.habitProgressHistory, Pati 38/39/41), Abitid Lye
// (getHabitsForGoal + computeHabitLinkStatus, Pati 3/14), ak
// milestone.targetDate (Pati 36 fòm lan). Pa gen chan nouvo estoke pou
// "detekte" — pushNotification() deja gen dedupeKey pou anpeche doublon.
// ==========================================
const GOAL_STALE_PROGRESS_DAYS = 5; // konbyen jou san okenn aktivite anvan rapèl "pwogrè manke"
// Objektif nan estati sa yo pa bezwen rapèl ankò (deja fini, an poz, oswa achive manyèlman)
const GOAL_REMINDER_SKIP_STATUSES = ['completed','failed','paused','archived'];

// Dat dènye aktivite REYÈL sou yon Objektif — dènye antre nan Timeline li
// (g.habitProgressHistory) oswa, si okenn antre pa gen ankò, dat kreyasyon.
function goalLastActivityDate(g){
  const history = Array.isArray(g.habitProgressHistory) ? g.habitProgressHistory : [];
  if (history.length) return history[history.length - 1].date;
  return (g.createdAt || todayISO()).slice(0,10);
}

function runGoalReminders(){
  const t = todayISO();
  goals.forEach(g => {
    if (GOAL_REMINDER_SKIP_STATUSES.includes(g.status)) return;

    // 1) Dat Limit Objektif la (opsyonèl, Pati 6/21/36) — apwoche oswa deja pase
    if (g.deadline){
      const daysRemaining = daysBetween(t, g.deadline);
      if (daysRemaining < 0){
        pushNotification({
          icon:'calendar-clock', color:'var(--red)', title:'Dat Limit Objektif Pase',
          body: `Objektif <b>"${escapeHtml(g.title)}"</b> gen yon dat limit ki deja pase san li pa konplete.`,
          view:'goals', dedupeKey:`goal-deadline-${g.id}-${t}`,
        });
      } else if (daysRemaining <= GOAL_CALENDAR_REMINDER_DAYS_BEFORE){
        pushNotification({
          icon:'calendar-clock', color:'var(--orange)', title:'Dat Limit Objektif Apwoche',
          body: daysRemaining === 0
            ? `Dat limit Objektif <b>"${escapeHtml(g.title)}"</b> se jodi a.`
            : `Dat limit Objektif <b>"${escapeHtml(g.title)}"</b> nan ${daysRemaining} jou.`,
          view:'goals', dedupeKey:`goal-deadline-${g.id}-${t}`,
        });
      }
    }

    // 2) Pwogrè manke — Objektif ki an kou men san okenn aktivite depi twò lontan
    if (['in-progress','almost-complete','delayed'].includes(g.status)){
      const lastDate = goalLastActivityDate(g);
      const staleDays = daysBetween(lastDate, t);
      if (staleDays >= GOAL_STALE_PROGRESS_DAYS){
        pushNotification({
          icon:'trending-down', color:'var(--orange)', title:'Pwogrè Objektif Estagnan',
          body: `Ou pa fè pwogrè sou Objektif <b>"${escapeHtml(g.title)}"</b> depi ${staleDays} jou.`,
          view:'goals', dedupeKey:`goal-stale-${g.id}-${t}`,
        });
      }
    }

    // 3) Abitid Lye ki San Aktivite (menm kalkil egzat ak computeHabitLinkStatus, Pati 14/50)
    getHabitsForGoal(g.id).forEach(h => {
      if (computeHabitLinkStatus(h) !== 'paused') return;
      const sorted = (h.completions||[]).slice().sort();
      const last = sorted[sorted.length - 1];
      const daysSince = last ? daysBetween(last, t) : null;
      pushNotification({
        icon:'flame', color:'var(--red)', title:'Abitid Lye San Aktivite',
        body: daysSince != null
          ? `Ou pa fin konplete Abitid <b>"${escapeHtml(h.name)}"</b> (lye ak Objektif <b>"${escapeHtml(g.title)}"</b>) depi ${daysSince} jou.`
          : `Ou poko janm fè Abitid <b>"${escapeHtml(h.name)}"</b> (lye ak Objektif <b>"${escapeHtml(g.title)}"</b>).`,
        view:'goals', dedupeKey:`goal-habit-inactive-${g.id}-${h.id}-${t}`,
      });
    });

    // 4) Etap Enpòtan (Milestones) k ap Apwoche oswa An Reta (Pati 36 fòm — targetDate)
    (g.milestones||[]).forEach(m => {
      if (m.done || !m.targetDate) return;
      const daysRemaining = daysBetween(t, m.targetDate);
      if (daysRemaining < 0){
        pushNotification({
          icon:'flag', color:'var(--red)', title:'Etap Objektif An Reta',
          body: `Etap <b>"${escapeHtml(m.text)}"</b> pou Objektif <b>"${escapeHtml(g.title)}"</b> gen yon dat ki deja pase san li pa fèt.`,
          view:'goals', dedupeKey:`goal-milestone-${g.id}-${m.id}-${t}`,
        });
      } else if (daysRemaining <= GOAL_CALENDAR_REMINDER_DAYS_BEFORE){
        pushNotification({
          icon:'flag', color:'var(--blue)', title:'Etap Objektif Ap Apwoche',
          body: daysRemaining === 0
            ? `Etap <b>"${escapeHtml(m.text)}"</b> pou Objektif <b>"${escapeHtml(g.title)}"</b> se pou jodi a.`
            : `Etap <b>"${escapeHtml(m.text)}"</b> pou Objektif <b>"${escapeHtml(g.title)}"</b> ap apwoche (${daysRemaining} jou).`,
          view:'goals', dedupeKey:`goal-milestone-${g.id}-${m.id}-${t}`,
        });
      }
    });
  });
}

// ---- Koneksyon 6: Pèsonalizasyon — OSLIFE aprann abitid itilizatè a ak tan ----
let personalization = loadLS(LS.personalization, {
  moduleVisits:{}, hourlyActivity: new Array(24).fill(0), firstUse: new Date().toISOString(),
});
function persistPersonalization(){ saveLS(LS.personalization, personalization); }

function trackModuleVisit(view){
  personalization.moduleVisits[view] = (personalization.moduleVisits[view] || 0) + 1;
  const hour = new Date().getHours();
  personalization.hourlyActivity = personalization.hourlyActivity || new Array(24).fill(0);
  personalization.hourlyActivity[hour] = (personalization.hourlyActivity[hour] || 0) + 1;
  persistPersonalization();
}

function favoriteModule(){
  const entries = Object.entries(personalization.moduleVisits || {});
  if (!entries.length) return null;
  return entries.sort((a,b) => b[1]-a[1])[0][0];
}
function mostActiveHour(){
  const arr = personalization.hourlyActivity || [];
  let best = 0, bestVal = -1;
  arr.forEach((v,h) => { if (v > bestVal){ bestVal = v; best = h; } });
  return bestVal > 0 ? best : null;
}
function biggestSpendingCategory(){
  const entries = Object.entries(monthExpenseByCategory());
  if (!entries.length) return null;
  return entries.sort((a,b) => b[1]-a[1])[0][0];
}
function weeklyLessonRate(){
  const log = learning.lessonLog || [];
  if (!log.length) return 0;
  const weekAgo = isoOffset(todayISO(), -7);
  return log.filter(d => d >= weekAgo).length;
}
const VIEW_LABELS = {
  dashboard:'Dashboard', tasks:'Tach', calendar:'Kalandriye', habits:'Abitid', finance:'Finans',
  learning:'Aprantisaj', goals:'Objektif', projects:'Pwojè', achievements:'Achievements', notes:'Nòt',
  journal:'Jounal', health:'Sante', internet:'Entènèt', timeline:'Istwa Lavi', coach:'Coach AI', settings:'Paramèt',
  statistics:'Estatistik',
};

function renderPersonalizationPanel(){
  const wrap = document.getElementById('personalizationGrid');
  if (!wrap) return;
  const fav = favoriteModule();
  const hour = mostActiveHour();
  const cat = biggestSpendingCategory();
  const weeklyLessons = weeklyLessonRate();
  const totalVisits = Object.values(personalization.moduleVisits || {}).reduce((a,b) => a+b, 0);
  const items = [
    { icon:'star', color:'var(--blue)', label:'Modil ou pi renmen', value: fav ? (VIEW_LABELS[fav]||fav) : 'Ap aprann...' },
    { icon:'clock', color:'var(--orange)', label:'Lè ou pi aktif', value: hour !== null ? `${String(hour).padStart(2,'0')}:00` : 'Ap aprann...' },
    { icon:'graduation-cap', color:'var(--green)', label:'Rit aprantisaj (semèn sa a)', value: `${weeklyLessons} leson` },
    { icon:'wallet', color:'var(--red)', label:'Kategori depans #1', value: cat || 'Poko gen depans' },
  ];
  wrap.innerHTML = items.map(i => `
    <div class="insight-card">
      <div class="cat" style="color:${i.color}"><i data-lucide="${i.icon}"></i> ${i.label}</div>
      <div class="txt">${escapeHtml(String(i.value))}</div>
    </div>
  `).join('') + `<div class="stat-line" style="grid-column:1/-1;color:var(--text-faint);font-size:11.5px;padding-top:4px;">OSLIFE ap swiv <b>${totalVisits}</b> aksyon pou vin pi entèlijan chak jou.</div>`;
  if (window.lucide) lucide.createIcons();
}

// ---- Analiz kontinyèl: rafrechi tout pati Life Engine an konekte ----
function _lifeEngineRefreshImpl(){
  refreshDashboardGoalsWidget();
  renderAiBriefing();
  recordScoreHistory();
  renderMissions();
  checkAchievements();
  runSmartAutomations();
  runSmartReminders();
  // Pati 42/50: rapèl Objektif <-> Notifikasyon (rele API pushNotification ki egziste deja)
  if (typeof runGoalReminders === 'function') runGoalReminders();
  // Pati 33/50: Project la lekti pwogrè li dirèkteman nan g.progress
  // (computeProjectProgress), sèl bagay ki bezwen persiste se p.status.
  if (typeof syncAllProjectStatusesFromGoals === 'function') syncAllProjectStatusesFromGoals();
  // Pati 41/50: rekalkile estati otomatik Objektif yo (dwe kouri anvan
  // sync depandans Pati 39, pou lòt Objektif ki depann sou yo wè estati ajou)
  if (typeof syncAllGoalAutoStatuses === 'function') syncAllGoalAutoStatuses();
  // Pati 39/50: swiv estati depandans Objektif <-> Objektif
  if (typeof syncAllGoalDependencyStatuses === 'function') syncAllGoalDependencyStatuses();
  const activeView = document.querySelector('.view.active')?.id || '';
  if (typeof renderProjects === 'function' && activeView.toLowerCase().includes('project')) renderProjects();
}
// Pèfòmans: si plizyè aksyon rele lifeEngineRefresh() nan menm ti moman an, gwoupe yo an YON sèl
// re-kalkil olye plizyè, pou evite re-rann initil sou gwo lis done.
let _lifeEngineRefreshQueued = false;
function lifeEngineRefresh(){
  if (_lifeEngineRefreshQueued) return;
  _lifeEngineRefreshQueued = true;
  requestAnimationFrame(() => { _lifeEngineRefreshQueued = false; _lifeEngineRefreshImpl(); });
}

// ==========================================
// COACH AI — AI LIFE COACH (Personal Planner,
// Learning Teacher, Financial Analyst, Goal
// Advisor, Daily Assistant) — analiz lokal
// ki li done itilizatè a nan localStorage.
// ==========================================
let coachChat = loadLS(LS.coachChat, []);
function persistCoachChat(){ saveLS(LS.coachChat, coachChat); }

// ---- PERSONAL PLANNER ----
function coachPlannerData(){
  const todayStr = todayISO();
  const open = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived');
  const urgent = open.filter(t => t.priority === 'urgent' || t.priority === 'high').sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||''));
  const dueToday = open.filter(t => t.deadline && t.deadline.slice(0,10) === todayStr);
  return { open, urgent, dueToday };
}
function coachPlannerMessage(){
  const { open, urgent, dueToday } = coachPlannerData();
  if (!open.length) return `Ou pa gen tach ouvè kounye a — bon travay! 🎉`;
  if (urgent[0]) return `Ou gen <b>${open.length} tach</b> jodi a. Kòmanse ak sa ki pi ijan: <b>"${escapeHtml(urgent[0].title)}"</b>.`;
  if (dueToday.length) return `Ou gen <b>${dueToday.length} tach</b> ak dat limit jodi a.`;
  return `Ou gen <b>${open.length} tach</b> ouvè, men okenn pa ijan — planifye yo kalmman.`;
}

// ---- LEARNING TEACHER ----
function coachLearningTarget(){
  const courseKey = activeLearningCourseKey();
  const course = LEARNING_COURSES[courseKey];
  if (!course) return null;
  const flat = lcAllLessons(courseKey);
  const next = flat.find(l => !learning.completed.includes(lcLessonKey(courseKey, l.id)));
  return { courseKey, course, next };
}
function coachLearningMessage(){
  const t = coachLearningTarget();
  const streak = learning.streak || 0;
  if (!t || !t.next) return `Ou fini tout leson disponib yo pou kounye a — ekselan! Streak ou: <b>${streak} jou</b>.`;
  return `Pwochen defi ou nan <b>${escapeHtml(t.course.title)}</b>: <b>${escapeHtml(t.next.title)}</b>. Streak aprantisaj: <b>${streak} jou</b>.`;
}

// ---- FINANCIAL ANALYST ----
function coachFinanceInsight(){
  const spent = monthExpenseByCategory();
  const limits = budgets.limits || {};
  let worst = null, worstPct = 0;
  Object.keys(limits).forEach(c => {
    const pct = limits[c] ? (spent[c]||0) / limits[c] : 0;
    if (pct > worstPct){ worstPct = pct; worst = c; }
  });
  const totalExpense = Object.values(spent).reduce((s,v)=>s+v,0);
  return { spent, limits, worst, worstPct, totalExpense };
}
// ---- Kat Debi (USD): analiz separe paske li nan yon lòt diviz pase bidjè HTG yo ----
function coachDebitCardInsight(){
  const usdWallets = wallets.filter(w => walletCurrency(w) === 'USD');
  if (!usdWallets.length) return null;
  const ids = new Set(usdWallets.map(w => w.id));
  const usdTx = tx.filter(t => ids.has(t.walletId));
  const thisMonth = todayISO().slice(0,7);
  const lastMonthD = new Date(); lastMonthD.setMonth(lastMonthD.getMonth()-1);
  const lastMonth = lastMonthD.toISOString().slice(0,7);
  const spendThis = usdTx.filter(t=>t.type==='expense'&&t.date.slice(0,7)===thisMonth).reduce((s,t)=>s+t.amount,0);
  const spendLast = usdTx.filter(t=>t.type==='expense'&&t.date.slice(0,7)===lastMonth).reduce((s,t)=>s+t.amount,0);
  const balance = usdWallets.reduce((s,w)=>s+walletBalance(w),0);
  const byCat = {};
  usdTx.filter(t=>t.type==='expense'&&t.date.slice(0,7)===thisMonth).forEach(t => { byCat[t.category] = (byCat[t.category]||0) + t.amount; });
  const topCat = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0] || null;
  const avgDaily = spendThis / Math.max(1, new Date().getDate());
  return { balance, spendThis, spendLast, topCat, avgDaily };
}
function coachDebitCardMessage(){
  const d = coachDebitCardInsight();
  if (!d) return null;
  const parts = [];
  if (d.spendLast > 0 && d.spendThis > d.spendLast * 1.05){
    parts.push('Depans kat debi ou (USD) monte mwa sa a konpare ak mwa pase.');
  } else if (d.spendLast > 0 && d.spendThis < d.spendLast * 0.95){
    parts.push('Depans kat debi ou (USD) bese mwa sa a konpare ak mwa pase.');
  }
  if (d.topCat) parts.push(`Ou depanse ${fmtUSD(d.topCat[1])} sou ${escapeHtml(d.topCat[0])} mwa sa a.`);
  if (d.avgDaily > 0 && d.balance < d.avgDaily * 5){
    parts.push('Balans kat debi ou ka vin ba byento selon rit depans aktyèl ou.');
  }
  if (!parts.length) parts.push(`Balans kat debi ou (USD) kounye a: ${fmtUSD(d.balance)}.`);
  return parts.join(' ');
}
function coachFinanceMessage(){
  const { worst, worstPct, totalExpense } = coachFinanceInsight();
  let base;
  if (worst && worstPct >= 1) base = `Ou depase bidjè <b>${escapeHtml(worst)}</b> mwa sa a (${Math.round(worstPct*100)}%). Sijesyon: revize depans nan kategori sa a.`;
  else if (worst && worstPct >= 0.75) base = `Ou prèske rive nan limit bidjè <b>${escapeHtml(worst)}</b> (${Math.round(worstPct*100)}%) — fè atansyon.`;
  else base = `Depans mwa a se <b>${fmtHTG(totalExpense)}</b>, bidjè ou anba kontwòl. Kontinye konsa!`;
  const dc = coachDebitCardMessage();
  return dc ? `${base} ${dc}` : base;
}

// ---- GOAL ADVISOR ----
function coachGoalsInsight(){
  const todayStr = todayISO();
  const withProgress = goals.map(g => ({ g, pct: goalMilestoneProgress(g), late: g.deadline && g.deadline < todayStr }));
  const late = withProgress.filter(x => x.late && x.pct < 100);
  const soon = withProgress.filter(x => !x.late && x.g.deadline && x.g.deadline <= isoOffset(todayStr, 5) && x.pct < 100);
  return { withProgress, late, soon };
}
function coachGoalsMessage(){
  const { withProgress, late, soon } = coachGoalsInsight();
  if (!withProgress.length) return `Ou poko gen objektif — ajoute youn pou Coach AI ka swiv pwogrè w.`;
  if (late.length) return `Objektif <b>"${escapeHtml(late[0].g.title)}"</b> pase dat limit li — li lè pou reyaji.`;
  if (soon.length) return `Dat limit pou <b>"${escapeHtml(soon[0].g.title)}"</b> ap pwoche — li rive <b>${soon[0].pct}%</b>.`;
  const avg = Math.round(withProgress.reduce((s,x)=>s+x.pct,0)/withProgress.length);
  return `Objektif ou yo rive <b>${avg}%</b> an mwayèn. Kenbe pas la!`;
}

// ---- DAILY ASSISTANT (rezime maten) ----
function coachDailyBriefing(){
  const { dueToday, urgent } = coachPlannerData();
  const t = coachLearningTarget();
  const activePlan = getActivePlan();
  const planLeft = activePlan ? planDaysLeft(activePlan) : null;
  const habitsLeftToday = habits.filter(hb => !(hb.completions||[]).includes(todayISO()));
  const lines = [];
  lines.push({ icon:'check-square', color:'var(--blue)', text: dueToday.length ? `Fini ${dueToday.length} tach ki gen dat limit jodi a` : (urgent.length ? `Atake tach ijan: "${escapeHtml(urgent[0].title)}"` : `Pa gen tach ijan jodi a`) });
  if (t && t.next) lines.push({ icon:'graduation-cap', color:'var(--orange)', text:`Etidye 30 minit — pwochen leson: "${escapeHtml(t.next.title)}"` });
  lines.push({ icon:'wallet', color:'var(--green)', text:`Evite depans initil jodi a` });
  if (planLeft !== null) lines.push({ icon:'wifi', color: planLeft<=2 ? 'var(--red)':'var(--text-dim)', text: planLeft<=2 ? `Entènèt ap ekspire nan ${planLeft} jou` : `Entènèt ap la ${planLeft} jou ankò` });
  if (habitsLeftToday.length) lines.push({ icon:'flame', color:'var(--orange)', text:`Kenbe streak abitid ou — ${habitsLeftToday.length} rete jodi a` });
  return lines;
}

// ==========================================
// AI INSIGHTS — obsèvasyon entèlijan pa kategori
// (Pwodiktivite / Finans / Aprantisaj / Abitid)
// ==========================================
function coachProductivityInsight(){
  const done = tasks.filter(t => t.completedAt);
  if (done.length < 3) return `Fini plis tach pou AI ka detekte lè ou pi pwodiktif.`;
  const buckets = { maten:0, apremidi:0, swa:0 };
  done.forEach(t => {
    const h = new Date(t.completedAt).getHours();
    if (h >= 5 && h < 12) buckets.maten++;
    else if (h >= 12 && h < 18) buckets.apremidi++;
    else buckets.swa++;
  });
  const [best] = Object.entries(buckets).sort((a,b) => b[1]-a[1])[0];
  const label = { maten:'nan maten', apremidi:'nan aprèmidi', swa:'nan aswè' }[best];
  return `Ou pi pwodiktif <b>${label}</b> — se lè ou fini pifò nan tach ou yo.`;
}
function coachFinanceBiggestExpenseInsight(){
  const { spent } = coachFinanceInsight();
  const entries = Object.entries(spent).filter(([,v]) => v > 0);
  if (!entries.length) return `Ajoute depans pou AI ka analize pi gwo depans ou.`;
  entries.sort((a,b) => b[1]-a[1]);
  const [cat, amt] = entries[0];
  return `<b>${escapeHtml(cat)}</b> se pi gwo depans ou mwa sa a (${fmtHTG(amt)}).`;
}
function coachLearningPatternInsight(){
  if (!learning.completed.length) return `Kòmanse premye leson ou pou AI ka swiv règ aprantisaj ou.`;
  const streak = learning.streak || 0;
  const accuracy = learning.attempts ? Math.round((learning.correctAnswers||0)/learning.attempts*100) : null;
  if (streak >= 3) return `Ou aprann pi byen lè ou etidye chak jou — streak <b>${streak} jou</b> ba ou ${accuracy!==null ? accuracy+'% presizyon' : 'bon rezilta'}.`;
  return `Eseye etidye <b>chak jou</b> — sa ap amelyore presizyon ak retansyon ou.`;
}
function coachHabitsPatternInsight(){
  if (!habits.length) return `Ajoute abitid pou AI ka analize règ ou.`;
  const dayNames = ['Dimanch','Lendi','Madi','Mèkredi','Jedi','Vandredi','Samdi'];
  const todayStr = todayISO();
  const missByDow = [0,0,0,0,0,0,0], totalByDow = [0,0,0,0,0,0,0];
  for (let i=0;i<30;i++){
    const day = isoOffset(todayStr, -i);
    const dow = new Date(day+'T00:00:00').getDay();
    habits.forEach(hb => {
      totalByDow[dow]++;
      if (!(hb.completions||[]).includes(day)) missByDow[dow]++;
    });
  }
  let worstDow = 0, worstRate = -1;
  for (let d=0; d<7; d++){
    const rate = totalByDow[d] ? missByDow[d]/totalByDow[d] : 0;
    if (rate > worstRate){ worstRate = rate; worstDow = d; }
  }
  if (worstRate <= 0) return `Ou pa manke okenn abitid dènyèman — kontinye konsa! 🎉`;
  const isWeekend = worstDow === 0 || worstDow === 6;
  return isWeekend
    ? `Ou konn manke abitid ou yo pi souvan nan <b>wikenn</b> (${Math.round(worstRate*100)}% manke).`
    : `Ou konn manke abitid ou yo pi souvan <b>${dayNames[worstDow]}</b> (${Math.round(worstRate*100)}% manke).`;
}
const AI_INSIGHTS_DEFS = [
  { key:'productivity', label:'Pwodiktivite', icon:'zap',            color:'var(--blue)',   fn: coachProductivityInsight },
  { key:'finance',      label:'Finans',       icon:'wallet',         color:'var(--green)',  fn: coachFinanceBiggestExpenseInsight },
  { key:'learning',     label:'Aprantisaj',   icon:'graduation-cap', color:'var(--orange)', fn: coachLearningPatternInsight },
  { key:'habits',       label:'Abitid',       icon:'flame',          color:'var(--red)',    fn: coachHabitsPatternInsight },
];
function renderAiInsights(){
  const wrap = document.getElementById('aiInsightsGrid');
  if (!wrap) return;
  wrap.innerHTML = AI_INSIGHTS_DEFS.map(d => `
    <div class="insight-card">
      <div class="cat" style="color:${d.color}"><i data-lucide="${d.icon}"></i> ${d.label}</div>
      <div class="txt">${d.fn()}</div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

// ---- RENDER: Ekip Coach (4 ajan) ----
const COACH_AGENTS = [
  { key:'planner', role:'Personal Planner', title:'Planifikatè', icon:'calendar-check', color:'var(--blue)', msg: coachPlannerMessage, view:'tasks' },
  { key:'teacher', role:'Learning Teacher', title:'Pwofesè', icon:'graduation-cap', color:'var(--orange)', msg: coachLearningMessage, view:'learning' },
  { key:'analyst', role:'Financial Analyst', title:'Analis Finansye', icon:'trending-up', color:'var(--green)', msg: coachFinanceMessage, view:'finance' },
  { key:'advisor', role:'Goal Advisor', title:'Konseye Objektif', icon:'target', color:'var(--red)', msg: coachGoalsMessage, view:'goals' },
];
function renderCoachAgents(){
  const wrap = document.getElementById('coachAgentGrid');
  if (!wrap) return;
  wrap.innerHTML = COACH_AGENTS.map(a => `
    <div class="card coach-agent-card">
      <div class="coach-agent-head">
        <div class="ic" style="background:color-mix(in srgb, ${a.color} 16%, transparent);color:${a.color}"><i data-lucide="${a.icon}"></i></div>
        <div><b>${a.title}</b><div class="role">${a.role}</div></div>
      </div>
      <div class="coach-agent-body">${a.msg()}</div>
      <div class="coach-agent-cta" data-goto="${a.view}">Wè detay <i data-lucide="arrow-right"></i></div>
    </div>
  `).join('');
  wrap.querySelectorAll('[data-goto]').forEach(el => el.addEventListener('click', () => showView(el.dataset.goto)));
}

// ---- RENDER: Asistan Chak Jou (briefing) ----
function renderCoachDailyAssistant(){
  const bodyEl = document.getElementById('coachAssistantBody');
  const listEl = document.getElementById('coachAssistantList');
  const subEl = document.getElementById('coachAssistantSub');
  if (!bodyEl) return;
  const period = new Date().getHours() < 12 ? 'Bonjou' : (new Date().getHours() < 18 ? 'Bon apremidi' : 'Bonswa');
  subEl.textContent = `Prepare pou ou jodi a`;
  bodyEl.innerHTML = `${period} Wilguentz 👋 Men rezime jou a Coach AI prepare pou ou.`;
  listEl.innerHTML = coachDailyBriefing().map(l => `<div class="item"><i data-lucide="${l.icon}" style="color:${l.color}"></i> ${l.text}</div>`).join('');
  if (window.lucide) lucide.createIcons();
}

// ---- KONTÈKS AI: rezime JSON konpak (30-60 dènye jou) pou voye bay backend la ----
// JAMÈ kontni prive Notes/Journal konplè — sèlman metadata (dat, kantite) pou lòt modil yo.
function buildAiContext(){
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 45);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  return {
    today: todayISO(),
    tasks: tasks.filter(t => !t.completedAt || t.completedAt.slice(0,10) >= cutoffISO).slice(0, 60).map(t => ({
      id:t.id, title:t.title, priority:t.priority, category:t.category, status:t.status, deadline:t.deadline
    })),
    events: events.filter(e => e.date >= cutoffISO).slice(0, 40).map(e => ({
      id:e.id, title:e.title, date:e.date, time:e.time, category:e.category
    })),
    habits: habits.map(h => ({
      id:h.id, name:h.name, frequency:h.frequency, category:h.category,
      completionsRecent: (h.completions||[]).filter(d => d >= cutoffISO).length
    })),
    wallets: wallets.map(w => ({ id:w.id, name:w.name, type:w.type, balance: walletBalance(w) })),
    txRecent: tx.filter(t => t.date >= cutoffISO).slice(-80).map(t => ({
      id:t.id, type:t.type, amount:t.amount, category:t.category, date:t.date, walletId:t.walletId
    })),
    budgets: budgets,
    plans: plans.filter(p => (p.expireDate||'') >= cutoffISO).map(p => ({
      id:p.id, operator:p.operator, name:p.name, status:p.status, expireDate:p.expireDate
    })),
    projects: projects.map(p => ({
      id:p.id, name:p.name, status:p.status, deadline:p.deadline,
      tasksDone:(p.tasks||[]).filter(t=>t.done).length, tasksTotal:(p.tasks||[]).length
    })),
    healthLogsRecent: healthLogs.filter(h => h.date >= cutoffISO),
    goals: goals.map(g => {
      const rich = typeof buildGoalAIContext === 'function' ? buildGoalAIContext(g.id) : null;
      return {
        id:g.id, title:g.title, type:g.type, priority:g.priority, deadline:g.deadline, progress: goalMilestoneProgress(g),
        // Pati 50/50 — Goal la bay AI Coach la kontèks konplè li (Habits lye,
        // Finans, Aprantisaj, Pwojè, pwochen aksyon) chak fwa `buildAiContext()`
        // rele, san okenn chanjman sou fòma ansyen chan yo pi wo a.
        connectedHabits: rich ? rich.connectedHabits : [],
        financial: rich ? rich.financial : null,
        learning: rich ? rich.learning : null,
        project: rich ? rich.project : null,
        nextAction: rich ? rich.nextAction : null
      };
    }),
    learning: { xp:learning.xp||0, streak:learning.streak||0, completedCount:(learning.completed||[]).length },
    dataUsage: (() => {
      const active = getActivePlan();
      if (!active || active.isUnlimited) return null;
      const logs = dataUsageLogs.filter(l => l.planId === active.id);
      const byApp = {};
      logs.forEach(l => {
        if (!byApp[l.app]) byApp[l.app] = { minutes:0, mb:0 };
        byApp[l.app].minutes += l.minutes || 0;
        byApp[l.app].mb += l.mbUsed || 0;
      });
      return { mbRemainingLatest: logs.length ? logs[logs.length-1].mbRemaining : null, byApp };
    })(),
    lifeScore: { totalXP: totalLifeXP(), categories: CATEGORIES.map(c => ({ key:c.key, label:c.label, value:c.value })) }
  };
}

// ==========================================
// KONTÈKS AI PA OBJEKTIF (Pati 43/50)
// Prepare yon objè JSON estriktire pou YON SÈL Goal, pou itilizasyon fiti pa
// AI Coach. PA jenere repons AI, PA gen rekòmandasyon fikse — tout valè yo
// kalkile an dirèk apati done ki egziste deja (goalMilestoneProgress,
// computeGoalFinancialProgressPct, computeGoalLearningProgress,
// getHabitsForGoal, elt.). Pa touche buildAiContext() ni okenn lòt pati nan
// achitekti Coach AI a — se yon fonksyon separe, pa gen okenn wiring nan
// coachCallBackend oswa nan lòt kote.
// ==========================================
function buildGoalAIContext(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return null;

  const progressPct = goalMilestoneProgress(g);

  // ---- Abitid Konekte ----
  const connectedHabits = getHabitsForGoal(g.id).map(h => ({
    id: h.id,
    name: h.name,
    frequency: h.frequency,
    completionsTotal: (h.completions || []).length
  }));

  // ---- Pwogrè Finansye (sèlman si se yon Objektif Finansye) ----
  const financial = g.isFinancial ? {
    estimatedValue: Number(g.estimatedValue) || 0,
    currentSavings: Number(g.currentSavings) || 0,
    remaining: computeGoalFinancialRemaining(g),
    progressPct: computeGoalFinancialProgressPct(g)
  } : null;

  // ---- Pwogrè Aprantisaj (sèlman si gen Kou lye) ----
  let learningCtx = null;
  if (Array.isArray(g.linkedLearningCourses) && g.linkedLearningCourses.length){
    const validKeys = g.linkedLearningCourses.filter(k => LEARNING_COURSES[k]);
    const courses = validKeys.map(k => {
      const course = LEARNING_COURSES[k];
      const prog = courseProgress(k);
      const flat = lcAllLessons(k);
      const nextLesson = flat.find(l => !learning.completed.includes(lcLessonKey(k, l.id)));
      return {
        courseKey: k,
        courseTitle: course.title,
        progressPct: prog.pct,
        lessonsDone: prog.done,
        lessonsTotal: prog.total,
        nextLessonTitle: nextLesson ? nextLesson.title : null
      };
    });
    if (courses.length){
      learningCtx = { courses, overallProgressPct: computeGoalLearningProgress(g.id) };
    }
  }

  // ---- Estati Pwojè (lyen envès p.goalId, Pati 32/50) ----
  const linkedProject = projects.find(p => p.goalId === g.id);
  const projectCtx = linkedProject ? {
    id: linkedProject.id,
    name: linkedProject.name,
    status: linkedProject.status,
    tasksDone: (linkedProject.tasks || []).filter(t => t.done).length,
    tasksTotal: (linkedProject.tasks || []).length
  } : null;

  // ---- Pwochen Aksyon: DERIVE apati done reyèl, pa yon tèks fikse ----
  let nextAction = null;
  const nextOpenMilestone = (g.milestones || []).find(m => !m.done);
  if (nextOpenMilestone){
    nextAction = nextOpenMilestone.text;
  } else if (learningCtx){
    const courseWithNext = learningCtx.courses.find(c => c.nextLessonTitle);
    if (courseWithNext) nextAction = courseWithNext.nextLessonTitle;
  } else if (financial && financial.remaining > 0){
    nextAction = `Sere ${financial.remaining} ${financial.remaining === financial.estimatedValue ? '' : 'ankò'}`.trim();
  }

  return {
    goalId: g.id,
    goalName: g.title,
    category: g.category || null,
    categoryLabel: GOAL_CATEGORY[g.category] || g.category || null,
    status: g.status,
    progressPct,
    targetDate: g.deadline || null,
    connectedHabits,
    financial,
    learning: learningCtx,
    project: projectCtx,
    nextAction
  };
}

// ==========================================
// ESTATISTIK PA OBJEKTIF (Pati 44/50)
// Prepare done estatistik pou Goals — pa gen nouvo grafik, pa touche
// computeStats()/renderStatisticsView() ni okenn lòt pati nan modil
// Estatistik ki egziste a. Sèvi ak fonksyon/chan ki deja egziste sèlman
// (goalMilestoneProgress, getHabitsForGoal, computeGoalFinancialProgressPct,
// computeGoalLearningProgress, computeGoalDeadlineTracking,
// g.habitProgressHistory).
// ==========================================

// ---- Estatistik pou YON SÈL Objektif (fòma egzanp: Pwogrè/Sere/Kontribisyon Abitid/Tan Ki Rete) ----
function buildGoalStatisticsFor(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return null;

  const progressPct = goalMilestoneProgress(g);

  // Kontribisyon Abitid: total konplesyon TOUT Abitid ki lye ak Objektif la
  const linkedHabits = getHabitsForGoal(g.id);
  const habitContributionCount = linkedHabits.reduce((s, h) => s + (h.completions || []).length, 0);

  // Lajan sere (sèlman si se yon Objektif Finansye)
  const moneySaved = g.isFinancial ? (Number(g.currentSavings) || 0) : null;

  // Kontribisyon Aprantisaj (null si pa gen Kou lye)
  const learningProgressPct = computeGoalLearningProgress(g.id);

  // Tan ki rete (reyitilize menm lojik ak computeGoalDeadlineTracking, Pati 36)
  const deadlineInfo = g.deadline ? computeGoalDeadlineTracking(g) : null;

  return {
    goalId: g.id,
    goalName: g.title,
    status: g.status,
    progressPct,
    moneySaved,
    habitContributionCount,
    learningProgressPct,
    daysRemaining: deadlineInfo ? deadlineInfo.daysRemaining : null
  };
}

// ---- Rezime estatistik sou TOUT Objektif yo ----
function buildGoalStatistics(){
  const total = goals.length;
  const completed = goals.filter(g => g.status === 'completed');
  const failed = goals.filter(g => g.status === 'failed');
  const archived = goals.filter(g => g.status === 'archived' || g.status === 'paused');
  const active = goals.filter(g => !completed.includes(g) && !failed.includes(g) && !archived.includes(g));

  // Tan mwayèn pou konplete: pou chak Objektif konplete, chèche premye antre
  // nan g.habitProgressHistory kote pct >= 100 (premye moman li te reyèlman
  // rive 100%). Si pa gen antre konsa (pwogrè te fikse manyèlman san pase
  // nan sistèm swiv la), Objektif sa a pa antre nan mwayèn nan — pa gen
  // estimasyon envante.
  const completionDurations = [];
  completed.forEach(g => {
    if (!g.createdAt) return;
    const history = Array.isArray(g.habitProgressHistory) ? g.habitProgressHistory : [];
    const firstAt100 = history.find(r => r.pct >= 100);
    if (!firstAt100) return;
    const start = new Date(g.createdAt);
    const end = new Date(firstAt100.time || (firstAt100.date + 'T00:00:00'));
    const days = Math.round((end - start) / 86400000);
    if (days >= 0) completionDurations.push(days);
  });
  const avgCompletionDays = completionDurations.length
    ? Math.round(completionDurations.reduce((a,b) => a+b, 0) / completionDurations.length)
    : null;

  // Evolisyon pwogrè: mwayèn pwogrè tout Objektif yo pa dat, apati
  // g.habitProgressHistory (sous done ki deja egziste, pa nouvo sistèm)
  const byDate = {};
  goals.forEach(g => {
    (g.habitProgressHistory || []).forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r.pct);
    });
  });
  const progressEvolution = Object.keys(byDate).sort().map(date => ({
    date,
    avgProgressPct: Math.round(byDate[date].reduce((a,b) => a+b, 0) / byDate[date].length)
  }));

  return {
    totalGoals: total,
    completedGoals: completed.length,
    activeGoals: active.length,
    failedGoals: failed.length,
    avgCompletionDays,               // null si pa gen ase done swiv pou kalkile l
    completionDurationsSampleSize: completionDurations.length,
    progressEvolution,               // [{date, avgProgressPct}]
    perGoal: goals.map(g => buildGoalStatisticsFor(g.id))
  };
}

// ==========================================
// DONE ACHIEVEMENT PA OBJEKTIF (Pati 45/50)
// PA kreye yon nouvo sistèm Achievement, PA touche ACHIEVEMENT_DEFS,
// checkAchievements() ni renderAchievementsView() ki egziste deja.
// GOAL_ACHIEVEMENT_DEFS se yon lis SEPARE, menm fòma ak ACHIEVEMENT_DEFS
// (id/label/desc/icon/color/progress()/target) + yon chan adisyonèl
// `relatedGoal()` ki idantifye Objektif spesifik ki lakòz/ki ka lakòz
// deblokaj la. Pa gen wiring nan `checkAchievements()` — se done pare
// pou yon fiti entegrasyon.
// ==========================================
function firstCreatedGoal(list){
  const arr = (list || goals).filter(g => g.createdAt);
  if (!arr.length) return null;
  return arr.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
}

const GOAL_ACHIEVEMENT_DEFS = [
  { id:'ga1', cat:'goals', label:'Premye Objektif', desc:'Kreye premye Objektif ou', icon:'target', color:'var(--blue)',
    progress: () => goals.length, target: 1,
    relatedGoal: () => { const g = firstCreatedGoal(goals); return g ? { id:g.id, title:g.title } : null; } },

  { id:'ga2', cat:'goals', label:'Premye Abitid Lye', desc:'Konekte yon Abitid ak yon Objektif pou premye fwa', icon:'link-2', color:'var(--green)',
    progress: () => habits.filter(h => h.goalId).length, target: 1,
    relatedGoal: () => {
      const h = habits.find(x => x.goalId);
      if (!h) return null;
      const g = goals.find(x => x.id === h.goalId);
      return g ? { id:g.id, title:g.title, habitId:h.id, habitName:h.name } : null;
    } },

  { id:'ga3', cat:'goals', label:'Premye Objektif Konplete', desc:'Konplete premye Objektif ou', icon:'trophy', color:'var(--orange)',
    progress: () => goals.filter(g => g.status === 'completed').length, target: 1,
    relatedGoal: () => { const g = firstCreatedGoal(goals.filter(g => g.status === 'completed')); return g ? { id:g.id, title:g.title } : null; } },

  { id:'ga4', cat:'goals', label:'Premye Objektif Finansye Konplete', desc:'Konplete premye Objektif Finansye ou', icon:'piggy-bank', color:'var(--green)',
    progress: () => goals.filter(g => g.isFinancial && g.status === 'completed').length, target: 1,
    relatedGoal: () => { const g = firstCreatedGoal(goals.filter(g => g.isFinancial && g.status === 'completed')); return g ? { id:g.id, title:g.title } : null; } },

  { id:'ga5', cat:'goals', label:'Premye Objektif Aprantisaj Konplete', desc:'Konplete premye Objektif ki lye ak Aprantisaj', icon:'graduation-cap', color:'var(--orange)',
    progress: () => goals.filter(g => Array.isArray(g.linkedLearningCourses) && g.linkedLearningCourses.length && g.status === 'completed').length, target: 1,
    relatedGoal: () => {
      const g = firstCreatedGoal(goals.filter(g => Array.isArray(g.linkedLearningCourses) && g.linkedLearningCourses.length && g.status === 'completed'));
      return g ? { id:g.id, title:g.title } : null;
    } },

  { id:'ga6', cat:'goals', label:'Premye Objektif Pwojè Konplete', desc:'Konplete premye Objektif ki lye ak yon Pwojè', icon:'folder-kanban', color:'var(--blue)',
    progress: () => goals.filter(g => g.status === 'completed' && projects.some(p => p.goalId === g.id)).length, target: 1,
    relatedGoal: () => {
      const g = firstCreatedGoal(goals.filter(g => g.status === 'completed' && projects.some(p => p.goalId === g.id)));
      if (!g) return null;
      const proj = projects.find(p => p.goalId === g.id);
      return { id:g.id, title:g.title, projectId: proj ? proj.id : null, projectName: proj ? proj.name : null };
    } },
];

// Rezoud yon "snapshot" aktyèl pou tout GOAL_ACHIEVEMENT_DEFS — done sèlman,
// pa gen okenn efè bò kote (pa persiste, pa afiche toast, pa touche
// unlockedAchievements). Fòma sòti a swiv egzanp la: label/desc kòm
// "Condition", progress/target kòm "x/y".
function buildGoalAchievementData(){
  return GOAL_ACHIEVEMENT_DEFS.map(a => {
    const progress = Math.min(a.progress(), a.target);
    return {
      id: a.id,
      label: a.label,
      condition: a.desc,
      icon: a.icon,
      color: a.color,
      progress,
      target: a.target,
      unlocked: progress >= a.target,
      relatedGoal: a.relatedGoal ? a.relatedGoal() : null
    };
  });
}

// ==========================================
// MOTÈ SENKWONIZASYON OTOMATIK POU GOAL (Pati 46/50)
// Yon kouch KONEKSYON ki "koute" chanjman ki gen rapò ak Goal, epi ki
// PREPARE (san aplike/san modifye) yon pakè mizajou pou chak modil konekte.
// - PA REEKRI okenn modil ki egziste deja: pou chak modil ki gen deja yon
//   fonksyon ki "posede" senkwonizasyon reyèl la (ex: syncGoalCalendarEvents
//   pou Calendar, syncGoalLearningProgress pou Learning), motè a SÈLMAN site
//   non fonksyon sa a (`ownedBy`) — li pa kopye lojik la.
// - PA KREYE DONE DOUBLE: pou modil ki deja gen yon fonksyon "read" pi
//   (goalMilestoneProgress, computeGoalHabitProgress, elt.), motè a rele
//   fonksyon sa a dirèkteman olye rekalkile menm bagay la yon lòt jan.
// - Chak modil rete ENDEPANDAN: motè a pa janm modifye `habits`, `tx`,
//   `events`, `projects`, `budgets` — li sèlman LI epi retounen yon rezime.
// - Motè a PA otomatikman "wire" nan persistHabits()/persistTx()/elt. ki
//   egziste deja — se yon estrikti pare, pa yon rekonstriksyon achitekti a.
// ==========================================

// Chak antre dekri: `owns` = non fonksyon ki reyèlman posede/aplike
// senkwonizasyon an pou modil sa a (si genyen — null si se yon pakè
// "done prepare" san okenn efè bò kote), ak `read(g)` = fonksyon ki
// LI (san modifye) done aktyèl yo pou prepare pakè a.
const GOAL_SYNC_MODULES = {
  habits: {
    owns: null, // pa gen yon sèl fonksyon "apply" — Habit rete pwòp done l, Goal LI sèlman
    read: g => computeGoalHabitProgress(g.id)
  },
  finance: {
    owns: null,
    read: g => g.isFinancial ? computeGoalFinanceSyncStatus(g.id) : null
  },
  calendar: {
    owns: 'syncGoalCalendarEvents', // fonksyon sa a deja egziste e li rete responsab aplike chanjman an
    read: g => ({ hasDeadline: !!g.deadline, deadlineDate: g.deadline || null })
  },
  learning: {
    owns: 'syncGoalLearningProgress',
    read: g => computeGoalLearningProgress(g.id)
  },
  projects: {
    owns: 'syncProjectStatusFromGoal',
    read: g => { const p = projects.find(x => x.goalId === g.id); return p ? { id:p.id, name:p.name, status:p.status } : null; }
  },
  budget: {
    // Pa gen fonksyon Budget<->Goal ki egziste ankò — nou SÈLMAN prepare yon
    // apèsi (pa gen chan nouvo sou `budgets`, pa gen ekriti okenn kote)
    owns: null,
    read: g => (g.isFinancial && g.monthlySavingPlan) ? {
      suggestedMonthlyAmount: Number(g.monthlySavingPlan) || 0,
      remaining: computeGoalFinancialRemaining(g)
    } : null
  },
  statistics: {
    owns: null,
    read: g => buildGoalStatisticsFor(g.id) // Pati 44/50
  },
  achievements: {
    owns: null,
    read: g => buildGoalAchievementData().filter(a => a.relatedGoal && a.relatedGoal.id === g.id) // Pati 45/50
  },
  aiContext: {
    owns: null,
    read: g => buildGoalAIContext(g.id) // Pati 43/50
  }
};

// ---- Prepare yon pakè mizajou konplè pou YON chanjman sou YON Objektif ----
// `sourceModule` se non modil ki lakòz chanjman an (ex: 'habits'), jis pou
// rekò/detekte bouk — motè a pa itilize l pou fè okenn ekriti.
function prepareGoalSyncUpdate(goalId, sourceModule){
  const g = goals.find(x => x.id === goalId);
  if (!g) return null;
  const preparedUpdates = {};
  Object.keys(GOAL_SYNC_MODULES).forEach(key => {
    const mod = GOAL_SYNC_MODULES[key];
    let data = null;
    try { data = mod.read(g); } catch(e) { data = null; }
    preparedUpdates[key] = { ownedBy: mod.owns, data };
  });
  return {
    goalId: g.id,
    goalName: g.title,
    sourceModule: sourceModule || null,
    preparedAt: new Date().toISOString(),
    preparedUpdates
  };
}

// ---- Kouch "koute" (pub/sub) — estrikti pou konekte chanjman pi devan ----
// Rejis obsèvatè: nenpòt pati nan app la ka anrejistre yon callback ki pral
// resevwa pakè `prepareGoalSyncUpdate(...)` la chak fwa `emitGoalSync` rele.
// PA gen okenn `persist*` egzistan ki rele `emitGoalSync` kounye a — se yon
// estrikti pare, konekte l se yon travay pou yon lòt Pati pi presi sou
// chak sit deklanchman.
const _goalSyncListeners = [];
function onGoalSync(callback){
  if (typeof callback === 'function') _goalSyncListeners.push(callback);
}
function emitGoalSync(goalId, sourceModule){
  const update = prepareGoalSyncUpdate(goalId, sourceModule);
  if (!update) return null;
  _goalSyncListeners.forEach(cb => { try { cb(update); } catch(e) { /* yon obsèvatè pa dwe kraze lòt yo */ } });
  return update;
}

// ==========================================
// PWOTEKSYON ENTEGRITE DONE GOAL (Pati 47/50)
// Kouch VALIDASYON: fonksyon PUR (san efè bò kote, pa modifye/pa efase
// okenn done) ki detekte doublon ak koneksyon kase AVAN yon chanjman sove.
// - PA CHANJE okenn modil ki egziste deja (recordGoalHabitProgressHistory,
//   recordGoalFinancialContributionHistory, syncGoalAutoStatus, elt. rete
//   egzakteman jan yo te ye a) — fonksyon anba yo se GADFEN adisyonèl, pare
//   pou rele AVAN yon "save", pa yon ranplasman.
// - PA EFASE okenn done itilizatè: yo sèlman DETEKTE e RAPÒTE pwoblèm
//   (issues[]), yo pa janm touche `goals`/`habits`/`tx`/`events`.
// ==========================================

// ---- 1) Doublon Pwogrè Goal ----
// Mirè menm règ ki deja egziste nan recordGoalHabitProgressHistory (menm
// dat + menm pct = doublon), men ekspoze kòm yon chèk REYITILIZAB pou
// nenpòt kalite mizajou pwogrè (pa sèlman sa ki soti nan Abitid).
function isDuplicateGoalProgressUpdate(goalId, newPct){
  const g = goals.find(x => x.id === goalId);
  if (!g) return { duplicate:false, reason:'goal-not-found' };
  const history = Array.isArray(g.habitProgressHistory) ? g.habitProgressHistory : [];
  const last = history[history.length - 1];
  if (last && last.date === todayISO() && last.pct === newPct){
    return { duplicate:true, reason:'menm pwogrè deja anrejistre jodi a', lastEntry:last };
  }
  return { duplicate:false };
}

// ---- 2) Doublon Kontribisyon Abitid ----
// Reyitilize menm sous verite ak g.habitContributions[habitId].processedDates
// (Pati 20/50) — pa gen nouvo chan, pa gen nouvo dosye.
function isDuplicateHabitContribution(goalId, habitId, date){
  const g = goals.find(x => x.id === goalId);
  if (!g || !g.habitContributions || !g.habitContributions[habitId]){
    return { duplicate:false };
  }
  const processedDates = g.habitContributions[habitId].processedDates || [];
  const d = date || todayISO();
  return processedDates.includes(d)
    ? { duplicate:true, reason:`Abitid sa a deja trete pou dat ${d}` }
    : { duplicate:false };
}

// ---- 3) Doublon Aksyon Finansye ----
// Mirè menm gad kont doublon ki deja nan recordGoalFinancialContributionHistory
// (menm goalId + menm habitId + menm dat).
function isDuplicateFinancialContribution(goalId, habitId, date){
  const g = goals.find(x => x.id === goalId);
  if (!g) return { duplicate:false };
  const history = Array.isArray(g.habitProgressHistory) ? g.habitProgressHistory : [];
  const d = date || todayISO();
  const found = history.some(r =>
    r.source === 'saving-habit-completed' && r.goalId === goalId && r.habitId === habitId && r.date === d
  );
  return found ? { duplicate:true, reason:'kontribisyon finansye sa a deja anrejistre jodi a pou menm Abitid la' } : { duplicate:false };
}

// ---- 4) Koneksyon Modil Kase (referans ki pwente sou done ki pa egziste ankò) ----
// Sèlman DETEKTE — pa efase, pa "netwaye" otomatikman (kontrèman ak
// cleanDanglingGoalDependencies ki deja egziste pou dependsOn sèlman).
function findBrokenGoalConnections(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return { goalId, issues:[{ type:'goal-not-found' }] };
  const issues = [];

  (g.linkedHabitIds || []).forEach(habitId => {
    if (!habits.some(h => h.id === habitId)) issues.push({ type:'dangling-habit-link', habitId });
  });

  if (g.links){
    Object.keys(g.links).forEach(linkType => {
      (g.links[linkType] || []).forEach(id => {
        const exists =
          (linkType === 'habitIds' && habits.some(h => h.id === id)) ||
          (linkType === 'financeIds' && tx.some(t => t.id === id)) ||
          (linkType === 'calendarIds' && events.some(e => e.id === id)) ||
          (linkType === 'learningIds' && !!id) || // referans jeneriks, pa gen lis santralize pou valide kont
          (linkType === 'projectIds' && projects.some(p => p.id === id));
        if (!exists) issues.push({ type:'dangling-link', linkType, id });
      });
    });
  }

  (g.linkedLearningCourses || []).forEach(courseKey => {
    if (!LEARNING_COURSES[courseKey]) issues.push({ type:'dangling-learning-course', courseKey });
  });

  if (g.walletId && !wallets.some(w => w.id === g.walletId)){
    issues.push({ type:'dangling-wallet-ref', walletId: g.walletId });
  }

  (g.dependsOn || []).forEach(depId => {
    if (!goals.some(x => x.id === depId)) issues.push({ type:'dangling-dependency', depId });
  });

  if (g.habitContributions){
    Object.keys(g.habitContributions).forEach(habitId => {
      if (!habits.some(h => h.id === habitId)) issues.push({ type:'orphan-habit-contribution', habitId });
    });
  }

  return { goalId, issues };
}

// ---- 5) Chanjman Estati Envalid ----
// Sèvi ak menm sous verite ak computeAutoGoalStatus (Pati 41/50): yon
// Objektif pa dwe vin 'completed' si pwogrè reyèl li poko rive 100%.
function isValidGoalStatusChange(goalId, newStatus){
  if (!GOAL_STATUS[newStatus]) return { valid:false, reason:`estati "${newStatus}" pa egziste` };
  const g = goals.find(x => x.id === goalId);
  if (!g) return { valid:false, reason:'goal-not-found' };
  const realPct = goalRealProgressForStatus(g);
  if (newStatus === 'completed' && realPct < 100){
    return { valid:false, reason:`pa ka make 'completed' — pwogrè reyèl la se ${realPct}%, pa 100%` };
  }
  if ((g.status === 'archived') && newStatus !== 'archived' && !g.autoStatus){
    // Soti nan Achive se yon aksyon eksplisit — nou pa bloke l, nou jis
    // siyale l pou konfimasyon (pa yon efas, jis yon mak "atansyon")
    return { valid:true, warning:'Objektif la t ap Achive — konfime w vle re-aktive l' };
  }
  return { valid:true };
}

// ---- 6) Rapò Entegrite Konplè pou YON Objektif ----
// Kombine tout chèk anwo yo (san mizajou pwogrè/kontribisyon espesifik pou
// teste, sa yo rele apa lè yon aksyon presi ap prepare).
function runGoalIntegrityCheck(goalId){
  const connections = findBrokenGoalConnections(goalId);
  return {
    goalId,
    checkedAt: new Date().toISOString(),
    brokenConnections: connections.issues,
    safe: connections.issues.length === 0
  };
}

// ---- AKSYON: fonksyon ki egzekite règ*/persist* ki deja egziste yo apre konfimasyon itilizatè a ----
function coachRefreshView(viewName){
  const el = document.getElementById('view-' + viewName);
  if (!el || el.hidden) return;
  if (viewName === 'tasks') renderTasks();
  else if (viewName === 'calendar') renderCalendar();
  else if (viewName === 'habits') renderHabits();
  else if (viewName === 'finance') renderFinance();
  else if (viewName === 'goals') renderGoals();
}
const COACH_ACTIONS = {
  createTask(p){
    tasks.push({ id:uid(), title:(p.title||'Nouvo tach').slice(0,140), description:p.description||'', priority:['low','medium','high','urgent'].includes(p.priority)?p.priority:'medium',
      category:p.category||'Jeneral', tags:[], deadline:p.deadline||'', reminder:{enabled:false}, subtasks:[], attachments:[], notes:'',
      status:'planned', recurring:{enabled:false,freq:'weekly'}, createdAt:new Date().toISOString(), completedAt:null });
    persistTasks(); coachRefreshView('tasks');
  },
  createTransaction(p){
    const wallet = wallets.find(w => w.id === p.walletId) || wallets[0];
    if (!wallet) throw new Error('Pa gen kont');
    tx.push({ id:uid(), type:p.type==='income'?'income':'expense', amount: Math.max(0, Number(p.amount)||0),
      description:p.description||'', category:p.category||'Jeneral', walletId:wallet.id,
      date:p.date||todayISO(), time:new Date().toTimeString().slice(0,5) });
    persistTx(); coachRefreshView('finance');
  },
  createHabit(p){
    habits.push({ id:uid(), name:(p.name||'Nouvo abitid').slice(0,80), description:p.description||'',
      frequency:p.frequency||'daily', reminder:false, category:p.category||'Jeneral', goal:p.goal||'',
      completions:[], createdAt:new Date().toISOString() });
    persistHabits(); coachRefreshView('habits');
  },
  createGoal(p){
    goals.push({ id:uid(), title:(p.title||'Nouvo objektif').slice(0,120), desc:p.description||'',
      type:p.type||'medium', priority:p.priority||'medium', deadline:p.deadline||'', progress:0,
      milestones:[], createdAt:new Date().toISOString() });
    persistGoals(); coachRefreshView('goals');
  },
  createEvent(p){
    events.push({ id:uid(), title:(p.title||'Nouvo evènman').slice(0,140), description:p.description||'',
      date:p.date||todayISO(), time:p.time||'09:00', location:p.location||'', category:p.category||'general',
      reminder:{enabled:false}, recurrence:'none' });
    persistEvents(); coachRefreshView('calendar');
  }
};

// ---- CHAT: mesaj, entegrasyon backend AI, ak deteksyon entansyon lokal (fallback) ----
function coachAddMessage(role, text, action){
  const msg = { role, text, time: Date.now() };
  if (action) { msg.action = action; msg.actionStatus = 'pending'; }
  coachChat.push(msg);
  if (coachChat.length > 40) coachChat = coachChat.slice(-40);
  persistCoachChat();
  renderCoachChatMessages();
}
function coachFormatAiText(raw){
  let s = escapeHtml(String(raw == null ? '' : raw));
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  s = s.replace(/\n/g, '<br>');
  return s;
}
function renderCoachActionCard(m, i){
  if (m.actionStatus === 'done') return `<div class="coach-action-card done"><i data-lucide="check-circle-2"></i> Aksyon fèt: ${escapeHtml(m.action.summary || m.action.type)}</div>`;
  if (m.actionStatus === 'cancelled') return `<div class="coach-action-card cancelled"><i data-lucide="x-circle"></i> Aksyon anile</div>`;
  return `<div class="coach-action-card">
      <div class="coach-action-summary"><i data-lucide="zap"></i> ${escapeHtml(m.action.summary || m.action.type)}</div>
      <div class="coach-action-btns">
        <button class="btn btn-ghost" data-coach-cancel="${i}">Anile</button>
        <button class="btn btn-primary" data-coach-confirm="${i}">Konfime</button>
      </div>
    </div>`;
}
function coachConfirmAction(i){
  const m = coachChat[i];
  if (!m || !m.action || m.actionStatus !== 'pending') return;
  const fn = COACH_ACTIONS[m.action.type];
  try{
    if (fn){ fn(m.action.params || {}); m.actionStatus = 'done'; showToast('Aksyon fèt ✓'); }
    else { m.actionStatus = 'cancelled'; }
  }catch(e){ console.error('Coach action error', e); m.actionStatus = 'cancelled'; showToast('Erè pandan aksyon an'); }
  persistCoachChat();
  renderCoachChatMessages();
}
function coachCancelAction(i){
  const m = coachChat[i];
  if (!m || !m.action || m.actionStatus !== 'pending') return;
  m.actionStatus = 'cancelled';
  persistCoachChat();
  renderCoachChatMessages();
}
function renderCoachChatMessages(){
  const body = document.getElementById('coachChatBody');
  if (!body) return;
  if (!coachChat.length){
    coachChat = [{ role:'ai', text:`Bonjou Wilguentz 👋 Mwen se Coach AI ou. Mande m sou tach, lajan, aprantisaj oswa objektif ou.`, time: Date.now() }];
  }
  body.innerHTML = coachChat.map((m, i) => `
    <div class="coach-msg ${m.role === 'user' ? 'user' : 'ai'}">
      <div class="avatar"><i data-lucide="${m.role === 'user' ? 'user' : 'sparkles'}"></i></div>
      <div class="bubble">${m.text}${m.action ? renderCoachActionCard(m, i) : ''}</div>
    </div>
  `).join('');
  body.querySelectorAll('[data-coach-confirm]').forEach(btn => btn.addEventListener('click', () => coachConfirmAction(parseInt(btn.dataset.coachConfirm, 10))));
  body.querySelectorAll('[data-coach-cancel]').forEach(btn => btn.addEventListener('click', () => coachCancelAction(parseInt(btn.dataset.coachCancel, 10))));
  body.scrollTop = body.scrollHeight;
  if (window.lucide) lucide.createIcons();
}
function coachShowTyping(){
  const body = document.getElementById('coachChatBody');
  if (!body || document.getElementById('coachTypingRow')) return;
  const row = document.createElement('div');
  row.className = 'coach-msg ai';
  row.id = 'coachTypingRow';
  row.innerHTML = `<div class="avatar"><i data-lucide="sparkles"></i></div><div class="bubble">···</div>`;
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
  if (window.lucide) lucide.createIcons();
}
function coachHideTyping(){
  const row = document.getElementById('coachTypingRow');
  if (row) row.remove();
}
// Repons lokal règ/regex — sèvi kòm FALLBACK otomatik si backend pa reponn
function coachDataUsageMessage(){
  const active = getActivePlan();
  if (!active) return `Ou pa gen plan entènèt aktif kounye a.`;
  if (active.isUnlimited) return `Plan ou a ilimite, kidonk pa gen bezwen swiv MB.`;
  const logs = dataUsageLogs.filter(l => l.planId === active.id);
  if (!logs.length) return `Ou poko anrejistre okenn itilizasyon done. Ale nan Plan Entènèt pou kòmanse swiv li.`;
  const byApp = {};
  logs.forEach(l => {
    if (!byApp[l.app]) byApp[l.app] = { minutes:0, mb:0 };
    byApp[l.app].minutes += l.minutes || 0;
    byApp[l.app].mb += l.mbUsed || 0;
  });
  const rows = Object.entries(byApp);
  const topTime = rows.slice().sort((a,b) => b[1].minutes - a[1].minutes)[0];
  const topMb = rows.slice().sort((a,b) => b[1].mb - a[1].mb)[0];
  return `App ou plis pase tan ladan l se <b>${escapeHtml(topTime[0])}</b> (${topTime[1].minutes} min), e app ki manje plis done se <b>${escapeHtml(topMb[0])}</b> (${Math.round(topMb[1].mb)} MB).`;
}
function coachRespond(raw){
  const q = raw.toLowerCase();
  if (/tach|travay|priyorite|jodi/.test(q)) return coachPlannerMessage();
  if (/aprann|etid|leson|kou\b/.test(q)) return coachLearningMessage();
  if (/lajan|finans|depans|bidjè|kòb/.test(q)) return coachFinanceMessage();
  if (/objektif|goal/.test(q)) return coachGoalsMessage();
  if (/abitid|streak/.test(q)){
    const left = habits.filter(hb => !(hb.completions||[]).includes(todayISO()));
    return left.length ? `Ou poko fè <b>${left.length} abitid</b> jodi a: ${left.map(h=>escapeHtml(h.name)).join(', ')}.` : `Ou fè tout abitid ou jodi a 🎉`;
  }
  if (/ki app|kilès app|app.*(plis|itilize)|itilizasyon done/.test(q)) return coachDataUsageMessage();
  if (/entènèt|plan|data/.test(q)){
    const p = getActivePlan();
    return p ? `Plan <b>${escapeHtml(p.name)}</b> ou ap fini nan <b>${planDaysLeft(p)} jou</b>.` : `Ou pa gen plan entènèt aktif kounye a.`;
  }
  if (/mèsi|bon travay|ok/.test(q)) return `Avèk plezi Wilguentz! Mwen la pou ede w rete sou pis la. 💪`;
  return `Mwen ka ede w ak tach, aprantisaj, lajan, objektif oswa abitid ou. Poze m yon kesyon sou youn nan sa yo.`;
}
// Rele backend la (sèl kote ki gen API key la, an sekirite, sou sèvè a)
async function coachCallBackend(userText){
  const url = (loadLS(LS.coachBackendUrl, '') || '').trim();
  if (!url) return { ok:false, reason:'no-url' };
  if (!navigator.onLine) return { ok:false, reason:'offline' };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try{
    const history = coachChat.slice(-12).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.text }));
    history.push({ role:'user', text:userText });
    const res = await fetch(url.replace(/\/+$/,'') + '/api/coach', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ messages:history, context: buildAiContext() }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return { ok:false, reason:'server-error' };
    const data = await res.json();
    if (!data || typeof data.reply !== 'string') return { ok:false, reason:'bad-response' };
    return { ok:true, reply:data.reply, action:data.action || null };
  }catch(e){
    clearTimeout(timeoutId);
    return { ok:false, reason: (e && e.name === 'AbortError') ? 'timeout' : 'network-error' };
  }
}
async function coachHandleSend(){
  const input = document.getElementById('coachChatInput');
  const text = (input.value || '').trim();
  if (!text) return;
  coachAddMessage('user', escapeHtml(text));
  input.value = '';
  coachShowTyping();
  const result = await coachCallBackend(text);
  coachHideTyping();
  if (result.ok){
    let action = null;
    if (result.action && result.action.type && COACH_ACTIONS[result.action.type]){
      action = { type: result.action.type, params: result.action.params || {}, summary: result.action.summary || result.action.type };
    }
    coachAddMessage('ai', coachFormatAiText(result.reply), action);
  } else {
    const fallback = coachRespond(text);
    const note = result.reason === 'no-url' ? '' :
      `<div class="coach-fallback-note"><i data-lucide="cloud-off"></i> Backend pa reponn kounye a — mòd lokal ap itilize.</div>`;
    coachAddMessage('ai', note + fallback);
  }
}
const COACH_SUGGESTIONS = ['Ki tach mwen jodi a?', 'Kijan lajan m ye?', 'Ki pwochen leson mwen?', 'Kijan objektif mwen ye?'];
function renderCoachChatSuggestions(){
  const wrap = document.getElementById('coachChatSuggestions');
  if (!wrap) return;
  wrap.innerHTML = COACH_SUGGESTIONS.map(s => `<span class="coach-chip">${s}</span>`).join('');
  wrap.querySelectorAll('.coach-chip').forEach(chip => chip.addEventListener('click', () => {
    document.getElementById('coachChatInput').value = chip.textContent;
    coachHandleSend();
  }));
}
let coachChatWired = false;
function wireCoachChatOnce(){
  if (coachChatWired) return;
  coachChatWired = true;
  document.getElementById('coachChatSendBtn').addEventListener('click', coachHandleSend);
  document.getElementById('coachChatInput').addEventListener('keydown', e => { if (e.key === 'Enter') coachHandleSend(); });
}

// ---- ENTRE PRENSIPAL: rafrechi tout vi Coach AI a ----
function renderCoachView(){
  renderCoachDailyAssistant();
  renderCoachAgents();
  renderAiInsights();
  renderPersonalizationPanel();
  renderLevelPanels();
  renderCoachChatMessages();
  renderCoachChatSuggestions();
  wireCoachChatOnce();
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// RECENT ACTIVITY — LIFE TIMELINE (persisted, searchable, filterable)
// ==========================================
const ICON_CATEGORY = {
  'check-square': { cat:'tasks', label:'Travay' },
  'graduation-cap': { cat:'learning', label:'Aprantisaj' },
  'wallet': { cat:'finance', label:'Finans' },
  'flame': { cat:'habits', label:'Abitid' },
  'target': { cat:'goals', label:'Objektif' },
  'award': { cat:'achievements', label:'Achievement' },
  'trophy': { cat:'missions', label:'Misyon' },
  'calendar': { cat:'calendar', label:'Kalandriye' },
  'book-heart': { cat:'journal', label:'Jounal' },
  'heart-pulse': { cat:'health', label:'Sante' },
};

function seedActivityLog(){
  const seed = [
    { icon: "check-square", color: "var(--blue)", text: "Ou fini travay <b>“Peye fakti entènèt”</b>", offsetMin: 10 },
    { icon: "graduation-cap", color: "var(--orange)", text: "Ou konplete leson <b>“Fonksyon Flèch”</b>", offsetMin: 60 },
    { icon: "wallet", color: "var(--green)", text: "Ou ajoute yon depans <b>800 HTG</b>", offsetMin: 180 },
    { icon: "flame", color: "var(--green)", text: "Ou fè abitid <b>“Li 20 min”</b> jodi a", offsetMin: 300 },
    { icon: "target", color: "var(--blue)", text: "Objektif <b>“Lanse BWdepot v2”</b> monte a 65%", offsetMin: 1440 },
  ];
  const now = Date.now();
  return seed.map(a => ({
    id: uid(), icon:a.icon, color:a.color, text:a.text,
    category: ICON_CATEGORY[a.icon]?.cat || 'general',
    ts: new Date(now - a.offsetMin*60000).toISOString(),
  }));
}

let activityLog = loadLS(LS.activity, seedActivityLog());

function persistActivity(){ saveLS(LS.activity, activityLog); }

function relativeTime(ts){
  const diffMs = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diffMs/60000);
  if (mins < 1) return 'kounye a';
  if (mins < 60) return mins+' min';
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return hrs+' è';
  const days = Math.floor(hrs/24);
  if (days === 1) return 'Yè';
  if (days < 7) return days+' jou';
  return new Date(ts).toLocaleDateString('fr-FR');
}

function logActivity(entry){
  const category = entry.category || ICON_CATEGORY[entry.icon]?.cat || 'general';
  activityLog.unshift({
    id: uid(), icon: entry.icon, color: entry.color, text: entry.text,
    category, ts: new Date().toISOString(),
  });
  if (activityLog.length > 300) activityLog.length = 300;
  persistActivity();
}

const timeline = document.getElementById("timeline");
function renderActivity(extra){
  if (extra && extra.length) extra.forEach(e => logActivity(e));
  timeline.innerHTML = '';
  activityLog.slice(0,8).forEach(a => {
    const row = document.createElement("div");
    row.className = "tl-item";
    row.innerHTML = `<div class="tl-dot" style="background:color-mix(in srgb, ${a.color} 16%, transparent); color:${a.color}"><i data-lucide="${a.icon}"></i></div>
      <div class="tl-text">${a.text}</div><div class="tl-time">${relativeTime(a.ts)}</div>`;
    timeline.appendChild(row);
  });
  if (window.lucide) lucide.createIcons();
  const tlView = document.getElementById('view-timeline');
  if (tlView && !tlView.hidden) renderTimelineView();
}
renderActivity();

function formatDayLabel(ts){
  const d = new Date(ts);
  const iso = d.toISOString().slice(0,10);
  const t = todayISO();
  if (iso === t) return "Jodi a";
  if (iso === isoOffset(t,-1)) return "Yè";
  return d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

function renderTimelineView(){
  const q = (document.getElementById('timelineSearch').value || '').toLowerCase();
  const cat = document.getElementById('timelineCategoryFilter').value;
  const dateF = document.getElementById('timelineDateFilter').value;
  const list = activityLog.filter(a => {
    if (cat && a.category !== cat) return false;
    if (dateF && a.ts.slice(0,10) !== dateF) return false;
    if (q && !a.text.toLowerCase().replace(/<[^>]+>/g,'').includes(q)) return false;
    return true;
  });
  document.getElementById('timelineCount').textContent = list.length + ' evènman';
  const wrap = document.getElementById('timelineFull');
  wrap.innerHTML = '';
  if (!list.length){
    wrap.innerHTML = '<div class="widget-empty">Pa gen aktivite ki matche ak filtè yo.</div>';
    return;
  }
  let lastLabel = null;
  list.forEach(a => {
    const label = formatDayLabel(a.ts);
    if (label !== lastLabel){
      const h = document.createElement('div');
      h.className = 'tl-date-label';
      h.textContent = label;
      wrap.appendChild(h);
      lastLabel = label;
    }
    const row = document.createElement('div');
    row.className = 'tl-item';
    const timeStr = new Date(a.ts).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    row.innerHTML = `<div class="tl-dot" style="background:color-mix(in srgb, ${a.color} 16%, transparent); color:${a.color}"><i data-lucide="${a.icon}"></i></div>
      <div class="tl-text">${a.text}</div><div class="tl-time">${timeStr}</div>`;
    wrap.appendChild(row);
  });
  if (window.lucide) lucide.createIcons();
}
['timelineSearch'].forEach(id => document.getElementById(id).addEventListener('input', debounce(renderTimelineView, 200)));
['timelineCategoryFilter','timelineDateFilter'].forEach(id => document.getElementById(id).addEventListener('change', renderTimelineView));
document.getElementById('timelineClearFilters').addEventListener('click', () => {
  document.getElementById('timelineSearch').value = '';
  document.getElementById('timelineCategoryFilter').value = '';
  document.getElementById('timelineDateFilter').value = '';
  renderTimelineView();
});

// ==========================================
// DASHBOARD <-> TASKS INTEGRATION
// ==========================================
function refreshDashboardTaskWidget(){
  const widget = document.querySelector('.widget.tasks');
  if (!widget) return;
  widget.querySelectorAll('.task-row').forEach(r => r.remove());
  const statLine = widget.querySelector('.stat-line');
  const active = tasks.filter(t => t.status !== 'completed' && t.status !== 'archived')
    .sort((a,b) => priorityRank(b.priority) - priorityRank(a.priority)).slice(0,3);
  active.forEach(t => {
    const row = document.createElement('div');
    row.className = 'task-row' + (t.status === 'completed' ? ' done' : '');
    row.innerHTML = `<span class="dot" style="background:${priorityColor(t.priority)}"></span>
      <span class="t">${escapeHtml(t.title)}</span>
      <span class="tag" style="background:${priorityBg(t.priority)};color:${priorityColor(t.priority)}">${PRIORITY[t.priority]}</span>`;
    widget.insertBefore(row, statLine);
  });
  statLine.innerHTML = `<span>Total jodi a</span><b>${tasks.filter(t => t.status !== 'archived').length}</b>`;
  if (window.lucide) lucide.createIcons();
}
refreshDashboardTaskWidget();

// ==========================================
// TASKS: FILTER / SORT / RENDER
// ==========================================
function populateCategoryFilter(){
  const sel = document.getElementById('filterCategory');
  const current = sel.value;
  const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))];
  sel.innerHTML = '<option value="">Tout kategori</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  sel.value = current;
}

function getFilteredSortedTasks(){
  const q = (document.getElementById('taskSearch').value || '').toLowerCase();
  const pf = document.getElementById('filterPriority').value;
  const cf = document.getElementById('filterCategory').value;
  const sortBy = document.getElementById('sortTasks').value;
  let list = tasks.filter(t => {
    if (q && !(t.title.toLowerCase().includes(q) || (t.tags||[]).join(' ').toLowerCase().includes(q))) return false;
    if (pf && t.priority !== pf) return false;
    if (cf && t.category !== cf) return false;
    return true;
  });
  list.sort((a,b) => {
    if (sortBy === 'priority') return priorityRank(b.priority) - priorityRank(a.priority);
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return (a.deadline || '9999') > (b.deadline || '9999') ? 1 : -1;
  });
  return list;
}

function formatDeadline(v){
  const d = v.includes('T') ? new Date(v) : new Date(v + 'T00:00:00');
  if (isNaN(d)) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}${v.includes('T') ? ' · ' + v.slice(11,16) : ''}`;
}

function buildTaskCard(t){
  const el = document.createElement('div');
  el.className = 'task-card';
  el.draggable = true;
  el.dataset.id = t.id;
  const doneSub = (t.subtasks||[]).filter(s => s.done).length;
  const totalSub = (t.subtasks||[]).length;
  const deadlineTxt = t.deadline ? formatDeadline(t.deadline) : '';
  el.innerHTML = `
    <div class="tc-title">${escapeHtml(t.title)}</div>
    <div class="tc-meta">
      <span class="pill" style="background:${priorityBg(t.priority)};color:${priorityColor(t.priority)}">${PRIORITY[t.priority]}</span>
      ${t.category ? `<span class="pill" style="background:var(--surface-2);color:var(--text-dim)">${escapeHtml(t.category)}</span>` : ''}
      ${t.recurring?.enabled ? '<i data-lucide="repeat" style="width:12px;height:12px;color:var(--text-faint)"></i>' : ''}
      ${t.reminder?.enabled ? '<i data-lucide="bell" style="width:12px;height:12px;color:var(--text-faint)"></i>' : ''}
    </div>
    ${totalSub ? `<div class="tc-sub"><i data-lucide="list-checks" style="width:11px;height:11px"></i> ${doneSub}/${totalSub} sou-travay</div>` : ''}
    ${deadlineTxt ? `<div class="tc-sub"><i data-lucide="calendar" style="width:11px;height:11px"></i> ${deadlineTxt}</div>` : ''}
  `;
  el.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', t.id));
  el.addEventListener('click', () => openTaskModal(t.id));
  return el;
}

function renderTasks(){
  populateCategoryFilter();
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = '';
  const list = getFilteredSortedTasks();
  STATUSES.forEach(s => {
    const col = document.createElement('div');
    col.className = 'kanban-col';
    const colTasks = list.filter(t => t.status === s.key);
    col.innerHTML = `<div class="kanban-col-head"><span>${s.label}</span><span class="count">${colTasks.length}</span></div>
      <div class="kanban-list" data-status="${s.key}"></div>`;
    board.appendChild(col);
    const listEl = col.querySelector('.kanban-list');
    colTasks.forEach(t => listEl.appendChild(buildTaskCard(t)));
    listEl.addEventListener('dragover', e => { e.preventDefault(); listEl.classList.add('drag-over'); });
    listEl.addEventListener('dragleave', () => listEl.classList.remove('drag-over'));
    listEl.addEventListener('drop', e => {
      e.preventDefault(); listEl.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      moveTaskStatus(id, s.key);
    });
  });
  renderTaskStats();
  if (window.lucide) lucide.createIcons();
}

function moveTaskStatus(id, status){
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const wasCompleted = t.status === 'completed';
  t.status = status;
  if (status === 'completed' && !wasCompleted){
    t.completedAt = new Date().toISOString();
    if (t.recurring?.enabled) spawnNextOccurrence(t);
    applyTaskCompletionToGoal(t);
  }
  persistTasks();
  renderTasks();
}

function spawnNextOccurrence(t){
  if (!t.deadline) return;
  const d = new Date(t.deadline);
  const freq = t.recurring.freq || 'weekly';
  if (freq === 'daily') d.setDate(d.getDate()+1);
  else if (freq === 'weekly') d.setDate(d.getDate()+7);
  else if (freq === 'monthly') d.setMonth(d.getMonth()+1);
  tasks.push({
    ...t, id: uid(), status: 'planned', completedAt: null,
    deadline: d.toISOString().slice(0,16),
    subtasks: (t.subtasks||[]).map(s => ({...s, done:false})),
  });
}

function renderTaskStats(){
  const el = document.getElementById('taskStats');
  const total = tasks.filter(t => t.status !== 'archived').length;
  const todayStr = new Date().toDateString();
  const completedToday = tasks.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === todayStr).length;
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed' && t.status !== 'archived').length;
  const doneCount = tasks.filter(t => t.status === 'completed').length;
  const rate = total ? Math.round((doneCount/total)*100) : 0;
  el.innerHTML = `
    <div class="st"><b>${total}</b><span>Total aktif</span></div>
    <div class="st"><b>${completedToday}</b><span>Fini jodi a</span></div>
    <div class="st"><b style="${overdue?'color:var(--red)':''}">${overdue}</b><span>An reta</span></div>
    <div class="st"><b>${rate}%</b><span>To konplisman</span></div>
  `;
}

['taskSearch','filterPriority','filterCategory','sortTasks'].forEach(id => {
  document.getElementById(id).addEventListener('input', debounce(renderTasks, 200));
  document.getElementById(id).addEventListener('change', renderTasks);
});

// ==========================================
// TASK MODAL
// ==========================================
let editingTaskId = null;
let subtaskDraft = [];
let attachDraft = [];

function openTaskModal(id){
  editingTaskId = id || null;
  const t = id ? tasks.find(x => x.id === id) : null;
  document.getElementById('taskModalTitle').textContent = t ? 'Modifye Travay' : 'Nouvo Travay';
  document.getElementById('taskTitle').value = t?.title || '';
  document.getElementById('taskDesc').value = t?.description || '';
  document.getElementById('taskPriority').value = t?.priority || 'medium';
  document.getElementById('taskCategory').value = t?.category || '';
  document.getElementById('taskStatus').value = t?.status || 'inbox';
  const goalSel = document.getElementById('taskGoalLink');
  goalSel.innerHTML = '<option value="">— Okenn —</option>' + goals.map(g => `<option value="${g.id}">${escapeHtml(g.title)}</option>`).join('');
  goalSel.value = t?.goalId || '';
  document.getElementById('taskTags').value = (t?.tags || []).join(', ');
  document.getElementById('taskDeadline').value = t?.deadline || '';
  document.getElementById('taskReminderEnabled').checked = !!t?.reminder?.enabled;
  document.getElementById('taskRecurring').checked = !!t?.recurring?.enabled;
  document.getElementById('taskRecurFreq').value = t?.recurring?.freq || 'weekly';
  document.getElementById('recurringFreqWrap').hidden = !t?.recurring?.enabled;
  document.getElementById('taskNotes').value = t?.notes || '';
  document.getElementById('saveAsTemplate').checked = false;
  document.getElementById('deleteTaskBtn').hidden = !t;
  subtaskDraft = t?.subtasks ? t.subtasks.map(s => ({...s})) : [];
  attachDraft = t?.attachments ? t.attachments.map(a => ({...a})) : [];
  renderSubtaskDraft();
  renderAttachDraft();
  document.getElementById('taskModalOverlay').classList.add('open');
}
function closeTaskModal(){ document.getElementById('taskModalOverlay').classList.remove('open'); editingTaskId = null; }

function renderSubtaskDraft(){
  const wrap = document.getElementById('subtaskList');
  wrap.innerHTML = '';
  subtaskDraft.forEach((s,i) => {
    const row = document.createElement('div');
    row.className = 'subtask-row';
    row.innerHTML = `<input type="checkbox" ${s.done?'checked':''} data-i="${i}" class="sub-chk">
      <input type="text" value="${escapeHtml(s.text)}" data-i="${i}" class="sub-text" placeholder="Sou-travay...">
      <i data-lucide="x" class="rm" data-i="${i}"></i>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('.sub-chk').forEach(c => c.addEventListener('change', e => { subtaskDraft[+e.target.dataset.i].done = e.target.checked; }));
  wrap.querySelectorAll('.sub-text').forEach(c => c.addEventListener('input', e => { subtaskDraft[+e.target.dataset.i].text = e.target.value; }));
  wrap.querySelectorAll('.rm').forEach(c => c.addEventListener('click', e => { subtaskDraft.splice(+e.currentTarget.dataset.i, 1); renderSubtaskDraft(); }));
  if (window.lucide) lucide.createIcons();
}
document.getElementById('addSubtaskBtn').addEventListener('click', () => {
  subtaskDraft.push({ id: uid(), text: '', done: false });
  renderSubtaskDraft();
});

function renderAttachDraft(){
  const wrap = document.getElementById('attachList');
  wrap.innerHTML = attachDraft.map((a,i) => `<span class="attach-chip"><i data-lucide="paperclip" style="width:11px;height:11px"></i>${escapeHtml(a.name)} <i data-lucide="x" class="rm" data-i="${i}" style="width:11px;height:11px"></i></span>`).join('') || '<span style="color:var(--text-faint);font-size:11.5px;">Pa gen atachman</span>';
  wrap.querySelectorAll('.rm').forEach(c => c.addEventListener('click', e => { attachDraft.splice(+e.currentTarget.dataset.i, 1); renderAttachDraft(); }));
  if (window.lucide) lucide.createIcons();
}
document.getElementById('attachInput').addEventListener('change', e => {
  [...e.target.files].forEach(f => attachDraft.push({ name: f.name }));
  e.target.value = '';
  renderAttachDraft();
});
document.getElementById('taskRecurring').addEventListener('change', e => {
  document.getElementById('recurringFreqWrap').hidden = !e.target.checked;
});

document.getElementById('saveTaskBtn').addEventListener('click', () => {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title){ showToast('Mete yon tit pou travay la'); return; }
  const data = {
    title,
    description: document.getElementById('taskDesc').value.trim(),
    priority: document.getElementById('taskPriority').value,
    category: document.getElementById('taskCategory').value.trim(),
    status: document.getElementById('taskStatus').value,
    tags: document.getElementById('taskTags').value.split(',').map(s => s.trim()).filter(Boolean),
    goalId: document.getElementById('taskGoalLink').value || '',
    deadline: document.getElementById('taskDeadline').value || '',
    reminder: { enabled: document.getElementById('taskReminderEnabled').checked },
    recurring: { enabled: document.getElementById('taskRecurring').checked, freq: document.getElementById('taskRecurFreq').value },
    notes: document.getElementById('taskNotes').value.trim(),
    subtasks: subtaskDraft,
    attachments: attachDraft,
  };
  if (editingTaskId){
    const t = tasks.find(x => x.id === editingTaskId);
    const wasCompleted = t.status === 'completed';
    Object.assign(t, data);
    if (data.status === 'completed' && !wasCompleted){
      t.completedAt = new Date().toISOString();
      applyTaskCompletionToGoal(t);
    }
  } else {
    tasks.push({ id: uid(), createdAt: new Date().toISOString(), completedAt: null, ...data });
  }
  if (document.getElementById('saveAsTemplate').checked){
    templates.push({ id: uid(), name: title, data: { ...data } });
    persistTemplates();
  }
  persistTasks();
  closeTaskModal();
  renderTasks();
  showToast('Travay anrejistre ✓');
});
document.getElementById('deleteTaskBtn').addEventListener('click', () => {
  tasks = tasks.filter(t => t.id !== editingTaskId);
  persistTasks();
  closeTaskModal();
  renderTasks();
  showToast('Travay efase');
});
document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
document.getElementById('taskModalOverlay').addEventListener('click', e => { if (e.target.id === 'taskModalOverlay') closeTaskModal(); });
document.getElementById('newTaskBtn').addEventListener('click', () => openTaskModal(null));

// ==========================================
// TEMPLATES MODAL
// ==========================================
function openTemplatesModal(){
  const wrap = document.getElementById('templatesList');
  wrap.innerHTML = '';
  if (!templates.length){
    wrap.innerHTML = '<div class="widget-empty">Ou poko gen modèl travay. Kreye yon travay epi koche "Anrejistre kòm modèl".</div>';
  }
  templates.forEach(tpl => {
    const row = document.createElement('div');
    row.className = 'evt-row';
    row.innerHTML = `<span class="dot" style="background:var(--blue)"></span>
      <div class="info"><b>${escapeHtml(tpl.name)}</b><span>${escapeHtml(tpl.data.category || 'San kategori')}</span></div>
      <button class="btn btn-ghost" data-act="use" data-id="${tpl.id}">Itilize</button>
      <button class="icon-btn" data-act="del" data-id="${tpl.id}"><i data-lucide="trash-2"></i></button>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('[data-act=use]').forEach(b => b.addEventListener('click', e => {
    const tpl = templates.find(x => x.id === e.currentTarget.dataset.id);
    document.getElementById('templatesModalOverlay').classList.remove('open');
    openTaskModal(null);
    document.getElementById('taskTitle').value = tpl.name;
    document.getElementById('taskDesc').value = tpl.data.description || '';
    document.getElementById('taskPriority').value = tpl.data.priority || 'medium';
    document.getElementById('taskCategory').value = tpl.data.category || '';
    document.getElementById('taskTags').value = (tpl.data.tags || []).join(', ');
    document.getElementById('taskNotes').value = tpl.data.notes || '';
    subtaskDraft = (tpl.data.subtasks || []).map(s => ({...s, done:false}));
    renderSubtaskDraft();
  }));
  wrap.querySelectorAll('[data-act=del]').forEach(b => b.addEventListener('click', e => {
    templates = templates.filter(x => x.id !== e.currentTarget.dataset.id);
    persistTemplates();
    openTemplatesModal();
  }));
  document.getElementById('templatesModalOverlay').classList.add('open');
  if (window.lucide) lucide.createIcons();
}
document.getElementById('manageTemplatesBtn').addEventListener('click', openTemplatesModal);
document.getElementById('closeTemplatesModal').addEventListener('click', () => document.getElementById('templatesModalOverlay').classList.remove('open'));
document.getElementById('templatesModalOverlay').addEventListener('click', e => { if (e.target.id === 'templatesModalOverlay') document.getElementById('templatesModalOverlay').classList.remove('open'); });

// ==========================================
// CALENDAR: DATA HELPERS
// ==========================================
let calState = { date: new Date(), view: 'month' };

function allCalendarItems(){
  const virtual = tasks.filter(t => t.deadline && t.status !== 'archived').map(t => ({
    id: 'task-' + t.id, title: t.title, description: t.description,
    date: t.deadline.slice(0,10), time: t.deadline.length > 10 ? t.deadline.slice(11,16) : '',
    location: '', category: 'deadline', recurrence: 'none', source: 'task', taskId: t.id,
  }));
  return [...events.map(e => ({...e, source:'user'})), ...virtual];
}

function expandOccurrences(item, rangeStart, rangeEnd){
  const out = [];
  if (!item.recurrence || item.recurrence === 'none'){
    const d = new Date(item.date + 'T00:00:00');
    if (d >= rangeStart && d <= rangeEnd) out.push({...item});
    return out;
  }
  let d = new Date(item.date + 'T00:00:00');
  let guard = 0;
  while (d <= rangeEnd && guard < 400){
    if (d >= rangeStart) out.push({...item, date: d.toISOString().slice(0,10)});
    if (item.recurrence === 'daily') d.setDate(d.getDate()+1);
    else if (item.recurrence === 'weekly') d.setDate(d.getDate()+7);
    else if (item.recurrence === 'monthly') d.setMonth(d.getMonth()+1);
    else if (item.recurrence === 'yearly') d.setFullYear(d.getFullYear()+1);
    else break;
    guard++;
  }
  return out;
}

function getItemsInRange(start, end){
  const all = allCalendarItems();
  let result = [];
  all.forEach(it => { result = result.concat(expandOccurrences(it, start, end)); });
  result.sort((a,b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')));
  return result;
}

function buildEvtRow(it){
  const row = document.createElement('div');
  row.className = 'evt-row';
  const color = EVENT_TYPES[it.category]?.color || 'var(--blue)';
  row.innerHTML = `<span class="dot" style="background:${color}"></span>
    <span class="time">${it.time || '—'}</span>
    <div class="info"><b>${escapeHtml(it.title)}</b><span>${EVENT_TYPES[it.category]?.label || ''}${it.location ? ' · ' + escapeHtml(it.location) : ''}</span></div>`;
  row.addEventListener('click', () => {
    if (it.source === 'task') showToast('Sa se dat limit yon travay — modifye l nan Travay');
    else openEventModal(it.id);
  });
  return row;
}

// ==========================================
// CALENDAR: RENDER
// ==========================================
function renderCalendar(){
  document.querySelectorAll('.cal-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === calState.view));
  const wrap = document.getElementById('calGridWrap');
  wrap.innerHTML = '';
  if (calState.view === 'month') renderCalMonth(wrap);
  else if (calState.view === 'week') renderCalWeek(wrap);
  else if (calState.view === 'day') renderCalDay(wrap);
  else renderCalAgenda(wrap);
  if (window.lucide) lucide.createIcons();
}

function renderCalMonth(wrap){
  const y = calState.date.getFullYear(), m = calState.date.getMonth();
  document.getElementById('calTitle').textContent = `${MONTHS[m]} ${y}`;
  const first = new Date(y,m,1);
  const startOffset = first.getDay();
  const gridStart = new Date(y,m,1 - startOffset);
  const gridEnd = new Date(y,m,1 - startOffset + 41);
  const items = getItemsInRange(gridStart, gridEnd);
  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  DAYS_SHORT.forEach(d => { const el = document.createElement('div'); el.className = 'cal-dow'; el.textContent = d; grid.appendChild(el); });
  const todayStr = new Date().toDateString();
  for (let i=0;i<42;i++){
    const d = new Date(gridStart); d.setDate(gridStart.getDate()+i);
    const dISO = d.toISOString().slice(0,10);
    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (d.getMonth() !== m ? ' other' : '') + (d.toDateString() === todayStr ? ' today' : '');
    const dayItems = items.filter(it => it.date === dISO);
    cell.innerHTML = `<span class="dnum">${d.getDate()}</span>` +
      dayItems.slice(0,2).map(it => `<span class="cal-evt" style="background:${(EVENT_TYPES[it.category]?.color||'var(--blue)')}22;color:${EVENT_TYPES[it.category]?.color||'var(--blue)'}">${escapeHtml(it.title)}</span>`).join('') +
      (dayItems.length > 2 ? `<span class="cal-evt" style="color:var(--text-faint)">+${dayItems.length-2} ankò</span>` : '');
    cell.addEventListener('click', () => { calState.date = d; calState.view = 'day'; renderCalendar(); });
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
}

function renderCalWeek(wrap){
  const d0 = new Date(calState.date);
  const dow = d0.getDay();
  const weekStart = new Date(d0); weekStart.setDate(d0.getDate()-dow);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
  document.getElementById('calTitle').textContent = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0,3)} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].slice(0,3)}`;
  const items = getItemsInRange(weekStart, weekEnd);
  const cols = document.createElement('div');
  cols.className = 'cal-week-cols';
  for (let i=0;i<7;i++){
    const d = new Date(weekStart); d.setDate(weekStart.getDate()+i);
    const dISO = d.toISOString().slice(0,10);
    const dayItems = items.filter(it => it.date === dISO);
    const col = document.createElement('div');
    col.className = 'cal-week-col';
    col.innerHTML = `<h4>${DAYS_SHORT[d.getDay()]} ${d.getDate()}</h4>` +
      (dayItems.length ? dayItems.map(it => `<div class="cal-evt" style="background:${(EVENT_TYPES[it.category]?.color||'var(--blue)')}22;color:${EVENT_TYPES[it.category]?.color||'var(--blue)'};margin-bottom:4px;padding:4px 7px;">${it.time ? it.time+' · ' : ''}${escapeHtml(it.title)}</div>`).join('')
        : '<div style="color:var(--text-faint);font-size:11px">Anyen pwograme</div>');
    col.addEventListener('click', () => { calState.date = d; calState.view = 'day'; renderCalendar(); });
    cols.appendChild(col);
  }
  wrap.appendChild(cols);
}

function renderCalDay(wrap){
  const d = calState.date;
  document.getElementById('calTitle').textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const items = getItemsInRange(dayStart, dayStart);
  const list = document.createElement('div');
  list.className = 'cal-day-list';
  if (!items.length) list.innerHTML = '<div class="widget-empty">Pa gen evènman jou sa a</div>';
  items.forEach(it => list.appendChild(buildEvtRow(it)));
  wrap.appendChild(list);
  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn-primary';
  addBtn.style.marginTop = '14px';
  addBtn.innerHTML = '<i data-lucide="plus"></i> Ajoute evènman jou sa a';
  addBtn.addEventListener('click', () => openEventModal(null, dayStart.toISOString().slice(0,10)));
  wrap.appendChild(addBtn);
}

function renderCalAgenda(wrap){
  document.getElementById('calTitle').textContent = 'Ajanda — 30 pwochen jou';
  const start = new Date();
  const end = new Date(); end.setDate(end.getDate()+30);
  const items = getItemsInRange(start, end);
  const hasStudy = items.some(it => it.category === 'study' || (it.category === 'deadline' && /aprann|learning|javascript|react/i.test(it.title)));
  if (hasStudy){
    const banner = document.createElement('div');
    banner.className = 'ai-suggest';
    banner.innerHTML = `<i data-lucide="sparkles"></i><div><b>AI Planner</b><span>Ou gen yon dat limit oswa sesyon aprantisaj k ap pwoche — vle m ede w kreye yon plan etid?</span></div>`;
    wrap.appendChild(banner);
  }
  const groups = {};
  items.forEach(it => { (groups[it.date] = groups[it.date] || []).push(it); });
  const keys = Object.keys(groups).sort();
  if (!keys.length){
    wrap.innerHTML += '<div class="widget-empty">Pa gen anyen pwograme pou 30 jou k ap vini yo</div>';
    return;
  }
  keys.forEach(dateKey => {
    const d = new Date(dateKey + 'T00:00:00');
    const g = document.createElement('div');
    g.className = 'agenda-group';
    g.innerHTML = `<h4>${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</h4>`;
    const list = document.createElement('div');
    list.className = 'agenda-list';
    groups[dateKey].forEach(it => list.appendChild(buildEvtRow(it)));
    g.appendChild(list);
    wrap.appendChild(g);
  });
}

document.querySelectorAll('.cal-view-btn').forEach(b => b.addEventListener('click', () => { calState.view = b.dataset.view; renderCalendar(); }));
document.getElementById('calPrev').addEventListener('click', () => calNav(-1));
document.getElementById('calNext').addEventListener('click', () => calNav(1));
document.getElementById('calToday').addEventListener('click', () => { calState.date = new Date(); renderCalendar(); });
function calNav(dir){
  const d = new Date(calState.date);
  if (calState.view === 'month') d.setMonth(d.getMonth()+dir);
  else if (calState.view === 'week') d.setDate(d.getDate()+7*dir);
  else d.setDate(d.getDate()+dir);
  calState.date = d;
  renderCalendar();
}
document.getElementById('newEventBtn').addEventListener('click', () => openEventModal(null));

// ==========================================
// EVENT MODAL
// ==========================================
let editingEventId = null;
function openEventModal(id, presetDate){
  editingEventId = id || null;
  const ev = id ? events.find(x => x.id === id) : null;
  document.getElementById('eventModalTitle').textContent = ev ? 'Modifye Evènman' : 'Nouvo Evènman';
  document.getElementById('eventTitle').value = ev?.title || '';
  document.getElementById('eventDesc').value = ev?.description || '';
  document.getElementById('eventDate').value = ev?.date || presetDate || new Date().toISOString().slice(0,10);
  document.getElementById('eventTime').value = ev?.time || '';
  document.getElementById('eventLocation').value = ev?.location || '';
  document.getElementById('eventCategory').value = ev?.category || 'event';
  document.getElementById('eventReminder').checked = !!ev?.reminder?.enabled;
  document.getElementById('eventRecurrence').value = ev?.recurrence || 'none';
  document.getElementById('deleteEventBtn').hidden = !ev;
  document.getElementById('eventModalOverlay').classList.add('open');
}
document.getElementById('saveEventBtn').addEventListener('click', () => {
  const title = document.getElementById('eventTitle').value.trim();
  if (!title){ showToast('Mete yon tit pou evènman an'); return; }
  const data = {
    title, description: document.getElementById('eventDesc').value.trim(),
    date: document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value,
    location: document.getElementById('eventLocation').value.trim(),
    category: document.getElementById('eventCategory').value,
    reminder: { enabled: document.getElementById('eventReminder').checked },
    recurrence: document.getElementById('eventRecurrence').value,
  };
  if (editingEventId) Object.assign(events.find(x => x.id === editingEventId), data);
  else events.push({ id: uid(), ...data });
  persistEvents();
  document.getElementById('eventModalOverlay').classList.remove('open');
  renderCalendar();
  showToast('Evènman anrejistre ✓');
});
document.getElementById('deleteEventBtn').addEventListener('click', () => {
  events = events.filter(e => e.id !== editingEventId);
  persistEvents();
  document.getElementById('eventModalOverlay').classList.remove('open');
  renderCalendar();
  showToast('Evènman efase');
});
document.getElementById('closeEventModal').addEventListener('click', () => document.getElementById('eventModalOverlay').classList.remove('open'));
document.getElementById('eventModalOverlay').addEventListener('click', e => { if (e.target.id === 'eventModalOverlay') document.getElementById('eventModalOverlay').classList.remove('open'); });

// ==========================================
// HABITS MODULE
// ==========================================
const XP_PER_COMPLETION = 10;
const BADGE_DEFS = [
  { id:'streak3', label:'3 Jou', min:3 },
  { id:'streak7', label:'Semèn Solid', min:7 },
  { id:'streak30', label:'Mwa Fè', min:30 },
];
function todayISO(){ return new Date().toISOString().slice(0,10); }
function isoOffset(base, off){ const d = new Date(base+'T00:00:00'); d.setDate(d.getDate()+off); return d.toISOString().slice(0,10); }

function calcStreaks(h){
  const set = new Set(h.completions||[]);
  let current = 0, cursor = todayISO();
  if (!set.has(cursor)) cursor = isoOffset(cursor,-1);
  while (set.has(cursor)){ current++; cursor = isoOffset(cursor,-1); }
  let longest = 0, run = 0;
  const sorted = [...set].sort();
  for (let i=0;i<sorted.length;i++){
    if (i===0 || isoOffset(sorted[i-1],1) === sorted[i]) run++; else run = 1;
    longest = Math.max(longest, run);
  }
  const totalDays = Math.max(1, Math.ceil((new Date() - new Date(h.createdAt)) / 86400000) + 1);
  const rate = Math.round((set.size / totalDays) * 100);
  return { current, longest, rate: Math.min(100,rate) };
}

function toggleHabitToday(id){
  const h = habits.find(x => x.id === id);
  if (!h) return;
  const t = todayISO();
  const i = h.completions.indexOf(t);
  if (i >= 0){ h.completions.splice(i,1); }
  else {
    h.completions.push(t);
    gami.xp += XP_PER_COMPLETION;
    const { current } = calcStreaks(h);
    BADGE_DEFS.forEach(b => {
      if (current >= b.min && !gami.badges.includes(b.id)){
        gami.badges.push(b.id);
        showToast(`🏆 Achievement debloke: ${b.label}`);
        renderActivity([{ icon:'award', color:'var(--orange)', text:`Ou debloke achievement <b>"${b.label}"</b>`, time:'kounye a' }]);
      }
    });
    bumpCategory('discipline', 1);
    renderActivity([{ icon:'flame', color:'var(--green)', text:`Ou fè abitid <b>"${escapeHtml(h.name)}"</b> jodi a`, time:'kounye a' }]);
    persistGami();
  }
  persistHabits();
  renderHabits();
}

function buildHeatmap(h){
  const days = 91;
  const set = new Set(h.completions||[]);
  const cells = [];
  for (let i=days-1;i>=0;i--){
    const d = isoOffset(todayISO(), -i);
    const lvl = set.has(d) ? 3 : 0;
    cells.push(`<div class="hcell hb-lvl-${lvl}" title="${d}"></div>`);
  }
  return `<div class="heatmap">${cells.join('')}</div>`;
}

function habitIconFor(cat){
  const c = (cat||'').toLowerCase();
  if (/sante|egzèsis|exercise|health/.test(c)) return {ic:'heart-pulse', bg:'var(--red-soft)', col:'var(--red)'};
  if (/aprann|etid|learn|study/.test(c)) return {ic:'graduation-cap', bg:'var(--orange-soft)', col:'var(--orange)'};
  if (/finans|lajan|money/.test(c)) return {ic:'wallet', bg:'var(--blue-soft)', col:'var(--blue)'};
  return {ic:'flame', bg:'var(--green-soft)', col:'var(--green)'};
}

function buildHabitCard(h){
  const { current, longest, rate } = calcStreaks(h);
  const doneToday = (h.completions||[]).includes(todayISO());
  const iconInfo = habitIconFor(h.category);
  const el = document.createElement('div');
  el.className = 'card habit-item';
  el.innerHTML = `
    <div class="habit-item-head">
      <div class="ic" style="background:${iconInfo.bg};color:${iconInfo.col}"><i data-lucide="${iconInfo.ic}"></i></div>
      <div class="info">
        <b>${escapeHtml(h.name)}</b>
        <span>${escapeHtml(h.category||'Jeneral')} · ${h.frequency==='daily'?'Chak jou':h.frequency==='weekly'?'Chak semèn':'Chak mwa'}${h.goal ? ' · '+escapeHtml(h.goal) : ''}</span>
      </div>
      <div class="habit-check ${doneToday?'checked':''}" data-id="${h.id}"><i data-lucide="check"></i></div>
    </div>
    <div class="habit-stats-row">
      <span>Streak: <b>${current} jou</b></span>
      <span>Pi long: <b>${longest} jou</b></span>
      <span>To siksè: <b>${rate}%</b></span>
    </div>
    ${buildHeatmap(h)}
  `;
  el.querySelector('.habit-check').addEventListener('click', e => { e.stopPropagation(); toggleHabitToday(h.id); });
  el.addEventListener('click', () => openHabitModal(h.id));
  return el;
}
function renderHabits(){
  const list = document.getElementById('habitList');
  list.innerHTML = '';
  if (!habits.length){
    list.innerHTML = '<div class="card widget-empty" style="padding:24px;">Ou poko gen abitid. Klike "Nouvo Abitid" pou kòmanse.</div>';
  } else {
    const pending = habits.filter(h => !(h.completions||[]).includes(todayISO()));
    const done = habits.filter(h => (h.completions||[]).includes(todayISO()));
    if (!pending.length && done.length){
      list.innerHTML = '<div class="card widget-empty" style="padding:24px;">Ou fè tout abitid ou jodi a 🎉 Yo ap parèt ankò demen.</div>';
    } else {
      pending.forEach(h => list.appendChild(buildHabitCard(h)));
    }
    if (done.length){
      const doneWrap = document.createElement('div');
      doneWrap.className = 'card';
      doneWrap.style.cssText = 'padding:12px 16px;color:var(--text-faint);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:7px;';
      doneWrap.innerHTML = `<i data-lucide="check-circle-2" style="width:13px;height:13px;"></i><span>${done.length} abitid fèt jodi a — klike pou wè (ou anile si se erè)</span>`;
      doneWrap.addEventListener('click', () => {
        doneWrap.remove();
        done.forEach(h => list.appendChild(buildHabitCard(h)));
        if (window.lucide) lucide.createIcons();
      });
      list.appendChild(doneWrap);
    }
  }
  const level = Math.floor(gami.xp / 100) + 1;
  const pctInLevel = gami.xp % 100;
  document.getElementById('xpLevelBadge').textContent = 'Lv.'+level;
  document.getElementById('xpTotalLbl').textContent = gami.xp + ' XP';
  document.getElementById('xpBarFill').style.width = pctInLevel + '%';
  document.getElementById('badgeList').innerHTML = gami.badges.length
    ? gami.badges.map(id => `<span class="badge-chip"><i data-lucide="award" style="width:10px;height:10px"></i>${BADGE_DEFS.find(b=>b.id===id)?.label||id}</span>`).join(' ')
    : '<span style="color:var(--text-faint);font-size:11px;">Poko gen badj</span>';
  if (window.lucide) lucide.createIcons();
}

function refreshDashboardHabitWidget(){
  const grid = document.getElementById('habitGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const primary = habits[0];
  const last7 = [];
  for (let i=6;i>=0;i--) last7.push(isoOffset(todayISO(), -i));
  const set = primary ? new Set(primary.completions||[]) : new Set();
  last7.forEach(d => {
    const cell = document.createElement('div');
    cell.className = 'habit-cell' + (set.has(d) ? ' on' : '');
    grid.appendChild(cell);
  });
  const streakLbl = document.getElementById('dashHabitStreak');
  if (streakLbl && primary) streakLbl.textContent = calcStreaks(primary).current + ' jou';
}
refreshDashboardHabitWidget();

let editingHabitId = null;
function openHabitModal(id){
  editingHabitId = id || null;
  const h = id ? habits.find(x => x.id === id) : null;
  document.getElementById('habitModalTitle').textContent = h ? 'Modifye Abitid' : 'Nouvo Abitid';
  document.getElementById('habitName').value = h?.name || '';
  document.getElementById('habitDesc').value = h?.description || '';
  document.getElementById('habitFrequency').value = h?.frequency || 'daily';
  document.getElementById('habitCategory').value = h?.category || '';
  document.getElementById('habitGoal').value = h?.goal || '';
  document.getElementById('habitReminder').checked = !!h?.reminder;
  document.getElementById('deleteHabitBtn').hidden = !h;
  document.getElementById('habitModalOverlay').classList.add('open');
}
document.getElementById('newHabitBtn').addEventListener('click', () => openHabitModal(null));
document.getElementById('closeHabitModal').addEventListener('click', () => document.getElementById('habitModalOverlay').classList.remove('open'));
document.getElementById('habitModalOverlay').addEventListener('click', e => { if (e.target.id === 'habitModalOverlay') document.getElementById('habitModalOverlay').classList.remove('open'); });
document.getElementById('saveHabitBtn').addEventListener('click', () => {
  const name = document.getElementById('habitName').value.trim();
  if (!name){ showToast('Mete yon non pou abitid la'); return; }
  const data = {
    name, description: document.getElementById('habitDesc').value.trim(),
    frequency: document.getElementById('habitFrequency').value,
    category: document.getElementById('habitCategory').value.trim(),
    goal: document.getElementById('habitGoal').value.trim(),
    reminder: document.getElementById('habitReminder').checked,
  };
  if (editingHabitId) Object.assign(habits.find(x => x.id === editingHabitId), data);
  else habits.push({ id: uid(), completions: [], createdAt: new Date().toISOString(), ...data });
  persistHabits();
  document.getElementById('habitModalOverlay').classList.remove('open');
  renderHabits();
  showToast('Abitid anrejistre ✓');
});
document.getElementById('deleteHabitBtn').addEventListener('click', () => {
  habits = habits.filter(h => h.id !== editingHabitId);
  persistHabits();
  document.getElementById('habitModalOverlay').classList.remove('open');
  renderHabits();
  showToast('Abitid efase');
});

// ==========================================
// DAILY MISSIONS
// ==========================================
function ensureMissionsToday(){
  const t = todayISO();
  if (missionsState.date !== t){
    missionsState = { date: t, claimed: [], goalsReviewed: false };
    persistMissions();
  }
}

function markGoalsReviewed(){
  ensureMissionsToday();
  if (!missionsState.goalsReviewed){
    missionsState.goalsReviewed = true;
    persistMissions();
    renderMissions();
    checkAchievements();
  }
}

const MISSION_DEFS = [
  { id:'m-tasks', icon:'check-square', color:'var(--blue)', label:'Konplete twa (3) tach', xp:20,
    progress: () => tasks.filter(t => t.completedAt && t.completedAt.slice(0,10) === todayISO()).length,
    target: () => 3 },
  { id:'m-study', icon:'graduation-cap', color:'var(--orange)', label:'Etidye trant (30) minit', xp:20,
    progress: () => (learning.lessonLog||[]).filter(d => d === todayISO()).length * 8,
    target: () => 30 },
  { id:'m-habits', icon:'flame', color:'var(--green)', label:'Konplete abitid ou yo', xp:20,
    progress: () => habits.filter(h => (h.completions||[]).includes(todayISO())).length,
    target: () => Math.max(1, habits.length) },
  { id:'m-goals', icon:'target', color:'var(--blue)', label:'Revize objektif ou yo', xp:15,
    progress: () => missionsState.goalsReviewed ? 1 : 0,
    target: () => 1 },
];

function recordPerfectDay(){
  const t = todayISO();
  if (!missionsHistory.includes(t)){
    missionsHistory.push(t);
    saveLS(LS.missionsHistory, missionsHistory);
  }
}

function claimMission(m){
  ensureMissionsToday();
  if (missionsState.claimed.includes(m.id)) return;
  missionsState.claimed.push(m.id);
  persistMissions();
  gami.xp += m.xp;
  gami.missionsClaimedTotal = (gami.missionsClaimedTotal||0) + 1;
  persistGami();
  renderActivity([{ icon:'trophy', color:'var(--orange)', text:`Ou reklame misyon <b>"${escapeHtml(m.label)}"</b> (+${m.xp} XP)`, time:'kounye a' }]);
  showToast(`✅ Misyon konplete +${m.xp} XP`);
  if (missionsState.claimed.length === MISSION_DEFS.length) recordPerfectDay();
  renderMissions();
  checkAchievements();
}

function renderMissions(){
  const wrap = document.getElementById('missionsCard');
  if (!wrap) return;
  ensureMissionsToday();
  wrap.innerHTML = '';
  MISSION_DEFS.forEach(m => {
    const target = m.target();
    const progress = Math.min(m.progress(), target);
    const done = progress >= target;
    const claimed = missionsState.claimed.includes(m.id);
    const row = document.createElement('div');
    row.className = 'mission-row';
    row.innerHTML = `
      <div class="mission-ic" style="background:color-mix(in srgb, ${m.color} 16%, transparent); color:${m.color}"><i data-lucide="${claimed ? 'check-circle-2' : m.icon}"></i></div>
      <div class="mission-info">
        <div class="mission-top"><b>${m.label}</b><span class="mono">${progress}/${target}</span></div>
        <div class="mini-progress"><span style="width:${Math.round(progress/target*100)}%;background:${m.color}"></span></div>
      </div>
      <button class="btn ${claimed ? 'btn-ghost' : 'btn-primary'}" style="min-width:96px;justify-content:center;" ${claimed || !done ? 'disabled' : ''}>
        ${claimed ? 'Reklame ✓' : (done ? '+'+m.xp+' XP' : 'Ankò')}
      </button>
    `;
    if (!claimed && done) row.querySelector('button').addEventListener('click', () => claimMission(m));
    wrap.appendChild(row);
  });
  const foot = document.createElement('div');
  foot.className = 'mission-foot';
  foot.textContent = missionsState.claimed.length === MISSION_DEFS.length
    ? '🎉 Ou fini tout misyon jodi a!'
    : `${missionsState.claimed.length}/${MISSION_DEFS.length} misyon reklame jodi a`;
  wrap.appendChild(foot);
  if (window.lucide) lucide.createIcons();
}
renderMissions();

// ==========================================
// FINANCE MODULE
// ==========================================
const EXPENSE_CATS = ['Manje','Transpò','Entènèt','Abònman','Dlo','Bwason','Custom'];
const INCOME_CATS = ['Salè','Lajan Resevwa','Depo','Kat Debi','Kado','Biznis','Lòt'];

// ---- Kategori Depans/Revni Pèsonalize (ajoute pa itilizatè a, Pw. "Bay Yon Moun Lajan") ----
let customTxCats = loadLS(LS.customTxCats, { expense: [], income: [] });
function persistCustomTxCats(){ saveLS(LS.customTxCats, customTxCats); }
function getExpenseCategories(){ return EXPENSE_CATS.concat(customTxCats.expense || []); }
function getIncomeCategories(){ return INCOME_CATS.concat(customTxCats.income || []); }
// Ajoute yon nouvo kategori pèsonalize (san doublon — verifikasyon san respekte gwosè lèt)
function addCustomTxCategory(type, name){
  const clean = (name || '').trim();
  if (!clean) return null;
  const list = type === 'income' ? (customTxCats.income ||= []) : (customTxCats.expense ||= []);
  const base = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  const exists = base.concat(list).some(c => c.toLowerCase() === clean.toLowerCase());
  if (!exists) { list.push(clean); persistCustomTxCats(); }
  return exists ? base.concat(list).find(c => c.toLowerCase() === clean.toLowerCase()) : clean;
}

// ---- Dlo / Bwason: konstant ak èd konvèsyon ----
const ML_PER_GLASS = 250; // referans istorik (1 ansyen "vè" = 250ml) — healthLog.water kounye a kenbe ml dirèkteman
const DRINK_TYPE_LABELS = { sugary:'Bwason Sikre', energy:'Bwason Enèjetik', coffee:'Kafe', juice:'Ji Fwi', milk:'Lèt', other:'Lòt' };
// Pousantaj idratasyon chak tip bwason bay (sou 1.0) — sèlman Dlo bay 100%
const DRINK_HYDRATION_FACTOR = { milk:0.5, other:0.3, sugary:0, energy:0, coffee:0.3, juice:0.7 };
// "Pwa" penalite sante pou bwason ki pa fè byen pou kò a (itilize nan computeHealthScore)
const DRINK_HEALTH_PENALTY = { sugary:1, energy:1.5, milk:0, other:0, coffee:0.5, juice:0.2 };
// Estimasyon sik (g) ak kafeyin (mg) pou chak 100ml, pa tip bwason — itilize pou AI Drink Analysis
const SUGAR_PER_100ML = { sugary:10.6, energy:11, coffee:0, juice:9, milk:5, other:4 };
const CAFFEINE_PER_100ML = { sugary:2, energy:32, coffee:40, juice:0, milk:0, other:0 };
// Limit rekòmande pou yon jou (itilize pou avètisman AI ak endèks sante)
const SUGAR_DAILY_LIMIT_G = 50;
const CAFFEINE_DAILY_LIMIT_MG = 200;
function toMl(amount, unit){ return (unit === 'L' ? amount*1000 : amount); }
function mlToGlasses(ml){ return ml / ML_PER_GLASS; }
const WALLET_ICONS = { cash:'banknote', natcash:'smartphone', moncash:'smartphone', bank:'landmark', savings:'piggy-bank', debitcard:'credit-card', custom:'wallet' };
const WALLET_TYPE_LABELS = { cash:'Kach', natcash:'NatCash', moncash:'MonCash', bank:'Bank', savings:'Epay', debitcard:'Kat Debi (USD)', custom:'Lòt' };
function walletTypeGuess(name){
  const n = (name||'').toLowerCase();
  if (n.includes('natcash')) return 'natcash';
  if (n.includes('moncash')) return 'moncash';
  if (n.includes('cash')) return 'cash';
  if (n.includes('epay')||n.includes('saving')) return 'savings';
  if (n.includes('bank')||n.includes('sogeb')||n.includes('unibank')||n.includes('capital')) return 'bank';
  if (n.includes('debit')||n.includes('kat')||n.includes('card')) return 'debitcard';
  return 'custom';
}

function isCashWallet(w){ return !!w && w.type === 'cash'; }
// ---- Yon depans "annatant" (pending) pa touche balans lan; "deja peye" (balanceCounted:false) ----
// pa touche l nonplis paske lajan an te deja soti deyò app la. Sa pa chanje okenn ansyen done
// (tx san 'status' kontinye konte nòmalman, jan yo te fè anvan).
function txCountsTowardBalance(t){
  if (t.type !== 'expense') return true;
  if (t.status === 'pending') return false;
  if (t.status === 'paid' && t.balanceCounted === false) return false;
  return true;
}
function walletBalance(w){
  const delta = tx.filter(t => t.walletId === w.id && txCountsTowardBalance(t)).reduce((s,t) => s + (t.type==='income'? t.amount : -t.amount), 0);
  return Math.round(((w.balance||0) + delta) * 100) / 100; // prezève santim, jis netwaye bri floating-point
}
// ---- Ede diferansye tranzaksyon HTG (defo) ak USD (Kat Debi) pou pa melanje 2 diviz nan menm total ----
function walletCurrency(w){ return (w && w.currency) || 'HTG'; }
function txWalletObj(t){ return wallets.find(w => w.id === t.walletId); }
function txCurrency(t){ return walletCurrency(txWalletObj(t)); }
function isHtgTx(t){ return txCurrency(t) !== 'USD'; }
function totalBalance(){ return wallets.filter(w => walletCurrency(w) !== 'USD').reduce((s,w) => s + walletBalance(w), 0); }
function totalUsdBalance(){ return wallets.filter(w => walletCurrency(w) === 'USD').reduce((s,w) => s + walletBalance(w), 0); }
function monthTx(){ const m = new Date().toISOString().slice(0,7); return tx.filter(t => t.date.slice(0,7) === m); }
function monthExpenseByCategory(){
  const map = {};
  monthTx().filter(t => t.type==='expense' && isHtgTx(t)).forEach(t => { map[t.category] = (map[t.category]||0) + t.amount; });
  return map;
}
function monthIncomeByCategory(){
  const map = {};
  monthTx().filter(t => t.type==='income' && isHtgTx(t)).forEach(t => { map[t.category] = (map[t.category]||0) + t.amount; });
  return map;
}

function renderWalletStrip(){
  const strip = document.getElementById('walletStrip');
  strip.innerHTML = '';
  wallets.forEach(w => {
    const el = document.createElement('div');
    el.className = 'card wallet-card';
    el.innerHTML = `<span class="wname"><i data-lucide="${WALLET_ICONS[w.type]||'wallet'}" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px"></i>${escapeHtml(w.name)}</span><span class="wbal">${fmtMoney(walletBalance(w), walletCurrency(w))}</span>`;
    el.addEventListener('click', openWalletsModal);
    strip.appendChild(el);
  });
  if (window.lucide) lucide.createIcons();
}

function populateTxCategoryFilter(){
  const sel = document.getElementById('filterTxCategory');
  const current = sel.value;
  const cats = [...new Set(tx.map(t => t.category).filter(Boolean))];
  sel.innerHTML = '<option value="">Tout kategori</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  sel.value = current;
}

function getFilteredTx(){
  const q = (document.getElementById('txSearch').value || '').toLowerCase();
  const tf = document.getElementById('filterTxType').value;
  const cf = document.getElementById('filterTxCategory').value;
  return tx.filter(t => {
    if (q && !(t.description||'').toLowerCase().includes(q) && !(t.category||'').toLowerCase().includes(q)) return false;
    if (tf && t.type !== tf) return false;
    if (cf && t.category !== cf) return false;
    return true;
  }).sort((a,b) => b.date.localeCompare(a.date));
}

const TX_ICONS = { 'Manje':'utensils', 'Transpò':'car', 'Entènèt':'wifi', 'Abònman':'repeat', 'Custom':'shapes',
  'Dlo':'droplet', 'Bwason':'cup-soda',
  'Salè':'briefcase', 'Lajan Resevwa':'hand-coins', 'Depo':'landmark', 'Kat Debi':'credit-card',
  'Kado':'gift', 'Biznis':'store', 'Lòt':'circle-dollar-sign' };

function txStatusBadge(t, w){
  if (!isCashWallet(w) || t.type !== 'expense' || !t.status) return '';
  if (t.status === 'pending') return `<span class="pill" style="background:var(--orange-soft);color:var(--orange);margin-left:6px;">Annatant</span>`;
  if (t.balanceCounted === false) return `<span class="pill" style="background:var(--green-soft);color:var(--green);margin-left:6px;">Deja Peye</span>`;
  return `<span class="pill" style="background:var(--blue-soft);color:var(--blue);margin-left:6px;">Peye</span>`;
}
function renderTxList(){
  populateTxCategoryFilter();
  const wrap = document.getElementById('txList');
  const list = getFilteredTx().slice(0, 25);
  wrap.innerHTML = '';
  if (!list.length){ wrap.innerHTML = '<div class="widget-empty">Pa gen tranzaksyon</div>'; return; }
  list.forEach(t => {
    const w = wallets.find(x => x.id === t.walletId);
    const row = document.createElement('div');
    row.className = 'tx-row';
    row.innerHTML = `
      <div class="tic" style="background:${t.type==='income'?'var(--green-soft)':'var(--red-soft)'};color:${t.type==='income'?'var(--green)':'var(--red)'}"><i data-lucide="${TX_ICONS[t.category]||'circle'}"></i></div>
      <div class="info"><b>${escapeHtml(t.description||t.category)}${txStatusBadge(t,w)}</b><span>${escapeHtml(t.category)} · ${escapeHtml(w?.name||'—')} · ${formatDeadline(t.date)}</span></div>
      <div class="amt ${t.type}">${t.type==='income'?'+':'-'}${fmtMoney(t.amount, walletCurrency(w))}</div>`;
    row.addEventListener('click', () => {
      if (isCashWallet(w) && t.type === 'expense' && t.status === 'pending'){ openTxStatusModal(t.id); return; }
      openTxModal(t.id);
    });
    wrap.appendChild(row);
  });
  if (window.lucide) lucide.createIcons();
}

function renderBudgetSummary(){
  const wrap = document.getElementById('budgetSummary');
  const spent = monthExpenseByCategory();
  const limits = budgets.limits || {};
  const cats = Object.keys(limits);
  if (!cats.length){ wrap.innerHTML = '<div class="widget-empty">Poko gen bidjè defini</div>'; if (typeof renderBudgetGoalConnections === 'function') renderBudgetGoalConnections(); return; }
  wrap.innerHTML = cats.map(c => {
    const s = spent[c] || 0, lim = limits[c] || 1;
    const pct = Math.min(100, Math.round((s/lim)*100));
    const over = s > lim;
    return `<div class="budget-row"><div class="lbl"><span>${escapeHtml(c)}</span><b style="${over?'color:var(--red)':''}">${fmtHTG(s)} / ${fmtHTG(lim)}</b></div>
      <div class="mini-progress"><span style="width:${pct}%;background:${over?'var(--red)':'var(--blue)'}"></span></div></div>`;
  }).join('');
  if (typeof renderBudgetGoalConnections === 'function') renderBudgetGoalConnections();
}

// ==========================================
// GOAL <-> BUDGET — preparasyon koneksyon (Pati 34/50)
// Lekti sèl. Sous verite rete goal.estimatedValue / goal.currentSavings /
// goal.monthlySavingPlan — pa gen okenn nouvo kalkil bidjè, pa gen
// tranzaksyon otomatik kreye. computeGoalFinancialRemaining() reyitilize
// (deja egziste, Pati 16/50).
// ==========================================
function financialGoalsForBudgetDisplay(){
  return goals.filter(g => g.isFinancial);
}
function renderBudgetGoalConnections(){
  const card = document.getElementById('budgetGoalConnectionsCard');
  const wrap = document.getElementById('budgetGoalConnections');
  if (!wrap || !card) return;
  const list = financialGoalsForBudgetDisplay();
  card.hidden = !list.length;
  if (!list.length){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = list.map(g => {
    const remaining = computeGoalFinancialRemaining(g);
    const plan = g.monthlySavingPlan != null ? g.monthlySavingPlan : null;
    const saved = g.currentSavings || 0;
    const pct = computeGoalFinancialProgressPct(g);
    return `<div class="milestone-row" style="flex-direction:column;align-items:stretch;gap:2px;">
      <span><b>${escapeHtml(g.name)}</b></span>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:2px;">
        <span style="color:var(--text-faint);">Plan Kontribisyon: <b style="color:var(--text);">${plan!=null ? fmtHTG(plan)+'/mwa' : '—'}</b></span>
        <span style="color:var(--text-faint);">Sere Deja: <b style="color:var(--text);">${fmtHTG(saved)}</b></span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px;">
        <span style="color:var(--text-faint);">Rete: <b style="color:var(--text);">${fmtHTG(remaining)}</b></span>
        <span style="color:var(--text-faint);">Pwogrè: <b style="color:var(--green);">${pct}%</b></span>
      </div>
    </div>`;
  }).join('');
}
function renderBudgetsManageGoalList(){
  const wrap = document.getElementById('budgetsManageGoalList');
  if (!wrap) return;
  const list = financialGoalsForBudgetDisplay();
  if (!list.length){ wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen Objektif Finansye kreye.</span>'; return; }
  wrap.innerHTML = list.map(g => {
    const remaining = computeGoalFinancialRemaining(g);
    const plan = g.monthlySavingPlan != null ? g.monthlySavingPlan : null;
    const saved = g.currentSavings || 0;
    const pct = computeGoalFinancialProgressPct(g);
    return `<div class="milestone-row" style="justify-content:space-between;">
      <span>${escapeHtml(g.name)} <span style="color:var(--text-faint);">(${plan!=null ? fmtHTG(plan)+'/mwa' : 'pa gen plan'} · Sere ${fmtHTG(saved)})</span></span>
      <span class="pill" style="background:var(--blue-soft);color:var(--blue);">Rete ${fmtHTG(remaining)} · ${pct}%</span>
    </div>`;
  }).join('');
}

const PIE_COLORS = ['var(--blue)','var(--green)','var(--orange)','var(--red)','#8B5CF6','#EC4899'];
function renderPieChart(){
  const wrap = document.getElementById('pieChartWrap');
  const data = monthExpenseByCategory();
  const entries = Object.entries(data).sort((a,b)=>b[1]-a[1]);
  const total = entries.reduce((s,[,v])=>s+v,0);
  if (!total){ wrap.innerHTML = '<div class="widget-empty">Pa gen depans mwa a</div>'; return; }
  let acc = 0;
  const stops = entries.map(([cat,v],i) => {
    const start = acc/total*360; acc += v; const end = acc/total*360;
    return `${PIE_COLORS[i%PIE_COLORS.length]} ${start}deg ${end}deg`;
  }).join(', ');
  wrap.innerHTML = `<div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(${stops});margin:0 auto;"></div>
    <div class="legend">${entries.map(([cat,v],i) => `<div class="lg-row"><span class="lg-dot" style="background:${PIE_COLORS[i%PIE_COLORS.length]}"></span>${escapeHtml(cat)}<b>${fmtHTG(v)}</b></div>`).join('')}</div>`;
}

function renderIncomePieChart(){
  const wrap = document.getElementById('incomePieChartWrap');
  const data = monthIncomeByCategory();
  const entries = Object.entries(data).sort((a,b)=>b[1]-a[1]);
  const total = entries.reduce((s,[,v])=>s+v,0);
  if (!total){ wrap.innerHTML = '<div class="widget-empty">Pa gen revni mwa a</div>'; return; }
  let acc = 0;
  const stops = entries.map(([cat,v],i) => {
    const start = acc/total*360; acc += v; const end = acc/total*360;
    return `${PIE_COLORS[i%PIE_COLORS.length]} ${start}deg ${end}deg`;
  }).join(', ');
  wrap.innerHTML = `<div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(${stops});margin:0 auto;"></div>
    <div class="legend">${entries.map(([cat,v],i) => `<div class="lg-row"><span class="lg-dot" style="background:${PIE_COLORS[i%PIE_COLORS.length]}"></span>${escapeHtml(cat)}<b>${fmtHTG(v)}</b></div>`).join('')}</div>`;
}

function renderBarChart(){
  const wrap = document.getElementById('barChartWrap');
  const months = [];
  for (let i=5;i>=0;i--){ const d = new Date(); d.setMonth(d.getMonth()-i); months.push(d.toISOString().slice(0,7)); }
  const maxVal = Math.max(1, ...months.map(m => {
    const inc = tx.filter(t=>t.type==='income'&&t.date.slice(0,7)===m&&isHtgTx(t)).reduce((s,t)=>s+t.amount,0);
    const exp = tx.filter(t=>t.type==='expense'&&t.date.slice(0,7)===m&&isHtgTx(t)).reduce((s,t)=>s+t.amount,0);
    return Math.max(inc,exp);
  }));
  wrap.innerHTML = `<div class="bar-chart">${months.map(m => {
    const inc = tx.filter(t=>t.type==='income'&&t.date.slice(0,7)===m&&isHtgTx(t)).reduce((s,t)=>s+t.amount,0);
    const exp = tx.filter(t=>t.type==='expense'&&t.date.slice(0,7)===m&&isHtgTx(t)).reduce((s,t)=>s+t.amount,0);
    const d = new Date(m+'-01');
    return `<div class="bc-col">
      <div style="display:flex;gap:2px;align-items:flex-end;height:100px;width:100%;">
        <div class="bc-fill" style="height:${(inc/maxVal*100)||1}%;background:var(--green);flex:1;"></div>
        <div class="bc-fill" style="height:${(exp/maxVal*100)||1}%;background:var(--red);flex:1;"></div>
      </div>
      <span class="bc-lbl">${MONTHS[d.getMonth()].slice(0,3)}</span>
    </div>`;
  }).join('')}</div>
  <div class="legend" style="flex-direction:row;gap:14px;margin-top:8px;">
    <div class="lg-row"><span class="lg-dot" style="background:var(--green)"></span>Antre</div>
    <div class="lg-row"><span class="lg-dot" style="background:var(--red)"></span>Sòti</div>
  </div>`;
}

function refreshDashboardFinanceWidget(){
  const balEl = document.getElementById('dashFinBalance');
  if (!balEl) return;
  balEl.textContent = fmtHTG(totalBalance());
  const expThisMonth = monthTx().filter(t=>t.type==='expense'&&isHtgTx(t)).reduce((s,t)=>s+t.amount,0);
  const incThisMonth = monthTx().filter(t=>t.type==='income'&&isHtgTx(t)).reduce((s,t)=>s+t.amount,0);
  document.getElementById('dashFinExpense').textContent = fmtHTG(expThisMonth);
  document.getElementById('dashFinSavings').textContent = fmtHTG(Math.max(0, incThisMonth - expThisMonth));
  const limitTotal = Object.values(budgets.limits||{}).reduce((s,v)=>s+v,0) || 1;
  const pct = Math.min(100, Math.round((expThisMonth/limitTotal)*100));
  document.getElementById('dashFinBudgetBar').style.width = pct + '%';
  document.getElementById('dashFinBudgetPct').textContent = pct + '%';
}
refreshDashboardFinanceWidget();

function renderFinance(){
  renderWalletStrip();
  renderTxList();
  renderBudgetSummary();
  renderPieChart();
  renderIncomePieChart();
  renderBarChart();
  renderIncomeChart();
  refreshDashboardFinanceWidget();
}

// ==========================================
// INCOME GRAPH — swiv sèlman tranzaksyon 'income' (Salè, Depo, Kat Debi, elatriye)
// San n pa touche chart depans (pie) ak chart Antre-vs-Sòti ki egziste deja.
// ==========================================
let incomeChartPeriod = loadLS('oslife.incomeChartPeriod', 'monthly');
function allIncomeTx(){ return tx.filter(t => t.type === 'income' && isHtgTx(t)); }
function incomeBucketKey(dateStr, period){
  const d = new Date(dateStr + 'T00:00:00');
  if (period === 'daily') return dateStr;
  if (period === 'weekly'){
    const day = (d.getDay() + 6) % 7; // Lendi = 0
    const monday = new Date(d); monday.setDate(d.getDate() - day);
    return monday.toISOString().slice(0,10);
  }
  if (period === 'yearly') return dateStr.slice(0,4);
  return dateStr.slice(0,7); // monthly (default)
}
function incomeBucketLabel(key, period){
  if (period === 'daily') return formatDeadline(key);
  if (period === 'weekly') return formatDeadline(key);
  if (period === 'yearly') return key;
  const d = new Date(key + '-01');
  return MONTHS[d.getMonth()].slice(0,3);
}
function incomeSeriesForPeriod(period){
  const n = period === 'daily' ? 14 : period === 'weekly' ? 8 : period === 'yearly' ? 5 : 6;
  const keys = [];
  const today = new Date();
  if (period === 'daily'){
    for (let i=n-1;i>=0;i--){ const d = new Date(); d.setDate(today.getDate()-i); keys.push(d.toISOString().slice(0,10)); }
  } else if (period === 'weekly'){
    const day = (today.getDay() + 6) % 7;
    const thisMonday = new Date(today); thisMonday.setDate(today.getDate()-day);
    for (let i=n-1;i>=0;i--){ const d = new Date(thisMonday); d.setDate(thisMonday.getDate()-i*7); keys.push(d.toISOString().slice(0,10)); }
  } else if (period === 'yearly'){
    for (let i=n-1;i>=0;i--){ keys.push(String(today.getFullYear()-i)); }
  } else {
    for (let i=n-1;i>=0;i--){ const d = new Date(); d.setMonth(today.getMonth()-i); keys.push(d.toISOString().slice(0,7)); }
  }
  const income = allIncomeTx();
  const totals = keys.map(k => income.filter(t => incomeBucketKey(t.date, period) === k).reduce((s,t)=>s+t.amount,0));
  return { keys, totals };
}
function renderIncomeChart(){
  document.querySelectorAll('#incomePeriodTabs .period-tab').forEach(b => b.classList.toggle('active', b.dataset.incomePeriod === incomeChartPeriod));
  const wrap = document.getElementById('incomeChartWrap');
  const legend = document.getElementById('incomeLegend');
  const { keys, totals } = incomeSeriesForPeriod(incomeChartPeriod);
  const totalIncome = totals.reduce((s,v)=>s+v,0);
  if (!totalIncome){
    wrap.innerHTML = '<div class="widget-empty">Pa gen revni pou peryòd sa a</div>';
    legend.innerHTML = '';
    return;
  }
  const maxVal = Math.max(1, ...totals);
  wrap.innerHTML = `<div class="bar-chart">${keys.map((k,i) => `
    <div class="bc-col">
      <div style="display:flex;align-items:flex-end;height:100px;width:100%;">
        <div class="bc-fill" style="height:${(totals[i]/maxVal*100)||1}%;background:var(--green);flex:1;" title="${fmtHTG(totals[i])}"></div>
      </div>
      <span class="bc-lbl">${escapeHtml(incomeBucketLabel(k, incomeChartPeriod))}</span>
    </div>`).join('')}</div>`;
  legend.innerHTML = `<div class="lg-row"><span class="lg-dot" style="background:var(--green)"></span>Total Revni<b>${fmtHTG(totalIncome)}</b></div>`;
}
document.querySelectorAll('#incomePeriodTabs .period-tab').forEach(b => b.addEventListener('click', () => {
  incomeChartPeriod = b.dataset.incomePeriod;
  saveLS('oslife.incomeChartPeriod', incomeChartPeriod);
  renderIncomeChart();
}));

['txSearch','filterTxType','filterTxCategory'].forEach(id => {
  document.getElementById(id).addEventListener('input', debounce(renderTxList, 200));
  document.getElementById(id).addEventListener('change', renderTxList);
});

// ---- Transaction Modal ----
let editingTxId = null;
function populateTxCategorySelect(type){
  const sel = document.getElementById('txCategory');
  const cats = type === 'income' ? getIncomeCategories() : getExpenseCategories();
  sel.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')
    + `<option value="__new__">+ Nouvo Kategori...</option>`;
  document.getElementById('txCategoryLabel').textContent = type === 'income' ? 'Sous Revni' : 'Kategori';
}
function populateTxWalletSelect(){
  const sel = document.getElementById('txWallet');
  sel.innerHTML = wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)} (${walletCurrency(w)})</option>`).join('');
}
function updateTxAmountLabel(){
  const w = wallets.find(x => x.id === document.getElementById('txWallet').value);
  document.getElementById('txAmountLabel').textContent = walletCurrency(w) === 'USD' ? 'Montan (USD $)' : 'Montan (HTG)';
}
// ---- Montre/kache chan siplemantè Dlo / Bwason ak animasyon (grid-template-rows) ----
function updateTxCategoryExtras(cat){
  const dlo = document.getElementById('txDloFields');
  const bwason = document.getElementById('txBwasonFields');
  dlo.classList.toggle('open', cat === 'Dlo');
  bwason.classList.toggle('open', cat === 'Bwason');
  if (window.lucide) lucide.createIcons();
}
// ---- Montre/kache ti chan pou kreye yon nouvo kategori pèsonalize ----
function updateTxNewCategoryVisibility(cat){
  const wrap = document.getElementById('txNewCategoryWrap');
  if (!wrap) return;
  wrap.hidden = cat !== '__new__';
  if (cat === '__new__'){
    const input = document.getElementById('txNewCategoryInput');
    if (input){ input.value = ''; input.focus(); }
  }
}
document.getElementById('txAddNewCategoryBtn')?.addEventListener('click', () => {
  const input = document.getElementById('txNewCategoryInput');
  if (!input || !input.value.trim()) return;
  const type = document.getElementById('txType').value;
  const finalName = addCustomTxCategory(type, input.value);
  if (!finalName) return;
  populateTxCategorySelect(type);
  document.getElementById('txCategory').value = finalName;
  updateTxNewCategoryVisibility(finalName);
  updateTxCategoryExtras(finalName);
  showToast('Nouvo kategori ajoute ✓');
});
function updateTxCashStatusVisibility(){
  const w = wallets.find(x => x.id === document.getElementById('txWallet').value);
  const show = document.getElementById('txType').value === 'expense' && isCashWallet(w);
  document.getElementById('txCashStatusFields').classList.toggle('open', show);
  if (window.lucide) lucide.createIcons();
}
function openTxModal(id){
  editingTxId = id || null;
  const t = id ? tx.find(x => x.id === id) : null;
  document.getElementById('txModalTitle').textContent = t ? 'Modifye Tranzaksyon' : 'Nouvo Tranzaksyon';
  document.getElementById('txType').value = t?.type || 'expense';
  populateTxCategorySelect(document.getElementById('txType').value);
  populateTxWalletSelect();
  document.getElementById('txAmount').value = t?.amount || '';
  document.getElementById('txDesc').value = t?.description || '';
  document.getElementById('txCategory').value = t?.category || (t?.type==='income'?INCOME_CATS[0]:EXPENSE_CATS[0]);
  document.getElementById('txWallet').value = t?.walletId || wallets[0]?.id || '';
  updateTxAmountLabel();
  document.getElementById('txPaymentStatus').value = t?.status === 'pending' ? 'pending' : 'paid';
  updateTxCashStatusVisibility();
  document.getElementById('txDate').value = t?.date || todayISO();
  document.getElementById('txTime').value = t?.time || new Date().toTimeString().slice(0,5);
  document.getElementById('deleteTxBtn').hidden = !t;
  // Dlo / Bwason: repopile chan siplemantè yo si n ap modifye, epi montre/kache seksyon ki koresponn
  document.getElementById('txWaterAmount').value = t?.waterAmount ?? '';
  document.getElementById('txWaterUnit').value = t?.waterUnit || 'ml';
  document.getElementById('txDrinkName').value = t?.drinkName || '';
  document.getElementById('txDrinkType').value = t?.drinkType || 'sugary';
  document.getElementById('txDrinkQty').value = t?.drinkQty ?? '';
  document.getElementById('txDrinkUnit').value = t?.drinkUnit || 'ml';
  updateTxCategoryExtras(document.getElementById('txCategory').value);
  updateTxNewCategoryVisibility(document.getElementById('txCategory').value);
  document.getElementById('txModalOverlay').classList.add('open');
}
document.getElementById('txType').addEventListener('change', e => {
  populateTxCategorySelect(e.target.value);
  updateTxCategoryExtras(document.getElementById('txCategory').value);
  updateTxNewCategoryVisibility(document.getElementById('txCategory').value);
  updateTxCashStatusVisibility();
});
document.getElementById('txCategory').addEventListener('change', e => {
  updateTxCategoryExtras(e.target.value);
  updateTxNewCategoryVisibility(e.target.value);
});
document.getElementById('txWallet').addEventListener('change', updateTxAmountLabel);
document.getElementById('txWallet').addEventListener('change', updateTxCashStatusVisibility);
document.getElementById('newTxBtn').addEventListener('click', () => openTxModal(null));
document.getElementById('closeTxModal').addEventListener('click', () => document.getElementById('txModalOverlay').classList.remove('open'));
document.getElementById('txModalOverlay').addEventListener('click', e => { if (e.target.id === 'txModalOverlay') document.getElementById('txModalOverlay').classList.remove('open'); });
// ==========================================
// AI MEMORY (Bwason/Sante) — analize istwa healthLogs.drinks pou jwenn abitid reyèl
// ==========================================
function computeDrinkMemory(){
  const nameCounts = {}, typeCounts = {};
  let totalSugar = 0, totalCaffeine = 0, totalWaterMl = 0, totalDrinksCount = 0;
  const dailyTotals = [];
  healthLogs.forEach(l => {
    const drinks = l.drinks || [];
    let daySugar = 0, dayCaffeine = 0;
    drinks.forEach(d => {
      nameCounts[d.name] = (nameCounts[d.name]||0) + 1;
      typeCounts[d.type] = (typeCounts[d.type]||0) + 1;
      daySugar += d.sugar || 0;
      dayCaffeine += d.caffeine || 0;
      totalDrinksCount++;
    });
    totalSugar += daySugar; totalCaffeine += dayCaffeine;
    totalWaterMl += (l.water||0);
    dailyTotals.push({ date: l.date, water: l.water||0, sugar: Math.round(daySugar*100)/100, caffeine: Math.round(dayCaffeine*100)/100, drinksCount: drinks.length });
  });
  dailyTotals.sort((a,b) => a.date.localeCompare(b.date));
  const topName = Object.entries(nameCounts).sort((a,b) => b[1]-a[1])[0] || null;
  const topType = Object.entries(typeCounts).sort((a,b) => b[1]-a[1])[0] || null;
  const busiestDay = dailyTotals.length ? [...dailyTotals].sort((a,b) => b.drinksCount-a.drinksCount)[0] : null;
  return { nameCounts, typeCounts, totalSugar, totalCaffeine, totalWaterMl, totalDrinksCount, dailyTotals, topName, topType, busiestDay };
}

// ---- Dlo / Bwason → efè otomatik sou Sante + mesaj AI (tranzaksyon finansye a toujou kreye separeman) ----
function applyDloHealthEffect(waterMl){
  const log = getHealthLog(todayISO(), true);
  const beforeScore = computeHealthScore(log);
  log.water = Math.round(((log.water||0) + waterMl) * 100) / 100;
  log.waterEntries = log.waterEntries || [];
  log.waterEntries.push({ ml: Math.round(waterMl*100)/100, time: new Date().toISOString() });
  persistHealthLogs();
  const afterScore = computeHealthScore(log);
  setCategory('health', afterScore);
  const delta = afterScore - beforeScore;
  const trend = delta > 0 ? 'monte' : (delta < 0 ? 'bese' : 'rete menm jan');
  const deltaTxt = delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta} pwen)` : '';
  let msg = `Ou ajoute ${fmtNum(waterMl)} ml dlo. Nòt idratasyon ou ${trend}${deltaTxt}.`;
  const weekStart = isoOffset(todayISO(), -6);
  const last7 = healthLogs.filter(l => l.date >= weekStart && l.date <= todayISO());
  const weekAvgMl = last7.length ? (last7.reduce((s,l)=>s+(l.water||0),0)/last7.length) : 0;
  if (weekAvgMl > 0){
    const todayMl = (log.water||0);
    if (todayMl > weekAvgMl * 1.1) msg += ' Ou pi idrate pase mwayèn semèn ou.';
    else if (todayMl < weekAvgMl * 0.6 && new Date().getHours() >= 15) msg += ' Ou anba mwayèn dlo semèn ou jodi a.';
  }
  return msg;
}
function applyDrinkHealthEffect(name, type, drinkMl){
  const log = getHealthLog(todayISO(), true);
  const beforeScore = computeHealthScore(log);
  const hydrationFactor = DRINK_HYDRATION_FACTOR[type] || 0;
  if (hydrationFactor > 0) log.water = Math.round(((log.water||0) + drinkMl*hydrationFactor) * 100) / 100;
  const penaltyWeight = DRINK_HEALTH_PENALTY[type] || 0;
  if (penaltyWeight > 0) log.badDrinks = Math.round(((log.badDrinks||0) + penaltyWeight) * 100) / 100;

  // Analiz sik/kafeyin pou bwason sa a (presizyon desimal konplè), epi mete l nan mémwa AI (healthLogs.drinks)
  const sugarG = Math.round((drinkMl/100) * (SUGAR_PER_100ML[type]||0) * 100) / 100;
  const caffeineMg = Math.round((drinkMl/100) * (CAFFEINE_PER_100ML[type]||0) * 100) / 100;
  log.sugar = Math.round(((log.sugar||0) + sugarG) * 100) / 100;
  log.caffeine = Math.round(((log.caffeine||0) + caffeineMg) * 100) / 100;
  log.drinks = log.drinks || [];
  log.drinks.push({ name, type, ml: drinkMl, sugar: sugarG, caffeine: caffeineMg, time: new Date().toISOString() });

  persistHealthLogs();
  const afterScore = computeHealthScore(log);
  setCategory('health', afterScore);
  const delta = afterScore - beforeScore;
  const typeLabel = DRINK_TYPE_LABELS[type] || 'Bwason';
  const trend = delta > 0 ? 'monte' : (delta < 0 ? 'bese' : 'rete menm jan');
  const deltaTxt = delta !== 0 ? ` (${delta > 0 ? '+' : ''}${delta} pwen)` : '';

  // Konpare ak istwa (mémwa AI) pou jwenn abitid reyèl, pa mesaj fiks
  const mem = computeDrinkMemory();
  const nameFreq = mem.nameCounts[name] || 0;
  const habitTxt = nameFreq > 1 ? ` Se ${nameFreq}yèm fwa ou ajoute ${name} nan istwa ou.` : '';

  let baseMsg;
  if (type === 'sugary'){
    baseMsg = `${name} gen anpil sik (~${fmtNum(sugarG)}g). Nòt sante ou ${trend}${deltaTxt}.`;
  } else if (type === 'energy'){
    baseMsg = `${name} gen kafeyin (~${fmtNum(caffeineMg)}mg). Nòt sante ou ${trend}${deltaTxt}.`;
    if ((log.caffeine||0) >= CAFFEINE_DAILY_LIMIT_MG) baseMsg += ' Evite yon lòt bwason ki gen anpil kafeyin jodi a.';
  } else if (type === 'coffee'){
    baseMsg = `${name} ajoute ~${fmtNum(caffeineMg)}mg kafeyin. Nòt sante ou ${trend}${deltaTxt}.`;
    if ((log.caffeine||0) >= CAFFEINE_DAILY_LIMIT_MG) baseMsg += ' Ou rive nan limit kafeyin rekòmande pou jodi a — evite yon lòt.';
  } else if (type === 'juice'){
    baseMsg = `${name} (ji fwi, ~${fmtNum(sugarG)}g sik). Nòt sante ou ${trend}${deltaTxt}.`;
  } else if (type === 'milk'){
    baseMsg = `Ou ajoute ${name} (lèt, ${fmtNum(drinkMl)}ml). Nòt sante ou ${trend}${deltaTxt}.`;
  } else {
    baseMsg = `Ou ajoute ${name} (${fmtNum(drinkMl)}ml, ${typeLabel}). Nòt sante ou ${trend}${deltaTxt}.`;
  }
  if ((log.sugar||0) >= SUGAR_DAILY_LIMIT_G && type !== 'sugary') baseMsg += ` Total sik jodi a rive ${fmtNum(log.sugar)}g — fè atansyon.`;
  return baseMsg + habitTxt;
}
document.getElementById('saveTxBtn').addEventListener('click', () => {
  const amount = Math.round((parseFloat(document.getElementById('txAmount').value) || 0) * 100) / 100;
  if (!amount || amount <= 0){ showToast('Mete yon montan valab'); return; }
  const category = document.getElementById('txCategory').value;
  if (category === '__new__'){ showToast('Ekri non nouvo kategori a epi klike ✓ anvan w anrejistre'); return; }

  // Dlo/Bwason: valide chan siplemantè yo (fòm nan toujou kenbe Montan/Kont/Dat/elatriye ki te la deja)
  let waterMl = null;
  let drinkName = '', drinkType = 'sugary', drinkMl = null;
  if (category === 'Dlo'){
    const waterAmount = parseFloat(document.getElementById('txWaterAmount').value);
    const waterUnit = document.getElementById('txWaterUnit').value;
    if (!waterAmount || waterAmount <= 0){ showToast('Mete kantite dlo a'); return; }
    waterMl = toMl(waterAmount, waterUnit);
  }
  if (category === 'Bwason'){
    drinkName = document.getElementById('txDrinkName').value.trim();
    drinkType = document.getElementById('txDrinkType').value;
    const drinkQty = parseFloat(document.getElementById('txDrinkQty').value);
    const drinkUnit = document.getElementById('txDrinkUnit').value;
    if (!drinkName){ showToast('Mete non bwason an'); return; }
    if (!drinkQty || drinkQty <= 0){ showToast('Mete kantite bwason an'); return; }
    drinkMl = toMl(drinkQty, drinkUnit);
  }

  const walletObj = wallets.find(w => w.id === document.getElementById('txWallet').value);
  const data = {
    type: document.getElementById('txType').value,
    amount,
    description: document.getElementById('txDesc').value.trim(),
    category,
    walletId: document.getElementById('txWallet').value,
    date: document.getElementById('txDate').value || todayISO(),
    time: document.getElementById('txTime').value || new Date().toTimeString().slice(0,5),
  };
  // Estati Peman: sèlman gen sans pou depans sou kont Kach — lòt kont yo kenbe ansyen konpòtman an
  if (data.type === 'expense' && isCashWallet(walletObj)){
    const st = document.getElementById('txPaymentStatus').value;
    data.status = st;
    data.balanceCounted = st === 'paid';
  } else {
    data.status = undefined;
    data.balanceCounted = undefined;
  }
  if (category === 'Dlo'){
    data.waterAmount = parseFloat(document.getElementById('txWaterAmount').value);
    data.waterUnit = document.getElementById('txWaterUnit').value;
  } else if (category === 'Bwason'){
    data.drinkName = drinkName;
    data.drinkType = drinkType;
    data.drinkQty = parseFloat(document.getElementById('txDrinkQty').value);
    data.drinkUnit = document.getElementById('txDrinkUnit').value;
  }

  if (editingTxId) Object.assign(tx.find(x => x.id === editingTxId), data);
  else tx.push({ id: uid(), ...data });
  persistTx();
  bumpCategory('finance', data.type==='income' ? 2 : -1);

  let aiMsg = 'Tranzaksyon anrejistre ✓';
  if (category === 'Dlo') aiMsg = applyDloHealthEffect(waterMl);
  else if (category === 'Bwason') aiMsg = applyDrinkHealthEffect(drinkName, drinkType, drinkMl);
  if (category === 'Dlo' || category === 'Bwason') renderHealth();

  document.getElementById('txModalOverlay').classList.remove('open');
  renderFinance();
  showToast(aiMsg);
});
document.getElementById('deleteTxBtn').addEventListener('click', () => {
  tx = tx.filter(t => t.id !== editingTxId);
  persistTx();
  document.getElementById('txModalOverlay').classList.remove('open');
  renderFinance();
  showToast('Tranzaksyon efase');
});

// ---- Modal Estati Tranzaksyon (Kach sèlman): "Peye Kounye a" oswa "Deja Peye" ----
let txStatusTargetId = null;
function openTxStatusModal(id){
  const t = tx.find(x => x.id === id);
  if (!t) return;
  txStatusTargetId = id;
  const w = wallets.find(x => x.id === t.walletId);
  document.getElementById('txStatusSummary').innerHTML = `
    <div class="tic" style="background:var(--red-soft);color:var(--red)"><i data-lucide="${TX_ICONS[t.category]||'circle'}"></i></div>
    <div class="info"><b>${escapeHtml(t.description||t.category)}</b><span>${escapeHtml(t.category)} · ${escapeHtml(w?.name||'—')} · ${formatDeadline(t.date)}</span></div>
    <div class="amt expense">-${fmtMoney(t.amount, walletCurrency(w))}</div>`;
  document.getElementById('txStatusModalOverlay').classList.add('open');
  if (window.lucide) lucide.createIcons();
}
document.getElementById('closeTxStatusModal').addEventListener('click', () => document.getElementById('txStatusModalOverlay').classList.remove('open'));
document.getElementById('txStatusModalOverlay').addEventListener('click', e => { if (e.target.id === 'txStatusModalOverlay') document.getElementById('txStatusModalOverlay').classList.remove('open'); });
document.getElementById('txStatusPayNowBtn').addEventListener('click', () => {
  const t = tx.find(x => x.id === txStatusTargetId);
  if (!t) return;
  t.status = 'paid';
  t.balanceCounted = true;
  persistTx();
  document.getElementById('txStatusModalOverlay').classList.remove('open');
  renderFinance();
  const w = wallets.find(x => x.id === t.walletId);
  showToast(w ? `Peye ✓ — Balans Kach: ${fmtMoney(walletBalance(w), walletCurrency(w))}` : 'Peye ✓');
});
document.getElementById('txStatusAlreadyPaidBtn').addEventListener('click', () => {
  const t = tx.find(x => x.id === txStatusTargetId);
  if (!t) return;
  t.status = 'paid';
  t.balanceCounted = false;
  persistTx();
  document.getElementById('txStatusModalOverlay').classList.remove('open');
  renderFinance();
  showToast('Make kòm deja peye — balans Kach pa chanje');
});

// ---- Wallets Modal ----
function openWalletsModal(){
  const wrap = document.getElementById('walletsManageList');
  wrap.innerHTML = wallets.map(w => `
    <div class="evt-row" data-id="${w.id}">
      <span class="dot" style="background:var(--blue)"></span>
      <div class="ic" style="width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;background:var(--blue-soft);color:var(--blue);"><i data-lucide="${WALLET_ICONS[w.type]||'wallet'}" style="width:14px;height:14px;"></i></div>
      <div class="info"><b>${escapeHtml(w.name)}</b><span>${WALLET_TYPE_LABELS[w.type]||'Lòt'} · ${fmtMoney(walletBalance(w), walletCurrency(w))}</span></div>
      <button class="icon-btn" data-del="${w.id}"><i data-lucide="trash-2"></i></button>
    </div>`).join('') || '<div class="widget-empty">Pa gen kont</div>';
  wrap.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.dataset.del;
    if (tx.some(t => t.walletId === id)){ showToast('Kont sa a gen tranzaksyon — pa ka efase l'); return; }
    wallets = wallets.filter(w => w.id !== id);
    persistWallets();
    openWalletsModal();
    renderFinance();
  }));
  document.getElementById('walletsModalOverlay').classList.add('open');
  if (window.lucide) lucide.createIcons();
}
document.getElementById('manageWalletsBtn').addEventListener('click', openWalletsModal);
document.getElementById('closeWalletsModal').addEventListener('click', () => document.getElementById('walletsModalOverlay').classList.remove('open'));
document.getElementById('walletsModalOverlay').addEventListener('click', e => { if (e.target.id === 'walletsModalOverlay') document.getElementById('walletsModalOverlay').classList.remove('open'); });
document.getElementById('newWalletType').addEventListener('change', e => {
  document.getElementById('newWalletBalanceLabel').textContent = e.target.value === 'debitcard' ? 'Balans depa (USD $)' : 'Balans depa (HTG)';
});
document.getElementById('addWalletBtn').addEventListener('click', () => {
  const name = document.getElementById('newWalletName').value.trim();
  const bal = Math.round((parseFloat(document.getElementById('newWalletBalance').value) || 0) * 100) / 100;
  const typeSel = document.getElementById('newWalletType').value;
  if (!name){ showToast('Mete yon non pou kont lan'); return; }
  const type = typeSel === 'auto' ? walletTypeGuess(name) : typeSel;
  const currency = type === 'debitcard' ? 'USD' : 'HTG';
  wallets.push({ id: uid(), name, type, balance: bal, currency });
  persistWallets();
  document.getElementById('newWalletName').value = '';
  document.getElementById('newWalletBalance').value = '';
  document.getElementById('newWalletType').value = 'auto';
  document.getElementById('newWalletBalanceLabel').textContent = 'Balans depa (HTG)';
  openWalletsModal();
  renderFinance();
  showToast('Kont ajoute ✓');
});

// ---- Budgets Modal ----
// Dlo ak Bwason pa ka gen bidjè — se kategori ki konekte ak Sante, pa objektif depans.
function budgetEligibleCats(){
  return getExpenseCategories().filter(c => c !== 'Custom' && c !== 'Dlo' && c !== 'Bwason');
}
let budgetDraftCats = [];
function renderBudgetsManageList(){
  const wrap = document.getElementById('budgetsManageList');
  wrap.innerHTML = budgetDraftCats.length ? budgetDraftCats.map(c => `
    <div class="form-row" style="align-items:center;margin-bottom:8px;grid-template-columns:1fr 1fr auto;">
      <label style="text-transform:none;font-size:12.5px;color:var(--text-dim);font-weight:500;margin:0;">${escapeHtml(c)}</label>
      <input type="number" class="budget-input" step="any" data-cat="${escapeHtml(c)}" value="${budgets.limits?.[c]||''}" placeholder="Limit HTG">
      <button type="button" class="icon-btn" data-remove-budget-cat="${escapeHtml(c)}" title="Retire bidjè"><i data-lucide="x"></i></button>
    </div>`).join('') : '<div class="widget-empty">Poko gen bidjè ajoute — chwazi yon kategori anba a pou kòmanse.</div>';
  const remaining = budgetEligibleCats().filter(c => !budgetDraftCats.includes(c));
  const dataList = document.getElementById('budgetAddCatList');
  dataList.innerHTML = remaining.map(c => `<option value="${escapeHtml(c)}"></option>`).join('');
  wrap.querySelectorAll('[data-remove-budget-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      budgetDraftCats = budgetDraftCats.filter(c => c !== btn.dataset.removeBudgetCat);
      renderBudgetsManageList();
    });
  });
  if (window.lucide) lucide.createIcons();
}
function openBudgetsModal(){
  document.getElementById('budgetPeriod').value = budgets.period || 'monthly';
  budgetDraftCats = Object.keys(budgets.limits || {}).filter(c => c !== 'Dlo' && c !== 'Bwason' && c !== 'Custom');
  document.getElementById('budgetAddCatInput').value = '';
  renderBudgetsManageList();
  if (typeof renderBudgetsManageGoalList === 'function') renderBudgetsManageGoalList();
  document.getElementById('budgetsModalOverlay').classList.add('open');
}
function addBudgetDraftCat(){
  const input = document.getElementById('budgetAddCatInput');
  const cat = input.value.trim();
  if (!cat || cat === 'Dlo' || cat === 'Bwason' || cat === 'Custom') { showToast('Non sa a pa disponib pou bidjè'); return; }
  if (budgetDraftCats.includes(cat)) { showToast('Kategori sa a deja gen bidjè'); return; }
  budgetDraftCats.push(cat);
  input.value = '';
  renderBudgetsManageList();
}
document.getElementById('budgetAddCatBtn').addEventListener('click', addBudgetDraftCat);
document.getElementById('budgetAddCatInput').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); addBudgetDraftCat(); } });
document.getElementById('manageBudgetsBtn').addEventListener('click', openBudgetsModal);
document.getElementById('closeBudgetsModal').addEventListener('click', () => document.getElementById('budgetsModalOverlay').classList.remove('open'));
document.getElementById('budgetsModalOverlay').addEventListener('click', e => { if (e.target.id === 'budgetsModalOverlay') document.getElementById('budgetsModalOverlay').classList.remove('open'); });
document.getElementById('saveBudgetsBtn').addEventListener('click', () => {
  const limits = {};
  document.querySelectorAll('.budget-input').forEach(inp => {
    const v = parseFloat(inp.value);
    if (v > 0) limits[inp.dataset.cat] = v;
  });
  budgets = { period: document.getElementById('budgetPeriod').value, limits };
  persistBudgets();
  document.getElementById('budgetsModalOverlay').classList.remove('open');
  renderFinance();
  showToast('Bidjè anrejistre ✓');
});

// ==========================================
// THEME TOGGLE
// ==========================================
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  const body = document.body;
  const isDark = body.getAttribute("data-theme") === "dark";
  body.setAttribute("data-theme", isDark ? "light" : "dark");
  themeToggle.innerHTML = `<i data-lucide="${isDark ? "sun" : "moon"}"></i>`;
  lucide.createIcons();
});

// ==========================================
// QUICK ACTIONS + TOAST
// ==========================================
const fabBtn = document.getElementById("fabBtn");
const qaPanel = document.getElementById("qaPanel");
const quickAddTop = document.getElementById("quickAddTop");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");

function toggleQaPanel(){ qaPanel.classList.toggle("open"); }
fabBtn.addEventListener("click", toggleQaPanel);
quickAddTop.addEventListener("click", toggleQaPanel);

function showToast(msg){
  toastText.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2400);
}

qaPanel.querySelectorAll(".qa-item").forEach(item => {
  item.addEventListener("click", () => {
    qaPanel.classList.remove("open");
    if (item.dataset.action === 'task'){ showView('tasks'); openTaskModal(null); return; }
    if (item.dataset.action === 'event'){ showView('calendar'); openEventModal(null); return; }
    if (item.dataset.action === 'habit'){ showView('habits'); openHabitModal(null); return; }
    if (item.dataset.action === 'tx'){ showView('finance'); openTxModal(null); return; }
    if (item.dataset.action === 'plan'){ showView('internet'); openPlanModal(null); return; }
    if (item.dataset.action === 'project'){ showView('projects'); openProjectModal(null); return; }
    if (item.dataset.action === 'note'){ showView('notes'); openNoteModal(null); return; }
    showToast(item.dataset.msg);
  });
});

document.getElementById("startLessonBtn").addEventListener("click", () => {
  showToast("Sesyon JavaScript kòmanse — bon travay! ✓");
});
document.getElementById("renewInternetBtn").addEventListener("click", () => {
  showView('internet');
  const active = getActivePlan();
  if (active) openPlanModal(active.id, true);
  else openPlanModal(null);
});

document.addEventListener("click", (e) => {
  if (!qaPanel.contains(e.target) && e.target !== fabBtn && e.target !== quickAddTop && !quickAddTop.contains(e.target) && !fabBtn.contains(e.target)) {
    qaPanel.classList.remove("open");
  }
});

// ==========================================
// INTERNET / MOBILE PLAN MANAGER MODULE
// ==========================================
const PLAN_TYPES = { internet:'Entènèt', unlimited:'Ilimite', calls:'Apèl', sms:'SMS', combo:'Combo', custom:'Custom' };
const PLAN_STATUS_LABEL = { active:'Aktif', paused:'An Poz', expired:'Ekspire', completed:'Fini', cancelled:'Anile' };
const PLAN_STATUS_COLOR = { active:'var(--green)', paused:'var(--orange)', expired:'var(--red)', completed:'var(--text-faint)', cancelled:'var(--text-faint)' };
const PLAN_TX_CATEGORY = 'Entènèt';

function daysBetween(a,b){ return Math.round((new Date(b+'T00:00:00') - new Date(a+'T00:00:00')) / 86400000); }

// Recompute derived status (active -> expired) based on today's date, without touching a manually paused/cancelled/completed plan.
function refreshPlanStatuses(){
  const t = todayISO();
  let changed = false;
  plans.forEach(p => {
    if (p.status === 'active' && p.expireDate && p.expireDate < t){
      p.status = 'expired';
      changed = true;
    }
  });
  if (changed) persistPlans();
}

function planDaysLeft(p){
  if (!p.expireDate) return null;
  return daysBetween(todayISO(), p.expireDate);
}

function planProgressPct(p){
  if (!p.startDate || !p.expireDate) return 0;
  const total = Math.max(1, daysBetween(p.startDate, p.expireDate));
  const elapsed = Math.max(0, daysBetween(p.startDate, todayISO()));
  return Math.min(100, Math.round((elapsed/total)*100));
}

function getActivePlan(){
  const active = plans.filter(p => p.status === 'active');
  active.sort((a,b) => (a.expireDate||'9999').localeCompare(b.expireDate||'9999'));
  return active[0] || null;
}

function operatorIcon(op){
  const o = (op||'').toLowerCase();
  if (o.includes('digicel')) return 'radio-tower';
  if (o.includes('natcom')) return 'signal';
  return 'wifi';
}

// ---- Dashboard widget ----
function refreshDashboardInternetWidget(){
  refreshPlanStatuses();
  const opEl = document.getElementById('dashNetOperator');
  if (!opEl) return;
  const p = getActivePlan();
  if (!p){
    document.getElementById('dashNetOperator').textContent = '—';
    document.getElementById('dashNetName').textContent = 'Pa gen plan aktif';
    document.getElementById('dashNetRemaining').textContent = '—';
    document.getElementById('dashNetBar').style.width = '0%';
    return;
  }
  document.getElementById('dashNetOperator').textContent = p.operator;
  document.getElementById('dashNetName').textContent = p.name;
  if (p.isUnlimited){
    const left = planDaysLeft(p);
    document.getElementById('dashNetRemaining').textContent = left != null ? `${left} jou` : 'Ilimite';
  } else {
    const left = planDaysLeft(p);
    document.getElementById('dashNetRemaining').textContent = left != null ? `${left} jou` : '—';
  }
  const pct = planProgressPct(p);
  const left = planDaysLeft(p);
  const urgent = left != null && left <= 2;
  document.getElementById('dashNetBar').style.width = pct + '%';
  document.getElementById('dashNetBar').style.background = urgent ? 'var(--red)' : 'var(--orange)';
}

// ---- Finance integration ----
function createPlanTransaction(p){
  if (!p.walletId || !p.price) return;
  tx.push({
    id: uid(), type:'expense', amount: p.price,
    description: `Plan ${escapeHtml(p.operator)} — ${escapeHtml(p.name)}`,
    category: PLAN_TX_CATEGORY, walletId: p.walletId, date: p.startDate || todayISO(),
  });
  persistTx();
}

// ---- Notifications (checked on load + when opening the Internet view) ----
function checkPlanNotifications(){
  refreshPlanStatuses();
  const t = todayISO();
  plans.filter(p => p.status === 'active').forEach(p => {
    const left = planDaysLeft(p);
    if (left === null) return;
    if (left === 3) showToast(`⚠ Plan "${p.name}" ap ekspire nan 3 jou`);
    else if (left === 2) showToast(`⚠ Plan "${p.name}" ap ekspire nan 2 jou`);
    else if (left === 1) showToast(`⚠ Plan "${p.name}" ap ekspire demen`);
    else if (left === 0) showToast(`⏰ Plan "${p.name}" ekspire jodi a`);
  });
}

// ---- AI recommendation: if buying short plans from same operator repeatedly, suggest a monthly plan ----
function renderPlanAiSuggest(){
  const wrap = document.getElementById('planAiSuggest');
  if (!wrap) return;
  wrap.innerHTML = '';
  const shortPlans = plans.filter(p => !p.isUnlimited && p.duration && p.duration <= 7);
  const byOperator = {};
  shortPlans.forEach(p => { (byOperator[p.operator] = byOperator[p.operator] || []).push(p); });
  const candidate = Object.entries(byOperator).find(([,list]) => list.length >= 3);
  if (!candidate) return;
  const [operator, list] = candidate;
  const totalSpent = list.reduce((s,p) => s + (p.price||0), 0);
  const banner = document.createElement('div');
  banner.className = 'ai-suggest';
  banner.innerHTML = `<i data-lucide="sparkles"></i><div><b>AI Planner</b><span>Ou achte ${list.length} plan kout ${escapeHtml(operator)} (${fmtHTG(totalSpent)} total) — yon plan mansyèl ka koute w mwens. Vle m ede w konpare?</span></div>`;
  wrap.appendChild(banner);
  if (window.lucide) lucide.createIcons();
}

// ---- Stats ----
function renderPlanStats(){
  const el = document.getElementById('planStats');
  const totalSpent = plans.reduce((s,p) => s + (p.price||0), 0);
  const monthKey = new Date().toISOString().slice(0,7);
  const monthlyCost = plans.filter(p => (p.startDate||'').slice(0,7) === monthKey).reduce((s,p) => s + (p.price||0), 0);
  const opCount = {};
  plans.forEach(p => { opCount[p.operator] = (opCount[p.operator]||0) + 1; });
  const mostUsed = Object.entries(opCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
  const internetDays = plans.filter(p => !p.isUnlimited).reduce((s,p) => s + (p.duration||0), 0);
  el.innerHTML = `
    <div class="st"><b>${fmtHTG(totalSpent)}</b><span>Total depanse</span></div>
    <div class="st"><b>${fmtHTG(monthlyCost)}</b><span>Kout mwa sa a</span></div>
    <div class="st"><b>${escapeHtml(mostUsed)}</b><span>Operatè pi itilize</span></div>
    <div class="st"><b>${plans.length}</b><span>Nonb plan</span></div>
    <div class="st"><b>${internetDays}</b><span>Jou entènèt achte</span></div>
  `;
}

// ---- Filters + render list ----
function populatePlanOperatorFilter(){
  const sel = document.getElementById('filterPlanOperator');
  const current = sel.value;
  const ops = [...new Set(plans.map(p => p.operator).filter(Boolean))];
  sel.innerHTML = '<option value="">Tout operatè</option>' + ops.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
  sel.value = current;
}

function getFilteredPlans(){
  const q = (document.getElementById('planSearch').value || '').toLowerCase();
  const opF = document.getElementById('filterPlanOperator').value;
  const stF = document.getElementById('filterPlanStatus').value;
  return plans.filter(p => {
    if (q && !((p.name||'').toLowerCase().includes(q) || (p.operator||'').toLowerCase().includes(q))) return false;
    if (opF && p.operator !== opF) return false;
    if (stF && p.status !== stF) return false;
    return true;
  }).sort((a,b) => (b.startDate||'').localeCompare(a.startDate||''));
}

function buildPlanCard(p){
  const el = document.createElement('div');
  el.className = 'card plan-card';
  const left = planDaysLeft(p);
  const pct = planProgressPct(p);
  const urgent = p.status === 'active' && left != null && left <= 2;
  el.innerHTML = `
    <div class="plan-card-head">
      <div class="ic"><i data-lucide="${operatorIcon(p.operator)}"></i></div>
      <div class="info"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.operator)} · ${PLAN_TYPES[p.type]||p.type}</span></div>
      <span class="pill" style="background:color-mix(in srgb, ${PLAN_STATUS_COLOR[p.status]} 16%, transparent);color:${PLAN_STATUS_COLOR[p.status]}">${PLAN_STATUS_LABEL[p.status]}</span>
    </div>
    <div class="plan-meta">
      <span class="pill" style="background:var(--surface-2);color:var(--text-dim)">${fmtHTG(p.price)}</span>
      ${p.isUnlimited ? '<span class="pill" style="background:var(--surface-2);color:var(--text-dim)">Ilimite</span>' : `<span class="pill" style="background:var(--surface-2);color:var(--text-dim)">${p.duration} jou</span>`}
    </div>
    ${p.status === 'active' || p.status === 'paused' ? `
    <div class="plan-progress-row">
      <div class="lbl"><span>Pwogrè</span><b style="${urgent?'color:var(--red)':''}">${left != null ? left + ' jou rete' : '—'}</b></div>
      <div class="mini-progress"><span style="width:${pct}%;background:${urgent?'var(--red)':'var(--orange)'}"></span></div>
    </div>` : ''}
    <div class="plan-foot"><span>${p.startDate ? formatDeadline(p.startDate) : '—'} → ${p.expireDate ? formatDeadline(p.expireDate) : '—'}</span></div>
  `;
  el.addEventListener('click', () => openPlanUsageModal(p.id));
  return el;
}

function renderDataUsageAnalysis(planId){
  const el = document.getElementById('dataUsageAnalysis');
  if (!el) return;
  const logs = dataUsageLogs.filter(l => l.planId === planId);
  if (!logs.length){
    el.innerHTML = '<div class="widget-empty">Poko gen done anrejistre. Ranpli fòm anwo a pou kòmanse swiv itilizasyon w.</div>';
    return;
  }
  const byApp = {};
  logs.forEach(l => {
    if (!byApp[l.app]) byApp[l.app] = { minutes:0, mb:0 };
    byApp[l.app].minutes += l.minutes || 0;
    byApp[l.app].mb += l.mbUsed || 0;
  });
  const rows = Object.entries(byApp).sort((a,b) => b[1].mb - a[1].mb);
  const topTime = Object.entries(byApp).sort((a,b) => b[1].minutes - a[1].minutes)[0];
  const topMb = rows[0];
  el.innerHTML = `
    <div class="stat-line"><span>App ou plis pase tan ladan l</span><b>${topTime ? escapeHtml(topTime[0]) + ' · ' + topTime[1].minutes + ' min' : '—'}</b></div>
    <div class="stat-line"><span>App ki manje plis done</span><b>${topMb ? escapeHtml(topMb[0]) + ' · ' + Math.round(topMb[1].mb) + ' MB' : '—'}</b></div>
    <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
      ${rows.map(([app,v]) => `<div class="stat-line"><span>${escapeHtml(app)}</span><b>${v.minutes} min · ${Math.round(v.mb)} MB</b></div>`).join('')}
    </div>
  `;
}
// ---- Plan Usage Modal (opened by clicking a plan card) ----
let currentUsagePlanId = null;

function openPlanUsageModal(id){
  const p = plans.find(x => x.id === id);
  if (!p) return;
  currentUsagePlanId = id;
  document.getElementById('planUsageTitle').textContent = p.name;

  const left = planDaysLeft(p);
  const planLogs = dataUsageLogs.filter(l => l.planId === p.id);
  const latestRemaining = planLogs.length ? planLogs[planLogs.length - 1].mbRemaining : (p.totalMb ?? null);

  document.getElementById('planUsageSummary').innerHTML = `
    <div class="stat-line"><span>Operatè</span><b>${escapeHtml(p.operator)} · ${PLAN_TYPES[p.type]||p.type}</b></div>
    <div class="stat-line"><span>Pri</span><b>${fmtHTG(p.price)}</b></div>
    <div class="stat-line"><span>Estati</span><b>${PLAN_STATUS_LABEL[p.status]}</b></div>
    ${!p.isUnlimited ? `<div class="stat-line"><span>Jou rete</span><b>${left != null ? left + ' jou' : '—'}</b></div>` : ''}
    ${!p.isUnlimited && p.totalMb ? `<div class="stat-line"><span>Total MB</span><b>${p.totalMb} MB</b></div>` : ''}
    ${!p.isUnlimited && latestRemaining != null ? `<div class="stat-line"><span>MB ki rete</span><b>${Math.round(latestRemaining)} MB</b></div>` : ''}
  `;

  const barEl = document.getElementById('planUsageBar');
  if (!p.isUnlimited && p.totalMb && latestRemaining != null){
    const pct = Math.max(0, Math.min(100, Math.round((latestRemaining / p.totalMb) * 100)));
    barEl.innerHTML = `<div class="mini-progress"><span style="width:${pct}%;background:${pct <= 15 ? 'var(--red)' : 'var(--orange)'}"></span></div>`;
  } else {
    barEl.innerHTML = '';
  }

  const trackWrap = document.getElementById('planUsageTrackWrap');
  const unlimitedMsg = document.getElementById('planUsageUnlimitedMsg');
  if (p.isUnlimited){
    trackWrap.hidden = true;
    unlimitedMsg.hidden = false;
  } else {
    trackWrap.hidden = false;
    unlimitedMsg.hidden = true;
    const dl = document.getElementById('dataUsageAppList');
    if (dl) dl.innerHTML = dataUsageApps.map(a => `<option value="${escapeHtml(a)}"></option>`).join('');
    document.getElementById('dataUsageMbInput').value = '';
    document.getElementById('dataUsageAppInput').value = '';
    document.getElementById('dataUsageMinInput').value = '';
    renderDataUsageAnalysis(p.id);
  }

  document.getElementById('planUsageModalOverlay').classList.add('open');
  if (window.lucide) lucide.createIcons();
}
function closePlanUsageModal(){ document.getElementById('planUsageModalOverlay').classList.remove('open'); currentUsagePlanId = null; }

function saveDataUsageEntry(){
  const p = plans.find(x => x.id === currentUsagePlanId);
  if (!p || p.isUnlimited) return;
  const mbInput = document.getElementById('dataUsageMbInput');
  const appInput = document.getElementById('dataUsageAppInput');
  const minInput = document.getElementById('dataUsageMinInput');
  const mb = Number(mbInput.value);
  const app = (appInput.value || '').trim();
  const minutes = Number(minInput.value) || 0;
  if (!app || isNaN(mb) || mbInput.value === ''){ showToast('Ranpli MB ki rete a ak non app la'); return; }
  const planLogs = dataUsageLogs.filter(l => l.planId === p.id);
  const prev = planLogs[planLogs.length - 1];
  const prevRemaining = prev ? prev.mbRemaining : p.totalMb;
  const mbUsed = prevRemaining != null ? Math.max(0, prevRemaining - mb) : 0;
  dataUsageLogs.push({ id:uid(), planId:p.id, date:todayISO(), app, minutes, mbRemaining:mb, mbUsed });
  if (!dataUsageApps.includes(app)){ dataUsageApps.push(app); persistDataUsageApps(); }
  persistDataUsageLogs();
  mbInput.value = ''; appInput.value = ''; minInput.value = '';
  showToast('Antre anrejistre ✓');
  openPlanUsageModal(p.id);
}
document.getElementById('dataUsageSaveBtn')?.addEventListener('click', saveDataUsageEntry);
document.getElementById('closePlanUsageModal').addEventListener('click', closePlanUsageModal);
document.getElementById('planUsageModalOverlay').addEventListener('click', e => { if (e.target.id === 'planUsageModalOverlay') closePlanUsageModal(); });
document.getElementById('modifyPlanFromUsageBtn').addEventListener('click', () => {
  const id = currentUsagePlanId;
  closePlanUsageModal();
  openPlanModal(id);
});

function renderPlans(){
  refreshPlanStatuses();
  populatePlanOperatorFilter();
  const grid = document.getElementById('planGrid');
  grid.innerHTML = '';
  const list = getFilteredPlans();
  if (!list.length){
    grid.innerHTML = '<div class="widget-empty">Pa gen plan ki koresponn ak rechèch la</div>';
  } else {
    list.forEach(p => grid.appendChild(buildPlanCard(p)));
  }
  renderPlanStats();
  renderPlanAiSuggest();
  checkPlanNotifications();
  refreshDashboardInternetWidget();
  if (window.lucide) lucide.createIcons();
}

['planSearch','filterPlanOperator','filterPlanStatus'].forEach(id => {
  document.getElementById(id).addEventListener('input', debounce(renderPlans, 200));
  document.getElementById(id).addEventListener('change', renderPlans);
});

// ---- Plan Modal ----
let editingPlanId = null;

function populatePlanWalletSelect(){
  const sel = document.getElementById('planWallet');
  sel.innerHTML = wallets.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('');
}

function computeExpireFromStart(){
  const unlimited = document.getElementById('planIsUnlimited').checked;
  if (unlimited) return;
  const start = document.getElementById('planStartDate').value;
  const dur = parseInt(document.getElementById('planDuration').value, 10);
  if (start && dur > 0){
    const d = new Date(start + 'T00:00:00');
    d.setDate(d.getDate() + dur);
    document.getElementById('planExpireDate').value = d.toISOString().slice(0,10);
  }
}
['planStartDate','planDuration'].forEach(id => document.getElementById(id).addEventListener('change', computeExpireFromStart));
document.getElementById('planIsUnlimited').addEventListener('change', e => {
  document.getElementById('planDuration').disabled = e.target.checked;
  document.getElementById('planTotalMbWrap').hidden = e.target.checked;
});

document.getElementById('planOperator').addEventListener('change', e => {
  document.getElementById('planOperatorCustomWrap').hidden = e.target.value !== 'custom';
});

function openPlanModal(id, prefillDuplicate){
  editingPlanId = id || null;
  const p = id ? plans.find(x => x.id === id) : null;
  populatePlanWalletSelect();
  document.getElementById('planModalTitle').textContent = p ? 'Modifye Plan' : (prefillDuplicate ? 'Renouvle Plan' : 'Nouvo Plan');

  const knownOps = ['Natcom','Digicel'];
  const opVal = p?.operator;
  document.getElementById('planOperator').value = knownOps.includes(opVal) ? opVal : (opVal ? 'custom' : 'Natcom');
  document.getElementById('planOperatorCustomWrap').hidden = document.getElementById('planOperator').value !== 'custom';
  document.getElementById('planOperatorCustom').value = knownOps.includes(opVal) ? '' : (opVal || '');

  document.getElementById('planType').value = p?.type || 'internet';
  document.getElementById('planName').value = p?.name || '';
  document.getElementById('planPrice').value = p?.price || '';
  document.getElementById('planDuration').value = p?.duration || '';
  document.getElementById('planIsUnlimited').checked = !!p?.isUnlimited;
  document.getElementById('planDuration').disabled = !!p?.isUnlimited;
  document.getElementById('planTotalMb').value = p?.totalMb || '';
  document.getElementById('planTotalMbWrap').hidden = !!p?.isUnlimited;
  document.getElementById('planStartDate').value = p?.startDate || todayISO();
  document.getElementById('planExpireDate').value = p?.expireDate || '';
  document.getElementById('planNotes').value = p?.notes || '';

  document.getElementById('deletePlanBtn').hidden = !p;
  document.getElementById('duplicatePlanBtn').hidden = !p;
  document.getElementById('completePlanBtn').hidden = !p || !['active','paused'].includes(p.status);
  document.getElementById('cancelPlanBtn').hidden = !p || !['active','paused'].includes(p.status);
  const pauseBtn = document.getElementById('pauseResumePlanBtn');
  if (p && (p.status === 'active' || p.status === 'paused')){
    pauseBtn.hidden = false;
    pauseBtn.textContent = p.status === 'active' ? 'Mete an Poz' : 'Reprann';
  } else {
    pauseBtn.hidden = true;
  }

  document.getElementById('planModalOverlay').classList.add('open');
}
function closePlanModal(){ document.getElementById('planModalOverlay').classList.remove('open'); editingPlanId = null; }

function readPlanForm(){
  const opSel = document.getElementById('planOperator').value;
  const operator = opSel === 'custom' ? (document.getElementById('planOperatorCustom').value.trim() || 'Lòt') : opSel;
  const isUnlimited = document.getElementById('planIsUnlimited').checked;
  return {
    operator,
    type: document.getElementById('planType').value,
    name: document.getElementById('planName').value.trim(),
    price: parseFloat(document.getElementById('planPrice').value) || 0,
    duration: isUnlimited ? null : (parseInt(document.getElementById('planDuration').value, 10) || 0),
    isUnlimited,
    totalMb: isUnlimited ? null : (parseFloat(document.getElementById('planTotalMb').value) || null),
    startDate: document.getElementById('planStartDate').value || todayISO(),
    expireDate: document.getElementById('planExpireDate').value || '',
    walletId: document.getElementById('planWallet').value,
    notes: document.getElementById('planNotes').value.trim(),
  };
}

document.getElementById('savePlanBtn').addEventListener('click', () => {
  const data = readPlanForm();
  if (!data.name){ showToast('Mete yon non pou plan an'); return; }
  if (!data.isUnlimited && !data.expireDate){ showToast('Mete dire oswa dat ekspirasyon'); return; }
  if (!data.isUnlimited && data.expireDate && data.startDate && data.expireDate < data.startDate){
    showToast('Dat ekspirasyon an pa ka anvan dat kòmansman an'); return;
  }
  const isNew = !editingPlanId;
  let plan;
  if (editingPlanId){
    plan = plans.find(x => x.id === editingPlanId);
    Object.assign(plan, data);
  } else {
    plan = { id: uid(), status:'active', createdAt: new Date().toISOString(), ...data };
    plans.push(plan);
    createPlanTransaction(plan);
    bumpCategory('finance', -1);
  }
  persistPlans();
  closePlanModal();
  renderPlans();
  showToast('Plan anrejistre ✓');
});

document.getElementById('deletePlanBtn').addEventListener('click', () => {
  plans = plans.filter(p => p.id !== editingPlanId);
  persistPlans();
  closePlanModal();
  renderPlans();
  showToast('Plan efase');
});

document.getElementById('duplicatePlanBtn').addEventListener('click', () => {
  const src = plans.find(x => x.id === editingPlanId);
  if (!src) return;
  const start = todayISO();
  const newPlan = {
    ...src, id: uid(), status:'active', startDate: start, createdAt: new Date().toISOString(),
  };
  if (!src.isUnlimited && src.duration){
    const d = new Date(start + 'T00:00:00');
    d.setDate(d.getDate() + src.duration);
    newPlan.expireDate = d.toISOString().slice(0,10);
  }
  plans.push(newPlan);
  createPlanTransaction(newPlan);
  bumpCategory('finance', -1);
  persistPlans();
  closePlanModal();
  renderPlans();
  showToast('Plan dwaplike ak renouvle ✓');
});

document.getElementById('pauseResumePlanBtn').addEventListener('click', () => {
  const p = plans.find(x => x.id === editingPlanId);
  if (!p) return;
  p.status = p.status === 'active' ? 'paused' : 'active';
  persistPlans();
  closePlanModal();
  renderPlans();
  showToast(p.status === 'paused' ? 'Plan mete an poz' : 'Plan reprann');
});

document.getElementById('completePlanBtn').addEventListener('click', () => {
  const p = plans.find(x => x.id === editingPlanId);
  if (!p) return;
  p.status = 'completed';
  persistPlans();
  closePlanModal();
  renderPlans();
  showToast('Plan make kòm fini');
});

document.getElementById('cancelPlanBtn').addEventListener('click', () => {
  const p = plans.find(x => x.id === editingPlanId);
  if (!p) return;
  p.status = 'cancelled';
  persistPlans();
  closePlanModal();
  renderPlans();
  showToast('Plan anile');
});

document.getElementById('newPlanBtn').addEventListener('click', () => openPlanModal(null));
document.getElementById('closePlanModal').addEventListener('click', closePlanModal);
document.getElementById('planModalOverlay').addEventListener('click', e => { if (e.target.id === 'planModalOverlay') closePlanModal(); });

refreshDashboardInternetWidget();

// ==========================================
// PROJECTS MODULE
// ==========================================
// Pati 33/50: si Pwojè a lye ak yon Objektif (p.goalId), pwogrè a SWIV
// g.progress dirèkteman — se sèl sous kalkil (g.progress deja gwoupe
// Abitid + Finans + Aprantisaj, wè renderGoalLearningProgressPreview /
// renderGoalContributionSummary). Nou PA rekalkile Abitid/Finans/Aprantisaj
// isit la ankò, pou evite doub kalkil. Si pa gen lyen, tonbe sou ansyen
// lojik tach yo (pa touche).
function computeProjectProgress(p){
  if (p.goalId){
    const g = goals.find(x => x.id === p.goalId);
    if (g) return g.progress || 0;
  }
  if (!p.tasks || !p.tasks.length) return 0;
  const done = p.tasks.filter(t => t.done).length;
  return Math.round((done / p.tasks.length) * 100);
}

function getFilteredSortedProjects(){
  const q = (document.getElementById('projectSearch').value || '').toLowerCase();
  const sort = document.getElementById('sortProjects').value;
  let list = projects.filter(p => !q || p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  if (sort === 'deadline') list = list.slice().sort((a,b) => (a.deadline||'9999').localeCompare(b.deadline||'9999'));
  else if (sort === 'progress') list = list.slice().sort((a,b) => computeProjectProgress(b) - computeProjectProgress(a));
  else if (sort === 'name') list = list.slice().sort((a,b) => a.name.localeCompare(b.name));
  return list;
}

function buildProjectCard(p){
  const el = document.createElement('div');
  el.className = 'task-card project-card';
  el.draggable = true;
  el.dataset.id = p.id;
  const progress = computeProjectProgress(p);
  const doneCount = (p.tasks||[]).filter(t=>t.done).length;
  const overdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
  const linkedGoal = p.goalId ? goals.find(g => g.id === p.goalId) : null;
  el.innerHTML = `
    <div class="tc-title">${escapeHtml(p.name)}</div>
    ${p.description ? `<div class="tc-sub">${escapeHtml(p.description).slice(0,70)}</div>` : ''}
    <div class="mini-progress"><span style="width:${progress}%;background:var(--gradient-life)"></span></div>
    <div class="tc-meta">
      ${(p.tasks||[]).length ? `<span class="pill" style="background:var(--surface);color:var(--text-dim);"><i data-lucide="list-checks" style="width:10px;height:10px;"></i> ${doneCount}/${p.tasks.length}</span>` : ''}
      ${p.deadline ? `<span class="pill" style="background:${overdue?'var(--red-soft)':'var(--surface)'};color:${overdue?'var(--red)':'var(--text-dim)'};">${p.deadline}</span>` : ''}
      ${(p.files||[]).length ? `<span class="tc-files"><i data-lucide="paperclip" style="width:11px;height:11px;"></i>${p.files.length}</span>` : ''}
      ${linkedGoal ? `<span class="pill" style="background:var(--blue-soft);color:var(--blue);"><i data-lucide="target" style="width:10px;height:10px;"></i> ${escapeHtml(linkedGoal.name)} · ${linkedGoal.progress||0}%</span>` : ''}
    </div>
  `;
  el.addEventListener('click', () => openProjectModal(p.id));
  el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', p.id); });
  return el;
}

function renderProjects(){
  syncAllProjectStatusesFromGoals();
  const board = document.getElementById('projectBoard');
  board.innerHTML = '';
  const list = getFilteredSortedProjects();
  PROJECT_STATUSES.forEach(s => {
    const col = document.createElement('div');
    col.className = 'kanban-col';
    const colProjects = list.filter(p => p.status === s.key);
    col.innerHTML = `<div class="kanban-col-head"><span>${s.label}</span><span class="count">${colProjects.length}</span></div>
      <div class="kanban-list" data-status="${s.key}"></div>`;
    board.appendChild(col);
    const listEl = col.querySelector('.kanban-list');
    colProjects.forEach(p => listEl.appendChild(buildProjectCard(p)));
    listEl.addEventListener('dragover', e => { e.preventDefault(); listEl.classList.add('drag-over'); });
    listEl.addEventListener('dragleave', () => listEl.classList.remove('drag-over'));
    listEl.addEventListener('drop', e => {
      e.preventDefault(); listEl.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const p = projects.find(x => x.id === id);
      if (p){ p.status = s.key; persistProjects(); renderProjects(); }
    });
  });
  renderProjectStats();
  if (window.lucide) lucide.createIcons();
}

function renderProjectStats(){
  const el = document.getElementById('projectStats');
  const total = projects.length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const overdue = projects.filter(p => p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed').length;
  const avgProgress = total ? Math.round(projects.reduce((s,p) => s + computeProjectProgress(p), 0) / total) : 0;
  el.innerHTML = `
    <div class="st"><b>${total}</b><span>Total pwojè</span></div>
    <div class="st"><b>${completed}</b><span>Fini</span></div>
    <div class="st"><b style="${overdue?'color:var(--red)':''}">${overdue}</b><span>An reta</span></div>
    <div class="st"><b>${avgProgress}%</b><span>Pwogrè mwayen</span></div>
  `;
}

['projectSearch','sortProjects'].forEach(id => {
  document.getElementById(id).addEventListener('input', debounce(renderProjects, 200));
  document.getElementById(id).addEventListener('change', renderProjects);
});

let editingProjectId = null;
let projectTaskDraft = [];
let projectFileDraft = [];

function updateProjectProgressPreview(){
  const goalId = document.getElementById('projectGoalSelect')?.value || '';
  const g = goalId ? goals.find(x => x.id === goalId) : null;
  let pct;
  if (g){
    pct = g.progress || 0;
  } else {
    const total = projectTaskDraft.length;
    const done = projectTaskDraft.filter(t => t.done).length;
    pct = total ? Math.round((done/total)*100) : 0;
  }
  document.getElementById('projectProgressPreview').style.width = pct + '%';
  document.getElementById('projectProgressLbl').textContent = pct + '%';
}

function renderProjectTaskDraft(){
  const wrap = document.getElementById('projectTaskList');
  wrap.innerHTML = '';
  projectTaskDraft.forEach((t,i) => {
    const row = document.createElement('div');
    row.className = 'subtask-row';
    row.innerHTML = `<input type="checkbox" ${t.done?'checked':''} data-i="${i}" class="pt-chk">
      <input type="text" value="${escapeHtml(t.text)}" data-i="${i}" class="pt-text" placeholder="Travay...">
      <i data-lucide="x" class="rm" data-i="${i}"></i>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('.pt-chk').forEach(c => c.addEventListener('change', e => { projectTaskDraft[+e.target.dataset.i].done = e.target.checked; updateProjectProgressPreview(); }));
  wrap.querySelectorAll('.pt-text').forEach(c => c.addEventListener('input', e => { projectTaskDraft[+e.target.dataset.i].text = e.target.value; }));
  wrap.querySelectorAll('.rm').forEach(c => c.addEventListener('click', e => { projectTaskDraft.splice(+e.currentTarget.dataset.i, 1); renderProjectTaskDraft(); updateProjectProgressPreview(); }));
  updateProjectProgressPreview();
  if (window.lucide) lucide.createIcons();
}
document.getElementById('addProjectTaskBtn').addEventListener('click', () => {
  projectTaskDraft.push({ id: uid(), text: '', done: false });
  renderProjectTaskDraft();
});

function renderProjectFileDraft(){
  const wrap = document.getElementById('projectFileList');
  wrap.innerHTML = projectFileDraft.map((f,i) => `<span class="attach-chip"><i data-lucide="paperclip" style="width:11px;height:11px"></i>${escapeHtml(f.name)} <i data-lucide="x" class="rm" data-i="${i}" style="width:11px;height:11px"></i></span>`).join('') || '<span style="color:var(--text-faint);font-size:11.5px;">Pa gen fichye</span>';
  wrap.querySelectorAll('.rm').forEach(c => c.addEventListener('click', e => { projectFileDraft.splice(+e.currentTarget.dataset.i, 1); renderProjectFileDraft(); }));
  if (window.lucide) lucide.createIcons();
}
document.getElementById('projectFileInput').addEventListener('change', e => {
  [...e.target.files].forEach(f => projectFileDraft.push({ name: f.name }));
  e.target.value = '';
  renderProjectFileDraft();
});

function openProjectModal(id){
  editingProjectId = id || null;
  const p = id ? projects.find(x => x.id === id) : null;
  if (p) syncProjectStatusFromGoal(p);
  document.getElementById('projectModalTitle').textContent = p ? 'Modifye Pwojè' : 'Nouvo Pwojè';
  document.getElementById('projectName').value = p?.name || '';
  document.getElementById('projectDesc').value = p?.description || '';
  document.getElementById('projectStatus').value = p?.status || 'idea';
  document.getElementById('projectDeadline').value = p?.deadline || '';
  document.getElementById('projectNotes').value = p?.notes || '';
  const goalSelect = document.getElementById('projectGoalSelect');
  if (goalSelect){
    goalSelect.innerHTML = '<option value="">Okenn Objektif</option>' +
      goals.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
    goalSelect.value = p?.goalId || '';
  }
  renderProjectLinkedGoalInfo(p);
  document.getElementById('deleteProjectBtn').hidden = !p;
  projectTaskDraft = p?.tasks ? p.tasks.map(t => ({...t})) : [];
  projectFileDraft = p?.files ? p.files.map(f => ({...f})) : [];
  renderProjectTaskDraft();
  renderProjectFileDraft();
  document.getElementById('projectModalOverlay').classList.add('open');
}

// Afiche Goal konekte a: pwogrè, estati kouran, eta konpletman (Pati 32/50).
// Lekti sèl — statistik yo soti dirèkteman nan Goal la, pa gen chan doub.
function renderProjectLinkedGoalInfo(p){
  const wrap = document.getElementById('projectLinkedGoalInfo');
  if (!wrap) return;
  const goalId = document.getElementById('projectGoalSelect')?.value || (p?.goalId || '');
  const g = goalId ? goals.find(x => x.id === goalId) : null;
  if (!g){ wrap.hidden = true; wrap.innerHTML = ''; return; }
  const pct = g.progress || 0;
  wrap.hidden = false;
  wrap.innerHTML = `
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Objektif Konekte</span><b>${escapeHtml(g.name)}</b>
    </div>
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Pwogrè Objektif</span><b style="color:var(--blue);">${pct}%</b>
    </div>
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Estati Objektif</span><span class="pill" style="background:var(--surface-2);color:var(--text-dim);">${GOAL_STATUS[g.status]||g.status||''}</span>
    </div>
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Eta Konpletman</span><span class="pill" style="background:${pct>=100?'var(--green-soft)':'var(--surface-2)'};color:${pct>=100?'var(--green)':'var(--text-dim)'};">${pct>=100?'Konplete':'An Kou'}</span>
    </div>`;
}
document.getElementById('projectGoalSelect')?.addEventListener('change', () => {
  renderProjectLinkedGoalInfo(editingProjectId ? projects.find(x=>x.id===editingProjectId) : null);
  if (typeof updateProjectProgressPreview === 'function') updateProjectProgressPreview();
});
function closeProjectModal(){ document.getElementById('projectModalOverlay').classList.remove('open'); editingProjectId = null; }

document.getElementById('saveProjectBtn').addEventListener('click', () => {
  const name = document.getElementById('projectName').value.trim();
  if (!name){ showToast('Mete yon non pou pwojè a'); return; }
  const goalId = document.getElementById('projectGoalSelect')?.value || null;
  const data = {
    name,
    description: document.getElementById('projectDesc').value.trim(),
    status: document.getElementById('projectStatus').value,
    deadline: document.getElementById('projectDeadline').value || '',
    notes: document.getElementById('projectNotes').value.trim(),
    tasks: projectTaskDraft.filter(t => t.text.trim()),
    files: projectFileDraft,
    goalId,
  };
  let savedProject;
  if (editingProjectId){
    const p = projects.find(x => x.id === editingProjectId);
    Object.assign(p, data);
    savedProject = p;
  } else {
    savedProject = { id: uid(), createdAt: new Date().toISOString(), ...data };
    projects.push(savedProject);
  }
  syncProjectStatusFromGoal(savedProject);
  persistProjects();
  closeProjectModal();
  renderProjects();
  showToast('Pwojè anrejistre ✓');
});

document.getElementById('deleteProjectBtn').addEventListener('click', () => {
  projects = projects.filter(p => p.id !== editingProjectId);
  persistProjects();
  closeProjectModal();
  renderProjects();
  showToast('Pwojè efase');
});

document.getElementById('newProjectBtn').addEventListener('click', () => openProjectModal(null));
document.getElementById('closeProjectModal').addEventListener('click', closeProjectModal);
document.getElementById('projectModalOverlay').addEventListener('click', e => { if (e.target.id === 'projectModalOverlay') closeProjectModal(); });

// ==========================================
// NOTES MODULE
// ==========================================
function stripHtml(html){
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return (d.textContent || d.innerText || '').trim();
}

function renderFolderList(){
  const wrap = document.getElementById('folderList');
  wrap.innerHTML = '';
  const allItem = document.createElement('div');
  const allCount = notes.filter(n => !n.archived).length;
  allItem.className = 'folder-item' + (activeFolderFilter === '' ? ' active' : '');
  allItem.innerHTML = `<i data-lucide="layers" style="width:14px;height:14px;"></i><span>Tout nòt</span><span class="cnt">${allCount}</span>`;
  allItem.addEventListener('click', () => { activeFolderFilter = ''; renderNotes(); });
  wrap.appendChild(allItem);
  noteFolders.forEach(f => {
    const cnt = notes.filter(n => n.folderId === f.id && !n.archived).length;
    const item = document.createElement('div');
    item.className = 'folder-item' + (activeFolderFilter === f.id ? ' active' : '');
    item.innerHTML = `<i data-lucide="folder" style="width:14px;height:14px;"></i><span>${escapeHtml(f.name)}</span><span class="cnt">${cnt}</span>`;
    item.addEventListener('click', () => { activeFolderFilter = f.id; renderNotes(); });
    wrap.appendChild(item);
  });
  if (window.lucide) lucide.createIcons();
}

function populateNoteFolderSelect(){
  const sel = document.getElementById('noteFolder');
  sel.innerHTML = noteFolders.map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');
}

function getFilteredNotes(){
  const q = (document.getElementById('noteSearch').value || '').toLowerCase();
  const showArchived = document.getElementById('showArchivedNotes').checked;
  return notes.filter(n => {
    if (showArchived ? !n.archived : n.archived) return false;
    if (activeFolderFilter && n.folderId !== activeFolderFilter) return false;
    if (q){
      const hay = (n.title + ' ' + (n.tags||[]).join(' ') + ' ' + stripHtml(n.bodyHtml)).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a,b) => (b.pinned - a.pinned) || (b.updatedAt||'').localeCompare(a.updatedAt||''));
}

function copyNoteText(n){
  const text = (n.title ? n.title + '\n\n' : '') + stripHtml(n.bodyHtml || '');
  const done = () => showToast('Nòt kopye ✓');
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopyText(text, done));
  } else {
    fallbackCopyText(text, done);
  }
}
function fallbackCopyText(text, done){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch(e){}
  document.body.removeChild(ta);
  done();
}
function closeAllNoteMenus(){
  document.querySelectorAll('.note-menu.open').forEach(m => m.classList.remove('open'));
}
document.addEventListener('click', closeAllNoteMenus);

function renderNotes(){
  renderFolderList();
  const grid = document.getElementById('notesGrid');
  const list = getFilteredNotes();
  if (!list.length){
    grid.innerHTML = '<div class="empty-note">Pa gen nòt pou montre. Klike "Nouvo Nòt" pou kòmanse.</div>';
    return;
  }
  grid.innerHTML = '';
  list.forEach(n => {
    const folder = noteFolders.find(f => f.id === n.folderId);
    const el = document.createElement('div');
    el.className = 'card note-card';
    el.innerHTML = `
      <div class="nc-head">
        <div class="nc-title">${escapeHtml(n.title || 'San tit')}</div>
        ${n.pinned ? '<i data-lucide="pin" class="nc-pin"></i>' : ''}
        ${n.favorite ? '<i data-lucide="heart" class="nc-fav"></i>' : ''}
      </div>
      <div class="nc-snippet">${escapeHtml(stripHtml(n.bodyHtml)).slice(0,140) || 'Nòt vid'}</div>
      <div class="nc-meta">
        ${folder ? `<span class="tag-pill">${escapeHtml(folder.name)}</span>` : ''}
        ${(n.tags||[]).map(t => `<span class="tag-pill">#${escapeHtml(t)}</span>`).join('')}
        <span class="nc-date">${(n.updatedAt||'').slice(0,10)}</span>
      </div>
      <div class="nc-actions">
        <button class="nc-act-btn" data-act="copy" title="Kopye"><i data-lucide="copy"></i></button>
        <button class="nc-act-btn" data-act="toggle-menu" title="Plis opsyon"><i data-lucide="more-horizontal"></i></button>
        <div class="note-menu">
          <div class="nm-item" data-act="copy"><i data-lucide="copy"></i> Kopye</div>
          <div class="nm-item" data-act="edit"><i data-lucide="pencil"></i> Modifye</div>
          <div class="nm-item" data-act="pin"><i data-lucide="pin"></i> ${n.pinned ? 'Retire Pin' : 'Pin'}</div>
          <div class="nm-item" data-act="favorite"><i data-lucide="heart"></i> ${n.favorite ? 'Retire nan Favori' : 'Ajoute nan Favori'}</div>
          <div class="nm-item danger" data-act="delete"><i data-lucide="trash-2"></i> Efase</div>
        </div>
      </div>
    `;
    el.addEventListener('click', () => openNoteModal(n.id));
    el.querySelector('[data-act="copy"]').addEventListener('click', e => { e.stopPropagation(); copyNoteText(n); });
    el.querySelector('[data-act="toggle-menu"]').addEventListener('click', e => {
      e.stopPropagation();
      const menu = el.querySelector('.note-menu');
      const wasOpen = menu.classList.contains('open');
      closeAllNoteMenus();
      if (!wasOpen) menu.classList.add('open');
    });
    el.querySelectorAll('.note-menu .nm-item').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        closeAllNoteMenus();
        const act = item.dataset.act;
        if (act === 'copy') copyNoteText(n);
        else if (act === 'edit') openNoteModal(n.id);
        else if (act === 'pin'){ n.pinned = !n.pinned; persistNotes(); renderNotes(); showToast(n.pinned ? 'Nòt pinen ✓' : 'Pin retire'); }
        else if (act === 'favorite'){ n.favorite = !n.favorite; persistNotes(); renderNotes(); showToast(n.favorite ? 'Ajoute nan Favori ✓' : 'Retire nan Favori'); }
        else if (act === 'delete'){
          if (!confirm('Efase nòt sa a?')) return;
          notes = notes.filter(x => x.id !== n.id);
          persistNotes();
          renderNotes();
          showToast('Nòt efase');
        }
      });
    });
    grid.appendChild(el);
  });
  if (window.lucide) lucide.createIcons();
}

['noteSearch','showArchivedNotes'].forEach(id => {
  document.getElementById(id).addEventListener('input', debounce(renderNotes, 200));
  document.getElementById(id).addEventListener('change', renderNotes);
});

document.getElementById('addFolderBtn').addEventListener('click', () => {
  const name = prompt('Non nouvo dosye a?');
  if (!name || !name.trim()) return;
  noteFolders.push({ id: uid(), name: name.trim() });
  persistNoteFolders();
  populateNoteFolderSelect();
  renderFolderList();
  showToast('Dosye kreye ✓');
});

let editingNoteId = null;
let notePinnedDraft = false;

function openNoteModal(id){
  editingNoteId = id || null;
  const n = id ? notes.find(x => x.id === id) : null;
  populateNoteFolderSelect();
  document.getElementById('noteModalTitle').textContent = n ? 'Modifye Nòt' : 'Nouvo Nòt';
  document.getElementById('noteTitle').value = n?.title || '';
  document.getElementById('noteFolder').value = n?.folderId || (noteFolders[0]?.id || '');
  document.getElementById('noteTags').value = (n?.tags || []).join(', ');
  document.getElementById('noteBody').innerHTML = n?.bodyHtml || '';
  notePinnedDraft = !!n?.pinned;
  updateNotePinIcon();
  document.getElementById('deleteNoteBtn').hidden = !n;
  const archiveBtn = document.getElementById('archiveNoteBtn');
  archiveBtn.hidden = !n;
  archiveBtn.textContent = n?.archived ? 'Dezachive' : 'Achive';
  document.getElementById('noteModalOverlay').classList.add('open');
}
function closeNoteModal(){ document.getElementById('noteModalOverlay').classList.remove('open'); editingNoteId = null; }

function updateNotePinIcon(){
  const el = document.getElementById('notePinBtn');
  el.style.color = notePinnedDraft ? 'var(--orange)' : 'var(--text-faint)';
}
document.getElementById('notePinBtn').addEventListener('click', () => { notePinnedDraft = !notePinnedDraft; updateNotePinIcon(); });

// Rich text toolbar
document.getElementById('rtToolbar').querySelectorAll('button[data-cmd]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('noteBody').focus();
    document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
  });
});
document.getElementById('rtCodeBtn').addEventListener('click', () => {
  const body = document.getElementById('noteBody');
  body.focus();
  document.execCommand('insertHTML', false, '<pre><code>// kòd ou a isit la</code></pre><p><br></p>');
});
document.getElementById('rtTableBtn').addEventListener('click', () => {
  const body = document.getElementById('noteBody');
  body.focus();
  const table = '<table><tr><th>Kolòn 1</th><th>Kolòn 2</th></tr><tr><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td></tr></table><p><br></p>';
  document.execCommand('insertHTML', false, table);
});
document.getElementById('rtImgBtn').addEventListener('click', () => document.getElementById('rtImgInput').click());
document.getElementById('rtImgInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('noteBody').focus();
    document.execCommand('insertHTML', false, `<img src="${reader.result}" alt="${escapeHtml(file.name)}">`);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

document.getElementById('saveNoteBtn').addEventListener('click', () => {
  const title = document.getElementById('noteTitle').value.trim();
  if (!title){ showToast('Mete yon tit pou nòt la'); return; }
  const data = {
    title,
    folderId: document.getElementById('noteFolder').value,
    tags: document.getElementById('noteTags').value.split(',').map(s => s.trim()).filter(Boolean),
    bodyHtml: document.getElementById('noteBody').innerHTML,
    pinned: notePinnedDraft,
  };
  if (editingNoteId){
    const n = notes.find(x => x.id === editingNoteId);
    Object.assign(n, data, { updatedAt: new Date().toISOString() });
  } else {
    notes.push({ id: uid(), archived:false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data });
  }
  persistNotes();
  closeNoteModal();
  renderNotes();
  showToast('Nòt anrejistre ✓');
});

document.getElementById('deleteNoteBtn').addEventListener('click', () => {
  notes = notes.filter(n => n.id !== editingNoteId);
  persistNotes();
  closeNoteModal();
  renderNotes();
  showToast('Nòt efase');
});

document.getElementById('archiveNoteBtn').addEventListener('click', () => {
  const n = notes.find(x => x.id === editingNoteId);
  if (!n) return;
  n.archived = !n.archived;
  persistNotes();
  closeNoteModal();
  renderNotes();
  showToast(n.archived ? 'Nòt achive' : 'Nòt dezachive');
});

document.getElementById('newNoteBtn').addEventListener('click', () => openNoteModal(null));
document.getElementById('closeNoteModal').addEventListener('click', closeNoteModal);
document.getElementById('noteModalOverlay').addEventListener('click', e => { if (e.target.id === 'noteModalOverlay') closeNoteModal(); });

// ==========================================
// JOURNAL MODULE
// ==========================================
const MOOD_DEFS = [
  { v:1, emoji:'😢', label:'Tris', bg:'var(--red-soft)', col:'var(--red)' },
  { v:2, emoji:'😕', label:'Ba', bg:'var(--orange-soft)', col:'var(--orange)' },
  { v:3, emoji:'😐', label:'Nòmal', bg:'var(--surface-2)', col:'var(--text-dim)' },
  { v:4, emoji:'🙂', label:'Byen', bg:'var(--blue-soft)', col:'var(--blue)' },
  { v:5, emoji:'😄', label:'Ekselan', bg:'var(--green-soft)', col:'var(--green)' },
];

function computeJournalStreak(){
  const dates = new Set(journal.map(e => e.date));
  let streak = 0, cursor = todayISO();
  if (!dates.has(cursor)) cursor = isoOffset(cursor, -1);
  while (dates.has(cursor)){ streak++; cursor = isoOffset(cursor, -1); }
  return streak;
}

function computeJournalInsight(){
  if (!journal.length) return 'Ekri premye antre ou pou AI kòmanse analize imè ak pwogrè ou.';
  const sorted = [...journal].sort((a,b) => a.date.localeCompare(b.date));
  const last7 = sorted.filter(e => e.date >= isoOffset(todayISO(), -6));
  const prev7 = sorted.filter(e => e.date >= isoOffset(todayISO(), -13) && e.date < isoOffset(todayISO(), -6));
  if (!last7.length) return 'Ou pa ekri anyen semèn sa a — kontinye jounal ou pou AI ka swiv pwogrè w.';
  const avgMood = last7.reduce((s,e) => s+e.mood, 0) / last7.length;
  let trendTxt;
  if (prev7.length){
    const prevAvg = prev7.reduce((s,e) => s+e.mood, 0) / prev7.length;
    if (avgMood - prevAvg > 0.3) trendTxt = 'imè ou ap amelyore konpare ak semèn pase a — bon siy pou kwasans pèsonèl';
    else if (prevAvg - avgMood > 0.3) trendTxt = 'imè ou vin pi ba pase semèn pase a — pran yon moman pou pran swen tèt ou';
    else trendTxt = 'imè ou rete estab konpare ak semèn pase a';
  } else trendTxt = 'n ap kontinye swiv tandans imè ou pandan w ap ekri';
  const streak = computeJournalStreak();
  const moodLabel = MOOD_DEFS.find(m => m.v === Math.round(avgMood))?.label || '—';
  const prodTxt = last7.length >= 5 ? 'sa montre bon konsistans ak pwodiktivite nan refleksyon w' : 'eseye ekri pi souvan pou pi bon swivi pwodiktivite';
  return `Sou 7 dènye jou yo, imè mwayèn ou se <b>${moodLabel}</b> (${avgMood.toFixed(1)}/5) — ${trendTxt}. Ou gen yon <b>streak ${streak} jou</b> ekriti, ${prodTxt}.`;
}

function getFilteredJournal(){
  const q = (document.getElementById('journalSearch').value || '').toLowerCase().trim();
  return [...journal].filter(e => {
    if (!q) return true;
    const hay = (e.text + ' ' + (e.tags||[]).join(' ')).toLowerCase();
    return hay.includes(q);
  }).sort((a,b) => (b.date||'').localeCompare(a.date||'') || (b.createdAt||'').localeCompare(a.createdAt||''));
}

function renderMoodTrendChart(){
  const wrap = document.getElementById('moodTrendChart');
  wrap.innerHTML = '';
  for (let i=6;i>=0;i--){
    const d = isoOffset(todayISO(), -i);
    const dayEntries = journal.filter(e => e.date === d);
    const avg = dayEntries.length ? dayEntries.reduce((s,e) => s+e.mood, 0) / dayEntries.length : 0;
    const mood = avg ? MOOD_DEFS.find(m => m.v === Math.round(avg)) : null;
    const col = document.createElement('div');
    col.className = 'mbc-col';
    const h = avg ? Math.max(8, (avg/5)*80) : 3;
    col.innerHTML = `<div class="mbc-fill" style="height:${h}px;background:${mood ? mood.col : 'var(--surface-2)'}"></div><span class="mbc-lbl">${DAYS[new Date(d+'T00:00:00').getDay()].slice(0,3)}</span>`;
    wrap.appendChild(col);
  }
}

function updateJournalStats(){
  document.getElementById('journalTotalCount').textContent = journal.length;
  if (journal.length){
    const avg = journal.reduce((s,e) => s+e.mood, 0) / journal.length;
    document.getElementById('journalAvgMood').textContent = avg.toFixed(1) + '/5';
  } else document.getElementById('journalAvgMood').textContent = '—';
  document.getElementById('journalStreak').textContent = computeJournalStreak() + ' jou';
  document.getElementById('journalAiInsight').innerHTML = computeJournalInsight();
}

function renderJournal(){
  const list = document.getElementById('journalList');
  const items = getFilteredJournal();
  list.innerHTML = '';
  if (!items.length){
    list.innerHTML = '<div class="empty-note">Pa gen antre jounal. Klike "Nouvo Antre" pou kòmanse.</div>';
  }
  items.forEach(e => {
    const mood = MOOD_DEFS.find(m => m.v === e.mood) || MOOD_DEFS[2];
    const el = document.createElement('div');
    el.className = 'card journal-entry';
    el.innerHTML = `
      <div class="je-mood" style="background:${mood.bg};color:${mood.col}">${mood.emoji}</div>
      <div class="je-body">
        <div class="je-date">${e.date}</div>
        <div class="je-text">${escapeHtml(e.text).slice(0,180) || 'San tèks'}</div>
        ${(e.photos && e.photos.length) ? `<div class="je-photos">${e.photos.slice(0,4).map(p => `<img loading="lazy" src="${p}">`).join('')}</div>` : ''}
        ${(e.tags && e.tags.length) ? `<div class="je-tags">${e.tags.map(t => `<span class="tag-pill">#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
    `;
    el.addEventListener('click', () => openJournalModal(e.id));
    list.appendChild(el);
  });
  renderMoodTrendChart();
  updateJournalStats();
  if (window.lucide) lucide.createIcons();
}

function refreshDashboardJournalWidget(){
  const countEl = document.getElementById('dashJournalCount');
  if (!countEl) return;
  countEl.textContent = journal.length;
  const moodEl = document.getElementById('dashJournalMood');
  if (journal.length){
    const avg = journal.reduce((s,e) => s+e.mood, 0) / journal.length;
    moodEl.textContent = avg.toFixed(1) + '/5';
  } else moodEl.textContent = '—';
  document.getElementById('dashJournalStreak').textContent = computeJournalStreak() + ' jou';
}
refreshDashboardJournalWidget();

document.getElementById('journalSearch').addEventListener('input', debounce(renderJournal, 200));

let editingJournalId = null;
let journalMoodDraft = 3;
let journalPhotosDraft = [];

function renderJournalMoodPicker(){
  const el = document.getElementById('journalMoodPicker');
  el.innerHTML = MOOD_DEFS.map(m => `<div class="mood-opt ${m.v===journalMoodDraft?'active':''}" data-v="${m.v}" title="${m.label}">${m.emoji}</div>`).join('');
  el.querySelectorAll('.mood-opt').forEach(opt => {
    opt.addEventListener('click', () => { journalMoodDraft = parseInt(opt.dataset.v); renderJournalMoodPicker(); });
  });
}

function renderJournalPhotoInput(){
  const el = document.getElementById('journalPhotoInput');
  el.innerHTML = journalPhotosDraft.map((p,i) => `<div class="je-photo-thumb"><img src="${p}"><div class="rm" data-i="${i}"><i data-lucide="x"></i></div></div>`).join('');
  el.querySelectorAll('.rm').forEach(rm => {
    rm.addEventListener('click', () => { journalPhotosDraft.splice(parseInt(rm.dataset.i), 1); renderJournalPhotoInput(); });
  });
  if (window.lucide) lucide.createIcons();
}

function openJournalModal(id){
  editingJournalId = id || null;
  const e = id ? journal.find(x => x.id === id) : null;
  document.getElementById('journalModalTitle').textContent = e ? 'Modifye Antre' : 'Nouvo Antre';
  journalMoodDraft = e?.mood || 3;
  journalPhotosDraft = e?.photos ? [...e.photos] : [];
  document.getElementById('journalDate').value = e?.date || todayISO();
  document.getElementById('journalText').value = e?.text || '';
  document.getElementById('journalTags').value = (e?.tags || []).join(', ');
  renderJournalMoodPicker();
  renderJournalPhotoInput();
  document.getElementById('deleteJournalBtn').hidden = !e;
  document.getElementById('journalModalOverlay').classList.add('open');
}
function closeJournalModal(){ document.getElementById('journalModalOverlay').classList.remove('open'); editingJournalId = null; }

document.getElementById('newJournalBtn').addEventListener('click', () => openJournalModal(null));
document.getElementById('closeJournalModal').addEventListener('click', closeJournalModal);
document.getElementById('journalModalOverlay').addEventListener('click', e => { if (e.target.id === 'journalModalOverlay') closeJournalModal(); });
document.getElementById('journalAddPhotoBtn').addEventListener('click', () => document.getElementById('journalPhotoFile').click());
document.getElementById('journalPhotoFile').addEventListener('change', e => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  let remaining = files.length;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => { journalPhotosDraft.push(reader.result); remaining--; if (remaining === 0) renderJournalPhotoInput(); };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
});
document.getElementById('saveJournalBtn').addEventListener('click', () => {
  const text = document.getElementById('journalText').value.trim();
  if (!text){ showToast('Ekri kèk panse anvan ou anrejistre'); return; }
  const data = {
    date: document.getElementById('journalDate').value || todayISO(),
    text,
    mood: journalMoodDraft,
    tags: document.getElementById('journalTags').value.split(',').map(s => s.trim()).filter(Boolean),
    photos: journalPhotosDraft,
  };
  if (editingJournalId){
    const e = journal.find(x => x.id === editingJournalId);
    Object.assign(e, data, { updatedAt: new Date().toISOString() });
  } else {
    journal.push({ id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data });
  }
  persistJournal();
  closeJournalModal();
  renderJournal();
  showToast('Antre jounal anrejistre ✓');
});
document.getElementById('deleteJournalBtn').addEventListener('click', () => {
  journal = journal.filter(e => e.id !== editingJournalId);
  persistJournal();
  closeJournalModal();
  renderJournal();
  showToast('Antre efase');
});

// ==========================================
// HEALTH MODULE
// ==========================================
function getHealthLog(date, createIfMissing){
  let log = healthLogs.find(l => l.date === date);
  if (!log && createIfMissing){
    log = { date, water:0, sleep:0, exercise:0, mood:null, badDrinks:0, sugar:0, caffeine:0, drinks:[], waterEntries:[] };
    healthLogs.push(log);
  }
  if (log){ if (log.sugar === undefined) log.sugar = 0; if (log.caffeine === undefined) log.caffeine = 0; if (!log.drinks) log.drinks = []; if (!log.waterEntries) log.waterEntries = []; }
  return log;
}

// ---- Dlo: fòmate ml/L pou afichaj, ak objektif adaptatif selon done itilizatè a (egzèsis jodi a) ----
function fmtWaterAmount(ml){
  ml = Math.max(0, ml||0);
  if (ml >= 1000){
    const l = Math.round((ml/1000)*10)/10;
    return (Number.isInteger(l) ? l : l) + ' L';
  }
  return Math.round(ml) + ' ml';
}
function computeAdaptiveWaterGoal(log){
  let goal = healthGoals.water || 2000;
  if (log){
    if ((log.exercise||0) >= 60) goal += 600;
    else if ((log.exercise||0) >= 30) goal += 300;
  }
  return Math.round(goal);
}
function computeHealthScore(log){
  if (!log) return 0;
  const wPct = Math.min(1, (log.water||0) / (healthGoals.water||2000));
  const sPct = Math.min(1, (log.sleep||0) / (healthGoals.sleep||8));
  const ePct = Math.min(1, (log.exercise||0) / (healthGoals.exercise||30));
  const base = Math.round(((wPct + sPct + ePct) / 3) * 100);
  // Bwason sikre/enèjetik jodi a bese nòt sante a (max -20), yon fason Bwason "konekte" ak Sante
  // diferan de Dlo, san li pa efase pwogrè lòt objektif yo.
  const penalty = Math.min(20, Math.round((log.badDrinks||0) * 4));
  return Math.max(0, base - penalty);
}

function computeHealthInsight(log){
  if (!log || (!log.water && !log.sleep && !log.exercise && !(log.drinks&&log.drinks.length))) return 'Ajoute done sante jodi a pou wè sijesyon AI.';
  const gaps = [];
  const waterGoalNow = computeAdaptiveWaterGoal(log);
  if ((log.water||0) < waterGoalNow) gaps.push(`bwè ${fmtWaterAmount(waterGoalNow-(log.water||0))} dlo anplis`);
  if ((log.sleep||0) < healthGoals.sleep) gaps.push(`eseye dòmi ${(healthGoals.sleep-(log.sleep||0)).toFixed(1)}h anplis`);
  if ((log.exercise||0) < healthGoals.exercise) gaps.push(`fè ${healthGoals.exercise-(log.exercise||0)} min egzèsis anplis`);
  if ((log.sugar||0) > SUGAR_DAILY_LIMIT_G) gaps.push(`redwi bwason sikre (${fmtNum(log.sugar)}g sik deja jodi a, limit se ${SUGAR_DAILY_LIMIT_G}g)`);
  if ((log.caffeine||0) > CAFFEINE_DAILY_LIMIT_MG) gaps.push(`evite plis kafeyin (${fmtNum(log.caffeine)}mg deja jodi a, limit se ${CAFFEINE_DAILY_LIMIT_MG}mg)`);
  const score = computeHealthScore(log);
  const mem = computeDrinkMemory();
  let habitNote = '';
  if (mem.topType && mem.topType[1] >= 3){
    habitNote = ` Istorik ou montre ou souvan bwè ${DRINK_TYPE_LABELS[mem.topType[0]]||mem.topType[0]} (${mem.topType[1]} fwa) — panse pou varye chwa bwason ou.`;
  }
  if (!gaps.length) return `Bèl travay! Ou rive nan objektif sante ou yo jodi a (<b>${score}%</b>) — sa ap ede Life Score ou monte.${habitNote}`;
  return `Objektif sante ou jodi a nan <b>${score}%</b>. Sijesyon AI: ${gaps.join(', ')} pou amelyore Life Score ou.${habitNote}`;
}

function renderWaterCard(log){
  const goal = computeAdaptiveWaterGoal(log);
  const consumed = log.water||0;
  const pct = Math.min(100, Math.round((consumed/goal)*100));
  document.getElementById('waterGoalLbl').textContent = `Objektif: ${fmtWaterAmount(goal)}`;
  document.getElementById('waterProgressBar').style.width = pct + '%';
  document.getElementById('waterTodayLbl').textContent = `${fmtWaterAmount(consumed)} / ${fmtWaterAmount(goal)}`;
  const msgEl = document.getElementById('waterAiMsgText');
  if (consumed <= 0){
    msgEl.textContent = `Ajoute premye dlo w jodi a — objektif se ${fmtWaterAmount(goal)}.`;
  } else if (consumed >= goal){
    msgEl.textContent = `Ou rive nan objektif idratasyon w jodi a (${fmtWaterAmount(consumed)}) ✓`;
  } else {
    msgEl.textContent = `Ou toujou bezwen ${fmtWaterAmount(goal-consumed)} dlo anplis pou rive nan objektif jodi a.`;
  }
}
function addWaterEntry(ml){
  if (!ml || ml <= 0) return false;
  const log = getHealthLog(todayISO(), true);
  log.water = Math.round(((log.water||0) + ml) * 100) / 100;
  log.waterEntries = log.waterEntries || [];
  log.waterEntries.push({ ml: Math.round(ml*100)/100, time: new Date().toISOString() });
  persistHealthLogs();
  renderHealth();
  return true;
}

function renderHealthMoodPicker(log){
  const el = document.getElementById('healthMoodPicker');
  el.innerHTML = MOOD_DEFS.map(m => `<div class="mood-opt ${log.mood===m.v?'active':''}" data-v="${m.v}" title="${m.label}">${m.emoji}</div>`).join('');
  el.querySelectorAll('.mood-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      log.mood = parseInt(opt.dataset.v);
      persistHealthLogs();
      renderHealth();
    });
  });
}

function buildMiniBarChart(containerId, data, color, maxVal, unit){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '<div class="bar-chart">' + data.map(d => {
    const pct = maxVal ? Math.min(100, (d.val/maxVal)*100) : 0;
    return `<div class="bc-col"><div class="bc-fill" style="height:${Math.max(3,pct)}%;background:${color}" title="${d.val}${unit}"></div><span class="bc-lbl">${d.lbl}</span></div>`;
  }).join('') + '</div>';
}

// ==========================================
// AI RECOMMENDATIONS — analize done kounye a + istorik + abitid itilizatè a
// (itilize pou AI Summary Card ak sijesyon an tan reyèl)
// ==========================================
function generateHealthRecommendations(log){
  const recs = [];
  const waterGoalRec = computeAdaptiveWaterGoal(log);
  if ((log.water||0) < waterGoalRec){
    recs.push({ text: `Ou poko rive nan objektif dlo ou jodi a (${fmtWaterAmount(log.water||0)}/${fmtWaterAmount(waterGoalRec)}).`, level:'yellow' });
  }
  if ((log.sugar||0) > SUGAR_DAILY_LIMIT_G){
    recs.push({ text: `Ou konsome plis sik pase limit ou jodi a (${fmtNum(log.sugar)}g / ${SUGAR_DAILY_LIMIT_G}g).`, level:'red' });
  }
  if ((log.caffeine||0) >= CAFFEINE_DAILY_LIMIT_MG){
    recs.push({ text: `Ou deja konsome anpil kafeyin jodi a (${fmtNum(log.caffeine)}mg).`, level:'red' });
  } else if ((log.caffeine||0) >= CAFFEINE_DAILY_LIMIT_MG*0.7){
    recs.push({ text: `Ou pre rive nan limit kafeyin ou jodi a (${fmtNum(log.caffeine)}mg).`, level:'yellow' });
  }
  const lastDrink = (log.drinks||[])[(log.drinks||[]).length-1];
  if (lastDrink && (lastDrink.type==='sugary'||lastDrink.type==='energy'||lastDrink.type==='coffee') && (log.water||0) < waterGoalRec){
    recs.push({ text: 'Eseye bwè dlo anvan pwochen bwason ou.', level:'yellow' });
  }
  const yesterday = isoOffset(todayISO(), -1);
  const yLog = healthLogs.find(l => l.date === yesterday);
  if (yLog && (log.water||0) > (yLog.water||0) && (log.water||0) > 0){
    recs.push({ text: 'Bèl travay! Idratasyon ou amelyore konpare ak yè.', level:'green' });
  }
  if (!recs.length){
    recs.push({ text: 'Bon abitid jodi a — kontinye konsa!', level:'green' });
  }
  return recs;
}
const AI_STATUS_LABELS = { green:'Bon Abitid', yellow:'Modere', red:'Atansyon Nesesè' };
const AI_STATUS_COLOR_VARS = { green:'var(--green)', yellow:'var(--orange)', red:'var(--red)' };
function renderHealthAiSummary(log){
  const dot = document.getElementById('healthAiStatusDot');
  if (!dot) return;
  const recs = generateHealthRecommendations(log).sort((a,b) => ({red:0,yellow:1,green:2}[a.level]) - ({red:0,yellow:1,green:2}[b.level]));
  const top = recs[0];
  const color = AI_STATUS_COLOR_VARS[top.level];
  dot.style.background = color;
  dot.classList.toggle('pulse', top.level === 'red');
  const labelEl = document.getElementById('healthAiStatusLabel');
  labelEl.textContent = AI_STATUS_LABELS[top.level];
  labelEl.style.color = color;
  document.getElementById('healthAiSummaryText').textContent = top.text;
}

function renderHealth(){
  const today = todayISO();
  const log = getHealthLog(today, true);

  document.getElementById('sleepGoalLbl').textContent = `Objektif: ${healthGoals.sleep} èdtan`;
  document.getElementById('exerciseGoalLbl').textContent = `Objektif: ${healthGoals.exercise} min`;

  renderWaterCard(log);

  document.getElementById('sleepVal').textContent = fmtNum(log.sleep||0) + 'h';
  document.getElementById('sleepBar').style.width = Math.min(100, ((log.sleep||0)/(healthGoals.sleep||8))*100) + '%';

  document.getElementById('exerciseVal').textContent = fmtNum(log.exercise||0) + ' min';
  document.getElementById('exerciseBar').style.width = Math.min(100, ((log.exercise||0)/(healthGoals.exercise||30))*100) + '%';

  renderHealthMoodPicker(log);

  document.getElementById('healthAiInsight').innerHTML = computeHealthInsight(log);
  renderHealthAiSummary(log);

  const last7 = [];
  for (let i=6;i>=0;i--){
    const d = isoOffset(today, -i);
    const l = healthLogs.find(x => x.date === d);
    last7.push({ lbl: DAYS[new Date(d+'T00:00:00').getDay()].slice(0,3), water: l?.water||0, sleep: l?.sleep||0 });
  }
  buildMiniBarChart('waterChartWrap', last7.map(x => ({val:x.water, lbl:x.lbl})), 'var(--blue)', healthGoals.water||2000, ' ml');
  buildMiniBarChart('sleepChartWrap', last7.map(x => ({val:x.sleep, lbl:x.lbl})), 'var(--orange)', healthGoals.sleep||8, 'h');

  renderHealthStats(log);

  persistHealthLogs();
  setCategory('health', computeHealthScore(log));
  if (window.lucide) lucide.createIcons();
}

// ---- Dashboard sante an tan reyèl + Modil Estatistik Bwason/Sante (Improvement #9 Part 2) ----
function renderHealthStats(log){
  const today = todayISO();
  log = log || getHealthLog(today, true);
  const mem = computeDrinkMemory();

  // Dashboard an tan reyèl
  document.getElementById('hdSugarToday').textContent = fmtNum(log.sugar||0) + 'g';
  document.getElementById('hdSugarBar').style.width = Math.min(100, ((log.sugar||0)/SUGAR_DAILY_LIMIT_G)*100) + '%';
  document.getElementById('hdCaffeineToday').textContent = fmtNum(log.caffeine||0) + 'mg';
  document.getElementById('hdCaffeineBar').style.width = Math.min(100, ((log.caffeine||0)/CAFFEINE_DAILY_LIMIT_MG)*100) + '%';
  document.getElementById('hdDrinksToday').textContent = (log.drinks||[]).length;
  document.getElementById('hdHealthScore').textContent = computeHealthScore(log) + '%';
  const hydrationIdx = Math.round(Math.min(100, ((log.water||0)/(healthGoals.water||8))*100));
  document.getElementById('hdHydrationIndex').textContent = hydrationIdx + '%';
  document.getElementById('hdHydrationBar').style.width = hydrationIdx + '%';
  const sugarIdx = Math.round(Math.min(100, ((log.sugar||0)/SUGAR_DAILY_LIMIT_G)*100));
  document.getElementById('hdSugarIndex').textContent = sugarIdx + '%';
  document.getElementById('hdSugarIndexBar').style.width = sugarIdx + '%';

  // Dlo — Jodi a / Semèn / Mwa / Ane
  document.getElementById('wsWaterToday').textContent = fmtNum(log.water||0) + ' ml';
  const weekStart = isoOffset(today, -6);
  const monthPrefix = today.slice(0,7), yearPrefix = today.slice(0,4);
  let weekMl=0, monthMl=0, yearMl=0;
  healthLogs.forEach(l => {
    const ml = (l.water||0);
    if (l.date >= weekStart && l.date <= today) weekMl += ml;
    if (l.date.slice(0,7) === monthPrefix) monthMl += ml;
    if (l.date.slice(0,4) === yearPrefix) yearMl += ml;
  });
  document.getElementById('wsWaterWeek').textContent = fmtNum(weekMl) + ' ml';
  document.getElementById('wsWaterMonth').textContent = fmtNum(monthMl) + ' ml';
  document.getElementById('wsWaterYear').textContent = fmtNum(yearMl) + ' ml';

  // Analiz Bwason (jenere soti nan done reyèl — AI Memory, pa mesaj fiks)
  const daWrap = document.getElementById('drinkAnalysisWrap');
  if (!mem.totalDrinksCount){
    daWrap.innerHTML = '<div class="widget-empty">Poko gen bwason ki anrejistre.</div>';
  } else {
    const typeOrder = ['sugary','energy','coffee','juice','milk','other'];
    const topDrinks = Object.entries(mem.nameCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    daWrap.innerHTML = `
      <div class="stat-line"><span>Total sik (istwa)</span><b>${fmtNum(mem.totalSugar)}g</b></div>
      <div class="stat-line"><span>Total kafeyin (istwa)</span><b>${fmtNum(mem.totalCaffeine)}mg</b></div>
      <div class="legend" style="margin-top:10px;">
        ${typeOrder.filter(t=>mem.typeCounts[t]).map((t,i) => `<div class="lg-row"><span class="lg-dot" style="background:${PIE_COLORS[i%PIE_COLORS.length]}"></span>${DRINK_TYPE_LABELS[t]||t}<b>${mem.typeCounts[t]}</b></div>`).join('')}
      </div>
      ${topDrinks.length ? `<div style="font-size:11px;letter-spacing:.4px;text-transform:uppercase;color:var(--text-faint);font-weight:600;margin:14px 0 8px;">Bwason ki pi popilè</div>
      <div class="legend">${topDrinks.map(([n,c],i)=>`<div class="lg-row"><span class="lg-dot" style="background:${PIE_COLORS[i%PIE_COLORS.length]}"></span>${escapeHtml(n)}<b>${c}x</b></div>`).join('')}</div>` : ''}
    `;
  }

  // Finans Bwason (Dlo + Bwason kategori)
  const drinkTx = tx.filter(t => t.type==='expense' && (t.category==='Bwason' || t.category==='Dlo'));
  const totalSpend = drinkTx.reduce((s,t)=>s+t.amount,0);
  const monthsSpan = new Set(drinkTx.map(t=>t.date.slice(0,7)));
  const avgSpend = monthsSpan.size ? totalSpend/monthsSpan.size : 0;
  document.getElementById('wsDrinkSpendTotal').textContent = fmtHTG(totalSpend);
  document.getElementById('wsDrinkSpendAvg').textContent = fmtHTG(Math.round(avgSpend));

  // Evolisyon abitid — sik chak jou sou 14 dènye jou
  const last14 = [];
  for (let i=13;i>=0;i--){
    const d = isoOffset(today, -i);
    const l = healthLogs.find(x => x.date === d);
    last14.push({ lbl: DAYS[new Date(d+'T00:00:00').getDay()].slice(0,2), val: Math.round((l?.sugar||0)*10)/10 });
  }
  buildMiniBarChart('habitEvolutionChart', last14, 'var(--orange)', Math.max(SUGAR_DAILY_LIMIT_G, ...last14.map(x=>x.val)), 'g');
}

function refreshDashboardHealthWidget(){
  const el = document.getElementById('dashHealthWater');
  if (!el) return;
  const log = getHealthLog(todayISO(), false) || { water:0, sleep:0, exercise:0 };
  // Dashboard la kenbe menm fòma "vè" li te genyen anvan — jis konvèti soti nan nouvo done ml yo (250ml = 1 vè).
  el.textContent = `${Math.round((log.water||0)/ML_PER_GLASS)}/${Math.round((healthGoals.water||2000)/ML_PER_GLASS)} vè`;
  document.getElementById('dashHealthSleep').textContent = (log.sleep||0) + 'h';
  document.getElementById('dashHealthExercise').textContent = (log.exercise||0) + ' min';
}
refreshDashboardHealthWidget();
setCategory('health', computeHealthScore(getHealthLog(todayISO(), false)));

document.getElementById('sleepMinus').addEventListener('click', () => {
  const log = getHealthLog(todayISO(), true);
  log.sleep = Math.max(0, Math.round(((log.sleep||0)-0.5)*10)/10);
  persistHealthLogs(); renderHealth();
});
document.getElementById('sleepPlus').addEventListener('click', () => {
  const log = getHealthLog(todayISO(), true);
  log.sleep = Math.min(16, Math.round(((log.sleep||0)+0.5)*10)/10);
  persistHealthLogs(); renderHealth();
});
document.getElementById('exerciseMinus').addEventListener('click', () => {
  const log = getHealthLog(todayISO(), true);
  log.exercise = Math.max(0, (log.exercise||0)-5);
  persistHealthLogs(); renderHealth();
});
document.getElementById('exercisePlus').addEventListener('click', () => {
  const log = getHealthLog(todayISO(), true);
  log.exercise = (log.exercise||0)+5;
  persistHealthLogs(); renderHealth();
});

// ---- Dlo: ajoute kantite egzat (ml/L) antre pa itilizatè a ----
function submitWaterInput(){
  const inputEl = document.getElementById('waterAmountInput');
  const amt = parseFloat(inputEl.value);
  const unit = document.getElementById('waterUnitInput').value;
  if (!amt || amt <= 0){ showToast('Mete yon kantite dlo valab'); return; }
  addWaterEntry(toMl(amt, unit));
  inputEl.value = '';
  showToast('Dlo ajoute ✓');
}
document.getElementById('waterAddBtn').addEventListener('click', submitWaterInput);
document.getElementById('waterAmountInput').addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); submitWaterInput(); } });

document.getElementById('editHealthGoalsBtn').addEventListener('click', () => {
  document.getElementById('goalWater').value = Math.round(((healthGoals.water||2000)/1000)*10)/10;
  document.getElementById('goalSleep').value = healthGoals.sleep;
  document.getElementById('goalExercise').value = healthGoals.exercise;
  document.getElementById('healthGoalsModalOverlay').classList.add('open');
});
document.getElementById('closeHealthGoalsModal').addEventListener('click', () => document.getElementById('healthGoalsModalOverlay').classList.remove('open'));
document.getElementById('healthGoalsModalOverlay').addEventListener('click', e => { if (e.target.id === 'healthGoalsModalOverlay') document.getElementById('healthGoalsModalOverlay').classList.remove('open'); });
document.getElementById('saveHealthGoalsBtn').addEventListener('click', () => {
  const goalL = parseFloat(document.getElementById('goalWater').value);
  healthGoals.water = Math.round((goalL > 0 ? goalL : 2) * 1000);
  healthGoals.sleep = parseFloat(document.getElementById('goalSleep').value) || 8;
  healthGoals.exercise = parseInt(document.getElementById('goalExercise').value) || 30;
  persistHealthGoals();
  document.getElementById('healthGoalsModalOverlay').classList.remove('open');
  renderHealth();
  refreshDashboardHealthWidget();
  showToast('Objektif sante anrejistre ✓');
});

// ==========================================
// GOALS MODULE
// ==========================================
function seedGoals(){
  return [
    { id: uid(), title:'Lanse BWdepot v2', desc:'Fini ak lansman nouvo vèsyon aplikasyon jesyon depo a.',
      type:'medium', priority:'high', deadline: isoOffset(todayISO(), 20), progress:65,
      milestones:[
        { id: uid(), text:'Fini modil pèman NatCash', done:true },
        { id: uid(), text:'Tès QA konplè', done:true },
        { id: uid(), text:'Deplwaman sou pwodiksyon', done:false },
      ], createdAt: new Date().toISOString() },
  ];
}
function persistGoals(){ saveLS(LS.goals, goals); lifeEngineRefresh(); }
function persistLearning(){ saveLS(LS.learning, learning); lifeEngineRefresh(); renderLevelPanels(); refreshDashboardLearningWidget(); }

function refreshDashboardLearningWidget(){
  const lblEl = document.getElementById('dashLearnCourseLbl');
  if (!lblEl) return;
  const activeKey = activeLearningCourseKey();
  const active = LEARNING_COURSES[activeKey];
  const { pct } = courseProgress(activeKey);
  const flat = lcAllLessons(activeKey);
  const nextLesson = flat.find(l => !learning.completed.includes(lcLessonKey(activeKey, l.id)));
  lblEl.textContent = `${active.title}${nextLesson ? ' — ' + nextLesson.title : ''}`;
  document.getElementById('dashLearnCoursePct').textContent = pct + '%';
  document.getElementById('dashLearnCourseBar').style.width = pct + '%';
  document.getElementById('dashLearnCourseBar').style.background = active.color;
  const xpToday = (learning.xpLog||[]).filter(e => e.date === todayISO()).reduce((s,e) => s+e.xp, 0)
    || (learning.lessonLog||[]).filter(d => d === todayISO()).length * 15;
  document.getElementById('dashLearnXpToday').textContent = '+' + xpToday + ' XP';
  document.getElementById('dashLearnStreak').textContent = (learning.streak||0) + ' jou';
}

// Pati 37/50: chak etap kounye a ka gen yon "kontribisyon" (%) endividyèl.
// Si okenn etap pa gen kontribisyon defini, nou tonbe sou ansyen konpòtman
// egal-pou-egal (done/total) — pa gen brize pou Objektif ki egziste deja.
// ==========================================
// GOAL — Timeline konplè (Pati 38/50)
// Toujou SOU MENM chan g.habitProgressHistory a (pa gen dosye/sistèm paralèl,
// pa gen chanjman sou Estatistik ki egziste deja) — nou jis ajoute 3 nouvo
// kalite `source` ki manke: 'milestone-completed'/'milestone-uncompleted',
// 'learning-lesson-completed', ak 'manual-note' (Aktyalizasyon Enpòtan).
// Chak fonksyon gen pwòp gad kont doublon, menm jan ak Pati 9/22.
// ==========================================
function recordGoalMilestoneHistory(goalId, milestone, pctAfter){
  const g = goals.find(x => x.id === goalId);
  if (!g || !milestone) return false;
  if (!Array.isArray(g.habitProgressHistory)) g.habitProgressHistory = [];
  const history = g.habitProgressHistory;
  const date = todayISO();
  const source = milestone.done ? 'milestone-completed' : 'milestone-uncompleted';
  const already = history.some(r => r.source === source && r.milestoneId === milestone.id && r.date === date);
  if (already) return false;
  const record = {
    goalId, date, time: new Date().toISOString(),
    milestoneId: milestone.id, milestoneName: milestone.text,
    source, pct: pctAfter,
    reason: `Etap "${milestone.text}" ${milestone.done ? 'te fin fèt' : 'pa make fèt ankò'}.`
  };
  history.push(record);
  if (history.length > 180) g.habitProgressHistory = history.slice(-180);
  if (typeof logGoalHistoryToLifeTimeline === 'function') logGoalHistoryToLifeTimeline(goalId, record);
  return true;
}

function recordGoalLearningHistory(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !Array.isArray(g.linkedLearningCourses) || !g.linkedLearningCourses.length) return false;
  const validCourses = g.linkedLearningCourses.filter(k => LEARNING_COURSES[k]);
  if (!validCourses.length) return false;
  const totalDone = validCourses.reduce((s,k) => s + courseProgress(k).done, 0);
  if (!Array.isArray(g.habitProgressHistory)) g.habitProgressHistory = [];
  const history = g.habitProgressHistory;
  const learningEntries = history.filter(r => r.source === 'learning-lesson-completed');
  const last = learningEntries[learningEntries.length - 1];
  const prevDone = last ? last.lessonsDone : 0;
  if (totalDone <= prevDone) return false; // pa gen nouvo leson konplete depi dènye antre a
  const delta = totalDone - prevDone;
  const record = {
    goalId, date: todayISO(), time: new Date().toISOString(),
    source: 'learning-lesson-completed', lessonsDone: totalDone, delta, pct: g.progress || 0,
    reason: `${delta} leson konplete nan Aprantisaj lye (total: ${totalDone}).`
  };
  history.push(record);
  if (history.length > 180) g.habitProgressHistory = history.slice(-180);
  if (typeof logGoalHistoryToLifeTimeline === 'function') logGoalHistoryToLifeTimeline(goalId, record);
  return true;
}

function addGoalTimelineNote(goalId, text){
  const g = goals.find(x => x.id === goalId);
  if (!g || !text || !text.trim()) return false;
  if (!Array.isArray(g.habitProgressHistory)) g.habitProgressHistory = [];
  const history = g.habitProgressHistory;
  const record = {
    goalId, date: todayISO(), time: new Date().toISOString(),
    source: 'manual-note', note: text.trim(), pct: g.progress || 0, reason: text.trim()
  };
  history.push(record);
  if (history.length > 180) g.habitProgressHistory = history.slice(-180);
  persistGoals();
  if (typeof logGoalHistoryToLifeTimeline === 'function') logGoalHistoryToLifeTimeline(goalId, record);
  return true;
}

function goalMilestoneProgress(g){
  if (!g.milestones || !g.milestones.length){
    // Pati 49/50 fix: pou yon Objektif Finansye ki PA itilize Milestones, `g.progress`
    // (chan manyèl) pa janm ajou otomatikman lè Sere Deja (g.currentSavings) chanje —
    // ni lè moun nan modifye l alamen, ni lè syncGoalSavingsFromHabits senkwonize l apati
    // Abitid (Pati 21/50). Sa te vle di lis Objektif/Dashboard/Statistics/Project-sync yo
    // (ki tout LI goalMilestoneProgress kòm sèl sous verite) pa janm wè pwogrè Sere a. Nou
    // sèvi ak pousantaj Finansye a (deja kalkile an dirèk, Pati 17/50) kòm pwogrè reyèl la
    // nan ka sa a — san kraze anyen pou Objektif ki pa Finansye (yo kontinye itilize g.progress).
    if (g.isFinancial && Number(g.estimatedValue) > 0) return computeGoalFinancialProgressPct(g);
    return g.progress || 0;
  }
  const hasContrib = g.milestones.some(m => m.contribution != null && m.contribution > 0);
  if (hasContrib){
    const totalDefined = g.milestones.reduce((s,m) => s + (m.contribution != null ? Number(m.contribution)||0 : 0), 0);
    const undefinedCount = g.milestones.filter(m => m.contribution == null).length;
    const remaining = Math.max(0, 100 - totalDefined);
    const perUndefined = undefinedCount ? remaining / undefinedCount : 0;
    const pct = g.milestones.reduce((s,m) => {
      const w = m.contribution != null ? Number(m.contribution)||0 : perUndefined;
      return s + (m.done ? w : 0);
    }, 0);
    return Math.round(Math.max(0, Math.min(100, pct)));
  }
  const done = g.milestones.filter(m => m.done).length;
  return Math.round((done / g.milestones.length) * 100);
}

// ==========================================
// GOAL <-> GOAL — sistèm DEPANDANS ant Objektif (Pati 39/50)
// Pa touche sistèm Goal ki egziste deja (milestones, links, finance,
// learning, habit, project, calendar) — nou jis ajoute yon kouch
// "depandans" apa: g.dependsOn = [lis ID lòt Objektif ki dwe fèt anvan].
// Relasyon an toujou OPSYONÈL: yon Objektif san dependsOn mache egzakteman
// jan l te mache anvan Pati 39.
// ==========================================

// Yon Objektif konsidere "konplete" pou rezon depandans si estati li se
// 'completed' OSWA pwogrè (etap/manyèl/aprantisaj konfonn) rive 100%.
function isGoalCompletedForDependency(g){
  if (!g) return false;
  return g.status === 'completed' || goalMilestoneProgress(g) >= 100;
}

// Anpeche depandans sikilè: si `goalId` ta depann de `candidateDepId`, èske
// sa ta kreye yon bouk (pw. A depann de B, B depann de A — dirèkteman oswa
// atravè yon chèn pi long)? Nou fè yon DFS sou grafik dependsOn a pati de
// candidateDepId; si nou rive sou goalId, ajoute lyen an ta kreye yon bouk.
function wouldCreateCircularGoalDependency(goalId, candidateDepId){
  if (!candidateDepId) return false;
  if (goalId && candidateDepId === goalId) return true; // yon Objektif pa ka depann de tèt li
  if (!goalId) return false; // Objektif la potko gen ID (nouvo, poko sove) — pa ka gen bouk ankò
  const visited = new Set();
  function dfs(currentId){
    if (currentId === goalId) return true;
    if (visited.has(currentId)) return false;
    visited.add(currentId);
    const g = goals.find(x => x.id === currentId);
    if (!g || !Array.isArray(g.dependsOn)) return false;
    return g.dependsOn.some(dfs);
  }
  return dfs(candidateDepId);
}

// Lis Objektif sa a depann de (dirèk sèlman)
function getGoalDependencies(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !Array.isArray(g.dependsOn)) return [];
  return g.dependsOn.map(id => goals.find(x => x.id === id)).filter(Boolean);
}

// Lis Objektif ki depann de sa a (envès — pa gen chan pwòp, kalkile an dirèk)
function getGoalDependents(goalId){
  return goals.filter(g => Array.isArray(g.dependsOn) && g.dependsOn.includes(goalId));
}

// Estati depandans yon Objektif: konbyen fèt, konbyen total, si li "bloke"
function computeGoalDependencyStatus(goalId){
  const deps = getGoalDependencies(goalId);
  const items = deps.map(d => ({
    id: d.id, title: d.title,
    pct: goalMilestoneProgress(d),
    completed: isGoalCompletedForDependency(d),
    status: d.status,
  }));
  const total = items.length;
  const completedCount = items.filter(i => i.completed).length;
  return {
    total, completedCount,
    pct: total ? Math.round((completedCount/total)*100) : 100,
    blocked: total > 0 && completedCount < total,
    items,
  };
}

// Ajoute yon depandans (goalId depann de depId). Retounen { ok, reason }.
function linkGoalDependency(goalId, depId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !depId) return { ok:false, reason:'invalid' };
  if (depId === goalId) return { ok:false, reason:'self' };
  if (g.dependsOn.includes(depId)) return { ok:false, reason:'already-linked' };
  if (wouldCreateCircularGoalDependency(goalId, depId)) return { ok:false, reason:'circular' };
  g.dependsOn.push(depId);
  persistGoals();
  return { ok:true };
}

function unlinkGoalDependency(goalId, depId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return false;
  const before = g.dependsOn.length;
  g.dependsOn = g.dependsOn.filter(id => id !== depId);
  delete g.dependencyCompletedSnapshot[depId];
  if (g.dependsOn.length !== before){ persistGoals(); return true; }
  return false;
}

// Lè yon Objektif efase, retire l nan dependsOn tout lòt Objektif ki te
// depann de li (pa kite referans "fantom").
function removeGoalFromAllDependencies(goalId){
  let changed = false;
  goals.forEach(g => {
    if (Array.isArray(g.dependsOn) && g.dependsOn.includes(goalId)){
      g.dependsOn = g.dependsOn.filter(id => id !== goalId);
      delete g.dependencyCompletedSnapshot[goalId];
      changed = true;
    }
  });
  return changed;
}

// Detekte tranzisyon "depandans fenk konplete" epi anrejistre l nan Timeline
// Objektif la (menm chan habitProgressHistory ak Pati 38 — pa gen sistèm
// paralèl). Sa reponn a "Update progress when connected Goals are completed":
// nou pa fose ekrase g.progress (ki deja apatyen a milestones/aprantisaj),
// men nou trase pwogrè depandans yo ak yon evènman nan Timeline la.
function syncGoalDependencyStatus(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !Array.isArray(g.dependsOn) || !g.dependsOn.length) return false;
  let changed = false;
  g.dependsOn.forEach(depId => {
    const dep = goals.find(x => x.id === depId);
    if (!dep) return;
    const nowCompleted = isGoalCompletedForDependency(dep);
    const wasCompleted = !!g.dependencyCompletedSnapshot[depId];
    if (nowCompleted && !wasCompleted){
      if (!Array.isArray(g.habitProgressHistory)) g.habitProgressHistory = [];
      g.habitProgressHistory.push({
        goalId, date: todayISO(), time: new Date().toISOString(),
        source: 'dependency-completed', dependencyId: depId, dependencyName: dep.title,
        pct: goalMilestoneProgress(g),
        reason: `Depandans "${dep.title}" fin konplete.`
      });
      if (g.habitProgressHistory.length > 180) g.habitProgressHistory = g.habitProgressHistory.slice(-180);
      changed = true;
    }
    if (wasCompleted !== nowCompleted){ g.dependencyCompletedSnapshot[depId] = nowCompleted; changed = true; }
  });
  return changed;
}

function syncAllGoalDependencyStatuses(){
  let changed = false;
  goals.forEach(g => { if (syncGoalDependencyStatus(g.id)) changed = true; });
  // Nou sove dirèkteman (pa pase pa persistGoals()) pou evite yon bouk enfini
  // ak lifeEngineRefresh(), menm jan syncAllProjectStatusesFromGoals fè l.
  if (changed) saveLS(LS.goals, goals);
  return changed;
}

let editingGoalId = null;
let goalMilestoneDraft = [];
let goalDependencyDraft = [];
let goalLinksDraft = { habitIds:[], financeIds:[], calendarIds:[], learningIds:[], projectIds:[] };

(function initGoalSelects(){
  const catSel = document.getElementById('goalCategory');
  catSel.innerHTML = Object.entries(GOAL_CATEGORY).map(([k,v]) => `<option value="${k}">${v}</option>`).join('');
})();

// Estati Objektif la (nan modal la) se otomatik san mank kounye a — pa gen
// select manyèl ankò. Sèl 2 chwa manyèl ki rete se "Sispann" ak "Achive",
// kontwole pa goalStatusOverride (null = otomatik).
let goalStatusOverride = null;

function renderGoalLinksGrid(){
  const grid = document.getElementById('goalLinksGrid');
  const sourceMap = { habitIds: habits, financeIds: wallets, calendarIds: events, learningIds: [], projectIds: projects };
  grid.innerHTML = GOAL_LINK_TYPES.map(t => {
    const count = (sourceMap[t.key]||[]).length;
    const active = (goalLinksDraft[t.key]||[]).length > 0;
    return `<label class="goal-link-chip${active?' active':''}" data-key="${t.key}">
      <input type="checkbox" ${active?'checked':''} data-key="${t.key}">
      <i data-lucide="${t.icon}" style="width:13px;height:13px;"></i> ${t.label}${count?` <span style="color:var(--text-faint);">(${count})</span>`:''}
    </label>`;
  }).join('');
  grid.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', e => {
    const key = e.target.dataset.key;
    goalLinksDraft[key] = e.target.checked ? ['__linked__'] : [];
    renderGoalLinksGrid();
  }));
  if (window.lucide) lucide.createIcons();
}

function renderMilestoneDraft(){
  const wrap = document.getElementById('goalMilestoneList');
  wrap.innerHTML = '';
  if (!goalMilestoneDraft.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen etap ajoute.</span>';
  }
  goalMilestoneDraft.forEach((m, idx) => {
    const row = document.createElement('div');
    row.className = 'milestone-card' + (m.done ? ' done' : '');
    // Lòd afichaj mande: Tit anvan → Pèz (%) anba l → Deskripsyon menm jan → Dat menm jan.
    row.innerHTML = `
      <div class="ms-top">
        <input type="checkbox" ${m.done?'checked':''} data-idx="${idx}" class="msDone">
        <span class="ms-title">${escapeHtml(m.text)}</span>
        <i data-lucide="x" class="msRemove" data-idx="${idx}"></i>
      </div>
      ${m.contribution != null ? `<span class="ms-weight">Pèz: ${m.contribution}%</span>` : ''}
      ${m.description ? `<div class="ms-desc">${escapeHtml(m.description)}</div>` : ''}
      ${m.targetDate ? `<div class="ms-date"><i data-lucide="calendar" style="width:11px;height:11px;"></i> Dat Sib: ${m.targetDate}</div>` : ''}
    `;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('.msDone').forEach(cb => cb.addEventListener('change', e => {
    goalMilestoneDraft[+e.target.dataset.idx].done = e.target.checked; renderMilestoneDraft();
  }));
  wrap.querySelectorAll('.msRemove').forEach(ic => ic.addEventListener('click', e => {
    goalMilestoneDraft.splice(+e.currentTarget.dataset.idx, 1); renderMilestoneDraft();
  }));
  if (window.lucide) lucide.createIcons();
}
document.getElementById('addMilestoneBtn').addEventListener('click', () => {
  const titleInput = document.getElementById('msTitleInput');
  const descInput = document.getElementById('msDescInput');
  const dateInput = document.getElementById('msDateInput');
  const contribInput = document.getElementById('msContribInput');
  const text = titleInput.value.trim();
  if (!text){ showToast('Mete yon tit pou etap la'); return; }
  goalMilestoneDraft.push({
    id: uid(),
    text,
    description: descInput.value.trim(),
    targetDate: dateInput.value || null,
    contribution: contribInput.value ? Math.max(0, Math.min(100, parseFloat(contribInput.value))) : null,
    done: false,
  });
  titleInput.value = ''; descInput.value = ''; dateInput.value = ''; contribInput.value = '';
  renderMilestoneDraft();
});

// ==========================================
// GOAL — swiv Dat Limit (Pati 36/50)
// Lekti sèl, itilize dat ki egziste deja (g.createdAt kòm Dat Kòmansman,
// g.deadline kòm Dat Sib — menm chan ki sèvi pou senkwonize Kalandriye,
// Pati 21/50). Pa kreye notifikasyon, pa touche Kalandriye.
// ==========================================
function computeGoalDeadlineTracking(g){
  if (!g || !g.deadline) return null;
  const start = (g.createdAt || todayISO()).slice(0,10);
  const target = g.deadline;
  const today = todayISO();
  const daysRemaining = daysBetween(today, target);
  const totalSpan = Math.max(1, daysBetween(start, target));
  const elapsed = Math.max(0, daysBetween(start, today));
  const timePct = Math.max(0, Math.min(100, Math.round((elapsed / totalSpan) * 100)));
  const progressPct = g.progress || 0;
  let status;
  if (progressPct >= 100) status = 'Konplete';
  else if (daysRemaining < 0) status = 'An Reta';
  else if (progressPct + 10 >= timePct) status = 'Sou Wout';
  else status = 'Deyè';
  return { start, target, daysRemaining, timePct, progressPct, status };
}
// Sèl sous verite pou Pwogrè fòm nan (modal Objektif) — pa gen chan manyèl
// ankò, valè a kalkile otomatikman apati (an lòd priyorite): Kou Aprantisaj
// lye > Milestones (pèz) > Objektif Finansye (Sere/Kou) > valè ki deja
// anrejistre pou Objektif la (pw. mete ajou pa Abitid lye — Pati 21/50).
function computeGoalDraftProgress(){
  if (goalLearningDraft && goalLearningDraft.length){
    const validCourses = goalLearningDraft.filter(k => LEARNING_COURSES[k]);
    if (validCourses.length){
      const total = validCourses.reduce((s,k) => s + courseProgress(k).pct, 0);
      return Math.round(total / validCourses.length);
    }
  }
  const existing = editingGoalId ? goals.find(x => x.id === editingGoalId) : null;
  const draft = {
    milestones: goalMilestoneDraft,
    isFinancial: document.getElementById('goalIsFinancial').checked,
    estimatedValue: document.getElementById('goalEstimatedValue').value ? parseFloat(document.getElementById('goalEstimatedValue').value) : null,
    currentSavings: document.getElementById('goalCurrentSavings').value ? parseFloat(document.getElementById('goalCurrentSavings').value) : null,
    progress: existing ? (existing.progress || 0) : 0,
  };
  return goalMilestoneProgress(draft);
}

function renderGoalDeadlineTracking(){
  const row = document.getElementById('goalDeadlineTrackingRow');
  if (!row) return;
  const g = editingGoalId ? goals.find(x => x.id === editingGoalId) : null;
  const deadlineVal = document.getElementById('goalDeadline').value;
  const draft = g ? { ...g, deadline: deadlineVal } : { createdAt: todayISO(), deadline: deadlineVal, progress: computeGoalDraftProgress() };
  const info = computeGoalDeadlineTracking(draft);
  if (!info){ row.hidden = true; row.innerHTML = ''; return; }
  row.hidden = false;
  const statusColor = info.status === 'An Reta' ? 'var(--red)' : info.status === 'Deyè' ? 'var(--orange)' : 'var(--green)';
  row.innerHTML = `
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Dat Kòmansman</span><b>${info.start}</b>
    </div>
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Dat Sib</span><b>${info.target}</b>
    </div>
    <div class="milestone-row" style="justify-content:space-between;">
      <span>Jou Ki Rete</span><b>${info.daysRemaining >= 0 ? info.daysRemaining + ' jou' : Math.abs(info.daysRemaining) + ' jou an reta'}</b>
    </div>
    <div class="milestone-row" style="justify-content:space-between;border-top:1px solid var(--border);margin-top:4px;padding-top:8px;">
      <span>Estati (pwogrè vs tan)</span><b style="color:${statusColor};">${info.status}</b>
    </div>`;
}
document.getElementById('goalDeadline').addEventListener('change', renderGoalDeadlineTracking);

// ==========================================
// GOAL — ESTATI OTOMATIK (Pati 41/50)
// Pa touche okenn lòt modil — sèvi ak done ki egziste deja sèlman:
// pwogrè (goalMilestoneProgress / pwogrè finansye), dat limit (Pati 36
// computeGoalDeadlineTracking), ak isFinancial/currentSavings/estimatedValue
// (Pati 16/17). Nouvo chan sèl la se `g.autoStatus` (bool) — lè li aktive,
// `g.status` kalkile otomatikman; lè moun nan dezaktive l, li ka chwazi
// Estati a manyèlman jan l te toujou fè.
// ==========================================

// "Pwogrè reyèl" pou rezon estati: pou yon Objektif Finansye, sa vle di
// pousantaj Sere/Kou a (Pati 17) — se sa moun nan konprann kòm "vrè
// pwogrè" (egzanp: Sere 80% = Prèske Fini), PA chan "Pwogrè (%)" manyèl la
// ki ka pa menm konekte ak lajan an. Pou lòt Objektif, nou reyitilize
// goalMilestoneProgress (menm sous verite ak tout rès sistèm nan).
function goalRealProgressForStatus(g){
  if (!g) return 0;
  return g.isFinancial ? computeGoalFinancialProgressPct(g) : goalMilestoneProgress(g);
}

// Detèmine estati otomatik la. "Do not allow incorrect automatic
// completion": nou SÈLMAN retounen 'completed' si pwogrè reyèl la (sous
// verite deja etabli — pa yon estimasyon) rive 100% pou tout bon; nou pa
// janm "deklare" konplete pou lòt rezon (pw. dat limit rive san pwogrè
// rive 100% -> 'failed', pa 'completed').
function computeAutoGoalStatus(g){
  const pct = goalRealProgressForStatus(g);
  if (pct >= 100) return 'completed';
  // Dat limit (opsyonèl) — sèl kote nou ka distenge 'delayed' ak 'failed'.
  // San dat limit, nou pa gen okenn baz pou jije tan; nou rete sou pwogrè.
  if (g.deadline){
    const info = computeGoalDeadlineTracking({ ...g, progress: pct });
    if (info){
      if (info.daysRemaining < 0) return 'failed'; // dat limit pase, jamè fini
      if (info.status === 'Deyè') return 'delayed'; // gen tan toujou, men an reta sou orè
    }
  }
  if (pct <= 0) return 'not-started';
  if (pct >= 80) return 'almost-complete';
  return 'in-progress';
}

// Aplike estati otomatik la sou yon Objektif si `autoStatus` aktive.
// Retounen true si `g.status` chanje (itil pou detekte lè pou persiste).
function syncGoalAutoStatus(g){
  if (!g || !g.autoStatus) return false;
  const next = computeAutoGoalStatus(g);
  if (g.status !== next){ g.status = next; return true; }
  return false;
}

function syncAllGoalAutoStatuses(){
  let changed = false;
  goals.forEach(g => { if (syncGoalAutoStatus(g)) changed = true; });
  // Sove dirèkteman (pa pase pa persistGoals()) pou evite bouk enfini ak
  // lifeEngineRefresh(), menm jan ak Pati 32/39.
  if (changed) saveLS(LS.goals, goals);
  return changed;
}

// Konstwi yon "Objektif tanporè" ak valè aktyèl fòm lan (anvan sove), pou
// ka montre yon apèsi Estati OTOMATIK an dirèk pandan moun nan ap ekri.
function buildGoalDraftForAutoStatus(){
  const g = editingGoalId ? goals.find(x => x.id === editingGoalId) : null;
  return {
    createdAt: g ? g.createdAt : todayISO(),
    deadline: document.getElementById('goalDeadline').value,
    progress: computeGoalDraftProgress(),
    milestones: goalMilestoneDraft,
    isFinancial: document.getElementById('goalIsFinancial').checked,
    currentSavings: document.getElementById('goalCurrentSavings').value ? parseFloat(document.getElementById('goalCurrentSavings').value) : null,
    estimatedValue: document.getElementById('goalEstimatedValue').value ? parseFloat(document.getElementById('goalEstimatedValue').value) : null,
  };
}

// Rafrechi afichaj Pwogrè (%) la nan modal la — 100% otomatik, san chan
// manyèl. Endike tou dèske sous kalkil la ye (Aprantisaj / Milestones /
// Finansye / valè deja anrejistre) pou moun nan konprann dèske sa soti.
function renderGoalProgressPreview(){
  const bar = document.getElementById('goalProgressBar');
  const pctLbl = document.getElementById('goalProgressPct');
  const srcLbl = document.getElementById('goalProgressSourceLbl');
  if (!bar || !pctLbl) return;
  const pct = computeGoalDraftProgress();
  bar.style.width = pct + '%';
  pctLbl.textContent = pct + '%';
  if (srcLbl){
    let source = 'Baze sou valè aktyèl Objektif la';
    if (goalLearningDraft && goalLearningDraft.filter(k => LEARNING_COURSES[k]).length) source = 'Baze sou Kou Aprantisaj lye yo';
    else if (goalMilestoneDraft && goalMilestoneDraft.length) source = 'Baze sou Etap (Milestones) yo';
    else if (document.getElementById('goalIsFinancial').checked && document.getElementById('goalEstimatedValue').value) source = 'Baze sou Sere/Kou Finansye';
    srcLbl.textContent = source;
  }
}

// Rafrechi afichaj Estati la nan modal la. Estati toujou OTOMATIK sof si
// moun nan chwazi "Sispann" oswa "Achive" manyèlman (goalStatusOverride).
function renderGoalAutoStatusPreview(){
  const display = document.getElementById('goalStatusDisplay');
  if (!display) return;
  renderGoalProgressPreview();
  const status = goalStatusOverride || computeAutoGoalStatus(buildGoalDraftForAutoStatus());
  const style = GOAL_STATUS_STYLE[status] || GOAL_STATUS_STYLE['not-started'];
  display.style.background = style.bg;
  display.style.color = style.fg;
  display.textContent = GOAL_STATUS[status] || status;
  const pauseBtn = document.getElementById('goalPauseToggleBtn');
  const archiveBtn = document.getElementById('goalArchiveToggleBtn');
  if (pauseBtn) pauseBtn.classList.toggle('btn-primary', goalStatusOverride === 'paused');
  if (archiveBtn) archiveBtn.classList.toggle('btn-primary', goalStatusOverride === 'archived');
}
['goalDeadline','goalCurrentSavings','goalEstimatedValue'].forEach(id => {
  const el = document.getElementById(id);
  if (el){ el.addEventListener('input', renderGoalAutoStatusPreview); el.addEventListener('change', renderGoalAutoStatusPreview); }
});
document.getElementById('goalIsFinancial')?.addEventListener('change', renderGoalAutoStatusPreview);
document.getElementById('goalPauseToggleBtn')?.addEventListener('click', () => {
  goalStatusOverride = goalStatusOverride === 'paused' ? null : 'paused';
  renderGoalAutoStatusPreview();
});
document.getElementById('goalArchiveToggleBtn')?.addEventListener('click', () => {
  goalStatusOverride = goalStatusOverride === 'archived' ? null : 'archived';
  renderGoalAutoStatusPreview();
});
// Milestone yo chanje (ajoute/koche/efase) san yon "evènman" inik apa — nou
// obsève lis la menm jan Pati 2/50 obsève modal Habit la.
(function initGoalAutoStatusMilestoneObserver(){
  const list = document.getElementById('goalMilestoneList');
  if (!list) return;
  new MutationObserver(renderGoalAutoStatusPreview).observe(list, { childList:true, subtree:true });
})();

// ==========================================
// GOAL <-> GOAL — rannu UI depandans (Pati 39/50, swit)
// ==========================================
const GOAL_DEP_STATUS_STYLE = {
  completed:  { bg:'var(--green-soft)', fg:'var(--green)' },
  'in-progress': { bg:'var(--blue-soft, rgba(59,130,246,.14))', fg:'var(--blue)' },
  paused:     { bg:'var(--orange-soft)', fg:'var(--orange)' },
  'not-started': { bg:'var(--surface-2)', fg:'var(--text-dim)' },
  archived:   { bg:'var(--surface-2)', fg:'var(--text-faint)' },
};

// Select pou chwazi yon NOUVO depandans — eskli tèt li, sa ki deja lye, ak
// nenpòt Objektif ki ta kreye yon bouk sikilè.
function renderGoalDependencySelect(){
  const sel = document.getElementById('goalDependencySelect');
  if (!sel) return;
  const already = new Set(goalDependencyDraft);
  const options = goals.filter(g =>
    g.id !== editingGoalId &&
    !already.has(g.id) &&
    !wouldCreateCircularGoalDependency(editingGoalId, g.id)
  );
  sel.innerHTML = options.length
    ? '<option value="">Chwazi yon objektif...</option>' + options.map(g => `<option value="${g.id}">${escapeHtml(g.title)}</option>`).join('')
    : '<option value="">Pa gen objektif disponib</option>';
  sel.disabled = !options.length;
}

// Lis depandans aktyèl Objektif la (sa li depann de yo), ak yon bouton retire
function renderGoalDependenciesList(){
  const wrap = document.getElementById('goalDependenciesList');
  if (!wrap) return;
  if (!goalDependencyDraft.length){
    wrap.innerHTML = '<div class="widget-empty" style="padding:8px 0;">Okenn depandans ajoute — objektif la endepandan.</div>';
    renderGoalDependencyProgress();
    return;
  }
  wrap.innerHTML = goalDependencyDraft.map(depId => {
    const dep = goals.find(x => x.id === depId);
    if (!dep) return '';
    const pct = goalMilestoneProgress(dep);
    const done = isGoalCompletedForDependency(dep);
    const style = GOAL_DEP_STATUS_STYLE[dep.status] || GOAL_DEP_STATUS_STYLE['not-started'];
    return `<div class="milestone-row" style="justify-content:space-between;gap:8px;">
      <span style="display:flex;align-items:center;gap:6px;">
        <i data-lucide="${done ? 'check-circle-2' : 'circle-dashed'}" style="width:14px;height:14px;color:${done?'var(--green)':'var(--text-faint)'};"></i>
        ${escapeHtml(dep.title)}
        <span class="pill" style="background:${style.bg};color:${style.fg};font-size:10.5px;">${GOAL_STATUS[dep.status]||dep.status||''} · ${pct}%</span>
      </span>
      <button class="icon-btn goalDependencyRemoveBtn" type="button" data-dep="${depId}" title="Retire depandans"><i data-lucide="x"></i></button>
    </div>`;
  }).join('');
  wrap.querySelectorAll('.goalDependencyRemoveBtn').forEach(btn => btn.addEventListener('click', () => {
    const depId = btn.dataset.dep;
    goalDependencyDraft = goalDependencyDraft.filter(id => id !== depId);
    renderGoalDependenciesList();
    renderGoalDependencySelect();
    if (window.lucide) lucide.createIcons();
  }));
  renderGoalDependencyProgress();
  if (window.lucide) lucide.createIcons();
}

// Rezime "X/Y depandans konplete" + mesaj si Objektif la bloke
function renderGoalDependencyProgress(){
  const row = document.getElementById('goalDependencyProgressRow');
  if (!row) return;
  if (!goalDependencyDraft.length){ row.hidden = true; return; }
  const total = goalDependencyDraft.length;
  const completedCount = goalDependencyDraft.reduce((s, depId) => {
    const dep = goals.find(x => x.id === depId);
    return s + (dep && isGoalCompletedForDependency(dep) ? 1 : 0);
  }, 0);
  const pct = Math.round((completedCount/total)*100);
  row.hidden = false;
  row.querySelector('#goalDependencyProgressBar').style.width = pct + '%';
  row.querySelector('#goalDependencyProgressPct').textContent = `${completedCount}/${total} konplete`;
  const badge = row.querySelector('#goalDependencyBlockedBadge');
  if (badge) badge.hidden = completedCount >= total;
}

// Lis Objektif ki depann de sa a (envès, lekti sèl — jesyon fèt nan LÒT modal la)
function renderGoalDependentsList(){
  const wrap = document.getElementById('goalDependentsList');
  const section = document.getElementById('goalDependentsSection');
  if (!wrap || !section) return;
  if (!editingGoalId){ section.hidden = true; return; }
  const dependents = getGoalDependents(editingGoalId);
  section.hidden = !dependents.length;
  if (!dependents.length) return;
  wrap.innerHTML = dependents.map(dep => {
    const style = GOAL_DEP_STATUS_STYLE[dep.status] || GOAL_DEP_STATUS_STYLE['not-started'];
    return `<div class="milestone-row" style="justify-content:space-between;">
      <span>${escapeHtml(dep.title)}</span>
      <span class="pill" style="background:${style.bg};color:${style.fg};font-size:10.5px;">${GOAL_STATUS[dep.status]||dep.status||''}</span>
    </div>`;
  }).join('');
}

(function initGoalDependencyAddButton(){
  const btn = document.getElementById('goalDependencyAddBtn');
  const sel = document.getElementById('goalDependencySelect');
  if (!btn || !sel) return;
  btn.addEventListener('click', () => {
    const depId = sel.value;
    if (!depId) return;
    if (wouldCreateCircularGoalDependency(editingGoalId, depId)){
      showToast('Sa ta kreye yon depandans sikilè ✗');
      return;
    }
    goalDependencyDraft.push(depId);
    renderGoalDependenciesList();
    renderGoalDependencySelect();
    if (window.lucide) lucide.createIcons();
  });
})();

// ==========================================
// GOAL DETAILS VIEW (UI/UX Pati 1/3) — nouvo flux navigasyon.
// Klike sou yon kat Objektif ouvri KOUNYE A yon paj "Detay" (lekti sèl,
// pa touche okenn kalkil/estrikti done ki egziste). Bouton "Modifye
// Objektif" anndan l ouvri fòm Edit ki te egziste deja (openGoalModal),
// san chanje anyen nan fòm sa a.
// ==========================================
let goalDetailsId = null;
// Si moun nan te ouvri Edit apati Detay, nou sonje ID a pou n ka retounen
// sou paj Detay la (ajou) apre yo fin anrejistre — san touche saveGoalBtn.
let goalDetailsReturnId = null;

function goalDetailsDaysRemainingLabel(g){
  if (!g.deadline) return 'San dat limit';
  const info = computeGoalDeadlineTracking(g);
  if (!info) return 'San dat limit';
  return info.daysRemaining >= 0 ? `${info.daysRemaining} jou rete` : `${Math.abs(info.daysRemaining)} jou an reta`;
}

function renderGoalDetailsModal(){
  const g = goals.find(x => x.id === goalDetailsId);
  if (!g){ closeGoalDetailsModal(); return; }
  const pct = goalMilestoneProgress(g);
  const statusStyle = GOAL_STATUS_STYLE[g.status] || GOAL_STATUS_STYLE['not-started'];
  const daysLbl = goalDetailsDaysRemainingLabel(g);
  const barColor = priorityColor(g.priority);

  // ---- Summary card (dwe ajou otomatikman — kalkile chak fwa modal ouvri/rafrechi) ----
  document.getElementById('goalDetailsSummaryTitle').textContent = g.title;
  const summaryBar = document.getElementById('goalDetailsSummaryBar');
  summaryBar.style.width = pct + '%';
  document.getElementById('goalDetailsSummaryPct').textContent = pct + '%';
  const summaryStatus = document.getElementById('goalDetailsSummaryStatus');
  summaryStatus.textContent = GOAL_STATUS[g.status] || g.status || '—';
  document.getElementById('goalDetailsSummaryDays').textContent = daysLbl;

  // ---- Enfòmasyon Jeneral ----
  document.getElementById('goalDetailsCategory').textContent = GOAL_CATEGORY[g.category] || g.category || '—';
  const priorityEl = document.getElementById('goalDetailsPriority');
  priorityEl.textContent = PRIORITY[g.priority] || g.priority || '—';
  priorityEl.style.background = priorityBg(g.priority);
  priorityEl.style.color = barColor;
  const statusEl = document.getElementById('goalDetailsStatus');
  statusEl.textContent = GOAL_STATUS[g.status] || g.status || '—';
  statusEl.style.background = statusStyle.bg;
  statusEl.style.color = statusStyle.fg;
  document.getElementById('goalDetailsProgressBar').style.width = pct + '%';
  document.getElementById('goalDetailsProgressPct').textContent = pct + '%';

  // ---- Deskripsyon ----
  const descWrap = document.getElementById('goalDetailsDescWrap');
  descWrap.hidden = !g.desc;
  document.getElementById('goalDetailsDesc').textContent = g.desc || '—';

  // ---- Finans (sèlman si Objektif Finansye) ----
  const financeRow = document.getElementById('goalDetailsFinanceRow');
  if (g.isFinancial && Number(g.estimatedValue) > 0){
    financeRow.hidden = false;
    const cost = Number(g.estimatedValue) || 0;
    const saved = Number(g.currentSavings) || 0;
    document.getElementById('goalDetailsEstValue').textContent = fmtHTG(cost);
    document.getElementById('goalDetailsSavings').textContent = fmtHTG(saved);
    document.getElementById('goalDetailsRemaining').textContent = fmtHTG(Math.max(0, cost - saved));
  } else {
    financeRow.hidden = true;
  }

  // ---- Dat ----
  document.getElementById('goalDetailsDeadline').textContent = g.deadline || 'San dat limit';
  document.getElementById('goalDetailsDaysRemaining').textContent = daysLbl;

  // ---- Nòt ----
  document.getElementById('goalDetailsNotes').textContent = g.notes || 'Pa gen nòt.';

  // ---- Modil Konekte / Milestones / Istwa (Pati 2/3) ----
  renderGoalDetailsModules(g);
  renderGoalDetailsMilestones(g);
  renderGoalDetailsHistory(g);

  // ---- Aksyon anba paj la (Pati 3/3) — bouton "Achive" chanje etikèt/ikòn
  // selon si Objektif la deja Achive oswa non, san touche estati otomatik la. ----
  const archiveLbl = document.getElementById('goalDetailsArchiveBtnLbl');
  const archiveIc = document.querySelector('#goalDetailsArchiveBtn i');
  const isArchived = g.status === 'archived';
  if (archiveLbl) archiveLbl.textContent = isArchived ? 'Dezachive' : 'Achive';
  if (archiveIc) archiveIc.setAttribute('data-lucide', isArchived ? 'archive-restore' : 'archive');

  if (window.lucide) lucide.createIcons();
}

// ---- Modil Konekte (Pati 2/3) — li done ki egziste deja sèlman ----
// (habits/wallets/events/LEARNING_COURSES/projects), pa gen nouvo chan sove.
function buildGoalLinkedModules(g){
  const mods = [];
  const linkedHabits = getHabitsForGoal(g.id);
  if (linkedHabits.length){
    const doneToday = linkedHabits.filter(h => Array.isArray(h.completions) && h.completions.includes(todayISO())).length;
    mods.push({
      key:'habits', icon:'flame', label:'Abitid', color:'var(--orange)', bg:'var(--orange-soft)',
      status:`${linkedHabits.length} abitid lye · ${doneToday}/${linkedHabits.length} fèt jodi a`,
      onClick: () => { closeGoalDetailsModal(); showView('habits'); },
    });
  }
  if (g.isFinancial || g.walletId){
    const wallet = g.walletId ? wallets.find(w => w.id === g.walletId) : null;
    const pct = Number(g.estimatedValue) > 0 ? computeGoalFinancialProgressPct(g) : null;
    mods.push({
      key:'finance', icon:'wallet', label:'Finans', color:'var(--green)', bg:'var(--green-soft)',
      status: [wallet ? escapeHtml(wallet.name) : null, pct != null ? `${pct}% sere` : null].filter(Boolean).join(' · ') || 'Objektif Finansye',
      onClick: () => { closeGoalDetailsModal(); showView('finance'); },
    });
  }
  const linkedEvents = events.filter(e => e.goalId === g.id);
  if (linkedEvents.length){
    mods.push({
      key:'calendar', icon:'calendar', label:'Kalandriye', color:'var(--blue)', bg:'var(--blue-soft)',
      status:`${linkedEvents.length} evènman lye`,
      onClick: () => { closeGoalDetailsModal(); showView('calendar'); },
    });
  }
  if (Array.isArray(g.linkedLearningCourses) && g.linkedLearningCourses.length){
    const validCourses = g.linkedLearningCourses.filter(k => LEARNING_COURSES[k]);
    const avgPct = validCourses.length ? Math.round(validCourses.reduce((s,k)=>s+courseProgress(k).pct,0)/validCourses.length) : 0;
    mods.push({
      key:'learning', icon:'graduation-cap', label:'Aprantisaj', color:'var(--blue)', bg:'var(--blue-soft)',
      status:`${validCourses.length} kou lye · ${avgPct}% konplete`,
      onClick: () => { closeGoalDetailsModal(); showView('learning'); },
    });
  }
  const linkedProject = projects.find(p => p.goalId === g.id);
  if (linkedProject){
    const st = PROJECT_STATUSES.find(s => s.key === linkedProject.status);
    mods.push({
      key:'projects', icon:'folder', label:'Pwojè', color:'var(--orange)', bg:'var(--orange-soft)',
      status:`${escapeHtml(linkedProject.name)} · ${st ? st.label : linkedProject.status}`,
      onClick: () => { closeGoalDetailsModal(); showView('projects'); openProjectModal(linkedProject.id); },
    });
  }
  return mods;
}

function renderGoalDetailsModules(g){
  const wrap = document.getElementById('goalDetailsModulesGrid');
  if (!wrap) return;
  const mods = buildGoalLinkedModules(g);
  if (!mods.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Okenn modil lye pou kounye a.</span>';
    return;
  }
  wrap.innerHTML = mods.map(m => `
    <div class="goal-module-card" data-key="${m.key}">
      <div class="goal-module-card-ic" style="background:${m.bg};color:${m.color};"><i data-lucide="${m.icon}" style="width:17px;height:17px;"></i></div>
      <div class="goal-module-card-body"><b>${m.label}</b><span>${m.status}</span></div>
      <i data-lucide="chevron-right" class="goal-module-card-arrow"></i>
    </div>`).join('');
  wrap.querySelectorAll('.goal-module-card').forEach(card => {
    const mod = mods.find(m => m.key === card.dataset.key);
    if (mod) card.addEventListener('click', mod.onClick);
  });
}

// ---- Milestones — chak Etap nan pwòp kat pa l (lekti sèl), ak Estati
// Otomatik kalkile apati g.milestones (m.done + m.targetDate), san touche
// okenn chan ki egziste deja. ----
function milestoneAutoStatusInfo(m){
  if (m.done) return { label: GOAL_STATUS.completed, style: GOAL_STATUS_STYLE.completed };
  if (m.targetDate && m.targetDate < todayISO()) return { label: GOAL_STATUS.delayed, style: GOAL_STATUS_STYLE.delayed };
  return { label: GOAL_STATUS['in-progress'], style: GOAL_STATUS_STYLE['in-progress'] };
}

function renderGoalDetailsMilestones(g){
  const wrap = document.getElementById('goalDetailsMilestonesList');
  if (!wrap) return;
  const milestones = g.milestones || [];
  if (!milestones.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen Etap (Milestones) pou Objektif sa a.</span>';
    return;
  }
  wrap.innerHTML = milestones.map(m => {
    const st = milestoneAutoStatusInfo(m);
    return `<div class="milestone-card" style="cursor:default;">
      <div class="ms-top" style="justify-content:space-between;">
        <span class="ms-title">${escapeHtml(m.text)}</span>
        <span class="pill ms-status-badge" style="background:${st.style.bg};color:${st.style.fg};">${st.label}</span>
      </div>
      ${m.contribution != null ? `<span class="ms-weight">Pèz: ${m.contribution}%</span>` : ''}
      <div class="ms-desc"${m.description ? '' : ' style="font-style:italic;"'}>${m.description ? escapeHtml(m.description) : 'San deskripsyon'}</div>
      <div class="ms-date"><i data-lucide="calendar" style="width:11px;height:11px;"></i> ${m.targetDate ? 'Dat Sib: ' + m.targetDate : 'San dat sib'}</div>
    </div>`;
  }).join('');
}

// ---- Istwa Objektif — REYITILIZE g.habitProgressHistory (getGoalProgressHistory,
// deja egziste depi Pati 9/50) san kreye okenn nouvo sistèm/dosye paralèl. ----
const GOAL_HISTORY_EVENT_STYLE = {
  'habit-completed': { icon:'check-circle-2', color:'var(--green)', bg:'var(--green-soft)' },
  'habit-uncompleted': { icon:'circle', color:'var(--text-faint)', bg:'var(--surface-2)' },
  'saving-habit-completed': { icon:'wallet', color:'var(--green)', bg:'var(--green-soft)' },
  'learning-lesson-completed': { icon:'graduation-cap', color:'var(--blue)', bg:'var(--blue-soft)' },
  'milestone-completed': { icon:'flag', color:'var(--green)', bg:'var(--green-soft)' },
  'milestone-uncompleted': { icon:'flag', color:'var(--text-faint)', bg:'var(--surface-2)' },
  'manual-note': { icon:'sticky-note', color:'var(--orange)', bg:'var(--orange-soft)' },
};
function goalHistoryEventText(r){
  if (r.source === 'saving-habit-completed' && r.amountAdded){
    return `Lajan sere: ${r.amountAdded}${r.unit ? ' ' + r.unit : ''}${r.habitName ? ' (via ' + r.habitName + ')' : ''}`;
  }
  if (r.note) return r.note;
  if (r.reason) return r.reason;
  if (r.habitName) return r.habitName;
  return 'Pwogrè Objektif chanje';
}
function renderGoalDetailsHistory(g){
  const wrap = document.getElementById('goalDetailsHistoryList');
  if (!wrap) return;
  const entries = getGoalProgressHistory(g.id).slice(0, 15); // pi resan an premye (deja jan sa nan getGoalProgressHistory)
  if (!entries.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen istwa pou Objektif sa a.</span>';
    return;
  }
  wrap.innerHTML = entries.map(r => {
    const style = GOAL_HISTORY_EVENT_STYLE[r.source] || { icon:'activity', color:'var(--blue)', bg:'var(--blue-soft)' };
    return `<div class="goal-history-row">
      <div class="goal-history-ic" style="background:${style.bg};color:${style.color};"><i data-lucide="${style.icon}" style="width:13px;height:13px;"></i></div>
      <div class="goal-history-body">
        <span class="txt">${escapeHtml(goalHistoryEventText(r))}</span>
        <span class="meta">${r.date === todayISO() ? 'Jodi a' : escapeHtml(r.date)}${r.pct != null ? ' · ' + r.pct + '%' : ''}</span>
      </div>
    </div>`;
  }).join('');
}

function openGoalDetailsModal(id){
  goalDetailsId = id;
  const overlay = document.getElementById('goalDetailsModalOverlay');
  overlay.classList.remove('closing'); // si yon fèmti te an kou, anile l net
  renderGoalDetailsModal();
  overlay.classList.add('open');
}
// Pati 3/3: yon ti animasyon fèmti (fade + descann lejè) anvan nou retire
// 'open' la nèt — dire a matche @keyframes goalDetailsOverlayOut/ModalOut.
const GOAL_DETAILS_CLOSE_ANIM_MS = 160;
function closeGoalDetailsModal(){
  const overlay = document.getElementById('goalDetailsModalOverlay');
  if (!overlay.classList.contains('open') || overlay.classList.contains('closing')) return;
  overlay.classList.add('closing');
  setTimeout(() => { overlay.classList.remove('open','closing'); }, GOAL_DETAILS_CLOSE_ANIM_MS);
}
document.getElementById('closeGoalDetailsModal').addEventListener('click', closeGoalDetailsModal);
document.getElementById('closeGoalDetailsModalBtn').addEventListener('click', closeGoalDetailsModal);
document.getElementById('goalDetailsModalOverlay').addEventListener('click', e => { if (e.target.id === 'goalDetailsModalOverlay') closeGoalDetailsModal(); });
document.getElementById('goalDetailsEditBtn').addEventListener('click', () => {
  const id = goalDetailsId;
  goalDetailsReturnId = id; // pou n ka retounen sou Detay la apre Edit anrejistre
  closeGoalDetailsModal();
  openGoalModal(id);
});
// Aksyon rapid "Achive/Dezachive" dirèkteman sou paj Detay la — reyitilize
// menm chan/lojik ak modal Edit la (autoStatus + syncGoalAutoStatus), san
// kreye okenn nouvo sistèm estati paralèl.
document.getElementById('goalDetailsArchiveBtn').addEventListener('click', () => {
  const g = goals.find(x => x.id === goalDetailsId);
  if (!g) return;
  if (g.status === 'archived'){
    g.autoStatus = true;
    syncGoalAutoStatus(g);
    showToast('Objektif dezachive ✓');
  } else {
    g.autoStatus = false;
    g.status = 'archived';
    showToast('Objektif achive ✓');
  }
  persistGoals();
  renderGoals();
  renderGoalDetailsModal();
});
// Aksyon rapid "Efase" dirèkteman sou paj Detay la — menm netwayaj ak
// deleteGoalBtn (Kalandriye + Depandans) pou pa kite done ap trennen.
document.getElementById('goalDetailsDeleteBtn').addEventListener('click', () => {
  const g = goals.find(x => x.id === goalDetailsId);
  if (!g) return;
  if (!confirm(`Efase objektif "${g.title}"? Aksyon sa a pa ka anile.`)) return;
  if (typeof removeGoalCalendarEvents === 'function') removeGoalCalendarEvents(g.id);
  if (typeof removeGoalFromAllDependencies === 'function') removeGoalFromAllDependencies(g.id);
  goals = goals.filter(x => x.id !== g.id);
  persistGoals();
  goalDetailsReturnId = null;
  closeGoalDetailsModal();
  renderGoals();
  showToast('Objektif efase');
});

function openGoalModal(id){
  editingGoalId = id || null;
  const g = id ? goals.find(x => x.id === id) : null;
  document.getElementById('goalModalTitle').textContent = g ? 'Modifye Objektif' : 'Nouvo Objektif';
  document.getElementById('goalTitle').value = g ? g.title : '';
  document.getElementById('goalDesc').value = g ? (g.desc || '') : '';
  document.getElementById('goalType').value = g ? g.type : 'short';
  document.getElementById('goalPriority').value = g ? g.priority : 'medium';
  document.getElementById('goalDeadline').value = g ? (g.deadline || '') : '';
  document.getElementById('goalCategory').value = g ? (g.category || 'personal') : 'personal';
  // Estati toujou otomatik pa default; sèl eksepsyon se si Objektif la te
  // sove deja kòm 'paused' oswa 'archived' (chwa manyèl sèlman — Pati 41).
  goalStatusOverride = (g && !g.autoStatus && (g.status === 'paused' || g.status === 'archived')) ? g.status : null;
  document.getElementById('goalEstimatedValue').value = g && g.estimatedValue != null ? g.estimatedValue : '';
  document.getElementById('goalIsFinancial').checked = g ? !!g.isFinancial : false;
  document.getElementById('goalCurrentSavings').value = g && g.currentSavings != null ? g.currentSavings : '';
  document.getElementById('goalMonthlySavingPlan').value = g && g.monthlySavingPlan != null ? g.monthlySavingPlan : '';
  renderGoalSourceWalletOptions(g ? g.walletId : null);
  updateGoalFinancialFieldsVisibility();
  renderGoalFinancialRemaining();
  if (typeof renderGoalFinanceSyncStatus === 'function') renderGoalFinanceSyncStatus();
  renderGoalDeadlineTracking();
  document.getElementById('goalNotes').value = g ? (g.notes || '') : '';
  goalMilestoneDraft = g ? JSON.parse(JSON.stringify(g.milestones || [])) : [];
  goalLinksDraft = g && g.links ? JSON.parse(JSON.stringify(g.links)) : { habitIds:[], financeIds:[], calendarIds:[], learningIds:[], projectIds:[] };
  goalLearningDraft = g && Array.isArray(g.linkedLearningCourses) ? g.linkedLearningCourses.slice() : [];
  goalDependencyDraft = g && Array.isArray(g.dependsOn) ? g.dependsOn.slice() : [];
  renderMilestoneDraft();
  renderGoalLinksGrid();
  if (typeof renderGoalLearningLinksList === 'function') renderGoalLearningLinksList();
  if (typeof renderGoalLearningContribution === 'function') renderGoalLearningContribution();
  renderGoalDependencySelect();
  renderGoalDependenciesList();
  renderGoalDependentsList();
  renderGoalAutoStatusPreview();
  document.getElementById('deleteGoalBtn').hidden = !g;
  document.getElementById('goalModalOverlay').classList.add('open');
  if (window.lucide) lucide.createIcons();
}
document.getElementById('newGoalBtn').addEventListener('click', () => openGoalModal(null));
// Si Edit te ouvri apati paj Detay la (goalDetailsReturnId), fèmen Edit
// retounen sou Detay la (ajou) olye de jis fèmen tout bagay.
function closeGoalModalAndMaybeReturnToDetails(){
  document.getElementById('goalModalOverlay').classList.remove('open');
  if (goalDetailsReturnId){
    const returnId = goalDetailsReturnId;
    goalDetailsReturnId = null;
    if (goals.some(x => x.id === returnId)) openGoalDetailsModal(returnId);
  }
}
document.getElementById('closeGoalModal').addEventListener('click', closeGoalModalAndMaybeReturnToDetails);
document.getElementById('goalModalOverlay').addEventListener('click', e => { if (e.target.id === 'goalModalOverlay') closeGoalModalAndMaybeReturnToDetails(); });

document.getElementById('saveGoalBtn').addEventListener('click', () => {
  const title = document.getElementById('goalTitle').value.trim();
  if (!title){ showToast('Mete yon tit pou objektif la'); return; }
  const oldMilestones = editingGoalId ? JSON.parse(JSON.stringify((goals.find(x=>x.id===editingGoalId)||{}).milestones || [])) : [];
  const payload = {
    title,
    desc: document.getElementById('goalDesc').value.trim(),
    type: document.getElementById('goalType').value,
    priority: document.getElementById('goalPriority').value,
    deadline: document.getElementById('goalDeadline').value,
    progress: computeGoalDraftProgress(),
    milestones: goalMilestoneDraft,
    category: document.getElementById('goalCategory').value,
    status: 'not-started', // valè tanporè — ranplase pi ba a
    estimatedValue: document.getElementById('goalEstimatedValue').value ? parseFloat(document.getElementById('goalEstimatedValue').value) : null,
    isFinancial: document.getElementById('goalIsFinancial').checked,
    currentSavings: document.getElementById('goalCurrentSavings').value ? parseFloat(document.getElementById('goalCurrentSavings').value) : null,
    monthlySavingPlan: document.getElementById('goalMonthlySavingPlan').value ? parseFloat(document.getElementById('goalMonthlySavingPlan').value) : null,
    walletId: document.getElementById('goalSourceWallet').value || null,
    notes: document.getElementById('goalNotes').value.trim(),
    links: goalLinksDraft,
    linkedLearningCourses: goalLearningDraft.slice(),
    dependsOn: goalDependencyDraft.slice(),
    autoStatus: !goalStatusOverride,
  };
  // Si Objektif la lye ak Kou Aprantisaj, pwogrè a SÈLMAN ka soti nan leson
  // konplete (courseProgress) — nou ranplase nenpòt lòt valè kalkile pou
  // anpeche yon "validasyon fo".
  if (payload.linkedLearningCourses.length){
    const validCourses = payload.linkedLearningCourses.filter(k => LEARNING_COURSES[k]);
    if (validCourses.length){
      const total = validCourses.reduce((s,k) => s + courseProgress(k).pct, 0);
      payload.progress = Math.round(total / validCourses.length);
    }
  }
  // Estati: si "Sispann"/"Achive" pa chwazi manyèlman, kalkile valè
  // otomatik (otorite) la isit — pa depann sèlman sou apèsi an dirèk la,
  // pou evite yon estati ki pa ajou si yon chan te chanje san deklanche
  // renderGoalAutoStatusPreview.
  if (payload.autoStatus){
    const createdAtForCalc = editingGoalId ? (goals.find(x=>x.id===editingGoalId)||{}).createdAt : new Date().toISOString();
    payload.status = computeAutoGoalStatus({ ...payload, createdAt: createdAtForCalc });
  } else {
    payload.status = goalStatusOverride;
  }
  if (editingGoalId){
    const g = goals.find(x => x.id === editingGoalId);
    Object.assign(g, payload);
  } else {
    goals.push({ id: uid(), createdAt: new Date().toISOString(), dependencyCompletedSnapshot:{}, ...payload });
    bumpCategory('goals', 1);
    renderActivity([{ icon:'target', color:'var(--blue)', text:`Ou kreye objektif <b>"${escapeHtml(title)}"</b>`, time:'kounye a' }]);
  }
  persistGoals();
  const _savedGoal = editingGoalId ? goals.find(x => x.id === editingGoalId) : goals[goals.length - 1];
  if (_savedGoal && typeof syncGoalCalendarEvents === 'function') syncGoalCalendarEvents(_savedGoal.id);
  if (_savedGoal){
    let historyChanged = false;
    const pctAfter = goalMilestoneProgress(_savedGoal);
    (_savedGoal.milestones || []).forEach(m => {
      const old = oldMilestones.find(o => o.id === m.id);
      if (!old || old.done !== m.done){
        if (typeof recordGoalMilestoneHistory === 'function' && recordGoalMilestoneHistory(_savedGoal.id, m, pctAfter)) historyChanged = true;
      }
    });
    if (typeof recordGoalLearningHistory === 'function' && recordGoalLearningHistory(_savedGoal.id)) historyChanged = true;
    if (historyChanged) persistGoals();
  }
  document.getElementById('goalModalOverlay').classList.remove('open');
  renderGoals();
  showToast('Objektif anrejistre ✓');
  if (goalDetailsReturnId){
    const returnId = goalDetailsReturnId;
    goalDetailsReturnId = null;
    if (goals.some(x => x.id === returnId)) openGoalDetailsModal(returnId);
  }
});
document.getElementById('deleteGoalBtn').addEventListener('click', () => {
  if (typeof removeGoalCalendarEvents === 'function') removeGoalCalendarEvents(editingGoalId);
  if (typeof removeGoalFromAllDependencies === 'function') removeGoalFromAllDependencies(editingGoalId);
  goals = goals.filter(x => x.id !== editingGoalId);
  persistGoals();
  document.getElementById('goalModalOverlay').classList.remove('open');
  goalDetailsReturnId = null; // Objektif la efase — pa gen Detay pou retounen
  renderGoals();
  showToast('Objektif efase');
});
['goalSearch','filterGoalType','sortGoals'].forEach(id => {
  document.getElementById(id).addEventListener('input', debounce(renderGoals, 200));
  document.getElementById(id).addEventListener('change', renderGoals);
});

// ==========================================
// GOAL <-> HABIT — bouton "Ajoute Abitid" (Pati 2/50)
// Pa touche openGoalModal/saveGoalBtn/openHabitModal/saveHabitBtn ki egziste deja —
// nou jis obsève modal yo epi ajoute lyen an apre Habit modil la fin anrejistre.
// ==========================================
let pendingGoalIdForNewHabit = null;

(function initGoalAddHabitButton(){
  const btn = document.getElementById('goalAddHabitBtn');
  const overlay = document.getElementById('goalModalOverlay');
  if (!btn || !overlay) return;
  const syncVisibility = () => { btn.hidden = !editingGoalId; };
  new MutationObserver(syncVisibility).observe(overlay, { attributes:true, attributeFilter:['class'] });
  syncVisibility();
  btn.addEventListener('click', () => {
    if (!editingGoalId) return;
    pendingGoalIdForNewHabit = editingGoalId;
    openHabitModal(null); // itilize fòm kreyasyon Abitid ki egziste deja — pa kreye yon lòt fòm
  });
})();

// Si moun nan fèmen fòm Abitid la san anrejistre, anile lyen an tann lan
document.getElementById('closeHabitModal').addEventListener('click', () => { pendingGoalIdForNewHabit = null; });
document.getElementById('habitModalOverlay').addEventListener('click', e => {
  if (e.target.id === 'habitModalOverlay') pendingGoalIdForNewHabit = null;
});

// Kouri APRE handler anrejistreman Abitid ki egziste deja (òdinal ajout aditif, pa yon ranplasman)
document.getElementById('saveHabitBtn').addEventListener('click', () => {
  if (!pendingGoalIdForNewHabit) return;
  const name = document.getElementById('habitName').value.trim();
  if (!name) return; // Habit modil la deja bloke anrejistreman san non — kite lyen an tann pou pwochen eseye
  const goalId = pendingGoalIdForNewHabit;
  pendingGoalIdForNewHabit = null;
  // Abitid ki fenk kreye a se dènye eleman nan lis la (Habit modil la push li nan menm klik la)
  const habitId = editingHabitId || (habits[habits.length - 1] && habits[habits.length - 1].id);
  if (habitId){
    linkHabitToGoal(goalId, habitId);
    if (typeof recordGoalHabitProgressHistory === 'function') recordGoalHabitProgressHistory(goalId, habitId, 'habit-linked');
    if (typeof refreshGoalHabitContributionTotals === 'function') refreshGoalHabitContributionTotals(goalId);
    renderGoals();
    if (typeof renderLinkExistingHabitSelect === 'function') renderLinkExistingHabitSelect();
    if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
    if (typeof renderGoalProgressHistory === 'function') renderGoalProgressHistory();
    showToast('Abitid lye ak objektif la ✓');
  }
});

// Habit modil la ka modifye/efase yon abitid ki lye — rafrechi lis la pou rete ajou
document.getElementById('saveHabitBtn').addEventListener('click', () => {
  if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
});
document.getElementById('deleteHabitBtn').addEventListener('click', () => {
  if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
  if (typeof renderLinkExistingHabitSelect === 'function') renderLinkExistingHabitSelect();
});

// ==========================================
// GOAL <-> HABIT — "Lye Abitid ki Egziste" (Pati 3/50)
// Lòt kouch obsèvasyon apa — pa touche kod Pati 1/2 la, ni Goal/Habit modil yo.
// ==========================================
function renderLinkExistingHabitSelect(){
  const sel = document.getElementById('goalLinkExistingHabitSelect');
  const wrap = document.getElementById('goalLinkExistingHabitWrap');
  if (!sel || !wrap) return;
  if (!editingGoalId){ wrap.hidden = true; return; }
  wrap.hidden = false;
  // Sèlman abitid ki PA deja lye ak Objektif aktyèl la (pa dupliye done — reyalize sou id ki egziste deja)
  const available = habits.filter(h => h.goalId !== editingGoalId);
  if (!available.length){
    sel.innerHTML = '<option value="">Pa gen abitid disponib</option>';
    sel.disabled = true;
  } else {
    sel.disabled = false;
    sel.innerHTML = '<option value="">Chwazi yon abitid...</option>' +
      available.map(h => `<option value="${h.id}">${escapeHtml(h.name)}${h.goalId ? ' (deja lye ak yon lòt objektif)' : ''}</option>`).join('');
  }
}

(function initGoalLinkExistingHabit(){
  const overlay = document.getElementById('goalModalOverlay');
  const btn = document.getElementById('goalLinkExistingHabitBtn');
  const sel = document.getElementById('goalLinkExistingHabitSelect');
  if (!overlay || !btn || !sel) return;
  new MutationObserver(renderLinkExistingHabitSelect).observe(overlay, { attributes:true, attributeFilter:['class'] });
  renderLinkExistingHabitSelect();
  btn.addEventListener('click', () => {
    const habitId = sel.value;
    if (!editingGoalId || !habitId) return;
    linkHabitToGoal(editingGoalId, habitId); // itilize ID ki egziste deja — pa kreye/dupliye okenn abitid
    if (typeof recordGoalHabitProgressHistory === 'function') recordGoalHabitProgressHistory(editingGoalId, habitId, 'habit-linked');
    if (typeof refreshGoalHabitContributionTotals === 'function') refreshGoalHabitContributionTotals(editingGoalId);
    renderLinkExistingHabitSelect();
    if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
    if (typeof renderGoalProgressHistory === 'function') renderGoalProgressHistory();
    renderGoals();
    showToast('Abitid lye ak objektif la ✓');
  });
})();

// ==========================================
// GOAL <-> HABIT — afiche Abitid Lye yo (Pati 4/50)
// Lòt kouch obsèvasyon apa — pa touche Goal/Habit modil yo, ni kod Pati 1/2/3 la.
// ==========================================
const HABIT_FREQ_LABEL = { daily:'Chak jou', weekly:'Chak semèn', monthly:'Chak mwa' };

// ==========================================
// GOAL <-> HABIT — senkronizasyon estati (Pati 14/50)
// Estati a pa janm sove kòm yon chan separe sou Goal ni sou Habit — li toujou
// KALKILE an dirèk apati vrè done Habit la (h.completions, h.frequency).
// Konsa Goal ak Habit pa ka janm dezenkwonize (pa gen "doublon done" pou
// jere): si Habit la chanje, estati a chanje otomatikman pwochèn fwa Goal la
// afiche. Habit modil la pa gen okenn konsèp "an poz" natif — nou dedwi sa
// lè yon Abitid rete twò lontan san okenn konplete (relatif ak frekans li).
// ==========================================
const HABIT_LINK_STATUS_LABEL = { completed:'Fèt jodi a', active:'Aktif', paused:'An Poz', deleted:'Efase' };
const HABIT_LINK_STATUS_STYLE = {
  completed: { bg:'var(--green-soft)', fg:'var(--green)' },
  active:    { bg:'var(--surface-2)',  fg:'var(--text-dim)' },
  paused:    { bg:'var(--orange-soft)',fg:'var(--orange)' },
  deleted:   { bg:'var(--red-soft, rgba(229,72,77,.14))', fg:'var(--red, #e5484d)' }
};

// Konbyen jou san aktivite pou konsidere yon Abitid "An Poz", selon frekans li
function habitStaleThresholdDays(frequency){
  if (frequency === 'weekly') return 10;
  if (frequency === 'monthly') return 35;
  return 2; // daily (default)
}

function computeHabitLinkStatus(h){
  if (!h) return 'deleted';
  const today = todayISO();
  if ((h.completions||[]).includes(today)) return 'completed';
  const sorted = (h.completions||[]).slice().sort();
  const last = sorted[sorted.length - 1];
  if (!last) return 'paused'; // pa gen okenn konplete ditou — konsidere l San Aktivite
  const daysSince = Math.floor((new Date(today) - new Date(last)) / 86400000);
  return daysSince > habitStaleThresholdDays(h.frequency) ? 'paused' : 'active';
}

// ==========================================
// GOAL <-> HABIT — pwogrè Objektif ki soti nan Abitid Lye (Pati 8/50)
// Nouvo mezi APA — pa touche goal.progress (jauge manyèl la), goalMilestoneProgress,
// ni Habit modil la. calcStreaks() itilize yon Set sou completions, donk yon dat
// ki repete pa janm konte de fwa nan kontribisyon an.
// ==========================================
function computeGoalHabitProgress(goalId){
  const linked = getHabitsForGoal(goalId);
  if (!linked.length) return { pct: null, perHabit: [] };
  const perHabit = linked.map(h => {
    const { rate } = calcStreaks(h); // chak Habit kontribye pwòp pousantaj li, apa
    return { habitId: h.id, name: h.name, rate };
  });
  const pct = Math.round(perHabit.reduce((s,x) => s + x.rate, 0) / perHabit.length);
  return { pct, perHabit };
}

// ==========================================
// GOAL <-> HABIT — swivi kontribisyon (Pati 12/50)
// Nouvo chan APA sou Goal la (g.habitContributions) — pa touche goal.progress,
// pa touche computeGoalHabitProgress (pousantaj/pwogrè, Pati 8) ki rete
// entak, ni Habit modil la (pa gen okenn nouvo chan sou objè Habit la). Isit
// la nou swiv "valè reyèl" chak Abitid kontribye bay Objektif la — pa egzanp
// Abitid "Sere 25 HTG chak jou" ki kontribye 25 HTG chak fwa li fèt, pou yon
// total kimilatif. Valè pa fwa a (`amount` + `unit`) konfigirab pou chak
// koneksyon Objektif-Abitid; total la kalkile apati kantite fwa Abitid la
// fin fèt (h.completions.length), donk li toujou an senk ak vrè done a — pa
// gen dosye separe pou anpeche dezenkwonizasyon.
// ==========================================
function ensureGoalHabitContribution(g, habitId){
  if (!g.habitContributions || typeof g.habitContributions !== 'object') g.habitContributions = {};
  if (!g.habitContributions[habitId]) g.habitContributions[habitId] = { amount: 0, unit: '', total: 0, walletId: '', processedDates: [] };
  if (g.habitContributions[habitId].walletId === undefined) g.habitContributions[habitId].walletId = '';
  if (!Array.isArray(g.habitContributions[habitId].processedDates)) g.habitContributions[habitId].processedDates = [];
  return g.habitContributions[habitId];
}

function computeGoalHabitContributionTotal(goalId, habitId){
  const g = goals.find(x => x.id === goalId);
  const h = habits.find(x => x.id === habitId);
  if (!g || !h) return 0;
  const cfg = g.habitContributions && g.habitContributions[habitId];
  const amount = cfg ? (Number(cfg.amount) || 0) : 0;
  const count = Array.isArray(h.completions) ? h.completions.length : 0;
  return Math.round(amount * count * 100) / 100;
}

// Mete ajou konfigirasyon "valè pa fwa" pou yon koneksyon Objektif-Abitid,
// epi rekalkile total kimilatif la imedyatman
function setGoalHabitContribution(goalId, habitId, amount, unit){
  const g = goals.find(x => x.id === goalId);
  if (!g) return null;
  const cfg = ensureGoalHabitContribution(g, habitId);
  const n = parseFloat(amount);
  cfg.amount = isFinite(n) ? n : 0;
  cfg.unit = (unit || '').trim();
  cfg.total = computeGoalHabitContributionTotal(goalId, habitId);
  persistGoals();
  if (typeof syncGoalSavingsFromHabits === 'function') syncGoalSavingsFromHabits(goalId);
  return cfg;
}

// ==========================================
// GOAL <-> WALLET — sous kòb pou Abitid ki sere (Pati 19/50)
// Sèlman yon REFERANS (walletId) anrejistre sou konfigirasyon kontribisyon
// Objektif-Abitid (menm chan Pati 12, pa gen nouvo estrikti/dosye separe) —
// pa touche `wallets`, pa kreye tranzaksyon, pa deplase lajan.
// ==========================================
function setGoalHabitContributionWallet(goalId, habitId, walletId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return null;
  const cfg = ensureGoalHabitContribution(g, habitId);
  cfg.walletId = walletId || '';
  persistGoals();
  return cfg;
}

// ==========================================
// GOAL FINANSYE — règ validasyon anvan nenpòt aksyon lajan (Pati 20/50)
// Sèlman yon FONKSYON VERIFIKASYON — pa gen okenn transfè, pa touche
// `wallets`, pa kreye/modifye okenn tranzaksyon Finance. Rezève pou pati k'ap
// vini yo lè transfè reyèl la ap enplemante; pou kounye a li sèlman itilize
// (li sèlman) done ki egziste deja: Goal, Habit, Wallet, ak
// g.habitContributions[habitId].processedDates (Pati 20 — pa gen okenn kòd
// ki ekri ladan l ankò, se yon prepataisyon anti-doublon pou pita).
// Retounen { valid, errors } — `errors` se yon lis mesaj lizib an Kreyòl.
// ==========================================
function validateGoalSavingAction(goalId, habitId, walletId, amount, dateISO){
  const errors = [];
  const date = dateISO || todayISO();

  const g = goals.find(x => x.id === goalId);
  if (!g) errors.push('Objektif la pa egziste.');

  const h = habits.find(x => x.id === habitId);
  if (!h) errors.push('Abitid la pa egziste.');
  else if (h.goalId !== goalId) errors.push('Abitid la pa lye ak Objektif sa a.');

  const w = wallets.find(x => x.id === walletId);
  if (!w) errors.push('Wallet la pa egziste.');

  const amt = Number(amount);
  if (!isFinite(amt) || amt <= 0) errors.push('Kantite lajan an pa valab.');

  if (h){
    const doneOnDate = Array.isArray(h.completions) && h.completions.includes(date);
    if (!doneOnDate) errors.push('Abitid la poko fèt pou dat sa a — pa ka fè okenn transfè apati yon Abitid ki pa konplete.');
  }

  if (w && isFinite(amt) && amt > 0){
    const currentBalance = walletBalance(w);
    if (currentBalance - amt < 0) errors.push('Transfè sa a ta kreye yon balans negatif sou Wallet la — anile.');
  }

  if (g && h){
    const cfg = g.habitContributions && g.habitContributions[h.id];
    const alreadyProcessed = cfg && Array.isArray(cfg.processedDates) && cfg.processedDates.includes(date);
    if (alreadyProcessed) errors.push('Kontribisyon pou dat sa a deja trete pou koneksyon sa a — pa ka fèt de fwa.');
  }

  return { valid: errors.length === 0, errors };
}

// Rekalkile tout total kontribisyon yo pou yon Objektif (deklanche apre
// make/demake yon Abitid, oswa lye/delye), san touche konfigirasyon `amount`/`unit` moun nan te antre
function refreshGoalHabitContributionTotals(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !g.habitContributions) return;
  let changed = false;
  Object.keys(g.habitContributions).forEach(habitId => {
    const newTotal = computeGoalHabitContributionTotal(goalId, habitId);
    if (g.habitContributions[habitId].total !== newTotal){ g.habitContributions[habitId].total = newTotal; changed = true; }
  });
  if (changed) persistGoals();
  if (typeof syncGoalSavingsFromHabits === 'function') syncGoalSavingsFromHabits(goalId);
}

// ==========================================
// GOAL <-> HABIT — sere otomatik apati Abitid konplete (Pati 21/50)
// Konekte Abitid ki sere ak Sere Deja (g.currentSavings, Pati 16) — pa gen
// nouvo chan, pa gen tranzaksyon, pa gen deplasman lajan (sa se sèlman yon
// NIMEWO sou Goal la, pa yon Wallet). Sèvi ak menm total ki soti nan Pati 12
// (`amount * completions.length`), donk sèlman Abitid ki REYÈLMAN konplete
// konte (yon dat parèt nan h.completions sèlman lè moun nan make l fèt).
// Nou sèlman senkronize lè gen omwen yon koneksyon Objektif-Abitid konfigire
// ak yon `amount` — sa anpeche kraze yon valè "Sere Deja" moun nan te antre
// manyèlman pou yon Objektif Finansye ki pa itilize Abitid ditou.
// ==========================================
function computeGoalTotalHabitSavings(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !g.habitContributions) return { total: 0, hasConfigured: false };
  const linkedIds = new Set(getHabitsForGoal(goalId).map(h => h.id));
  let total = 0, hasConfigured = false;
  Object.keys(g.habitContributions).forEach(habitId => {
    if (!linkedIds.has(habitId)) return; // Abitid delye pa konte ankò
    const cfg = g.habitContributions[habitId];
    if (cfg && Number(cfg.amount) > 0){
      hasConfigured = true;
      total += computeGoalHabitContributionTotal(goalId, habitId);
    }
  });
  return { total: Math.round(total * 100) / 100, hasConfigured };
}

function syncGoalSavingsFromHabits(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !g.isFinancial) return false;
  const { total, hasConfigured } = computeGoalTotalHabitSavings(goalId);
  if (!hasConfigured) return false; // pa gen Abitid ki konfigire pou sere — kite valè manyèl la entak
  if (g.currentSavings !== total){
    g.currentSavings = total;
    persistGoals();
  }
  // Si moun nan gen Objektif sa a ouvri kounye a, ajou chan afichaj yo tou
  if (editingGoalId === goalId){
    const savedInput = document.getElementById('goalCurrentSavings');
    if (savedInput) savedInput.value = g.currentSavings;
    if (typeof renderGoalFinancialRemaining === 'function') renderGoalFinancialRemaining();
  }
  return true;
}

// ==========================================
// GOAL <-> HABIT — rezime kontribisyon (Pati 13/50)
// Sèvi ak menm done g.habitContributions ki soti nan Pati 12 (pa gen nouvo
// chan sou Goal/Habit) — isit la nou rasanble yo: chak Abitid ki gen yon
// valè konfigire afiche apa ("Sere 25 HTG chak jou → 500 HTG"), epi total
// jeneral la kalkile pa gwoupe pa `unit` (paske ou pa ka jis adisyone HTG ak
// èdtan san konfizyon). Si tout Abitid yo pataje menm inite a, yon sèl total
// senp afiche; si gen plizyè inite diferan, chak gwoup afiche apa.
// ==========================================
function computeGoalContributionSummary(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g) return { list: [], totalsByUnit: [] };
  const linked = getHabitsForGoal(goalId);
  const list = [];
  const totalsByUnitMap = {};
  linked.forEach(h => {
    const cfg = g.habitContributions && g.habitContributions[h.id];
    if (!cfg || !cfg.amount) return; // Abitid san valè konfigire pa fè pati rezime a
    const unit = cfg.unit || '';
    const total = computeGoalHabitContributionTotal(goalId, h.id);
    list.push({ habitId: h.id, habitName: h.name, amount: cfg.amount, unit, total });
    totalsByUnitMap[unit] = Math.round(((totalsByUnitMap[unit] || 0) + total) * 100) / 100;
  });
  const totalsByUnit = Object.keys(totalsByUnitMap).map(unit => ({ unit, total: totalsByUnitMap[unit] }));
  return { list, totalsByUnit };
}

function renderGoalContributionSummary(){
  const wrap = document.getElementById('goalContributionSummaryList');
  if (!wrap) return;
  if (!editingGoalId){ wrap.innerHTML = ''; return; }
  const { list, totalsByUnit } = computeGoalContributionSummary(editingGoalId);
  if (!list.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen kontribisyon konfigire pou Abitid yo.</span>';
    return;
  }
  const rows = list.map(x => `<div class="milestone-row" style="justify-content:space-between;">
      <span>${escapeHtml(x.habitName)} <span style="color:var(--text-faint);">(${x.amount}${x.unit ? ' ' + escapeHtml(x.unit) : ''} pa fwa)</span></span>
      <span class="pill" style="background:var(--blue-soft);color:var(--blue);">${x.total}${x.unit ? ' ' + escapeHtml(x.unit) : ''}</span>
    </div>`).join('');
  const totalLine = totalsByUnit.map(t => `${t.total}${t.unit ? ' ' + escapeHtml(t.unit) : ''}`).join(' · ');
  wrap.innerHTML = rows + `<div class="milestone-row" style="justify-content:space-between;border-top:1px solid var(--border);margin-top:4px;padding-top:8px;">
      <b>Total kontribisyon</b>
      <b style="color:var(--green);">${totalLine}</b>
    </div>`;
}

// ==========================================
// GOAL <-> HABIT — afiche "poukisa" chak Abitid lye (Pati 15/50)
// Vizyalizasyon POU LEKTI SÈLMAN — pa gen okenn nouvo chan sou Goal ni sou
// Habit. "Kontribisyon" an afiche isit la soti nan menm done ki egziste deja:
// si yon inite/kontribisyon konfigire pou koneksyon an (Pati 12), nou itilize
// li; sinon nou tonbe sou h.category (chan ki egziste deja sou Habit la) kòm
// rezon kontribisyon an. Pa gen dosye separe, pa gen dupliyata.
// ==========================================
function renderGoalHabitWhyLinked(){
  const wrap = document.getElementById('goalHabitWhyLinkedList');
  if (!wrap) return;
  if (!editingGoalId){ wrap.innerHTML = ''; return; }
  const g = goals.find(x => x.id === editingGoalId);
  const linked = getHabitsForGoal(editingGoalId);
  if (!g || !linked.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen abitid lye.</span>';
    return;
  }
  wrap.innerHTML = linked.map(h => {
    const cfg = g.habitContributions && g.habitContributions[h.id];
    const contribType = (cfg && cfg.unit && cfg.unit.trim()) ? cfg.unit.trim()
      : (h.category && h.category.trim() ? h.category.trim() : 'Kontribisyon jeneral');
    return `<div class="milestone-row" style="flex-direction:column;align-items:stretch;gap:2px;">
      <span style="font-size:11px;color:var(--text-faint);">Objektif:</span>
      <span><b>${escapeHtml(g.name)}</b></span>
      <span style="font-size:11px;color:var(--text-faint);margin-top:4px;">Abitid Lye:</span>
      <span>${escapeHtml(h.name)}</span>
      <span style="font-size:11px;color:var(--text-faint);margin-top:4px;">Kontribisyon:</span>
      <span class="tag" style="background:var(--blue-soft);color:var(--blue);width:fit-content;">${escapeHtml(contribType)}</span>
    </div>`;
  }).join('');
}

function renderGoalLinkedHabitsList(){
  const wrap = document.getElementById('goalLinkedHabitsList');
  const countLbl = document.getElementById('goalLinkedHabitsCount');
  const progRow = document.getElementById('goalHabitProgressRow');
  const progBar = document.getElementById('goalHabitProgressBar');
  const progPct = document.getElementById('goalHabitProgressPct');
  if (!wrap) return;
  if (!editingGoalId){ wrap.innerHTML = ''; if (countLbl) countLbl.textContent = ''; if (progRow) progRow.hidden = true; return; }
  const linked = getHabitsForGoal(editingGoalId); // pa gen limit — chak Habit kontribye endepandamman
  if (countLbl) countLbl.textContent = linked.length ? `(${linked.length} abitid lye · ajou otomatikman)` : '(ajou otomatikman)';
  const { pct, perHabit } = computeGoalHabitProgress(editingGoalId);
  if (progRow){
    progRow.hidden = pct === null;
    if (pct !== null){ progBar.style.width = pct + '%'; progPct.textContent = pct + '%'; }
  }
  if (!linked.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen abitid lye.</span>';
    return;
  }
  const rateByHabit = Object.fromEntries(perHabit.map(x => [x.habitId, x.rate]));
  wrap.innerHTML = linked.map(h => {
    const linkStatus = computeHabitLinkStatus(h);
    const statusLabel = HABIT_LINK_STATUS_LABEL[linkStatus];
    const statusStyle = HABIT_LINK_STATUS_STYLE[linkStatus];
    const statusBg = statusStyle.bg, statusColor = statusStyle.fg;
    const contrib = rateByHabit[h.id] ?? 0;
    const goalObj = goals.find(x => x.id === editingGoalId);
    const contribCfg = goalObj && goalObj.habitContributions ? goalObj.habitContributions[h.id] : null;
    const contribAmount = contribCfg ? contribCfg.amount : '';
    const contribUnit = contribCfg ? contribCfg.unit : '';
    const contribTotal = contribCfg ? contribCfg.total : 0;
    const contribWalletId = contribCfg ? (contribCfg.walletId || '') : '';
    const contribWallet = contribWalletId ? wallets.find(w => w.id === contribWalletId) : null;
    const walletOptions = goalObj && goalObj.isFinancial
      ? `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--text-dim);margin-top:2px;">
          <span>Sous Kòb (sere):</span>
          <select class="field goalHabitContribWallet" data-habit-id="${h.id}" style="width:140px;padding:2px 6px;font-size:11px;">
            <option value="">— Pa chwazi —</option>
            ${wallets.map(w => `<option value="${w.id}" ${w.id === contribWalletId ? 'selected' : ''}>${escapeHtml(w.name)}</option>`).join('')}
          </select>
          ${contribWallet ? `<span class="tag" style="background:var(--surface-2);color:var(--text-dim);" title="Wallet ki prepare pou sere kontribisyon sa a">${escapeHtml(contribWallet.name)}</span>` : ''}
        </div>`
      : '';
    return `<div class="milestone-row" style="flex-direction:column;align-items:stretch;gap:6px;" data-habit-id="${h.id}">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span><b>${escapeHtml(h.name)}</b>
          <span class="tag" style="background:var(--surface-2);color:var(--text-dim);margin-left:6px;">${HABIT_FREQ_LABEL[h.frequency]||h.frequency}</span>
          <span class="pill" style="background:${statusBg};color:${statusColor};margin-left:6px;">${statusLabel}</span>
          <span class="tag" style="background:var(--blue-soft);color:var(--blue);margin-left:6px;" title="Kontribisyon endepandan abitid sa a nan pwogrè objektif la">${contrib}%</span>
        </span>
        <i data-lucide="x" class="goalUnlinkHabit" data-habit-id="${h.id}" title="Delye ${escapeHtml(h.name)} (pa efase abitid la)" aria-label="Delye abitid" role="button" style="width:13px;height:13px;cursor:pointer;color:var(--text-faint);padding:3px;"></i>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--text-dim);">
        <span>Kontribisyon pa fwa:</span>
        <input type="number" class="field goalHabitContribAmount" data-habit-id="${h.id}" value="${contribAmount}" placeholder="Valè" step="any" style="width:72px;padding:2px 6px;font-size:11px;">
        <input type="text" class="field goalHabitContribUnit" data-habit-id="${h.id}" value="${escapeHtml(contribUnit)}" placeholder="inite (Pw. HTG)" style="width:100px;padding:2px 6px;font-size:11px;">
        ${contribCfg && contribCfg.amount > 0 ? `<span class="tag" style="background:var(--green-soft);color:var(--green);" title="Total kimilatif kontribisyon abitid sa a bay objektif la">Total: ${contribTotal}${contribUnit ? ' ' + escapeHtml(contribUnit) : ''}</span>` : ''}
      </div>
      ${walletOptions}
    </div>`;
  }).join('');
  wrap.querySelectorAll('.goalUnlinkHabit').forEach(ic => ic.addEventListener('click', e => {
    e.stopPropagation();
    const habitId = e.currentTarget.dataset.habitId;
    unlinkHabitFromGoal(editingGoalId, habitId);
    if (typeof recordGoalHabitProgressHistory === 'function') recordGoalHabitProgressHistory(editingGoalId, habitId, 'habit-unlinked');
    if (typeof syncGoalSavingsFromHabits === 'function') syncGoalSavingsFromHabits(editingGoalId);
    renderGoalLinkedHabitsList();
    if (typeof renderGoalProgressHistory === 'function') renderGoalProgressHistory();
    if (typeof renderLinkExistingHabitSelect === 'function') renderLinkExistingHabitSelect();
    renderGoals();
    showToast('Abitid delye ✓');
  }));
  const applyContribChange = e => {
    const habitId = e.currentTarget.dataset.habitId;
    const row = wrap.querySelector(`.milestone-row[data-habit-id="${habitId}"]`);
    if (!row || !editingGoalId) return;
    const amountInput = row.querySelector('.goalHabitContribAmount');
    const unitInput = row.querySelector('.goalHabitContribUnit');
    setGoalHabitContribution(editingGoalId, habitId, amountInput.value, unitInput.value);
    renderGoalLinkedHabitsList();
  };
  wrap.querySelectorAll('.goalHabitContribAmount, .goalHabitContribUnit').forEach(inp => {
    inp.addEventListener('change', applyContribChange);
    inp.addEventListener('click', e => e.stopPropagation());
  });
  wrap.querySelectorAll('.goalHabitContribWallet').forEach(sel => {
    sel.addEventListener('change', e => {
      e.stopPropagation();
      const habitId = e.currentTarget.dataset.habitId;
      setGoalHabitContributionWallet(editingGoalId, habitId, e.currentTarget.value);
      renderGoalLinkedHabitsList();
    });
    sel.addEventListener('click', e => e.stopPropagation());
  });
  if (window.lucide) lucide.createIcons();
  if (typeof renderGoalContributionSummary === 'function') renderGoalContributionSummary();
  if (typeof renderGoalHabitWhyLinked === 'function') renderGoalHabitWhyLinked();
  if (typeof renderGoalFinanceSyncStatus === 'function') renderGoalFinanceSyncStatus();
}

// Lè yon abitid make fèt/pa fèt jodi a, kontribisyon ak pwogrè a ka chanje —
// nou anvlope fonksyon Habit modil la (san chanje konpòtman orijinal li; nou jis
// ajoute yon rafrechisman apre) paske klik la rele toggleHabitToday() dirèkteman
// e li rele e.stopPropagation(), sa ki anpeche yon "delegated listener" mache.
(function hookHabitToggleForGoalProgress(){
  if (typeof toggleHabitToday !== 'function') return;
  const originalToggleHabitToday = toggleHabitToday;
  toggleHabitToday = function(id){
    originalToggleHabitToday(id);
    const h = habits.find(x => x.id === id);
    if (h && h.goalId){
      const doneNow = Array.isArray(h.completions) && h.completions.includes(todayISO());
      const actionSource = doneNow ? 'habit-completed' : 'habit-uncompleted';
      if (typeof recordGoalHabitProgressHistory === 'function') recordGoalHabitProgressHistory(h.goalId, id, actionSource);
      if (typeof refreshGoalHabitContributionTotals === 'function') refreshGoalHabitContributionTotals(h.goalId);
      if (doneNow && typeof recordGoalFinancialContributionHistory === 'function'){
        const g = goals.find(x => x.id === h.goalId);
        const cfg = g && g.habitContributions ? g.habitContributions[id] : null;
        if (g && g.isFinancial && cfg && Number(cfg.amount) > 0){
          recordGoalFinancialContributionHistory(h.goalId, id, Number(cfg.amount), cfg.unit);
          if (typeof createPendingGoalFinancialAction === 'function' && cfg.walletId){
            const _createdAction = createPendingGoalFinancialAction(h.goalId, id, cfg.walletId, Number(cfg.amount));
            if (_createdAction && typeof validateGoalFinancialAction === 'function' && validateGoalFinancialAction(_createdAction)){
              if (typeof executeGoalFinancialAction === 'function') executeGoalFinancialAction(_createdAction);
            }
          }
        }
      }
    }
    if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
    if (typeof renderGoalProgressHistory === 'function') renderGoalProgressHistory();
  };
})();

// ==========================================
// GOAL <-> HABIT — istwa pwogrè otomatik (Pati 9/50)
// Nouvo chan APA sou Goal la (g.habitProgressHistory) — pa touche goal.progress
// manyèl la, ni fòm/estrikti Goal modil la. Rafrechisman entèfas la (Pati 4/8)
// deja fèt san rechajman paj; isit la nou anrejistre chanjman an epi asire l
// deklanche pou chak evènman ki fè pwogrè a chanje (make/demake, lye, delye).
//
// GOAL — istwa pwogrè detaye (Pati 10/50)
// Amelyorasyon SOU MENM chan g.habitProgressHistory a (pa gen nouvo sistèm
// paralèl) — chak anrejistreman kounye a kenbe: dat, Abitid sous ki lakòz
// chanjman an (id + non, si li disponib), ak kantite ogmantasyon pwogrè a
// (delta), anplis pousantaj final la (pct, pou konpatiblite ak Pati 9).
// Chak chanjman reyèl kounye a vin yon anrejistreman apa (pa gen ekrazman
// menm jou a ankò), men n'ap toujou anpeche doublon idantik yo.
//
// GOAL — rezon pwogrè (Pati 11/50)
// Amelyorasyon SOU MENM chan g.habitProgressHistory a toujou (pa gen nouvo
// sistèm paralèl) — chak anrejistreman kounye a ajoute tou: `goalId` (eksplisit
// sou chak rekò, pou pi fasil ekstraksyon/rapò pita), `source` (kòd machin ki
// idantifye kalite aksyon an: 'habit-completed','habit-uncompleted',
// 'habit-linked','habit-unlinked','manual') ak `reason` (fraz lizib an Kreyòl
// ki eksplike pou kisa pwogrè a chanje, pa egzanp: "Pwogrè ogmante paske
// Abitid 'Sere 25 goud' te fèt."). `reason` afiche dirèkteman nan detay
// Objektif la pa renderGoalProgressHistory().
// ==========================================
function buildGoalProgressReason(actionSource, habitName, delta){
  const deltaTxt = (delta > 0 ? '+' : '') + delta + '%';
  const name = habitName ? `"${habitName}"` : 'yon abitid lye';
  const direction = delta > 0 ? 'ogmante' : (delta < 0 ? 'bese' : 'chanje');
  switch (actionSource){
    case 'habit-completed':
      return `Pwogrè ${direction} (${deltaTxt}) paske Abitid: ${name} te fin fèt.`;
    case 'habit-uncompleted':
      return `Pwogrè ${direction} (${deltaTxt}) paske Abitid: ${name} pa t make fèt ankò.`;
    case 'habit-linked':
      return `Pwogrè ${direction} (${deltaTxt}) paske Abitid: ${name} te lye ak Objektif la.`;
    case 'habit-unlinked':
      return `Pwogrè ${direction} (${deltaTxt}) paske Abitid: ${name} te delye ak Objektif la.`;
    case 'habit-deleted':
      return `Pwogrè ${direction} (${deltaTxt}) paske Abitid: ${name} te efase.`;
    default:
      return `Pwogrè ${direction} (${deltaTxt}).`;
  }
}

function recordGoalHabitProgressHistory(goalId, sourceHabitId, actionSource, habitNameOverride){
  const g = goals.find(x => x.id === goalId);
  if (!g) return false;
  const { pct } = computeGoalHabitProgress(goalId);
  if (pct === null) return false; // pa gen abitid lye ankò — pa gen pwogrè pou anrejistre
  if (!Array.isArray(g.habitProgressHistory)) g.habitProgressHistory = [];
  const history = g.habitProgressHistory;
  const last = history[history.length - 1];
  const prevPct = last ? last.pct : 0;

  // Pa gen okenn chanjman reyèl nan pwogrè a — pa anrejistre (anpeche doublon)
  if (last && last.pct === pct) return false;

  const habitId = sourceHabitId || null;
  const habit = habitId ? habits.find(h => h.id === habitId) : null;
  // Si Abitid la deja efase (pa egziste ankò nan habits[]), sèvi ak non li te bay davans (habitNameOverride)
  const resolvedHabitName = habit ? habit.name : (habitNameOverride || null);
  const source = actionSource || 'manual';
  const delta = Math.round((pct - prevPct) * 10) / 10; // kantite ogmantasyon (ka negatif si pwogrè bese)
  const now = new Date();
  const record = {
    goalId,                  // Objektif konsène a (eksplisit sou chak rekò)
    date: todayISO(),        // dat chanjman an (YYYY-MM-DD)
    time: now.toISOString(), // maren egzat pou triye/distenge plizyè chanjman menm jou a
    habitId: habitId,        // Abitid sous ki lakòz chanjman an (null si se yon aksyon jeneral)
    habitName: resolvedHabitName,
    source,                  // kòd machin pou kalite aksyon an ('habit-completed', 'habit-linked', ...)
    delta,                   // kantite chanjman (ka negatif si pwogrè bese)
    pct,                     // pousantaj total pwogrè Objektif la apre chanjman an
    reason: buildGoalProgressReason(source, resolvedHabitName, delta) // fraz lizib pou detay Objektif la
  };

  // Gad siplemantè kont doublon: menm dat + menm Abitid sous + menm pct kòm dènye antre a
  if (last && last.date === record.date && last.habitId === record.habitId && last.pct === record.pct) return false;

  history.push(record);
  if (history.length > 180) g.habitProgressHistory = history.slice(-180);
  persistGoals();
  if (typeof logGoalHistoryToLifeTimeline === 'function') logGoalHistoryToLifeTimeline(goalId, record);
  return true;
}

// Bay aksè fasil ak istwa pwogrè yon Objektif, triye pi resan an premye
// (itilize pa renderGoalProgressHistory anba a, ak disponib pou lòt modil kap vini)
function getGoalProgressHistory(goalId){
  const g = goals.find(x => x.id === goalId);
  if (!g || !Array.isArray(g.habitProgressHistory)) return [];
  return g.habitProgressHistory.slice().reverse();
}

// ==========================================
// GOAL — Mirwa Istwa Pwogrè nan Istwa Lavi Global (Ajisteman apre Pati 50/50)
// Ti fenèt "Modifye Objektif" la pa afiche istwa pwogrè ankò (Timeline
// Objektif + Istwa Kontribisyon Finansye retire) — chak nouvo antre nan
// g.habitProgressHistory kounye a MIRWA dirèkteman nan Istwa Lavi global la
// (activityLog / vi "Istwa Lavi") ANPLIS de sa ki te deja la, san touche
// okenn antre ki egziste deja. Chak evènman toujou parèt anba kategori
// "Objektif" — epi, si li gen rapò ak Finans (kontribisyon sere) oswa
// Aprantisaj (leson konplete), li parèt yon FWA anplis anba kategori sa a
// tou. `goalHistoryKey` la asire NOU PA JANM kreye 2 fwa menm evènman an
// nan menm kategori a (gad kont doublon pou chak kategori separeman).
// ==========================================
function goalHistoryEventKey(goalId, record){
  const bit = record.habitId || record.milestoneId || record.note || '';
  return [goalId, record.source, record.date, bit, record.pct].join('|');
}

function logGoalHistoryToLifeTimeline(goalId, record){
  if (!record || typeof activityLog === 'undefined') return;
  const g = goals.find(x => x.id === goalId);
  const goalTitle = g ? g.title : 'Objektif';
  const key = goalHistoryEventKey(goalId, record);
  const alreadyIn = category => activityLog.some(a => a.category === category && a.goalHistoryKey === key);
  const push = (icon, color, category, text) => {
    if (alreadyIn(category)) return;
    activityLog.unshift({ id: uid(), icon, color, text, category, goalHistoryKey: key, ts: new Date().toISOString() });
  };

  // ---- Toujou nan kategori "Objektif" ----
  push('target', 'var(--blue)', 'goals', `<b>${escapeHtml(goalTitle)}</b> — ${escapeHtml(record.reason || 'Pwogrè ajou')}`);

  // ---- Anplis, nan kategori "Finans" si se yon kontribisyon finansye ----
  if (record.source === 'saving-habit-completed'){
    push('wallet', 'var(--green)', 'finance', `Objektif <b>${escapeHtml(goalTitle)}</b> — ${escapeHtml(record.reason || 'Kontribisyon finansye')}`);
  }

  // ---- Anplis, nan kategori "Aprantisaj" si se yon pwogrè leson ----
  if (record.source === 'learning-lesson-completed'){
    push('graduation-cap', 'var(--orange)', 'learning', `Objektif <b>${escapeHtml(goalTitle)}</b> — ${escapeHtml(record.reason || 'Pwogrè aprantisaj')}`);
  }

  if (activityLog.length > 300) activityLog.length = 300;
  if (typeof persistActivity === 'function') persistActivity();
}

// ==========================================
// GOAL FINANSYE — eksplikasyon chak kontribisyon (Pati 22/50)
// Sèvi ak MENM chan g.habitProgressHistory a (Pati 9/10/11) — pa gen nouvo
// dosye/sistèm paralèl. Chak fwa yon Abitid ki sere fin konplete e sa ajoute
// yon kontribisyon reyèl, nou anrejistre yon antre siplemantè ki gen `amountAdded`
// + `unit`, sou tèt de chan `pct`/`delta` ki deja la — pou moun nan wè EGZAKTMAN
// sous, kantite, dat, ak Abitid konsène a pou chak chanjman Objektif Finansye.
// ==========================================
function recordGoalFinancialContributionHistory(goalId, habitId, amount, unit){
  const g = goals.find(x => x.id === goalId);
  if (!g || !amount || amount <= 0) return false;
  const h = habits.find(x => x.id === habitId);
  const habitName = h ? h.name : null;
  if (!Array.isArray(g.habitProgressHistory)) g.habitProgressHistory = [];
  const history = g.habitProgressHistory;
  const date = todayISO();
  // Anpeche doublon: yon sèl kontribisyon finansye pou menm Objektif+Abitid+dat
  // (pa sèlman dènye antre a — pran an kont TOUT istwa a, paske lòt antre ka
  // enterkale ant de aksyon menm jou a).
  const alreadyRecorded = history.some(r =>
    r.source === 'saving-habit-completed' && r.goalId === goalId && r.habitId === habitId && r.date === date
  );
  if (alreadyRecorded) return false;
  const pct = computeGoalFinancialProgressPct(g);
  const record = {
    goalId,
    date,
    time: new Date().toISOString(),
    habitId: habitId || null,
    habitName,
    source: 'saving-habit-completed',
    amountAdded: amount,
    unit: unit || '',
    pct,
    reason: `Sere ${amount}${unit ? ' ' + unit : ''} paske Abitid "${habitName || 'Abitid Lye'}" te fin fèt.`
  };
  history.push(record);
  if (history.length > 180) g.habitProgressHistory = history.slice(-180);
  persistGoals();
  if (typeof logGoalHistoryToLifeTimeline === 'function') logGoalHistoryToLifeTimeline(goalId, record);
  return true;
}

// ==========================================
// GOAL <-> FINANCE — preparasyon aksyon annatant (Pati 24/50)
// Sèlman yon KE (queue) aksyon "annatant" (pending) — pa gen okenn ekzekisyon,
// pa touche balans Wallet, pa kreye okenn tranzaksyon Finance reyèl. Objektif
// Pati sa a se prepare done ki nesesè pou pwochen entegrasyon Finance la
// (aksyon reyèl la ap trete ke sa a nan yon Pati pita — pa isit la).
// Chak aksyon annatant genyen: goalId, habitId, walletId, amount, date, epi
// yon `status` ('pending') pou distenge l de sa ki ta ka trete pita.
// ==========================================
function createPendingGoalFinancialAction(goalId, habitId, walletId, amount, date){
  if (!goalId || !habitId || !walletId || !amount || amount <= 0) return null; // pa gen ase enfòmasyon — pa prepare anyen
  const actionDate = date || todayISO();
  // Anpeche doublon: pa kreye 2 aksyon annatant pou menm Objektif+Abitid+dat
  const alreadyPending = pendingGoalFinancialActions.some(a =>
    a.goalId === goalId && a.habitId === habitId && a.date === actionDate
  );
  if (alreadyPending) return null;
  const action = {
    id: uid(),
    goalId,
    habitId,
    walletId,
    amount,
    date: actionDate,
    status: 'pending', // poko trete — pwochen Pati Finance la ap responsab egzekisyon an
    createdAt: new Date().toISOString()
  };
  pendingGoalFinancialActions.push(action);
  persistPendingGoalFinancialActions();
  return action;
}

function getPendingGoalFinancialActions(goalId){
  return goalId ? pendingGoalFinancialActions.filter(a => a.goalId === goalId) : pendingGoalFinancialActions.slice();
}

// ==========================================
// GOAL <-> FINANCE — validasyon aksyon annatant (Pati 25/50)
// Aktive VALIDASYON aksyon annatant Pati 24 yo kreye — TOUJOU pa gen okenn
// egzekisyon reyèl isit la: pa touche balans Wallet, pa kreye okenn
// tranzaksyon Finance, pa modifye achitekti Finance/Goal/Habit.
// Nou sèlman verifye done aksyon an valid (Objektif egziste, Abitid egziste,
// Wallet egziste, montan valid, e aksyon an poko trete), epi si tout bon nou
// make l `status:'ready'` — sa vle di li PARE pou yon pwochen Pati egzekite
// transfè reyèl la. Objektif finansye a (g.currentSavings) deja senkwonize
// nan Pati 21 (syncGoalSavingsFromHabits, rele nan refreshGoalHabitContributionTotals),
// donk nou pa touche l isit la. Istwa kontribisyon an (Pati 22/23) deja
// prepare tou pa recordGoalFinancialContributionHistory.
// ==========================================
function validateGoalFinancialAction(action){
  if (!action) return false;
  if (action.status !== 'pending') return false; // deja trete (oswa deja validé) — pa retrete l
  const g = goals.find(x => x.id === action.goalId);
  if (!g) return false; // Objektif pa egziste
  const h = habits.find(x => x.id === action.habitId);
  if (!h) return false; // Abitid pa egziste
  const w = wallets.find(x => x.id === action.walletId);
  if (!w) return false; // referans Wallet pa egziste
  const amount = Number(action.amount);
  if (!amount || isNaN(amount) || amount <= 0) return false; // montan envalid
  action.status = 'ready'; // pare pou transfè — okenn balans/tranzaksyon pa chanje isit la
  action.validatedAt = new Date().toISOString();
  persistPendingGoalFinancialActions();
  return true;
}

function validateGoalFinancialActionById(actionId){
  const action = pendingGoalFinancialActions.find(a => a.id === actionId);
  return validateGoalFinancialAction(action);
}

function getReadyGoalFinancialActions(goalId){
  const list = goalId ? pendingGoalFinancialActions.filter(a => a.goalId === goalId) : pendingGoalFinancialActions.slice();
  return list.filter(a => a.status === 'ready');
}

// ==========================================
// GOAL <-> FINANCE — egzekisyon transfè reyèl (Pati 26/50)
// Premye fwa lajan an DEPLASE toutbon: nou kreye YON tranzaksyon Depans nan
// `tx` (menm estrikti Finance ki egziste deja — Pati orijinal la) sou Wallet
// aksyon an vize a. `walletBalance()` deja kalkile balans lan apati `tx`
// (Pati Finance orijinal), donk ajoute tranzaksyon sa a otomatikman diminye
// balans Wallet la — nou pa touche `w.balance` dirèkteman, nou pa modifye
// achitekti Finance a. Sere Objektif la (g.currentSavings) ak pwogrè a deja
// otomatikman ajou pa Pati 21 (syncGoalSavingsFromHabits) — nou pa double
// kalkil la isit la. Aksyon an SÈLMAN egzekite si li 'ready' (validé pa Pati
// 25); imedyatman apre nou make l 'done' AVAN nenpòt lòt bagay pou anpeche
// yon 2yèm tranzaksyon pou menm aksyon an — lajan an deplase YON SÈL fwa.
// ==========================================
// ==========================================
// GOAL <-> FINANCE — pwoteksyon tranzaksyon otomatik (Pati 27/50)
// Anvan nou kite executeGoalFinancialAction kreye yon tranzaksyon, nou
// REVERIFYE 4 kondisyon kritik yo (sitiyasyon an ka chanje ant moman Pati 25
// te validé aksyon an ak moman egzekisyon an reyèl): Abitid la reyèlman
// fèt pou dat aksyon an, Objektif la toujou aktif (pa Achive/Sispann/
// Konplete), Wallet la egziste e gen ase balans, e montan an valid. Si YONN
// nan yo echwe, aksyon an ANILE (status:'failed') — OKENN lòt done pa
// chanje: pa gen tranzaksyon Finance ki kreye, pa gen balans Wallet ki
// touche, pa gen Sere Objektif ki modifye.
// ==========================================
function canExecuteGoalFinancialAction(action){
  if (!action) return { ok:false, reason:'no-action' };
  const g = goals.find(x => x.id === action.goalId);
  const h = habits.find(x => x.id === action.habitId);
  const w = wallets.find(x => x.id === action.walletId);
  if (!h || !Array.isArray(h.completions) || !h.completions.includes(action.date)){
    return { ok:false, reason:'habit-not-completed' }; // Abitid pa reyèlman make fèt pou dat aksyon an
  }
  if (!g){
    return { ok:false, reason:'goal-missing' };
  }
  if (g.status === 'archived' || g.status === 'paused' || g.status === 'completed'){
    return { ok:false, reason:'goal-not-active' }; // Objektif la pa ap aktif ankò — pa kontinye sere ladan l
  }
  if (!w){
    return { ok:false, reason:'wallet-missing' };
  }
  const amount = Number(action.amount);
  if (!amount || isNaN(amount) || amount <= 0){
    return { ok:false, reason:'invalid-amount' };
  }
  if (walletBalance(w) < amount){
    return { ok:false, reason:'insufficient-balance' }; // pa ase lajan sou Wallet la — pa kite balans lan vin negatif
  }
  return { ok:true };
}

function cancelGoalFinancialAction(action, reason){
  if (!action) return;
  action.status = 'failed'; // aksyon anile — okenn tranzaksyon, okenn chanjman Wallet/Objektif
  action.failedAt = new Date().toISOString();
  action.failReason = reason || 'validation-failed';
  persistPendingGoalFinancialActions();
}

function executeGoalFinancialAction(action){
  if (!action || action.status !== 'ready') return null; // pa validé ankò, oswa deja trete — pa fè anyen (pa gen chanjman)
  const check = canExecuteGoalFinancialAction(action);
  if (!check.ok){
    cancelGoalFinancialAction(action, check.reason);
    return null;
  }
  const g = goals.find(x => x.id === action.goalId);
  const h = habits.find(x => x.id === action.habitId);
  const w = wallets.find(x => x.id === action.walletId);
  const amount = Number(action.amount);
  // Make aksyon an 'done' AVAN push la, pou anpeche apèl doub kreye 2 tranzaksyon
  action.status = 'done';
  action.executedAt = new Date().toISOString();
  const reason = `Sere ${amount}${walletCurrency(w) ? ' ' + walletCurrency(w) : ''} pou Objektif "${g.title || 'San tit'}" apati Abitid "${h.name || 'San non'}"`;
  const txRecord = {
    id: uid(),
    type: 'expense',
    amount,
    description: reason,
    category: 'Custom',
    walletId: action.walletId,
    date: action.date || todayISO(),
    time: new Date().toTimeString().slice(0,5),
    goalId: action.goalId,
    habitId: action.habitId,
    reason,
  };
  tx.push(txRecord);
  persistTx();
  action.transactionId = txRecord.id;
  persistPendingGoalFinancialActions();
  return txRecord;
}

// ==========================================
// GOAL <-> FINANCE — lis istwa kontribisyon (Pati 23/50)
// Sèvi ak MENM chan g.habitProgressHistory a (Pati 9/22) — jis yon FILTR pou
// montre yon lis dedye ki gen sèlman kontribisyon finansye yo (pa mele ak
// istwa % pwogrè jeneral la). Pa gen nouvo dosye/estrikti.
// ==========================================
function getGoalFinancialContributionHistory(goalId){
  return getGoalProgressHistory(goalId).filter(r => r.source === 'saving-habit-completed' && r.amountAdded);
}

function renderGoalFinancialContributionHistory(){
  const wrap = document.getElementById('goalFinancialContributionHistoryList');
  if (!wrap) return;
  if (!editingGoalId){ wrap.innerHTML = ''; return; }
  const entries = getGoalFinancialContributionHistory(editingGoalId).slice(0, 30);
  if (!entries.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen kontribisyon finansye anrejistre.</span>';
    return;
  }
  wrap.innerHTML = entries.map(r => `<div class="milestone-row" style="justify-content:space-between;">
      <span style="color:var(--green);font-weight:600;">+${r.amountAdded}${r.unit ? ' ' + escapeHtml(r.unit) : ''}</span>
      <span style="font-size:11px;color:var(--text-dim);">Sous: ${r.habitName ? escapeHtml(r.habitName) : 'Abitid Lye'}</span>
      <span class="tag" style="background:var(--surface-2);color:var(--text-dim);">${r.date === todayISO() ? 'Jodi a' : escapeHtml(r.date)}</span>
    </div>`).join('');
}

// Afiche istwa evolisyon pwogrè Objektif la nan modal la (li sèlman — pa
// touche okenn lòt eleman/fonksyon ki egziste deja). Pati 11/50: chak liy
// kounye a montre fraz `reason` an lekti dirèk anndan detay Objektif la.
function renderGoalProgressHistory(){
  const wrap = document.getElementById('goalProgressHistoryList');
  if (!wrap) return;
  if (!editingGoalId){ wrap.innerHTML = ''; if (typeof renderGoalFinancialContributionHistory === 'function') renderGoalFinancialContributionHistory(); return; }
  const entries = getGoalProgressHistory(editingGoalId).slice(0, 20);
  if (!entries.length){
    wrap.innerHTML = '<span style="font-size:11.5px;color:var(--text-faint);">Poko gen istwa pwogrè.</span>';
    if (typeof renderGoalFinancialContributionHistory === 'function') renderGoalFinancialContributionHistory();
    return;
  }
  wrap.innerHTML = entries.map(r => {
    if (r.source === 'saving-habit-completed' && r.amountAdded){
      return `<div class="milestone-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <span style="font-size:12px;line-height:1.4;">📅 <b>Aktyalizasyon:</b> Abitid Sere Konplete</span>
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span class="tag" style="background:var(--green-soft);color:var(--green);">Kontribisyon: ${r.amountAdded}${r.unit ? ' ' + escapeHtml(r.unit) : ''}</span>
          <span class="tag" style="background:var(--surface-2);color:var(--text-dim);">${r.date === todayISO() ? 'Jodi a' : escapeHtml(r.date)}</span>
          ${r.habitName ? `<span class="pill" style="background:var(--blue-soft);color:var(--blue);">Abitid: ${escapeHtml(r.habitName)}</span>` : ''}
        </span>
      </div>`;
    }
    if (r.source === 'milestone-completed' || r.source === 'milestone-uncompleted'){
      return `<div class="milestone-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <span style="font-size:12px;line-height:1.4;">📅 ${escapeHtml(r.reason)}</span>
        <span style="display:flex;align-items:center;gap:6px;">
          <span class="tag" style="background:var(--surface-2);color:var(--text-dim);">${escapeHtml(r.date)}</span>
          <span class="pill" style="background:${r.source==='milestone-completed'?'var(--green-soft)':'var(--surface-2)'};color:${r.source==='milestone-completed'?'var(--green)':'var(--text-dim)'};">${r.pct}%</span>
        </span>
      </div>`;
    }
    if (r.source === 'learning-lesson-completed'){
      return `<div class="milestone-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <span style="font-size:12px;line-height:1.4;">📅 ${escapeHtml(r.reason)}</span>
        <span style="display:flex;align-items:center;gap:6px;">
          <span class="tag" style="background:var(--surface-2);color:var(--text-dim);">${escapeHtml(r.date)}</span>
          <span class="tag" style="color:var(--green);">+${r.delta} leson</span>
          <span class="pill" style="background:var(--blue-soft);color:var(--blue);">${r.pct}%</span>
        </span>
      </div>`;
    }
    if (r.source === 'manual-note'){
      return `<div class="milestone-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <span style="font-size:12px;line-height:1.4;">📅 <b>Nòt:</b> ${escapeHtml(r.note)}</span>
        <span class="tag" style="background:var(--surface-2);color:var(--text-dim);">${escapeHtml(r.date)}</span>
      </div>`;
    }
    const deltaSign = r.delta > 0 ? '+' : '';
    const deltaColor = r.delta > 0 ? 'var(--green)' : (r.delta < 0 ? 'var(--red, #e5484d)' : 'var(--text-dim)');
    const reasonText = r.reason ? escapeHtml(r.reason) : (r.habitName ? escapeHtml(r.habitName) : 'Chanjman jeneral');
    return `<div class="milestone-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
      <span style="font-size:12px;line-height:1.4;">📅 ${reasonText}</span>
      <span style="display:flex;align-items:center;gap:6px;">
        <span class="tag" style="background:var(--surface-2);color:var(--text-dim);">${escapeHtml(r.date)}</span>
        <span class="tag" style="color:${deltaColor};">${deltaSign}${r.delta}%</span>
        <span class="pill" style="background:var(--blue-soft);color:var(--blue);">${r.pct}%</span>
      </span>
    </div>`;
  }).join('');
  if (typeof renderGoalFinancialContributionHistory === 'function') renderGoalFinancialContributionHistory();
}
document.getElementById('addGoalTimelineNoteBtn')?.addEventListener('click', () => {
  if (!editingGoalId) return;
  const input = document.getElementById('goalTimelineNoteInput');
  if (!input || !input.value.trim()) return;
  if (addGoalTimelineNote(editingGoalId, input.value)){
    input.value = '';
    renderGoalProgressHistory();
  }
});

(function initGoalLinkedHabitsList(){
  const overlay = document.getElementById('goalModalOverlay');
  if (!overlay) return;
  const refreshAll = () => { renderGoalLinkedHabitsList(); renderGoalProgressHistory(); };
  new MutationObserver(refreshAll).observe(overlay, { attributes:true, attributeFilter:['class'] });
  refreshAll();
})();

// ==========================================
// GOAL <-> HABIT — entegrite done pèsistan (Pati 5/50)
// Lyen an deja anrejistre pèmanan depi Pati 1 (linkedHabitIds/goalId ap viv sou
// menm objè goals/habits ki pase nan persistGoals()/persistHabits() -> localStorage,
// epi migrasyon nan chajman restore yo apre reload). Isit la nou ranfòse
// fyabilite: elimine duplikasyon ak lyen kase, san touche Goal/Habit modil yo.
// ==========================================
function pruneBrokenGoalHabitLinks(){
  let changed = false;
  const goalIds = new Set(goals.map(g => g.id));
  const habitIds = new Set(habits.map(h => h.id));

  // 1) Chak goal.linkedHabitIds: retire duplikata ak ID abitid ki pa egziste ankò
  goals.forEach(g => {
    if (!Array.isArray(g.linkedHabitIds)){ g.linkedHabitIds = []; changed = true; return; }
    const cleaned = [...new Set(g.linkedHabitIds)].filter(id => habitIds.has(id));
    if (cleaned.length !== g.linkedHabitIds.length || cleaned.some((id,i) => id !== g.linkedHabitIds[i])){
      g.linkedHabitIds = cleaned;
      changed = true;
    }
  });

  // 2) Chak habit.goalId: retire referans si Objektif la pa egziste ankò
  habits.forEach(h => {
    if (h.goalId && !goalIds.has(h.goalId)){ h.goalId = null; changed = true; }
  });

  // 3) Senkronize de sans yo: yon habitId dwe parèt SÈLMAN nan linkedHabitIds Goal ke habit.goalId a pwente sou li
  habits.forEach(h => {
    goals.forEach(g => {
      const idx = (g.linkedHabitIds||[]).indexOf(h.id);
      if (idx !== -1 && g.id !== h.goalId){ g.linkedHabitIds.splice(idx, 1); changed = true; }
    });
    if (h.goalId){
      const g = goals.find(x => x.id === h.goalId);
      if (g && !g.linkedHabitIds.includes(h.id)){ g.linkedHabitIds.push(h.id); changed = true; }
    }
  });

  if (changed){ persistGoals(); persistHabits(); }
  return changed;
}

// Repare/valide entegrite done a chak fwa aplikasyon an chaje (apre reload)
pruneBrokenGoalHabitLinks();

// Chak fwa yon Habit oswa yon Goal efase, netwaye lyen kase yo otomatikman
document.getElementById('deleteHabitBtn').addEventListener('click', () => {
  pruneBrokenGoalHabitLinks();
  if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
  if (typeof renderLinkExistingHabitSelect === 'function') renderLinkExistingHabitSelect();
});
document.getElementById('deleteGoalBtn').addEventListener('click', () => {
  pruneBrokenGoalHabitLinks();
});

// ==========================================
// GOAL <-> HABIT — senkronizasyon lè yon Abitid efase (Pati 14/50)
// Habit modil la efase Abitid la KONPLETMAN (retire l nan habits[]) anvan
// kouch nou an ka reyaji, donk nou pèdi non/goalId li si nou pa kaptire yo
// AVAN sa. Nou anvlope openHabitModal() (san chanje konpòtman orijinal li)
// pou kenbe yon ti "snapshot" chak fwa moun nan louvri yon Abitid pou
// modifye/efase l; si se menm Abitid la ki efase apre, nou itilize snapshot
// sa a pou: (1) anrejistre yon antre istwa pwogrè lizib sou Objektif la
// (si li te lye), (2) netwaye antre kontribisyon òfelen an (Pati 12) pou
// pa gen done ki rete ap trennen san rezon.
// ==========================================
let lastOpenedHabitSnapshot = null;
(function hookOpenHabitModalForGoalSync(){
  if (typeof openHabitModal !== 'function') return;
  const originalOpenHabitModal = openHabitModal;
  openHabitModal = function(id){
    if (id){
      const h = habits.find(x => x.id === id);
      if (h) lastOpenedHabitSnapshot = { id: h.id, name: h.name, goalId: h.goalId || null };
    }
    return originalOpenHabitModal(id);
  };
})();

document.getElementById('deleteHabitBtn').addEventListener('click', () => {
  const snap = lastOpenedHabitSnapshot;
  if (!snap || snap.id !== editingHabitId) return; // pa menm Abitid la — pa gen anyen pou senkwonize
  if (snap.goalId){
    if (typeof recordGoalHabitProgressHistory === 'function'){
      recordGoalHabitProgressHistory(snap.goalId, snap.id, 'habit-deleted', snap.name);
    }
    const g = goals.find(x => x.id === snap.goalId);
    if (g && g.habitContributions && g.habitContributions[snap.id]){
      delete g.habitContributions[snap.id]; // retire antre kontribisyon òfelen an — pa kite done trennen
      persistGoals();
    }
  }
  lastOpenedHabitSnapshot = null;
  if (typeof renderGoalLinkedHabitsList === 'function') renderGoalLinkedHabitsList();
  if (typeof renderGoalProgressHistory === 'function') renderGoalProgressHistory();
});

const GOAL_TYPE_LABEL = { short:'Kout tèm', medium:'Mwayen tèm', long:'Long tèm' };
let _goalRenderSig = '';
// ---- Pati 48/50: done pou amelyore konpreyansyon (badge koneksyon, ----
// eksplikasyon pwogrè, apèsi aktivite). Fonksyon PUR — li done ki egziste
// deja sèlman (isFinancial, getHabitsForGoal, linkedLearningCourses,
// projects, g.deadline, g.habitProgressHistory) — pa gen nouvo chan sove.
function goalUxHighlights(g){
  const connections = [];
  if (g.isFinancial) connections.push({ icon:'💰', label:'Finans' });
  if (getHabitsForGoal(g.id).length) connections.push({ icon:'✓', label:'Abitid' });
  if (g.deadline) connections.push({ icon:'📅', label:'Kalandriye' });
  if (projects.some(p => p.goalId === g.id)) connections.push({ icon:'📁', label:'Pwojè' });
  if (Array.isArray(g.linkedLearningCourses) && g.linkedLearningCourses.length) connections.push({ icon:'🎓', label:'Aprantisaj' });

  const history = getGoalProgressHistory(g.id); // deja egziste (Pati 9/50), pi resan an premye
  const progressExplanation = history.length ? history[0].reason : null;
  const activityPreview = history.slice(0, 3).map(r => ({ date:r.date, reason:r.reason }));

  return { connections, progressExplanation, activityPreview };
}

function renderGoals(){
  const list = document.getElementById('goalList');
  const q = document.getElementById('goalSearch').value.toLowerCase();
  const tf = document.getElementById('filterGoalType').value;
  const sortBy = document.getElementById('sortGoals').value;
  let arr = goals.filter(g => (!q || g.title.toLowerCase().includes(q) || (g.desc||'').toLowerCase().includes(q)) && (!tf || g.type === tf));
  arr = arr.slice().sort((a,b) => {
    if (sortBy === 'progress') return goalMilestoneProgress(b) - goalMilestoneProgress(a);
    if (sortBy === 'priority') return priorityRank(b.priority) - priorityRank(a.priority);
    return new Date(a.deadline || '2999-01-01') - new Date(b.deadline || '2999-01-01');
  });
  // Ti optimizasyon: pa rebati lis DOM la si anyen pa chanje depi dènye render
  const sig = JSON.stringify(arr.map(g => [g.id,g.title,g.progress,g.status,g.category,g.priority,g.deadline,(g.milestones||[]).map(m=>m.done),(g.dependsOn||[]).map(id => (goals.find(x=>x.id===id)||{}).status)]));
  if (sig !== _goalRenderSig){
    _goalRenderSig = sig;
    list.innerHTML = '';
    if (!arr.length){
      list.innerHTML = '<div class="card widget-empty" style="padding:24px;">Ou poko gen objektif. Klike "Nouvo Objektif" pou kòmanse.</div>';
    }
    arr.forEach(g => {
      const pct = goalMilestoneProgress(g);
      // Pati 39/50: ti maak depandans sou kat la, san chanje ankenn lòt kalkil
      const depStatus = (g.dependsOn && g.dependsOn.length) ? computeGoalDependencyStatus(g.id) : null;
      // Pati 48/50: badge koneksyon + eksplikasyon pwogrè + apèsi aktivite (done sèlman, pa gen nouvo sove)
      const { connections, progressExplanation, activityPreview } = goalUxHighlights(g);
      const el = document.createElement('div');
      el.className = 'card goal-card';
      el.innerHTML = `
        <div class="goal-card-head">
          <b>${escapeHtml(g.title)}</b>
          <span class="pill" style="background:${priorityBg(g.priority)};color:${priorityColor(g.priority)}">${PRIORITY[g.priority]}</span>
        </div>
        ${g.desc ? `<div class="goal-desc">${escapeHtml(g.desc)}</div>` : ''}
        <div class="goal-meta-row">
          <span class="tag" style="background:var(--surface-2);color:var(--text-dim)">${GOAL_TYPE_LABEL[g.type]||g.type}</span>
          <span class="goal-category-tag">${GOAL_CATEGORY[g.category]||g.category||''}</span>
          <span class="goal-category-tag" style="background:${(GOAL_STATUS_STYLE[g.status]||{}).bg||''};color:${(GOAL_STATUS_STYLE[g.status]||{}).fg||''};">${GOAL_STATUS[g.status]||g.status||''}</span>
          ${g.deadline ? `<span><i data-lucide="calendar" style="width:11px;height:11px;vertical-align:-2px;"></i> ${g.deadline}</span>` : ''}
          <span>${(g.milestones||[]).filter(m=>m.done).length}/${(g.milestones||[]).length} etap</span>
          ${depStatus ? `<span class="pill" style="background:${depStatus.blocked?'var(--orange-soft)':'var(--green-soft)'};color:${depStatus.blocked?'var(--orange)':'var(--green)'};" title="Depandans"><i data-lucide="${depStatus.blocked?'lock':'unlock'}" style="width:10px;height:10px;vertical-align:-1px;"></i> ${depStatus.completedCount}/${depStatus.total} depandans</span>` : ''}
        </div>
        ${connections.length ? `<div class="goal-connection-badges">${connections.map(c => `<span class="goal-connection-badge">${c.icon} ${c.label}</span>`).join('')}</div>` : ''}
        <div class="goal-progress-row"><div class="mini-progress"><span style="width:${pct}%;background:${priorityColor(g.priority)}"></span></div><b>${pct}%</b></div>
        ${progressExplanation ? `<div class="goal-progress-explain">"${escapeHtml(progressExplanation)}"</div>` : ''}
        ${activityPreview.length ? `<div class="goal-activity-preview">${activityPreview.map(a => `<div class="goal-activity-preview-row"><span class="dot"></span>${a.date} — ${escapeHtml(a.reason)}</div>`).join('')}</div>` : ''}
      `;
      el.addEventListener('click', () => openGoalDetailsModal(g.id));
      list.appendChild(el);
    });
    if (window.lucide) lucide.createIcons();
  }
  const total = goals.length;
  const completed = goals.filter(g => goalMilestoneProgress(g) >= 100).length;
  const avgProgress = total ? Math.round(goals.reduce((s,g)=>s+goalMilestoneProgress(g),0)/total) : 0;
  document.getElementById('goalStats').innerHTML = `
    <div class="st"><b>${total}</b><span>Total Objektif</span></div>
    <div class="st"><b>${completed}</b><span>Konplete</span></div>
    <div class="st"><b>${avgProgress}%</b><span>Pwogrè Mwayen</span></div>
  `;
  const insight = document.getElementById('goalAiInsight');
  const soonest = arr.find(g => g.deadline);
  insight.innerHTML = total
    ? (soonest ? `Objektif <b>"${escapeHtml(soonest.title)}"</b> gen dat limit <b>${soonest.deadline}</b>. Pwogrè mwayen ou se <b>${avgProgress}%</b> — kontinye konsa!` : `Pwogrè mwayen ou sou tout objektif se <b>${avgProgress}%</b>.`)
    : 'Ajoute yon objektif pou AI kòmanse bay sijesyon.';
  setCategory('goals', avgProgress);
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// LEARNING MODULE
// ==========================================
// Single source of truth for lesson content, mirrored in course.html.
// Shape matches course.html exactly: courses[key] = { title, icon, color, units:[{title, lessons:[{id,title,content,example,exercise,quiz{question,options,correct},xp}]}] }
// Adding a new subject only requires a new entry here + in course.html's `courses` object — no other frontend change needed.
const LEARNING_COURSES = {
  html: { title:'HTML', icon:'file-code-2', color:'var(--orange)', units:[
    { title:'Inite 1 — Estrikti', lessons:[
      { id:1, title:'Baz HTML', content:'HTML se lang ki bay estrikti a yon paj wèb, ak tag ki make tit, paragraf, lis, elatriye.',
        example:'<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Bonjou</h1>\n  </body>\n</html>',
        exercise:'Ekri yon tag <p> ki di "Mwen ap aprann HTML".',
        quiz:{ question:'Ki tag ki make yon paragraf?', options:['<p>','<h1>','<div>','<span>'], correct:0 }, xp:20 },
      { id:2, title:'Lyen ak Imaj', content:'Tag <a> kreye lyen, tag <img> ajoute imaj ak yon atribi src.',
        example:'<a href="https://example.com">Vizite</a>\n<img src="foto.jpg" alt="Foto">',
        exercise:'Ekri yon lyen ki mennen nan "https://oslife.app".',
        quiz:{ question:'Ki atribi ki bay chemen imaj la?', options:['href','alt','src','link'], correct:2 }, xp:20 },
    ]},
    { title:'Inite 2 — Fòm ak Tablo', lessons:[
      { id:3, title:'Fòm Baz', content:'Tag <form> ansanm ak <input> pèmèt itilizatè antre done.',
        example:'<form>\n  <input type="text" placeholder="Non">\n  <button>Voye</button>\n</form>',
        exercise:'Ajoute yon <input type="email"> nan yon fòm.',
        quiz:{ question:'Ki tag ki kontni yon chan antre done?', options:['<input>','<field>','<entry>','<data>'], correct:0 }, xp:25 },
      { id:4, title:'Tablo', content:'Tag <table>, <tr>, <td> ansanm kreye tablo done.',
        example:'<table>\n  <tr><td>Non</td><td>Laj</td></tr>\n</table>',
        exercise:'Ajoute yon dezyèm liy nan tablo egzanp la.',
        quiz:{ question:'Ki tag ki reprezante yon selil nan tablo?', options:['<cell>','<td>','<tc>','<row>'], correct:1 }, xp:25 },
    ]},
  ]},
  css: { title:'CSS', icon:'palette', color:'var(--blue)', units:[
    { title:'Inite 1 — Estil Baz', lessons:[
      { id:1, title:'Seleksyonè', content:'CSS itilize seleksyonè pou vize eleman HTML epi aplike estil sou yo.',
        example:'p { color: blue; font-size: 16px; }',
        exercise:'Chanje koulè tit <h1> a an vèt.',
        quiz:{ question:'Ki pwopriyete ki chanje koulè tèks la?', options:['background','color','font','border'], correct:1 }, xp:20 },
      { id:2, title:'Bwat Modèl (Box Model)', content:'Chak eleman gen margin, border, padding, ak contenu.',
        example:'.card { padding: 16px; margin: 10px; border: 1px solid #ccc; }',
        exercise:'Ajoute yon padding 20px sou yon kat.',
        quiz:{ question:'Ki pwopriyete ki ajoute espas anndan yon eleman?', options:['margin','padding','gap','space'], correct:1 }, xp:20 },
    ]},
    { title:'Inite 2 — Flexbox', lessons:[
      { id:3, title:'Entwodiksyon Flexbox', content:'display:flex pèmèt ou aliye eleman fasilman nan yon liy oswa kolòn.',
        example:'.row { display: flex; gap: 10px; align-items: center; }',
        exercise:'Kreye yon .row ki gen 3 kat aliye youn bò kot lòt.',
        quiz:{ question:'Ki pwopriyete ki aktive flexbox?', options:['display:flex','flex:row','layout:flex','box:flex'], correct:0 }, xp:25 },
      { id:4, title:'Jistifikasyon ak Aliyman', content:'justify-content ak align-items kontwole pozisyon eleman anndan yon flex container.',
        example:'.row { justify-content: space-between; }',
        exercise:'Sant yon eleman ak justify-content:center.',
        quiz:{ question:'Ki pwopriyete ki jistifye eleman orizontalman?', options:['align-items','justify-content','text-align','flex-wrap'], correct:1 }, xp:25 },
    ]},
  ]},
  javascript: { title:'JavaScript', icon:'braces', color:'var(--orange)', units:[
    { title:'Inite 1 — Varyab ak Fonksyon', lessons:[
      { id:1, title:'Varyab', content:'let ak const kreye varyab; const pa chanje valè li apre yo deklare l.',
        example:'let non = "Wilguentz";\nconst PI = 3.14;',
        exercise:'Kreye yon varyab "laj" ki gen valè 25.',
        quiz:{ question:'Ki mo kle ki kreye yon varyab ki PA chanje?', options:['let','var','const','static'], correct:2 }, xp:20 },
      { id:2, title:'Fonksyon Flèch', content:'Fonksyon flèch se yon fason kout pou ekri fonksyon.',
        example:'const add = (a, b) => a + b;\nconsole.log(add(2,3));',
        exercise:'Ekri yon fonksyon flèch ki miltipliye 2 nonm.',
        quiz:{ question:'Ki senbòl ki make yon fonksyon flèch?', options:['->','=>','::','~>'], correct:1 }, xp:20 },
    ]},
    { title:'Inite 2 — Tablo ak Objè', lessons:[
      { id:3, title:'Metòd Tablo', content:'.map(), .filter(), .forEach() pèmèt trete yon tablo san bouk manyèl.',
        example:'const nums=[1,2,3];\nconst doubled = nums.map(n => n*2);',
        exercise:'Itilize .filter() pou jwenn nonm pè yo nan yon tablo.',
        quiz:{ question:'Ki metòd ki kreye yon nouvo tablo apre transfòmasyon?', options:['.filter()','.map()','.find()','.reduce()'], correct:1 }, xp:25 },
      { id:4, title:'Objè ak Destriktirasyon', content:'Objè estoke done ak pè kle-valè; destriktirasyon ekstrè valè fasilman.',
        example:'const user = { non:"Ana", laj:22 };\nconst { non } = user;',
        exercise:'Kreye yon objè "pwodwi" ak non ak pri.',
        quiz:{ question:'Ki senbòl ki antoure yon objè literal?', options:['[]','{}','()','<>'], correct:1 }, xp:25 },
    ]},
  ]},
  python: { title:'Python', icon:'terminal', color:'var(--green)', units:[
    { title:'Inite 1 — Sentaks Baz', lessons:[
      { id:1, title:'Varyab ak Tip', content:'Python pa mande deklarasyon tip; li dedwi tip la otomatikman.',
        example:'non = "Kessy"\nlaj = 30\nprint(non, laj)',
        exercise:'Kreye yon varyab "vil" ak valè "Pòtoprens".',
        quiz:{ question:'Ki fonksyon ki afiche rezilta nan Python?', options:['echo()','print()','display()','log()'], correct:1 }, xp:20 },
      { id:2, title:'Kondisyon', content:'if/elif/else pèmèt pran desizyon selon kondisyon.',
        example:'if laj >= 18:\n    print("Majè")\nelse:\n    print("Minè")',
        exercise:'Ekri yon kondisyon ki tcheke si yon nonm pozitif.',
        quiz:{ question:'Ki mo kle ki kòmanse yon dezyèm kondisyon?', options:['else if','elseif','elif','elsif'], correct:2 }, xp:20 },
    ]},
    { title:'Inite 2 — Fonksyon ak Lis', lessons:[
      { id:3, title:'Fonksyon', content:'def defini yon fonksyon reyitilizab.',
        example:'def carre(n):\n    return n * n\nprint(carre(4))',
        exercise:'Ekri yon fonksyon ki adisyone 2 nonm.',
        quiz:{ question:'Ki mo kle ki defini yon fonksyon?', options:['func','def','function','method'], correct:1 }, xp:25 },
      { id:4, title:'Lis ak Bouk', content:'Lis estoke plizyè valè; for pèmèt bouke sou yo.',
        example:'nums = [1,2,3]\nfor n in nums:\n    print(n)',
        exercise:'Kreye yon lis vil ayisyen epi bouke sou li.',
        quiz:{ question:'Ki tip done ki itilize [] nan Python?', options:['dict','tuple','list','set'], correct:2 }, xp:25 },
    ]},
  ]},
  ai: { title:'AI', icon:'brain-circuit', color:'var(--blue)', units:[
    { title:'Inite 1 — Konsèp Fondamantal', lessons:[
      { id:1, title:'Kisa AI Ye', content:'Entèlijans Atifisyèl se sistèm enfòmatik ki imite kapasite kognitif imen tankou aprann ak rezone.',
        example:'AI = Machine Learning + Deep Learning + NLP + ...',
        exercise:'Site 2 egzanp aplikasyon AI ou itilize chak jou.',
        quiz:{ question:'Ki branch AI ki fè machin "aprann" apati done?', options:['Machine Learning','HTML','CSS','SQL'], correct:0 }, xp:20 },
      { id:2, title:'Done ak Antrènman', content:'Yon modèl AI aprann apati yon gwo kantite done pandan yon faz antrènman.',
        example:'Plis done kalite ou genyen, pi bon modèl la ka vin.',
        exercise:'Panse a yon dataset ou ta ka kolekte pou yon pwojè pèsonèl.',
        quiz:{ question:'Kisa yo rele faz kote modèl la aprann apati done?', options:['Deplwaman','Antrènman','Enferans','Validasyon'], correct:1 }, xp:20 },
    ]},
    { title:'Inite 2 — Modèl ak Pwomt', lessons:[
      { id:3, title:'LLM ak Pwomt', content:'Yon Large Language Model jenere tèks apati yon pwomt (enstriksyon) ou bay li.',
        example:'Pwomt: "Ekri yon rezime an 3 fraz sou..." → LLM jenere repons.',
        exercise:'Ekri yon pwomt klè pou mande yon rezime yon atik.',
        quiz:{ question:'Kisa ki rele antre tèks ou bay yon LLM pou jwenn yon repons?', options:['Endèks','Pwomt','Vektè','Tokèn'], correct:1 }, xp:25 },
      { id:4, title:'Etik AI', content:'Itilizasyon responsab AI mande transparans, ekitab, ak respè vi prive itilizatè yo.',
        example:'Egzanp: pa itilize AI pou kreye kontni ki twonpe moun.',
        exercise:'Site yon prensip etik ki enpòtan pou ou lè w ap itilize AI.',
        quiz:{ question:'Ki eleman ki fondamantal nan yon itilizasyon etik AI?', options:['Vitès','Transparans','Pri ba','Koulè'], correct:1 }, xp:25 },
    ]},
  ]},
  electronics: { title:'Elektwonik', icon:'cpu', color:'var(--green)', units:[
    { title:'Inite 1 — Baz Sikwi', lessons:[
      { id:1, title:'Kouran ak Tansyon', content:'Tansyon (V) se fòs ki pouse elektwon; kouran (A) se flux elektwon nan yon sikwi.',
        example:'Lwa Ohm: V = I × R',
        exercise:'Kalkile V si I=2A ak R=5Ω.',
        quiz:{ question:'Ki fòmil ki reprezante Lwa Ohm?', options:['V=I/R','V=I×R','V=R/I','V=I+R'], correct:1 }, xp:20 },
      { id:2, title:'Rezistans', content:'Yon rezistans limite kouran ki pase nan yon sikwi.',
        example:'Rezistans mezire an Ohm (Ω).',
        exercise:'Idantifye 2 kote yo itilize rezistans nan yon aparèy elektwonik.',
        quiz:{ question:'Nan ki inite yo mezire rezistans?', options:['Volt','Ampè','Ohm','Watt'], correct:2 }, xp:20 },
    ]},
    { title:'Inite 2 — Konpozan', lessons:[
      { id:3, title:'Dyòd ak LED', content:'Yon dyòd kite kouran pase yon sèl sans; LED se yon dyòd ki limen.',
        example:'LED bezwen yon rezistans an seri pou limite kouran.',
        exercise:'Deside ki rezistans ou ta bezwen pou pwoteje yon LED.',
        quiz:{ question:'Ki kalite konpozan ki kite kouran pase yon sèl direksyon?', options:['Kapasitè','Dyòd','Boben','Switch'], correct:1 }, xp:25 },
      { id:4, title:'Microcontrolè', content:'Yon microcontrolè (tankou Arduino) ka li antre ak kontwole sòti selon yon pwogram.',
        example:'digitalWrite(13, HIGH); // limen yon LED sou pin 13',
        exercise:'Panse a yon pwojè kote ou ta itilize yon Arduino.',
        quiz:{ question:'Ki egzanp microcontrolè ki popilè pou débitan?', options:['Arduino','Photoshop','MySQL','Excel'], correct:0 }, xp:25 },
    ]},
  ]},
  languages: { title:'Lang', icon:'languages', color:'var(--orange)', units:[
    { title:'Inite 1 — Baz Konvèsasyon', lessons:[
      { id:1, title:'Salitasyon', content:'Aprann fraz debaz pou salye moun nan yon lang etranje.',
        example:'Anglè: "Hello, how are you?" — Fransè: "Bonjour, comment allez-vous ?"',
        exercise:'Tradwi "Bonjou, kijan ou ye?" nan lang ou ap aprann nan.',
        quiz:{ question:'Ki fraz ki salye yon moun an anglè?', options:['Goodbye','Hello','Please','Thanks'], correct:1 }, xp:20 },
      { id:2, title:'Nonb ak Koulè', content:'Konnen nonb ak koulè debaz ede nan konvèsasyon chak jou.',
        example:'Anglè: one, two, three — red, blue, green',
        exercise:'Konte soti nan 1 rive nan 10 nan lang ou ap aprann.',
        quiz:{ question:'Kòman yo di "twa" an anglè?', options:['Two','Three','Four','Ten'], correct:1 }, xp:20 },
    ]},
    { title:'Inite 2 — Fraz Itil', lessons:[
      { id:3, title:'Nan Restoran', content:'Fraz itil pou kòmande manje oswa mande yon bagay.',
        example:'"Could I have the menu, please?"',
        exercise:'Ekri yon fraz pou kòmande yon bwason.',
        quiz:{ question:'Ki fraz ki pi apwopriye pou mande yon bagay poliman?', options:['Give me that','Could I have...please','I want now','Hurry up'], correct:1 }, xp:25 },
      { id:4, title:'Direksyon', content:'Aprann mande ak konprann direksyon nan yon vil.',
        example:'"Where is the nearest bus stop?"',
        exercise:'Ekri kòman ou ta mande kote yon otèl ye.',
        quiz:{ question:'Ki fraz ki mande yon direksyon?', options:['Where is...?','What time is it?','How much?','Who are you?'], correct:0 }, xp:25 },
    ]},
  ]},
};
const LEARNING_COURSE_KEYS = Object.keys(LEARNING_COURSES);

function lcLessonKey(courseKey, lessonId){ return courseKey + ':' + lessonId; }
function lcAllLessons(courseKey){ return LEARNING_COURSES[courseKey].units.flatMap(u => u.lessons); }
function lcLessonByKey(courseKey, id){
  for (const unit of LEARNING_COURSES[courseKey].units) for (const l of unit.lessons) if (l.id === id) return l;
  return null;
}
function courseProgress(courseKey){
  const ids = lcAllLessons(courseKey).map(l => l.id);
  const done = ids.filter(id => learning.completed.includes(lcLessonKey(courseKey, id))).length;
  return { done, total: ids.length, pct: ids.length ? Math.round((done/ids.length)*100) : 0 };
}
function activeLearningCourseKey(){
  learning.startedCourses = learning.startedCourses || [];
  return learning.startedCourses.find(k => LEARNING_COURSES[k]) || LEARNING_COURSE_KEYS[0];
}

function updateLearningStreak(){
  learning.studyDates = learning.studyDates || [];
  const t = todayISO();
  if (!learning.studyDates.includes(t)) learning.studyDates.push(t);
  const set = new Set(learning.studyDates);
  let current = 0, cursor = t;
  if (!set.has(cursor)) cursor = isoOffset(cursor,-1);
  while (set.has(cursor)){ current++; cursor = isoOffset(cursor,-1); }
  learning.streak = current;
  learning.lastStudyDate = t;
}

const LEARN_BADGE_DEFS = [
  { id:'lb-first', label:'Premye Leson', check: l => l.completed.length >= 1 },
  { id:'lb-5', label:'5 Leson', check: l => l.completed.length >= 5 },
  { id:'lb-track', label:'Kou Fini', check: () => LEARNING_COURSE_KEYS.some(k => courseProgress(k).pct === 100) },
  { id:'lb-streak7', label:'Semèn Etid', check: l => (l.streak||0) >= 7 },
];
function updateLearnBadges(){
  LEARN_BADGE_DEFS.forEach(b => { if (b.check(learning) && !learning.badges.includes(b.id)) learning.badges.push(b.id); });
}

function checkDailyHeartsReset(){
  const t = todayISO();
  if (learning.lastStudyDate !== t && learning.hearts < 5){
    learning.hearts = 5;
    persistLearning();
  }
}

// Learning UI now lives in learning.html / course.html (standalone pages,
// same oslife.learning storage key, same LEARNING_COURSES data shape). This syncs
// the Life Score "learning" category and badges/streak bookkeeping from that
// shared state whenever index.html loads or regains focus, since those pages
// can't call into index.html's bumpCategory/setCategory directly.
function syncLearningState(){
  checkDailyHeartsReset();
  updateLearnBadges();
  const totalLessons = LEARNING_COURSE_KEYS.reduce((s,k) => s + lcAllLessons(k).length, 0);
  const overallPct = totalLessons ? Math.round((learning.completed.length/totalLessons)*100) : 0;
  setCategory('learning', overallPct);
  persistLearning();
  if (typeof syncAllGoalsLearningProgress === 'function') syncAllGoalsLearningProgress();
}

// ==========================================
// ACHIEVEMENTS
// ==========================================
function savingsTotal(){
  return wallets.filter(w => w.type === 'savings').reduce((s,w) => s + walletBalance(w), 0);
}
function bestHabitStreak(){
  return habits.reduce((m,h) => Math.max(m, calcStreaks(h).current), 0);
}
function currentPerfectStreak(){
  const hist = new Set(missionsHistory);
  let n = 0, cursor = todayISO();
  while (hist.has(cursor)){ n++; cursor = isoOffset(cursor,-1); }
  return n;
}

const ACHIEVEMENT_DEFS = [
  // ---- PRODUCTIVITY ----
  { id:'p1', cat:'productivity', label:'Premye Tach', desc:'Konplete premye tach ou', icon:'check-square', color:'var(--blue)',
    progress:() => tasks.filter(t=>t.completedAt).length, target:1 },
  { id:'p2', cat:'productivity', label:'10 Tach Konplete', desc:'Konplete 10 tach', icon:'check-square', color:'var(--blue)',
    progress:() => tasks.filter(t=>t.completedAt).length, target:10 },
  { id:'p3', cat:'productivity', label:'50 Tach Konplete', desc:'Konplete 50 tach', icon:'check-square', color:'var(--blue)',
    progress:() => tasks.filter(t=>t.completedAt).length, target:50 },
  { id:'p4', cat:'productivity', label:'100 Tach Konplete', desc:'Konplete 100 tach', icon:'check-square', color:'var(--blue)',
    progress:() => tasks.filter(t=>t.completedAt).length, target:100 },

  // ---- LEARNING ----
  { id:'l1', cat:'learning', label:'Premye Leson', desc:'Fini premye leson ou', icon:'graduation-cap', color:'var(--orange)',
    progress:() => learning.completed.length, target:1 },
  { id:'l2', cat:'learning', label:'5 Leson', desc:'Fini 5 leson', icon:'graduation-cap', color:'var(--orange)',
    progress:() => learning.completed.length, target:5 },
  { id:'l3', cat:'learning', label:'Premye Kou Fini', desc:'Konplete yon kou antye', icon:'trophy', color:'var(--orange)',
    progress:() => LEARNING_COURSE_KEYS.some(k => courseProgress(k).pct === 100) ? 1 : 0, target:1 },
  { id:'l4', cat:'learning', label:'Semèn Etid', desc:'Etidye 7 jou youn apre lòt', icon:'flame', color:'var(--orange)',
    progress:() => learning.streak||0, target:7 },

  // ---- FINANCE ----
  { id:'f1', cat:'finance', label:'Kòmanse Epay', desc:'Kòmanse mete lajan sou kote nan yon kont epay', icon:'piggy-bank', color:'var(--green)',
    progress:() => savingsTotal(), target:1 },
  { id:'f2', cat:'finance', label:'Epay 10,000 HTG', desc:'Rive jwenn 10,000 HTG nan epay', icon:'piggy-bank', color:'var(--green)',
    progress:() => savingsTotal(), target:10000 },
  { id:'f3', cat:'finance', label:'Epay 50,000 HTG', desc:'Rive jwenn 50,000 HTG nan epay', icon:'piggy-bank', color:'var(--green)',
    progress:() => savingsTotal(), target:50000 },

  // ---- HABITS ----
  { id:'h1', cat:'habits', label:'3 Jou', desc:'Fè yon abitid 3 jou youn apre lòt', icon:'flame', color:'var(--green)',
    progress:() => bestHabitStreak(), target:3 },
  { id:'h2', cat:'habits', label:'Semèn Solid', desc:'Fè yon abitid 7 jou youn apre lòt', icon:'flame', color:'var(--green)',
    progress:() => bestHabitStreak(), target:7 },
  { id:'h3', cat:'habits', label:'30-Jou Streak', desc:'Fè yon abitid 30 jou youn apre lòt', icon:'flame', color:'var(--green)',
    progress:() => bestHabitStreak(), target:30 },

  // ---- CONSISTENCY ----
  { id:'c1', cat:'consistency', label:'Premye Misyon', desc:'Reklame premye misyon jodi a ou', icon:'star', color:'var(--blue)',
    progress:() => gami.missionsClaimedTotal||0, target:1 },
  { id:'c2', cat:'consistency', label:'Semèn Pafè', desc:'Konplete tout misyon jodi a 7 jou youn apre lòt', icon:'calendar-check', color:'var(--blue)',
    progress:() => currentPerfectStreak(), target:7 },
  { id:'c3', cat:'consistency', label:'De Semèn Pafè', desc:'Konplete tout misyon jodi a 14 jou youn apre lòt', icon:'calendar-check', color:'var(--blue)',
    progress:() => currentPerfectStreak(), target:14 },
];

// Pati 49/50: koneksyon final Goal <-> Achievement. GOAL_ACHIEVEMENT_DEFS (Pati 45/50)
// te deja egziste ak menm fòma a (id/cat/label/desc/icon/color/progress()/target) + yon
// chan siplemantè `relatedGoal()` ki ignore san danje pa checkAchievements()/
// renderAchievementsView() (yo sèvi ak sèlman chan estanda yo). Nou SÈLMAN konbine 2 lis
// yo — pa gen okenn lòt chanjman nan ACHIEVEMENT_DEFS oswa GOAL_ACHIEVEMENT_DEFS.
const ALL_ACHIEVEMENT_DEFS = ACHIEVEMENT_DEFS.concat(GOAL_ACHIEVEMENT_DEFS);

const ACH_CATEGORY_LABELS = {
  productivity: { label:'Pwodiktivite', icon:'check-square' },
  learning: { label:'Aprantisaj', icon:'graduation-cap' },
  finance: { label:'Finans', icon:'wallet' },
  habits: { label:'Abitid', icon:'flame' },
  consistency: { label:'Konsistans', icon:'calendar-check' },
  // Pati 49/50: kategori 'goals' pou GOAL_ACHIEVEMENT_DEFS (Pati 45/50), ki te deja
  // pare men ki pa t janm wire nan checkAchievements()/renderAchievementsView().
  goals: { label:'Objektif', icon:'target' },
};

function checkAchievements(){
  const newlyUnlocked = [];
  ALL_ACHIEVEMENT_DEFS.forEach(a => {
    if (unlockedAchievements.includes(a.id)) return;
    if (a.progress() >= a.target){
      unlockedAchievements.push(a.id);
      newlyUnlocked.push(a);
    }
  });
  if (newlyUnlocked.length){
    persistAchievements();
    newlyUnlocked.forEach(a => {
      showToast(`🏆 Achievement debloke: ${a.label}`);
      renderActivity([{ icon:'award', color:'var(--orange)', text:`Ou debloke achievement <b>"${escapeHtml(a.label)}"</b>`, time:'kounye a' }]);
    });
  }
  const achView = document.getElementById('view-achievements');
  if (achView && !achView.hidden) renderAchievementsView();
}

function renderAchievementsView(){
  const wrap = document.getElementById('achievementsWrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  document.getElementById('achCountLbl').textContent = `${unlockedAchievements.length}/${ALL_ACHIEVEMENT_DEFS.length} debloke`;
  Object.keys(ACH_CATEGORY_LABELS).forEach(catKey => {
    const defs = ALL_ACHIEVEMENT_DEFS.filter(a => a.cat === catKey);
    if (!defs.length) return;
    const catInfo = ACH_CATEGORY_LABELS[catKey];
    const unlockedInCat = defs.filter(a => unlockedAchievements.includes(a.id)).length;
    const title = document.createElement('div');
    title.className = 'ach-section-title';
    title.innerHTML = `<i data-lucide="${catInfo.icon}" style="width:15px;height:15px;"></i> ${catInfo.label} <span class="count">${unlockedInCat}/${defs.length}</span>`;
    wrap.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'ach-grid';
    defs.forEach(a => {
      const unlocked = unlockedAchievements.includes(a.id);
      const progress = Math.min(a.progress(), a.target);
      const card = document.createElement('div');
      card.className = 'card ach-card ' + (unlocked ? 'unlocked' : 'locked');
      card.innerHTML = `
        ${unlocked ? '' : `<span class="ach-lock"><i data-lucide="lock"></i></span>`}
        <div class="ach-ic" style="background:color-mix(in srgb, ${a.color} 16%, transparent); color:${a.color}"><i data-lucide="${a.icon}"></i></div>
        <b>${escapeHtml(a.label)}</b>
        <span class="desc">${escapeHtml(a.desc)}</span>
        ${unlocked
          ? `<span class="badge-chip" style="align-self:flex-start;"><i data-lucide="award" style="width:10px;height:10px"></i> Debloke</span>`
          : `<div class="mini-progress"><span style="width:${Math.round(progress/a.target*100)}%;background:${a.color}"></span></div><span class="ach-progress-lbl">${progress}/${a.target}</span>`
        }
      `;
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  });
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// PATI 49/50 — REVIZYON FINAL SENKWONIZASYON OBJEKTIF (GOAL)
// De fonksyon apa, tou de san danje pou done REYÈL itilizatè a:
// 1) auditAndRepairGoalConnections() — chèche referans KASE (dangling) nan
//    TOUT koneksyon Goal yo (Habits, Wallets, Calendar, Learning, Projects,
//    Aksyon Finansye annatant, Depandans) sou done REYÈL la, e repare SÈLMAN
//    referans kase yo — okenn valè valid pa touche.
// 2) runGoalSyncScenarioTests() — rejwe egzakteman 3 senaryo egzanp Pati 49 a
//    (Abitid Sere → Pwogrè Objektif → Aksyon Finansye ; Leson → Pwogrè
//    Aprantisaj → Pwogrè Objektif ; Objektif Konplete → Estati Pwojè →
//    Achievement) sou done SANDBOX tanporè. `goals`/`habits`/`wallets`/`tx`/
//    `projects`/`events`/`learning`/`pendingGoalFinancialActions` ak fonksyon
//    `saveLS`/`secureSave`/`lifeEngineRefresh` yo TOUJOU restore egzakteman
//    jan yo te ye a nan yon blòk `finally` — menm si yon tès leve yon erè,
//    okenn done pèsonèl pa janm modifye ni sove sou disk pandan tès la.
// ==========================================
function auditAndRepairGoalConnections(){
  const fixes = [];

  // 1) Habit <-> Goal — reyitilize netwayaj ki deja egziste (Pati 5/50)
  if (typeof pruneBrokenGoalHabitLinks === 'function' && pruneBrokenGoalHabitLinks()){
    fixes.push('Lyen Abitid ↔ Objektif kase yo netwaye.');
  }

  const goalIds = new Set(goals.map(g => g.id));

  // 2) Project -> Goal : retire referans si Objektif la pa egziste ankò (kenbe Pwojè a antye)
  let projectsChanged = false;
  projects.forEach(p => {
    if (p.goalId && !goalIds.has(p.goalId)){ p.goalId = null; projectsChanged = true; }
  });
  if (projectsChanged){ persistProjects(); fixes.push('Referans Pwojè ↔ Objektif kase yo retire.'); }

  // 3) Calendar -> Goal : retire Evènman òfelen (Objektif ki lakòz yo pa egziste ankò)
  const beforeEvents = events.length;
  events = events.filter(e => !e.goalId || goalIds.has(e.goalId));
  if (events.length !== beforeEvents){ persistEvents(); fixes.push(`${beforeEvents - events.length} Evènman Kalandriye òfelen retire.`); }

  // 4) Chan Objektif yo menm : Kou Aprantisaj envalid, Wallet ki pa egziste, Depandans kase
  const walletIds = new Set(wallets.map(w => w.id));
  let goalsChanged = false;
  goals.forEach(g => {
    if (Array.isArray(g.linkedLearningCourses)){
      const cleaned = g.linkedLearningCourses.filter(k => LEARNING_COURSES[k]);
      if (cleaned.length !== g.linkedLearningCourses.length){ g.linkedLearningCourses = cleaned; goalsChanged = true; }
    }
    if (g.walletId && !walletIds.has(g.walletId)){ g.walletId = null; goalsChanged = true; }
    if (Array.isArray(g.dependsOn)){
      const cleanedDeps = g.dependsOn.filter(id => goalIds.has(id) && id !== g.id);
      if (cleanedDeps.length !== g.dependsOn.length){ g.dependsOn = cleanedDeps; goalsChanged = true; }
    }
  });
  if (goalsChanged){ persistGoals(); fixes.push('Chan Objektif envalid (Kou Aprantisaj, Wallet, oswa Depandans) netwaye.'); }

  // 5) Aksyon Finansye annatant/pare ki pwente sou Objektif/Abitid/Wallet ki pa egziste ankò
  const habitIds = new Set(habits.map(h => h.id));
  let actionsChanged = false;
  pendingGoalFinancialActions.forEach(a => {
    if ((a.status === 'pending' || a.status === 'ready') &&
        (!goalIds.has(a.goalId) || !habitIds.has(a.habitId) || !walletIds.has(a.walletId))){
      a.status = 'failed'; a.failedAt = new Date().toISOString(); a.failReason = 'orphaned-reference';
      actionsChanged = true;
    }
  });
  if (actionsChanged){ persistPendingGoalFinancialActions(); fixes.push('Aksyon Finansye annatant ki pwente sou done efase make anile.'); }

  return { fixCount: fixes.length, fixes };
}

function runGoalSyncScenarioTests(){
  // Snapshot done REYÈL yo ak fonksyon efè-bò-kote yo, pou nou ka restore yo
  // egzakteman apre, kèlkeswa sa k pase pandan senaryo yo.
  const realGoals = goals, realHabits = habits, realWallets = wallets, realTx = tx,
        realProjects = projects, realEvents = events, realLearning = learning,
        realPendingActions = pendingGoalFinancialActions;
  const realSaveLS = saveLS, realSecureSave = secureSave, realLifeEngineRefresh = lifeEngineRefresh;

  // Izole tout efè bò kote pandan tès la: pa gen ekriti disk, pa gen
  // rafrechisman lajè (Achievements/Mission/Notifikasyon/etc.) ki deklanche
  // pandan senaryo sandbox yo ap jwe.
  saveLS = function(){ return true; };
  secureSave = async function(){ return true; };
  lifeEngineRefresh = function(){};

  const results = [];
  try {
    // ---- SENARYO 1 : Abitid Sere konplete → Pwogrè Objektif ajou → Aksyon Finansye kreye ----
    (function scenario1(){
      const steps = [];
      const walletId = 'test-wallet-1', goalId = 'test-goal-1', habitId = 'test-habit-1';
      wallets = [{ id: walletId, name:'Test Wallet', type:'cash', currency:'HTG', balance:5000 }];
      tx = [];
      const g = {
        id: goalId, title:'Test — Objektif Sere', type:'personal', category:'personal', priority:'medium',
        status:'in-progress', autoStatus:true, progress:0, milestones:[],
        links:{habitIds:[],financeIds:[],calendarIds:[],learningIds:[],projectIds:[]},
        linkedHabitIds:[habitId], linkedLearningCourses:[], dependsOn:[], dependencyCompletedSnapshot:{},
        isFinancial:true, estimatedValue:1000, currentSavings:0, walletId:null, notes:'',
        habitContributions:{ [habitId]: { amount:100, unit:'HTG', walletId, processedDates:[] } },
        createdAt:new Date().toISOString(), habitProgressHistory:[]
      };
      goals = [g];
      habits = [{ id: habitId, name:'Test Abitid Sere', goalId, completions:[todayISO()], frequency:'daily' }];

      steps.push({ label:'Kondisyon inisyal (0% pwogrè, 0 sere)', pass: goalMilestoneProgress(g) === 0 });

      if (typeof recordGoalHabitProgressHistory === 'function') recordGoalHabitProgressHistory(goalId, habitId, 'habit-completed');
      if (typeof refreshGoalHabitContributionTotals === 'function') refreshGoalHabitContributionTotals(goalId);
      const cfg = g.habitContributions[habitId];
      if (typeof recordGoalFinancialContributionHistory === 'function') recordGoalFinancialContributionHistory(goalId, habitId, Number(cfg.amount), cfg.unit);
      const action = typeof createPendingGoalFinancialAction === 'function' ? createPendingGoalFinancialAction(goalId, habitId, cfg.walletId, Number(cfg.amount)) : null;
      let txCreated = null;
      if (action && typeof validateGoalFinancialAction === 'function' && validateGoalFinancialAction(action)){
        txCreated = typeof executeGoalFinancialAction === 'function' ? executeGoalFinancialAction(action) : null;
      }

      steps.push({ label:'Sere Deja Objektif ajou (100 HTG)', pass: g.currentSavings === 100 });
      steps.push({ label:'Pwogrè Objektif reflete Sere a (10%)', pass: goalMilestoneProgress(g) === 10 });
      steps.push({ label:'Tranzaksyon Finance kreye e lye ak Objektif la', pass: !!txCreated && tx.length === 1 && tx[0].goalId === goalId });

      results.push({ key:'scenario1', title:'Abitid Sere → Pwogrè Objektif → Aksyon Finansye', steps, pass: steps.every(s => s.pass) });
    })();

    // ---- SENARYO 2 : Leson Aprantisaj konplete → Pwogrè Aprantisaj ajou → Pwogrè Objektif ajou ----
    (function scenario2(){
      const steps = [];
      const goalId = 'test-goal-2';
      const courseKey = Object.keys(LEARNING_COURSES)[0];
      const g = {
        id: goalId, title:'Test — Objektif Aprantisaj', type:'personal', category:'personal', priority:'medium',
        status:'in-progress', autoStatus:true, progress:0, milestones:[],
        links:{habitIds:[],financeIds:[],calendarIds:[],learningIds:[],projectIds:[]},
        linkedHabitIds:[], linkedLearningCourses:[courseKey], dependsOn:[], dependencyCompletedSnapshot:{},
        isFinancial:false, estimatedValue:null, currentSavings:null, walletId:null, notes:'',
        createdAt:new Date().toISOString(), habitProgressHistory:[]
      };
      goals = [g];
      const allKeys = (typeof lcAllLessons === 'function' ? lcAllLessons(courseKey) : []).map(l => lcLessonKey(courseKey, l.id));
      learning = Object.assign({}, realLearning, { completed: allKeys });

      steps.push({ label:'Kondisyon inisyal (0% pwogrè)', pass: goalMilestoneProgress(g) === 0 });

      if (typeof syncAllGoalsLearningProgress === 'function') syncAllGoalsLearningProgress();

      steps.push({ label:'Pwogrè Aprantisaj kalkile (100%)', pass: computeGoalLearningProgress(goalId) === 100 });
      steps.push({ label:'Pwogrè Objektif ajou otomatikman e make Konplete', pass: goalMilestoneProgress(g) === 100 && g.status === 'completed' });

      results.push({ key:'scenario2', title:'Leson Konplete → Pwogrè Aprantisaj → Pwogrè Objektif', steps, pass: steps.every(s => s.pass) });
    })();

    // ---- SENARYO 3 : Objektif konplete → Estati Pwojè ajou → Achievement pare pou deblokaj ----
    (function scenario3(){
      const steps = [];
      const goalId = 'test-goal-3', projectId = 'test-project-3';
      const g = {
        id: goalId, title:'Test — Objektif Pwojè', type:'personal', category:'personal', priority:'medium',
        status:'in-progress', autoStatus:false, progress:0,
        milestones:[{ id:'m1', text:'Etap 1', done:false, contribution:null }],
        links:{habitIds:[],financeIds:[],calendarIds:[],learningIds:[],projectIds:[]},
        linkedHabitIds:[], linkedLearningCourses:[], dependsOn:[], dependencyCompletedSnapshot:{},
        isFinancial:false, estimatedValue:null, currentSavings:null, walletId:null, notes:'',
        createdAt:new Date().toISOString(), habitProgressHistory:[]
      };
      goals = [g];
      const p = { id: projectId, name:'Test Pwojè', status:'idea', goalId };
      projects = [p];

      steps.push({ label:'Kondisyon inisyal (Pwojè "idea")', pass: p.status === 'idea' });

      g.milestones[0].done = true;
      steps.push({ label:'Objektif rive 100% (Etap konplete)', pass: goalMilestoneProgress(g) === 100 });

      g.status = 'completed';
      const projectChanged = typeof syncProjectStatusFromGoal === 'function' ? syncProjectStatusFromGoal(p) : false;
      steps.push({ label:'Estati Pwojè ajou otomatikman (completed)', pass: projectChanged && p.status === 'completed' });

      const achData = typeof buildGoalAchievementData === 'function' ? buildGoalAchievementData() : [];
      const projectAch = achData.find(a => a.id === 'ga6');
      steps.push({ label:'Achievement "Objektif + Pwojè" pare pou deblokaj', pass: !!projectAch && projectAch.progress >= 1 });

      results.push({ key:'scenario3', title:'Objektif Konplete → Estati Pwojè → Achievement', steps, pass: steps.every(s => s.pass) });
    })();

    // ---- SENARYO 4 : Egzanp konplè Pati 50/50 — "Vin Devlopè Web" ----
    // Aprantisaj konplete → Abitid Etid lye → Kalandriye ajou → Estatistik
    // anrejistre → Achievement pare → Coach AI resevwa kontèks ajou.
    // Sa a se sèl senaryo ki verifye wiring `buildAiContext()` →
    // `buildGoalAIContext()` (Pati 50/50) — okenn lòt senaryo pa teste sa.
    (function scenario4(){
      const steps = [];
      const goalId = 'test-goal-4', habitId = 'test-habit-4';
      const courseKey = Object.keys(LEARNING_COURSES)[0];
      const futureDeadline = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0,10); })();
      const g = {
        id: goalId, title:'Vin Devlopè Web', type:'personal', category:'personal', priority:'high',
        status:'in-progress', autoStatus:true, progress:0, milestones:[], deadline: futureDeadline,
        links:{habitIds:[],financeIds:[],calendarIds:[],learningIds:[],projectIds:[]},
        linkedHabitIds:[habitId], linkedLearningCourses:[courseKey], dependsOn:[], dependencyCompletedSnapshot:{},
        isFinancial:false, estimatedValue:null, currentSavings:null, walletId:null, notes:'',
        createdAt:new Date().toISOString(), habitProgressHistory:[]
      };
      goals = [g];
      habits = [{ id: habitId, name:'Orè Etid Validé', goalId, completions:[todayISO()], frequency:'daily' }];
      projects = [];
      events = [];
      const allKeys = (typeof lcAllLessons === 'function' ? lcAllLessons(courseKey) : []).map(l => lcLessonKey(courseKey, l.id));
      learning = Object.assign({}, realLearning, { completed: [] });

      steps.push({ label:'Kondisyon inisyal (0% pwogrè, pa gen evènman kalandriye)', pass: goalMilestoneProgress(g) === 0 && events.length === 0 });

      // ---- Kalandriye : kreye evènman Dat Limit ----
      if (typeof syncGoalCalendarEvents === 'function') syncGoalCalendarEvents(goalId);
      steps.push({ label:'Kalandriye kreye evènman Dat Limit lye ak Objektif la', pass: events.some(e => e.goalId === goalId && e.goalEventType === 'deadline') });

      // ---- Aprantisaj : konplete tout leson Kou a ----
      learning = Object.assign({}, learning, { completed: allKeys });
      if (typeof syncAllGoalsLearningProgress === 'function') syncAllGoalsLearningProgress();
      steps.push({ label:'Pwogrè Aprantisaj kalkile (100%) e Objektif otomatikman Konplete', pass: computeGoalLearningProgress(goalId) === 100 && g.status === 'completed' });

      // ---- Abitid : Orè Etid rete lye ak Objektif la ----
      steps.push({ label:'Abitid Etid rete lye ak Objektif la', pass: getHabitsForGoal(goalId).some(h => h.id === habitId) });

      // ---- Estatistik : pwogrè anrejistre pou Objektif la ----
      const stats = typeof buildGoalStatisticsFor === 'function' ? buildGoalStatisticsFor(goalId) : null;
      steps.push({ label:'Estatistik anrejistre pwogrè Objektif la (100%, konplete)', pass: !!stats && stats.progressPct === 100 && stats.status === 'completed' });

      // ---- Achievement : pare pou deblokaj (Abitid lye + Aprantisaj konplete) ----
      const achData = typeof buildGoalAchievementData === 'function' ? buildGoalAchievementData() : [];
      const habitAch = achData.find(a => a.id === 'ga2');
      const learningAch = achData.find(a => a.id === 'ga5');
      steps.push({ label:'Achievement "Abitid Lye" + "Aprantisaj Konplete" pare pou deblokaj', pass: !!habitAch && habitAch.progress >= 1 && !!learningAch && learningAch.progress >= 1 });

      // ---- Coach AI : resevwa kontèks konplè Objektif la (Pati 50/50) ----
      const aiCtx = typeof buildAiContext === 'function' ? buildAiContext() : null;
      const goalCtx = aiCtx ? aiCtx.goals.find(x => x.id === goalId) : null;
      steps.push({
        label:'Coach AI resevwa kontèks konplè Objektif la (Abitid, Aprantisaj, pwochen aksyon)',
        pass: !!goalCtx && Array.isArray(goalCtx.connectedHabits) && goalCtx.connectedHabits.some(h => h.id === habitId)
          && !!goalCtx.learning && goalCtx.learning.overallProgressPct === 100
      });

      results.push({ key:'scenario4', title:'Aprantisaj → Abitid → Kalandriye → Estatistik → Achievement → Coach AI', steps, pass: steps.every(s => s.pass) });
    })();
  } catch(e) {
    results.push({ key:'error', title:'Erè pandan tès la', steps:[{ label:String((e && e.message) || e), pass:false }], pass:false });
  } finally {
    // Restore ABSOLIMAN tout eta a jan l te ye a AVAN tès la, kèlkeswa rezilta a.
    goals = realGoals; habits = realHabits; wallets = realWallets; tx = realTx;
    projects = realProjects; events = realEvents; learning = realLearning;
    pendingGoalFinancialActions = realPendingActions;
    saveLS = realSaveLS; secureSave = realSecureSave; lifeEngineRefresh = realLifeEngineRefresh;
    // Yon sèl rafrechisman REYÈL (ak done reyèl yo restore) pou asire enèfas
    // la pa gen okenn ranyon vizyèl tanporè ki soti nan sandbox tès la.
    lifeEngineRefresh();
  }
  return results;
}

// ---- Rapò tèks lizib ki konbine odit + tès senaryo yo (itilize pa bouton "Verifye Sinkwonizasyon" nan Paramèt) ----
function buildGoalSyncReviewReport(){
  const audit = auditAndRepairGoalConnections();
  const scenarios = runGoalSyncScenarioTests();
  const lines = [];
  lines.push('═══ ODIT KONEKSYON OBJEKTIF (done reyèl) ═══');
  lines.push(audit.fixCount ? audit.fixes.map(f => '✓ ' + f).join('\n') : '✓ Pa gen referans kase jwenn — tout koneksyon anfòm.');
  lines.push('');
  lines.push(`═══ TÈS ${scenarios.length} SENARYO EGZANP (sandbox — done reyèl pa touche) ═══`);
  scenarios.forEach(sc => {
    lines.push(`${sc.pass ? '✅' : '❌'} Senaryo: ${sc.title}`);
    sc.steps.forEach(s => lines.push(`   ${s.pass ? '✓' : '✗'} ${s.label}`));
  });
  const allPass = scenarios.every(sc => sc.pass);
  lines.push('');
  lines.push(allPass
    ? `🎉 Tout ${scenarios.length} senaryo yo pase — sinkwonizasyon Objektif ap fonksyone kòrèkteman.`
    : '⚠️ Gen omwen yon senaryo ki echwe — verifye detay anwo a.');
  return lines.join('\n');
}

document.getElementById('runGoalSyncReviewBtn')?.addEventListener('click', () => {
  const box = document.getElementById('goalSyncReviewResult');
  if (!box) return;
  box.hidden = false;
  box.textContent = 'Ap verifye...';
  setTimeout(() => {
    try {
      box.textContent = buildGoalSyncReviewReport();
      showToast('Verifikasyon Sinkwonizasyon Objektif fini ✓');
    } catch(e){
      box.textContent = 'Erè pandan verifikasyon an: ' + ((e && e.message) || e);
    }
  }, 30);
});

// ==========================================
// SECURITY & OFFLINE SYSTEM — App Lock, Auto-Lock, Recovery, Backup
// ==========================================
let security = loadLS(LS.security, {
  enabled:false, mode:'pin', hash:null, salt:null, autoLockMinutes:5,
  securityQuestion:'', securityAnswerHash:null, securityAnswerSalt:null,
  recoveryCodeHash:null, recoveryCodeSalt:null, createdAt:null,
});
function persistSecurity(){ saveLS(LS.security, security); }

// ---- Kripto lokal (Web Crypto API) — SHA-256 salte, san okenn done kite aparèy la ----
async function sha256Hex(text){
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function randomSalt(len=16){
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function hashWithSalt(text, salt){ return sha256Hex(salt + ':' + text); }
function generateRecoveryCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({length:4}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  return `${seg()}-${seg()}-${seg()}`;
}
async function verifySecurityCode(code){
  if (!security.hash || !security.salt) return false;
  return (await hashWithSalt(code, security.salt)) === security.hash;
}

// ---- Paj Paramèt: rezime estati sekirite a ----
function renderSettingsView(){
  const icon = document.getElementById('securityStatusIcon');
  const title = document.getElementById('securityStatusTitle');
  const sub = document.getElementById('securityStatusSub');
  const toggleBtn = document.getElementById('securityToggleBtn');
  const optionsCard = document.getElementById('securityOptionsCard');
  if (security.enabled){
    icon.style.background = 'color-mix(in srgb, var(--green) 16%, transparent)';
    icon.style.color = 'var(--green)';
    icon.innerHTML = '<i data-lucide="shield-check"></i>';
    title.textContent = 'Lock Aktive';
    sub.textContent = `Pwoteje ak ${security.mode === 'pin' ? 'kòd PIN' : 'modpas'} · Auto-lock apre ${security.autoLockMinutes} min`;
    toggleBtn.style.display = 'none';
    optionsCard.hidden = false;
    const std = [1,5,15,30].includes(security.autoLockMinutes);
    document.getElementById('autoLockSelect').value = std ? String(security.autoLockMinutes) : 'custom';
    document.getElementById('customAutoLockRow').hidden = std;
    document.getElementById('customAutoLockInput').value = security.autoLockMinutes;
  } else {
    icon.style.background = 'color-mix(in srgb, var(--text-faint) 16%, transparent)';
    icon.style.color = 'var(--text-faint)';
    icon.innerHTML = '<i data-lucide="shield"></i>';
    title.textContent = 'Lock Dezaktive';
    sub.textContent = 'Aplikasyon ou pa pwoteje pou kounye a.';
    toggleBtn.style.display = '';
    optionsCard.hidden = true;
  }
  if (window.lucide) lucide.createIcons();
}

// ---- Modal: Aktive Aplikasyon Lock ----
let securitySetupMode = 'pin';
document.querySelectorAll('#securityModeToggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    securitySetupMode = btn.dataset.mode;
    document.querySelectorAll('#securityModeToggle button').forEach(b => b.classList.toggle('active', b === btn));
    const isPin = securitySetupMode === 'pin';
    document.getElementById('securityCodeInput1').placeholder = isPin ? '••••' : 'Antre modpas';
    document.getElementById('securityCodeInput2').placeholder = isPin ? '••••' : 'Konfime modpas';
    document.getElementById('securityCodeInput1').maxLength = isPin ? 4 : 40;
    document.getElementById('securityCodeInput2').maxLength = isPin ? 4 : 40;
  });
});
function openSecuritySetupModal(){
  securitySetupMode = 'pin';
  document.querySelectorAll('#securityModeToggle button').forEach(b => b.classList.toggle('active', b.dataset.mode === 'pin'));
  document.getElementById('securityCodeInput1').value = '';
  document.getElementById('securityCodeInput2').value = '';
  document.getElementById('securityCodeInput1').maxLength = 4;
  document.getElementById('securityCodeInput2').maxLength = 4;
  document.getElementById('securityCodeInput1').placeholder = '••••';
  document.getElementById('securityCodeInput2').placeholder = '••••';
  document.getElementById('securityQuestionInput').value = '';
  document.getElementById('securityAnswerInput').value = '';
  document.getElementById('securitySetupError').textContent = '';
  document.getElementById('securitySetupModalOverlay').classList.add('open');
}
document.getElementById('securityToggleBtn').addEventListener('click', openSecuritySetupModal);
document.getElementById('closeSecuritySetupModal').addEventListener('click', () => document.getElementById('securitySetupModalOverlay').classList.remove('open'));
document.getElementById('cancelSecuritySetup').addEventListener('click', () => document.getElementById('securitySetupModalOverlay').classList.remove('open'));

document.getElementById('confirmSecuritySetup').addEventListener('click', async () => {
  const c1 = document.getElementById('securityCodeInput1').value;
  const c2 = document.getElementById('securityCodeInput2').value;
  const q = document.getElementById('securityQuestionInput').value.trim();
  const a = document.getElementById('securityAnswerInput').value.trim();
  const errEl = document.getElementById('securitySetupError');
  if (securitySetupMode === 'pin' && !/^\d{4}$/.test(c1)){ errEl.textContent = 'Kòd PIN la dwe gen egzakteman 4 chif.'; return; }
  if (securitySetupMode === 'password' && c1.length < 4){ errEl.textContent = 'Modpas la dwe gen omwen 4 karaktè.'; return; }
  if (c1 !== c2){ errEl.textContent = 'Kòd yo pa menm.'; return; }
  if (!q || !a){ errEl.textContent = 'Tanpri antre yon kesyon sekirite ak yon repons.'; return; }

  const salt = randomSalt();
  const hash = await hashWithSalt(c1, salt);
  const ansSalt = randomSalt();
  const ansHash = await hashWithSalt(a.toLowerCase(), ansSalt);
  const recoveryCode = generateRecoveryCode();
  const recSalt = randomSalt();
  const recHash = await hashWithSalt(recoveryCode, recSalt);

  security = {
    enabled: true, mode: securitySetupMode, salt, hash,
    autoLockMinutes: security.autoLockMinutes || 5,
    securityQuestion: q, securityAnswerHash: ansHash, securityAnswerSalt: ansSalt,
    recoveryCodeHash: recHash, recoveryCodeSalt: recSalt,
    createdAt: new Date().toISOString(),
  };
  persistSecurity();
  document.getElementById('securitySetupModalOverlay').classList.remove('open');
  document.getElementById('recoveryCodeDisplay').textContent = recoveryCode;
  document.getElementById('recoveryCodeModalOverlay').classList.add('open');
  renderSettingsView();
  showToast('Aplikasyon Lock aktive ✓');
});
document.getElementById('confirmRecoveryCodeSaved').addEventListener('click', () => {
  document.getElementById('recoveryCodeModalOverlay').classList.remove('open');
});
document.getElementById('copyRecoveryCodeBtn').addEventListener('click', () => {
  const code = document.getElementById('recoveryCodeDisplay').textContent;
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(() => showToast('Kòd la kopye ✓')).catch(() => {});
});

// ---- Modal: Chanje Kòd / Dezaktive Lock ----
document.getElementById('changeSecurityCodeBtn').addEventListener('click', () => {
  document.getElementById('securityCurrentCodeInput').value = '';
  document.getElementById('securityNewCodeInput1').value = '';
  document.getElementById('securityNewCodeInput2').value = '';
  document.getElementById('securityChangeError').textContent = '';
  document.getElementById('securityChangeTitle').textContent = 'Chanje Kòd';
  document.getElementById('securityChangeNewFields').style.display = '';
  document.getElementById('confirmSecurityChange').dataset.action = 'change';
  document.getElementById('securityChangeModalOverlay').classList.add('open');
});
document.getElementById('disableSecurityBtn').addEventListener('click', () => {
  document.getElementById('securityCurrentCodeInput').value = '';
  document.getElementById('securityChangeError').textContent = '';
  document.getElementById('securityChangeTitle').textContent = 'Dezaktive Lock';
  document.getElementById('securityChangeNewFields').style.display = 'none';
  document.getElementById('confirmSecurityChange').dataset.action = 'disable';
  document.getElementById('securityChangeModalOverlay').classList.add('open');
});
document.getElementById('closeSecurityChangeModal').addEventListener('click', () => document.getElementById('securityChangeModalOverlay').classList.remove('open'));
document.getElementById('cancelSecurityChange').addEventListener('click', () => document.getElementById('securityChangeModalOverlay').classList.remove('open'));
document.getElementById('confirmSecurityChange').addEventListener('click', async function(){
  const current = document.getElementById('securityCurrentCodeInput').value;
  const errEl = document.getElementById('securityChangeError');
  const ok = await verifySecurityCode(current);
  if (!ok){ errEl.textContent = 'Kòd aktyèl la pa kòrèk.'; return; }
  const action = this.dataset.action;
  if (action === 'disable'){
    security.enabled = false;
    security.hash = null;
    security.salt = null;
    persistSecurity();
    document.getElementById('securityChangeModalOverlay').classList.remove('open');
    renderSettingsView();
    showToast('Aplikasyon Lock dezaktive');
    return;
  }
  const n1 = document.getElementById('securityNewCodeInput1').value;
  const n2 = document.getElementById('securityNewCodeInput2').value;
  if (security.mode === 'pin' && !/^\d{4}$/.test(n1)){ errEl.textContent = 'Kòd PIN la dwe gen egzakteman 4 chif.'; return; }
  if (security.mode === 'password' && n1.length < 4){ errEl.textContent = 'Modpas la dwe gen omwen 4 karaktè.'; return; }
  if (n1 !== n2){ errEl.textContent = 'Nouvo kòd yo pa menm.'; return; }
  const salt = randomSalt();
  security.salt = salt;
  security.hash = await hashWithSalt(n1, salt);
  persistSecurity();
  document.getElementById('securityChangeModalOverlay').classList.remove('open');
  showToast('Kòd chanje ak siksè ✓');
});

// ---- Auto-Lock: chwa timeout nan Paramèt ----
document.getElementById('autoLockSelect').addEventListener('change', e => {
  const val = e.target.value;
  document.getElementById('customAutoLockRow').hidden = val !== 'custom';
  if (val !== 'custom'){
    security.autoLockMinutes = parseInt(val,10);
    persistSecurity();
    renderSettingsView();
  }
});
document.getElementById('customAutoLockInput').addEventListener('change', e => {
  const v = Math.max(1, Math.min(240, parseInt(e.target.value,10) || 5));
  security.autoLockMinutes = v;
  e.target.value = v;
  persistSecurity();
});

// ---- Lock Screen: kavye PIN, chan modpas, ak flux rekiperasyon ----
let lockBuffer = '';
function buildLockKeypad(){
  const kp = document.getElementById('lockKeypad');
  kp.innerHTML = '';
  ['1','2','3','4','5','6','7','8','9','','0','back'].forEach(k => {
    const btn = document.createElement('button');
    btn.type = 'button';
    if (k === ''){ btn.className = 'lock-key ghost'; btn.disabled = true; }
    else if (k === 'back'){ btn.className = 'lock-key'; btn.innerHTML = '<i data-lucide="delete"></i>'; btn.addEventListener('click', () => lockKeypadPress('back')); }
    else { btn.className = 'lock-key'; btn.textContent = k; btn.addEventListener('click', () => lockKeypadPress(k)); }
    kp.appendChild(btn);
  });
  if (window.lucide) lucide.createIcons();
}
function updateLockPinDots(){
  const dots = document.getElementById('lockPinDots');
  dots.innerHTML = '';
  for (let i=0;i<4;i++){
    const d = document.createElement('div');
    d.className = 'lock-pin-dot' + (i < lockBuffer.length ? ' filled' : '');
    dots.appendChild(d);
  }
}
async function lockKeypadPress(k){
  document.getElementById('lockError').textContent = '';
  if (k === 'back'){ lockBuffer = lockBuffer.slice(0,-1); updateLockPinDots(); return; }
  if (lockBuffer.length >= 4) return;
  lockBuffer += k;
  updateLockPinDots();
  if (lockBuffer.length === 4){
    const ok = await verifySecurityCode(lockBuffer);
    if (ok){ unlockApp(); }
    else {
      document.getElementById('lockError').textContent = 'Kòd PIN la pa kòrèk. Eseye ankò.';
      lockBuffer = '';
      updateLockPinDots();
    }
  }
}
async function submitLockPassword(){
  const input = document.getElementById('lockPasswordInput');
  const ok = await verifySecurityCode(input.value);
  if (ok){ unlockApp(); }
  else {
    document.getElementById('lockError').textContent = 'Modpas la pa kòrèk. Eseye ankò.';
    input.value = '';
  }
}
document.getElementById('lockPasswordSubmitBtn').addEventListener('click', submitLockPassword);
document.getElementById('lockPasswordInput').addEventListener('keydown', e => { if (e.key === 'Enter') submitLockPassword(); });

function lockApp(){
  if (!security.enabled) return;
  document.getElementById('lockEnterCard').hidden = false;
  document.getElementById('lockRecoveryCard').hidden = true;
  document.getElementById('lockResetCard').hidden = true;
  document.getElementById('lockError').textContent = '';
  lockBuffer = '';
  if (security.mode === 'pin'){
    document.getElementById('lockPinDots').hidden = false;
    document.getElementById('lockKeypad').hidden = false;
    document.getElementById('lockPasswordRow').style.display = 'none';
    document.getElementById('lockSubtitle').textContent = 'Antre kòd PIN ou pou kontinye';
    updateLockPinDots();
  } else {
    document.getElementById('lockPinDots').hidden = true;
    document.getElementById('lockKeypad').hidden = true;
    document.getElementById('lockPasswordRow').style.display = 'flex';
    document.getElementById('lockSubtitle').textContent = 'Antre modpas ou pou kontinye';
    document.getElementById('lockPasswordInput').value = '';
  }
  document.getElementById('lockOverlay').classList.add('open');
  if (security.mode !== 'pin') setTimeout(() => document.getElementById('lockPasswordInput').focus(), 60);
}
function unlockApp(){
  document.getElementById('lockOverlay').classList.remove('open');
  lockBuffer = '';
  lastActivityTs = Date.now();
  hiddenAt = null;
}

// ---- Rekiperasyon: kesyon sekirite oswa kòd rekiperasyon ----
document.getElementById('lockForgotBtn').addEventListener('click', () => {
  document.getElementById('lockEnterCard').hidden = true;
  document.getElementById('lockRecoveryCard').hidden = false;
  document.getElementById('lockRecoveryQuestionText').textContent = security.securityQuestion || '(Pa gen kesyon sekirite defini)';
  document.getElementById('lockRecoveryAnswerInput').value = '';
  document.getElementById('lockRecoveryCodeInput').value = '';
  document.getElementById('lockRecoveryError').textContent = '';
});
document.getElementById('lockRecoveryBackBtn').addEventListener('click', () => {
  document.getElementById('lockRecoveryCard').hidden = true;
  document.getElementById('lockEnterCard').hidden = false;
});
document.getElementById('lockRecoveryConfirmBtn').addEventListener('click', async () => {
  const answer = document.getElementById('lockRecoveryAnswerInput').value.trim();
  const code = document.getElementById('lockRecoveryCodeInput').value.trim().toUpperCase();
  let ok = false;
  if (code && security.recoveryCodeHash && security.recoveryCodeSalt){
    if ((await hashWithSalt(code, security.recoveryCodeSalt)) === security.recoveryCodeHash) ok = true;
  }
  if (!ok && answer && security.securityAnswerHash && security.securityAnswerSalt){
    if ((await hashWithSalt(answer.toLowerCase(), security.securityAnswerSalt)) === security.securityAnswerHash) ok = true;
  }
  if (ok){
    document.getElementById('lockRecoveryCard').hidden = true;
    document.getElementById('lockResetCard').hidden = false;
    document.getElementById('lockResetCodeInput1').value = '';
    document.getElementById('lockResetCodeInput2').value = '';
    document.getElementById('lockResetError').textContent = '';
  } else {
    document.getElementById('lockRecoveryError').textContent = 'Repons oswa kòd rekiperasyon pa kòrèk.';
  }
});
document.getElementById('lockResetConfirmBtn').addEventListener('click', async () => {
  const p1 = document.getElementById('lockResetCodeInput1').value;
  const p2 = document.getElementById('lockResetCodeInput2').value;
  const errEl = document.getElementById('lockResetError');
  if (!p1 || p1.length < 4){ errEl.textContent = 'Kòd la twò kout (minimòm 4 karaktè).'; return; }
  if (p1 !== p2){ errEl.textContent = 'Kòd yo pa menm.'; return; }
  const salt = randomSalt();
  security.salt = salt;
  security.hash = await hashWithSalt(p1, salt);
  persistSecurity();
  document.getElementById('lockResetCard').hidden = true;
  unlockApp();
  showToast('Kòd ou chanje ak siksè ✓');
});

// ---- Motè Auto-Lock: inaktivite, aplikasyon fèmen, aparèy nan dòmi ----
let lastActivityTs = Date.now();
let hiddenAt = null;
['mousemove','keydown','click','touchstart','scroll'].forEach(evt => {
  window.addEventListener(evt, () => { lastActivityTs = Date.now(); }, { passive:true });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden){
    hiddenAt = Date.now();
  } else if (hiddenAt){
    const elapsedMin = (Date.now() - hiddenAt) / 60000;
    if (security.enabled && elapsedMin >= security.autoLockMinutes) lockApp();
    hiddenAt = null;
    lastActivityTs = Date.now();
  }
});
setInterval(() => {
  if (!security.enabled) return;
  if (document.getElementById('lockOverlay').classList.contains('open')) return;
  const idleMin = (Date.now() - lastActivityTs) / 60000;
  if (idleMin >= security.autoLockMinutes) lockApp();
}, 5000);

// ==========================================
// BACKUP & RESTORE
// ==========================================
// Modil → kle LocalStorage ki koresponn (itilize pou restore/CSV pa modil)
const MODULE_KEY_MAP = {
  'Tasks': ['tasks','templates'],
  'Calendar': ['events'],
  'Habits': ['habits','gami'],
  'Finance': ['wallets','tx','budgets'],
  'Internet & Plan': ['plans'],
  'Projects': ['projects'],
  'Notes': ['notes','noteFolders'],
  'Journal': ['journal'],
  'Health': ['healthLogs','healthGoals'],
  'Goals': ['goals'],
  'Learning': ['learning'],
  'Paramèt & Otomatizasyon': ['categories','coachChat','scoreHistory','activity','missions','missionsHistory','achievements','notifications','personalization','security'],
};
// Li yon kle LS an tèks klè, kit li chiffre kit li pa chiffre — sèvi pou ekspòte/restore.
async function readKeyPlain(lsKey){
  const raw = localStorage.getItem(lsKey);
  if (raw == null) return undefined;
  if (ENCRYPTED_KEYS.has(lsKey)) return await decryptJSON(raw, undefined);
  try{ return JSON.parse(raw); }catch(e){ return undefined; }
}
async function writeKeyFromBackup(lsKey, val){
  if (val === undefined) return;
  if (ENCRYPTED_KEYS.has(lsKey)) await secureSave(lsKey, val);
  else saveLS(lsKey, val);
}
async function buildFullBackupObject(){
  const data = {};
  for (const lsKey of Object.values(LS)){
    const val = await readKeyPlain(lsKey);
    if (val !== undefined) data[lsKey] = val;
  }
  data.__meta = { exportedAt: new Date().toISOString(), app:'OSLIFE', version:1 };
  return data;
}
function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
async function exportBackup(){
  const data = await buildFullBackupObject();
  downloadJSON(data, `OSLIFE_backup_${todayISO()}.json`);
  showToast('Backup ekspòte ✓');
}
document.getElementById('exportBackupBtn').addEventListener('click', exportBackup);

// ---- Restore Modal (backup antye OSWA modil endividyèl) ----
let _pendingRestoreData = null;
function openRestoreModal(data){
  _pendingRestoreData = data;
  const list = document.getElementById('restoreModuleList');
  list.innerHTML = '';
  Object.keys(MODULE_KEY_MAP).forEach(modName => {
    const keys = MODULE_KEY_MAP[modName].map(k => LS[k]);
    const hasData = keys.some(k => data[k] !== undefined);
    if (!hasData) return;
    const row = document.createElement('label');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;';
    row.innerHTML = `<input type="checkbox" class="restoreModChk" value="${modName}" checked> ${modName}`;
    list.appendChild(row);
  });
  document.getElementById('restoreModalError').textContent = '';
  document.getElementById('restoreSelectAll').checked = true;
  document.getElementById('restoreModalOverlay').classList.add('open');
}
document.getElementById('restoreSelectAll').addEventListener('change', function(){
  document.querySelectorAll('.restoreModChk').forEach(c => { c.checked = this.checked; });
});
document.getElementById('closeRestoreModal').addEventListener('click', () => document.getElementById('restoreModalOverlay').classList.remove('open'));
document.getElementById('cancelRestoreModal').addEventListener('click', () => document.getElementById('restoreModalOverlay').classList.remove('open'));
document.getElementById('confirmRestoreModal').addEventListener('click', async () => {
  const selected = Array.from(document.querySelectorAll('.restoreModChk:checked')).map(c => c.value);
  if (!selected.length){ document.getElementById('restoreModalError').textContent = 'Chwazi omwen yon modil.'; return; }
  if (!_pendingRestoreData){ return; }
  try{
    for (const modName of selected){
      for (const shortKey of MODULE_KEY_MAP[modName]){
        const lsKey = LS[shortKey];
        if (_pendingRestoreData[lsKey] !== undefined) await writeKeyFromBackup(lsKey, _pendingRestoreData[lsKey]);
      }
    }
    document.getElementById('restoreModalOverlay').classList.remove('open');
    showToast('Restore fèt ak siksè ✓ Aplikasyon ap rechaje...');
    setTimeout(() => location.reload(), 1000);
  }catch(err){
    console.error(err);
    document.getElementById('restoreModalError').textContent = 'Erè pandan restore a. Eseye ankò.';
  }
});
document.getElementById('importBackupInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      openRestoreModal(data);
    } catch(err){
      showToast('Erè: fichye a pa yon backup OSLIFE valab.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ---- CSV Export / Import (Tasks, Finance, Habits, Notes, Journal) ----
function csvEscape(v){
  const s = (v ?? '').toString();
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
}
function arrayToCSV(rows, columns){
  const header = columns.map(c => csvEscape(c.label)).join(',');
  const lines = rows.map(row => columns.map(c => csvEscape(typeof c.get === 'function' ? c.get(row) : row[c.key])).join(','));
  return [header, ...lines].join('\n');
}
function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l => l.length);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).map(line => {
    const cells = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] || '').replace(/^"|"$/g,'').replace(/""/g,'"'); });
    return obj;
  });
}
const CSV_MODULES = {
  tasks: { rows: () => tasks, columns: [
    { label:'title', key:'title' }, { label:'priority', key:'priority' }, { label:'status', key:'status' },
    { label:'dueDate', key:'dueDate' }, { label:'done', key:'done' } ] },
  finance: { rows: () => tx, columns: [
    { label:'date', key:'date' }, { label:'type', key:'type' }, { label:'category', key:'category' },
    { label:'amount', key:'amount' }, { label:'note', key:'note' } ] },
  habits: { rows: () => habits, columns: [
    { label:'name', key:'name' }, { label:'frequency', key:'frequency' }, { label:'streak', key:'streak' } ] },
  notes: { rows: () => notes, columns: [
    { label:'title', key:'title' }, { label:'folder', key:'folderId' }, { label:'updatedAt', key:'updatedAt' } ] },
  journal: { rows: () => journal, columns: [
    { label:'date', key:'date' }, { label:'mood', key:'mood' }, { label:'text', key:'text' } ] },
};
document.getElementById('exportCsvBtn').addEventListener('click', () => {
  const mod = document.getElementById('csvModuleSelect').value;
  const def = CSV_MODULES[mod];
  if (!def) return;
  const csv = arrayToCSV(def.rows() || [], def.columns);
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `OSLIFE_${mod}_${todayISO()}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  showToast('CSV ekspòte ✓');
});
document.getElementById('importCsvInput').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const mod = document.getElementById('csvModuleSelect').value;
  if (mod !== 'tasks' && mod !== 'finance'){
    showToast('Enpòte CSV disponib sèlman pou Tasks ak Finance kounye a.');
    e.target.value = ''; return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const rows = parseCSV(reader.result);
      if (mod === 'tasks'){
        rows.forEach(r => tasks.push({ id:uid(), title:r.title||'Tach san tit', priority:r.priority||'medium',
          status:r.status||'todo', dueDate:r.dueDate||null, done: r.done === 'true', subtasks:[], tags:[], createdAt:new Date().toISOString() }));
        persistTasks();
      } else {
        rows.forEach(r => tx.push({ id:uid(), date:r.date||todayISO(), type:r.type||'expense',
          category:r.category||'Lòt', amount: Number(r.amount)||0, note:r.note||'' }));
        persistTx();
      }
      showToast(`${rows.length} liy enpòte nan ${mod} ✓`);
    }catch(err){
      console.error(err);
      showToast('Erè pandan lekti CSV la.');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ==========================================
// AUTOMATIC BACKUP (Daily / Weekly / Custom)
// Backup otomatik la sove yon snapshot lokalman nan IndexedDB (pa yon telechajman fichye) —
// sa bay yon filè sekirite san bezwen aksyon manyèl chak jou.
// ==========================================
let autoBackupSettings = loadLS(LS.autoBackup, { enabled:false, frequency:'daily', customDays:3, lastBackupAt:null });
function persistAutoBackupSettings(){ saveLS(LS.autoBackup, autoBackupSettings); }
function autoBackupIntervalMs(){
  if (autoBackupSettings.frequency === 'weekly') return 7*24*60*60*1000;
  if (autoBackupSettings.frequency === 'custom') return Math.max(1, autoBackupSettings.customDays||1)*24*60*60*1000;
  return 24*60*60*1000;
}
async function pruneAutoBackupSnapshots(keepLast = 5){
  try{
    const db = await idbOpen();
    const t = db.transaction(IDB_STORE, 'readonly');
    const req = t.objectStore(IDB_STORE).getAllKeys();
    req.onsuccess = async () => {
      const snapKeys = req.result.filter(k => typeof k === 'string' && k.startsWith('oslife.autobackup.')).sort();
      const toDelete = snapKeys.slice(0, Math.max(0, snapKeys.length - keepLast));
      for (const k of toDelete){
        const dt = db.transaction(IDB_STORE, 'readwrite');
        dt.objectStore(IDB_STORE).delete(k);
      }
    };
  }catch(e){ /* ignore */ }
}
async function runAutoBackupIfDue(){
  if (!autoBackupSettings.enabled) return;
  const last = autoBackupSettings.lastBackupAt ? new Date(autoBackupSettings.lastBackupAt).getTime() : 0;
  if (Date.now() - last < autoBackupIntervalMs()) return;
  const data = await buildFullBackupObject();
  const snapKey = `oslife.autobackup.${new Date().toISOString()}`;
  await idbSet(snapKey, data);
  autoBackupSettings.lastBackupAt = new Date().toISOString();
  persistAutoBackupSettings();
  await pruneAutoBackupSnapshots();
  renderAutoBackupSettingsUI();
}
async function getLatestAutoBackupSnapshot(){
  try{
    const db = await idbOpen();
    return await new Promise(resolve => {
      const t = db.transaction(IDB_STORE, 'readonly');
      const req = t.objectStore(IDB_STORE).getAllKeys();
      req.onsuccess = async () => {
        const snapKeys = req.result.filter(k => typeof k === 'string' && k.startsWith('oslife.autobackup.')).sort();
        if (!snapKeys.length){ resolve(null); return; }
        const lastKey = snapKeys[snapKeys.length-1];
        resolve(await idbGet(lastKey));
      };
      req.onerror = () => resolve(null);
    });
  }catch(e){ return null; }
}
function renderAutoBackupSettingsUI(){
  document.getElementById('autoBackupToggle').checked = autoBackupSettings.enabled;
  document.getElementById('autoBackupFreqRow').hidden = !autoBackupSettings.enabled;
  document.getElementById('autoBackupCustomRow').hidden = !(autoBackupSettings.enabled && autoBackupSettings.frequency === 'custom');
  document.getElementById('autoBackupFreqSelect').value = autoBackupSettings.frequency;
  document.getElementById('autoBackupCustomInput').value = autoBackupSettings.customDays;
  document.getElementById('autoBackupSub').textContent = autoBackupSettings.enabled
    ? `Aktive · ${autoBackupSettings.frequency === 'daily' ? 'chak jou' : autoBackupSettings.frequency === 'weekly' ? 'chak semèn' : `chak ${autoBackupSettings.customDays} jou`}`
    : 'Dezaktive';
  document.getElementById('autoBackupLastSub').textContent = autoBackupSettings.lastBackupAt
    ? `Dènye backup otomatik: ${new Date(autoBackupSettings.lastBackupAt).toLocaleString('fr-FR')}`
    : 'Pa gen backup otomatik ankò';
}
document.getElementById('autoBackupToggle').addEventListener('change', function(){
  autoBackupSettings.enabled = this.checked;
  persistAutoBackupSettings();
  renderAutoBackupSettingsUI();
  if (this.checked) runAutoBackupIfDue();
});
document.getElementById('autoBackupFreqSelect').addEventListener('change', function(){
  autoBackupSettings.frequency = this.value;
  persistAutoBackupSettings();
  renderAutoBackupSettingsUI();
});
document.getElementById('autoBackupCustomInput').addEventListener('change', function(){
  autoBackupSettings.customDays = Math.max(1, parseInt(this.value)||1);
  persistAutoBackupSettings();
  renderAutoBackupSettingsUI();
});
document.getElementById('restoreAutoBackupBtn').addEventListener('click', async () => {
  const snap = await getLatestAutoBackupSnapshot();
  if (!snap){ showToast('Pa gen backup otomatik disponib.'); return; }
  openRestoreModal(snap);
});
renderAutoBackupSettingsUI();
runAutoBackupIfDue();
setInterval(runAutoBackupIfDue, 60*60*1000); // tcheke chak èdtan si backup otomatik dwe fèt

// ==========================================
// OFFLINE FIRST
// Tout modil (Tasks, Calendar, Notes, Habits, Finance, Learning, Journal) travay san entènèt
// paske yo depann sèlman de LocalStorage/IndexedDB — pa gen okenn apèl rezo pou done itilizatè.
// ==========================================
function updateOfflineBanner(){
  const banner = document.getElementById('offlineBanner');
  banner.style.display = navigator.onLine ? 'none' : 'block';
}
window.addEventListener('error', (e) => {
  console.error('Erè aplikasyon (san jere):', e.error || e.message);
  if (typeof showToast === 'function') showToast('Gen yon ti pwoblèm ki pase. Done ou yo an sekirite — eseye ankò.');
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Erè aplikasyon (pwomès san jere):', e.reason);
  if (typeof showToast === 'function') showToast('Gen yon ti pwoblèm ki pase. Done ou yo an sekirite — eseye ankò.');
});
window.addEventListener('offline', updateOfflineBanner);
window.addEventListener('online', () => {
  updateOfflineBanner();
  // Lè koneksyon an retabli: konfime done lokal yo koyeran (pa gen sèvè pou kounye a pou senkwonize).
  restoreFromIndexedDBIfMissing();
  showToast('Koneksyon Entènèt retabli ✓ Done ou yo toujou lokal ak alajou.');
});
updateOfflineBanner();

// ---- Inisyalizasyon: bati kavye a epi fèmen aplikasyon an si Lock aktive ----
buildLockKeypad();
if (security.enabled) lockApp();

// init icons (after dynamic content is in the DOM)
if (window.lucide) lucide.createIcons();
else window.addEventListener("load", () => window.lucide && lucide.createIcons());

// Life Engine — premye analiz lè app la fin chaje
lifeEngineRefresh();
renderLevelPanels();
renderScoreHistoryUI();
syncLearningState();
syncCalendarForNewRoadmaps();
refreshDashboardLearningWidget();

// Dashboard Learning widget → opens the new standalone Learning module.
const dashLearningWidgetEl = document.getElementById('dashLearningWidget');
if (dashLearningWidgetEl) dashLearningWidgetEl.addEventListener('click', () => { window.location.href = 'learning.html'; });

// Learning UI now lives on separate pages (learning.html / course.html);
// re-sync when the user comes back to this tab so XP/streak/category/
// calendar reminders reflect progress made there without a full reload.
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  Object.assign(learning, loadLS(LS.learning, learning));
  syncLearningState();
  syncCalendarForNewRoadmaps();
  refreshDashboardLearningWidget();
});

// ==========================================
// BOOT: dekripte done sansib (Finance/Journal/Notes/Security) + restore IndexedDB
// Chaj inisyal la itilize valè seed/fallback pandan dekripaj la ap fèt an background,
// epi vi yo re-rann yon sèl fwa vre done a disponib — konsa okenn enfòmasyon sansib
// pa janm pase nan LocalStorage/IndexedDB an tèks klè.
// ==========================================
// ==========================================
// STATISTICS MODULE
// ==========================================
let statsPrefs = loadLS(LS.statsPrefs, { period:'weekly', reportPeriod:'daily' });
function persistStatsPrefs(){ saveLS(LS.statsPrefs, statsPrefs); }

function enumDates(start, end){
  const out = []; let d = start; let guard = 0;
  while (d <= end && guard < 400){ out.push(d); d = isoOffset(d, 1); guard++; }
  return out;
}
function startOfWeekISO(iso){ const d = new Date(iso+'T00:00:00'); const day = (d.getDay()+6)%7; d.setDate(d.getDate()-day); return d.toISOString().slice(0,10); }
function endOfMonthISO(iso){ const d = new Date(iso.slice(0,7)+'-01T00:00:00'); d.setMonth(d.getMonth()+1); d.setDate(0); return d.toISOString().slice(0,10); }
function statsPeriodRange(period, refISO){
  refISO = refISO || todayISO();
  if (period === 'daily') return [refISO, refISO];
  if (period === 'weekly'){ const s = startOfWeekISO(refISO); return [s, isoOffset(s,6)]; }
  if (period === 'monthly') return [refISO.slice(0,7)+'-01', endOfMonthISO(refISO)];
  if (period === 'yearly') return [refISO.slice(0,4)+'-01-01', refISO.slice(0,4)+'-12-31'];
  return [refISO, refISO];
}
function statsPrevPeriodRange(period, refISO){
  refISO = refISO || todayISO();
  if (period === 'daily') return statsPeriodRange('daily', isoOffset(refISO,-1));
  if (period === 'weekly') return statsPeriodRange('weekly', isoOffset(refISO,-7));
  if (period === 'monthly'){ const d = new Date(refISO.slice(0,7)+'-01T00:00:00'); d.setMonth(d.getMonth()-1); return statsPeriodRange('monthly', d.toISOString().slice(0,10)); }
  if (period === 'yearly'){ const y = parseInt(refISO.slice(0,4),10)-1; return statsPeriodRange('yearly', y+'-06-15'); }
  return statsPeriodRange(period, refISO);
}
const STATS_PERIOD_LABELS = { daily:'jodi a', weekly:'semèn sa a', monthly:'mwa sa a', yearly:'ane sa a' };

function computeStats(start, end){
  const today = todayISO();
  const clampedEnd = end > today ? today : end;
  const inRange = d => !!d && d >= start && d <= clampedEnd;
  const days = enumDates(start, clampedEnd);

  const tasksCompleted = tasks.filter(t => t.completedAt && inRange(t.completedAt.slice(0,10)));
  const tasksCreated = tasks.filter(t => inRange((t.createdAt||'').slice(0,10)));
  const taskCompletionRate = tasksCreated.length ? Math.round(tasksCompleted.length/tasksCreated.length*100)
    : (tasks.length ? Math.round(tasks.filter(t=>t.status==='completed').length/tasks.length*100) : 0);

  let habitDone = 0;
  habits.forEach(h => (h.completions||[]).forEach(d => { if (inRange(d)) habitDone++; }));
  const habitPossible = habits.length * Math.max(days.length,1);
  const habitRate = habitPossible ? Math.round(habitDone/habitPossible*100) : 0;

  const txRange = tx.filter(t => inRange(t.date));
  const income = txRange.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = txRange.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const expenseByCat = {};
  txRange.filter(t=>t.type==='expense').forEach(t => { expenseByCat[t.category] = (expenseByCat[t.category]||0) + t.amount; });

  const lessonLog = (learning.lessonLog||[]).filter(inRange);
  const studyDays = new Set(lessonLog).size;
  const rangeXp = lessonLog.length * 15;

  const goalsCompleted = goals.filter(g => goalMilestoneProgress(g) >= 100);
  const goalsAvgProgress = goals.length ? Math.round(goals.reduce((s,g)=>s+goalMilestoneProgress(g),0)/goals.length) : 0;

  const healthRange = healthLogs.filter(l => inRange(l.date));
  const avgOf = (arr,k) => arr.length ? Math.round((arr.reduce((s,x)=>s+(x[k]||0),0)/arr.length)*10)/10 : 0;
  const avgWater = avgOf(healthRange,'water'), avgSleep = avgOf(healthRange,'sleep'), avgExercise = avgOf(healthRange,'exercise');

  const journalRange = journal.filter(j => inRange(j.date));
  const avgMood = avgOf(journalRange,'mood');

  const projectsActive = projects.filter(p => p.status !== 'completed').length;
  const projectsCompleted = projects.filter(p => p.status === 'completed').length;
  let projTasksDone = 0, projTasksTotal = 0;
  projects.forEach(p => (p.tasks||[]).forEach(t => { projTasksTotal++; if (t.done) projTasksDone++; }));
  const projAvgProgress = projTasksTotal ? Math.round(projTasksDone/projTasksTotal*100) : 0;

  const plansInRange = plans.filter(p => inRange(p.startDate));
  const internetSpend = plansInRange.reduce((s,p)=>s+(p.price||0),0);
  const activePlan = plans.find(p => p.status === 'active');

  const activityByDay = {}; days.forEach(d => activityByDay[d]=0);
  const activityByCategory = {};
  activityLog.forEach(a => {
    const d = (a.ts||'').slice(0,10);
    if (inRange(d)){
      activityByDay[d] = (activityByDay[d]||0)+1;
      activityByCategory[a.category] = (activityByCategory[a.category]||0)+1;
    }
  });

  return {
    start, end: clampedEnd, days,
    tasksCompleted: tasksCompleted.length, tasksCreated: tasksCreated.length, taskCompletionRate,
    habitDone, habitRate,
    income, expense, net: income-expense, expenseByCat,
    lessonsCompleted: lessonLog.length, studyDays, rangeXp,
    goalsCompletedCount: goalsCompleted.length, goalsAvgProgress, goalsTotal: goals.length,
    avgWater, avgSleep, avgExercise, journalEntries: journalRange.length, avgMood,
    projectsActive, projectsCompleted, projAvgProgress,
    internetSpend, activePlan,
    activityByDay, activityByCategory,
    activityTotal: Object.values(activityByCategory).reduce((a,b)=>a+b,0),
  };
}

const STATS_CAT_GROUPS = {
  Productivite: { icon:'check-square', color:'var(--blue)', keys:['tasks','calendar','missions'] },
  Aprantisaj:   { icon:'graduation-cap', color:'var(--orange)', keys:['learning'] },
  Finans:       { icon:'wallet', color:'var(--green)', keys:['finance'] },
  Abitid:       { icon:'flame', color:'var(--red)', keys:['habits'] },
  Objektif:     { icon:'target', color:'var(--blue)', keys:['goals','achievements'] },
  Sante:        { icon:'heart-pulse', color:'var(--green)', keys:['health','journal'] },
};
function groupedActivityCounts(activityByCategory){
  const out = {};
  Object.entries(STATS_CAT_GROUPS).forEach(([name, def]) => {
    out[name] = def.keys.reduce((s,k)=>s+(activityByCategory[k]||0),0);
  });
  return out;
}

// ---- SVG chart builders (no external lib) ----
function svgLineChart(points, w, h){
  if (!points.length) return '<div class="chart-empty">Poko gen done pou peryòd sa a.</div>';
  const pad = 26;
  const max = Math.max(1, ...points.map(p=>p.v));
  const stepX = points.length > 1 ? (w-pad*2)/(points.length-1) : 0;
  const coords = points.map((p,i) => [pad+i*stepX, h-pad-(p.v/max)*(h-pad*2)]);
  const line = coords.map(c=>c.join(',')).join(' ');
  const area = `${pad},${h-pad} ` + line + ` ${w-pad},${h-pad}`;
  const dots = coords.map((c,i) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.6" fill="var(--blue)"><title>${escapeHtml(points[i].label)}: ${points[i].v}</title></circle>`).join('');
  const firstLbl = points[0].label, lastLbl = points[points.length-1].label;
  return `<svg viewBox="0 0 ${w} ${h}">
    <polyline points="${area}" fill="var(--blue-soft)" stroke="none"/>
    <polyline points="${line}" fill="none" stroke="var(--blue)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <text x="${pad}" y="${h-6}" font-size="9.5" fill="var(--text-faint)">${escapeHtml(firstLbl)}</text>
    <text x="${w-pad}" y="${h-6}" font-size="9.5" fill="var(--text-faint)" text-anchor="end">${escapeHtml(lastLbl)}</text>
  </svg>`;
}
function svgBarChart(bars, w, h){
  const withVal = bars.filter(b=>true);
  const max = Math.max(1, ...bars.map(b=>b.v));
  if (!bars.length || max === 0) return '<div class="chart-empty">Poko gen aktivite pou konpare.</div>';
  const pad = 24, gap = 10;
  const bw = (w - pad*2 - gap*(bars.length-1)) / bars.length;
  const bodies = bars.map((b,i) => {
    const bh = Math.max(2, (b.v/max) * (h-pad*2));
    const x = pad + i*(bw+gap);
    const y = h - pad - bh;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${b.color}"><title>${escapeHtml(b.label)}: ${b.v}</title></rect>
      <text x="${(x+bw/2).toFixed(1)}" y="${h-8}" font-size="9" fill="var(--text-faint)" text-anchor="middle">${escapeHtml(b.label.slice(0,4))}</text>
      <text x="${(x+bw/2).toFixed(1)}" y="${(y-4).toFixed(1)}" font-size="9.5" fill="var(--text-dim)" text-anchor="middle">${b.v}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}">${bodies}</svg>`;
}
function svgPieChart(slices, w, h){
  const total = slices.reduce((s,x)=>s+x.v,0);
  if (!total) return '<div class="chart-empty">Poko gen done pou montre repatisyon an.</div>';
  const cx = w*0.32, cy = h/2, r = Math.min(cx,cy)-8;
  let angle = -Math.PI/2, paths = '';
  slices.filter(s=>s.v>0).forEach(s => {
    const frac = s.v/total;
    const next = angle + frac*Math.PI*2;
    const x1 = cx + r*Math.cos(angle), y1 = cy + r*Math.sin(angle);
    const x2 = cx + r*Math.cos(next), y2 = cy + r*Math.sin(next);
    const large = frac > 0.5 ? 1 : 0;
    paths += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${s.color}"><title>${escapeHtml(s.label)}: ${s.v}</title></path>`;
    angle = next;
  });
  const legend = slices.filter(s=>s.v>0).map((s,i) => {
    const pct = Math.round(s.v/total*100);
    return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);margin-bottom:5px;">
      <span style="width:9px;height:9px;border-radius:3px;background:${s.color};flex-shrink:0;"></span>
      <span style="flex:1;">${escapeHtml(s.label)}</span><b style="color:var(--text);">${pct}%</b></div>`;
  }).join('');
  return `<div style="display:flex;align-items:center;gap:10px;">
    <svg viewBox="0 0 ${w} ${h}" style="max-width:${w*0.62}px;">${paths}</svg>
    <div style="flex:1;min-width:0;">${legend}</div>
  </div>`;
}
function statsHeatColor(count, max){
  if (!count) return 'var(--surface-2)';
  const ratio = max ? count/max : 0;
  if (ratio > 0.75) return 'var(--green)';
  if (ratio > 0.5) return 'color-mix(in srgb, var(--green) 65%, var(--surface-2))';
  if (ratio > 0.25) return 'color-mix(in srgb, var(--green) 40%, var(--surface-2))';
  return 'color-mix(in srgb, var(--green) 20%, var(--surface-2))';
}
function svgHeatmap(){
  const end = todayISO();
  const start = isoOffset(end, -83); // 12 weeks
  const days = enumDates(startOfWeekISO(start), end);
  const counts = {};
  activityLog.forEach(a => { const d=(a.ts||'').slice(0,10); if (d>=start) counts[d]=(counts[d]||0)+1; });
  const max = Math.max(1, ...Object.values(counts));
  const cells = days.map(d => `<div class="heatmap-cell" style="background:${statsHeatColor(counts[d]||0,max)}" title="${d}: ${counts[d]||0} aktivite"></div>`).join('');
  return `<div class="heatmap-grid">${cells}</div>
    <div class="heatmap-legend"><span>Piti</span>
      <span class="heatmap-cell" style="background:var(--surface-2);"></span>
      <span class="heatmap-cell" style="background:color-mix(in srgb, var(--green) 20%, var(--surface-2));"></span>
      <span class="heatmap-cell" style="background:color-mix(in srgb, var(--green) 40%, var(--surface-2));"></span>
      <span class="heatmap-cell" style="background:color-mix(in srgb, var(--green) 65%, var(--surface-2));"></span>
      <span class="heatmap-cell" style="background:var(--green);"></span>
      <span>Anpil</span></div>`;
}

function renderStatsCategoryGrid(s){
  const wrap = document.getElementById('statsCategoryGrid');
  if (!wrap) return;
  const cards = [
    { icon:'check-square', color:'var(--blue)', title:'Pwodiktivite', lines:[
      ['Tach fini', s.tasksCompleted], ['Tach kreye', s.tasksCreated], ['To konpletasyon', s.taskCompletionRate+'%'] ] },
    { icon:'graduation-cap', color:'var(--orange)', title:'Aprantisaj', lines:[
      ['Leson konplete', s.lessonsCompleted], ['XP genyen', '+'+s.rangeXp+' XP'], ['Jou etid', s.studyDays] ] },
    { icon:'wallet', color:'var(--green)', title:'Finans', lines:[
      ['Antre', fmtHTG(s.income)], ['Depans', fmtHTG(s.expense)], ['Balans nèt', fmtHTG(s.net)] ] },
    { icon:'flame', color:'var(--red)', title:'Abitid', lines:[
      ['Konplete', s.habitDone], ['To konpletasyon', s.habitRate+'%'], ['Total abitid', habits.length] ] },
    { icon:'target', color:'var(--blue)', title:'Objektif', lines:[
      ['Objektif total', s.goalsTotal], ['Fini', s.goalsCompletedCount], ['Pwogrè mwayèn', s.goalsAvgProgress+'%'] ] },
    { icon:'heart-pulse', color:'var(--green)', title:'Sante', lines:[
      ['Dlo mwayèn', s.avgWater+' ml'], ['Dòmi mwayèn', s.avgSleep+'h'], ['Egzèsis mwayèn', s.avgExercise+' min'] ] },
    { icon:'wifi', color:'var(--orange)', title:'Entènèt', lines: s.activePlan ? [
      ['Operatè', s.activePlan.operator], ['Plan', s.activePlan.name], ['Depanse (peryòd)', fmtHTG(s.internetSpend)] ] : [
      ['Plan aktif', 'Okenn'], ['Depanse (peryòd)', fmtHTG(s.internetSpend)] ] },
    { icon:'folder-kanban', color:'var(--blue)', title:'Pwojè', lines:[
      ['Aktif', s.projectsActive], ['Fini', s.projectsCompleted], ['Pwogrè tach', s.projAvgProgress+'%'] ] },
  ];
  wrap.innerHTML = cards.map(c => `<div class="card widget stats-cat-card">
    <div class="head"><span class="ic" style="background:color-mix(in srgb, ${c.color} 16%, transparent);color:${c.color};"><i data-lucide="${c.icon}"></i></span>${c.title}</div>
    ${c.lines.map(([lbl,val]) => `<div class="stat-line"><span>${escapeHtml(lbl)}</span><b>${escapeHtml(String(val))}</b></div>`).join('')}
  </div>`).join('');
}

function renderStatsComparison(period){
  const [cs, ce] = statsPeriodRange(period);
  const [ps, pe] = statsPrevPeriodRange(period);
  const cur = computeStats(cs, ce), prev = computeStats(ps, pe);
  const rows = [
    ['Tach fini', cur.tasksCompleted, prev.tasksCompleted],
    ['To abitid', cur.habitRate+'%', prev.habitRate+'%', cur.habitRate, prev.habitRate],
    ['Depans', fmtHTG(cur.expense), fmtHTG(prev.expense), cur.expense, prev.expense],
    ['Leson aprantisaj', cur.lessonsCompleted, prev.lessonsCompleted],
    ['Pwogrè objektif', cur.goalsAvgProgress+'%', prev.goalsAvgProgress+'%', cur.goalsAvgProgress, prev.goalsAvgProgress],
    ['Egzèsis mwayèn (min)', cur.avgExercise, prev.avgExercise],
  ];
  const box = document.getElementById('statsComparisonCard');
  const labels = { daily:'jodi a vs yè', weekly:'semèn sa a vs semèn pase', monthly:'mwa sa a vs mwa pase', yearly:'ane sa a vs ane pase' };
  box.innerHTML = `<div class="stat-line" style="margin-bottom:10px;"><span style="text-transform:uppercase;font-size:11px;letter-spacing:.5px;">${labels[period]||''}</span><span></span></div>` +
    rows.map(([lbl, curVal, prevVal, curNum, prevNum]) => {
      const a = curNum !== undefined ? curNum : parseFloat(curVal);
      const b = prevNum !== undefined ? prevNum : parseFloat(prevVal);
      let deltaClass = 'flat', deltaTxt = '=';
      if (!isNaN(a) && !isNaN(b) && b !== a){
        deltaClass = a > b ? 'up' : 'down';
        const pct = b !== 0 ? Math.round(((a-b)/Math.abs(b))*100) : 100;
        deltaTxt = (a > b ? '▲ ' : '▼ ') + Math.abs(pct) + '%';
      }
      return `<div class="comparison-row"><span class="lbl">${escapeHtml(lbl)}</span>
        <div class="vals"><span>${curVal}</span><span style="color:var(--text-faint);">vs ${prevVal}</span>
        <span class="delta ${deltaClass}">${deltaTxt}</span></div></div>`;
    }).join('');
}

function renderStatsInsights(s){
  const wrap = document.getElementById('statsInsightsGrid');
  if (!wrap) return;
  const dayNames = ['Dimanch','Lendi','Madi','Mèkredi','Jedi','Vandredi','Samdi'];
  const counts = [0,0,0,0,0,0,0];
  tasks.forEach(t => { if (t.completedAt) counts[new Date(t.completedAt).getDay()]++; });
  const bestIdx = counts.reduce((best,v,i,arr)=> v>arr[best]?i:best, 0);
  const bestDay = counts.some(c=>c>0) ? dayNames[bestIdx] : 'Ap aprann...';
  const avgStudyMin = s.studyDays ? Math.round((s.lessonsCompleted*15)/s.studyDays) : 0;
  const catEntries = Object.entries(s.expenseByCat);
  const biggestCat = catEntries.length ? catEntries.sort((a,b)=>b[1]-a[1])[0][0] : 'Poko gen depans';
  const items = [
    { icon:'trophy', color:'var(--orange)', label:'Pi bon jou pwodiktivite', value: bestDay },
    { icon:'graduation-cap', color:'var(--blue)', label:'Tan etid mwayèn / jou aktif', value: avgStudyMin+' min' },
    { icon:'wallet', color:'var(--red)', label:'Pi gwo kategori depans', value: biggestCat },
    { icon:'flame', color:'var(--green)', label:'To konpletasyon abitid', value: s.habitRate+'%' },
    { icon:'target', color:'var(--blue)', label:'To konpletasyon objektif', value: (s.goalsTotal ? Math.round(s.goalsCompletedCount/s.goalsTotal*100) : 0)+'%' },
  ];
  wrap.innerHTML = items.map(it => `<div class="insight-card">
    <div class="cat" style="color:${it.color};"><i data-lucide="${it.icon}"></i>${escapeHtml(it.label)}</div>
    <div class="txt"><b>${escapeHtml(String(it.value))}</b></div>
  </div>`).join('');
}

function buildStatsReport(period){
  const [s0, e0] = statsPeriodRange(period);
  const s = computeStats(s0, e0);
  const label = STATS_PERIOD_LABELS[period] || period;
  return `RAPÒ OSLIFE — ${(VIEW_LABELS.statistics||'Estatistik').toUpperCase()} (${s0} → ${s.end})
Peryòd: ${label}

TACH
  Fini: ${s.tasksCompleted} · Kreye: ${s.tasksCreated} · To konpletasyon: ${s.taskCompletionRate}%

ABITID
  Konplete: ${s.habitDone} sou ${habits.length * Math.max(s.days.length,1)} posib · To: ${s.habitRate}%

FINANS
  Antre: ${fmtHTG(s.income)} · Depans: ${fmtHTG(s.expense)} · Balans nèt: ${fmtHTG(s.net)}

APRANTISAJ
  Leson konplete: ${s.lessonsCompleted} · XP: +${s.rangeXp} · Jou etid: ${s.studyDays}

OBJEKTIF
  Total: ${s.goalsTotal} · Fini: ${s.goalsCompletedCount} · Pwogrè mwayèn: ${s.goalsAvgProgress}%

SANTE
  Dlo mwayèn: ${s.avgWater} ml · Dòmi mwayèn: ${s.avgSleep}h · Egzèsis mwayèn: ${s.avgExercise} min

JOUNAL
  Antre: ${s.journalEntries} · Imè mwayèn: ${s.avgMood || '—'}

PWOJÈ
  Aktif: ${s.projectsActive} · Fini: ${s.projectsCompleted} · Pwogrè tach: ${s.projAvgProgress}%

ENTÈNÈT
  ${s.activePlan ? `Plan aktif: ${s.activePlan.operator} — ${s.activePlan.name}` : 'Pa gen plan aktif'} · Depanse: ${fmtHTG(s.internetSpend)}
`;
}

function renderStatisticsView(){
  document.querySelectorAll('#statsPeriodTabs .period-tab').forEach(b => b.classList.toggle('active', b.dataset.period === statsPrefs.period));
  document.querySelectorAll('#statsReportTabs .period-tab').forEach(b => b.classList.toggle('active', b.dataset.report === statsPrefs.reportPeriod));

  const [s0, e0] = statsPeriodRange(statsPrefs.period);
  const s = computeStats(s0, e0);

  const summaryEl = document.getElementById('statsPeriodSummary');
  if (summaryEl){
    summaryEl.innerHTML = `Pou <b>${STATS_PERIOD_LABELS[statsPrefs.period]}</b>, ou fini <b>${s.tasksCompleted} tach</b>, konplete <b>${s.habitRate}%</b> abitid ou yo, epi balans finansye w se <b>${fmtHTG(s.net)}</b>.`;
  }

  renderStatsCategoryGrid(s);

  const line = document.getElementById('statsLineChart');
  if (line){
    const last14 = enumDates(isoOffset(todayISO(),-13), todayISO());
    const counts = {}; activityLog.forEach(a => { const d=(a.ts||'').slice(0,10); if (last14.includes(d)) counts[d]=(counts[d]||0)+1; });
    line.innerHTML = svgLineChart(last14.map(d => ({ label:d.slice(5), v: counts[d]||0 })), 480, 200);
  }
  const pie = document.getElementById('statsPieChart');
  if (pie){
    const grouped = groupedActivityCounts(s.activityByCategory);
    const slices = Object.entries(STATS_CAT_GROUPS).map(([name,def]) => ({ label:name, v:grouped[name]||0, color:def.color }));
    pie.innerHTML = svgPieChart(slices, 420, 190);
  }
  const bar = document.getElementById('statsBarChart');
  if (bar){
    const grouped = groupedActivityCounts(s.activityByCategory);
    const bars = Object.entries(STATS_CAT_GROUPS).map(([name,def]) => ({ label:name, v:grouped[name]||0, color:def.color }));
    bar.innerHTML = svgBarChart(bars, 480, 200);
  }
  const heat = document.getElementById('statsHeatmap');
  if (heat) heat.innerHTML = svgHeatmap();

  renderStatsComparison(statsPrefs.period);
  renderStatsInsights(s);

  const reportBox = document.getElementById('statsReportBox');
  if (reportBox) reportBox.textContent = buildStatsReport(statsPrefs.reportPeriod);

  if (window.lucide) lucide.createIcons();
}

document.querySelectorAll('#statsPeriodTabs .period-tab').forEach(b => b.addEventListener('click', () => {
  statsPrefs.period = b.dataset.period; persistStatsPrefs(); renderStatisticsView();
}));
document.querySelectorAll('#statsReportTabs .period-tab').forEach(b => b.addEventListener('click', () => {
  statsPrefs.reportPeriod = b.dataset.report; persistStatsPrefs();
  const reportBox = document.getElementById('statsReportBox');
  if (reportBox) reportBox.textContent = buildStatsReport(statsPrefs.reportPeriod);
}));

document.getElementById('statsExportJsonBtn').addEventListener('click', () => {
  const [s0,e0] = statsPeriodRange(statsPrefs.period);
  const s = computeStats(s0, e0);
  downloadJSON({ period: statsPrefs.period, range:[s0,e0], stats:s }, `OSLIFE_estatistik_${statsPrefs.period}_${todayISO()}.json`);
  showToast('Estatistik ekspòte an JSON ✓');
});
document.getElementById('statsExportCsvBtn').addEventListener('click', () => {
  const [s0,e0] = statsPeriodRange(statsPrefs.period);
  const s = computeStats(s0, e0);
  const rows = [
    ['Metrik','Valè'],
    ['Peryòd', `${s0} - ${s.end}`],
    ['Tach fini', s.tasksCompleted], ['Tach kreye', s.tasksCreated], ['To konpletasyon tach', s.taskCompletionRate+'%'],
    ['Abitid konplete', s.habitDone], ['To konpletasyon abitid', s.habitRate+'%'],
    ['Antre', s.income], ['Depans', s.expense], ['Balans nèt', s.net],
    ['Leson aprantisaj', s.lessonsCompleted], ['XP genyen', s.rangeXp], ['Jou etid', s.studyDays],
    ['Objektif total', s.goalsTotal], ['Objektif fini', s.goalsCompletedCount], ['Pwogrè objektif mwayèn', s.goalsAvgProgress+'%'],
    ['Dlo mwayèn', s.avgWater], ['Dòmi mwayèn', s.avgSleep], ['Egzèsis mwayèn', s.avgExercise],
    ['Antre jounal', s.journalEntries], ['Imè mwayèn', s.avgMood],
    ['Pwojè aktif', s.projectsActive], ['Pwojè fini', s.projectsCompleted],
    ['Depans entènèt', s.internetSpend],
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `OSLIFE_estatistik_${statsPrefs.period}_${todayISO()}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('Estatistik ekspòte an CSV ✓');
});
document.getElementById('statsExportPdfBtn').addEventListener('click', () => {
  const report = buildStatsReport(statsPrefs.reportPeriod);
  const win = window.open('', '_blank');
  if (!win){ showToast('Debloke pop-up pou ekspòte PDF la'); return; }
  win.document.write(`<html><head><title>OSLIFE Rapò Estatistik</title>
    <style>body{font-family:monospace;white-space:pre-wrap;padding:32px;font-size:13px;line-height:1.7;color:#111;}</style>
    </head><body>${escapeHtml(report)}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
});

async function migrateSecureKey(lsKey, assign){
  const raw = localStorage.getItem(lsKey);
  const current = assign(); // lire valè aktyèl la (seed/fallback) san chanje l
  const val = await decryptJSON(raw, current);
  assign(val);
  // Si done a te an tèks klè (anvan chifreman te egziste), chifre l kounye a.
  if (raw != null && !raw.startsWith(ENC_PREFIX)) secureSave(lsKey, val);
}
async function bootSecureModules(){
  try{
    await migrateSecureKey(LS.wallets, (v) => { if (v !== undefined) wallets = v; return wallets; });
    await migrateSecureKey(LS.tx, (v) => { if (v !== undefined) tx = v; return tx; });
    await migrateSecureKey(LS.budgets, (v) => { if (v !== undefined) budgets = v; return budgets; });
    await migrateSecureKey(LS.plans, (v) => { if (v !== undefined) plans = v; return plans; });
    await migrateSecureKey(LS.noteFolders, (v) => { if (v !== undefined) noteFolders = v; return noteFolders; });
    await migrateSecureKey(LS.notes, (v) => { if (v !== undefined) notes = v; return notes; });
    await migrateSecureKey(LS.journal, (v) => { if (v !== undefined) journal = v; return journal; });

    // Re-rann sèlman si vi a aktyèlman afiche pou evite travay initil
    const activeView = document.querySelector('.view.active')?.id || '';
    if (typeof renderFinance === 'function' && activeView.toLowerCase().includes('finance')) renderFinance();
    if (typeof renderNotes === 'function' && activeView.toLowerCase().includes('note')) renderNotes();
    if (typeof renderJournal === 'function' && activeView.toLowerCase().includes('journal')) renderJournal();
    if (typeof renderWalletStrip === 'function') renderWalletStrip();
    if (typeof renderBudgetSummary === 'function') renderBudgetSummary();
    if (typeof refreshDashboardFinanceWidget === 'function') refreshDashboardFinanceWidget();
    if (typeof refreshDashboardJournalWidget === 'function') refreshDashboardJournalWidget();
    if (typeof refreshDashboardInternetWidget === 'function') refreshDashboardInternetWidget();
    if (typeof renderSettingsView === 'function') renderSettingsView();
    lifeEngineRefresh();
  }catch(e){
    console.error('Erè pandan dekripaj done sansib yo nan demaraj:', e);
    if (typeof showToast === 'function') showToast('⚠️ Pa t kapab chaje kèk done pwoteje. Eseye rechaje paj la.');
  }
}
/* ============================================================
   SINKWONIZASYON CLOUD — local-first (IndexedDB + Firestore)
   ============================================================
   1) Ranpli firebaseConfig anba a ak konfig pwojè Firebase pa w
      (Firebase Console > Project Settings > Web app > SDK config).
   2) Nan Paramèt > Sinkwonizasyon Cloud, antre yon "Kòd Sinkwonizasyon"
      (menm kòd la sou tout aparèy ou) epi klike "Konekte".
   Si config la vid, app la kontinye fonksyone 100% san pwoblèm —
   done rete lokal, mete "an atant" (pending), pa gen sync ant aparèy.
============================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyDlK4TjB77GyJ8IR3LYmmMt7ILBb9OzpM8",
  authDomain: "oslife-a9f78.firebaseapp.com",
  projectId: "oslife-a9f78",
  storageBucket: "oslife-a9f78.firebasestorage.app",
  messagingSenderId: "1044999642",
  appId: "1:1044999642:web:3fa764a9908fbd136324e3"
};

const SYNC_DB_NAME = 'oslife_sync', SYNC_DB_VERSION = 1;
let syncDB = null, syncEnabled = false, firestoreDB = null, syncUnsub = null;
let syncCode = localStorage.getItem('oslife.syncCode') || '';
let deviceId = localStorage.getItem('oslife.deviceId') || (() => {
  const id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('oslife.deviceId', id);
  return id;
})();
let lastSeen = {}, lastVersions = {}, flushTimer = null;

function openSyncDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SYNC_DB_NAME, SYNC_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending'))   db.createObjectStore('pending', { keyPath:'key' });
      if (!db.objectStoreNames.contains('conflicts')) db.createObjectStore('conflicts', { keyPath:'id', autoIncrement:true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}
function idbPut(store, val){
  return new Promise((resolve, reject) => {
    if (!syncDB) return resolve(null);
    const tx = syncDB.transaction(store, 'readwrite');
    tx.objectStore(store).put(val);
    tx.oncomplete = () => resolve(val);
    tx.onerror = (e) => reject(e.target.error);
  });
}
function idbGetAll(store){
  return new Promise((resolve, reject) => {
    if (!syncDB) return resolve([]);
    const tx = syncDB.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}
function idbDelete(store, key){
  return new Promise((resolve, reject) => {
    if (!syncDB) return resolve(null);
    const tx = syncDB.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve(null);
    tx.onerror = (e) => reject(e.target.error);
  });
}

function setSyncStatus(mode){
  const sub = document.getElementById('syncStatusSub');
  const ic  = document.getElementById('syncStatusIc');
  if (!sub || !ic) return;
  const map = {
    off:     ['cloud-off',  'var(--text-faint)', 'Dezaktive — pa gen kòd sinkwonizasyon'],
    offline: ['cloud-off',  'var(--orange)',     'Ap tann rezo... chanjman yo an atant'],
    syncing: ['refresh-cw', 'var(--blue)',       'Ap sinkwonize...'],
    synced:  ['cloud',      'var(--green)',      'Sinkwonize · aparèy: ' + deviceId.slice(0,10)],
    error:   ['cloud-off',  'var(--red)',        'Erè sinkwonizasyon — n ap eseye ankò pita'],
  };
  const [icon, color, txt] = map[mode] || map.off;
  ic.style.color = color;
  ic.innerHTML = `<i data-lucide="${icon}"></i>`;
  sub.textContent = txt;
  if (window.lucide) lucide.createIcons();
}

const SYNC_BOOT_GRACE_MS = 3000;
const syncBootGraceUntil = Date.now() + SYNC_BOOT_GRACE_MS;

function safeReload(){
  // Pa reload plis pase 1 fwa chak 8 segond — kraze nenpòt bouk sinkwonizasyon san fen
  const last = Number(sessionStorage.getItem('oslife.lastSyncReload') || 0);
  if (Date.now() - last < 8000) return;
  sessionStorage.setItem('oslife.lastSyncReload', String(Date.now()));
  location.reload();
}

async function onLocalStorageChange(key, rawValue){
  if (!key || !key.startsWith('oslife.')) return;
  if (key === 'oslife.syncCode' || key === 'oslife.deviceId') return;
  if (Date.now() < syncBootGraceUntil) return; // ekriti demaraj (dekripaj/reankripte) — pa sync sa
  if (lastSeen[key] === rawValue) return;
  lastSeen[key] = rawValue;
  const rec = { key, value: rawValue, updatedAt: Date.now(), version: ((lastVersions[key]||0)+1), deviceId };
  lastVersions[key] = rec.version;
  await idbPut('pending', rec);
  if (syncEnabled) scheduleFlush(); else setSyncStatus(navigator.onLine ? 'off' : 'offline');
}
function scheduleFlush(){ clearTimeout(flushTimer); flushTimer = setTimeout(flushPendingSync, 600); }

// Fusion entelijan pou lis JSON (tasks, habits, notes, elatriye) pa "id" —
// pa efase anyen: si yon antre egziste sou 2 aparèy, kenbe vèsyon ki pi resan (updatedAt/createdAt);
// si yon antre sèlman sou yon aparèy, ajoute l. Retounen null si valè yo pa 2 lis (pa gen fusion posib).
function mergeJSONValues(localRaw, remoteRaw){
  let localVal, remoteVal;
  try{ localVal = JSON.parse(localRaw); }catch(e){ return null; }
  try{ remoteVal = JSON.parse(remoteRaw); }catch(e){ return null; }
  if (!Array.isArray(localVal) || !Array.isArray(remoteVal)) return null;
  const tsOf = it => new Date(it && (it.updatedAt || it.createdAt) || 0).getTime() || 0;
  const map = new Map();
  const noIdSet = new Map(); // deduplike antre san id pa kontni (JSON) yo
  const addNoId = it => { const k = JSON.stringify(it); if (!noIdSet.has(k)) noIdSet.set(k, it); };
  localVal.forEach(it => { (it && it.id != null) ? map.set(it.id, it) : addNoId(it); });
  remoteVal.forEach(it => {
    if (!it || it.id == null){ addNoId(it); return; }
    const existing = map.get(it.id);
    if (!existing || tsOf(it) >= tsOf(existing)) map.set(it.id, it);
  });
  // Tri detèministe pa id (konvèti an tèks) pou tou de aparèy yo jenere EGZAKTEMAN
  // menm lòd, menm rezilta — sinon yo antre nan yon bouk sinkwonizasyon san fen.
  const withId = [...map.values()].sort((a,b) => String(a.id).localeCompare(String(b.id)));
  const withoutId = [...noIdSet.keys()].sort().map(k => noIdSet.get(k));
  return JSON.stringify([...withId, ...withoutId]);
}

async function flushPendingSync(){
  if (!syncEnabled || !firestoreDB || !navigator.onLine){ setSyncStatus(navigator.onLine ? 'off' : 'offline'); return; }
  const pending = await idbGetAll('pending');
  if (!pending.length){ setSyncStatus('synced'); return; }
  setSyncStatus('syncing');
  const col = firestoreDB.collection('oslife_sync').doc(syncCode).collection('records');
  let needsReload = false;
  for (const rec of pending){
    try{
      const ref = col.doc(rec.key);
      const snap = await ref.get();
      let valueToPush = rec.value;
      let skipPush = false;
      if (snap.exists){
        const remote = snap.data();
        if (remote.deviceId !== deviceId && remote.updatedAt !== rec.updatedAt){
          const merged = mergeJSONValues(rec.value, remote.value);
          if (merged !== null){
            // Se 2 lis — fusione yo pa id, done tou de aparèy yo kenbe
            valueToPush = merged;
            if (merged === remote.value){
              // Rezilta a deja egal ak sa ki sou cloud la — pa gen pou nou re-ekri, pa gen pou reload
              skipPush = true;
            } else if (merged !== rec.value){
              window.__origLSSetItem.call(localStorage, rec.key, merged);
              lastSeen[rec.key] = merged; lastVersions[rec.key] = (lastVersions[rec.key]||0)+1;
              needsReload = true;
            }
          } else if (remote.updatedAt > rec.updatedAt){
            // Pa gen fusion posib (pa yon lis) e remote a pi resan — pa efase anyen,
            // sove tou de vèsyon nan jounal konfli, epi adopte remote a lokalman
            await idbPut('conflicts', { localKey: rec.key, localValue: rec.value, remoteValue: remote.value, ts: Date.now() });
            valueToPush = remote.value;
            skipPush = true;
            if (remote.value !== rec.value){
              window.__origLSSetItem.call(localStorage, rec.key, remote.value);
              lastSeen[rec.key] = remote.value;
              needsReload = true;
            }
          }
        }
      }
      if (!skipPush) await ref.set({ value: valueToPush, updatedAt: Date.now(), version: rec.version, deviceId }, { merge:true });
      await idbDelete('pending', rec.key);
    }catch(e){
      console.error('Sync echwe pou', rec.key, e);
      setSyncStatus('error');
      scheduleFlush();
      return;
    }
  }
  setSyncStatus('synced');
  if (needsReload) safeReload();
}

function mergeRemoteChange(key, remote){
  if (!remote || remote.deviceId === deviceId) return; // chanjman pa m ki tounen, inyore
  if (lastSeen[key] === remote.value) return; // menm valè deja, anyen pa chanje
  const localRaw = localStorage.getItem(key);
  if (localRaw === remote.value) { lastSeen[key] = remote.value; return; } // deja idantik, pa gen pou n reload
  const merged = mergeJSONValues(localRaw, remote.value);
  const finalValue = merged !== null ? merged : remote.value;
  if (finalValue === localRaw){ lastSeen[key] = finalValue; return; } // fusion an bay menm bagay ki te la deja
  window.__origLSSetItem.call(localStorage, key, finalValue);
  lastSeen[key] = finalValue;
  lastVersions[key] = remote.version || (lastVersions[key]||0)+1;
  // Re-chaje app la pou tout modil yo pran done ki fèk vin nan men lòt aparèy la,
  // san nou pa gen pou nou pyese chak varyab an memwa manyèlman.
  safeReload();
}

function startRealtimeSync(){
  if (!firestoreDB || !syncCode) return;
  if (syncUnsub) syncUnsub();
  const col = firestoreDB.collection('oslife_sync').doc(syncCode).collection('records');
  syncUnsub = col.onSnapshot(snap => {
    snap.docChanges().forEach(change => {
      if (change.type === 'removed') return; // pa janm efase lokalman otomatikman
      mergeRemoteChange(change.doc.id, change.doc.data());
    });
  }, err => { console.error('Erè sync an tan reyèl', err); setSyncStatus('error'); });
}

// Lis kle 'oslife.*' ki PA fè pati done pou sinkwonize (idantite aparèy, kle chifreman, elatriye).
const SYNC_EXCLUDE_KEYS = new Set(['oslife.syncCode', 'oslife.deviceId', 'oslife._dek']);
function isSyncableKey(key){
  return key.startsWith('oslife.')
    && !SYNC_EXCLUDE_KEYS.has(key)
    && !key.startsWith('oslife.autobackup.')
    && !key.startsWith('oslife.syncSeeded.');
}

// KONTE done ki sou aparèy la SÈLMAN — itil pou wè konbe bagay ki gen risk pou pèdi
// si premye sinkwonizasyon an pa monte yo (sa se egzakteman sa ki t ap koze bug la).
function countLocalSyncData(){
  const keys = Object.keys(localStorage).filter(isSyncableKey);
  let totalRecords = 0;
  const detail = {};
  keys.forEach(k => {
    let n = 1; // varyab ki pa yon lis konte pou 1
    try{ const v = JSON.parse(localStorage.getItem(k)); if (Array.isArray(v)) n = v.length; }catch(e){}
    detail[k] = n;
    totalRecords += n;
  });
  console.table(detail);
  console.log(`Total: ${keys.length} kle, ~${totalRecords} antre/rekò.`);
  return { keyCount: keys.length, totalRecords, detail };
}

// BUG PRENSIPAL: avan, sèl done ki te antre nan pending an se sa ki chanje APRE ou limen
// sync la (via hook setItem la). Tout done ki te la deja anvan (tasks, habits, lajan...)
// pa t janm antre nan 'pending', kidonk yo pa t janm monte sou Firestore — se poutèt sa
// chak aparèy te kenbe done diferan pou tèt li. Fonksyon sa a "simen" (seed) tout done
// ki egziste deja lokalman nan 'pending' an, YON SÈL FWA pou chak kòd sinkwonizasyon,
// pou premye sinkwonizasyon an monte TOUT sa ki sou aparèy la, pa sèlman chanjman fiti.
async function seedFullSyncIfNeeded(){
  const seededFlagKey = 'oslife.syncSeeded.' + syncCode;
  if (localStorage.getItem(seededFlagKey)) return;
  const keys = Object.keys(localStorage).filter(isSyncableKey);
  for (const key of keys){
    const value = localStorage.getItem(key);
    if (value == null) continue;
    const rec = { key, value, updatedAt: Date.now(), version: (lastVersions[key]||0)+1, deviceId };
    lastVersions[key] = rec.version;
    lastSeen[key] = value;
    await idbPut('pending', rec);
  }
  window.__origLSSetItem.call(localStorage, seededFlagKey, '1');
}

async function enableCloudSync(code, opts={}){
  syncCode = (code||'').trim();
  if (!syncCode){ showToast('Antre yon kòd sinkwonizasyon dabò'); return; }
  localStorage.setItem('oslife.syncCode', syncCode);
  if (!firebaseConfig.apiKey){ showToast('⚠️ Ranpli firebaseConfig nan kòd la avan w ka konekte'); setSyncStatus('off'); return; }
  if (!window.firebase || !window.firebase.initializeApp){
    showToast('Firebase poko fin chaje, n ap eseye ankò...');
    setTimeout(() => enableCloudSync(syncCode, opts), 800);
    return;
  }
  try{
    if (!window.firebase.apps || !window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    firestoreDB = window.firebase.firestore();
    syncEnabled = true;
    if (!opts.skipSeed) await seedFullSyncIfNeeded();
    startRealtimeSync();
    flushPendingSync();
    showToast('Sinkwonizasyon cloud aktive ✓');
  }catch(e){
    console.error(e);
    showToast('Pa t kapab konekte ak cloud la');
  }
}

// POU APARÈY SEKONDÈ (telefòn, elatriye) SÈLMAN — JAM SOU PC A.
// Olye pou l fusione done lokal aparèy sa a (ki ka gaye/pa bon) ak done PC a,
// fonksyon sa a EKRASE done lokal la nèt ak sa ki sou cloud la (done PC a),
// epi make l "seeded" pou l pa janm eseye remonte ansyen done aparèy sa a.
// Sèvi ak li nan console lan: adoptRemoteAsMaster('KOD_SINKRO_A')
async function adoptRemoteAsMaster(code){
  syncCode = (code || syncCode || '').trim();
  if (!syncCode){ showToast('Antre kòd sinkwonizasyon an dabò'); return; }
  if (!firestoreDB){
    if (!window.firebase.apps || !window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    firestoreDB = window.firebase.firestore();
  }
  const col = firestoreDB.collection('oslife_sync').doc(syncCode).collection('records');
  const snap = await col.get();
  let n = 0;
  snap.forEach(doc => {
    const key = doc.id, remote = doc.data();
    if (!isSyncableKey(key) || remote.value == null) return;
    window.__origLSSetItem.call(localStorage, key, remote.value);
    lastSeen[key] = remote.value;
    lastVersions[key] = remote.version || 0;
    n++;
  });
  window.__origLSSetItem.call(localStorage, 'oslife.syncSeeded.' + syncCode, '1');
  localStorage.setItem('oslife.syncCode', syncCode);
  syncEnabled = true;
  startRealtimeSync();
  showToast(`${n} bagay resevwa nan men PC a ✓ — rechaje...`);
  setTimeout(() => location.reload(), 600);
}
window.adoptRemoteAsMaster = adoptRemoteAsMaster;
window.countLocalSyncData = countLocalSyncData;
function disableCloudSync(){
  syncEnabled = false;
  if (syncUnsub) syncUnsub();
  syncUnsub = null;
  setSyncStatus('off');
  showToast('Sinkwonizasyon cloud dezaktive');
}

window.addEventListener('online',  () => { if (syncEnabled) flushPendingSync(); });
window.addEventListener('offline', () => setSyncStatus('offline'));

// Entèsepte localStorage.setItem YON SÈL FWA pou kaptire TOUT chanjman done
// (tasks, habits, finance, notes, journal, elatriye) san modifye chak fonksyon persist* yo.
(function hookLocalStorage(){
  window.__origLSSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value){
    window.__origLSSetItem.call(this, key, value);
    if (this === localStorage) onLocalStorageChange(key, value);
  };
})();

document.getElementById('syncEnableBtn')?.addEventListener('click', () => enableCloudSync(document.getElementById('syncCodeInput').value));
document.getElementById('syncDisableBtn')?.addEventListener('click', disableCloudSync);

// ==========================================
// BACKUP & RESTORE MANYÈL NAN CLOUD (Firestore)
// Reyitilize menm firebaseConfig / firestoreDB / "Kòd Sinkwonizasyon" (syncCode) ki deja
// sèvi pou sinkwonizasyon otomatik la — chak kòd sinkwonizasyon se yon espas apa nan
// Firestore (oslife_sync/{syncCode}), egzakteman jan sync otomatik la deja fonksyone.
// Backup la sove kòm YON SÈL dokiman ('manualBackup/latest') ki kontni TOUT kle LS yo
// (via buildFullBackupObject, ki deja pran an kont chak modil aktyèl AK fiti otomatikman).
// ==========================================
const CLOUD_BACKUP_VERSION = 1;
async function ensureFirestoreReady(){
  if (firestoreDB) return true;
  if (!firebaseConfig.apiKey){ showToast('⚠️ Ranpli firebaseConfig nan kòd la avan w ka itilize cloud la'); return false; }
  if (!window.firebase || !window.firebase.initializeApp){ showToast('Firebase poko fin chaje, eseye ankò nan kèk segond.'); return false; }
  try{
    if (!window.firebase.apps || !window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    firestoreDB = window.firebase.firestore();
    return true;
  }catch(e){ console.error(e); showToast('Pa t kapab konekte ak cloud la.'); return false; }
}
function getActiveSyncCode(){
  const input = document.getElementById('syncCodeInput');
  return ((input && input.value) || syncCode || '').trim();
}
function setCloudBackupBtnState(btn, label, busy){
  if (!btn) return;
  btn.disabled = !!busy;
  btn.querySelector('.cbLabel') ? (btn.querySelector('.cbLabel').textContent = label) : (btn.textContent = label);
}
function persistLastCloudBackupInfo(code, iso){
  try{ localStorage.setItem('oslife.lastCloudBackup.' + code, iso); }catch(e){}
}
function renderCloudSyncSubs(){
  const code = getActiveSyncCode();
  const bSub = document.getElementById('cloudBackupSub');
  const rSub = document.getElementById('cloudRestoreSub');
  if (!code){
    if (bSub) bSub.textContent = 'Antre yon Kòd Sinkwonizasyon anwo a dabò';
    if (rSub) rSub.textContent = 'Antre yon Kòd Sinkwonizasyon anwo a dabò';
    return;
  }
  const last = localStorage.getItem('oslife.lastCloudBackup.' + code);
  if (bSub) bSub.textContent = last
    ? `Dènye backup cloud: ${new Date(last).toLocaleString('fr-FR')}`
    : 'Sove tout done ou yo (tout modil) sou kont sinkwonizasyon w lan kounye a';
  if (rSub) rSub.textContent = 'Retabli done ou yo apati dènye backup sou kont sinkwonizasyon w lan';
}
async function backupToCloud(){
  const btn = document.getElementById('cloudBackupBtn');
  const code = getActiveSyncCode();
  if (!code){ showToast('Antre yon Kòd Sinkwonizasyon anwo a dabò.'); return; }
  setCloudBackupBtnState(btn, 'Ap prepare backup...', true);
  try{
    if (!(await ensureFirestoreReady())){ setCloudBackupBtnState(btn, 'Backup nan Cloud', false); return; }
    const data = await buildFullBackupObject();
    setCloudBackupBtnState(btn, 'Ap telechaje...', true);
    const now = new Date();
    const payload = {
      backupVersion: CLOUD_BACKUP_VERSION,
      appVersion: (data.__meta && data.__meta.version) || 1,
      backupDate: now.toISOString().slice(0,10),
      backupTime: now.toTimeString().slice(0,8),
      updatedAt: now.getTime(),
      device: (navigator.platform || '') + ' · ' + (navigator.userAgent || '').slice(0,120),
      data
    };
    setCloudBackupBtnState(btn, 'Ap sove...', true);
    await firestoreDB.collection('oslife_sync').doc(code).collection('manualBackup').doc('latest').set(payload);
    persistLastCloudBackupInfo(code, now.toISOString());
    renderCloudSyncSubs();
    setCloudBackupBtnState(btn, 'Backup nan Cloud', false);
    showToast('Backup nan cloud fin fèt ak siksè ✓');
  }catch(e){
    console.error('Erè backup cloud', e);
    setCloudBackupBtnState(btn, 'Backup nan Cloud', false);
    showToast('⚠️ Erè pandan backup la. Verifye koneksyon rezo w epi eseye ankò.');
  }
}
async function restoreFromCloud(){
  const btn = document.getElementById('cloudRestoreBtn');
  const code = getActiveSyncCode();
  if (!code){ showToast('Antre yon Kòd Sinkwonizasyon anwo a dabò.'); return; }
  setCloudBackupBtnState(btn, 'Ap chèche backup...', true);
  try{
    if (!(await ensureFirestoreReady())){ setCloudBackupBtnState(btn, 'Restore nan Cloud', false); return; }
    const snap = await firestoreDB.collection('oslife_sync').doc(code).collection('manualBackup').doc('latest').get();
    setCloudBackupBtnState(btn, 'Restore nan Cloud', false);
    if (!snap.exists){ showToast('Pa gen okenn backup nan cloud pou kont sa a.'); return; }
    const remote = snap.data();
    // Validasyon done — ignore/refize tout done ki pa gen fòm yon backup OSLIFE valab
    if (!remote || typeof remote.data !== 'object' || remote.data === null || !remote.data.__meta || remote.data.__meta.app !== 'OSLIFE'){
      showToast('⚠️ Backup cloud la envalid oswa domaje — restore anile pou pwoteje done ou yo.');
      return;
    }
    // Modal restore ki deja egziste a (chwazi modil + konfimasyon Anile/Restore + rechajman otomatik)
    openRestoreModal(remote.data);
  }catch(e){
    console.error('Erè restore cloud', e);
    setCloudBackupBtnState(btn, 'Restore nan Cloud', false);
    showToast('⚠️ Erè pandan restore a. Verifye koneksyon rezo w epi eseye ankò.');
  }
}
document.getElementById('cloudBackupBtn')?.addEventListener('click', backupToCloud);
document.getElementById('cloudRestoreBtn')?.addEventListener('click', restoreFromCloud);
document.getElementById('syncCodeInput')?.addEventListener('input', renderCloudSyncSubs);
renderCloudSyncSubs();

// ---- Coach AI: paramèt backend (URL sèlman — JAMÈ okenn API key kote nan frontend a) ----
function setCoachBackendStatus(state){
  const ic = document.getElementById('coachBackendStatusIc');
  const sub = document.getElementById('coachBackendStatusSub');
  if (!ic || !sub) return;
  const map = {
    off:      { icon:'server-off',   color:'var(--text-faint)', bg:'var(--surface-2)', text:'Pa konfigire — mòd lokal (règ) ap itilize' },
    on:       { icon:'server',       color:'var(--green)',      bg:'color-mix(in srgb, var(--green) 16%, transparent)', text:'Konekte — Coach AI ap itilize vrè AI a' },
    error:    { icon:'server-crash', color:'var(--red)',        bg:'color-mix(in srgb, var(--red) 16%, transparent)',   text:'Pa t kapab konekte — verifye URL la (mòd lokal ap itilize)' },
    checking: { icon:'loader',       color:'var(--blue)',       bg:'color-mix(in srgb, var(--blue) 16%, transparent)',  text:'N ap teste koneksyon an...' },
  };
  const s = map[state] || map.off;
  ic.style.background = s.bg; ic.style.color = s.color;
  ic.innerHTML = `<i data-lucide="${s.icon}"></i>`;
  sub.textContent = s.text;
  if (window.lucide) lucide.createIcons();
}
(function initCoachBackendSettings(){
  const input = document.getElementById('coachBackendUrlInput');
  const savedUrl = (loadLS(LS.coachBackendUrl, '') || '').trim();
  if (input) input.value = savedUrl;
  setCoachBackendStatus(savedUrl ? 'on' : 'off');
  document.getElementById('coachBackendSaveBtn')?.addEventListener('click', async () => {
    const val = (document.getElementById('coachBackendUrlInput').value || '').trim();
    saveLS(LS.coachBackendUrl, val);
    if (!val){ setCoachBackendStatus('off'); showToast('Backend retire — Coach AI ap itilize mòd lokal'); return; }
    setCoachBackendStatus('checking');
    try{
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(val.replace(/\/+$/,'') + '/api/coach', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ messages:[{ role:'user', text:'ping' }], context:{} }),
        signal: controller.signal
      });
      clearTimeout(t);
      if (res.ok){ setCoachBackendStatus('on'); showToast('Backend konekte ✓'); }
      else setCoachBackendStatus('error');
    }catch(e){ setCoachBackendStatus('error'); }
  });
})();

(async function initCloudSyncModule(){
  try{
    syncDB = await openSyncDB();
    const input = document.getElementById('syncCodeInput');
    if (input) input.value = syncCode;
    if (!navigator.onLine) setSyncStatus('offline');
    else if (syncCode && firebaseConfig.apiKey) enableCloudSync(syncCode);
    else setSyncStatus(syncCode ? 'offline' : 'off');
  }catch(e){ console.error('Pa t kapab ouvri IndexedDB pou sync', e); }
})();

bootSecureModules();
restoreFromIndexedDBIfMissing();
