/* Lilium · Gestión de clientas — v23 · núcleo: datos, guardado y nube */
'use strict';
const APP_VERSION='25';
const STORE={clients:'manicure_clients',services:'manicure_services',appointments:'manicure_appointments',expenses:'manicure_expenses',tasks:'manicure_tasks',settings:'manicure_settings',trash:'manicure_trash'};
const COLLS=['clients','services','appointments','expenses','tasks'];
const K={localUpdated:'manicure_cloud_local_updated',lastSync:'manicure_cloud_last_sync',initialized:'manicure_cloud_initialized',merge:'manicure_cloud_merge_v23',whatsnew:'manicure_whatsnew_seen',unlocked:'manicure_unlocked'};
const ACCENTS=[['#c77d86','Rosa Lilium'],['#e3a6ae','Rosa pétalo'],['#d48e98','Rosa empolvado'],['#b9707a','Rosa antiguo'],['#a85a68','Frambuesa'],['#9b7a8c','Malva'],['#c2918a','Nude']];
const EXPENSE_CATS=['Materiales','Equipamiento','Local','Marketing','Formación','Otros'];
const OLD_ACCENTS=['#7250b8','#7550bf','#9a80d9','#c0a6ed','#ee9dcc','#e87bc4','#b27a76','#8a9a86','#8c6f86','#a8875e','#6f6a70'];
const DEFAULT_CATS=['Uñas','Manicura','Pedicura','Extras','Packs'];
const DEFAULT_MESSAGES={
 reminder:'Hola {nombre} 🌸 Te recuerdo tu cita de {servicio} el {dia} a las {hora}. ¡Te espero!',
 thanks:'¡Gracias por venir, {nombre}! 🤍 Espero que disfrutes tus uñas. Cuando quieras repetir, aquí estoy.',
 birthday:'¡Feliz cumpleaños, {nombre}! 🌷 Que tengas un día precioso.'
};
const defaults={
 services:[
  {id:'s1',name:'Uñas de gel',cat:'Uñas',price:35,dur:90},{id:'s2',name:'Relleno de gel',cat:'Uñas',price:28,dur:75},{id:'s3',name:'Manicura tradicional',cat:'Manicura',price:15,dur:45},{id:'s4',name:'Retirada de gel',cat:'Extras',price:10,dur:30},{id:'s5',name:'Diseño sencillo',cat:'Extras',price:5,dur:15},{id:'s6',name:'Diseño avanzado',cat:'Extras',price:10,dur:30},{id:'s7',name:'Pack novia',cat:'Packs',price:60,dur:150}
 ],
 settings:{name:'Lilium Beauty',ownerName:'',slogan:'Tu espacio de uñas',email:'',phone:'',address:'',instagram:'',tiktok:'',web:'',brandLogo:'',ownerPhoto:'',faviconData:'',accent:ACCENTS[0][0],theme:'light',notifications:{appointments:true,reminders:true,news:false},security:{confirmDelete:true},density:'comfortable',darkMode:false,pinEnabled:false,pinHash:'',lastBackup:'',dayStart:8,dayEnd:21,messages:{...DEFAULT_MESSAGES}}
};

