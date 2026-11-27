const CACHE='say-table-pro-v7';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
const WAIT_MS=20000; // how long to wait for the network before showing the saved copy
self.addEventListener('install',e=>{
 // cache:'reload' = always take the newest files from the server, not the browser's old copy
 e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(u=>fetch(new Request(u,{cache:'reload'})).then(r=>{if(r.ok)return c.put(u,r);}).catch(()=>{})))));
 self.skipWaiting();
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
 self.clients.claim();
});
function tellPages(msg){self.clients.matchAll({includeUncontrolled:true}).then(cs=>cs.forEach(c=>{try{c.postMessage(msg);}catch(x){}}));}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const nav=e.request.mode==='navigate'||(e.request.headers.get('accept')||'').includes('text/html');
 if(nav){
  // Network first (newest version). If the network is slow (20s) or offline, show the saved copy.
  e.respondWith(new Promise(resolve=>{
   let done=false,usedCache=false;
   const useCache=()=>caches.match('./index.html').then(r=>{if(r&&!done){done=true;usedCache=true;resolve(r);}return r;});
   const timer=setTimeout(useCache,WAIT_MS);
   fetch(e.request,{cache:'no-cache'}).then(res=>{
    clearTimeout(timer);
    if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp)).then(()=>{if(usedCache)tellPages({type:'say-table-new-version'});});}
    if(!done){done=true;resolve(res);}
   }).catch(()=>{clearTimeout(timer);useCache().then(r=>{if(!r&&!done){done=true;resolve(Response.error());}});});
  }));
  return;
 }
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
  if(res.ok&&new URL(e.request.url).origin===location.origin){const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
  return res;
 }).catch(()=>caches.match(e.request))));
});
