/* Lilium · catálogo público: diseños y mensajes (gestión) */
const CATALOG_BUCKET='catalog';
const CATALOG_URL_DEFAULT='https://liliummbeautyy.github.io/catalogo/';
const REQ_STATUS=[['nuevo','Nuevo'],['en_proceso','En proceso'],['aceptado','Aceptado'],['hecho','Hecho'],['archivado','Archivado']];
const DESIGN_CATS=['Press on','Gel','Nail art','Francesa','Temporada','Novias'];
const CAT={designs:[],requests:[],profile:null,loaded:false,loading:false,error:'',tab:'designs',reqFilter:'activos',refUrls:{}};
const REFS_BUCKET='catalog-refs';

function catalogUrl(){return A.settings.catalogUrl||CATALOG_URL_DEFAULT}
function catalogNewCount(){return CAT.requests.filter(r=>r.status==='nuevo').length}
function catPhotoUrl(path){if(!path)return '';if(/^https?:/.test(path))return path;return sb.storage.from(CATALOG_BUCKET).getPublicUrl(path).data.publicUrl}
function priceText(d){if(d.price==null||d.price==='')return 'Consultar';return (d.price_from?'desde ':'')+money0(d.price)}

async function loadCatalog(force=false){
 if(!sb||!cloudUser||CAT.loading)return;if(CAT.loaded&&!force)return;
 CAT.loading=true;CAT.error='';
 try{
  await purgeOldRequests();
  const [d,r,p]=await Promise.all([
   sb.from('catalog_designs').select('*').eq('owner',cloudUser.id).order('sort',{ascending:true}).order('created_at',{ascending:false}),
   sb.from('catalog_requests').select('*').eq('owner',cloudUser.id).order('created_at',{ascending:false}).limit(300),
   sb.from('catalog_profile').select('*').eq('owner',cloudUser.id).maybeSingle()]);
  if(d.error)throw d.error;if(r.error)throw r.error;if(p.error)throw p.error;
  loadRefUrls(r.data||[]);
  const before=catalogNewCount();
  CAT.designs=d.data||[];CAT.requests=r.data||[];CAT.profile=p.data;CAT.loaded=true;
  if(!CAT.profile)await ensureCatalogProfile();
  const now=catalogNewCount();
  if(now>before&&CAT.loadedOnce)toast(now-before===1?'Tienes un pedido o mensaje nuevo':`Tienes ${now-before} pedidos o mensajes nuevos`,3500);
  CAT.loadedOnce=true;
 }catch(e){console.warn('Catálogo:',e);CAT.error=e?.message||'No se pudo cargar el catálogo'}
 finally{CAT.loading=false;if(['catalog','home'].includes(route())||document.querySelector('.nav'))safeRefresh()}
}
async function ensureCatalogProfile(){
 const s=A.settings;
 const row={owner:cloudUser.id,slug:'lilium',business:s.name||'Lilium Beauty',tagline:s.slogan||'Tu espacio de uñas',about:'',whatsapp:s.phone||'',instagram:s.instagram||'',tiktok:s.tiktok||'',email:'',city:s.address||'',open:true};
 const {data,error}=await sb.from('catalog_profile').insert(row).select().maybeSingle();
 if(!error)CAT.profile=data;
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cloudUser)loadCatalog(true)});
setInterval(()=>{if(cloudUser&&document.visibilityState==='visible')loadCatalog(true)},90000);