/* ───────── utilidades ───────── */
function lsGet(k){try{return localStorage.getItem(k)}catch{return null}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}
function lsDel(k){try{localStorage.removeItem(k)}catch{}}
function ssGet(k){try{return sessionStorage.getItem(k)}catch{return null}}
function ssSet(k,v){try{sessionStorage.setItem(k,v)}catch{}}
function uid(p='id'){return p+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(v=''){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function jsq(v=''){return esc(String(v).replace(/\\/g,'\\\\').replace(/'/g,"\\'"))}
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function money(n){return Number(n||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'}
function money0(n){const v=Number(n||0);return (Number.isInteger(v)?v.toLocaleString('es-ES'):v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}))+' €'}
function pad(n){return String(n).padStart(2,'0')}
function dateKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function parseDate(s){const [y,m,d]=String(s).split('-').map(Number);return new Date(y,(m||1)-1,d||1)}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function todayKey(){return dateKey(new Date())}
function nowStamp(){const n=new Date();return todayKey()+'T'+pad(n.getHours())+':'+pad(n.getMinutes())}
function validDateKey(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''))&&!Number.isNaN(parseDate(v).getTime())}
function validTime(v){return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v||''))}
function tmin(t){const [h,m]=String(t||'0:0').split(':').map(Number);return h*60+(m||0)}
function mtime(n){n=Math.max(0,Math.min(1439,Math.round(n)));return pad(Math.floor(n/60))+':'+pad(n%60)}
function fmtDate(d){return d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})}
function fmtShort(s){return parseDate(s).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'}).replace(/\./g,'')}
function fmtLong(s){return parseDate(s).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
function monday(d){const x=new Date(d);x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x}
function durText(n){n=Number(n)||0;return n>=60?`${Math.floor(n/60)} h${n%60?' '+n%60+' min':''}`:`${n} min`}
function plural(n,a,b){return `${n} ${n===1?a:b}`}
function cap(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1)}
function initials(name){return String(name||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim()}

/* ───────── estado ───────── */
function readKey(k,f){try{const v=JSON.parse(lsGet(STORE[k])||'null');return v??clone(f)}catch{return clone(f)}}
const A={clients:readKey('clients',[]),services:readKey('services',defaults.services),appointments:readKey('appointments',[]),expenses:readKey('expenses',[]),tasks:readKey('tasks',[]),settings:readKey('settings',defaults.settings),trash:readKey('trash',{})};

function normalizeData(d){
 if(!Array.isArray(d.clients))d.clients=[];
 if(!Array.isArray(d.services))d.services=clone(defaults.services);
 if(!Array.isArray(d.appointments))d.appointments=[];
 if(!Array.isArray(d.expenses))d.expenses=[];
 if(!Array.isArray(d.tasks))d.tasks=[];
 if(!d.trash||typeof d.trash!=='object'||Array.isArray(d.trash))d.trash={};
 ['clients','services','appointments'].forEach(k=>{if(!Array.isArray(d.trash[k]))d.trash[k]=[]});
 if(!d.trash.removed||typeof d.trash.removed!=='object')d.trash.removed={};
 if(!d.trash.erased||typeof d.trash.erased!=='object')d.trash.erased={};
 const s=(d.settings&&typeof d.settings==='object')?d.settings:{};
 d.settings={...defaults.settings,...s,notifications:{...defaults.settings.notifications,...(s.notifications||{})},security:{...defaults.settings.security,...(s.security||{})},messages:{...DEFAULT_MESSAGES,...(s.messages||{})}};
 if(!d.settings.accent||OLD_ACCENTS.includes(String(d.settings.accent).toLowerCase()))d.settings.accent=ACCENTS[0][0];
 if(!s.theme&&s.darkMode)d.settings.theme='dark';
 if(s.logoData){if(!d.settings.ownerPhoto)d.settings.ownerPhoto=s.logoData;delete d.settings.logoData}
 delete d.settings.pin_plain;
 if(!d.settings.name||d.settings.name==='Manicure'){d.settings.name='Lilium Beauty';if(!s.ownerName)d.settings.ownerName='África';if(!s.slogan||s.slogan==='Uñas que cuentan historias')d.settings.slogan='Tu espacio de uñas'}
 if(d.settings.email==='manicure@email.com')d.settings.email='';if(d.settings.phone==='+34 600 123 456')d.settings.phone='';if(d.settings.address==='Calle Principal 123, Madrid')d.settings.address='';
 d.expenses=d.expenses.filter(x=>x&&x.date).map(x=>({...x,id:x.id||uid('g'),amount:Number(x.amount)||0,cat:x.cat||'Otros',concept:String(x.concept||'Gasto')}));
 d.tasks=d.tasks.filter(x=>x&&String(x.text||'').trim()).map(x=>({...x,id:x.id||uid('t'),done:!!x.done}));
 d.clients=d.clients.filter(c=>c&&typeof c==='object').map(c=>{
  const x={...c};if(!x.id)x.id=uid('c');x.name=String(x.name||'Sin nombre');
  x.medical={conditions:[],skin:'',nail:'',notes:'',...(x.medical||{})};if(!Array.isArray(x.medical.conditions))x.medical.conditions=[];
  x.hands=x.hands||{};['left','right'].forEach(h=>{x.hands[h]={size:'Medio',fingers:{},...(x.hands[h]||{})};if(!x.hands[h].fingers)x.hands[h].fingers={}});
  if(!Array.isArray(x.tags))x.tags=[];if(!Array.isArray(x.notes))x.notes=[];if(!Array.isArray(x.prefs))x.prefs=[];if(!Array.isArray(x.sizeHistory))x.sizeHistory=[];
  if(x.avatar&&!(x.avatar.data||x.avatar.storagePath))delete x.avatar;else if(x.avatar){x.avatar={...x.avatar};if(!x.avatar.id)x.avatar.id=uid('p');if(x.avatar.storagePath&&x.avatar.data&&!String(x.avatar.data).startsWith('data:'))delete x.avatar.data}
  x.photos=(Array.isArray(x.photos)?x.photos:[]).filter(p=>p&&(p.data||p.storagePath)).map(p=>{const q={...p};if(!q.id)q.id=uid('p');if(q.storagePath&&q.data&&!String(q.data).startsWith('data:'))delete q.data;delete q.url;return q});
  return x});
 d.services=d.services.filter(Boolean).map(s=>({...s,id:s.id||uid('s'),name:String(s.name||'Servicio'),cat:s.cat||'Uñas',price:Number(s.price)||0,dur:Number(s.dur)||60}));
 const byName=new Map(d.clients.map(c=>[norm(c.name),c]));
 d.appointments=d.appointments.filter(a=>a&&validDateKey(a.date)&&validTime(a.time)&&String(a.client||'').trim()).map(a=>{
  const x={...a,id:a.id||uid('a'),status:a.status||'pending',payment:a.payment||'pending'};
  if(!x.clientId||!d.clients.some(c=>c.id===x.clientId)){const c=byName.get(norm(x.client));if(c)x.clientId=c.id}
  const svc=d.services.find(s=>s.id===x.serviceId)||d.services.find(s=>s.name===x.service);
  if(svc&&!x.serviceId)x.serviceId=svc.id;
  if(x.amount==null||x.amount==='')x.amount=Number(svc?.price||0);
  if(!x.dur)x.dur=Number(svc?.dur||60);
  return x});
 return d;
}
normalizeData(A);

/* Marca de cambios por elemento (para fusionar PC + móvil sin perder nada) */
const SNAP=new Map();
function itemKey(x){const {updatedAt,...r}=x||{};return JSON.stringify(r)}
function stampAll(init=false){
 const now=new Date().toISOString();
 COLLS.forEach(k=>A[k].forEach(x=>{const key=k+':'+x.id,s=itemKey(x);if(!init&&SNAP.get(key)!==s)x.updatedAt=now;SNAP.set(key,s)}));
 const s=itemKey(A.settings);if(!init&&SNAP.get('settings')!==s)A.settings.updatedAt=now;SNAP.set('settings',s);
}
stampAll(true);

function persistLocal(){
 let ok=true;
 for(const [k,key] of Object.entries(STORE)){
  let json=JSON.stringify(A[k]);
  if(!lsSet(key,json)){
   if(k==='clients'){ // sin espacio: liberar fotos que ya están en la nube
    A.clients.forEach(c=>(c.photos||[]).forEach(p=>{if(p.storagePath)delete p.data}));json=JSON.stringify(A.clients);
    if(!lsSet(key,json))ok=false;
   }else ok=false;
  }
 }
 if(!ok)toast('No queda espacio en este navegador. Conecta la nube para guardar las fotos.',4000);
 return ok;
}
function save(sync=true){stampAll();const ok=persistLocal();lsSet(K.localUpdated,new Date().toISOString());if(sync)scheduleSync();return ok}

/* ───────── consultas ───────── */
const isActive=a=>a.status!=='cancelled'&&a.status!=='noshow';
const isPaid=a=>a.payment&&a.payment!=='pending';
function serviceOf(a){return A.services.find(s=>s.id===a.serviceId)||A.services.find(s=>s.name===a.service)}
function serviceByName(n){return A.services.find(s=>s.name===n)}
function clientById(id){return A.clients.find(c=>c.id===id)}
function clientOf(a){return (a.clientId&&clientById(a.clientId))||A.clients.find(c=>norm(c.name)===norm(a.client))}
function clientAppointments(c){return A.appointments.filter(a=>a.clientId===c.id||(!a.clientId&&norm(a.client)===norm(c.name)))}
function apptDur(a){return Number(a.dur)||Number(serviceOf(a)?.dur)||60}
function apptAmount(a){return Number(a.amount??serviceOf(a)?.price??0)}
function apptsOn(key){return A.appointments.filter(a=>a.date===key).sort((a,b)=>a.time.localeCompare(b.time))}
function upcoming(n=5){const now=nowStamp();return A.appointments.filter(a=>isActive(a)&&a.date+'T'+a.time>=now).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,n)}
function overlapsFor(date,time,dur,exceptId){const s=tmin(time),e=s+Number(dur||60);return A.appointments.filter(a=>a.id!==exceptId&&a.date===date&&isActive(a)&&tmin(a.time)<e&&tmin(a.time)+apptDur(a)>s)}
function categories(){const set=new Set(DEFAULT_CATS);A.services.forEach(s=>s.cat&&set.add(s.cat));return [...set]}
function parseBirthday(txt){const m=String(txt||'').match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})/);if(!m)return null;const d=+m[1],mo=+m[2];if(d<1||d>31||mo<1||mo>12)return null;return {d,m:mo}}
function fillTemplate(tpl,a,c){const name=(c?.name||a?.client||'').split(' ')[0];return String(tpl||'').replace(/\{nombre\}/g,name).replace(/\{servicio\}/g,a?.service||'').replace(/\{dia\}/g,a?fmtLong(a.date):'').replace(/\{hora\}/g,a?.time||'')}
function waLink(phone,text){let clean=String(phone||'').replace(/\D/g,'');if(clean.length===9&&/^[6789]/.test(clean))clean='34'+clean;if(clean.length<9)return '';return 'https://wa.me/'+clean+'?text='+encodeURIComponent(text)}
function openWhatsApp(phone,text){const url=waLink(phone,text);if(!url){toast('Esta clienta no tiene un teléfono válido');return false}window.location.href=url;return true}

