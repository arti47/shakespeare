/* Folio updater: one service worker for the shelf and every play.
   Checks for a new build on load, when the app comes back to the foreground and every 30 min;
   when a new build takes over it reloads (if the page is hidden) or offers "Updated - tap to reload". */
(function(){
  if(!("serviceWorker" in navigator))return;
  var me=document.currentScript&&document.currentScript.src||"",root=new URL("./",me||location.href).href;
  var sw=navigator.serviceWorker,had=!!sw.controller,reloading=false,reg=null;
  function reload(){if(reloading)return;reloading=true;location.reload()}
  function toast(){
    if(document.getElementById("folio-upd"))return;
    var b=document.createElement("button");b.id="folio-upd";b.type="button";
    b.textContent="Folio updated · tap to reload";
    b.setAttribute("style","position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:9999;"+
      "font:600 16px/1.2 'Instrument Sans',system-ui,sans-serif;padding:14px 22px;border-radius:999px;border:0;cursor:pointer;"+
      "background:#111215;color:#f3f1ec;box-shadow:0 8px 24px rgba(0,0,0,.35);max-width:92vw");
    b.onclick=reload;document.body.appendChild(b);
  }
  sw.addEventListener("controllerchange",function(){if(!had){had=true;return}if(document.hidden)reload();else toast()});
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible"&&reg)reg.update().catch(function(){});
    if(document.visibilityState==="hidden"&&document.getElementById("folio-upd"))reload()});
  addEventListener("load",function(){
    sw.getRegistrations().then(function(rs){rs.forEach(function(r){if(r.scope!==root)r.unregister()})}).catch(function(){});
    sw.register(root+"sw.js",{scope:root,updateViaCache:"none"}).then(function(r){reg=r;r.update().catch(function(){});
      setInterval(function(){r.update().catch(function(){})},30*60*1000)}).catch(function(){});
  });
})();
