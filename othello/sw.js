const C="othello-b1c03263",F=["./", "index.html", "fonts.css", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon-maskable.png", "fonts/046090ca20.woff2", "fonts/284bb947c5.woff2", "fonts/2ab8100f02.woff2", "fonts/40cc5d41cc.woff2", "fonts/89041f5bc8.woff2", "fonts/b2d7cad803.woff2", "fonts/dc19a5199f.woff2"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);
  const html=e.request.mode==="navigate"||u.pathname.endsWith("/")||u.pathname.endsWith(".html");
  if(html){e.respondWith(fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match("index.html"))));return}
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res})))});