/* ───────── papelera ───────── */
function moveToTrash(type,item){A.trash[type].push({...clone(item),deletedAt:new Date().toISOString()});A.trash.removed[item.id]=new Date().toISOString()}
function markRemoved(id){A.trash.removed[id]=new Date().toISOString()}
function pruneRemoved(r){const lim=Date.now()-150*864e5;for(const [id,t] of Object.entries(r))if(new Date(t).getTime()<lim)delete r[id];return r}

/* ───────── nube (Supabase) ───────── */
const SUPABASE_URL='https://yrdtetbtjkzqubpsxswo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_Sr5qJr46wo0kKKU6Sn2_1A_O30n2GNZ';
const BUCKET='manicure-photos';
let sb=null,cloudUser=null,syncTimer=null,syncing=false,syncAgain=false,syncState='local',lastSyncError='';
const urlCache=new Map();
try{if(window.supabase?.createClient)sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}catch(e){console.warn('Supabase no disponible',e)}

function photoUrl(p){if(p.data)return p.data;const c=urlCache.get(p.storagePath);return c?c.url:''}
let photoUrlTimer=null;
function ensurePhotoUrls(){clearTimeout(photoUrlTimer);photoUrlTimer=setTimeout(async()=>{
 if(!sb||!cloudUser)return;const paths=[];
 A.clients.forEach(c=>[...(c.photos||[]),...(c.avatar?[c.avatar]:[])].forEach(p=>{if(!p.data&&p.storagePath){const u=urlCache.get(p.storagePath);if(!u||u.exp<Date.now())paths.push(p.storagePath)}}));
 if(!paths.length)return;
 try{const {data,error}=await sb.storage.from(BUCKET).createSignedUrls(paths,60*60*12);if(error)throw error;
  (data||[]).forEach(d=>{if(d.signedUrl&&d.path)urlCache.set(d.path,{url:d.signedUrl,exp:Date.now()+60*60*11*1000})});
  document.querySelectorAll('img[data-photo]').forEach(img=>{const u=urlCache.get(img.dataset.photo);if(u&&img.getAttribute('src')!==u.url)img.src=u.url})
 }catch(e){console.warn('Fotos:',e)}
},120)}
function dataUrlToBlob(d){const [h,b]=String(d).split(',');const mime=(h.match(/data:([^;]+)/)||[])[1]||'image/jpeg';const bin=atob(b);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:mime})}
async function uploadPendingPhotos(){
 if(!sb||!cloudUser)return false;let changed=false;
 for(const c of A.clients)for(const p of [...(c.photos||[]),...(c.avatar?[c.avatar]:[])]){
  if(p.storagePath||!String(p.data||'').startsWith('data:'))continue;
  try{const blob=dataUrlToBlob(p.data);const ext=(blob.type.split('/')[1]||'jpg').replace('jpeg','jpg');
   const path=`${cloudUser.id}/${c.id}/${p.id}.${ext}`;
   const {error}=await sb.storage.from(BUCKET).upload(path,blob,{upsert:true,contentType:blob.type});
   if(error)throw error;p.storagePath=path;changed=true;
  }catch(e){console.warn('No se pudo subir una foto:',e)}
 }
 return changed;
}
async function removeCloudPhoto(p){if(sb&&cloudUser&&p?.storagePath){try{await sb.storage.from(BUCKET).remove([p.storagePath])}catch{}}}
function stripPhotos(list){return (list||[]).map(p=>{const q={...p};if(q.storagePath)delete q.data;return q})}
function cloudPayload(){return {clients:A.clients.map(c=>{const x={...c,photos:stripPhotos(c.photos)};if(x.avatar?.storagePath){x.avatar={...x.avatar};delete x.avatar.data}return x}),services:A.services,appointments:A.appointments,expenses:A.expenses,tasks:A.tasks,settings:A.settings,trash:A.trash}}
function rowToData(row){return normalizeData({clients:row.clients,services:row.services,appointments:row.appointments,expenses:row.expenses,tasks:row.tasks,settings:row.settings,trash:row.trash})}
function contentKey(d){return JSON.stringify([d.clients,d.services,d.appointments,d.expenses,d.tasks,d.settings,d.trash])}

