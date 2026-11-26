const CACHE='say-table-pro-v3';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const nav=e.request.mode==='navigate'||(e.request.headers.get('accept')||'').includes('text/html');
 if(nav){
  // Network first so new uploads show up, but fall back to the saved copy when offline or the connection is slow (4s).
  e.respondWith(new Promise(resolve=>{
   let done=false;
   const useCache=()=>caches.match('./index.html').then(r=>{if(r&&!done){done=true;resolve(r);}return r;});
   const timer=setTimeout(useCache,4000);
   fetch(e.request).then(res=>{
    clearTimeout(timer);
    if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));}
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
