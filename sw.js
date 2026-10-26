/* Lilium · funcionamiento sin conexión */
const CACHE='lilium-v25-4';
const SHELL=['./','index.html','style.css?v=25','art.js?v=25','js/core.js?v=25','js/ui.js?v=25','js/home.js?v=25','js/clients.js?v=25','js/agenda.js?v=25','js/finance.js?v=25','js/catalog.js?v=28','js/settings.js?v=25','js/privacy.js?v=25','manifest.webmanifest','assets/lily.svg','assets/art/logo.webp','assets/art/logo-dark.webp','assets/art/lily-light.jpg','assets/stamps/flores.webp','assets/stamps/botanical.webp','assets/stamps/shillings.webp','assets/stamps/love.webp','assets/stamps/gato.webp','assets/stamps/cisne.webp','assets/stamps/dama.webp','assets/stamps/danmark.webp','assets/stamps/nippon.webp','assets/stamps/mariposa.webp','assets/stamps/ciruelo.webp','assets/stamps/rosa.webp','assets/stamps/lirios.webp','assets/stamps/puente.webp','assets/stamps/fresas.webp','assets/stamps/avion.webp','assets/art/swan-dark.jpg','assets/art/login-light.jpg','assets/art/login-dark.jpg','assets/icon-192.png','assets/hand_left_panel.jpg','assets/hand_right_panel.jpg','assets/shape_round.png','assets/shape_square.png','assets/shape_coffin.png','assets/shape_almond.png','assets/shape_stiletto.png','assets/len1.png','assets/len2.png','assets/len3.png','assets/len4.png','assets/len5.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.hostname.endsWith('supabase.co'))return; // datos y fotos: siempre en vivo
 const cdn=/fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.hostname);
 if(cdn){e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res})));return}
 if(url.origin!==location.origin)return;
 if(url.pathname.startsWith('/catalogo/'))return; // el catálogo es otra web con su propio service worker
 // Primero la red (para recibir actualizaciones); si no hay conexión, la copia guardada
 e.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req,{ignoreSearch:false}).then(hit=>hit||caches.match('index.html'))));
});
