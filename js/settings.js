/* Lilium · ajustes, seguridad, nube, datos, acceso y arranque */
const SWATCH_EXTRA=['#f2b8c0'];
function settingsPage(){
 const s=A.settings,theme=s.theme||'light';
 const local=(()=>{let n=0;try{for(const k of Object.values(STORE))n+=(localStorage.getItem(k)||'').length}catch{}return n})();
 const photos=A.clients.reduce((n,c)=>n+(c.photos||[]).length+(c.avatar?1:0),0),inCloud=A.clients.reduce((n,c)=>n+(c.photos||[]).filter(p=>p.storagePath).length,0);
 const usedPct=Math.min(100,Math.round(local/(5*1024*1024)*100));
 const inp=(k,l,ph='',icn='')=>`<div class="field ${icn?'with-ic':''}">${l?`<label for="set_${k}">${l}</label>`:''}${icn?`<span class="f-ic">${ic(icn)}</span>`:''}<input id="set_${k}" value="${esc(s[k]||'')}" placeholder="${ph}" onchange="setSetting('${k}',this.value.trim())"></div>`;
 const body=`<div class="set-grid">
 ${card('Apariencia','palette',`<div class="theme-cards">${[['light','Claro','sun'],['dark','Oscuro','moon'],['system','Sistema','monitor']].map(([k,l,i])=>`<button class="theme-card ${theme===k?'on':''}" onclick="setSetting('theme','${k}');applySettings();render()">${ic(i)}<span>${l}</span><i class="radio"></i></button>`).join('')}</div>
  <h3 class="sub-title">Color principal</h3><div class="swatches">${[...ACCENTS.map(a=>a[0]),...SWATCH_EXTRA].map(c=>`<button class="swatch ${s.accent===c?'on':''}" style="--sw:${c}" aria-label="Color ${c}" aria-pressed="${s.accent===c}" onclick="setSetting('accent','${c}');applySettings();render()"></button>`).join('')}</div>
  <h3 class="sub-title">Color personalizado</h3><div class="custom-color"><input id="set_hex" value="${esc(s.accent.toUpperCase())}" maxlength="7" onchange="setCustomAccent(this.value)" aria-label="Código de color"><label class="color-dot" style="--sw:${s.accent}"><input type="color" value="${esc(s.accent)}" onchange="setCustomAccent(this.value)" aria-label="Elegir color"></label></div>
  <label class="toggle"><span><b>Vista compacta</b><small>Más información en la pantalla.</small></span><input type="checkbox" ${s.density==='compact'?'checked':''} onchange="setSetting('density',this.checked?'compact':'comfortable');applySettings()"><i></i></label>`,{stamp:'flores',sub:'Personaliza los colores y el modo de la aplicación.'})}
 ${card('Perfil del negocio','store',`<div class="biz"><label class="logo-drop">${s.brandLogo?`<img src="${esc(s.brandLogo)}" alt="Logo">`:`${ic('camera')}<span>Cambiar logo</span>`}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="handleLogo(this)"></label><div>${inp('name','Nombre del negocio','Lilium Beauty')}${inp('phone','Teléfono','600 000 000')}${inp('address','Dirección','Alicante, España')}</div></div>
  ${s.brandLogo?`<button class="link small" onclick="setSetting('brandLogo','');render()">Volver al logo Lilium</button>`:''}
  <h3 class="sub-title">Redes sociales</h3>${inp('instagram','','@lilium.beauty','insta')}${inp('tiktok','','@lilium.beauty','tiktok')}${inp('web','','www.liliumbeauty.es','globe')}`,{stamp:'lirios',sub:'Información básica de tu salón.'})}
 ${card('Cuenta','person',`${inp('ownerName','Tu nombre','África')}<div class="owner-photo"><label class="pf-photo">${ownerAvatar()}<span class="cam">${ic('camera')}</span><input type="file" accept="image/*" hidden onchange="handleOwnerPhoto(this)"></label><span class="muted small">Tu foto, arriba a la derecha</span></div>
  ${cloudUser?`<div class="field"><label>Email</label><input value="${esc(cloudUser.email||'')}" readonly></div><div class="field"><label>Contraseña</label><div class="inline-btn"><input value="••••••••" readonly aria-label="Contraseña"><button class="btn small" onclick="openNewPassword()">Cambiar</button></div></div>
  <button class="row-link" onclick="openCloudInfo()">${ic('cloud')}<span><b>Nube y dispositivos</b><small class="sync-pill static">${syncPillHtml()}</small></span>${ic('right')}</button>`:`<p class="muted">Inicia sesión para tener los mismos datos en el PC y en el móvil.</p><button class="btn wide" onclick="openCloudLogin()">${ic('cloud')}Iniciar sesión</button>`}`,{sub:'Gestiona tu cuenta y seguridad.'})}
 ${card('Recordatorios y mensajes','bellr',`<p class="muted small">Puedes usar {nombre}, {servicio}, {dia} y {hora}.</p>${[['reminder','Recordatorio de cita'],['thanks','Agradecimiento'],['birthday','Cumpleaños']].map(([k,l])=>`<div class="field"><label for="msg_${k}">${l} <button class="link tiny" onclick="A.settings.messages['${k}']=DEFAULT_MESSAGES['${k}'];save();render()">Restablecer</button></label><textarea id="msg_${k}" rows="2" onchange="A.settings.messages['${k}']=this.value;save();toast('Mensaje guardado')">${esc(s.messages[k]||'')}</textarea></div>`).join('')}`,{sub:'Mensajes de WhatsApp que se rellenan solos.'})}
 ${card('Copia de seguridad','database',`<div class="backup-box">${ic('cloudup')}<span><b>Última copia de seguridad</b><small>${s.lastBackup?esc(s.lastBackup):'Todavía ninguna'}</small></span><span class="ok-dot ${cloudUser?'on':''}">${cloudUser?'En la nube':'Solo local'}</span></div>
  <button class="btn wide" onclick="exportData()">${ic('download')}Realizar copia ahora</button>
  <button class="row-link" onclick="document.getElementById('importInput').click()">${ic('upload')}<span><b>Restaurar una copia</b><small>Desde un archivo .json</small></span>${ic('right')}</button><input id="importInput" type="file" accept="application/json,.json" hidden onchange="importData(this)">
  <button class="row-link" onclick="openTrash()">${ic('trash2')}<span><b>Papelera</b><small>${plural(A.trash.clients.length+A.trash.appointments.length+A.trash.services.length,'elemento','elementos')} para recuperar</small></span>${ic('right')}</button>`,{stamp:'avion',sub:'Protege tus datos.'})}
 ${card('Datos y almacenamiento','folder',`<div class="usage"><span>${(local/1024/1024).toFixed(1).replace('.',',')} MB de 5 MB en este navegador</span><b>${usedPct}%</b></div><div class="meter"><i style="width:${Math.max(2,usedPct)}%"></i></div>
  <p class="muted small">${plural(photos,'foto','fotos')} en fichas${cloudUser?` · ${inCloud} guardadas en la nube`:''}.</p>
  <button class="row-link danger" onclick="resetApp()">${ic('trash2')}<span><b>Eliminar datos de este dispositivo</b><small>${cloudUser?'Tus datos siguen en la nube.':'Esta acción no se puede deshacer.'}</small></span>${ic('right')}</button>`,{sub:'Gestiona el espacio y tus archivos.'})}
 ${card('Seguridad','shield',`<label class="toggle"><span><b>PIN de acceso</b><small>${s.pinEnabled?'Activado en la aplicación':'Pide un PIN de 4 a 6 cifras al abrir.'}</small></span><input type="checkbox" ${s.pinEnabled?'checked':''} onchange="this.checked?setupPin():disablePin();this.checked=${!!s.pinEnabled}"><i></i></label>${s.pinEnabled?`<button class="link small" onclick="setupPin()">Cambiar PIN</button>`:''}
  <label class="toggle"><span><b>Confirmar antes de eliminar</b><small>Evita borrar fichas o citas sin querer.</small></span><input type="checkbox" ${s.security?.confirmDelete!==false?'checked':''} onchange="A.settings.security.confirmDelete=this.checked;save();toast('Preferencia guardada')"><i></i></label>`,{sub:'Protege el acceso a la aplicación.'})}
 ${privacyCard()}
 ${card('Agenda','calendar',`<div class="grid-2"><div class="field"><label for="set_ds">Abre a las</label><select id="set_ds" onchange="setSetting('dayStart',+this.value)">${Array.from({length:13},(_,i)=>i+5).map(h=>`<option value="${h}" ${s.dayStart==h?'selected':''}>${pad(h)}:00</option>`).join('')}</select></div><div class="field"><label for="set_de">Cierra a las</label><select id="set_de" onchange="setSetting('dayEnd',+this.value)">${Array.from({length:12},(_,i)=>i+13).map(h=>`<option value="${h}" ${s.dayEnd==h?'selected':''}>${pad(h)}:00</option>`).join('')}</select></div></div><p class="muted small">Horas que se muestran en la vista de día y semana.</p>`,{sub:'Tu horario de trabajo.'})}
 ${card('Acerca de','info',`<p class="about-name">${esc(s.name||'Lilium Beauty')} <span class="h-mini">${ic('heartfill')}</span></p><p class="muted">Versión ${APP_VERSION}</p><button class="row-link" onclick="showWhatsNew()">${ic('sparkles')}<span><b>Novedades</b><small>Lo nuevo de esta versión</small></span>${ic('right')}</button>`,{stamp:'cisne'})}
 </div>`;
 return {head:pageHead('Ajustes','Personaliza la aplicación a tu gusto',['dama','avion']),body,searchPh:'Buscar clienta, cita o servicio…'};
}
function setSetting(k,v){A.settings[k]=v;save();if(k==='name')document.title=(v||'Lilium Beauty')+' · Tu espacio de uñas';if(['name','ownerName'].includes(k))render();toast('Guardado')}
function setCustomAccent(v){v=String(v).trim();if(!/^#?[0-9a-f]{6}$/i.test(v))return toast('Escribe un color como #F7C8D1');if(v[0]!=='#')v='#'+v;setSetting('accent',v.toLowerCase());applySettings();render()}
async function handleLogo(input){const f=input.files?.[0];if(!f)return;const d=await compressImage(f,600,.9);A.settings.brandLogo=d;save();applySettings();render();toast('Logo actualizado')}
async function handleOwnerPhoto(input){const f=input.files?.[0];if(!f)return;const d=await compressImage(f,300,.86);A.settings.ownerPhoto=d;save();render();toast('Foto actualizada')}
function hexMix(h,t,a){const p=x=>parseInt(x,16);const c=[1,3,5].map(i=>p(h.slice(i,i+2))),d=[1,3,5].map(i=>p(t.slice(i,i+2)));return '#'+c.map((v,i)=>Math.round(v+(d[i]-v)*a).toString(16).padStart(2,'0')).join('')}
let themeMQ=window.matchMedia?.('(prefers-color-scheme: dark)');
themeMQ?.addEventListener?.('change',()=>{if(A.settings.theme==='system')applySettings()});
function applySettings(){
 const s=A.settings,root=document.documentElement,c=/^#[0-9a-f]{6}$/i.test(s.accent)?s.accent:ACCENTS[0][0];
 const dark=s.theme==='dark'||(s.theme==='system'&&themeMQ?.matches);
 root.dataset.theme=dark?'dark':'light';
 root.style.setProperty('--accent',dark?hexMix(c,'#ffffff',.25):c);
 root.style.setProperty('--accent-2',dark?hexMix(c,'#ffffff',.45):hexMix(c,'#ffffff',.25));
 root.style.setProperty('--accent-deep',hexMix(c,'#000000',dark?.05:.22));
 document.body.classList.toggle('density-compact',s.density==='compact');
 let fav=document.querySelector('link[rel="icon"]');if(!fav){fav=document.createElement('link');fav.rel='icon';document.head.appendChild(fav)}fav.href=s.faviconData||'assets/lily.svg';
 const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=dark?'#0e0a0b':'#fbeee9';
}

/* PIN con teclado */
async function hashPin(p){const txt='lirio:'+p;try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(txt));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch{let h=2166136261;for(const ch of txt){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return 'f'+(h>>>0).toString(16)}}
async function checkPin(p){const s=A.settings;if(s.pinHash)return (await hashPin(p))===s.pinHash;return !!s.pin&&p===s.pin}
function keypadHtml(title,sub){return `<div class="keypad-wrap"><div class="kp-mark">${logoHtml()}</div><h2 class="modal-title center">${title}</h2><p class="sub center" id="kpSub">${sub}</p><div class="kp-dots" id="kpDots"></div><div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button onclick="kpPress('${n}')">${n}</button>`).join('')}<button class="kp-ok" onclick="kpPress('ok')" aria-label="Aceptar">${ic('check')}</button><button onclick="kpPress('0')">0</button><button onclick="kpPress('del')" aria-label="Borrar">${ic('left')}</button></div></div>`}
let kp={val:'',cb:null};
function kpDraw(){const d=document.getElementById('kpDots');if(d)d.innerHTML=Array.from({length:Math.max(4,kp.val.length)},(_,i)=>`<i class="${i<kp.val.length?'on':''}"></i>`).join('')}
function kpPress(k){if(k==='del')kp.val=kp.val.slice(0,-1);else if(k==='ok'){if(kp.val.length>=4)kp.cb?.(kp.val)}else if(kp.val.length<6){kp.val+=k;if(kp.auto&&kp.val.length>=4)kp.auto(kp.val)}kpDraw()}
function kpError(msg){kp.val='';kpDraw();const s=document.getElementById('kpSub');if(s){s.textContent=msg;s.classList.add('err')}const d=document.getElementById('kpDots');d?.classList.remove('shake');void d?.offsetWidth;d?.classList.add('shake')}
document.addEventListener('keydown',e=>{if(!document.getElementById('kpDots'))return;if(/^\d$/.test(e.key))kpPress(e.key);else if(e.key==='Backspace')kpPress('del');else if(e.key==='Enter')kpPress('ok')});
function setupPin(){
 let first='';kp={val:'',cb:null};
 openModal(keypadHtml('Nuevo PIN','Escribe de 4 a 6 cifras y pulsa ✓'),{cls:'small keypad-modal'});kpDraw();
 kp.cb=async v=>{if(!first){first=v;kp.val='';kpDraw();document.getElementById('kpSub').textContent='Repítelo para confirmar';return}
  if(v!==first){first='';return kpError('No coinciden. Empieza de nuevo')}
  A.settings.pinHash=await hashPin(v);delete A.settings.pin;A.settings.pinEnabled=true;ssSet(K.unlocked,'1');save();closeModal();render();toast('PIN activado')};
}
function disablePin(){kp={val:'',cb:null};openModal(keypadHtml('Quitar PIN','Escribe tu PIN actual'),{cls:'small keypad-modal'});kpDraw();
 kp.cb=async v=>{if(!await checkPin(v))return kpError('PIN incorrecto');A.settings.pinEnabled=false;A.settings.pinHash='';delete A.settings.pin;save();closeModal();render();toast('PIN desactivado')}}
function lockApp(){try{sessionStorage.removeItem(K.unlocked)}catch{}showLock()}
function showLock(){
 kp={val:'',cb:null};
 document.getElementById('modal-root').innerHTML='';
 document.getElementById('app').innerHTML=`<div class="lock-screen"><div class="lock-card">${keypadHtml(`Hola${A.settings.ownerName?', '+esc(A.settings.ownerName):''}`,'Escribe tu PIN')}</div><div class="login-art" aria-hidden="true"></div></div>`;kpDraw();
 const tryPin=async v=>{if(await checkPin(v)){if(!A.settings.pinHash){A.settings.pinHash=await hashPin(v);delete A.settings.pin;save()}ssSet(K.unlocked,'1');render();checkWhatsNew()}else if(v.length>=6||kp.cb===null)kpError('PIN incorrecto')};
 kp.cb=async v=>{if(!await checkPin(v))return kpError('PIN incorrecto');tryPin(v)};
 kp.auto=async v=>{if(await checkPin(v))tryPin(v)};
}


/* Nube */
function openCloud(){if(cloudUser)openCloudInfo();else openCloudLogin()}
function openCloudInfo(){
 const last=lsGet(K.lastSync);
 openModal(`<h2 class="modal-title">Nube y dispositivos</h2><p class="modal-text">${esc(cloudUser?.email||'')}</p><p><span class="sync-pill static">${syncPillHtml()}</span></p>${last?`<p class="hint">Último guardado en la nube: ${new Date(last).toLocaleString('es-ES')}.</p>`:''}${syncState==='error'&&lastSyncError?`<p class="hint err">${esc(lastSyncError)}</p>`:''}
 <p class="muted small">Con la misma cuenta en el PC y el móvil, los cambios de cada uno se juntan solos.</p>
 <div class="btn-row"><button class="btn" onclick="syncCloud('smart',false)">${ic('refresh')}Sincronizar ahora</button><button class="btn ghost" onclick="cloudLogout()">${ic('logout')}Cerrar sesión</button></div>
 <details class="more"><summary>Si algo no cuadra</summary><div class="btn-row"><button class="btn ghost small" onclick="forceSync('download')">${ic('download')}Usar lo de la nube</button><button class="btn ghost small" onclick="forceSync('upload')">${ic('upload')}Usar lo de este dispositivo</button></div></details>`,{cls:'small'});
}
async function forceSync(mode){const ok=await ask({title:mode==='download'?'¿Reemplazar este dispositivo con la nube?':'¿Reemplazar la nube con este dispositivo?',text:mode==='download'?'Lo que solo esté en este dispositivo se perderá.':'Lo que solo esté en la nube (por ejemplo, cambios hechos en el otro dispositivo) se perderá.',ok:'Reemplazar',danger:true});if(ok)syncCloud(mode,false)}
function openCloudLogin(){lsDel('lilium_offline');ssSet('lilium_login','1');render()}
// Seguridad: los datos de una cuenta nunca se ven sin iniciar sesión, ni aunque falle la conexión.
function needsLogin(){return !cloudUser&&(!!sb||!!lsGet('lilium_owner'))}
function markOwner(){if(cloudUser)lsSet('lilium_owner',cloudUser.id)}
function wipeLocal(){Object.values(STORE).forEach(lsDel);Object.values(K).forEach(lsDel);['lilium_owner','lilium_offline','lilium_forget'].forEach(lsDel);try{sessionStorage.clear()}catch{}}
function showLogin(){
 document.getElementById('modal-root').innerHTML='';
 document.getElementById('app').innerHTML=`<div class="login">
  <button class="theme-toggle fixed" onclick="toggleTheme();showLogin()" aria-label="Cambiar modo claro u oscuro"><span class="tt-sun">${ic('sun')}</span><span class="tt-moon">${ic('moon')}</span></button>
  <div class="login-art" aria-hidden="true"></div>
  <div class="login-stamps" aria-hidden="true">${stamp('flores','ls ls0',-9)}${stamp('cisne','ls ls1',7)}${stamp('nippon','ls ls2',-5)}${stamp('love','ls ls3',10)}${stamp('fresas','ls ls4',-7)}</div>
  <div class="login-center">
   <div class="login-logo">${logoHtml()}</div>
   <div class="login-tag"><span class="rule"></span>${ART.sparkle?'<span class="diamond">✧</span>':''}<span class="rule"></span></div>
   <p class="login-sub">${esc(A.settings.slogan||'Tu espacio de uñas')}</p>
   <form class="login-card" onsubmit="event.preventDefault();cloudLogin()">
    <div class="field with-ic"><span class="f-ic">${ic('mail')}</span><input id="cloudEmail" type="email" autocomplete="username" placeholder="Correo electrónico" required aria-label="Correo electrónico"></div>
    <div class="field with-ic"><span class="f-ic">${ic('lock')}</span><input id="cloudPassword" type="password" autocomplete="current-password" placeholder="Contraseña" required aria-label="Contraseña"><button type="button" class="eye" aria-label="Mostrar contraseña" onclick="const i=document.getElementById('cloudPassword');i.type=i.type==='password'?'text':'password';this.innerHTML=i.type==='password'?ART.icon('eyeoff'):ART.icon('eye')">${ic('eyeoff')}</button></div>
    <div class="login-row"><label class="check-inline"><input type="checkbox" id="remember" checked><span>Recordarme</span></label><button type="button" class="link" onclick="resetPassword()">¿Olvidaste tu contraseña?</button></div>
    <button id="cloudLoginBtn" class="btn wide grad">Iniciar sesión ${ic('arrow')}</button>
    ${sb?'':`<p class="login-warn">${ic('info')}No hay conexión con la nube. Comprueba internet y <button type="button" class="link" onclick="location.reload()">vuelve a intentarlo</button>.</p>`}
    <p class="login-foot">${ic('lock')}Acceso privado. Tus datos van cifrados y se guardan en la Unión Europea.</p>
    <p class="login-legal"><button type="button" class="link" onclick="openPrivacyInfo()">Privacidad</button> · <button type="button" class="link" onclick="openCookieInfo()">Cookies</button></p>
   </form>
  </div>
 </div>`;
}

async function cloudLogin(){
 if(!sb)return toast('La nube no está disponible');
 const email=document.getElementById('cloudEmail').value.trim(),password=document.getElementById('cloudPassword').value;
 if(!email||!password)return toast('Escribe correo y contraseña');
 const btn=document.getElementById('cloudLoginBtn');btn.disabled=true;btn.textContent='Entrando…';
 const {data,error}=await sb.auth.signInWithPassword({email,password});
 if(error){btn.disabled=false;btn.innerHTML='Iniciar sesión '+ic('arrow');return toast(/invalid/i.test(error.message)?'Correo o contraseña incorrectos':error.message)}
 const rem=document.getElementById('remember');if(rem&&!rem.checked){lsSet('lilium_forget','1');ssSet('lilium_alive','1')}else lsDel('lilium_forget');
 if(lsGet('lilium_owner')&&lsGet('lilium_owner')!==data.user.id){wipeLocal();lsSet('lilium_owner',data.user.id);location.reload();return}
 cloudUser=data.user;markOwner();closeModal();render();toast('Sesión iniciada');loadCatalog(true);await syncCloud('smart',false);render();checkWhatsNew();
}
async function resetPassword(){const email=document.getElementById('cloudEmail')?.value.trim();if(!email)return toast('Escribe primero tu correo');const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});toast(error?error.message:'Te hemos enviado un correo para cambiarla',4000)}
let pwRecovery=false;
function pwField(id,label,ac,hint=''){return `<div class="field pw"><label for="${id}">${label}</label><input id="${id}" type="password" autocomplete="${ac}" required><button type="button" class="eye" aria-label="Mostrar contraseña" onclick="const i=document.getElementById('${id}');i.type=i.type==='password'?'text':'password';this.innerHTML=ART.icon(i.type==='password'?'eyeoff':'eye')">${ic('eyeoff')}</button>${hint}</div>`}
function openNewPassword(recovery=false){
 pwRecovery=recovery===true;
 openModal(`<h2 class="modal-title">${pwRecovery?'Elige tu nueva contraseña':'Cambiar contraseña'}</h2><p class="modal-text">${pwRecovery?'Escribe la contraseña que quieras usar a partir de ahora.':'Por seguridad, primero escribe la contraseña que usas ahora.'}</p>
 <form onsubmit="event.preventDefault();saveNewPassword()">${pwRecovery?'':pwField('curPass','Contraseña actual','current-password')}${pwField('newPass','Contraseña nueva','new-password','<div class="pw-meter" id="pwMeter"><i></i><span></span></div>')}${pwField('newPass2','Repite la contraseña nueva','new-password')}
 <p class="hint">Mínimo 8 caracteres. Mejor si mezclas letras, números y algún símbolo.</p>
 <p class="form-err" id="pwErr" role="alert"></p>
 <div class="modal-actions">${pwRecovery?'':'<button type="button" class="btn ghost" onclick="closeModal()">Cancelar</button>'}<button class="btn" id="pwBtn">${ic('lock')}Guardar contraseña</button></div></form>`,{cls:'small'});
 const np=document.getElementById('newPass');np.addEventListener('input',()=>{const v=np.value;let s=0;if(v.length>=8)s++;if(v.length>=12)s++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;const m=document.getElementById('pwMeter');m.dataset.s=Math.min(4,s);m.querySelector('span').textContent=v?['Muy débil','Débil','Aceptable','Buena','Muy buena'][Math.min(4,s)]:''});
}
async function saveNewPassword(){
 const g=id=>document.getElementById(id)?.value||'';const err=document.getElementById('pwErr');const btn=document.getElementById('pwBtn');err.textContent='';
 const p=g('newPass'),p2=g('newPass2');
 if(p.length<8)return err.textContent='La contraseña nueva debe tener al menos 8 caracteres.';
 if(p!==p2)return err.textContent='Las dos contraseñas nuevas no coinciden.';
 if(!sb||!cloudUser)return err.textContent='Necesitas tener la sesión iniciada.';
 btn.disabled=true;
 try{
  if(!pwRecovery){
   const cur=g('curPass');if(!cur){btn.disabled=false;return err.textContent='Escribe tu contraseña actual.'}
   if(cur===p){btn.disabled=false;return err.textContent='La nueva contraseña tiene que ser distinta de la actual.'}
   const {error:e1}=await sb.auth.signInWithPassword({email:cloudUser.email,password:cur});
   if(e1){btn.disabled=false;return err.textContent='La contraseña actual no es correcta.'}
  }
  const {error}=await sb.auth.updateUser({password:p});
  if(error){btn.disabled=false;return err.textContent=/same|different/i.test(error.message)?'La nueva contraseña tiene que ser distinta de la actual.':/weak|pwned|leak/i.test(error.message)?'Esa contraseña es demasiado fácil o ha aparecido en filtraciones. Elige otra.':error.message}
  pwRecovery=false;closeModal();toast('Contraseña cambiada. Úsala la próxima vez que entres.',3500);
 }catch(e){btn.disabled=false;err.textContent='No se pudo cambiar: revisa la conexión.'}
}
async function cloudLogout(){if(!sb||!cloudUser)return;if(!await ask({title:'¿Cerrar sesión?',text:'Por seguridad se borrará la copia de este dispositivo. Todo sigue guardado en tu cuenta y vuelve al iniciar sesión.',ok:'Cerrar sesión'}))return;
 await syncCloud('smart',true);
 if(syncState!=='ok'&&!await ask({title:'No se pudo guardar lo último en la nube',text:'Si cierras sesión ahora podrías perder los cambios más recientes de este dispositivo.',ok:'Cerrar igualmente',danger:true}))return;
 try{await sb.auth.signOut()}catch{}cloudUser=null;wipeLocal();location.hash='home';location.reload()}

/* Datos */
function exportData(){const stamp=new Date().toLocaleString('es-ES');A.settings.lastBackup=stamp;save();const payload={app:'manicure',version:APP_VERSION,createdAt:new Date().toISOString(),clients:A.clients,services:A.services,appointments:A.appointments,expenses:A.expenses,tasks:A.tasks,settings:{...A.settings,pinHash:'',pin:undefined},trash:A.trash};const blob=new Blob([JSON.stringify(payload,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`manicure-copia-${todayKey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);render();toast('Copia descargada')}
function importData(input){const f=input.files?.[0];if(!f)return;const r=new FileReader();r.onload=async()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.clients)||!Array.isArray(d.appointments))throw new Error();
 if(!await ask({title:'¿Restaurar esta copia?',text:`Contiene ${plural(d.clients.length,'clienta','clientas')} y ${plural(d.appointments.length,'cita','citas')}. Reemplazará lo que hay ahora en este dispositivo${cloudUser?' y en la nube':''}.`,ok:'Restaurar',danger:true}))return;
 const pinKeep={pinEnabled:A.settings.pinEnabled,pinHash:A.settings.pinHash};
 const nd=normalizeData({clients:d.clients,services:d.services||A.services,appointments:d.appointments,expenses:d.expenses||[],tasks:d.tasks||[],settings:{...(d.settings||{}),...pinKeep},trash:d.trash||{}});
 const now=new Date().toISOString();COLLS.forEach(k=>nd[k].forEach(x=>x.updatedAt=now));nd.settings.updatedAt=now;
 COLLS.flatMap(k=>A[k]).forEach(x=>{if(!COLLS.flatMap(k=>nd[k]).some(y=>y.id===x.id))nd.trash.removed[x.id]=now});
 Object.assign(A,nd);stampAll(true);save();applySettings();render();toast('Copia restaurada')}catch{toast('Ese archivo no es una copia válida')}};r.readAsText(f)}