function mergeColl(L,R,removed){
 const m=new Map();R.forEach(x=>m.set(x.id,{r:x}));L.forEach(x=>{const e=m.get(x.id)||{};e.l=x;m.set(x.id,e)});
 const order=[...L.map(x=>x.id),...R.map(x=>x.id).filter(id=>!L.some(x=>x.id===id))];
 const out=[];
 for(const id of order){const {l,r}=m.get(id);const pick=(l&&r)?((l.updatedAt||'')>=(r.updatedAt||'')?l:r):(l||r);const t=removed[id];if(t&&t>=(pick.updatedAt||''))continue;if(t)delete removed[id];out.push(pick)}
 return out;
}
function mergeData(L,R){
 const removed={...R.trash.removed};for(const [id,t] of Object.entries(L.trash.removed||{}))if(!removed[id]||t>removed[id])removed[id]=t;
 const erased={...(R.trash.erased||{}),...(L.trash.erased||{})};
 const out={settings:(L.settings.updatedAt||'')>=(R.settings.updatedAt||'')?L.settings:R.settings,trash:{removed,erased}};
 COLLS.forEach(k=>out[k]=mergeColl(L[k]||[],R[k]||[],removed));
 ['clients','services','appointments'].forEach(k=>{const alive=new Set(out[k].map(x=>x.id));const seen=new Set();out.trash[k]=[...L.trash[k],...R.trash[k]].filter(x=>{const key=x.id+'|'+x.deletedAt;if(seen.has(key)||alive.has(x.id)||erased[x.id])return false;seen.add(key);return true})});
 pruneRemoved(removed);
 return out;
}
function applyData(d){
 const localPhotos=new Map();A.clients.forEach(c=>(c.photos||[]).forEach(p=>{if(p.data&&String(p.data).startsWith('data:'))localPhotos.set(p.id,p.data)}));
 A.clients.forEach(c=>{if(c.avatar?.data)localPhotos.set(c.avatar.id,c.avatar.data)});
 d.clients.forEach(c=>{(c.photos||[]).forEach(p=>{if(!p.data&&localPhotos.has(p.id))p.data=localPhotos.get(p.id)});if(c.avatar&&!c.avatar.data&&localPhotos.has(c.avatar.id))c.avatar.data=localPhotos.get(c.avatar.id)});
 COLLS.forEach(k=>A[k]=d[k]);A.settings=d.settings;A.trash=d.trash;
 normalizeData(A);stampAll(true);persistLocal();
}
function scheduleSync(ms=1500){if(!cloudUser)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncCloud('smart',true),ms)}
function setSyncState(s,err=''){syncState=s;lastSyncError=err;updateSyncPill()}
async function syncCloud(mode='smart',silent=true){
 if(!sb){if(!silent)toast('La conexión con la nube no está disponible');return}
 if(!cloudUser){if(!silent)toast('Inicia sesión en la nube primero');return}
 if(syncing){syncAgain=true;return}
 syncing=true;setSyncState('busy');
 const before=contentKey(A);
 try{
  if(typeof captureWizard==='function'&&isWizardRoute())captureWizard();
  stampAll();
  if(await uploadPendingPhotos())stampAll();
  persistLocal();
  const {data:row,error}=await sb.from('manicure_data').select('*').eq('user_id',cloudUser.id).maybeSingle();
  if(error)throw error;
  const remote=row?rowToData(row):null;
  if(remote&&mode==='download')applyData(remote);
  else if(remote&&mode!=='upload'){
   const mergeReady=lsGet(K.merge)==='1'&&lsGet(K.lastSync);
   if(!mergeReady){
    // Primera vez con esta versión: si el dispositivo nunca sincronizó, manda la nube; si ya lo hizo, se juntan ambos sin perder nada
    if(lsGet(K.initialized)!=='1')applyData(remote);
    else applyData(mergeData(clone({clients:A.clients,services:A.services,appointments:A.appointments,expenses:A.expenses,tasks:A.tasks,settings:A.settings,trash:A.trash}),remote));
   }else applyData(mergeData(clone({clients:A.clients,services:A.services,appointments:A.appointments,expenses:A.expenses,tasks:A.tasks,settings:A.settings,trash:A.trash}),remote));
  }
  const payload=cloudPayload();
  if(!remote||contentKey(payload)!==contentKey(remote)){
   const stamp=new Date().toISOString();
   const {error:upErr}=await sb.from('manicure_data').upsert({user_id:cloudUser.id,...payload,updated_at:stamp},{onConflict:'user_id'});
   if(upErr)throw upErr;lsSet(K.lastSync,stamp);
  }else lsSet(K.lastSync,row.updated_at||new Date().toISOString());
  lsSet(K.merge,'1');lsSet(K.initialized,'1');
  setSyncState('ok');
  if(!silent)toast(mode==='download'?'Datos descargados de la nube':mode==='upload'?'Datos subidos a la nube':'Sincronizado');
  if(contentKey(A)!==before)safeRefresh();
  ensurePhotoUrls();
 }catch(e){console.error('Sincronización:',e);setSyncState(navigator.onLine===false?'offline':'error',e?.message||'');if(!silent)toast('No se pudo sincronizar: '+(e?.message||'revisa la conexión'))}
 finally{syncing=false;if(syncAgain){syncAgain=false;scheduleSync(400)}}
}
async function initCloud(){
 if(!sb){setSyncState('local');return}
 try{const {data}=await sb.auth.getSession();cloudUser=data.session?.user||null;
  sb.auth.onAuthStateChange((event,session)=>{const was=cloudUser?.id;cloudUser=session?.user||null;
   if(event==='PASSWORD_RECOVERY')setTimeout(()=>openNewPassword(true),300);
   if(!cloudUser)setSyncState('local');else if(was!==cloudUser.id)syncCloud('smart',true);
   updateSyncPill()});
 }catch(e){console.warn('Sesión de nube no disponible',e)}
 setSyncState(cloudUser?'busy':'local');
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cloudUser)syncCloud('smart',true)});
window.addEventListener('online',()=>{if(cloudUser)syncCloud('smart',true)});
setInterval(()=>{if(cloudUser&&document.visibilityState==='visible')syncCloud('smart',true)},120000);
