/* Folio art and app mode (4.0): shared by the shelf and every play, loaded in <head> after theme.js.
   folio-mode: simple | full. Decided once: anyone with saved reading (folio-stat-*, folio-last, folio-hint) stays Full; a new reader starts Simple.
   Graphics are inline SVG drawn from data each page already has: wax seals, cast medallions, act title plates, the stage picture frame.
   Levels: seals across every play (a red seal per scene read, a gilt one when a scene's quests are done). */
(function(){
  var get=function(k){try{return localStorage.getItem(k)}catch(e){return null}},set=function(k,v){try{localStorage.setItem(k,v)}catch(e){}};
  var root=document.documentElement;
  window.folioMode=function(){var m=get("folio-mode");if(m==="simple"||m==="full")return m;var old=false;
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i)||"";if(/^folio-(stat-.+|last|hint)$/.test(k)){old=true;break}}}catch(e){}
    m=old?"full":"simple";set("folio-mode",m);return m};
  window.folioSimple=function(){return folioMode()==="simple"};
  window.folioSetMode=function(m){set("folio-mode",m==="simple"?"simple":"full");root.classList.toggle("simple",m==="simple")};
  root.classList.toggle("simple",folioMode()==="simple");

  /* levels: [seals needed, name, what it means] */
  window.FOLIO_LEVELS=[[0,"Groundling","Standing in the yard, close to the stage"],[10,"Hired Man","Taken on by the company for the season"],[40,"Player","A speaking part on the stage"],[120,"Sharer","A share in the company and its plays"],[300,"Master of the Revels","Every play passes through your hands"]];
  window.folioLevel=function(n){var L=FOLIO_LEVELS,i=0;n=Math.max(0,n|0);while(i+1<L.length&&n>=L[i+1][0])i++;var nx=L[i+1];
    return {i:i,name:L[i][1],line:L[i][2],n:n,next:nx?nx[1]:"",need:nx?nx[0]-n:0,frac:nx?(n-L[i][0])/(nx[0]-L[i][0]):1}};
  /* seals in one play's saved progress (<prefix>prog): done scenes + scenes whose quests are all done (qst[s].g) */
  window.folioSealsOf=function(pr){if(!pr||typeof pr!=="object")return 0;var n=0,k;for(k in pr.done||{})if(pr.done[k])n++;for(k in pr.qst||{})if(pr.qst[k]&&pr.qst[k].g)n++;return n};

  var R=function(n){return Math.round(n*10)/10};
  /* wax: a scalloped disc */
  var BLOB=(function(){var n=14,d="";for(var i=0;i<n;i++){var a0=i*2*Math.PI/n,a1=(i+.5)*2*Math.PI/n,a2=(i+1)*2*Math.PI/n;
    if(!i)d+="M"+R(50+44*Math.cos(a0))+" "+R(50+44*Math.sin(a0));d+="Q"+R(50+51*Math.cos(a1))+" "+R(50+51*Math.sin(a1))+" "+R(50+44*Math.cos(a2))+" "+R(50+44*Math.sin(a2))}return d+"Z"})();
  var DEFS='<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'+
    '<radialGradient id="fwx" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#d4473d"/><stop offset=".55" stop-color="#a5221d"/><stop offset="1" stop-color="#6c1110"/></radialGradient>'+
    '<linearGradient id="fgl" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fff1c4"/><stop offset=".45" stop-color="#e6bf62"/><stop offset=".8" stop-color="#b9862a"/><stop offset="1" stop-color="#f0d48a"/></linearGradient></defs></svg>';
  var defs=function(){if(!document.body||document.getElementById("fart-defs"))return;var d=document.createElement("div");d.id="fart-defs";d.innerHTML=DEFS;document.body.prepend(d)};
  document.addEventListener("DOMContentLoaded",defs);
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})};

  /* a wax seal. kind: "" red (scene read), "g" gilt rim (quests done), "e" empty slot, "n" empty slot for where you are */
  window.folioSeal=function(t,kind,cls){defs();t=esc(t);cls=cls?" "+cls:"";
    if(kind==="e"||kind==="n")return '<svg class="seal e'+(kind==="n"?" now":"")+cls+'" viewBox="0 0 100 100" aria-hidden="true"><circle class="se" cx="50" cy="50" r="38"/><text class="st" x="50" y="51" text-anchor="middle" dominant-baseline="central">'+t+'</text></svg>';
    return '<svg class="seal'+(kind==="g"?" g":"")+cls+'" viewBox="0 0 100 100" aria-hidden="true"><path class="wx" d="'+BLOB+'"/><circle class="wr" cx="50" cy="50" r="32"/><circle class="wr2" cx="50" cy="50" r="27.5"/>'+
      '<path class="wh" d="M27 36A27 27 0 0 1 46 22"/><text class="st" x="50" y="51" text-anchor="middle" dominant-baseline="central">'+t+'</text></svg>'};

  /* a cast medallion: laurel ring, a disc in the character's colour, their initials */
  var LAUREL=(function(){var s="";for(var i=0;i<22;i++){var a=(i/22)*2*Math.PI-Math.PI/2,x=50+42.5*Math.cos(a),y=50+42.5*Math.sin(a),t=a*180/Math.PI+90+(i%2?28:-28);
    s+='<ellipse cx="'+R(x)+'" cy="'+R(y)+'" rx="5" ry="2.1" transform="rotate('+R(t)+' '+R(x)+' '+R(y)+')"/>'}return s})();
  window.folioInitials=function(name){var w=String(name||"").replace(/^the\s+/i,"").split(/[\s-]+/).filter(function(x){return x&&!/^(of|and|the|de|la|le|du|von)$/i.test(x)});
    return ((w[0]||"?").replace(/[^A-Za-z]/g,"").charAt(0)+(w[1]?w[1].replace(/[^A-Za-z]/g,"").charAt(0):"")).toUpperCase()||"?"};
  window.folioMedal=function(name,col,cls){defs();var c=/^#[0-9a-f]{3,8}$|^var\(--[a-z-]+\)$/i.test(col||"")?col:"var(--ink)";
    return '<svg class="medal'+(cls?" "+cls:"")+'" viewBox="0 0 100 100" aria-hidden="true" style="--mc:'+c+'"><circle class="mo" cx="50" cy="50" r="48"/><g class="ml">'+LAUREL+'</g><circle class="md" cx="50" cy="50" r="33"/><circle class="mi" cx="50" cy="50" r="29.5"/><text class="mt" x="50" y="52" text-anchor="middle" dominant-baseline="central">'+esc(folioInitials(name))+'</text></svg>'};

  /* an act title plate: Latin heading, a large numeral, the plain name */
  window.folioPlate=function(lat,num,sub,cls){return '<div class="aplate'+(cls?" "+cls:"")+'"><svg class="apf" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><path class="ap1" d="M12 2H288L298 12V88L288 98H12L2 88V12Z"/><path class="ap2" d="M16 7H284L293 16V84L284 93H16L7 84V16Z"/></svg>'+
    '<span class="apl">'+esc(lat)+'</span><b class="apn"><span aria-hidden="true">❧</span>'+esc(num)+'<span aria-hidden="true" class="apr">❧</span></b><span class="aps">'+esc(sub)+'</span></div>'};

  /* the stage picture, large: a proscenium with curtains, the play's setting drawing (a 40×40 line picture) on the stage */
  var CURT='<path class="cu" d="M10 14H70C64 36 52 64 34 86C26 96 18 108 10 116Z"/><path class="cf" d="M24 16C26 48 22 82 14 110M40 16C40 44 34 70 22 98M56 16C54 38 46 58 34 82"/>';
  window.folioStage=function(pic,label,cls){var cap=label?'<figcaption>'+esc(label)+'</figcaption>':"";
    return '<figure class="stage'+(cls?" "+cls:"")+'"><svg viewBox="0 0 320 150" aria-hidden="true">'+
      '<rect class="sb" x="10" y="12" width="300" height="114"/><path class="fl" d="M10 126H310M40 126L22 146M100 126L94 146M160 126V146M220 126L226 146M280 126L298 146M4 146H316"/>'+
      '<svg x="110" y="30" width="100" height="100" viewBox="0 0 40 40" class="sp">'+(pic||"")+'</svg>'+
      CURT+'<g transform="matrix(-1 0 0 1 320 0)">'+CURT+'</g>'+
      '<path class="pe" d="M6 6H314V18Q300 26 286 18Q272 26 258 18Q244 26 230 18Q216 26 202 18Q188 26 174 18Q160 26 146 18Q132 26 118 18Q104 26 90 18Q76 26 62 18Q48 26 34 18Q20 26 6 18Z"/>'+
      '<path class="ar" d="M3 148V4H317V148"/>'+
      '<g class="ft"><circle cx="70" cy="131" r="1.6"/><circle cx="110" cy="131" r="1.6"/><circle cx="150" cy="131" r="1.6"/><circle cx="190" cy="131" r="1.6"/><circle cx="230" cy="131" r="1.6"/><circle cx="250" cy="131" r="1.6"/><circle cx="90" cy="131" r="1.6"/><circle cx="130" cy="131" r="1.6"/><circle cx="170" cy="131" r="1.6"/><circle cx="210" cy="131" r="1.6"/></g>'+
      '</svg>'+cap+'</figure>'};

  /* the level badge: a medallion with the level's numeral */
  window.folioLevelBadge=function(n,cls){var L=folioLevel(n);return folioSeal(["I","II","III","IV","V"][L.i],L.i>=3?"g":"",cls||"lvb")};
})();