async function resetApp(){if(!await ask({title:'¿Eliminar los datos de este dispositivo?',text:cloudUser?'Se cerrará la sesión. Tus datos siguen en la nube.':'No se puede deshacer. Te recomiendo descargar antes una copia.',ok:'Borrar',danger:true}))return;if(sb&&cloudUser)await sb.auth.signOut();Object.values(STORE).forEach(lsDel);Object.values(K).forEach(lsDel);location.hash='home';location.reload()}
function openTrash(){
 const groups=[['clients','Clientas'],['appointments','Citas'],['services','Servicios']];
 const label=(k,x)=>k==='appointments'?`${esc(x.client)} · ${esc(x.service)}<small>${fmtShort(x.date)}, ${x.time}</small>`:`${esc(x.name)}${k==='services'?`<small>${money0(x.price)}</small>`:''}`;
 openModal(`<h2 class="modal-title">Papelera</h2><p class="modal-text">Recupera lo que hayas eliminado.</p>${groups.map(([k,l])=>`<h3 class="group-title">${l}<span class="sub">${A.trash[k].length}</span></h3>${A.trash[k].length?`<ul class="rows trash">${A.trash[k].map((x,i)=>({x,i})).reverse().map(({x,i})=>`<li><span><b>${label(k,x)}</b></span><span class="sub small">${x.deletedAt?'Eliminado el '+fmtShort(x.deletedAt.slice(0,10)):''}</span><button class="btn ghost small" onclick="restoreTrash('${k}',${i})">Recuperar</button></li>`).join('')}</ul>`:'<p class="panel-note">Vacía.</p>'}`).join('')}${A.trash.clients.length+A.trash.appointments.length+A.trash.services.length?`<div class="modal-actions"><button class="btn danger" onclick="emptyTrash()">Vaciar papelera</button></div>`:''}`,{cls:'trash-modal'});
}
function restoreTrash(k,i){const item=A.trash[k][i];if(!item)return;const copy={...item};delete copy.deletedAt;copy.updatedAt=new Date().toISOString();delete A.trash.removed[copy.id];A[k]=A[k].filter(x=>x.id!==copy.id);A[k].push(copy);A.trash[k].splice(i,1);save();openTrash();render();toast('Recuperado')}
async function emptyTrash(){if(!await ask({title:'¿Vaciar la papelera?',text:'Lo que hay en ella se borrará para siempre.',ok:'Vaciar',danger:true}))return;A.trash.clients.forEach(c=>(c.photos||[]).forEach(removeCloudPhoto));A.trash.clients=[];A.trash.services=[];A.trash.appointments=[];save();render();toast('Papelera vaciada')}