/* Página */
function catalogPage(){
 const head=pageHead('Catálogo','Tus diseños y lo que te escriben desde la web',['flores','lirios']);
 if(!sb)return {head,body:card('','',`<p class="muted pad">El catálogo necesita conexión a Internet.</p>`)};
 if(!cloudUser)return {head,body:card('Conecta tu cuenta','cloud',`<p class="muted">El catálogo se publica en Internet, así que necesita la nube. Inicia sesión para gestionarlo.</p><button class="btn" onclick="openCloudLogin()">${ic('cloud')}Iniciar sesión</button>`)};
 if(!CAT.loaded){loadCatalog();return {head,body:card('','',`<p class="muted pad">${CAT.error?esc(CAT.error):'Cargando tu catálogo…'}</p>${CAT.error?`<button class="btn soft small" onclick="loadCatalog(true)">${ic('refresh')}Reintentar</button>`:''}`)}}
 const n=catalogNewCount();
 const tabs=`<div class="toolbar"><div class="segtabs" role="tablist">${[['designs',`Diseños <span class="cnt">${CAT.designs.length}</span>`],['requests',`Pedidos y mensajes${n?` <span class="cnt hot">${n}</span>`:''}`],['profile','Datos de contacto']].map(([k,l])=>`<button role="tab" aria-selected="${CAT.tab===k}" class="${CAT.tab===k?'on':''}" onclick="CAT.tab='${k}';render()">${l}</button>`).join('')}</div>
 <div class="head-actions"><a class="btn soft small" href="${esc(catalogUrl())}" target="_blank" rel="noopener">${ic('globe')}Ver catálogo</a><button class="btn soft small" onclick="copyCatalogLink()">${ic('send')}Copiar enlace</button>${CAT.tab==='designs'?`<button class="btn soft" onclick="openDesign()">${ic('plus')}Diseño con varias fotos</button><label class="btn">${ic('photo')}Subir fotos<input type="file" accept="image/*" multiple hidden onchange="quickAlbum(this)"></label>`:''}</div></div>`;
 const body=tabs+(CAT.tab==='requests'?requestsView():CAT.tab==='profile'?profileView():designsView());
 return {head,body};
}
function copyCatalogLink(){const u=catalogUrl();(navigator.clipboard?.writeText(u)||Promise.reject()).then(()=>toast('Enlace copiado: pégalo en Instagram o WhatsApp')).catch(()=>{prompt('Copia el enlace de tu catálogo:',u)})}

/* Diseños */
function designsView(){
 if(!CAT.designs.length)return card('','',`<div class="empty"><div class="empty-stamps">${stamp('lirios','',-6)}${stamp('flores','',5)}</div><p class="empty-title">Tu catálogo está vacío</p><p class="muted">Sube fotos de tus diseños. Si quieres, ponles nombre o una descripción. Tus clientas los verán y, si alguno les gusta, te escribirán.</p><div class="empty-btns"><label class="btn">${ic('photo')}Subir fotos<input type="file" accept="image/*" multiple hidden onchange="quickAlbum(this)"></label><button class="btn soft" onclick="openDesign()">${ic('plus')}Diseño con varias fotos</button></div></div>`);
 return `<div class="design-grid">${CAT.designs.map(d=>`<article class="design-card ${d.visible?'':'is-hidden'}">
  <button class="dc-photo" onclick="openDesign('${d.id}')" aria-label="Editar ${esc(d.name||'diseño')}">${d.photos?.[0]?`<img src="${esc(catPhotoUrl(d.photos[0]))}" alt="" loading="lazy">`:`<span class="dc-nophoto">${ic('camera')}<small>Sin foto</small></span>`}${d.photos?.length>1?`<em class="dc-count">${d.photos.length} fotos</em>`:''}${d.visible?'':`<em class="dc-hidden">${ic('eyeoff')}Oculto</em>`}</button>
  <div class="dc-body"><div class="dc-title"><b class="${d.name?'':'muted'}">${esc(d.name||'Sin nombre')}</b><button class="icon-btn" aria-label="Opciones" onclick="designMenu(event,'${d.id}')">${ic('more')}</button></div>
   ${[d.category,d.shape,d.length].some(Boolean)?`<small class="muted">${esc([d.category,d.shape,d.length].filter(Boolean).join(' · '))}</small>`:''}
   <label class="toggle mini"><span>Visible en la web</span><input type="checkbox" ${d.visible?'checked':''} onchange="setDesignVisible('${d.id}',this.checked)"><i></i></label>
  </div></article>`).join('')}</div>`;
}
async function quickAlbum(input){
 const files=[...(input.files||[])].filter(f=>f.type.startsWith('image/')).slice(0,30);input.value='';if(!files.length)return;
 let ok=0;toast(`Subiendo ${plural(files.length,'foto','fotos')}…`,60000);
 const base=-(Date.now()/1000|0);
 for(const [k,f] of files.entries()){
  try{const id=crypto.randomUUID?crypto.randomUUID():uid('d');const data=await compressImage(f,1400,.85);const path=`${cloudUser.id}/${id}/${uid('f')}.jpg`;
   const up=await sb.storage.from(CATALOG_BUCKET).upload(path,dataUrlToBlob(data),{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;
   const {data:row,error}=await sb.from('catalog_designs').insert({id,owner:cloudUser.id,album:false,name:'',photos:[path],visible:true,sort:base-k}).select().single();if(error)throw error;
   CAT.designs.unshift(row);ok++;
  }catch(e){console.error(e)}
 }
 render();toast(ok===files.length?`${plural(ok,'diseño publicado','diseños publicados')} en tu catálogo`:`Se publicaron ${ok} de ${files.length}. Revisa la conexión e inténtalo con las que faltan.`,4000);
}
async function setDesignVisible(id,v){const d=CAT.designs.find(x=>x.id===id);const {error}=await sb.from('catalog_designs').update({visible:v}).eq('id',id);if(error)return toast(error.message);d.visible=v;render();toast(v?'Ahora se ve en tu web':'Oculto de la web')}
function designMenu(ev,id){const i=CAT.designs.findIndex(x=>x.id===id),d=CAT.designs[i];openMenu(ev,[
 {label:'Editar',icon:'edit',action:()=>openDesign(id)},
 {label:'Mover antes',icon:'arrowup',action:()=>moveDesign(id,-1)},
 {label:'Mover después',icon:'arrowdown',action:()=>moveDesign(id,1)},
 {label:d.visible?'Ocultar de la web':'Mostrar en la web',icon:d.visible?'eyeoff':'eye',action:()=>setDesignVisible(id,!d.visible)},
  '-',{label:d.album?'Eliminar foto':'Eliminar diseño',icon:'trash2',danger:true,action:()=>deleteDesign(id)}])}
async function moveDesign(id,dir){const cur=CAT.designs.find(x=>x.id===id);const grp=CAT.designs;const gi=grp.indexOf(cur),gj=gi+dir;if(gj<0||gj>=grp.length)return;const i=CAT.designs.indexOf(cur),j=CAT.designs.indexOf(grp[gj]);const arr=CAT.designs;[arr[i],arr[j]]=[arr[j],arr[i]];arr.forEach((d,k)=>d.sort=k);render();
 const res=await Promise.all(arr.map((d,k)=>sb.from('catalog_designs').update({sort:k}).eq('id',d.id)));if(res.some(r=>r.error))toast('No se pudo guardar el orden')}
async function deleteDesign(id){const d=CAT.designs.find(x=>x.id===id);if(!d)return;if(!await ask({title:d.name?`¿Eliminar «${d.name}»?`:'¿Eliminar este diseño?',text:'Se quitará de tu web y se borrarán sus fotos. No se puede deshacer.',ok:'Eliminar',danger:true}))return;
 const {error}=await sb.from('catalog_designs').delete().eq('id',id);if(error)return toast(error.message);
 if(d.photos?.length)sb.storage.from(CATALOG_BUCKET).remove(d.photos.filter(p=>!/^https?:/.test(p))).catch(()=>{});
 CAT.designs=CAT.designs.filter(x=>x.id!==id);closeModal();render();toast('Diseño eliminado')}

let designDraft=null;
function openDesign(id=null){
 const d=id?CAT.designs.find(x=>x.id===id):null;
 designDraft={id:d?.id||(crypto.randomUUID?crypto.randomUUID():uid('d')),isNew:!d,photos:[...(d?.photos||[])],removed:[],album:!!d?.album};
 const cats=[...new Set([...DESIGN_CATS,...CAT.designs.map(x=>x.category).filter(Boolean)])];
 openModal(`<h2 class="modal-title">${d?'Editar diseño':'Nuevo diseño'}</h2>
 <div class="field"><span class="label">Fotos <small class="muted">(la primera es la portada)</small></span><div class="dz-photos" id="dzPhotos"></div></div>
 <div class="field"><label for="d_name">Nombre <small class="muted">(opcional)</small></label><input id="d_name" value="${esc(d?.name||'')}" placeholder="Rosa con flor" maxlength="80"></div>
 <div class="field"><label for="d_cat">Estilo o categoría <small class="muted">(opcional)</small></label><input id="d_cat" list="dCats" value="${esc(d?.category||'')}" maxlength="40" placeholder="Francesa, flores, nude…"><datalist id="dCats">${cats.map(c=>`<option value="${esc(c)}">`).join('')}</datalist></div>
 <div class="grid-2"><div class="field"><label for="d_shape">Forma</label><input id="d_shape" list="dShapes" value="${esc(d?.shape||'')}" maxlength="40" placeholder="Almond"><datalist id="dShapes">${['Almond','Coffin','Cuadrada','Redonda','Stiletto'].map(x=>`<option value="${x}">`).join('')}</datalist></div><div class="field"><label for="d_len">Largo</label><input id="d_len" value="${esc(d?.length||'')}" maxlength="20" placeholder="Medio"></div></div>
 
 <div class="field"><label for="d_desc">Descripción <small class="muted">(opcional)</small></label><textarea id="d_desc" rows="3" maxlength="600" placeholder="Colores, acabado, técnica…">${esc(d?.description||'')}</textarea></div>
 <div class="field"><label for="d_tags">Etiquetas <small class="muted">(separadas por comas)</small></label><input id="d_tags" value="${esc((d?.tags||[]).join(', '))}" placeholder="nude, flores, brillo"></div>
 <label class="toggle"><span><b>Visible en la web</b><small>Si lo apagas, solo lo ves tú.</small></span><input type="checkbox" id="d_visible" ${d?.visible===false?'':'checked'}><i></i></label>
 <div class="modal-actions split"><div>${d?`<button class="icon-btn danger" aria-label="Eliminar diseño" onclick="deleteDesign('${d.id}')">${ic('trash2')}</button>`:''}</div><div><button class="btn ghost" onclick="closeModal()">Cancelar</button><button class="btn" id="dSave" onclick="saveDesign()">${d?'Guardar':'Publicar'}</button></div></div>`,{cls:'design-modal'});
 drawDesignPhotos();
}
function setDraftKind(a){designDraft.album=a;const m=document.querySelector('.design-modal');m.classList.toggle('is-album',a);m.querySelectorAll('.seg-pick button').forEach((b,i)=>b.classList.toggle('on',(i===1)===a))}
function drawDesignPhotos(){const box=document.getElementById('dzPhotos');if(!box)return;
 box.innerHTML=designDraft.photos.map((p,i)=>`<figure><img src="${esc(p.startsWith('data:')?p:catPhotoUrl(p))}" alt="">${i===0?'<em>Portada</em>':`<button class="icon-btn tiny solid mk-cover" title="Usar como portada" onclick="coverPhoto(${i})">${ic('star5')}</button>`}<button class="icon-btn tiny solid rm" aria-label="Quitar foto" onclick="removeDraftPhoto(${i})">${ic('close')}</button></figure>`).join('')+(designDraft.photos.length<6?`<label class="g-add">${ic('camera')}<span>Añadir</span><input type="file" accept="image/*" multiple hidden onchange="addDraftPhotos(this)"></label>`:'')}
async function addDraftPhotos(input){const files=[...(input.files||[])].filter(f=>f.type.startsWith('image/')).slice(0,6-designDraft.photos.length);for(const f of files)designDraft.photos.push(await compressImage(f,1400,.85));drawDesignPhotos()}
function removeDraftPhoto(i){const p=designDraft.photos.splice(i,1)[0];if(p&&!p.startsWith('data:'))designDraft.removed.push(p);drawDesignPhotos()}
function coverPhoto(i){const [p]=designDraft.photos.splice(i,1);designDraft.photos.unshift(p);drawDesignPhotos()}
async function saveDesign(){
 const g=x=>document.getElementById(x);const name=g('d_name').value.trim(); if(!name&&!designDraft.photos.length)return toast('Añade al menos una foto o ponle un nombre');
 const btn=g('dSave');btn.disabled=true;btn.textContent='Guardando…';
 try{
  const photos=[];
  for(const p of designDraft.photos){
   if(!p.startsWith('data:')){photos.push(p);continue}
   const path=`${cloudUser.id}/${designDraft.id}/${uid('f')}.jpg`;
   const {error}=await sb.storage.from(CATALOG_BUCKET).upload(path,dataUrlToBlob(p),{contentType:'image/jpeg',upsert:false});
   if(error)throw error;photos.push(path);
  }
    const row={name,album:false,category:g('d_cat').value.trim(),price:null,price_from:false,shape:g('d_shape').value.trim(),length:g('d_len').value.trim(),description:g('d_desc').value.trim(),tags:g('d_tags').value.split(',').map(t=>t.trim()).filter(Boolean).slice(0,12),visible:g('d_visible').checked,photos,updated_at:new Date().toISOString()};
  let res;
  if(designDraft.isNew)res=await sb.from('catalog_designs').insert({id:designDraft.id,owner:cloudUser.id,sort:-(Date.now()/1000|0),...row}).select().single();
  else res=await sb.from('catalog_designs').update(row).eq('id',designDraft.id).select().single();
  if(res.error)throw res.error;
  if(designDraft.removed.length)sb.storage.from(CATALOG_BUCKET).remove(designDraft.removed).catch(()=>{});
  const i=CAT.designs.findIndex(x=>x.id===res.data.id);if(i>=0)CAT.designs[i]=res.data;else CAT.designs.unshift(res.data);
  closeModal();render();toast(designDraft.isNew?'Diseño publicado en tu web':'Guardado');
 }catch(e){btn.disabled=false;btn.textContent='Guardar';toast('No se pudo guardar: '+(e?.message||'revisa la conexión'),4000)}
}

/* Pedidos y mensajes */
function requestsView(){
 const f=CAT.reqFilter;const list=CAT.requests.filter(r=>f==='todos'?true:f==='activos'?!['hecho','archivado'].includes(r.status):r.status===f);
 const chips=`<div class="chips-row">${[['activos','Pendientes'],['nuevo','Nuevos'],['hecho','Hechos'],['archivado','Archivados'],['todos','Todos']].map(([k,l])=>`<button class="fchip ${f===k?'on':''}" onclick="CAT.reqFilter='${k}';render()">${l}</button>`).join('')}</div>`;
 if(!list.length)return chips+card('','',`<div class="empty"><div class="empty-stamps">${stamp('avion','',-6)}${stamp('love','',5)}</div><p class="empty-title">${CAT.requests.length?'Nada por aquí':'Aún no te han escrito'}</p><p class="muted">Cuando alguien pida un diseño o te escriba desde tu web, aparecerá aquí. Comparte el enlace de tu catálogo en Instagram o WhatsApp.</p><button class="btn soft" onclick="copyCatalogLink()">${ic('send')}Copiar enlace del catálogo</button></div>`);
 return chips+`<div class="req-list">${list.map(requestCard).join('')}</div>`;
}
function requestCard(r){
 const d=r.design_id&&CAT.designs.find(x=>x.id===r.design_id);
 const when=new Date(r.created_at);
 const reply=`Hola ${r.name.split(' ')[0]} 🌸 Soy ${A.settings.ownerName||'África'}, de ${A.settings.name||'Lilium Beauty'}. ${r.kind==='pedido'?`Te escribo por tu pedido del diseño «${r.design_name}».`:r.kind==='propio'?(r.design_id?`Te escribo porque te ha gustado ${r.design_name&&r.design_name!=='Diseño del catálogo'?'el diseño «'+r.design_name+'»':'uno de mis diseños'}. ¡Hablamos!`:'Te escribo por tu idea de diseño propio. ¡Me encanta!'):'He recibido tu mensaje.'}`;
 const contacts=[r.phone&&(waLink(r.phone,reply)?`<a class="btn soft small" href="${esc(waLink(r.phone,reply))}" target="_blank" rel="noopener">${ic('whatsapp')}WhatsApp</a>`:`<button class="btn soft small" onclick="badPhone(${esc(JSON.stringify(r.phone))})">${ic('whatsapp')}WhatsApp</button>`),r.instagram&&`<a class="btn soft small" href="https://instagram.com/${esc(r.instagram.replace(/^@/,''))}" target="_blank" rel="noopener">${ic('insta')}Instagram</a>`,r.email&&`<a class="btn soft small" href="mailto:${esc(r.email)}?subject=${encodeURIComponent('Lilium Beauty · '+(r.design_name||'Tu mensaje'))}&body=${encodeURIComponent(reply)}">${ic('mail')}Email</a>`].filter(Boolean).join('');
 return `<article class="card req ${r.status==='nuevo'?'is-new':''}">
  <header class="req-head">${d?.photos?.[0]?`<img class="req-thumb" src="${esc(catPhotoUrl(d.photos[0]))}" alt="">`:`<span class="req-thumb ph">${ic(r.kind==='pedido'?'heart':r.kind==='propio'?'sparkles':'message')}</span>`}
   <div class="req-title"><span class="tag ${r.kind==='pedido'?'in':r.kind==='propio'?'own':'msg'}">${r.kind==='propio'?(r.design_id?'Le interesa un diseño':'Diseño propio'):{pedido:'Pedido',contacto:'Mensaje'}[r.kind]||'Mensaje'}</span>${r.status==='nuevo'?'<span class="new-dot">Nuevo</span>':''}<h3>${esc(r.name)}</h3><small class="muted">${when.toLocaleDateString('es-ES',{day:'numeric',month:'short'})}, ${when.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})} · prefiere ${esc({whatsapp:'WhatsApp',instagram:'Instagram',email:'email',llamada:'llamada'}[r.contact_pref]||r.contact_pref)}</small></div>
   <label class="mini-select"><select onchange="setRequestStatus('${r.id}',this.value)" aria-label="Estado">${REQ_STATUS.map(([v,l])=>`<option value="${v}" ${r.status===v?'selected':''}>${l}</option>`).join('')}</select></label>
  </header>
  ${r.kind==='pedido'?`<p class="req-design">${ic('heart')}<b>${esc(r.design_name||'Diseño')}</b>${r.price!=null?` · ${money0(r.price)}`:''}${r.shape?` · ${esc(r.shape)}`:''}${r.length?` · ${esc(r.length)}`:''}</p>`:''}
  ${r.kind==='propio'&&r.design_id?`<p class="req-design">${ic('heart')}<b>Le interesa: ${esc(r.design_name||'un diseño del catálogo')}</b></p>`:''}
  ${r.style?`<p class="req-line"><span>Estilo</span>${esc(r.style)}</p>`:''}
  ${r.kind==='propio'&&(r.shape||r.length)?`<p class="req-line"><span>Forma</span>${esc([r.shape,r.length].filter(Boolean).join(' · '))}</p>`:''}
  ${r.refs?.length?`<div class="req-refs">${r.refs.map(x=>{const u=refUrl(x);return u?`<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Foto de referencia" loading="lazy"></a>`:`<span class="ref-ph">${ic('photo')}</span>`}).join('')}</div>`:''}
  ${r.sizes?`<p class="req-line"><span>Tallas</span>${esc(r.sizes)}</p>`:''}
  ${r.message?`<p class="req-msg">${esc(r.message)}</p>`:''}
  <div class="req-contact"><span class="muted small">${[r.phone,r.instagram,r.email].filter(Boolean).map(esc).join(' · ')}</span></div>
  <footer class="req-actions">${contacts}<span class="grow"></span><button class="btn ghost small" onclick="requestToClient('${r.id}')">${ic('userplus')}Crear ficha</button><button class="icon-btn" aria-label="Más opciones" onclick="openMenu(event,[{label:'Archivar',icon:'folder',action:()=>setRequestStatus('${r.id}','archivado')},'-',{label:'Eliminar',icon:'trash2',danger:true,action:()=>deleteRequest('${r.id}')}])">${ic('more')}</button></footer>
 </article>`;
}
async function setRequestStatus(id,st){const r=CAT.requests.find(x=>x.id===id);const {error}=await sb.from('catalog_requests').update({status:st}).eq('id',id);if(error)return toast(error.message);r.status=st;render();toast('Estado: '+REQ_STATUS.find(x=>x[0]===st)[1].toLowerCase())}
async function deleteRequest(id){if(!await confirmDelete('¿Eliminar este pedido o mensaje?','No se puede deshacer.'))return;const req=CAT.requests.find(x=>x.id===id);const {error}=await sb.from('catalog_requests').delete().eq('id',id);if(error)return toast(error.message);removeRefs(req?.refs);CAT.requests=CAT.requests.filter(x=>x.id!==id);render();toast('Eliminado')}
function requestToClient(id){
 const r=CAT.requests.find(x=>x.id===id);if(!r)return;
 let c=A.clients.find(x=>(r.phone&&String(x.phone).replace(/\D/g,'').endsWith(r.phone.replace(/\D/g,'').slice(-9)))||norm(x.name)===norm(r.name));
 if(!c){c=newClient(r.name,r.phone,r.email);c.instagram=r.instagram;c.source='Catálogo web';A.clients.push(c)}
 const note=[r.kind==='pedido'?`Pedido web: ${r.design_name}${r.price!=null?' ('+money0(r.price)+')':''}`:r.kind==='propio'?`Diseño propio${r.design_id?' (inspirado en '+(r.design_name||'el álbum')+')':''}`:'Mensaje web',r.style?`Estilo: ${r.style}`:'',r.sizes?`Tallas: ${r.sizes}`:'',r.message].filter(Boolean).join(' · ');
 c.notes.push({date:todayKey(),text:note.slice(0,500)});
 if(r.shape&&!c.shape)c.shape=r.shape;
 save();if(r.status==='nuevo')setRequestStatus(id,'en_proceso');openClientFile(c.id);toast('Ficha lista con los datos del pedido');
}

/* Datos de contacto del catálogo */
function profileView(){
 const p=CAT.profile||{};
 const f=(k,l,ph,icn,max)=>`<div class="field ${icn?'with-ic':''}"><label for="cp_${k}">${l}</label>${icn?`<span class="f-ic">${ic(icn)}</span>`:''}<input id="cp_${k}" value="${esc(p[k]||'')}" placeholder="${ph}" maxlength="${max}"></div>`;
 return `<div class="file-grid even">${card('Lo que verán tus clientas','store',`
  ${f('business','Nombre','Lilium Beauty','',80)}${f('tagline','Frase','Tu espacio de uñas','',120)}
  <div class="field"><label for="cp_about">Sobre ti</label><textarea id="cp_about" rows="4" maxlength="800" placeholder="Cuéntales cómo trabajas, cuánto tardas, si envías…">${esc(p.about||'')}</textarea></div>
  ${f('city','Ciudad o zona','Alicante','pin',80)}`,{stamp:'flores',sub:'Aparece arriba en tu catálogo.'})}
 ${card('Cómo contactarte','phone',`
  ${f('whatsapp','WhatsApp','600 000 000','whatsapp',30)}${f('instagram','Instagram','@lilium.beauty','insta',60)}${f('tiktok','TikTok','@lilium.beauty','tiktok',60)}${f('email','Email','hola@…','mail',120)}
  <p class="hint">Solo se muestra lo que rellenes.</p>
  <label class="toggle"><span><b>Aceptar mensajes y encargos</b><small>Si lo apagas, el catálogo se sigue viendo pero sin formularios.</small></span><input type="checkbox" id="cp_open" ${p.open!==false?'checked':''}><i></i></label>
  <div class="field"><label for="cp_url">Dirección de tu catálogo</label><input id="cp_url" value="${esc(catalogUrl())}"></div>
  <button class="btn wide" id="cpSave" onclick="saveCatalogProfile()">${ic('save')}Guardar datos</button>`,{stamp:'avion'})}
 ${card('Datos legales','shield',`
  <p class="hint">La ley (LSSI y RGPD) obliga a que tu web diga quién es la responsable. Se muestran solo en el «Aviso legal» y la «Política de privacidad» del catálogo.</p>
  ${f('legal_name','Nombre y apellidos de la titular','África …','person',120)}${f('legal_id','NIF / DNI','12345678Z','',20)}${f('legal_address','Domicilio a efectos de notificaciones','Calle…, Alicante','pin',200)}
  ${!p.legal_name||!p.legal_id?`<p class="warn-note">${ic('info')}Rellénalos para que tu web cumpla la ley.</p>`:''}
  <button class="btn soft wide" onclick="saveCatalogProfile()">${ic('save')}Guardar datos</button>`,{sub:'Obligatorios por ley en una web que vende.'})}</div>`;
}
async function saveCatalogProfile(){
 const g=k=>document.getElementById('cp_'+k);const row={};['business','tagline','about','city','whatsapp','instagram','tiktok','email','legal_name','legal_id','legal_address'].forEach(k=>row[k]=g(k).value.trim());row.open=g('open').checked;row.updated_at=new Date().toISOString();
 const url=g('url').value.trim();if(url&&url!==catalogUrl()){A.settings.catalogUrl=url;save()}
 if(row.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email))return toast('Revisa el email');
 const btn=document.getElementById('cpSave');btn.disabled=true;
 const {data,error}=await sb.from('catalog_profile').update(row).eq('owner',cloudUser.id).select().single();
 btn.disabled=false;if(error)return toast('No se pudo guardar: '+error.message);CAT.profile=data;toast('Datos del catálogo guardados');
}

/* Aviso en el inicio */
function catalogHomeCard(){
 const n=catalogNewCount();if(!n)return '';
 const list=CAT.requests.filter(r=>r.status==='nuevo').slice(0,3);
 return card('Nuevos desde tu web','globe',`<ul class="remind">${list.map(r=>`<li class="clickable" onclick="CAT.tab='requests';go('catalog')"><span class="tag ${r.kind==='pedido'?'in':'msg'}">${r.kind==='pedido'?'Pedido':'Mensaje'}</span><span><b>${esc(r.name)}</b><small>${esc(r.design_name||r.message.slice(0,60))}</small></span><span class="muted small">${new Date(r.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</span></li>`).join('')}</ul>`,{cls:'web-new',stamp:'avion',sub:`${plural(n,'pedido o mensaje','pedidos o mensajes')} sin leer`,action:`<button class="link" onclick="CAT.tab='requests';go('catalog')">Ver todos ${ic('arrow')}</button>`});
}

function badPhone(p){toast(`El teléfono «${p}» no es un número válido para WhatsApp (le faltan cifras). Contéstale por otra vía.`)}

/* RGPD: conservación limitada de pedidos y mensajes (12 meses cerrados, 24 meses cualquiera) */
async function purgeOldRequests(){
 try{const now=Date.now(),d12=new Date(now-365*864e5).toISOString(),d24=new Date(now-730*864e5).toISOString();
  const old=await sb.from('catalog_requests').select('id,refs,status,created_at').eq('owner',cloudUser.id).lt('created_at',d12);
  const gone=(old.data||[]).filter(x=>['hecho','archivado'].includes(x.status)||x.created_at<d24);
  if(gone.length){const {error}=await sb.from('catalog_requests').delete().in('id',gone.map(x=>x.id));if(!error)removeRefs(gone.flatMap(x=>x.refs||[]))}
 }catch(e){console.warn('Limpieza de pedidos antiguos:',e)}
}

/* Fotos de referencia de los encargos (privadas) */
function refUrl(x){if(!x)return '';if(x.startsWith('catalog:'))return catPhotoUrl(x.slice(8));return CAT.refUrls[x]||''}
async function loadRefUrls(rows){
 const paths=[...new Set(rows.flatMap(r=>r.refs||[]).filter(x=>x&&!x.startsWith('catalog:')&&!CAT.refUrls[x]))];if(!paths.length)return;
 try{const {data,error}=await sb.storage.from(REFS_BUCKET).createSignedUrls(paths,60*60*6);if(error)throw error;(data||[]).forEach(o=>{if(o.signedUrl)CAT.refUrls[o.path]=o.signedUrl});if(CAT.tab==='requests'&&location.hash.slice(1)==='catalog')safeRefresh()}catch(e){console.warn('Fotos de referencia:',e)}
}
function removeRefs(refs){const own=(refs||[]).filter(x=>x&&!x.startsWith('catalog:'));if(own.length)sb.storage.from(REFS_BUCKET).remove(own).catch(()=>{})}