/* Novedades */
function showWhatsNew(){
 openModal(`<div class="news-logo">${logoHtml()}</div><h2 class="modal-title center">Novedades · versión ${APP_VERSION}</h2>
 <ul class="news">
  <li><b>Catálogo de inspiración:</b> sube fotos de tus diseños (varias a la vez), sin precio y con nombre solo si quieres. Tus clientas pulsan «Me interesa» y te llega aquí.</li>
  <li><b>Diseño propio:</b> tus clientas pueden pedirte un diseño a su estilo, con fotos de referencia, desde la web.</li>
  <li><b>Más seguridad:</b> sin iniciar sesión no se ve ningún dato, y al cerrar sesión se borra la copia del dispositivo.</li>
  <li><b>Protección de datos (RGPD):</b> aviso de privacidad para tus clientas, registro de su permiso, descarga y borrado definitivo de sus datos, en Ajustes › Privacidad.</li>
  <li><b>Datos legales del catálogo:</b> rellénalos en Catálogo › Datos de contacto para que tu web cumpla la ley.</li>
  <li><b>Diseño Lilium Beauty</b> en modo claro y oscuro, con tu logo y tus colores.</li>
  <li><b>Finanzas:</b> apunta gastos y mira ingresos, beneficio y servicios más rentables.</li>
  <li><b>Ficha de clienta nueva:</b> foto de perfil, estado, preferencias, tallas sobre cada dedo e historial de gasto.</li>
  <li><b>Pendientes y recordatorios</b> en el inicio, y avisos de mañana por WhatsApp con un toque.</li>
  <li><b>PC y móvil sin perder cambios:</b> si editas en los dos, los cambios se juntan.</li>
  <li><b>Fotos más ligeras</b> que ya no dejan de verse con el tiempo.</li>
  <li><b>Instálala en el móvil</b> desde el navegador con «Añadir a pantalla de inicio».</li>
 </ul><div class="modal-actions"><button class="btn" onclick="markWhatsNewSeen()">Entendido</button></div>`,{cls:'news-modal',onClose:()=>markWhatsNewSeen(false)});
}
function markWhatsNewSeen(close=true){lsSet(K.whatsnew,APP_VERSION);document.querySelector('.news-bell')?.classList.remove('has-news');if(close)closeModal()}
function checkWhatsNew(){if(lsGet(K.whatsnew)!==APP_VERSION&&!needsLogin())setTimeout(showWhatsNew,600)}

/* Arranque */
function bootApp(){
 try{applySettings();
  if(A.settings.pinEnabled&&(A.settings.pinHash||A.settings.pin)&&ssGet(K.unlocked)!=='1')return showLock();
  render();checkWhatsNew();
 }catch(err){console.error('Error al iniciar:',err);document.getElementById('app').innerHTML=`<div class="crash"><h1>No se ha podido abrir la aplicación</h1><p>Recarga la página. Tus datos siguen guardados.</p><details><summary>Detalles técnicos</summary><pre>${esc(err?.stack||err?.message||String(err))}</pre></details></div>`}
}
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
initCloud().then(async()=>{if(cloudUser&&lsGet('lilium_forget')==='1'&&ssGet('lilium_alive')!=='1'){try{await sb.auth.signOut()}catch{}cloudUser=null;wipeLocal();location.reload();return}markOwner()}).finally(()=>{bootApp();if(cloudUser){syncCloud('smart',true);loadCatalog()}});
