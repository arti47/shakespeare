/* Folio reader: shared by every play. Each play page loads <play>/play.js first (CFG + content consts:
   DATA, STUDY, PARTS, QUOTES, EX, EXT, MAINS, COLORS, PICS), then this file. */
const partsOf=it=>PARTS[it.id]||[[0,it.lines.length-1,it.m]];
const SOLO=EX.solo;
const roman={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12,XIII:13,XIV:14,XV:15}, R=["","I","II","III","IV","V"];
const LAT=["Inductio","Actus Primus","Actus Secundus","Actus Tertius","Actus Quartus","Actus Quintus"],SL={I:"Scena Prima",II:"Scena Secunda",III:"Scena Tertia",IV:"Scena Quarta",V:"Scena Quinta",VI:"Scena Sexta",VII:"Scena Septima",VIII:"Scena Octava",IX:"Scena Nona",X:"Scena Decima",XI:"Scena Undecima",XII:"Scena Duodecima",XIII:"Scena Tertia Decima",XIV:"Scena Quarta Decima",XV:"Scena Quinta Decima"};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const title=w=>String(w||"").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/(.) (Of|And|The) /g,(m,a,b)=>a+" "+b.toLowerCase()+" ");
const $=id=>document.getElementById(id);
const PLAY=CFG.id,PFX=CFG.prefix,FSH={};
/* 4.4: the play's cloth colour for enamel roundels */
try{if(typeof coverColor==="function")document.documentElement.style.setProperty("--cc",coverColor(PLAY))}catch(e){}
["lh","clean","onehand","show","size","theme","sumon","turn","beats","fit","mkview"].forEach(k=>FSH[PFX+k]=1);
const LS={key(k){return FSH[k]?"folio-"+k.slice(PFX.length):k},get(k){try{const v=localStorage.getItem(LS.key(k));return v!==null?v:localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(LS.key(k),v)}catch(e){}}};
LS.set("folio-last",PLAY);
/* before 2.9.0 shared settings from plays whose prefix isn't 4 characters (lear-, tn-) were saved under a wrong key ("folio--theme", "folio-heme"): move them over once */
if(PFX.length!==4)try{for(const k in FSH){const bad="folio-"+k.slice(4),good=LS.key(k),v=localStorage.getItem(bad);if(v!==null&&bad!==good){if(localStorage.getItem(good)===null)localStorage.setItem(good,v);localStorage.removeItem(bad)}}}catch(e){}
const wide=()=>innerWidth>=760;
function toast(t,undo){const el=$("toast");el.textContent=t;if(undo){const b=document.createElement("button");b.type="button";b.className="tundo";b.textContent="Undo";b.onclick=()=>{el.hidden=true;undo()};el.appendChild(b)}el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,undo?5000:2200)}

/* ---------- data ---------- */
const scenes=[], speech={}, whoSet=new Set();
{let cur=null,n=0;
for(const it of DATA){
  if(it.t==="scene"){n=0;cur={id:`a${it.act}s${roman[it.scene]}`,act:it.act,sc:roman[it.scene],scene:it.scene,loc:it.loc||"",items:[]};scenes.push(cur);}
  else{if(it.t==="sp"){it.page=cur.id;it.start=n+1;n+=it.lines.length;speech[it.id]=it;if(it.who)whoSet.add(it.who);}cur.items.push(it);}
}}
const sIdx=id=>scenes.findIndex(p=>p.id===id);
/* act 0 = an Induction before Act 1 (The Taming of the Shrew); ACTS lists the acts a play has, in order */
const AN=a=>a?"Act "+R[a]:"Induction", ACTS=[...new Set(scenes.map(p=>p.act))].sort((a,b)=>a-b);
const sName=p=>`${AN(p.act)}, Scene ${p.scene.toLowerCase()}`;
const shortLoc=p=>p.loc.split(/[.;]/)[0];
const firstSentence=t=>(t||"").split(/(?<=\.)\s/)[0];
const G=STUDY.gloss, gkeys=Object.keys(G).sort((a,b)=>b.length-a.length), gmap={};gkeys.forEach(k=>gmap[k.toLowerCase()]=k);
const gre=new RegExp("(^|[^A-Za-z'])("+gkeys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")(?![A-Za-z])","gi");
function gloss(text){return esc(text).replace(gre,(m,pre,w)=>{const k=gmap[w.toLowerCase()];return k?`${pre}<abbr class="g">${w}</abbr>`:m})}
function glossList(sp){const found=new Set();sp.lines.join(" ").replace(gre,(m,pre,w)=>{const k=gmap[w.toLowerCase()];if(k)found.add(k);return m});return [...found]}
const CH={};STUDY.chars.forEach(c=>CH[c.name.toUpperCase().replace(/^THE /,"").replace(" OF VENICE","")]=c);
const QBY={};QUOTES.quotes.forEach((q,i)=>{q.i=i;(QBY[q.id]=QBY[q.id]||[]).push(q)});
/* key-quote line marks (3.1): the line where each key quote starts, "<speech>:<line>" -> quote indexes */
const KQL={};{const nz=x=>x.toLowerCase().replace(/[^a-z ]/g,"").replace(/\s+/g," ").trim();
  QUOTES.quotes.forEach(q=>{const sp=speech[q.id];if(!sp)return;const w=nz(q.text).split(" "),L=sp.lines.map(nz),ends=[];let all="";
    L.forEach(l=>{all+=(all?" ":"")+l;ends.push(all.length)});let j=0;
    for(const n of [4,3,2]){const at=all.indexOf(w.slice(0,n).join(" "));if(at>=0){j=ends.findIndex(e=>e>at);break}}
    j=Math.max(0,j);(KQL[q.id+":"+j]=KQL[q.id+":"+j]||[]).push(q.i)})}
const sceneOf=id=>scenes[sIdx(speech[id].page)];
const pageWords=p=>p.items.reduce((n,it)=>n+(it.t==="sp"?it.lines.join(" ").split(/\s+/).length:0),0);

/* ---------- saved state: marks + progress (this device, and in backups) ---------- */
let marks={},prog={done:{},quiz:{},cards:{}};
try{marks=JSON.parse(LS.get(PFX+"marks")||"{}")}catch(e){}if(!marks||typeof marks!=="object"||Array.isArray(marks))marks={};
for(const k in marks){const v=marks[k];if(!v||typeof v!=="object")delete marks[k];else{if(v.note!=null&&typeof v.note!=="string")v.note=String(v.note);/* 4.12.1: a record with no ink, note or theme tag is empty (old saves, backups): drop it */if(!v.hl&&!(v.note&&v.note.trim())&&!(Array.isArray(v.th)&&v.th.length))delete marks[k]}}
/* favourite phrases: a run of words in one speech's original lines, this device (and in backups).
   {id, a:[line,word], b:[line,word], txt, note, t}; line = index into the speech's lines, word = index of a non-space run */
let FAV=[];try{FAV=JSON.parse(LS.get(PFX+"fav")||"[]")}catch(e){}if(!Array.isArray(FAV))FAV=[];
FAV=FAV.filter(f=>f&&Array.isArray(f.a)&&Array.isArray(f.b)&&f.a.length===2&&f.b.length===2&&[...f.a,...f.b].every(Number.isInteger));
const saveFav=()=>LS.set(PFX+"fav",JSON.stringify(FAV));
const favSort=()=>FAV.sort((x,y)=>x.id-y.id||x.a[0]-y.a[0]||x.a[1]-y.a[1]||x.b[0]-y.b[0]||x.b[1]-y.b[1]);
/* 4.12 Marks: five inks shared by speech marks (marks[id].hl) and phrases (FAV[].c). Names are renameable for every play (folio-inks) */
const INK=["y","r","b","g","v"],INKC={y:"Yellow",r:"Rose",b:"Blue",g:"Green",v:"Violet"},INKD={y:"Evidence",r:"Favourite",b:"Confusing",g:"Theme",v:"Language"};
let INKN={};try{const o=JSON.parse(LS.get("folio-inks")||"{}");if(o&&typeof o==="object")for(const k of INK)if(typeof o[k]==="string"&&o[k].trim())INKN[k]=o[k].trim().slice(0,20)}catch(e){}
const inkName=k=>INKN[k]||INKD[k]||"",fcOk=c=>INK.includes(c)?c:"r";
const HL2INK={ev:"y",fav:"r",cf:"b",th:"g",lg:"v"},INK2HL={y:"ev",r:"fav",b:"cf",g:"th",v:"lg"};
/* stored values come from this device or an imported backup: only known keys reach the page */
const hlOf=m=>{const h=m.hl===true?"ev":m.hl;return HL2INK[h]?h:""},inkOf=m=>HL2INK[hlOf(m)]||"";
let SEL=null;/* words being selected on the page: {id,a,b,anc,drag,edit,whole,hd} */
const lineWords=l=>String(l).replace(/^~/,"").split(/\s+/).filter(Boolean);
function favText(id,a,b){const sp=speech[id];if(!sp)return "";const out=[];for(let l=a[0];l<=b[0];l++){const w=lineWords(sp.lines[l]||"");out.push(w.slice(l===a[0]?a[1]:0,l===b[0]?b[1]+1:w.length).join(" "))}return out.filter(Boolean).join(" / ")}
try{prog=Object.assign(prog,JSON.parse(LS.get(PFX+"prog")||"{}"));prog.cards=prog.cards||{}}catch(e){}
prog.srs=prog.srs||{};prog.miss=prog.miss||{q:[],c:{}};prog.conf=prog.conf||{};prog.exam=prog.exam||"";prog.qst=prog.qst&&typeof prog.qst==="object"?prog.qst:{};
function saveMark(id,patch){
  const v=Object.assign({},marks[id]||{},patch,{t:Date.now()}),empty=!v.hl&&!(v.note&&v.note.trim())&&!(v.th&&v.th.length);
  if(empty)delete marks[id];else marks[id]=v;LS.set(PFX+"marks",JSON.stringify(marks));refreshMarks();}
const saveProg=()=>LS.set(PFX+"prog",JSON.stringify(prog));

/* ---------- settings ---------- */
const S={lh:parseFloat(LS.get(PFX+"lh"))||1.55,focus:LS.get(PFX+"focus")||"",clean:LS.get(PFX+"clean")==="1",onehand:LS.get(PFX+"onehand")==="1",mode:LS.get(PFX+"show")||"orig",scale:parseFloat(LS.get(PFX+"size"))||1.3,theme:folioThemeChosen(),sum:LS.get(PFX+"sumon")!=="0",beats:LS.get(PFX+"beats")!=="0",fit:LS.get(PFX+"fit")!=="0",turn:["slide","instant"].includes(LS.get(PFX+"turn"))?LS.get(PFX+"turn"):"curl",mkview:["ticks","off"].includes(LS.get(PFX+"mkview"))?LS.get(PFX+"mkview"):"full",who:"",stab:LS.get(PFX+"stab")||"quotes"};
function applySettings(){
  const b=document.body.classList;b.remove("mode-orig","mode-mod","mode-both");b.add("mode-"+S.mode);
  document.documentElement.style.setProperty("--scale",S.scale);
  /* theme: ../theme.js (shared with the shelf); S.theme is folio-theme */
  LS.set(PFX+"theme",S.theme);folioTheme();folioBar();document.documentElement.style.setProperty("--scale",S.scale);
  document.documentElement.style.setProperty("--lh",S.lh);b.toggle("focusing",!!S.focus);b.toggle("clean",S.clean);
  LS.set(PFX+"lh",S.lh);LS.set(PFX+"focus",S.focus);LS.set(PFX+"clean",S.clean?"1":"0");LS.set(PFX+"onehand",S.onehand?"1":"0");
  LS.set(PFX+"show",S.mode);LS.set(PFX+"size",S.scale);LS.set(PFX+"theme",S.theme);LS.set(PFX+"sumon",S.sum?"1":"0");LS.set(PFX+"beats",S.beats?"1":"0");LS.set(PFX+"fit",S.fit?"1":"0");LS.set(PFX+"turn",S.turn);
  b.toggle("mk-ticks",S.mkview==="ticks");b.toggle("mk-off",S.mkview==="off");LS.set(PFX+"mkview",S.mkview);
}

/* reading log: minutes and pages per day (this device) */
let LOG={};try{LOG=JSON.parse(LS.get(PFX+"log")||"{}")}catch(e){}
const today=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
let lastTurn=0;
function logRead(){const now=Date.now(),k=today(),d=LOG[k]=LOG[k]||{s:0,p:0};d.p++;if(lastTurn)d.s+=Math.min(120,(now-lastTurn)/1000);lastTurn=now;LS.set(PFX+"log",JSON.stringify(LOG))}
function streak(){let n=0,d=new Date();if(!LOG[today(d)])d.setDate(d.getDate()-1);while(LOG[today(d)]){n++;d.setDate(d.getDate()-1)}return n}
function weekStats(){let s=0,p=0,days=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const v=LOG[today(d)];if(v){s+=v.s;p+=v.p;days++}}
  const sc=Object.values(prog.done).filter(t=>Date.now()-t<7*864e5).length;return {min:Math.round(s/60),p,days,sc}}
/* ---------- views & routing ---------- */
let view="reader";
let pos=null;try{pos=JSON.parse(LS.get(PFX+"pos")||"null")}catch(e){}
/* no history entries: Safari's edge back-swipe then has nothing in the app to slide back to */
/* push=true adds a history entry (moving between views and places), so the back gesture steps back through them */
function setHash(h,push){if(location.hash.slice(1)!==h){try{history[push?"pushState":"replaceState"](null,"","#"+h)}catch(e){}}}
document.addEventListener("touchstart",e=>{const x=e.touches[0].clientX;if((x<24||x>innerWidth-24)&&!e.target.closest("button,a,input,select,textarea,label,summary"))e.preventDefault()},{passive:false});
/* one app shell: Read / Study / You views share the Folio's bottom nav (Library goes back to the shelf) */
function show(v){view=v;if(v!=="reader"&&$("pvback"))$("pvback").hidden=true;["you","reader","study","map"].forEach(x=>$(x).hidden=v!==x);closePanel();if(v!=="reader"&&$("coach"))$("coach").remove();
  document.body.classList.remove("v-reader","v-study","v-you","v-map");document.body.classList.add("v-"+v);
  if(v!=="reader"&&!matchMedia("(prefers-reduced-motion: reduce)").matches){const el=$(v);el.classList.remove("f43in");void el.offsetWidth;el.classList.add("f43in")}
  /* Simple mode has three tabs: Play (map, reader and Study) stands for all three */
  const nv=folioSimple()&&(v==="reader"||v==="study")?"map":v;
  document.querySelectorAll("#fnav [data-nav]").forEach(b=>{if(b.dataset.nav===nv)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  document.body.style.overflow=v==="reader"?"hidden":"";if(v!=="reader")document.body.classList.remove("chrome");else setTimeout(hint,400)}
function route(){
  const h=location.hash.slice(1);closeSheet();
  if(h.startsWith("share=")){const ids=h.slice(6).split(".").filter(i=>speech[i]);setHash("you");show("you");renderYou();openShared(ids);return}
  if(h.startsWith("sp=")){const id=h.slice(3),k=scenes.findIndex(s=>s.items.some(x=>String(x.id)===id));if(k>=0){setHash(scenes[k].id);show("reader");openScene(k,{key:id+":0",flash:true,speech:id});return}}
  if(h==="you"){show("you");renderYou();scrollTo(0,0);return}
  if(h==="map"){show("map");renderMap();scrollTo(0,0);return}
  /* old play home (#home) and the shelf's Contents link: open the page with the Contents sheet */
  if(h==="home"||h==="contents"){goRead();setTimeout(()=>openContents("scenes"),60);return}
  if(h==="study"){SH=true;show("study");renderStudy();scrollTo(0,0);pvRestore();return}
  if(h.startsWith("study=")){const [t,x,w]=h.slice(6).split(":");SH=false;SV=null;
    if(SPAGES.includes(t)){let v="";try{v=decodeURIComponent(x||"")}catch(e){}SV={k:t,x:v};if(t==="topic")TP=v}
    else if(TABS.some(y=>y[0]===t)){S.stab=t;LS.set(PFX+"stab",t);if(t==="explore")exSel=x&&EXT.some(y=>y[0]===x)?x:"";if(t==="drill"){const k=x&&DRILLS.some(d=>d[0]===x)?x:"";if(k!==dr.k)dr={k}}}show("study");renderStudy();scrollTo(0,0);pvRestore();
    if(w){let k="";try{k=decodeURIComponent(w)}catch(e){}const el=k&&document.querySelector(`#sbody [data-gw="${CSS.escape(k)}"]`);if(el){el.scrollIntoView({block:"center"});el.classList.add("flash")}}return}
  const k=sIdx(h);
  if(k>=0){show("reader");openScene(k,pos&&pos.s===h?{key:pos.key,keep:true}:{page:0});return}
  if(pos&&sIdx(pos.s)>=0){setHash(pos.s,false);show("reader");openScene(sIdx(pos.s),{key:pos.key,keep:true});setTimeout(pulseLast,500);return}
  /* first visit to a play (no place kept yet): the journey map */
  setHash("map",false);show("map");renderMap();scrollTo(0,0);
}
addEventListener("hashchange",route);addEventListener("popstate",route);
function goScene(k,opts){setHash(scenes[k].id,true);show("reader");openScene(k,opts||{page:0})}
function goSpeech(id){const sp=speech[id];if(!sp)return;if(S.who&&sp.who!==S.who)S.who="";closeSheet();goScene(sIdx(sp.page),{speech:+id,flash:true})}
function goStudy(tab,sub){SBACK=tab&&!SPAGES.includes(tab)&&SV?{k:SV.k,x:SV.x}:null;SH=!tab;SV=null;
  if(SPAGES.includes(tab)){SV={k:tab,x:sub||""};if(tab==="topic")TP=SV.x;setHash("study="+tab+":"+encodeURIComponent(SV.x),true)}
  else{if(tab){S.stab=tab;LS.set(PFX+"stab",tab)}if(tab==="drill"&&sub!=null&&sub!==dr.k)dr={k:sub||""};
    setHash(tab?"study="+tab+((tab==="explore"||tab==="drill")&&sub?":"+sub:""):"study",true)}
  show("study");renderStudy();scrollTo(0,0);sAnim()}
/* a tile opening its topic or tool: the page rises in (off with reduced motion) */
function sAnim(){const b=$("sbody");if(!b||matchMedia("(prefers-reduced-motion: reduce)").matches)return;b.classList.remove("sin");void b.offsetWidth;b.classList.add("sin")}
/* back to where Study was last: a topic, character or theme page, the last tool, or the home */
function goStudyLast(){if(SV)goStudy(SV.k,SV.x);else if(SLAST)goStudy(S.stab,S.stab==="explore"?exSel:S.stab==="drill"?dr.k:"");else goStudy()}
function goYou(){setHash("you",true);show("you");renderYou();scrollTo(0,0)}
function goMap(){setHash("map",true);show("map");renderMap();scrollTo(0,0)}
function goRead(){if(pos&&sIdx(pos.s)>=0)goScene(sIdx(pos.s),{key:pos.key,keep:true});else goScene(0)}
/* ---------- cross-links (3.1): data-to="<where>[?k=v&k=v]" works anywhere (reader, popups, sheets, Study)
   where = scene:<id> | speech:<id> | you | study | study:<tab>[:<explore section>]
   keys: who (quotes, prof, part), th (quotes, themes), an (analysis), w (glossary word), s (quiz scene), a (act) */
const toLink=(spec,label,cls)=>`<button class="golink${cls?" "+cls:""}" type="button" data-to="${esc(spec)}">${label} <span aria-hidden="true">›</span></button>`;
const whoQ=w=>QUOTES.quotes.some(q=>speech[q.id].who===w);
function whoLinks(w){const L=[];if(MAINS.includes(w))L.push(toLink("study:prof?who="+w,"Profile"));if(whoQ(w))L.push(toLink("study:quotes?who="+w,"Key quotes"));
  if(EX.analysis&&EX.analysis[w])L.push(toLink("study:explore:analysis?an="+w,"Analysis"));if(MAINS.includes(w))L.push(toLink("study:part?who="+w,"Learn their part"));return L.join("")}
function goTo(spec){const [w,qs]=String(spec).split("?"),P={};(qs||"").split("&").filter(Boolean).forEach(x=>{const [k,v]=x.split("=");P[k]=decodeURIComponent(v||"")});
  hideGloss();const [a,b,c]=w.split(":");
  if(a==="speech"){goSpeech(b);return}
  if(a==="scene"){const k=sIdx(b);if(k>=0){closeSheet();goScene(k,{page:0})}return}
  if(a==="you"){closeSheet();goYou();return}
  if(a==="map"){closeSheet();goMap();return}
  if(a==="read"){closeSheet();goRead();return}
  if(a==="contents"){goRead();setTimeout(()=>openContents("scenes"),60);return}
  if(a!=="study")return;closeSheet();
  if(P.tp&&TOPICS.some(t=>t[0]===P.tp))TP=P.tp;
  if(!b){goStudy();return}
  if(SPAGES.includes(b)){let v=c||"";try{v=decodeURIComponent(v)}catch(e){}goStudy(b,v);return}
  if(b==="quotes")qf={who:P.who||"",th:P.th||""};
  if(b==="review"&&P.ses)startSession();
  if(b==="themes"&&P.th&&QUOTES.themes[P.th])thSel=P.th;
  if(b==="prof"&&P.who&&P.who!==profSel){profSel=P.who;prStep=null}
  if(b==="part"&&P.who){pt.who=P.who;pt.sid="";pt.run=null}
  if(b==="explore"){exSel=c||"";if(P.an)anSel=P.an}
  if(b==="acts"&&P.a!=null&&isFinite(+P.a))acSel=+P.a;
  goStudy(b,c);
  if(b==="quiz"&&P.s)startQuiz(P.s);
  if(b==="acts"&&P.s){setTimeout(()=>acScroll(P.s),60);return}
  const el=P.w?document.querySelector(`#sbody [data-gw="${CSS.escape(P.w)}"]`):null;
  if(el){el.scrollIntoView({block:"center"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1600)}}
document.addEventListener("click",e=>{const t=e.target.closest("[data-to]");if(!t)return;e.preventDefault();e.stopPropagation();goTo(t.dataset.to)},true);
/* desktop rail (1400px+): proxies for the reader's own buttons */
$("rail").addEventListener("click",e=>{const b=e.target.closest("[data-rail]");if(!b)return;const r=b.dataset.rail;
  if(r==="contents")openContents();else if(r==="search")$("b-search").click();else if(r==="notes")openNotes();else if(r==="study")goStudyLast();else if(r==="set")openSettings()});
$("fnav").addEventListener("click",e=>{const b=e.target.closest("button[data-nav]");if(!b)return;const v=b.dataset.nav;
  if(v==="map"){if(view!=="map")goMap();else scrollTo({top:0,behavior:"smooth"})}else if(v==="reader"){if(view==="reader")toggleChrome(false);else goRead()}else if(v==="study"){/* first tap: the section you were last in; again: Study home */if(view!=="study")goStudyLast();else if(!SH)goStudy();else scrollTo({top:0,behavior:"smooth"})}else if(v==="you"){if(view!=="you")goYou();else scrollTo({top:0,behavior:"smooth"})}});

/* ---------- home ---------- */
function bkRemHTML(){const n=Object.keys(marks).length+BM.length+FAV.length;if(!n)return "";let f=+LS.get(PFX+"first")||0;if(!f){f=Date.now();LS.set(PFX+"first",String(f))}
  const lb=Math.max(+LS.get(PFX+"lastbk")||0,+LS.get("folio-lastbk")||0),since=Math.floor((Date.now()-Math.max(lb,f))/864e5);if(since<7)return "";
  return `<div class="examc">${lb?`It's been ${Math.floor((Date.now()-lb)/864e5)} days since you last backed up`:"You haven't backed up yet"}. Your ${n} note${n===1?"":"s"} and bookmarks live only on this device. <a class="link" href="${FOLIO_BK}">Back up now</a></div>`}
function examHTML(){if(!prog.exam)return `<button class="link" id="ex-set" style="margin-top:6px">Set your exam date for a daily reading plan</button>`;
  const days=Math.ceil((new Date(prog.exam+"T09:00")-Date.now())/864e5);if(days<0)return `<div class="examc">Exam date passed. <button class="link" id="ex-set">Set a new date</button></div>`;
  const un=scenes.filter(p=>!prog.done[p.id]),per=Math.max(1,Math.ceil(un.length/Math.max(1,days-2)));
  return `<div class="examc"><b>${days} day${days===1?"":"s"}</b> to your exam · ${un.length} scene${un.length===1?"":"s"} left to read<br>${un.length?`Today: read ${un.slice(0,per).map(p=>`<button class="link" data-go="${p.id}">${sName(p)}</button>`).join(", ")}`:"All read. Today: flashcards and an essay plan."} · <button class="link" id="ex-set">Change date</button></div>`}
function openExamDate(){openSheet("Exam date",`<p class="intro">We'll spread the scenes you haven't read across the days left, leaving the last two days for revision.</p><input type="date" class="sinput" id="ex-d" value="${esc(prog.exam||"")}"><div class="row"><button class="btn primary" id="ex-ok">Save</button>${prog.exam?`<button class="btn" id="ex-clr">Remove date</button>`:""}</div>`);
  $("ex-ok").onclick=()=>{prog.exam=$("ex-d").value;saveProg();closeSheet();renderYou()};if($("ex-clr"))$("ex-clr").onclick=()=>{prog.exam="";saveProg();closeSheet();renderYou()}}
/* 4.4 ledger icons: scenes, quiz, quotes */
const YIC={"sc": "<path d=\"M5 4h9l5 5v11H5z\"/><path d=\"M14 4v5h5M8 13h8M8 16.5h6\"/>", "qz": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path d=\"M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.6M12 16.8v.2\"/>", "qt": "<path d=\"M5 17c0-4 1.5-7 5-9M14 17c0-4 1.5-7 5-9\"/><path d=\"M5 17a2.5 2.5 0 1 0 0-.1M14 17a2.5 2.5 0 1 0 0-.1\"/>"};let YTIME="";
function renderYou(){
  const lp=pos&&sIdx(pos.s)>=0?scenes[sIdx(pos.s)]:scenes[0];
  const done=scenes.filter(p=>prog.done[p.id]).length;
  const qs=Object.entries(prog.quiz).filter(([k])=>k!=="all").map(x=>x[1]);const qc=qs.reduce((a,q)=>a+q[0],0),qt=qs.reduce((a,q)=>a+q[1],0);
  const s7=streak(),w=weekStats(),td=Math.round(((LOG[today()]||{}).s||0)/60),pct=done/scenes.length*100;
  $("contcard").innerHTML=`<button class="go yhero" id="contbtn"><span class="yhe" aria-hidden="true">${folioRing(pct/100,"","yring")}<span class="yhm enr">${typeof emblemSVG==="function"?emblemSVG(PLAY,"yhes"):""}</span></span><small>${pos?"Continue reading":"Begin reading"}</small><b>${sName(lp)}</b><span>${esc(shortLoc(lp))}</span><span class="meter"><i style="width:${pct}%"></i></span></button>
    <div class="ytiles yled">${[["contents","sc",`${done}<small>/${scenes.length}</small>`,"Scenes read"],["study:quiz","qz",qt?Math.round(qc/qt*100)+"%":"–","Quiz score"],["study:cards","qt",`${Object.keys(prog.cards).length}<small>/${QUOTES.quotes.length}</small>`,"Quotes learnt"]].map(([to,ic,v,l])=>`<button type="button" data-to="${to}"><span class="ybadge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${YIC[ic]}</svg></span><b>${v}</b><span>${l}<i aria-hidden="true">\u00a0›</i></span></button>`).join("")}</div>`;
  YTIME=`<p class="ytime"><b>${s7}</b> day${s7===1?"":"s"} in a row · <b>${td}</b> min today · <b>${w.min}</b> min this week</p>`;
  $("you").querySelector(".sbar h1").textContent=folioSimple()?"Me":"You";
  $("contcard").insertAdjacentHTML("beforeend",levelHTML()+(folioSimple()&&goal()==="enjoy"?"":examHTML())+bkRemHTML());if($("ex-set"))$("ex-set").onclick=openExamDate;
  $("contbtn").onclick=goRead;
  const nm=Object.keys(marks).filter(k=>speech[k]).length,nf=FAV.filter(f=>speech[f.id]).length;
  const row=(id,t,sub,href)=>`${href?`<a class="yrow" href="${href}">`:`<button class="yrow" id="${id}">`}<span><b>${t}</b><small>${sub}</small></span><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>${href?"</a>":"</button>"}`;
  $("ylist").innerHTML=row("y-notes","My notes &amp; highlights",`${nm} note${nm===1?"":"s"} · ${nf} phrase${nf===1?"":"s"} · ${BM.length} bookmark${BM.length===1?"":"s"}`)+
    row("y-cont","Contents, cast &amp; story","Every scene, the characters and the story in "+EX.timeline.length+" moments")+
    row("y-set","Reading settings","What shows on the page, text size, theme, spacing, focus")+
    row("","Folio settings &amp; backup","Every play: theme, text size, one backup file",FOLIO_BK)+
    (pos||LS.get("folio-stat-"+PLAY)?row("y-unst","Mark as not started","Clears your place and scenes read. Notes, bookmarks and Study are kept"):"");
  $("y-notes").onclick=openNotes;$("y-set").onclick=openSettings;$("y-cont").onclick=()=>openContents();
  const u=$("y-unst");if(u){let armed=false;u.onclick=()=>{if(!armed){armed=true;u.querySelector("small").textContent="Tap again to confirm";return}unstart();renderYou()}}
}
/* Mark this play as not started: clears its place, % read and scenes read; keeps notes, bookmarks, Study and reading time */
function unstart(){pos=null;prog.done={};saveProg();try{localStorage.removeItem(PFX+"pos");localStorage.removeItem("folio-stat-"+PLAY);
  if(localStorage.getItem("folio-last")===PLAY){let best=null,bt=-1;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith("folio-stat-")||k==="folio-stat-"+PLAY)continue;let t=0;try{t=+JSON.parse(localStorage.getItem(k)).t||0}catch(e){}if(t>bt){bt=t;best=k.slice(11)}}
    best?localStorage.setItem("folio-last",best):localStorage.removeItem("folio-last")}}catch(e){}}
$("you").addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g)goScene(sIdx(g.dataset.go))});
/* story beats (BEATS in play.js): speech id → one-line beat, shown as a ruled marker before that speech */
const BEAT={},beatTxt=t=>esc(t).replace(/&quot;([^&]*)&quot;|"([^"]*)"/g,(m,x,y)=>"“"+(x||y)+"”");if(typeof BEATS!=="undefined")for(const s in BEATS)for(const [id,t] of BEATS[s])BEAT[id]=t;
/* Contents sheet (the old play home): scenes with progress, the cast, the story in moments */
let ctab=LS.get(PFX+"htab");if(!["scenes","beats","cast","story"].includes(ctab)||ctab==="beats"&&!Object.keys(BEAT).length)ctab="scenes";
function contentsHTML(){
  const here=pos&&sIdx(pos.s)>=0?sIdx(pos.s):-1,lp=here>=0?scenes[here]:scenes[0];
  let h=`<div class="ctabs" role="tablist">${[["scenes","Scenes"],...(Object.keys(BEAT).length?[["beats","Beats"]]:[]),["cast","Cast"],["story","Story"]].map(([k,l])=>`<button role="tab" data-ctab="${k}" aria-selected="${ctab===k}">${l}</button>`).join("")}</div>`;
  if(ctab==="scenes"){
    h+=`<div class="xrow" style="margin:0 0 8px">${toLink("map","Journey map")}</div>`;
    h+=`<div class="jump"><label for="jl" class="sr">Go to line</label><input class="sinput" id="jl" inputmode="decimal" placeholder="Go to line, e.g. 3.3.165"><button class="btn" id="jl-go">Go</button></div>`;
    const rc=RECENT.filter(r=>speech[r.id]);if(rc.length)h+=`<div class="eyebrow" style="margin:6px 0 2px">Recently viewed</div>`+rc.slice(0,3).map(r=>{const sp=speech[r.id],q=partsOf(sp)[r.pi]||partsOf(sp)[0];
      return `<div class="item" data-recent="${esc(r.id)}:${esc(r.pi)}" tabindex="0"><small>${esc(where(sp))}</small><span style="font-family:var(--f-old)">${esc(sp.lines[q[0]].replace(/^~/,""))}…</span></div>`}).join("");
    h+=`<div class="acts-map">`;
    for(const a of ACTS){const ps=scenes.filter(p=>p.act===a);if(!ps.length)continue;const ad=ps.filter(p=>prog.done[p.id]).length;
      h+=`<details class="actd"${a===lp.act?" open":""}><summary><span class="anum" aria-hidden="true">${a?R[a]:"❦"}</span><span>${LAT[a]}</span><small>${AN(a)} · ${ad}/${ps.length} read</small></summary><div class="srows">`+
        ps.map(p=>{const q=prog.quiz[p.id];const s=STUDY.scenes[p.id]||{};
          return `<button class="srow${prog.done[p.id]?" done":""}${here>=0&&p.id===pos.s?" here":""}" data-go="${p.id}"><span class="sseal" aria-hidden="true">${folioSeal(p.scene,prog.done[p.id]?((prog.qst[p.id]||{}).g?"g":""):here>=0&&p.id===pos.s?"n":"e")}<svg class="sthumb" viewBox="0 0 40 40">${PICS[stageType(p)]||""}</svg></span><span class="n">${prog.conf[p.id]?`<i class="dot ${esc(prog.conf[p.id])}"></i>`:""}${p.scene.toLowerCase()}</span><span class="loc">${esc(shortLoc(p))}</span><span class="st">${prog.done[p.id]?"✓ read":""}${q?` · quiz ${esc(q[0])}/${esc(q[1])}`:""}</span><span class="sum">${esc(firstSentence(s.sum))}</span></button>`}).join("")+`</div></details>`}
    h+=`</div>`}
  else if(ctab==="beats"){h+=`<p class="hcap">What happens, beat by beat. Tap one to read from there.</p><div class="acts-map">`;
    for(const a of ACTS){const ps=scenes.filter(p=>p.act===a&&BEATS[p.id]);if(!ps.length)continue;
      h+=`<details class="actd"${a===lp.act?" open":""}><summary><span>${LAT[a]}</span><small>${AN(a)}</small></summary>`+ps.map(p=>`<div class="bscene${here>=0&&p.id===pos.s?" here":""}"><div class="eyebrow">${sName(p)} · ${esc(shortLoc(p))}</div><ol class="beats broad">${BEATS[p.id].map(([id,t])=>`<li><button data-speech="${id}">${beatTxt(t)}</button></li>`).join("")}</ol></div>`).join("")+`</details>`}
    h+=`</div>`}
  else if(ctab==="cast"){h+=`<p class="hcap">The Names of the Actors, as the 1623 Folio lists them</p><div class="cast">`+STUDY.chars.map(c=>{const key=c.name.toUpperCase().replace(/^THE /,"").replace(" OF VENICE","");const has=whoSet.has(key);
      return `<div class="castc" style="--c:${COLORS[key]||"var(--ink)"}"><b>${folioMedal(c.name,COLORS[key],"cm")}${esc(c.name)}</b>${has?`<button class="link" data-follow="${esc(key)}">Follow their lines</button>`:"<span></span>"}<p>${esc(c.desc)}</p>${has?`<div class="xrow">${whoLinks(key)}</div>`:""}</div>`}).join("")+`</div>`}
  else h+=`<p class="hcap">The story in ${EX.timeline.length} moments. Tap one to jump there.</p><ol class="story">`+EX.timeline.map(e=>{const k=sIdx(e.s);return `<li><button data-speech="${e.id}" class="${here>=0&&k<here?"past":""}${k===here?" now":""}"><small>${sName(scenes[k])}</small><span>${esc(e.t)}</span></button></li>`}).join("")+`</ol>`;
  return h}
function openContents(t){if(t)ctab=t;LS.set(PFX+"htab",ctab);openSheet("Contents",contentsHTML());
  if(ctab==="scenes"){$("jl-go").onclick=()=>jumpLine($("jl").value);$("jl").onkeydown=e=>{if(e.key==="Enter")jumpLine($("jl").value)}}}
function follow(who){S.who=who;closeSheet();const k=scenes.findIndex(p=>p.items.some(i=>i.who===S.who));goScene(k);toast("Showing only "+title(S.who))}

/* ---------- reader: blocks ---------- */
const pg=$("pg"),measure=$("measure"),vp=$("vp");
// a scene is a list of blocks; long speeches split into units (single lines, or aligned chunks when modern text shows)
/* parts unfolded in place (Shakespeare only): an unfolded part stays whole on one page with its modern English under it */
let OPEN=new Set(),OPENV=0;
const lineUnits=c=>Array.from({length:c[1]-c[0]+1},(_,k)=>[c[0]+k,c[0]+k,null]);
function sceneBlocks(p){
  const b=[];
  if(!S.who){if(p.sc===1)b.push({t:"act",key:"a"});b.push({t:"head",key:"h"})}
  p.items.forEach((it,ix)=>{
    if(it.t==="sd"){if(!S.who)b.push({t:"sd",it,key:"d"+ix})}
    else if(!S.who||it.who===S.who){
      const ps=partsOf(it),units=S.mode==="orig"?ps.flatMap((c,i)=>OPEN.has(it.id+":"+i)?[[c[0],c[1],c[2]]]:lineUnits(c)):ps.map(c=>[c[0],c[1],c[2]]);
      b.push({t:"sp",it,units,starts:new Set(ps.map(c=>c[0])),u0:0,u1:units.length,key:it.id+":0"});
    }});
  b.push({t:"end",key:"e"});
  return b;
}
/* breathing space: long speeches get a small gap after each full sentence; modern English is split into short paragraphs */
const endsSentence=l=>/[.?!]["'’”)\]]*\s*$/.test(l.replace(/\s*\[[^\]]*\]\s*$/,""));
function lineHTML(l,num,id,j,np){const song=l.startsWith("~"),t=song?l.slice(1):l,ik=id!=null&&!(np&&!song)?lineInk(id,j):"";return `<span class="l${song?" song":""}"${num%5===0?` data-n="${num}"`:""}${id!=null?` data-j="${j}"`:""}>${ik?`<i class="mt fc-${ik}" aria-hidden="true"></i>`:""}${favLine(t,id,j)}${id!=null&&KQL[id+":"+j]?`<button class="kqm" type="button" data-kq="${KQL[id+":"+j][0]}" aria-label="Key quote">❦</button>`:""}</span>`}
/* 4.12 marks on the page: a speech mark bands every word of the speech (lowest), saved phrases over it, the selection drawn last so it wins.
   Each is a <mark class="fph …">; a marked line also gets a tick in the margin (lineInk) */
function lineInk(id,j){if(!FAV.length&&!marks[id])return "";let k="";for(const f of FAV)if(f.id===id&&j>=f.a[0]&&j<=f.b[0])k=fcOk(f.c);return k||inkOf(marks[id]||{})}
function favLine(t,id,j){const sk=id!=null&&!(SEL&&SEL.whole&&SEL.id===id)&&marks[id]?inkOf(marks[id]):"";if(id==null||!FAV.length&&!SEL&&!sk)return gloss(t);const ws=[];t.replace(/\S+/g,(m,i)=>{ws.push([i,i+m.length]);return m});if(!ws.length)return gloss(t);const cov=[];
  const add=(a,b,k,c,sel,sp)=>{if(j<a[0]||j>b[0])return;const s=j===a[0]?a[1]:0,e=Math.min(ws.length-1,j===b[0]?b[1]:ws.length-1);if(s>=ws.length||e<s)return;cov.push({s:ws[s][0],e:ws[e][1],k,c:fcOk(c),sel,sp})};
  if(sk)add([j,0],[j,1e9],"",sk,false,true);
  FAV.forEach(f=>{if(f.id===id&&!(SEL&&SEL.edit===f.t))add(f.a,f.b,f.t,f.c,false)});if(SEL&&SEL.id===id)add(SEL.a,SEL.b,SEL.edit||"",SEL.c,true);
  if(!cov.length)return gloss(t);const P=[...new Set([0,t.length,...cov.flatMap(c=>[c.s,c.e])])].sort((a,b)=>a-b);let h="",g=null,buf="";
  const flush=()=>{if(!buf)return;h+=g?`<mark class="fph${g.sel?" fsel":" fc-"+g.c}${g.sp?" fsp":""}"${!g.sel&&!g.sp&&g.k!==""?` data-fp="${esc(g.k)}"`:""}>${gloss(buf)}</mark>`:gloss(buf);buf=""};
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];let top=null;cov.forEach(c=>{if(c.s<=a&&c.e>=b)top=c});if(top!==g){flush();g=top}buf+=t.slice(a,b)}flush();return h}
/* long speeches are grouped into whole-thought parts (tap a part for its modern English) */
function linesHTML(it,a,b){let h="";const ps=partsOf(it);ps.forEach((p,i)=>{const s=Math.max(a,p[0]),e=Math.min(b,p[1]);if(s>e)return;let x="";const pr=!!PROSE[it.id];let pk="";for(let j=s;j<=e;j++){x+=lineHTML(it.lines[j],it.start+j,it.id,j,pr);if(pr&&!pk&&!it.lines[j].startsWith("~"))pk=lineInk(it.id,j)}
  /* prose runs on inline, so a per-line tick would land mid-text: one tick spans the marked part in the margin */
  if(pk)x=`<i class="mt mtp fc-${pk}" aria-hidden="true"></i>`+x;
  const op=S.mode==="orig"&&OPEN.has(it.id+":"+i)&&e===p[1];h+=`<div class="pt${op?" open":""}" data-p="${i}">${x}</div>`;
  if(op)h+=`<div class="mx" data-mx="${it.id}:${i}"><div class="mxt">${paras(p[2])}</div><div class="mxa">${ps.length>1?`<button data-mxa="whole:${it.id}:${i}">Whole speech <small>${i+1}/${ps.length}</small></button>`:""}<button data-mxa="tools:${it.id}:${i}">Meanings &amp; notes</button></div></div>`});return h}
function unfold(id,pi){const k=id+":"+pi,sp=speech[id],on=!OPEN.has(k);if(on)OPEN.add(k);else OPEN.delete(k);OPENV++;hideGloss();
  const top=cur.pages[cur.i].find(b=>b.t==="sp"),before=cur.i;
  openScene(cur.k,{key:on?id+":"+partsOf(sp)[pi][0]:top?top.key:pos&&pos.key,keep:true});
  if(on){addRecent(id,pi);coachDid(0);
    /* 4.5: a tall part is laid out line by line, so its slip may land on a later page: show that page */
    if(!pg.querySelector(`.mx[data-mx="${id}:${pi}"]`)){const ln=partsOf(sp)[pi][1],j=cur.pages.findIndex(pp=>pp.some(b=>b.t==="sp"&&b.it&&b.it.id===id&&b.units&&b.units.slice(b.u0,b.u1).some(u=>u[1]===ln)));if(j>=0&&j!==cur.i)renderPage(j,0,true)}}}
function paras(t,ink){const ss=String(t||"").match(/[^.!?]+[.!?]+["'’”)]*\s*|[^.!?]+$/g)||[t];const out=[];let curp="",n=0;
  ss.forEach(x=>{curp+=x;n++;if(n>=2||curp.length>200){out.push(curp.trim());curp="";n=0}});if(curp.trim())out.push(curp.trim());
  return out.map(p=>ink?`<p><mark class="fph ${ink==="sel"?"fsel":"fsp fc-"+ink}">${esc(p)}</mark></p>`:`<p>${esc(p)}</p>`).join("")}
/* 4.4: night or day on the stage, from the place, the stage directions and the scene's opening lines */
const SKYC={},NIGHT=/\b(night|midnight|moon|moonlight|torch(es)?|candles?|tapers?|lanterns?|dark|darkness|stars|bed|bedchamber|sleeps?|asleep)\b/;
function skyOf(p){if(SKYC[p.id])return SKYC[p.id];let sd=p.loc,ln="",n=0;for(const it of p.items){if(it.t==="sd")sd+=" "+it.text;else if(it.t==="sp"&&n<30){ln+=" "+it.lines.join(" ");n+=it.lines.length}}
  const m=(ln.toLowerCase().match(new RegExp(NIGHT.source,"g"))||[]).length;return SKYC[p.id]=NIGHT.test(sd.toLowerCase())||m>=2?"n":"d"}
function stageType(p){const l=p.loc.toLowerCase();const r=EX.stagerules.find(([re])=>new RegExp(re).test(l));return r?r[1]:"street"}
function stagePic(p){const k=stageType(p);return `<div class="stagepic"><svg viewBox="0 0 40 40" aria-hidden="true">${PICS[k]}</svg>${EX.place[p.id]?esc(EX.place[p.id])+" · ":""}${EX.stage[k]}</div>`}
function recapHTML(id){const k=sIdx(id);if(k===0)return `<ul>${EX.intro.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
  const pv=scenes[k-1],s=STUDY.scenes[pv.id]||{};return `<p class="muted" style="margin-top:0">At the end of ${sName(pv)}:</p><ul>${(s.key||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="muted">${esc(s.sum||"")}</p>`}
/* "Before you read": the setting, the story so far and (folded, as it gives the scene away) The Argument */
function openBefore(id){const p=scenes[sIdx(id)],s=STUDY.scenes[id]||{};
  openSheet("Before you read",`${preQ(p)?`<div class="preq"><b>Read to find out</b>${esc(preQ(p))}</div>`:""}<h3 class="lbl">On stage</h3>${onStage(p)}<h3 class="lbl">Setting</h3>${stagePic(p)}<h3 class="lbl">Story so far</h3>${recapHTML(id)}${s.sum?`<details class="about"><summary>The Argument: what happens in this scene</summary><p>${esc(s.sum)}</p></details>`:""}`)}
const FIRSTSP={};scenes.forEach(p=>p.items.forEach(it=>{if(it.t==="sp"&&CH[it.who]&&!FIRSTSP[it.who])FIRSTSP[it.who]=it.id}));
let PRED={};try{PRED=JSON.parse(LS.get(PFX+"pred")||"{}")}catch(e){}
function endExtras(p){const c=prog.conf[p.id];
  return `<div class="endbtns"><button data-endact="quiz:${p.id}">${preQ(p)?"Did you find out? Quick quiz":"Quick quiz on this scene"}</button><button data-endact="quotes:${p.id}">Key quotes from this scene</button>${(STUDY.scenes[p.id]||{}).sum?`<button data-endact="sum:${p.id}">Scene summary</button>`:""}</div>
   <div class="conf">How well do you know this scene? ${[["r","Shaky"],["a","OK"],["g","Confident"]].map(([k,l])=>`<button data-endact="conf:${p.id}:${k}" aria-pressed="${c===k}"><i class="dot ${k}"></i>${l}</button>`).join("")}</div>`}
function endAct(v){const [a,s,k]=v.split(":");
  if(a==="quiz"){goStudy("quiz");startQuiz(s);return}
  if(a==="next"){goScene(sIdx(s)+1,{page:0});return}
  if(a==="check"){openCheck(s);return}
  if(a==="sum"){const x=STUDY.scenes[s]||{},p=scenes[sIdx(s)];openSheet(sName(p),`<p class="hcap">${esc(shortLoc(p))}</p><p>${esc(x.sum||"")}</p>${(x.key||[]).length?`<ul>${x.key.map(k=>`<li>${esc(k)}</li>`).join("")}</ul>`:""}<div class="xrow">${toLink("study:acts?a="+p.act+"&s="+s,"Act summary")}${x.quiz?toLink("study:quiz?s="+s,"Quiz this scene"):""}</div>`);return}
  if(a==="quotes"){const qs=QUOTES.quotes.filter(q=>speech[q.id].page===s);openSheet("Key quotes",qs.length?qs.map(quoteHTML).join(""):`<p class="muted">No key quotes are listed for this scene. Try the Key quotes tab in Study.</p>`);return}
  if(a==="conf"){prog.conf[s]=prog.conf[s]===k?"":k;saveProg();refreshMarks();toast("Saved")}}
function onStageWho(p){const ws=[];p.items.forEach(i=>{if(i.t==="sp"&&i.who&&!ws.includes(i.who))ws.push(i.who)});return ws}
function onStage(p){const ws=onStageWho(p);
  return `<div class="onstage meds">${ws.map(w=>`<span class="oc" style="--c:${COLORS[w]||"var(--ink)"}">${folioMedal(w,COLORS[w])}<b>${esc(title(w))}</b></span>`).join("")}</div>`}
/* verse or prose */
const PROSE={};for(const id in speech){const L=speech[id].lines.map(l=>l.replace(/^~/,"").replace(/\[[^\]]*\]\s*/g,""));if(L.length<2)continue;
  const low=L.slice(1).filter(l=>/^[a-z]/.test(l)).length,long=L.filter(l=>l.length>62).length;PROSE[id]=low/(L.length-1)>=.5||long>=Math.max(1,L.length/3)}
/* 4.3 tailpiece: a printer's fleuron cluster at the end of each scene */
/* 4.3 celebration: gilt rays behind a seal that has just been stamped */
const BURST='<svg class="burst" viewBox="0 0 100 100" aria-hidden="true">'+Array.from({length:12},(_,i)=>`<path d="M50 50L${(50+48*Math.cos(i*Math.PI/6-.12)).toFixed(1)} ${(50+48*Math.sin(i*Math.PI/6-.12)).toFixed(1)}L${(50+48*Math.cos(i*Math.PI/6+.12)).toFixed(1)} ${(50+48*Math.sin(i*Math.PI/6+.12)).toFixed(1)}Z"/>`).join("")+'</svg>';
const TAILP='<svg class="tailp" viewBox="0 0 120 34" aria-hidden="true"><path class="tp1" d="M60 30C52 22 40 20 28 22c6-6 18-8 26-2-4-6-14-8-22-6 8-6 20-4 28 6 8-10 20-12 28-6-8-2-18 0-22 6 8-6 20-4 26 2-12-2-24 0-32 8z"/><circle class="tp2" cx="60" cy="8" r="3"/><circle class="tp2" cx="48" cy="11" r="1.8"/><circle class="tp2" cx="72" cy="11" r="1.8"/><path class="tp3" d="M6 17H22M98 17H114"/></svg>';
/* 4.5: under an entrance, a medallion for each character the direction names (tap for who they are) */
const ENTC={};
/* 4.7 woodcuts: a proscenium headpiece per setting (the play's stage glyph inside an engraved arch, day or night sky),
   a tailpiece urn, a wreath for act pages. Classes: wk = ink line, wa = ornament line, wf = ornament fill, wh = hatching */
const WCH='<defs><pattern id="wch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V3.2" stroke="currentColor" stroke-width="1"/></pattern></defs>';
function woodcut(p){const k=stageType(p),night=skyOf(p)==="n",st=[[70,34],[98,48],[122,30],[214,44],[300,52],[58,58],[292,30],[150,40]];
  const sky=night?`<path class="wf" d="M262 30a15 15 0 1 0 9 27a12 12 0 1 1-9-27z"/>`+st.map(([x,y])=>`<path class="wf" d="M${x} ${y-4}l1.1 2.9 2.9 1.1-2.9 1.1-1.1 2.9-1.1-2.9-2.9-1.1 2.9-1.1z"/>`).join("")
    :`<circle class="wf" cx="262" cy="46" r="10"/>`+Array.from({length:16},(_,i)=>{const a=i*Math.PI/8,r1=14,r2=i%2?19:23;return `<path class="wa" d="M${(262+r1*Math.cos(a)).toFixed(1)} ${(46+r1*Math.sin(a)).toFixed(1)}L${(262+r2*Math.cos(a)).toFixed(1)} ${(46+r2*Math.sin(a)).toFixed(1)}"/>`}).join("")+`<path class="wk" d="M78 48c6-6 16-6 20 0c5-3 12-1 12 4H70c0-3 4-5 8-4z"/>`;
  return `<svg class="wcut" viewBox="0 0 360 160" aria-hidden="true">${WCH}<rect class="wk" x="4" y="4" width="352" height="152"/><rect class="wk" x="10" y="10" width="340" height="140"/>
<path class="wh" d="M10 10H350V150H322V70Q322 26 180 26Q38 26 38 70V150H10Z"/>${sky}
<path class="wk" d="M38 150V70Q38 26 180 26Q322 26 322 70V150"/><path class="wk" d="M30 150V74M46 150V74M314 150V74M330 150V74M26 72H50M310 72H334M28 76H48M312 76H332"/>
<path class="wa" d="M46 74Q80 96 113 70Q146 96 180 70Q214 96 247 70Q280 96 314 74"/><path class="wa" d="M113 70v10M180 70v10M247 70v10"/><circle class="wf" cx="113" cy="82" r="2"/><circle class="wf" cx="180" cy="82" r="2"/><circle class="wf" cx="247" cy="82" r="2"/>
<path class="wk" d="M46 132H314M46 138H314M60 150L78 132M106 150L116 132M154 150L158 132M206 150L202 132M254 150L244 132M300 150L282 132"/>
<svg class="wg" x="136" y="52" width="88" height="88" viewBox="0 0 40 40">${PICS[k]||""}</svg>
<path class="wa" d="M16 34c2-12 10-18 20-18M16 34c6-2 8-6 6-10M24 22c4 0 6 2 6 6M344 34c-2-12-10-18-20-18M344 34c-6-2-8-6-6-10M336 22c-4 0-6 2-6 6"/><circle class="wf" cx="180" cy="17" r="3"/><path class="wa" d="M150 17h24M186 17h24"/></svg>`}
const TAILW='<svg class="tailw" viewBox="0 0 160 56" aria-hidden="true"><path class="wk" d="M68 12h24M71 12c0 6-5 9-5 17 0 9 6 13 14 13s14-4 14-13c0-8-5-11-5-17M73 42l-2 5h18l-2-5M66 50h28M73 27c4 4 10 4 14 0"/><path class="wa" d="M80 4c-3 1-3 4 0 6 3-2 3-5 0-6zM66 28C54 22 42 28 30 26c6 6 18 8 28 4M94 28c12-6 24 0 36-2-6 6-18 8-28 4M30 26c-8-2-14 2-22-2M130 26c8-2 14 2 22-2"/><circle class="wf" cx="22" cy="28" r="2"/><circle class="wf" cx="138" cy="28" r="2"/></svg>';
const WREATH='<svg class="wreath" viewBox="0 0 120 120" aria-hidden="true">'+Array.from({length:18},(_,i)=>{const a=(i/18)*Math.PI*1.7+Math.PI*.65,x=60+50*Math.cos(a),y=60+50*Math.sin(a),r=(a*180/Math.PI+90).toFixed(0);return `<ellipse class="wf" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3.2" ry="7" transform="rotate(${r} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}).join("")+'<path class="wa" d="M44 108c6 4 26 4 32 0"/></svg>';
function entWho(t){if(!/^\s*(re-?)?enter\b/i.test(t||""))return [];if(ENTC[t])return ENTC[t];const low=t.toLowerCase(),out=[];
  for(const w of whoSet){if(!CH[w]||/ and |^all$|^both$/i.test(w))continue;const n=title(w).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");if(new RegExp("\\b"+n+"\\b").test(low))out.push([low.search(new RegExp("\\b"+n+"\\b")),w])}
  return ENTC[t]=out.sort((a,b)=>a[0]-b[0]).map(x=>x[1]).slice(0,8)}
function blockHTML(bk,p){
  if(bk.t==="act"){const ps=scenes.filter(x=>x.act===p.act);
    /* 4.7 act divider: the play's emblem engraved in a wreath, the act in Latin and English, its scenes */
    return `<div class="blk apage"><div class="aprule" aria-hidden="true"></div><div class="apemb">${WREATH}${typeof emblemSVG==="function"?emblemSVG(PLAY,"apems"):""}</div><div class="apla">${LAT[p.act]||""}</div><h1 class="aph">${AN(p.act)}</h1><ol class="apsc">${ps.map(x=>`<li><b>${esc(x.scene.toLowerCase())}</b><span>${esc(shortLoc(x))}</span></li>`).join("")}</ol>${TAILW}</div>`}
  if(bk.t==="head"){const ws=onStageWho(p),f=p.items.find(x=>x.t==="sp");
    /* 4.7 scene title page: woodcut headpiece of the setting, the scene in Latin and English, the full place, the first beat, a playbill of who speaks */
    return `<div class="blk tpage">${woodcut(p)}<div class="tpeb">${LAT[p.act]||""} · ${SL[p.scene]||""}</div><h1>${sName(p)}</h1><div class="tploc">${esc(p.loc)}</div>${S.beats&&!S.who&&f&&BEAT[f.id]?`<div class="hbeat">${beatTxt(BEAT[f.id])}</div>`:""}<div class="tpbill${ws.length>8?" many":""}" aria-label="Speaking in this scene">${ws.map(w=>`<button type="button" class="entm tpc" data-who="${esc(w)}" aria-label="${esc(title(w))}">${folioMedal(w,COLORS[w],"em")}<span>${esc(title(w))}</span></button>`).join("")}</div><button class="recapb" data-recap="${p.id}">Before you read<span aria-hidden="true"> ›</span></button>${TAILW}</div>`}
  if(bk.t==="sd"){const ws=entWho(bk.it.text);return `<div class="blk sd">${esc(bk.it.text)}${ws.length?`<span class="ents">${ws.map(w=>`<button type="button" class="entm" data-who="${esc(w)}" aria-label="${esc(title(w))}">${folioMedal(w,COLORS[w],"em")}</button>`).join("")}</span>`:""}</div>`}
  if(bk.t==="end"){const k=sIdx(p.id),n=scenes[k+1],part=bk.part||"";
    const po=EX.predict[p.id],g=PRED[p.id];
    /* 4.0 scene-end card: the wax seal stamps, a three-question check, a big Next. Full mode keeps the other end-of-scene tools below. */
    const fresh=!prog.done[p.id],o=prog.qst[p.id]||{},Q=questsOf(p.id),sl=allSeals()+(fresh?1:0),L=folioLevel(sl);
    const chk=Q.includes("q")?(Array.isArray(o.q)?`<button class="ckb done" data-endact="check:${p.id}">Check: ${esc(o.q[0])} of ${esc(o.q[1])} right · try again</button>`:`<button class="ckb${goal()==="enjoy"?" done":""}" data-endact="check:${p.id}">Check yourself · 3 questions</button>`):"";
    const arg=S.sum&&(STUDY.scenes[p.id]||{}).sum?(wide()?`<div class="sum endsum"><b>The Argument</b>${esc(STUDY.scenes[p.id].sum)}</div>`:`<details class="sum endsum endfold"><summary><b>Read the argument</b><span aria-hidden="true"> ›</span></summary>${esc(STUDY.scenes[p.id].sum)}</details>`):"";
    const top=`${TAILW}${fresh?BURST:""}${folioSeal(p.scene,o.g?"g":"",fresh?"endseal stamp":"endseal")}<b>End of ${sName(p)}</b><span class="lvl">Scene sealed · ${sl} seal${sl===1?"":"s"} · ${esc(L.name)}</span>${chk}
      ${n?`<button class="nextsc" data-endact="next:${p.id}"><small>Next</small><b>${sName(n)}</b><span>${esc(shortLoc(n))} ›</span></button>`:`<span class="fin">Finis</span>`}`;
    if(part==="a")return `<div class="blk endblk endcard enda">${top}</div>`;
    return `<div class="blk endblk endcard${part==="b"?" endb":""}">${part==="b"?`<div class="endhd">${sName(p)} · <i>the argument</i></div>`:top}${arg}
      ${po?`<div class="pred"><p>${g!=null?`Your guess: ${esc(po[g])}. Turn the page to find out.`:"What do you think happens next?"}</p><div class="chips">${po.map((o,i)=>`<button class="chip" data-pred="${p.id}:${i}" aria-pressed="${g===i}">${esc(o)}</button>`).join("")}</div></div>`:""}${folioSimple()?"":endExtras(p)}</div>`}
  const it=bk.it,c=COLORS[it.who],cont=bk.u0>0||it.cont,aside=it.lines.some(l=>/\[Aside/.test(l)),solo=SOLO[it.id];
  let prevSp=null;for(const x of p.items){if(x===it)break;if(x.t==="sp"&&x.who===it.who)prevSp=x}
  const sw=PROSE[it.id]&&prevSp&&!PROSE[prevSp.id];
  const tag=(solo?`<span class="tag">Soliloquy</span>`:aside?`<span class="tag">Aside</span>`:"")+(EX.irony[it.id]&&!bk.u0?`<span class="tag pop irony" data-pop="Dramatic irony" data-text="${esc(EX.irony[it.id])}">◔ Irony</span>`:"")+((EX.dev[it.id]||[]).filter(()=>!bk.u0).map(([k,n])=>`<span class="tag pop" data-pop="${esc(EX.devices[k])}" data-text="${esc(n)}">✦ ${esc(EX.devices[k])}</span>`).join(""))+(PROSE[it.id]&&!bk.u0?`<span class="tag pr">${sw?"Switches to prose":"Prose"}</span>`:"");
  const m=marks[it.id]||{},flags=(STUDY.notes[it.id]&&!bk.u0?`<span class="tag note" data-note="${it.id}">note</span>`:"")+(m.note?`<span class="flag" title="Your note">✎</span>`:"");
  const us=bk.units.slice(bk.u0,bk.u1),whole=bk.u0===0&&bk.u1===bk.units.length;
  let body;
  const mk=SEL&&SEL.whole&&SEL.id===it.id?"sel":inkOf(m);
  if(S.mode==="orig")body=`<div class="o">${linesHTML(it,us[0][0],us[us.length-1][1])}</div>`;
  else if(whole&&partsOf(it).length<2)body=`<div class="o">${linesHTML(it,0,it.lines.length-1)}</div><div class="m">${paras(it.m,mk)}</div>`;
  else body=us.map(u=>`<div class="chunk"><div class="o">${linesHTML(it,u[0],u[1])}</div><div class="m">${paras(u[2],mk)}</div></div>`).join("");
  const hc="";
  const dcap=!bk.u0&&p.items.find(x=>x.t==="sp")===it;
  const beat=S.beats&&!bk.u0&&!S.who&&BEAT[it.id]&&!dcap?`<div class="beat" aria-label="Story beat"><span>${beatTxt(BEAT[it.id])}</span></div>`:"";
  const ch=CH[it.who],intro=ch&&!bk.u0&&!S.who&&FIRSTSP[it.who]===it.id?`<div class="who1"><span>${esc(firstSentence(ch.desc))}</span></div>`:"";
  /* 4.6 phones: the name runs in at the start of the first line, as in the Folio (not on the scene's first speech, which has the initial) */
  const runin=!wide()&&S.mode==="orig"&&!dcap;
  if(runin){const tg=tag.replace(/<span class="tag pr">Prose<\/span>/,"");body=body.replace(/(<span class="l[^"]*"[^>]*>)/,`$1<span class="nm ri${cont?" cont":""}"${ch?` data-who="${esc(it.who)}"`:""} style="${c?`--c:${c}`:""}">${esc(title(it.who))}${cont?" (cont.)":""}</span>${tg||flags?`<span class="rit">${tg}${flags}</span>`:""} `)}
  return `<article class="blk sp${dcap?" dcap":""}${runin?" run":""}${hc}${solo?" solo":aside?" aside":PROSE[it.id]?" prose":""}${PROSE[it.id]?"":" vs"}${S.focus&&it.who===S.focus?" fwho":""}" data-id="${it.id}" data-key="${it.id}:${bk.u0}">${beat}${runin?"":`<div class="hd"><span class="nm${cont?" cont":""}${/\S{13}/.test(title(it.who))?" lng":""}"${ch?` data-who="${esc(it.who)}"`:""} style="${c?`--c:${c}`:""}">${esc(title(it.who))}${cont?" (cont.)":""}</span>${tag}${flags}</div>`}${intro}<div class="body">${body}</div></article>`;
}
/* ---------- pagination: fill each screen, split long speeches between pages ----------
   Wide screens (1200px+, reader not narrowed by the side panel) show two facing pages like an open Folio: pages are measured at leaf width,
   cur.i is always the left (even) page, and a turn moves two pages. */
const SPREAD_GAP=120;
const SIDEW=()=>Math.min(420,innerWidth*.42);
/* 4.6: the desk stays a book while a sheet or panel is open; with too little room it is one bound leaf */
const spread=()=>innerWidth>=1200;
const narrowBook=()=>document.body.classList.contains("tight")&&innerWidth-SIDEW()<1200;
/* 4.5: Both mode on wide screens (1000px+) is a parallel-text opening: Shakespeare on the left page, modern English facing it, part by part */
const facing=()=>S.mode==="both"&&innerWidth>=1000&&!document.body.classList.contains("tight");
const twoLeaves=()=>spread()&&!facing()&&!narrowBook();
const leafW=()=>{if(!spread())return pg.clientWidth;const cs=getComputedStyle(pg),w=pg.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);return twoLeaves()?Math.floor((w-SPREAD_GAP)/2):Math.floor(w)};
const step=()=>twoLeaves()?2:1;
const even=i=>twoLeaves()?i-i%2:i;
function pageHTML(pages,i,k){const p=scenes[k],h=n=>(pages[n]||[]).map(b=>blockHTML(b,p)).join("");
  const rib=spread()?'<i class="sribbon" aria-hidden="true"></i>':"";
  return twoLeaves()?`<div class="spread2">${rib}<div class="leaf">${h(i)}</div><div class="leaf">${h(i+1)}</div></div>`:facing()?`<div class="spread2 facing">${rib}<div class="leaf">${h(i)}</div></div>`:spread()?`<div class="spread2 one">${rib}<div class="leaf">${h(i)}</div></div>`:h(i)}
let cur={k:-1,pages:[],i:0,words:0,sig:""};
/* 4.7 Pocket edition: verse is set just small enough that ~90% of this play's verse lines fit on one line (never under 14px) */
let FITC={};
function fitAuto(){const R2=document.documentElement.style;R2.setProperty("--fit","1");if(!S.fit||S.mode==="mod")return 1;
  measure.innerHTML=`<article class="blk sp vs"><div class="body"><div class="o"><div class="pt"><span class="l">M</span></div></div></div></article>`;
  const l=measure.querySelector(".l");if(!l){measure.innerHTML="";return 1}const cs=getComputedStyle(l),A=l.clientWidth-parseFloat(cs.paddingLeft)+parseFloat(cs.textIndent||0),px=parseFloat(cs.fontSize),font=`${cs.fontStyle} ${cs.fontWeight} ${px}px ${cs.fontFamily}`,key=[A,px,cs.fontFamily].join("|");measure.innerHTML="";
  if(!(key in FITC)){const ctx=(fitAuto.c=fitAuto.c||document.createElement("canvas")).getContext("2d");ctx.font=font;const w=[];
    for(const p of scenes)for(const it of p.items)if(it.t==="sp"&&!PROSE[it.id])for(const x of it.lines)if(!x.startsWith("~"))w.push(ctx.measureText(x).width);
    w.sort((a,b)=>a-b);const w90=w[Math.floor(w.length*.9)]||0;FITC[key]=w90?Math.max(14/px,Math.min(1,A/(w90*1.04))):1}
  const f=FITC[key];R2.setProperty("--fit",f.toFixed(3));return f}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{FITC={};if(typeof repaginate==="function"&&cur.k>=0)repaginate()});
function paginate(p){
  document.body.classList.toggle("spread",spread());document.body.classList.toggle("facing",facing());
  const blocks=sceneBlocks(p);
  measure.className="pg";measure.style.width=leafW()+"px";measure.style.maxWidth="none";measure.style.padding=spread()?"0":"";fitAuto();
  const H=pg.clientHeight-2,pages=[];let page=[];measure.innerHTML="";
  const fits=()=>measure.scrollHeight<=H;
  const flush=()=>{if(page.length)pages.push(page);page=[];measure.innerHTML=""};
  const add=bk=>{measure.insertAdjacentHTML("beforeend",blockHTML(bk,p));return measure.lastElementChild};
  for(const bk0 of blocks){
    if(bk0.t==="end"){flush();/* the end-of-scene card gets a page of its own; on a desk opening it fills both leaves */
      if(twoLeaves()&&pages.length%2===0){pages.push([Object.assign({},bk0,{part:"a"})]);pages.push([Object.assign({},bk0,{part:"b"})]);continue}}
    let bk=bk0,guard=0;
    while(guard++<500){
      const el=add(bk);
      if(fits()){page.push(bk);if(bk.t==="act"||bk.t==="head")flush();break}
      el.remove();
      if(bk.t==="sp"&&bk.u1-bk.u0>1){
        /* split between parts if possible; split inside a part (at a line) when the part split would leave over a quarter of the page empty */
        const fit=pass=>{for(let u=bk.u1-1;u>bk.u0;u--){if(pass&&!bk.starts.has(bk.units[u][0]))continue;const e=add(Object.assign({},bk,{u1:u}));const ok=fits(),h=measure.scrollHeight;e.remove();if(ok)return [u,h]}return [0,0]};
        let [best,bh]=fit(1);
        if(!best||H-bh>H*.1){const [lb]=fit(0);if(lb>best)best=lb}
        if(best){const part=Object.assign({},bk,{u1:best});add(part);page.push(part);flush();bk=Object.assign({},bk,{u0:best,key:bk.it.id+":"+bk.units[best][0]});continue}
      }
      if(page.length){flush();continue}
      if(bk.t==="sp"&&S.mode==="orig"&&bk.units){const u=bk.units[bk.u0];if(u&&u[1]>u[0]){const ex=lineUnits(u),units=[...bk.units.slice(0,bk.u0),...ex,...bk.units.slice(bk.u0+1)];bk=Object.assign({},bk,{units,u1:bk.u1+ex.length-1});continue}}
      add(bk);page.push(bk);flush();break; // taller than a whole page on its own
    }
  }
  flush();measure.innerHTML="";
  return pages.length?pages:[[]];
}
const sig=()=>[S.lh,S.mode,S.scale,S.who,S.sum,S.beats,S.fit,OPENV,pg.clientWidth,pg.clientHeight,spread(),facing(),twoLeaves(),wide()].join("|");
function openScene(k,opts){
  opts=opts||{};const p=scenes[k];if(cur.k!==k&&OPEN.size){OPEN.clear();OPENV++}
  if(!(cur.k===k&&cur.sig===sig()))cur={k,pages:paginate(p),i:0,words:pageWords(p),sig:sig()};
  let i=0;
  if(opts.page==="last")i=cur.pages.length-1;
  else if(typeof opts.page==="number")i=Math.max(0,Math.min(cur.pages.length-1,opts.page));
  if(opts.key!=null){const f=findKey(opts.key);if(f>=0)i=f}
  if(opts.speech!=null){const f=cur.pages.findIndex(pb=>pb.some(b=>b.t==="sp"&&b.it.id===opts.speech));if(f>=0)i=f}
  $("w-title").innerHTML=`<span class="wl">${sName(p)}</span><span class="ws">${R[p.act]||"Ind"}.${p.scene.toLowerCase()} · ${esc(shortLoc(p))}</span>`;
  renderPage(i,0,opts.keep);
  if(opts.flash&&opts.speech!=null){const el=pg.querySelector(`.sp[data-id="${opts.speech}"]`);if(el){el.classList.add("active");setTimeout(()=>el.classList.remove("active"),1600)}}
}
function findKey(key){
  key=String(key);
  for(let i=0;i<cur.pages.length;i++)if(cur.pages[i].some(b=>b.key===key))return i;
  const [sid,ln]=key.split(":");if(ln==null)return -1;
  let best=-1;for(let i=0;i<cur.pages.length;i++)for(const b of cur.pages[i])if(b.t==="sp"&&String(b.it.id)===sid&&b.units[b.u0][0]<= +ln)best=i;
  return best;
}
/* 4.5 Folio page frame: running head, page number, time left in the scene (4.5.1: no catchword; the right cell stays empty to keep the number centred) */
function footHTML(pages,i,mins){const n=pages.length,i2=Math.min(n,i+step());
  if(twoLeaves())return `<span class="pfa">${i+1}</span><span class="pfl">${mins>0?`${mins} min left in scene`:""}</span><span class="pfb">${i2>i+1?i2:""}</span>`;
  return `<span class="pfl">${mins>0?`${mins} min left in scene`:""}</span><span class="pfc">${i2>i+1?`${i+1}–${i2}`:i+1} of ${n}</span><span class="pfr"></span>`}
const BOOK={t:56,o:64,b:62};
function frame(i,n){const r=pg.getBoundingClientRect(),rh=$("rhead"),pf=$("pgfoot"),de=$("dogear");
  /* 4.7 desk: the rail sits on the spine between two leaves, or at the desk edge beside one */
  {const B=document.body.classList,two=twoLeaves();B.toggle("twol",two);B.toggle("oneleaf",spread()&&!two&&!facing());const st=document.documentElement.style;
   if(two){const lv=pg.querySelectorAll(".spread2>.leaf");if(lv.length===2){const a=lv[0].getBoundingClientRect(),b=lv[1].getBoundingClientRect();st.setProperty("--spx",((a.right+b.left)/2)+"px")}}st.setProperty("--bkl",r.left+"px")}
  /* desk (4.6): the running head and foot sit inside the book's top and foot margins (BOOK = the margins in px) */
  /* 4.12 phones: the page box reaches into the gutter for the margin tick; head and foot keep to the text */
  const gl=parseFloat(getComputedStyle(pg).paddingLeft)&&!spread()?parseFloat(getComputedStyle(pg).paddingLeft):0;
  rh.style.left=(r.left+gl)+"px";rh.style.width=(r.width-gl)+"px";pf.style.left=(r.left+gl)+"px";pf.style.width=(r.width-gl)+"px";
  if(spread()){rh.style.top=(r.top-BOOK.t+18)+"px";pf.style.top=(r.bottom+BOOK.b-40)+"px";pf.style.bottom="auto"}else{rh.style.top=pf.style.top=pf.style.bottom=""}
  /* desk: the page stack moves from right to left as you read the scene */
  if(spread()){const f=Math.min(1,(i+step())/Math.max(1,n)),L=1+Math.round(f*4),Rn=1+Math.round((1-f)*4),sh=[];
    for(let j=1;j<=L;j++)sh.push(`${-3*j}px ${3*j}px 0 ${-j}px color-mix(in srgb,var(--page) ${92-j*5}%,#000)`);
    for(let j=1;j<=Rn;j++)sh.push(`${3*j}px ${3*j}px 0 ${-j}px color-mix(in srgb,var(--page) ${92-j*5}%,#000)`);pg.style.setProperty("--stack",sh.join(","))}
  if(de){if(spread()){de.style.left=(r.right+BOOK.o-38)+"px";de.style.top=(r.bottom+BOOK.b-38)+"px";de.style.right=de.style.bottom="auto"}else de.style.left=de.style.top=de.style.right=de.style.bottom=""}}
function renderPage(i,dir,keep){if(SEL){SEL=null;selHide()}
  document.body.classList.toggle("spread",spread());document.body.classList.toggle("facing",facing());i=even(Math.max(0,Math.min(i|0,cur.pages.length-1)));
  const p=scenes[cur.k];cur.i=i;
  const html=pageHTML(cur.pages,i,cur.k);
  const reduce=noMotion()||noSlide;
  const put=()=>{pg.innerHTML=html;pg.scrollTop=0;pg.style.overflowY=pg.scrollHeight>pg.clientHeight+2?"auto":"hidden"};
  if(dir&&!reduce&&twoLeaves()){put();const s2=pg.querySelector(".spread2");if(s2){s2.classList.add(dir>0?"flipF":"flipB");setTimeout(()=>s2.classList.remove("flipF","flipB"),420)}}
  else if(dir&&!reduce){pg.classList.add(dir>0?"turnL":"turnR");setTimeout(()=>{put();pg.classList.remove("turnL","turnR")},110)}else put();
  const first=cur.pages[i].find(b=>b.t==="sp")||cur.pages[i][0];
  if(!keep){pos={s:p.id,key:first?first.key:"h"};LS.set(PFX+"pos",JSON.stringify(pos));const st={pct:Math.round((cur.k+(i+1)/cur.pages.length)/scenes.length*1000)/10,where:sName(p),t:Date.now(),sl:ownSeals()};LS.set("folio-stat-"+PLAY,JSON.stringify(st));
    setTimeout(()=>{const sp=pg.querySelector(".sp[data-id]");if(!sp)return;const l=sp.querySelector(".o .l")||sp.querySelector(".o");st.who=first&&first.t==="sp"?title(first.it.who):"";st.line=l?l.textContent.replace(/^\s*\d+\s*/,"").trim().slice(0,140):"";LS.set("folio-stat-"+PLAY,JSON.stringify(st))},250)}
  if(i+step()>=cur.pages.length&&!prog.done[p.id]){const b4=allSeals();prog.done[p.id]=Date.now();saveProg();syncSeals(b4)}
  const n=cur.pages.length,mins=Math.ceil(cur.words*(n-1-i)/Math.max(1,n)/140),i2=Math.min(n,i+step());
  $("pgfoot").innerHTML=footHTML(cur.pages,i,mins);{const rh=$("rhead").children;rh[0].textContent=CFG.short||CFG.title;rh[1].textContent=sName(p)}frame(i,n);$("pgbar").style.width=((i+1)/n*100)+"%";ribbon((cur.k+(i+1)/n)/scenes.length);if(!keep)logRead();
  $("p-num").textContent=`p. ${i+1} of ${n}${mins>0?` · ${mins} min left`:""}`;
  $("w-sub").textContent=shortLoc(p).toUpperCase()+(S.who?` · ${title(S.who).toUpperCase()} ONLY`:"");$("w-sub").classList.toggle("who",!!S.who);
  const r=$("p-range");r.max=n;r.value=i+1;bmState();
}
const reducedMotion=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function noMotion(){return reducedMotion()||S.turn==="instant"||/^paper/.test(document.documentElement.dataset.theme||"")}
function turn(d,fromBar){
  if(document.body.classList.contains("chrome")){if(fromBar)armChrome();else toggleChrome(false)}
  hideGloss();if(toolsId!=null)closePanel();
  if(curlOn()){curlAuto(d);return}
  doTurn(d)}
function doTurn(d){
  if(d>0){coachDid(2);if(cur.i+step()<=cur.pages.length-1)renderPage(cur.i+step(),1);else if(cur.k<scenes.length-1){setHash(scenes[cur.k+1].id,false);openScene(cur.k+1,{page:0})}else toast("The end of the play")}
  else{if(cur.i>0)renderPage(cur.i-step(),-1);else if(cur.k>0){setHash(scenes[cur.k-1].id,false);openScene(cur.k-1,{page:"last"})}}
}
/* ---------- page curl: the sheet folds along the perpendicular bisector of its corner and the finger ----------
   layers in #curl: under (the page being revealed), cast shadow, sheet front (clipped), sheet back (reflected, faint show-through) */
let CU=null,noSlide=false;
function curlOn(){return S.turn==="curl"&&!reducedMotion()&&!spread()}
function peekPage(d){
  if(d>0){if(cur.i<cur.pages.length-1)return {k:cur.k,pages:cur.pages,i:cur.i+1};if(cur.k<scenes.length-1)return {k:cur.k+1,pages:paginate(scenes[cur.k+1]),i:0};return null}
  if(cur.i>0)return {k:cur.k,pages:cur.pages,i:cur.i-1};if(cur.k>0){const ps=paginate(scenes[cur.k-1]);return {k:cur.k-1,pages:ps,i:ps.length-1}}return null}
function curlPage(html,foot,cls){const w=document.createElement("div");w.className="cpage "+(cls||"");
  const v=document.createElement("div");v.className=vp.className;const g=document.createElement("div");g.className="pg";g.innerHTML=html;v.appendChild(g);w.appendChild(v);
  const f=document.createElement("div");f.className="pgfoot";f.innerHTML=foot;w.appendChild(f);return w}
function curlBegin(d,cy){if(CU)curlEnd(true);const pk=peekPage(d);if(!pk)return null;
  const box=$("curl"),W=vp.clientWidth,H=vp.clientHeight;
  const nowH=pg.innerHTML,nowF=$("pgfoot").innerHTML,pkH=pk.pages[pk.i].map(b=>blockHTML(b,scenes[pk.k])).join(""),pkF=footHTML(pk.pages,pk.i,0);
  const [sh,sf,uh,uf]=d>0?[nowH,nowF,pkH,pkF]:[pkH,pkF,nowH,nowF];
  const under=curlPage(uh,uf),cast=document.createElement("i"),front=curlPage(sh,sf),bw=document.createElement("div"),back=document.createElement("div"),shade=document.createElement("i");
  cast.className="ccast";bw.className="cbw";back.className="cback";shade.className="cshade";
  const ghost=curlPage(sh,"","cghost");back.append(ghost,shade);bw.appendChild(back);
  box.replaceChildren(under,cast,front,bw);box.hidden=false;
  CU={d,W,H,cy:cy==null?H:Math.max(0,Math.min(H,cy)),cast,front,back,shade,raf:0,F:null,done:false};
  CU.F=d>0?{x:W,y:CU.cy}:{x:-W,y:CU.cy};curlDraw();return CU}
/* keep the sheet attached at its spine edge: corner stays within one page width of the spine */
function curlClamp(F){const {W,H,cy}=CU;let dx=F.x,dy=F.y-cy,r=Math.hypot(dx,dy);if(r>W){F={x:dx/r*W,y:cy+dy/r*W}}
  const oy=cy>=H-1?0:cy<=1?H:null;if(oy!=null){const D=Math.hypot(W,H);dx=F.x;dy=F.y-oy;r=Math.hypot(dx,dy);if(r>D)F={x:dx/r*D,y:oy+dy/r*D}}return F}
function clipPoly(P,M,n,side){const out=[],f=p=>((p[0]-M[0])*n[0]+(p[1]-M[1])*n[1])*side;
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],fa=f(a),fb=f(b);if(fa<=0)out.push(a);if(fa<=0!==fb<=0){const t=fa/(fa-fb);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}return out}
const polyCSS=P=>P.length<3?"polygon(0 0,0 0,0 0)":"polygon("+P.map(p=>p[0].toFixed(1)+"px "+p[1].toFixed(1)+"px").join(",")+")";
function curlDraw(){const c=CU,{W,H}=c,F=c.F=curlClamp(c.F),C=[W,c.cy],vx=C[0]-F.x,vy=C[1]-F.y,L=Math.hypot(vx,vy);
  if(L<.5){c.front.style.clipPath="none";c.back.style.visibility=c.cast.style.visibility="hidden";return}
  c.back.style.visibility=c.cast.style.visibility="";
  const n=[vx/L,vy/L],M=[(C[0]+F.x)/2,(C[1]+F.y)/2],R=[[0,0],[W,0],[W,H],[0,H]];
  c.front.style.clipPath=polyCSS(clipPoly(R,M,n,1));c.back.style.clipPath=polyCSS(clipPoly(R,M,n,-1));
  const ux=-n[1],uy=n[0],a=ux*ux-uy*uy,b=2*ux*uy,e=M[0]-(a*M[0]+b*M[1]),f=M[1]-(b*M[0]-a*M[1]);
  c.back.style.transform=`matrix(${a},${b},${b},${-a},${e},${f})`;
  const ang=Math.atan2(n[1],n[0])*180/Math.PI,D=Math.hypot(W,H),half=L/2,pr=Math.min(1,L/(2*W));
  const strip=(el,w)=>{el.style.width=w+"px";el.style.height=2*D+"px";el.style.transform=`translate(${M[0]}px,${M[1]-D}px) rotate(${ang}deg)`};
  strip(c.shade,Math.max(2,half));strip(c.cast,Math.min(90,12+half*.35));c.cast.style.opacity=Math.min(1,L/60)*(1-pr*.5)}
function curlAnim(to,ms,done){const c=CU,from={...c.F},t0=performance.now(),ez=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,arc=c.arc||0;
  cancelAnimationFrame(c.raf);const step=now=>{if(CU!==c)return;const t=Math.min(1,(now-t0)/ms),k=ez(t);
    c.F={x:from.x+(to.x-from.x)*k,y:from.y+(to.y-from.y)*k-arc*Math.sin(Math.PI*k)};curlDraw();if(t<1)c.raf=requestAnimationFrame(step);else done()};c.raf=requestAnimationFrame(step)}
function curlEnd(){if(!CU)return;cancelAnimationFrame(CU.raf);CU=null;const box=$("curl");box.hidden=true;box.replaceChildren()}
function curlCommit(d){noSlide=true;try{doTurn(d)}finally{noSlide=false}try{navigator.vibrate&&navigator.vibrate(8)}catch(_){}}
/* tap, swipe, key or wheel: play the whole turn from the bottom corner with a slight lift */
function curlAuto(d){const c=curlBegin(d);if(!c){doTurn(d);return}curlCommit(d);c.arc=c.H*.1;
  curlAnim(d>0?{x:-c.W,y:c.cy}:{x:c.W,y:c.cy},Math.round(380+c.W*.12),curlEnd)}
/* drag from the outer edge strip: corner follows the finger, release finishes or springs back */
function curlGrab(d,x,y){const r=vp.getBoundingClientRect(),H=r.height,ly=y-r.top,cy=ly>H*.8?H:ly<H*.2?0:ly;if(!curlBegin(d,cy))return false;
  Object.assign(CU,{drag:true,ox:x-r.left,oy:ly,lx:x,lt:performance.now(),v:0});return true}
function curlMove(x,y){const c=CU,r=vp.getBoundingClientRect(),lx=x-r.left,ly=y-r.top,now=performance.now(),dt=now-c.lt;
  if(dt>0)c.v=c.v*.6+((x-c.lx)/dt)*.4;c.lx=x;c.lt=now;
  c.F=c.d>0?{x:c.W+(lx-c.ox),y:c.cy+(ly-c.oy)}:{x:-c.W+2*(lx-c.ox),y:c.cy+(ly-c.oy)};curlDraw()}
function curlRelease(cancel){const c=CU;c.drag=false;const p=(c.W-c.F.x)/(2*c.W);
  const go=!cancel&&(c.d>0?(c.v<-.35||p>.3&&c.v<.3):(c.v>.35||p<.7&&c.v>-.3));
  const left={x:-c.W,y:c.cy},right={x:c.W,y:c.cy},to=(c.d>0)===go?left:right,ms=Math.round(160+Math.abs(to.x-c.F.x)/(2*c.W)*260);
  if(go){if(document.body.classList.contains("chrome"))toggleChrome(false);hideGloss();if(toolsId!=null)closePanel();curlCommit(c.d)}
  curlAnim(to,ms,curlEnd)}
function repaginate(){if(view!=="reader"||cur.k<0)return;const key=pos&&pos.key;cur.sig="";openScene(cur.k,{key,keep:true})}
let rz;addEventListener("resize",()=>{curlEnd();clearTimeout(rz);rz=setTimeout(repaginate,180)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>repaginate());
function refreshMarks(){if(view==="reader"&&cur.k>=0){pg.innerHTML=pageHTML(cur.pages,cur.i,cur.k);if(partSel)markPart();else if(toolsId!=null)pg.querySelectorAll(`.sp[data-id="${toolsId}"]`).forEach(x=>x.classList.add("active"))}}

/* ---------- reader: gestures (tap edges / swipe to turn, tap middle for menus, long-press for tools) ---------- */
let press=null,swallow=false;
vp.addEventListener("pointerdown",e=>{if(e.button)return;
  const sp=e.target.closest(".sp");press={x:e.clientX,y:e.clientY,t:Date.now(),sp,tgt:e.target,timer:null,moved:false};
  {const r=vp.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width;press.edge=fx>.82?1:fx<.18?-1:0}
  if(sp){press.pt=setTimeout(()=>{if(press&&press.sp===sp&&!press.moved)sp.classList.add("pressing")},160);
    press.timer=setTimeout(()=>{if(press&&press.sp===sp&&!press.moved){sp.classList.remove("pressing");swallow=true;try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}const h=wordAt(press.x,press.y);if(h&&h.id===+sp.dataset.id)startSel(h);else selSpeech(+sp.dataset.id)}},480)}});
vp.addEventListener("pointermove",e=>{if(CU&&CU.drag){curlMove(e.clientX,e.clientY);return}
  if(press&&press.edge&&!SEL&&!pinch){const dx=e.clientX-press.x,dy=e.clientY-press.y;if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.2&&Math.sign(dx)===-press.edge&&curlOn()&&curlGrab(press.edge,press.x,press.y)){
    clearTimeout(press.timer);clearTimeout(press.pt);if(press.sp)press.sp.classList.remove("pressing");press=null;try{vp.setPointerCapture(e.pointerId)}catch(_){}curlMove(e.clientX,e.clientY);return}}
  if(SEL&&SEL.drag){const h=wordAt(e.clientX,e.clientY);if(h&&h.id===SEL.id){const an=SEL.anc,[a,b]=wlt(h.w,an)?[h.w,an]:[an,h.w];if(a+""!==SEL.a+""||b+""!==SEL.b+""){SEL.a=a;SEL.b=b;selPaint()}}return}if(!press)return;if(Math.abs(e.clientX-press.x)>10||Math.abs(e.clientY-press.y)>10){press.moved=true;clearTimeout(press.timer);clearTimeout(press.pt);if(press.sp)press.sp.classList.remove("pressing")}});
function endPress(e,cancel){if(CU&&CU.drag){curlRelease(cancel);return}if(!press||pinch)return;clearTimeout(press.timer);clearTimeout(press.pt);if(press.sp)press.sp.classList.remove("pressing");
  const P=press;press=null;if(cancel)return;
  if(swallow){swallow=false;return}
  const dx=e.clientX-P.x,dy=e.clientY-P.y;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3){turn(dx<0?1:-1);return}
  if(P.moved||Date.now()-P.t>450)return;
  if(gpop){hideGloss();return}
  if(S.onehand&&P.y>innerHeight*.78&&(P.x<innerWidth*.3||P.x>innerWidth*.7)){turn(P.x<innerWidth*.3?-1:1);return}
  const ea=P.tgt.closest&&P.tgt.closest("[data-endact]");if(ea){endAct(ea.dataset.endact);return}
  const pp=P.tgt.closest&&P.tgt.closest("[data-pop]");if(pp){showPop(pp,pp.dataset.pop,pp.dataset.text);return}
  const rc=P.tgt.closest&&P.tgt.closest("[data-recap]");if(rc){openBefore(rc.dataset.recap);return}
  const pr=P.tgt.closest&&P.tgt.closest("[data-pred]");if(pr){const [s,i]=pr.dataset.pred.split(":");PRED[s]=+i;LS.set(PFX+"pred",JSON.stringify(PRED));refreshMarks();toast("Guess saved. Turn the page to find out.");return}
  if(SEL){const h=wordAt(P.x,P.y);if(h&&h.id===SEL.id)selMove(h.w);else clearSel();return}
  const fp=P.tgt.closest&&P.tgt.closest("mark.fph[data-fp]");if(fp){const f=FAV.find(x=>String(x.t)===fp.dataset.fp);if(f){editSel(f);const ga=P.tgt.closest("abbr.g");if(ga)showGloss(ga);return}}
  const gw=nearGloss(P.tgt,P.x,P.y);if(gw){showGloss(gw);return}
  const ma=P.tgt.closest&&P.tgt.closest("[data-mxa]");if(ma){const [a,id,pi]=ma.dataset.mxa.split(":");if(a==="tools")openTools(+id,+pi);else openPart(+id,+pi,true);return}
  const mx=P.tgt.closest&&P.tgt.closest("[data-mx]");if(mx){const [id,pi]=mx.dataset.mx.split(":");unfold(+id,+pi);return}
  const kqm=P.tgt.closest&&P.tgt.closest(".kqm[data-kq]");if(kqm){openKQ(+kqm.dataset.kq);return}
  const nt=P.tgt.closest&&P.tgt.closest("[data-note]");if(nt){showPop(nt,"Study note",STUDY.notes[nt.dataset.note]||"");return}
  const nm=P.tgt.closest&&P.tgt.closest(".nm[data-who],.entm[data-who]");if(nm){const c=CH[nm.dataset.who];if(c){showPop(nm,title(nm.dataset.who),c.desc,whoLinks(nm.dataset.who),folioMedal(nm.dataset.who,COLORS[nm.dataset.who],"pm"));return}}
  if(P.sp&&S.mode==="orig"){const pt=P.tgt.closest(".pt");if(pt){if(toolsId!=null)closePanel();unfold(+P.sp.dataset.id,+pt.dataset.p);return}}
  if(P.sp){const pt=P.tgt.closest(".pt")||(P.tgt.closest(".chunk")||P.sp).querySelector(".pt");
    if(pt){const id=+P.sp.dataset.id,pi=+pt.dataset.p;if(partSel&&partSel.id===id&&partSel.pi===pi&&toolsId!=null){closePanel();return}openPart(id,pi,false);return}}
  if(toolsId!=null&&wide()){closePanel();return}
  toggleChrome()}
vp.addEventListener("pointerup",e=>{if(SEL)SEL.drag=false;endPress(e,false)});
/* a long-press drag can end anywhere (over a handle, off the page): then show the pill */
document.addEventListener("pointerup",()=>{if(SEL&&SEL.drag){SEL.drag=false;selPlace()}},true);
vp.addEventListener("pointercancel",e=>{if(SEL)SEL.drag=false;endPress(e,true)});
/* iOS: claim the touch for a page drag before Safari takes it as a pan (which would fire pointercancel) */
vp.addEventListener("touchmove",e=>{if(SEL&&SEL.drag||CU&&CU.drag||press&&press.edge&&e.touches.length===1&&curlOn()&&pg.scrollHeight<=pg.clientHeight+2)e.preventDefault()},{passive:false});
vp.addEventListener("contextmenu",e=>{e.preventDefault();const sp=e.target.closest(".sp");if(!sp)return;if(press){clearTimeout(press.timer);clearTimeout(press.pt);swallow=true}const h=wordAt(e.clientX,e.clientY);if(h&&h.id===+sp.dataset.id)startSel(h,false);else selSpeech(+sp.dataset.id)});
vp.addEventListener("wheel",e=>{const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(d)<25)return;const now=Date.now();if(now-(vp.lw||0)<450)return;vp.lw=now;turn(d>0?1:-1)},{passive:true});
/* a tap within a few pixels of an underlined word counts as tapping it */
function nearGloss(tgt,x,y){const d=tgt&&tgt.closest&&tgt.closest("abbr.g");if(d)return d;
  for(const [dx,dy] of [[0,-9],[0,9],[-12,0],[12,0],[-9,-7],[9,-7],[-9,7],[9,7],[0,-15],[0,15]]){const el=document.elementFromPoint(x+dx,y+dy);const g=el&&el.closest&&el.closest("abbr.g");if(g)return g}return null}
/* pinch with two fingers to change the text size */
let pinch=null;const SIZES=[1.15,1.3,1.5,1.75];
vp.addEventListener("touchstart",e=>{if(e.touches.length===2){if(CU&&CU.drag)curlRelease(true);const [a,b]=e.touches;pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),r:1};press=null}},{passive:true});
vp.addEventListener("touchmove",e=>{if(pinch&&e.touches.length===2){const [a,b]=e.touches;pinch.r=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.d}},{passive:true});
vp.addEventListener("touchend",e=>{if(!pinch||e.touches.length)return;const r=pinch.r;pinch=null;swallow=false;press=null;
  let i=SIZES.indexOf(S.scale);if(i<0)i=1;const ni=r>1.15?Math.min(SIZES.length-1,i+1):r<.87?Math.max(0,i-1):i;
  if(ni!==i){S.scale=SIZES[ni];applySettings();repaginate();toast(["Small","Normal","Large","Extra large"][ni]+" text")}},{passive:true});
/* menus close by themselves after 4s without use, and on every page turn */
let chromeT=0;
/* mouse: the menus come up when the pointer nears the top or bottom edge of the page (no need to find empty space) */
if(matchMedia("(hover:hover)").matches)addEventListener("mousemove",e=>{if(view!=="reader"||!sheet.hidden||e.buttons)return;const y=e.clientY;
  if((y<56||y>innerHeight-110)&&!document.body.classList.contains("chrome"))toggleChrome(true);else if(document.body.classList.contains("chrome"))armChrome()},{passive:true});
function armChrome(){clearTimeout(chromeT);chromeT=setTimeout(()=>{const a=document.activeElement;if(view==="reader"&&sheet.hidden&&!(a&&a.closest&&a.closest("#bar,#bbar")&&a.matches("input,select")))document.body.classList.remove("chrome")},4000)}
function toggleChrome(on){document.body.classList.toggle("chrome",on);if(document.body.classList.contains("chrome")){armChrome();coachDid(3)}else clearTimeout(chromeT)}
["pointerdown","input","keydown"].forEach(ev=>["bar","bbar"].forEach(id=>$(id).addEventListener(ev,()=>{if(document.body.classList.contains("chrome"))armChrome()})));
$("p-prev").onclick=()=>turn(-1,1);$("p-next").onclick=()=>turn(1,1);
{const de=$("dogear");if(de){let dt=null,held=false;de.addEventListener("pointerdown",e=>{held=false;dt=setTimeout(()=>{held=true;try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}toggleBM()},500)});
  de.addEventListener("pointerup",()=>{clearTimeout(dt);if(!held)turn(1)});de.addEventListener("pointercancel",()=>clearTimeout(dt));de.addEventListener("contextmenu",e=>e.preventDefault())}}
function pagePreview(i){const b=cur.pages[i]||[];const f=b.find(x=>x.t==="sp");if(!f)return b.some(x=>x.t==="head")?"Scene opening":"End of scene";
  return `<i style="font-style:normal;color:var(--muted)">${esc(title(f.it.who))}:</i> ${esc(f.it.lines[f.units[f.u0][0]].replace(/^~/,"").slice(0,70))}…`}
$("p-range").addEventListener("input",e=>{const i=+e.target.value-1;let d=document.querySelector(".scrub");if(!d){d=document.createElement("div");d.className="scrub";document.body.appendChild(d)}
  d.innerHTML=`<b>Page ${i+1} of ${cur.pages.length}</b><span>${pagePreview(i)}</span>`});
$("p-range").addEventListener("change",e=>{const d=document.querySelector(".scrub");if(d)d.remove();renderPage(+e.target.value-1,0)});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&SEL&&!e.target.closest("#mkpill textarea,#mkpill input")){clearSel();return}
  if(e.key==="Escape"&&gpop){hideGloss();return}
  if(e.key==="Escape"){if(!$("sheet").hidden)closeSheet();else if(toolsId!=null)closePanel();else toggleChrome(false);return}
  if(view!=="reader"||!$("sheet").hidden||e.target.closest("input,textarea,select"))return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();turn(1)}
  if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();turn(-1)}});

/* ---------- 4.12 Marks: one system for speech marks and phrases. Long-press a word (or right-click it) to select it; drag, or drag the ink-drop handles,
   to adjust; tap a word to move the nearer end. Long-press anywhere else in a speech selects the whole speech. A pill floats by the selection:
   one tap on an ink saves (Undo in the toast), the same ink again removes; long-press an ink to rename it (folio-inks, every play). ---------- */
const wlt=(x,y)=>x[0]<y[0]||x[0]===y[0]&&x[1]<y[1];
const wlin=(id,w)=>{const sp=speech[id];let n=0;for(let l=0;l<w[0];l++)n+=lineWords(sp.lines[l]).length;return n+w[1]};
/* the word under a point: only the speech's own words count (not a run-in name, its tags or the key-quote mark) */
function wordAt(x,y){const el=document.elementFromPoint(x,y);if(!el||!el.closest||el.closest(".nm,.rit,.kqm,.mkh,#mkpill"))return null;const l=el.closest(".o .l[data-j]");if(!l)return null;const sp=l.closest(".sp[data-id]");if(!sp)return null;
  let node=null,off=0;if(document.caretPositionFromPoint){const c=document.caretPositionFromPoint(x,y);if(c){node=c.offsetNode;off=c.offset}}else if(document.caretRangeFromPoint){const r=document.caretRangeFromPoint(x,y);if(r){node=r.startContainer;off=r.startOffset}}
  if(!node||!l.contains(node))return null;const r=document.createRange();r.setStart(l,0);r.setEnd(node,off);
  const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT,{acceptNode:t=>t.parentElement&&t.parentElement.closest(".nm,.rit,.kqm")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  let txt="",n=-1;for(let t;(t=tw.nextNode());){if(n<0){if(t===node)n=txt.length+off;else if(r.comparePoint(t,0)>0)n=txt.length}txt+=t.data}if(n<0)n=Math.max(0,txt.length-1);
  const ws=[];txt.replace(/\S+/g,(m,i)=>{ws.push([i,i+m.length]);return m});if(!ws.length)return null;let i=ws.findIndex(w=>n<w[1]);if(i<0)i=ws.length-1;
  return {id:+sp.dataset.id,w:[+l.dataset.j,i]}}
const lastW=id=>{const sp=speech[id],L=sp.lines.length-1;return [L,Math.max(0,lineWords(sp.lines[L]).length-1)]};
const inkLast=()=>{const k=LS.get(PFX+"fc");return INK.includes(k)?k:"y"};
function selPre(){hideGloss();if(toolsId!=null)closePanel()}
function startSel(h,drag=true){selPre();SEL={id:h.id,a:h.w,b:h.w,anc:h.w,drag,edit:0,whole:false};selPaint(true)}
function selSpeech(id){if(!speech[id])return;selPre();SEL={id,a:[0,0],b:lastW(id),anc:[0,0],drag:false,edit:0,whole:true};selPaint(true)}
function editSel(f){selPre();SEL={id:f.id,a:f.a.slice(),b:f.b.slice(),anc:f.a.slice(),drag:false,edit:f.t,whole:false};selPaint(true)}
function selMove(w){SEL.whole=false;if(wlt(w,SEL.a))SEL.a=w;else if(wlt(SEL.b,w))SEL.b=w;else if(wlin(SEL.id,w)-wlin(SEL.id,SEL.a)<=wlin(SEL.id,SEL.b)-wlin(SEL.id,w))SEL.a=w;else SEL.b=w;SEL.anc=SEL.a;selPaint()}
function selHide(){["mkpill","mkh-a","mkh-b"].forEach(i=>{const d=$(i);if(d)d.hidden=true})}
function clearSel(){if(!SEL)return;SEL=null;selHide();refreshMarks()}
/* the phrase this selection edits (or one saved with exactly these words), and its ink */
function selFav(){if(!SEL||SEL.whole)return null;return SEL.edit?FAV.find(x=>x.t===SEL.edit):FAV.find(x=>x.id===SEL.id&&x.a+""===SEL.a+""&&x.b+""===SEL.b+"")}
function selInk(){if(!SEL)return "";if(SEL.whole)return inkOf(marks[SEL.id]||{});const f=selFav();return f?fcOk(f.c):""}
function selPart(){const ps=partsOf(speech[SEL.id]),l=SEL.a[0];return Math.max(0,ps.findIndex(q=>l>=q[0]&&l<=q[1]))}
const PILLI={note:'<path d="M5 19l1-4L16 5l3 3L9 18z"/><path d="M14 7l3 3"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',mod:'<path d="M4 6h10M4 11h7M4 16h9"/><path d="M15 13l3 3 3-3M18 9v7"/>',more:'<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>',sp:'<path d="M5 5h14M5 9.5h14M5 14h14M5 18.5h9"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>'};
function selPaint(build){refreshMarks();let d=$("mkpill");
  if(!d){d=document.createElement("div");d.id="mkpill";d.className="mkpill";d.setAttribute("role","dialog");d.setAttribute("aria-label","Mark");document.body.appendChild(d);["pointerdown","pointerup"].forEach(ev=>d.addEventListener(ev,e=>e.stopPropagation()));build=true}
  if(build||d.hidden||d.dataset.w!==String(SEL.whole))pillBuild(d);else{const on=selInk();d.querySelectorAll("[data-ink]").forEach(b=>{b.classList.toggle("on",b.dataset.ink===on);b.setAttribute("aria-pressed",b.dataset.ink===on)})}
  d.hidden=false;selPlace()}
function pillBuild(d){const on=selInk(),f=selFav(),m=marks[SEL.id]||{},note=SEL.whole?(m.note||""):(f&&f.note||"");d.dataset.w=String(SEL.whole);
  d.innerHTML=`<div class="mkinks" role="group" aria-label="Inks (press and hold one to rename it)">${INK.map(k=>`<button type="button" class="mki fc-${k}${on===k?" on":""}" data-ink="${k}" aria-pressed="${on===k}"><i aria-hidden="true"></i><small>${esc(inkName(k))}</small></button>`).join("")}</div>
    <div class="mkacts">${[["note",note?"Note •":"Note"],["copy","Copy"],SEL.whole?["mod","Modern"]:["sp","Speech"],["more","More"]].map(([k,l])=>`<button type="button" data-mka="${k}"${k==="sp"?' aria-label="Select the whole speech"':""}><svg viewBox="0 0 24 24" aria-hidden="true">${PILLI[k]}</svg><small>${l}</small></button>`).join("")}<button type="button" class="mkx" data-mka="x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true">${PILLI.x}</svg></button></div>
    <div class="mkcard" id="mk-nw" hidden><label class="sr" for="mk-note">Note</label><textarea id="mk-note" rows="3" placeholder="${SEL.whole?"Your note on this speech…":"Why these words? (optional)"}">${esc(note)}</textarea><div class="mkrow"><button type="button" class="btn sm primary" id="mk-ns">Save note</button></div></div>
    <div class="mkcard" id="mk-rw" hidden></div>`;
  d.querySelectorAll("[data-ink]").forEach(b=>{let t=0,held=false;
    b.addEventListener("pointerdown",()=>{held=false;clearTimeout(t);t=setTimeout(()=>{held=true;try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}inkRename(b.dataset.ink)},550)});
    ["pointerup","pointerleave","pointercancel"].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(t)));
    b.addEventListener("contextmenu",e=>{e.preventDefault();clearTimeout(t);held=true;inkRename(b.dataset.ink)});
    b.onclick=()=>{if(held){held=false;return}inkTap(b.dataset.ink)}});
  const A=k=>d.querySelector(`[data-mka="${k}"]`);
  A("note").onclick=()=>{const w=$("mk-nw");w.hidden=!w.hidden;$("mk-rw").hidden=true;A("note").setAttribute("aria-expanded",!w.hidden);if(!w.hidden)$("mk-note").focus({preventScroll:true});selPlace()};
  $("mk-ns").onclick=noteSave;
  A("copy").onclick=()=>{const sp=speech[SEL.id],t=SEL.whole?sp.lines.map(l=>l.replace(/^~/,"")).join("\n"):favText(SEL.id,SEL.a,SEL.b);copyText(t+`\n— ${title(sp.who)}, ${sName(sceneOf(SEL.id))}`);clearSel()};
  if(A("sp"))A("sp").onclick=()=>selSpeech(SEL.id);
  if(A("mod"))A("mod").onclick=()=>{const id=SEL.id,pi=selPart();clearSel();if(S.mode==="orig")unfold(id,pi);else openPart(id,pi,false)};
  A("more").onclick=()=>{const id=SEL.id,pi=selPart();clearSel();openTools(id,pi)};
  A("x").onclick=clearSel}
/* keep the pill off the selected words: above them (room for the start handle), else below, else at the bottom of the screen */
function selPlace(){const d=$("mkpill");if(!SEL||!d||d.hidden)return;const mk=[...pg.querySelectorAll("mark.fsel")],rs=mk.flatMap(m=>[...m.getClientRects()]).filter(r=>r.width);
  if(!rs.length){selHide();return}
  const ro=[...pg.querySelectorAll(".o mark.fsel")].flatMap(m=>[...m.getClientRects()]).filter(r=>r.width),hd=S.mode!=="mod"&&ro.length;
  if(hd){const a=ro[0],b=ro[ro.length-1];hdl("a",a.left,a.top,a.bottom);hdl("b",b.right,b.top,b.bottom);["a","b"].forEach(k=>$("mkh-"+k).classList.toggle("nohit",!!SEL.drag))}else["mkh-a","mkh-b"].forEach(i=>{const h=$(i);if(h)h.hidden=true});
  d.classList.toggle("hid",!!(SEL.drag||SEL.hd));
  const top=Math.min(...rs.map(r=>r.top)),bot=Math.max(...rs.map(r=>r.bottom)),cx=(Math.min(...rs.map(r=>r.left))+Math.max(...rs.map(r=>r.right)))/2,bw=d.offsetWidth,bh=d.offsetHeight,
    st=10+(document.body.classList.contains("chrome")?60:0);
  let y=top-bh-30;if(y<st){y=bot+34;if(y+bh>innerHeight-10)y=Math.max(st,innerHeight-10-bh)}
  d.style.left=Math.max(8,Math.min(innerWidth-bw-8,cx-bw/2))+"px";d.style.top=y+"px"}
/* ink-drop handles: a stem the height of the line, a drop above the first word and below the last; drag one to move that end (word by word, across lines) */
function hdl(k,x,t,b){let h=$("mkh-"+k);
  if(!h){h=document.createElement("div");h.id="mkh-"+k;h.className="mkh mkh-"+k;h.innerHTML=`<i role="slider" aria-label="${k==="a"?"Start":"End"} of selection"></i>`;document.body.appendChild(h);
    h.addEventListener("pointerdown",e=>{if(!SEL)return;e.preventDefault();e.stopPropagation();try{h.setPointerCapture(e.pointerId)}catch(_){}const r=h.getBoundingClientRect();
      SEL.hd=k;SEL.anc=k==="a"?SEL.b:SEL.a;SEL.dx=r.left-e.clientX+(k==="a"?3:-3);SEL.dy=r.top+r.height/2-e.clientY;h.classList.add("drag");selPlace()});
    h.addEventListener("pointermove",e=>{if(!SEL||SEL.hd!==k)return;const w=wordAt(e.clientX+SEL.dx,e.clientY+SEL.dy);if(!w||w.id!==SEL.id)return;const an=SEL.anc,[a,b]=wlt(w.w,an)?[w.w,an]:[an,w.w];
      if(a+""!==SEL.a+""||b+""!==SEL.b+""){SEL.a=a;SEL.b=b;SEL.whole=false;selPaint()}});
    const up=()=>{h.classList.remove("drag");if(SEL&&SEL.hd){SEL.hd=null;SEL.anc=SEL.a;selPaint()}};h.addEventListener("pointerup",up);h.addEventListener("pointercancel",up)}
  h.hidden=false;h.style.left=x+"px";h.style.top=t+"px";h.style.height=Math.max(12,b-t)+"px"}
function undoToast(msg,snap){toast(msg,()=>{try{FAV=JSON.parse(snap.fav)}catch(e){}saveFav();if(snap.mk)marks[snap.id]=JSON.parse(snap.mk);else delete marks[snap.id];LS.set(PFX+"marks",JSON.stringify(marks));refreshMarks();if($("nlist"))openNotes();toast("Undone")})}
const selSnap=id=>({id,fav:JSON.stringify(FAV),mk:marks[id]?JSON.stringify(marks[id]):null});
function inkTap(k){if(!SEL)return;const id=SEL.id,snap=selSnap(id);let msg;
  if(SEL.whole){const was=inkOf(marks[id]||{});saveMark(id,{hl:was===k?false:INK2HL[k]});msg=was===k?"Mark removed":"Speech marked: "+inkName(k)}
  else{const f=selFav(),{a,b}=SEL,txt=favText(id,a,b);
    if(f&&fcOk(f.c)===k&&f.a+""===a+""&&f.b+""===b+""){FAV=FAV.filter(x=>x!==f);msg="Mark removed"}
    else{if(f)Object.assign(f,{a,b,txt,c:k});else FAV.push({id,a,b,txt,note:"",c:k,t:Date.now()});msg="Marked: "+inkName(k)}
    favSort();saveFav()}
  LS.set(PFX+"fc",k);SEL=null;selHide();refreshMarks();undoToast(msg,snap)}
function noteSave(){if(!SEL)return;const v=$("mk-note").value.trim(),id=SEL.id,snap=selSnap(id);
  if(SEL.whole)saveMark(id,{note:v});
  else{const f=selFav(),{a,b}=SEL,txt=favText(id,a,b);if(f)Object.assign(f,{a,b,txt,note:v});else if(v)FAV.push({id,a,b,txt,note:v,c:inkLast(),t:Date.now()});favSort();saveFav()}
  SEL=null;selHide();refreshMarks();undoToast(v?"Note saved":"Note removed",snap)}
function inkRename(k){const w=$("mk-rw");if(!w)return;$("mk-nw").hidden=true;w.hidden=false;
  w.innerHTML=`<label for="mk-rn" class="mkl">Rename the ${INKC[k]} ink, for every play</label><input id="mk-rn" maxlength="20" autocomplete="off" value="${esc(inkName(k))}"><div class="mkrow"><button type="button" class="btn sm primary" id="mk-rs">Save</button><button type="button" class="btn sm" id="mk-rr">Reset to ${esc(INKD[k])}</button></div>`;
  const i=$("mk-rn");i.focus({preventScroll:true});i.select();
  const set=v=>{const n=Object.assign({},INKN);v=String(v||"").trim().slice(0,20);if(v&&v!==INKD[k])n[k]=v;else delete n[k];INKN=n;LS.set("folio-inks",JSON.stringify(n));selPaint(true);toast("Ink renamed: "+inkName(k))};
  $("mk-rs").onclick=()=>set(i.value);$("mk-rr").onclick=()=>set("");i.onkeydown=e=>{if(e.key==="Enter")set(i.value)};selPlace()}
document.addEventListener("pointerdown",e=>{if(SEL&&!e.target.closest("#mkpill,.mkh,#vp,#toast"))clearSel()},true);

/* ---------- speech tools: side panel (wide) or sheet (phone) ---------- */
let toolsId=null;
const thOf=m=>(Array.isArray(m.th)?m.th:[]).filter(x=>QUOTES.themes[x]);
function pairHTML(sp,q,cur){const og=sp.lines.slice(q[0],q[1]+1).map(l=>`<span>${esc(l.replace(/^~/,""))}</span>`).join("");
  return `<div class="pair${cur?" cur":""}"><div class="ptag">Shakespeare</div><div class="porig">${og}</div><div class="pmod"><div class="ptag">Modern English</div><p>${esc(q[2])}</p></div></div>`}
const partAt=(el,sp)=>{const pt=el&&el.closest&&(el.closest(".pt")||(el.closest(".chunk")||sp).querySelector(".pt"));return pt?+pt.dataset.p:0};
/* 4.3 chrome: the play's emblem in the top bar, a ribbon of the whole play with a tick at each act in the bottom bar */
function ribbon(f){const r=$("prib");if(!r)return;if(!r.firstChild){const t=[];let k=0;for(const a of ACTS){const n=scenes.filter(p=>p.act===a).length;if(!n)continue;if(k)t.push(`<b style="left:${(k/scenes.length*100).toFixed(2)}%"></b>`);k+=n}
  r.innerHTML=`<i></i>${t.join("")}`;const e=$("b-emb");if(e&&typeof emblemSVG==="function")e.innerHTML=emblemSVG(PLAY,"bembs")}
  r.firstChild.style.width=(Math.max(0,Math.min(1,f))*100).toFixed(2)+"%"}
function toolsHTML(id,pi){
  const sp=speech[id],p=sceneOf(id),m=marks[id]||{},ps=partsOf(sp),q=ps[pi]||ps[0],gl=glossList({lines:sp.lines.slice(q[0],q[1]+1)}),sn=STUDY.notes[id],c=CH[sp.who],qs=QBY[id]||[],nf=FAV.filter(f=>f.id===id).length,th=thOf(m);
  const tabs=[["mod","Modern"],["words","Words"+(gl.length?` <small>${gl.length}</small>`:"")],["note","Note"+(m.note||sn?" <small>•</small>":"")],["mark","Mark"]];
  return `<div class="tool ttabbed" data-tt="${TTAB}">
    <div class="tpin">${c?folioMedal(sp.who,COLORS[sp.who],"tpm"):""}<div><div class="ref">${sName(p)} · lines ${sp.start+q[0]}–${sp.start+q[1]}${ps.length>1?` · part ${(pi||0)+1} of ${ps.length}`:""}</div></div></div>
    <div class="ttabs" role="tablist" aria-label="Speech tools">${tabs.map(([k,l])=>`<button type="button" role="tab" data-ttab="${k}" aria-selected="${TTAB===k}">${l}</button>`).join("")}</div>
    <div data-tp="mod"><div class="modern"><div class="pair"><div class="pmod"><div class="ptag">Modern English</div><p>${esc(q[2])}</p></div></div></div>
    ${qs.map(q=>`<h3 class="lbl">Key quote</h3><div class="snote"><i>“${esc(q.text)}”</i><br>${esc(q.note)}${EX.why[q.i]?`<br><b>Why it matters:</b> ${esc(EX.why[q.i])}`:""}<br><small class="muted">${q.themes.map(t=>QUOTES.themes[t][0]).join(" · ")}</small></div>`).join("")}
    ${EX.irony[id]?`<h3 class="lbl">Dramatic irony</h3><div class="snote">${esc(EX.irony[id])}</div>`:""}
    ${(EX.dev[id]||[]).map(([k,n])=>`<h3 class="lbl">${esc(EX.devices[k])}</h3><div class="snote">${esc(n)}</div>`).join("")}
    ${c?`<details class="about"><summary>About ${esc(title(sp.who))}</summary><p>${esc(c.desc)}</p></details>`:""}${dirTools(id)}${thoughtHTML(sp)}</div>
    <div data-tp="words">${gl.length?`<dl class="tdl">${gl.map(k=>`<dt>${esc(k)}</dt><dd>${esc(G[k])}</dd>`).join("")}</dl>`:`<p class="muted">No glossed words in these lines.</p>`}
    <details class="about vlabd"><summary>Verse lab: beats, shared lines, punctuation</summary>${verseLabHTML(sp,q[0],q[1])}</details></div>
    <div data-tp="note">${sn?`<h3 class="lbl">Study note</h3><div class="snote">${esc(sn)}</div>`:""}
    <h3 class="lbl">My note</h3><label for="tn" class="sr">My note</label><textarea id="tn" placeholder="Your thoughts on these lines…">${esc(m.note||"")}</textarea>
    <div class="acts"><button class="btn sm" id="t-save">Save note</button></div></div>
    <div data-tp="mark"><div class="trow" role="group" aria-label="Mark and share">
      <div class="hlset" role="group" aria-label="Mark the whole speech">${INK.map(k=>`<button class="tb hlb${inkOf(m)===k?" on":""}" data-hl="${k}" aria-pressed="${inkOf(m)===k}"><i class="hlk fc-${k}"></i><small>${esc(inkName(k))}</small></button>`).join("")}</div>
      <button class="tb" id="t-fph"><span><svg class="tbi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></span><small>Mark words${nf?` (${nf})`:""}</small></button>
      <button class="tb" id="t-focus" aria-pressed="${S.focus===sp.who}"><span><svg class="tbi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg></span><small>${S.focus===sp.who?"Undim":"Dim others"}</small></button>
      <button class="tb" id="t-follow" aria-pressed="${S.who===sp.who}"><span><svg class="tbi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 3.8-6 7-6s6 2 7 6"/></svg></span><small>${S.who===sp.who?"Everyone":"Only "+esc(title(sp.who))}</small></button>
      <button class="tb" id="t-copy"><span><svg class="tbi" viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg></span><small>Copy</small></button>
      <button class="tb" id="t-img"><span><svg class="tbi" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg></span><small>Image</small></button>
    </div>
    <h3 class="lbl">Tag themes${th.length?` (${th.length})`:""}</h3><div class="tchips">${Object.entries(QUOTES.themes).map(([k,v])=>`<button class="chip" data-tth="${k}" aria-pressed="${th.includes(k)}">${esc(v[0])}</button>`).join("")}</div></div>
  </div>`}
/* 4.6: Speech tools tabs (session only) */
let TTAB="mod";
function wireTools(id,pi){
  const sp=speech[id],ps=partsOf(sp),q=ps[pi]||ps[0];
  wirePerf(id);
  document.querySelectorAll(".tool [data-ttab]").forEach(b=>b.onclick=()=>{TTAB=b.dataset.ttab;const t=b.closest(".tool");t.dataset.tt=TTAB;t.querySelectorAll("[data-ttab]").forEach(x=>x.setAttribute("aria-selected",x===b));const sc=t.closest(".panel-body,#panel-body,#sheet-body");if(sc)sc.scrollTop=0});
  $("t-save").onclick=()=>{const v=$("tn").value;saveMark(id,{note:v});toast(v.trim()?"Note saved":"Note removed")};
  document.querySelectorAll(".tool [data-hl]").forEach(b=>b.onclick=()=>{const k=b.dataset.hl,on=inkOf(marks[id]||{})!==k;saveMark(id,{hl:on?INK2HL[k]:false});
    document.querySelectorAll(".tool [data-hl]").forEach(x=>{const a=on&&x===b;x.classList.toggle("on",a);x.setAttribute("aria-pressed",a)});markPart();toast(on?"Speech marked: "+inkName(k):"Mark removed")});
  $("t-focus").onclick=()=>{S.focus=S.focus===sp.who?"":sp.who;applySettings();refreshMarks();markPart();$("t-focus").innerHTML=`<span><svg class="tbi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg></span><small>${S.focus===sp.who?"Undim":"Dim others"}</small>`;$("t-focus").setAttribute("aria-pressed",S.focus===sp.who);toast(S.focus?"Dimming everyone except "+title(S.focus):"Showing everyone normally")};
  $("t-follow").onclick=()=>{S.who=S.who===sp.who?"":sp.who;closePanel();closeSheet();cur.sig="";openScene(sIdx(sp.page),{speech:id});toast(S.who?"Showing only "+title(S.who):"Showing everyone")};
  document.querySelectorAll(".tool [data-tth]").forEach(b=>b.onclick=()=>{const k=b.dataset.tth,th=((marks[id]||{}).th||[]).slice(),i=th.indexOf(k);if(i<0)th.push(k);else th.splice(i,1);saveMark(id,{th});b.setAttribute("aria-pressed",i<0);toast(i<0?"Tagged: "+QUOTES.themes[k][0]:"Tag removed")});
  $("t-img").onclick=()=>{const kq=(QBY[id]||[])[0];openImage(kq?[kq.text]:sp.lines.slice(q[0],q[1]+1).map(l=>l.replace(/^~/,"")),title(sp.who),sName(sceneOf(id))+", lines "+(sp.start+q[0])+"–"+(sp.start+q[1]))};
  $("t-fph").onclick=()=>{const w=[q[0],0];closeSheet();closePanel();showPartPage(id,pi);startSel({id,w},false);toast("Drag a handle or tap a word to take in more")};
  $("t-copy").onclick=()=>copyText(sp.lines.slice(q[0],q[1]+1).map(l=>l.replace(/^~/,"")).join("\n")+`\n— ${title(sp.who)}, ${sName(sceneOf(id))}`);
}
/* tap an underlined word: small pop-up with its meaning (wins over the part tap) */
let gpop=null;
function showGloss(el){const w=el.textContent,k=gmap[w.toLowerCase()];if(!k)return;
  const d=document.createElement("div");d.className="gpop gslip";d.innerHTML=`<b>${esc(k)}</b><span>${esc(G[k])}</span><div class="gacts">${toLink("study:explore:glossary?w="+encodeURIComponent(k),"Glossary")}</div>`;
  document.body.appendChild(d);const r=el.getBoundingClientRect(),bw=d.offsetWidth,bh=d.offsetHeight;
  let x=Math.max(10,Math.min(innerWidth-bw-10,r.left+r.width/2-bw/2)),y=r.top-bh-12;if(y<10){y=r.bottom+12;d.classList.add("below")}
  d.style.left=x+"px";d.style.top=y+"px";d.style.setProperty("--ax",Math.max(14,Math.min(bw-14,r.left+r.width/2-x))+"px");el.classList.add("on");d._el=el;gpop=d;coachDid(1);
  d.addEventListener("pointerup",e=>e.stopPropagation())}
document.addEventListener("pointerdown",e=>{if(gpop&&!e.target.closest(".gpop,#vp"))hideGloss()},true);
function showPop(el,h,txt,acts,icon){hideGloss();const d=document.createElement("div");d.className="gpop"+(icon?" wpop":"");d.innerHTML=`${icon||""}<small>${esc(h)}</small><span>${esc(txt)}</span>${acts?`<div class="gacts">${acts}</div>`:""}`;
  document.body.appendChild(d);const r=el.getBoundingClientRect(),bw=d.offsetWidth,bh=d.offsetHeight;
  let x=Math.max(10,Math.min(innerWidth-bw-10,r.left+r.width/2-bw/2)),y=r.bottom+8;if(y+bh>innerHeight-10)y=r.top-bh-8;
  d.style.left=x+"px";d.style.top=y+"px";gpop=d;d.addEventListener("pointerup",e=>e.stopPropagation())}
function openKQ(i){const q=QUOTES.quotes[i];if(!q)return;const sp=speech[q.id],p=sceneOf(q.id);hideGloss();
  const t0=q.themes[0],emb=t0?TEMB[temb(t0)]||"":"";
  const ic=(d,l,to)=>`<button type="button" class="kqi" data-to="${to}"><svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg><small>${l}</small></button>`;
  openSheet("Key quote",`<div class="kq46" style="--c:${COLORS[sp.who]||"var(--ink)"}">${emb?`<svg class="kqemb" viewBox="0 0 64 64" aria-hidden="true">${emb}</svg>`:""}<span class="kqmk" aria-hidden="true">❦</span><blockquote>${esc(q.text)}</blockquote>
   <div class="kqwho">${CH[sp.who]?folioMedal(sp.who,COLORS[sp.who],"kqm2"):""}<div><b>${esc(title(sp.who))}</b><span>${sName(p)}</span></div></div>
   <div class="kqth">${q.themes.map(t=>`<span class="th">${esc(QUOTES.themes[t][0])}</span>`).join("")}</div><p>${esc(q.note)}</p>${EX.why&&EX.why[q.i]?`<p class="kqwhy"><b>Why it matters</b>${esc(EX.why[q.i])}</p>`:""}</div>
   <div class="kqrow">${t0?ic('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',"Theme","study:themes?th="+t0):""}${ic('<path d="M7 6h10M7 11h10M7 16h6"/><path d="M4 4v16"/>',"All quotes","study:quotes?who="+encodeURIComponent(sp.who))}${ic('<rect x="4" y="6" width="13" height="13" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v11"/>',"Flashcards","study:cards")}${ic('<path d="M5 12h12M13 6l6 6-6 6"/>',"Go to line","speech:"+q.id)}</div>`)}
function hideGloss(){if(gpop){gpop._el&&gpop._el.classList.remove("on");gpop.remove();gpop=null}}
function pulseLast(){let lp=null;try{lp=JSON.parse(LS.get(PFX+"lastpart")||"null")}catch(e){}if(!lp)return;
  const el=pg.querySelector(`.sp[data-id="${lp.id}"] .pt[data-p="${lp.pi}"]`);if(el){el.classList.add("pulse");setTimeout(()=>el.classList.remove("pulse"),3400)}}
let RECENT=[];try{RECENT=JSON.parse(LS.get(PFX+"recent")||"[]")}catch(e){}
function addRecent(id,pi){RECENT=[{id,pi},...RECENT.filter(r=>!(r.id===id&&r.pi===pi))].slice(0,10);LS.set(PFX+"recent",JSON.stringify(RECENT));LS.set(PFX+"lastpart",JSON.stringify({id,pi}))}
/* jump the page to show a given part */
function showPartPage(id,pi){const sp=speech[id];if(sIdx(sp.page)!==cur.k)return;const ln=partsOf(sp)[pi][0];
  if(pg.querySelector(`.sp[data-id="${id}"] .pt[data-p="${pi}"]`))return;const f=findKey(id+":"+ln);if(f>=0&&f!==cur.i)renderPage(f,0)}
/* tap a part: its modern English; expand to the whole speech (tapped part faintly marked) and collapse back */
let partSel=null;
function markPart(){if(partSel)pg.querySelectorAll(`.sp[data-id="${partSel.id}"] .pt[data-p="${partSel.pi}"]`).forEach(x=>x.classList.add("cur"))}
function partHTML(id,pi,all){const sp=speech[id],ps=partsOf(sp),p=ps[pi],n=ps.length;
  const ref=`${sName(sceneOf(id))} · lines ${sp.start+p[0]}–${sp.start+p[1]}${n>1?` · part ${pi+1} of ${n}`:""}`;
  const body=all?`<div class="pmod wholemod"><div class="ptag">Modern English · whole speech</div>${ps.map((q,i)=>`<p class="mp${i===pi?" cur":""}">${esc(q[2])}</p>`).join("")}</div>`:pairHTML(sp,p);
  return `<div class="tool"><div class="ref">${ref}</div>
    <div class="acts partnav">${n>1?`<button class="btn sm" id="pt-x" aria-expanded="${all}">${all?"Collapse to this part":"Expand to whole speech"}</button>`:""}<button class="btn sm" id="pt-more">Notes &amp; word meanings</button></div>
    ${n>1?`<div class="pnav"><button class="btn sm" id="pt-prev"${pi===0?" disabled":""}>‹ Previous part</button><button class="btn sm" id="pt-next"${pi===n-1?" disabled":""}>Next part ›</button></div>`:""}
    <div style="height:14px"></div><div class="modern${all?" whole":""}">${body}</div>
    ${all?"":`<div class="qn2"><h3 class="lbl">Quick note</h3><label for="qn" class="sr">Quick note</label><textarea id="qn" placeholder="Your thoughts on this speech…">${esc((marks[id]||{}).note||"")}</textarea><div class="acts"><button class="btn sm" id="qn-save">Save note</button></div></div>`}</div>`}
function openPart(id,pi,all){
  partSel={id,pi};toolsId=id;const sp=speech[id];
  pg.querySelectorAll(".pt.cur").forEach(x=>x.classList.remove("cur"));pg.querySelectorAll(".sp.active").forEach(x=>x.classList.remove("active"));markPart();
  const h=partHTML(id,pi,all);
  if(wide()){document.body.classList.add("tools");$("panel-title").textContent=title(sp.who);$("panel-body").innerHTML=h;$("panel").classList.add("open");$("panel-body").scrollTop=0;fitPanel(true,id,pi)}
  else openSheet(title(sp.who),h);
  const x=$("pt-x");if(x)x.onclick=()=>{openPart(id,pi,!all);const c=document.querySelector(".modern.whole .mp.cur");if(c)c.scrollIntoView({block:"center"})};
  $("pt-more").onclick=()=>openTools(id,pi);
  const go=d=>{const np=pi+d;showPartPage(id,np);openPart(id,np,all)};
  if($("pt-prev"))$("pt-prev").onclick=()=>go(-1);if($("pt-next"))$("pt-next").onclick=()=>go(1);
  if($("qn-save"))$("qn-save").onclick=()=>{const v=$("qn").value;saveMark(id,{note:v});markPart();toast(v.trim()?"Note saved":"Note removed")};
  addRecent(id,pi);
}
function openTools(id,pi){
  pi=pi||0;toolsId=id;partSel={id,pi};const sp=speech[id];
  pg.querySelectorAll(".pt.cur").forEach(x=>x.classList.remove("cur"));pg.querySelectorAll(".sp.active").forEach(x=>x.classList.remove("active"));markPart();
  if(wide()){document.body.classList.add("tools");$("panel-title").textContent=title(sp.who);$("panel-body").innerHTML=toolsHTML(id,pi);$("panel").classList.add("open");$("panel-body").scrollTop=0;fitPanel(true,id,pi);wireTools(id,pi)}
  else{openSheet(title(sp.who),toolsHTML(id,pi));wireTools(id,pi)}
}
/* tablet portrait (760-1099px): the page narrows beside the open panel instead of running under it */
function partKey(id,pi){const sp=speech[id],ps=sp&&partsOf(sp);return ps&&ps[pi||0]?id+":"+ps[pi||0][0]:null}
function fitPanel(on,id,pi){const b=document.body.classList;if(on&&!(wide()&&view==="reader"&&cur.k>=0))on=false;if(on===b.contains("tight"))return;
  b.toggle("tight",on);const key=id!=null?partKey(id,pi):null;if(view==="reader"&&cur.k>=0){openScene(cur.k,key?{key,keep:true}:{key:pos&&pos.key,keep:true});markPart()}}
function closePanel(){const was=partSel||(toolsId!=null?{id:toolsId,pi:0}:null);$("panel").classList.remove("open");if(document.body.classList.contains("tight")&&!document.body.classList.contains("sside")){partSel=null;fitPanel(false,was&&was.id,was&&was.pi)}document.body.classList.remove("tools");toolsId=null;partSel=null;pg.querySelectorAll(".pt.cur").forEach(x=>x.classList.remove("cur"));pg.querySelectorAll(".sp.active").forEach(x=>x.classList.remove("active"))}
$("panel-close").onclick=closePanel;
/* iOS home-screen apps ignore window.print(): offer Print only where a browser can print */
const canPrint=()=>!(navigator.standalone===true||(/iP(hone|ad|od)/.test(navigator.userAgent)&&matchMedia("(display-mode: standalone)").matches));
/* the system share sheet (Notes, Mail, Copy, Print); falls back to copying */
function shareText(title,text){navigator.share({title,text}).catch(e=>{if(!e||e.name!=="AbortError")copyText(text)})}
async function copyText(t){try{await navigator.clipboard.writeText(t);toast("Copied")}catch(e){const ta=document.createElement("textarea");ta.value=t;ta.setAttribute("readonly","");ta.style.cssText="position:fixed;top:0;left:0;opacity:0;font-size:16px";document.body.appendChild(ta);ta.select();ta.setSelectionRange(0,t.length);let ok=false;try{ok=document.execCommand("copy")}catch(_){}ta.remove();toast(ok?"Copied":"Copy didn’t work here. Select the text and copy it yourself.")}}

/* ---------- study ---------- */
const TABS=[["review","Review"],["explore","Explore"],["quotes","Key quotes"],["cards","Flashcards"],["part","Learn a part"],["drill","Practise"],["quiz","Quizzes"],["themes","Themes"],["plan","Essay planner"],["extract","Extract"],["para","Paragraphs"],["prof","Profiles"],["acts","Act summaries"],["revise","Revision sheet"]];
/* Study (4.1): eight illustrated topics. Each topic is a page of small tool tiles; every tool opens full screen under one header
   (back to its topic, its title, a ? for the how-to). People and Themes add a page per character and per theme.
   #study = home, #study=topic:<k>, #study=who:<NAME>, #study=theme:<k>, #study=<tab>[:<explore part>|<drill>] = a tool. */
const SPAGES=["topic","who","theme"];let SV=null,TP="";
const TOPICS=[["story","Story",["acts","explore:timeline","explore:facts","explore:iago","explore:arcs","explore:context","explore:director"]],
  ["people","People",["explore:analysis","prof","part","explore:map","explore:contrast"]],
  ["themes","Themes",["themes","explore:motifs","explore:symbols","explore:bigq","explore:critics"]],
  ["quotes","Quotes",["quotes","cards","drill:gap","drill:ladder","drill:who","drill:scene","drill:time","explore:compare"]],
  ["words","Words",["explore:glossary","explore:devices","explore:verse","explore:insults","explore:pronouns","drill:word","drill:untangle","drill:pun","drill:stress"]],
  ["practise","Practise",["review","quiz","cards","part","drill:gap","drill:ladder","drill:who","drill:scene","drill:next","drill:time","drill:odd","drill:explain","drill:order","drill:word","drill:cut","drill:two"]],
  ["write","Write",["plan","extract","para"]],
  ["revise","Revise",["revise","acts","review","quiz"]]];
const TLINE={story:"The plot act by act, with the facts behind it",people:"Who's who, what drives them, how they change",themes:"The big ideas, traced from start to end",quotes:"The lines to know, one card at a time",words:"Old words, imagery, verse and wordplay",practise:"Quizzes, flashcards and quick drills",write:"Exam answers, one step at a time",revise:"Your sheet, cards due and backup"};
/* any Explore part not placed above joins Story */
EXT.forEach(([k])=>{if(!TOPICS.some(t=>t[2].includes("explore:"+k)))TOPICS[0][2].push("explore:"+k)});
const topicK=k=>TOPICS.find(t=>t[0]===k)||TOPICS[0];
const EXAMT=["explore:critics","plan","extract","para"];
const topicsNow=()=>folioSimple()?TOPICS.filter(t=>t[0]!=="write"):TOPICS;
const toolOK=s=>{if(folioSimple()&&EXAMT.includes(s))return false;const [a,b]=s.split(":");if(a==="explore")return EXT.some(x=>x[0]===b)&&exHas(b);if(a==="drill")return DRILLS.some(d=>d[0]===b);if(a==="para")return (EX.models||[]).length>0;return TABS.some(t=>t[0]===a)};
const toolName=s=>{const [a,b]=s.split(":");if(a==="explore")return b?(EXT.find(x=>x[0]===b)||[,b])[1]:"Explore";if(a==="drill")return b?(DRILLS.find(d=>d[0]===b)||[,b])[1]:"Drills";return (TABS.find(t=>t[0]===a)||[,a])[1]};
/* 4.9 one-line descriptions for the tool lists (Explore parts and drills describe themselves) */
const TDESC={review:"Cards due today, spaced out so they stick",explore:"Facts, context, language and more",quotes:"Every key quote, by speaker or theme",cards:"Flip a quote: who said it, and why it matters",part:"Learn a character's lines from their cues",drill:"Quick games with the lines",quiz:"Four questions on each scene, or the whole play",themes:"Trace a theme from start to end, then copy a plan",plan:"Build an essay plan step by step",extract:"Answer on an extract, marked against the AOs",para:"Model paragraphs, taken apart",prof:"Build a character profile in steps",acts:"Each act on a page: what happens and why",revise:"Your marks, scores and quotes on one sheet"};
const toolDesc=s=>{const [a,b]=s.split(":");if(a==="explore"&&b)return (EXT.find(x=>x[0]===b)||[,,""])[2];if(a==="drill"&&b)return (DRILLS.find(d=>d[0]===b)||[,,""])[2];return TDESC[a]||""};
const toolNow=()=>S.stab==="explore"?(exSel?"explore:"+exSel:"explore"):S.stab==="drill"?(dr.k?"drill:"+dr.k:"drill"):S.stab;
const topicOf=s=>{if(TP&&topicK(TP)[2].includes(s))return TP;const t=TOPICS.find(t=>t[2].includes(s));return t?t[0]:s.startsWith("drill")?"practise":s.startsWith("explore")?"story":"revise"};
/* emblems, 64×64 line drawings in the topic's ink */
const EMB={story:'<path d="M17 12h28a6 6 0 0 1 6 6v34H23a6 6 0 0 1-6-6z"/><path d="M17 12a6 6 0 0 0-6 6v5h6M51 52a6 6 0 0 0 6-6v-5h-6"/><path d="M25 23h18M25 30h18M25 37h18M25 44h11"/>',
  people:'<circle cx="24" cy="24" r="8.5"/><path d="M8 52c0-10 7-16 16-16s16 6 16 16"/><circle cx="43" cy="20" r="7"/><path d="M37 31.5c2-1 4-1.5 6-1.5 8 0 13 6 13 15"/>',
  themes:'<path d="M32 6l5.5 20.5L58 32l-20.5 5.5L32 58l-5.5-20.5L6 32l20.5-5.5z"/><path d="M32 18v28M18 32h28" class="th"/><circle cx="32" cy="32" r="4" class="f"/>',
  quotes:'<path d="M14 14h36a5 5 0 0 1 5 5v21a5 5 0 0 1-5 5H31l-11 9v-9h-6a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5z"/><path d="M28 24c-4 1-6 4-6 8h5v-5h-1M42 24c-4 1-6 4-6 8h5v-5h-1"/>',
  words:'<path d="M32 17c-6-4-14-5-23-4v35c9-1 17 0 23 4 6-4 14-5 23-4V13c-9-1-17 0-23 4zM32 17v35"/><path d="M15 39l5-15 5 15M16.8 34h6.4M39 24h10M39 31h10M39 38h7"/>',
  practise:'<circle cx="29" cy="35" r="20"/><circle cx="29" cy="35" r="12"/><circle cx="29" cy="35" r="4" class="f"/><path d="M29 35L52 12M45 9.5l7 2.5 2.5 7"/>',
  write:'<path d="M12 42h22l2.5 13h-27z"/><path d="M16 42v-5h14v5"/><path d="M27 37C32 22 41 12 56 7c-2 14-11 25-25 31"/><path d="M38 25l7 2"/>',
  revise:'<path d="M17 8h30M17 56h30M21 8c0 13 21 14 21 24S21 43 21 56M43 8c0 13-21 14-21 24s21 11 21 24"/><path d="M26 51h12l-6-7z" class="f"/><path d="M28 19h8" class="th"/>'};
const TEMB={heart:'<path d="M32 53S11 40 11 25a10.5 10.5 0 0 1 21-3 10.5 10.5 0 0 1 21 3c0 15-21 28-21 28z"/><path d="M20 24a5 5 0 0 1 5-5" class="th"/>',
  crown:'<path d="M12 46 9 21l13 11 10-17 10 17 13-11-3 25z"/><path d="M12 53h40"/><circle cx="32" cy="12" r="2.6" class="f"/><circle cx="9" cy="19" r="2" class="f"/><circle cx="55" cy="19" r="2" class="f"/>',
  skull:'<path d="M32 9C21 9 13 17 13 28c0 6 3 10 7 13v8h24v-8c4-3 7-7 7-13C51 17 43 9 32 9z"/><circle cx="25" cy="29" r="4.6" class="f"/><circle cx="39" cy="29" r="4.6" class="f"/><path d="M32 35l-2.5 5h5zM26 49v6M32 49v6M38 49v6"/>',
  sword:'<path d="M47 9h8v8L29 43l-8-8z"/><path d="M15 31l18 18M23 41 11 53M8 50l6 6"/>',
  mask:'<path d="M11 15c8 3.5 17 3.5 21 0 4 3.5 13 3.5 21 0 0 19-6 34-21 34S11 34 11 15z"/><path d="M19 26c2.5-2.5 6-2.5 8.5 0M36.5 26c2.5-2.5 6-2.5 8.5 0M24 39c5 4 11 4 16 0"/>',
  eye:'<path d="M5 32s10-15 27-15 27 15 27 15-10 15-27 15S5 32 5 32z"/><circle cx="32" cy="32" r="8"/><circle cx="32" cy="32" r="3" class="f"/>',
  moon:'<path d="M40 9a23 23 0 1 0 15 35A19 19 0 0 1 40 9z"/><path d="M47 16l1.6 3.9 3.9 1.6-3.9 1.6L47 27l-1.6-3.9-3.9-1.6 3.9-1.6z" class="f"/>',
  wheel:'<circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="5" class="f"/><path d="M32 9v18M32 37v18M9 32h18M37 32h18M15.7 15.7l12.8 12.8M35.5 35.5l12.8 12.8M48.3 15.7 35.5 28.5M28.5 35.5 15.7 48.3"/>',
  leaf:'<path d="M13 51C13 26 30 11 53 11c0 25-15 42-40 40z"/><path d="M13 51 41 23M27 37h9M33 31v-9"/>',
  scales:'<path d="M32 9v44M20 55h24M13 17h38M13 17 6 34h14zM51 17l-7 17h14z"/><path d="M6 34a7 4 0 0 0 14 0M44 34a7 4 0 0 0 14 0"/><circle cx="32" cy="9" r="2.4" class="f"/>',
  quill:'<path d="M52 7C35 11 22 26 16 47l4 2c4-8 10-14 18-16-4-2-6-2-8-2 8-4 15-12 22-24z"/><path d="M14 57l4-10"/>',
  rose:'<circle cx="32" cy="25" r="13"/><path d="M32 25c-4-4 0-9 4-6M26 21c2 6 8 8 12 4M32 38v18M32 48c-6-6-12-4-15-2 4 3 11 4 15 2zM32 46c4-4 10-4 13-2-4 3-9 3-13 2z"/>',
  coin:'<circle cx="28" cy="35" r="17"/><circle cx="28" cy="35" r="12"/><path d="M41 14a17 17 0 0 1 14 19"/><path d="M28 28v14M24 31h7a2.5 2.5 0 0 1 0 5h-6a2.5 2.5 0 0 0 0 5h7"/>',
  fleuron:'<path d="M32 53c0-11-6-17-15-17 0-9 7-15 15-9 8-6 15 0 15 9-9 0-15 6-15 17z"/><path d="M32 27c-4.5-6-4.5-13 0-19 4.5 6 4.5 13 0 19z"/>'};
const TEMBRX=[["rose",/women|gender|mother|manhood|taming|\bsex|wives/],["heart",/love|marri|desire|courtship|passion|friend|reconcil/],["skull",/death|mortal|grief|loss|suffer|sorrow/],["coin",/money|gold|trade|debt|greed|value|worth/],
  ["scales",/justice|law|mercy|forgiv|pardon|guilt|conscience|grace|god|providence|patience/],["crown",/king|power|authority|ambition|usurp|tyran|order|degree|nation|legitim|rule|politic|people|rome|england/],
  ["sword",/war|revenge|violence|honour|blood|feud|rebellion|rival|hate|loyal|treason|faction/],["mask",/appear|seem|disguise|identity|theatre|show|perform|decept|illusion|trick|manipul|play|mask/],
  ["eye",/jealous|sight|truth|trust|reput|rumou|noting|certain|blind/],["moon",/mad|magic|supernatural|dream|fair|prophec|witch|wonder|omen|ghost/],["wheel",/fortune|time|change|season|fate|haste|age/],
  ["leaf",/nature|pastoral|forest|country|wild|nurture|garden/],["quill",/word|language|wit|speech|rhetoric|voice|letter|token|name|oath|study|silence|learn/]];
const temb=k=>{const t=(k+" "+((QUOTES.themes[k]||[])[0]||"")).toLowerCase(),m=TEMBRX.find(([,r])=>r.test(t));return m?m[0]:"fleuron"};
const embSVG=(body,cls)=>`<svg class="${cls||"emb"}" viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
/* 4.2 "Illuminated folio": emblems for Context, icons for Key facts, banners, laurels, rings */
Object.assign(TEMB,{church:'<path d="M32 5v11M27 9.5h10"/><path d="M19 30l13-14 13 14"/><path d="M21 28v26h22V28"/><path d="M21 34l-11 7v13M43 34l11 7v13M6 54h52"/><path d="M28 54v-8a4 4 0 0 1 8 0v8"/>',
  globe:'<circle cx="32" cy="32" r="22"/><ellipse cx="32" cy="32" rx="10" ry="22"/><path d="M10 32h44M14 21h36M14 43h36"/>',
  ship:'<path d="M8 42h48l-7 11H15z"/><path d="M32 7v35"/><path d="M34 11c9 6 13 15 13 25H34zM30 15c-8 5-12 12-12 21h12z"/><path d="M32 7l9 3-9 3z" class="f"/>',
  ghost:'<path d="M18 56V28a14 14 0 0 1 28 0v28l-5-4-4.5 4-4.5-4-4.5 4-4.5-4z"/><circle cx="27" cy="29" r="2.6" class="f"/><circle cx="37" cy="29" r="2.6" class="f"/><path d="M28 39c2.5 2 5.5 2 8 0"/>',
  book:'<path d="M10 14c8-2 16-1 22 4 6-5 14-6 22-4v36c-8-2-16-1-22 4-6-5-14-6-22-4z"/><path d="M32 18v36M16 24h10M16 31h10M38 24h10M38 31h10"/>'});
const CTXI=[["ghost",/ghost|witch|supernatural|magic|spirit|demon|devil|fair(y|ies)|omen|prophec/],["church",/church|relig|\bgod|protestant|catholic|bible|faith|\bsin\b|heaven|hell|purgator|reformation|pope|pilgrim|friar|\bnun/],
  ["globe",/globe|theatre|playhouse|stag(e|ing)|actor|audience|player|perform|production/],["ship",/\bship|\bsea\b|voyage|venice|merchant|colon|island|navy|\bsail|trade/],
  ["book",/source|holinshed|plutarch|ovid|plautus|\bbook|print|folio|chronicle|novella|\btale\b|\bdate|title|genre|problem play|farce/],["crown",/\bking|queen|monarch|throne|tudor|elizabeth|james|royal|succession|crown|prince|republic|tribune|politic|emperor|augustus|caesar/],
  ["sword",/\bwar\b|battle|rebellion|rising|soldier|army|duel|honour|revenge|actium|braggart/],["heart",/love|marri|courtship|\bwife|husband|women|gender|mother|bed-trick|wardship|petrarch/],
  ["scales",/\blaw|justice|crime|punish|usury|bond|primogeniture|\brank|class/],["coin",/money|wealth|debt|econom|enclosure/],["leaf",/nature|country|forest|pastoral|arden|golden age|rural/],
  ["moon",/\bmad|moon|melanchol|medicine|exorcis/],["mask",/\bfool|disguise|ganymede|comed|clown/],["eye",/\brace\b|moor|outsider|stranger|\bjew|reputation|egypt|\brome/]];
const pickI=(L,t,d)=>{t=String(t).toLowerCase();const m=L.find(([,r])=>r.test(t));return m?m[0]:d};
const FICON=Object.assign({},TEMB,{hour:EMB.revise,people:EMB.people,compass:EMB.themes,quote:EMB.quotes});
const FACTI=[["hour",/written|date|print|^when$/],["book",/source/],["mask",/genre|style|tone|comic/],["globe",/setting|where/],["wheel",/time|how long|length/],["quill",/title|word|language|verse|narrator|point of view/],
  ["people",/protagon|antagon|character|who talks|voice/],["sword",/turning|climax|inciting|rising|falling|resolution|ending|conflict|obstacle|plot|structure|peak/],["compass",/theme|motif|symbol|foreshadow/],["quote",/famous|lines|speech|soliloq|sonnet/]];
/* topic banner: a scalloped valance with gilt tassels, a lattice in the topic tint and the emblem as a watermark */
let BNN=0;
function tbanner(emb){const id="tb"+(++BNN);
  return `<svg class="tval" aria-hidden="true" width="100%" height="30"><defs><pattern id="${id}v" width="24" height="30" patternUnits="userSpaceOnUse"><path class="bvl" d="M0 0H24V12Q12 32 0 12Z"/><path class="bvf" d="M12 22v5"/><circle class="bvf2" cx="12" cy="28" r="1.8"/></pattern></defs><rect width="100%" height="30" fill="url(#${id}v)"/></svg>`+
   `<svg class="tban" viewBox="0 0 400 170" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><defs><pattern id="${id}p" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 9H18M9 0V18" class="bpl"/><circle cx="9" cy="9" r="1.7" class="bpd"/></pattern><linearGradient id="${id}g" x1="0" x2="1"><stop offset=".2" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient><mask id="${id}m"><rect width="400" height="170" fill="url(#${id}g)"/></mask></defs><rect width="400" height="170" fill="url(#${id}p)" mask="url(#${id}m)"/><svg x="246" y="12" width="150" height="150" viewBox="0 0 64 64" class="bwm">${emb}</svg></svg>`}
/* a laurel wreath (two branches), for big emblems, quiz results and the whole-play quiz */
const LAUR=(()=>{const P=(r,a)=>[50+r*Math.cos(a*Math.PI/180),50+r*Math.sin(a*Math.PI/180)].map(v=>v.toFixed(1));let s="";
  for(let a=110;a<=236;a+=14){const [x1,y1]=P(48,a),[x2,y2]=P(40,a+6);s+=`<ellipse cx="${x1}" cy="${y1}" rx="6.2" ry="2.4" transform="rotate(${a+52} ${x1} ${y1})"/><ellipse cx="${x2}" cy="${y2}" rx="5.4" ry="2.1" transform="rotate(${a+128} ${x2} ${y2})"/>`}
  const [sx,sy]=P(44,100),[ex,ey]=P(44,244),br=`<g><path class="lst" d="M${sx} ${sy}A44 44 0 0 1 ${ex} ${ey}"/>${s}</g>`;
  return br+`<g transform="matrix(-1 0 0 1 100 0)">${br}</g>`})();
const laurelSVG=cls=>`<svg class="laurel${cls?" "+cls:""}" viewBox="0 0 100 100" aria-hidden="true">${LAUR}</svg>`;
const wreathHTML=(ok,n)=>`<div class="wreath${n>0&&ok>=n?" full":""}">${laurelSVG("wl")}<div class="wrs"><b>${ok}</b> <small>of ${n}</small></div></div>`;
/* a progress ring round anything (a seal, a count) */
const ringAround=(inner,f,cls)=>{const C=2*Math.PI*30;return `<span class="rar${cls?" "+cls:""}${f>=1?" rfull":""}"><svg class="ring" viewBox="0 0 68 68" aria-hidden="true"><circle class="rt" cx="34" cy="34" r="30"/>${f>0?`<circle class="rf" cx="34" cy="34" r="30" stroke-dasharray="${(Math.min(1,f)*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 34 34)"/>`:""}</svg>${inner}</span>`};
const BEGIN=`<span class="beg">Begin</span>`;
/* tool icons, 24×24 */
const TIC={acts:'<path d="M6 4h10a3 3 0 0 1 3 3v13H9a3 3 0 0 1-3-3z"/><path d="M10 9h6M10 13h6"/>',timeline:'<path d="M3 12h18"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 6v3M12 15v3M18 6v3"/>',
  facts:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',iago:'<path d="M4 19h5v-5h5V9h5V4"/><path d="M16 4h3v3"/>',arcs:'<path d="M3 20h18M4 16l5-6 4 3 7-8"/>',context:'<path d="M4 20h16M6 20V9M10 20V9M14 20V9M18 20V9M3 9l9-5 9 5z"/>',
  director:'<path d="M4 9h16v11H4zM4 9l3-5 3 5M10 9l3-5 3 5"/>',analysis:'<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 20 20"/>',prof:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.4"/><path d="M5.5 17c.6-2 2-3 3.5-3s2.9 1 3.5 3M14 10h4M14 14h4"/>',
  part:'<path d="M4 5c3 1.5 6 1.5 8 0 2 1.5 5 1.5 8 0 0 8-3 14-8 14S4 13 4 5z"/><path d="M8 10h2M14 10h2M9 14c2 1.5 4 1.5 6 0"/>',map:'<circle cx="6" cy="7" r="2.5"/><circle cx="18" cy="7" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 7h7M7 9.2l3.8 6.6M17 9.2l-3.8 6.6"/>',
  contrast:'<path d="M12 4v16M5 20h14M4 8h16M4 8l-2 6h6zM20 8l-2 6h6z"/>',themes:'<path d="M4 20c4-1 4-6 8-7s4-6 8-7"/><circle cx="4" cy="20" r="1.6"/><circle cx="12" cy="13" r="1.6"/><circle cx="20" cy="6" r="1.6"/>',
  motifs:'<path d="M12 12a2 2 0 1 1 2-2 4 4 0 0 1-4 4 6 6 0 0 1-6-6 8 8 0 0 1 8-8"/><path d="M12 12a2 2 0 1 0-2 2 4 4 0 0 0 4-4 6 6 0 0 0 6 6 8 8 0 0 1-8 8" transform="rotate(180 12 12)"/>',
  symbols:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v3"/>',bigq:'<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 1-1 1.7V15M12 18.5v.5"/><circle cx="12" cy="12" r="9.5"/>',critics:'<path d="M4 5h16v10H10l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
  quotes:'<path d="M10 7c-3 1-5 3-5 7h4v-4M19 7c-3 1-5 3-5 7h4v-4"/>',cards:'<rect x="7" y="4" width="12" height="16" rx="2"/><path d="M5 7v12a2 2 0 0 0 2 2h9"/>',gap:'<path d="M3 12h4M17 12h4"/><rect x="8.5" y="9" width="7" height="6" rx="1" stroke-dasharray="2 2"/>',
  ladder:'<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/>',who:'<circle cx="9" cy="9" r="4"/><path d="M3 20c0-3.5 2.7-6 6-6M15 13a3 3 0 1 1 3 3v1.5M18 20v.5"/>',compare:'<rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/>',
  glossary:'<path d="M12 6c-2-1.5-5-2-8-1.6V19c3-.4 6 .1 8 1.6 2-1.5 5-2 8-1.6V4.4C17 4 14 4.5 12 6zM12 6v14.6"/>',devices:'<path d="M12 3l2 5.5L19.5 10 14 12l-2 5.5-2-5.5-5.5-2L10 8.5z"/><path d="M18 16l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>',
  verse:'<path d="M3 12c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 4.5 0 3 3 4.5 0"/><path d="M3 18h18M3 6h18"/>',insults:'<path d="M13 3 6 13h6l-1 8 7-10h-6z"/>',pronouns:'<path d="M4 7h7M7.5 7v11M14 11v7M14 13c.5-1.5 1.8-2 3-2s2.5.7 2.5 2.5V18"/>',
  word:'<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5 20 20M8 12.5l2-5 2 5M8.6 11h2.8"/>',untangle:'<path d="M4 7h4l8 10h4M4 17h4l3-3.8M13 9.8 16 7h4M18 5l2 2-2 2M18 15l2 2-2 2"/>',pun:'<path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4"/>',
  stress:'<path d="M4 18h16M7 14l3-8 3 8M8 11.5h4M15 6l3 3"/>',review:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9h16M8 3v4M16 3v4M9 14.5l2 2 4-4"/>',quiz:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12l3 3 5-6"/>',
  sprint:'<circle cx="12" cy="13" r="8"/><path d="M12 13V9M10 3h4M18 6l1.5-1.5"/>',
  scene:'<path d="M4 5h16v14H4z"/><path d="M4 9h16M9 5v4M15 5v4M8 14h8"/>',next:'<path d="M4 8h9l-3-3M13 8l-3 3"/><circle cx="17" cy="15" r="3"/><path d="M12 21c0-2.5 2.2-4 5-4s5 1.5 5 4"/>',time:'<path d="M12 3v18"/><circle cx="12" cy="6" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="18" r="2"/><path d="M14 6h6M4 12h6M14 18h6"/>',odd:'<circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="7" cy="17" r="3"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  explain:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',order:'<path d="M10 6h10M10 12h10M10 18h10M4 5h2v3M4 11.5c0-1 2-1 2 0s-2 1.5-2 2.5h2M4 17h2l-1 1.5c1 0 1.5.5 1 1.5H4"/>',cut:'<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M8 15 18 4M16 15 6 4"/>',
  two:'<path d="M4 8h16M4 16h11"/><circle cx="19" cy="16" r="1.5"/>',plan:'<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',extract:'<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 14h7M9 17h4"/><path d="M4 10v6" />',
  para:'<path d="M13 4v16M17 4v16M19 4h-9a4 4 0 0 0 0 8h3"/>',revise:'<path d="M6 9V3h12v6M6 17H4v-8h16v8h-2"/><path d="M6 14h12v7H6z"/>',dot:'<circle cx="12" cy="12" r="3"/>'};
const ticOf=s=>{const [a,b]=s.split(":");return TIC[b]||TIC[a]||TIC.dot};
const tic=s=>`<svg class="tic" viewBox="0 0 24 24" aria-hidden="true">${ticOf(s)}</svg>`;
const CHEV=`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`;
/* a ring round an emblem: f = 0..1, or null for no ring */
function ringEmb(body,f,cls){const C=2*Math.PI*30,big=/\bbig\b/.test(cls||"");return `<span class="remb${cls?" "+cls:""}${f!=null&&f>=1?" rfull":""}">${big?laurelSVG("rl"):""}<svg class="ring" viewBox="0 0 68 68" aria-hidden="true">${f==null?"":f<=0?`<circle class="rz" cx="34" cy="34" r="30"/>`:`<circle class="rt" cx="34" cy="34" r="30"/><circle class="rf" cx="34" cy="34" r="30" stroke-dasharray="${(Math.max(0,Math.min(1,f))*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 34 34)"/>`}</svg>${embSVG(body)}</span>`}
const profStarted=w=>{const p=PROF[w];return !!p&&((p.tr||[]).some(x=>x&&String(x).trim())||(p.q||[]).some(x=>x!==""&&x!=null)||!!String(p.sum||"").trim())};
const planHas=P=>!!P&&typeof P==="object"&&(!!String(P.th||"").trim()||(Array.isArray(P.pts)&&P.pts.some(pt=>pt&&(String(pt.p||"").trim()||String(pt.a||"").trim()||(pt.q!=null&&pt.q!=="")))));
const planCount=()=>Object.keys(PLAN).filter(x=>/^\d+$/.test(x)&&planHas(PLAN[x])).length;
const thLearnt=k=>{const qs=QUOTES.quotes.filter(q=>q.themes.includes(k));return [qs.filter(q=>prog.cards[q.i]).length,qs.length]};
function topicStat(k){const n=o=>Object.keys(o).length,sc=scenes.length,fr=(a,b)=>a/Math.max(1,b);
  if(k==="story"){const d=scenes.filter(p=>prog.done[p.id]).length;return [fr(d,sc),`${d} of ${sc} scenes`]}
  if(k==="people"){const d=MAINS.filter(profStarted).length;return [fr(d,MAINS.length),`${d} of ${MAINS.length} profiles`]}
  if(k==="themes"){const T=Object.keys(QUOTES.themes),d=T.filter(t=>thLearnt(t)[0]>0).length;return [fr(d,T.length),`${d} of ${T.length} themes`]}
  if(k==="quotes"){const d=n(prog.cards);return [fr(d,QUOTES.quotes.length),`${d} of ${QUOTES.quotes.length} learnt`]}
  if(k==="words")return [null,`${n(G)} words`];
  if(k==="practise"){const d=Object.keys(prog.quiz).filter(q=>q!=="all"&&sIdx(q)>=0),qa=d.reduce((a,q)=>a+prog.quiz[q][0]/Math.max(1,prog.quiz[q][1]),0)/sc,ln=fr(n(prog.cards),QUOTES.quotes.length),ks=Object.keys(DRB).filter(x=>x!=="lad"&&drBest(x)),db=ks.reduce((a,x)=>a+drBest(x)[0]/drBest(x)[1],0)/Math.max(1,DRILLS.length-2),m=(qa+ln+db)/3;
    return [m,`Mastery ${Math.round(m*100)}% · ${d.length} of ${sc} quizzes · ${n(prog.cards)} quotes learnt`]}
  if(k==="write"){const t=(EX.examq||[]).length,d=Math.min(t,planCount());return [fr(d,t),`${d} of ${t} plans`]}
  const due=dueKeys().length;return [null,due?`${due} due today`:"Sheet · backup"]}
/* one suggested next step: due reviews, then a quiz on a scene you've read, then the scene you're on, then flashcards */
function nextStep(){const d=dueKeys().length;if(d)return ["study:review",`Review ${d} card${d===1?"":"s"} due today`,"Practise"];
  const q=scenes.find(p=>prog.done[p.id]&&!prog.quiz[p.id]);if(q)return ["study:quiz?s="+q.id,`Quiz yourself on ${sName(q)}`,"Practise"];
  if(pos&&sIdx(pos.s)>=0&&!prog.done[pos.s])return ["scene:"+pos.s,`Read on: ${sName(scenes[sIdx(pos.s)])}`,"Read"];
  return ["study:cards","Learn key quotes with flashcards","Practise"]}
let SLAST=false;
/* swipeable decks: cards side by side with a counter and arrows (print shows them as a list) */
let DKN=0;
function deckHTML(cards,cls,label){if(!cards.length)return "";const id="dk"+(++DKN);
  return `<div class="dwrap${cls?" "+cls:""}"><div class="deck" id="${id}" tabindex="0" role="group" aria-label="${esc(label||"Cards")}: swipe for more">${cards.map(c=>`<div class="dc">${c}</div>`).join("")}</div>${cards.length>1?`<div class="dnav noprint"><button class="dbtn" type="button" data-dk="-1" aria-label="Previous card">‹</button><span class="dn" aria-live="polite">1 / ${cards.length}</span><button class="dbtn" type="button" data-dk="1" aria-label="Next card">›</button></div>`:""}</div>`}
/* 4.3: a deck is as tall as the card(s) in view, not its tallest card */
function dkFit(d){const b=d.getBoundingClientRect();let h=0;for(const c of d.children){const r=c.getBoundingClientRect();if(r.right>b.left+8&&r.left<b.right-8)h=Math.max(h,c.offsetHeight)}if(h)d.style.height=(h+12)+"px"}
let DKF=0;const fitDecks=()=>{cancelAnimationFrame(DKF);DKF=requestAnimationFrame(()=>document.querySelectorAll("#study .deck").forEach(dkFit))};
new MutationObserver(fitDecks).observe($("sbody"),{childList:true,subtree:true});addEventListener("resize",fitDecks);
document.addEventListener("click",e=>{const b=e.target.closest("[data-kqall]");if(!b)return;const q=b.previousElementSibling;if(q)q.classList.remove("kqc");b.remove();fitDecks()});
const dkStep=d=>{const c=d.children[0];return c?c.getBoundingClientRect().width+12:d.clientWidth};
$("study").addEventListener("scroll",e=>{const d=e.target;if(!d.classList||!d.classList.contains("deck"))return;clearTimeout(d._ft);d._ft=setTimeout(()=>dkFit(d),90);const n=d.children.length,i=Math.max(0,Math.min(n-1,Math.round(d.scrollLeft/dkStep(d)))),c=d.parentNode.querySelector(".dn");if(c)c.textContent=`${i+1} / ${n}`},true);
document.addEventListener("click",e=>{const b=e.target.closest("[data-dk]");if(!b)return;const d=b.closest(".dwrap").querySelector(".deck");d.scrollBy({left:(+b.dataset.dk)*dkStep(d),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})});
/* a key quote as a card: speaker medallion, the line, themes, note */
function qCard(q){const sp=speech[q.id];return `<div class="kq" style="--c:${COLORS[sp.who]||"var(--ink)"}"><div class="kqh">${folioMedal(sp.who,COLORS[sp.who],"kqm")}<span><b>${esc(title(sp.who))}</b><small>${sName(sceneOf(q.id))}</small></span></div>
  ${q.text.length>260?`<blockquote class="kqc">“${esc(q.text)}”</blockquote><button class="link kqall" type="button" data-kqall>Show all</button>`:`<blockquote>“${esc(q.text)}”</blockquote>`}<p class="kqt">${q.themes.map(t=>`<span class="th">${esc(QUOTES.themes[t][0])}</span>`).join("")}</p><p class="kqn">${esc(q.note)}</p>
  <div class="kqa">${chip(q.id)}${prog.cards[q.i]?`<span class="kql">Learnt</span>`:""}</div></div>`}
/* the Study header: a way back, the title, and a ? for the how-to */
function sHead(back,backL,ttl){$("sgroups").hidden=false;$("stabs").hidden=true;
  $("sgroups").innerHTML=`<button class="sgback" type="button" data-to="${esc(back)}" aria-label="Back to ${esc(backL)}">${CHEV}<span>${esc(backL)}</span></button><h2 class="sgname">${esc(ttl)}</h2><button class="sgq" id="sgq" type="button" aria-label="How this works" hidden>?</button>`}
const tTile=(s,tp)=>`<button class="ttool" type="button" data-to="study:${s}${s.includes("?")?"&":"?"}tp=${tp}">${tic(s.split("?")[0])}<span>${esc(toolName(s.split("?")[0]))}</span></button>`;
/* 4.9 Study home: a Today hero (continue, a five-minute plan, cards due), then the topics as illuminated contents rows */
const dayN=()=>Math.floor(Date.now()/864e5);
function wordOfDay(){const ks=Object.keys(G);if(!ks.length)return null;const u=glossUse(),k=ks[dayN()%ks.length];return {k,g:G[k],id:u[k]}}
function fivePlan(){const d=dueKeys().length,P=[];
  P.push(d?["study:review",`Review ${d} card${d===1?"":"s"} due`,"2 min"]:["study:review?ses=1","A 10-question mixed session","3 min"]);
  const q=scenes.filter(p=>prog.done[p.id]&&!prog.quiz[p.id]).pop();P.push(q?["study:quiz?s="+q.id,`Quiz: ${sName(q)}`,"2 min"]:["study:drill:gap","Fill the gap in a key quote","2 min"]);
  const w=wordOfDay();if(w)P.push(["study:explore:glossary?w="+encodeURIComponent(w.k),`Word of the day: ${w.k}`,"1 min"]);return P}
function todayHTML(){const last=SLAST||S.stab?toolNow():"",nx=nextStep(),d=dueKeys().length,pl=fivePlan();
  const cont=last&&TABS.some(t=>t[0]===S.stab)?[`study:${last}`,"Pick up",toolName(last)]:[nx[0],"Next step · "+nx[2],nx[1]];
  return `<section class="today48" aria-label="Today"><div class="tdhead"><small>Today</small><b>${esc(CFG.short)}</b></div><div class="tdgrid">
   <button class="tdc tdcont" type="button" data-to="${esc(cont[0])}"><span class="pkseal" aria-hidden="true">${folioSeal("❧","","pks")}</span><span><small>${esc(cont[1])}</small><b>${esc(cont[2])}</b></span><i aria-hidden="true">›</i></button>
   <div class="tdc tdplan"><small>Five-minute plan</small><ol>${pl.map(([to,l,m])=>`<li><button type="button" data-to="${esc(to)}"><span>${esc(l)}</span><em>${m}</em></button></li>`).join("")}</ol></div>
   <button class="tdc tddue" type="button" data-to="study:${d?"review":"cards"}"><b>${d}</b><small>${d===1?"card due":"cards due"}</small><span>${d?"Review now ›":"Learn new cards ›"}</span></button>
  </div></section>`}
function renderStudyHome(){SLAST=false;SV=null;$("study").dataset.tp="";$("sgroups").hidden=true;$("stabs").hidden=true;$("srel").innerHTML="";
  const T=topicsNow();
  $("sbody").innerHTML=(folioSimple()?questStripHTML():"")+todayHTML()+`<div class="tsec toch"><h3>Contents</h3><small>${T.length} topics</small></div><ol class="toc48">${T.map(([k,l],i)=>{const [f,st]=topicStat(k);
    return `<li><button class="tocr tp-${k}" type="button" data-to="study:topic:${k}">${ringEmb(EMB[k],f)}<span class="tocn" aria-hidden="true">${["I","II","III","IV","V","VI","VII","VIII"][i]}</span><span class="toct"><b>${l}</b><small>${esc(TLINE[k])}</small><em>${f===0?"Not begun":esc(st)}</em></span><i aria-hidden="true">›</i></button></li>`}).join("")}</ol>`}
/* Simple mode: the quests for scenes you've read, as a swipeable strip above the tiles */
function questStripHTML(){const read=scenes.filter(p=>prog.done[p.id]&&questsOf(p.id).length).sort((a,b)=>prog.done[b.id]-prog.done[a.id]),open=read.filter(p=>!(prog.qst[p.id]||{}).g),gilt=read.length-open.length;
  let h=`<div class="qhead">${folioSeal("❦","g","qhs")}<div><h2>Quests</h2><p>${read.length?`${open.length} scene${open.length===1?"":"s"} to finish · ${gilt} gilt`:"Read a scene to unlock its quests"}</p></div></div>`;
  if(!read.length)return h+`<div class="empty">${folioSeal(scenes[0].scene,"n","emps")}<p>Read your first scene to unlock its quests.</p><button class="btn primary" type="button" data-to="read">Start reading</button></div>`;
  if(!open.length)return h+`<div class="empty">${folioSeal("❦","g","emps")}<p>Every quest is done for the scenes you've read.</p><button class="btn primary" type="button" data-to="read">Read on</button></div>`;
  return h+deckHTML(open.map(p=>`<div class="qcard"><div class="qct">${folioSeal(p.scene,"","")}<span><b>${sName(p)}</b><small>${esc(shortLoc(p))}</small></span></div>${questsHTML(p.id)}</div>`),"qstrip","Quests")}
/* topic, character and theme pages */
const whoAll=()=>{const s=new Set(MAINS);Object.keys(EX.analysis||{}).forEach(w=>s.add(w));return [...s].filter(w=>Object.values(speech).some(x=>x.who===w))};
const secH=(t,n)=>`<div class="tsec"><h3>${t}</h3>${n!=null?`<small>${n}</small>`:""}</div>`;
/* 4.16 Practice hall: three big actions (session, review, next quiz), the drills as tiles with best-score rings, then the longer tools */
const qzN=p=>((STUDY.scenes[p.id]||{}).quiz||[]).length;
/* 4.19 the last 14 days of finished rounds */
function histHTML(){const D=[];for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);D.push([today(d),d])}const v=D.map(([k])=>+DRLOG[k]||0),mx=Math.max(1,...v),tot=v.reduce((a,b)=>a+b,0);
  let st=0;for(let i=v.length-1;i>=0;i--){if(v[i])st++;else if(i<v.length-1)break}
  return `<div class="hist16"><div class="hh"><b>${tot} round${tot===1?"":"s"}</b> in 14 days${st>1?` · <span class="stk">${st}-day streak</span>`:""}</div><div class="hbars" aria-hidden="true">${D.map(([k,d],j)=>`<i class="${j===13?"t":""}" style="--h:${(v[j]/mx).toFixed(2)}"><b></b><small>${"SMTWTFS"[d.getDay()]}</small></i>`).join("")}</div></div>`}
/* 4.20 a small progress ring round an icon or numeral (hall tiles, quiz acts, cast) */
const hring=(f,body,cls)=>{const C=2*Math.PI*21;return `<span class="hring${f>=1?" full":""}${cls?" "+cls:""}"><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="rt" cx="24" cy="24" r="21"/>${f>0?`<circle class="rf" cx="24" cy="24" r="21" stroke-dasharray="${(Math.min(1,f)*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 24 24)"/>`:""}</svg>${body}</span>`};
function hallHTML(){const d=dueKeys().length,nq=scenes.find(p=>prog.done[p.id]&&!prog.quiz[p.id]&&qzN(p))||scenes.find(p=>!prog.quiz[p.id]&&qzN(p)),all=prog.quiz.all;
  const ring=(f,body)=>{const C=2*Math.PI*21;return `<span class="hring${f>=1?" full":""}"><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="rt" cx="24" cy="24" r="21"/>${f>0?`<circle class="rf" cx="24" cy="24" r="21" stroke-dasharray="${(Math.min(1,f)*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 24 24)"/>`:""}</svg>${body}</span>`};
  const A=[["study:review?ses=1","Session","10 mixed questions · about 5 minutes","review","main"],
    ["study:review",d?`Review ${d} due`:"Daily review",d?"Spaced out so they stick":"Nothing due: try a few new ones","review",d?"due":""],
    [nq?"study:quiz?s="+nq.id:"study:quiz?s=all",nq?"Quiz: "+sName(nq):"Whole-play quiz",nq?`${qzN(nq)} questions${prog.done[nq.id]?" on a scene you've read":""}`:`20 questions${all?` · last ${all[0]} of ${all[1]}`:""}`,"quiz",""]];
  const T=drillsNow(),nu=nextUp(),tile=k=>{const D0=DRILLS.find(x=>x[0]===k)||[k,k,""],B=drBest(k),f=B?(k==="sprint"?Math.min(1,B[0]/15):B[0]/B[1]):0;
     return `<button type="button" class="htile" data-to="study:drill:${k}?tp=practise">${ring(f,tic("drill:"+k))}<b>${esc(D0[1])}</b><small>${B?(k==="ladder"?`${B[0]} by heart`:k==="sprint"?`Best ${B[0]}`:`Best ${B[0]}/${B[1]}`):"New"} · ${DMIN[k]||3} min</small></button>`};
  return `<div class="hall16">${A.map(([to,b,s,ic,c])=>`<button type="button" class="hact ${c}" data-to="${to}${to.includes("?")?"&":"?"}tp=practise">${c==="main"?laurelSVG("qal")+laurelSVG("qar"):""}${tic(ic)}<span><b>${esc(b)}</b><small>${esc(s)}</small></span></button>`).join("")}</div>`
   +(nu?`<button type="button" class="hnext" data-to="study:drill:${nu[0]}?tp=practise"><small>Next up</small>${tic("drill:"+nu[0])}<span><b>${esc(DRILLS.find(d=>d[0]===nu[0])[1])}</b><em>${esc(nu[1])} · ${DMIN[nu[0]]||3} min</em></span><i aria-hidden="true">›</i></button>`:"")
   +histHTML()
   +DSHELF.map(([nm,ks])=>{const L=ks.filter(k=>T.includes(k));return L.length?secH(nm,L.length)+`<div class="hgrid16">${L.map(tile).join("")}</div>`:""}).join("")
   +secH("Longer practice")+`<div class="tlist48">${["cards","part","quiz"].filter(toolOK).map(s=>`<button class="tlr" type="button" data-to="study:${s}?tp=practise">${tic(s)}<span><b>${esc(toolName(s))}</b><small>${esc(toolDesc(s))}</small></span><i aria-hidden="true">›</i></button>`).join("")}</div>`}
function topicHTML(k){const T=topicK(k),[f,st]=topicStat(k);
  let h=`<div class="thead">${tbanner(EMB[k])}${ringEmb(EMB[k],f,"big")}<div><h2>${T[1]}</h2><p>${esc(TLINE[k])}</p><small>${esc(st)}</small></div></div>`;
  if(k==="people")h+=secH("The characters")+`<div class="wgal">${whoAll().map(w=>`<button class="wmed" type="button" data-to="study:who:${esc(encodeURIComponent(w))}">${folioMedal(w,COLORS[w])}<b>${esc(title(w))}</b>${profStarted(w)?`<small>Profile started</small>`:""}</button>`).join("")}</div>`;
  if(k==="themes")h+=secH("The themes")+`<div class="ttiles4 sm">${Object.entries(QUOTES.themes).map(([t,v])=>{const [a,b]=thLearnt(t);return `<button class="ttile" type="button" data-to="study:theme:${t}">${ringEmb(TEMB[temb(t)],a/Math.max(1,b))}<b>${esc(v[0])}</b><small>${a?`${a} of ${b} quotes`:BEGIN}</small></button>`}).join("")}</div>`;
  if(k==="story")h+=secH("Act by act")+`<div class="ribbon48">${ACTS.map(a=>{const ps=scenes.filter(p=>p.act===a);return ps.length?`<button class="rbact" type="button" data-to="study:acts?a=${a}&tp=story"><b>${a?R[a]:"Ind."}</b><span class="rbdots">${ps.map(p=>`<i class="${prog.done[p.id]?"d":""}${pos&&pos.s===p.id?" h":""}" title="${esc(sName(p))}"></i>`).join("")}</span><small>${ps.filter(p=>prog.done[p.id]).length}/${ps.length}</small></button>`:""}).join("")}</div>${pos&&sIdx(pos.s)>=0?`<p class="rbnow">You're at ${toLink("scene:"+pos.s,sName(scenes[sIdx(pos.s)]))}</p>`:""}`;
  if(k==="quotes"){const nx=QUOTES.quotes.find(q=>!prog.cards[q.i]);if(nx)h+=secH("One to learn")+`<div class="one">${qCard(nx)}</div>`}
  if(k==="words"){const w=wordOfDay();if(w)h+=secH("Word of the day")+`<div class="wod48"><b>${esc(w.k)}</b><p>${esc(w.g)}</p>${w.id?chip(w.id):""}</div>`}
  if(k==="practise")return h+hallHTML();
  if(k==="write"&&(EX.examq||[]).length){const Q=EX.examq[dayN()%EX.examq.length];h+=secH("A question to try")+`<div class="wq48"><p>${esc(Q[0])}</p>${evHTML(Q[1].map(i=>(QUOTES.quotes[i]||{}).id).filter(x=>x!=null).slice(0,2),"Start from")}<button class="btn primary" type="button" data-to="study:plan?tp=write">Plan it ›</button></div>`}
  if(k==="revise"){const d=dueKeys().length;h+=`<div class="pickup"><button class="pk next" data-to="study:${d?"review":"revise"}?tp=revise"><small>${d?"Due today":"Revision sheet"}</small><b>${d?`Review ${d} card${d===1?"":"s"}`:"Copy, print or back up"}</b></button></div>`}
  const ts=T[2].filter(toolOK);return h+secH("Tools",ts.length)+`<div class="tlist48">${ts.map(s=>`<button class="tlr" type="button" data-to="study:${s}?tp=${k}">${tic(s)}<span><b>${esc(toolName(s))}</b><small>${esc(toolDesc(s))}</small></span><i aria-hidden="true">›</i></button>`).join("")}</div>`}
function whoHTML(w){const c=CH[w]||{},qs=QUOTES.quotes.filter(q=>speech[q.id].who===w),sps=Object.values(speech).filter(s=>s.who===w),ln=sps.reduce((a,s)=>a+s.lines.length,0),scn=new Set(sps.map(s=>s.page)).size,an=(EX.analysis||{})[w];
  let h=`<div class="whead" style="--c:${esc(COLORS[w]||"var(--tc)")}">${folioMedal(w,COLORS[w],"wbig")}<div><h2>${esc(title(w))}</h2>${c.desc?`<p>${esc(c.desc)}</p>`:""}<div class="wbgs">${[[ln,"lines"],[sps.length,"speeches"],[scn,"scenes"]].map(([v,l])=>`<span class="wbg"><b>${v}</b><small>${l}</small></span>`).join("")}</div></div></div>`;
  if(qs.length)h+=secH("Their key quotes",qs.length)+deckHTML(qs.map(qCard),"wkq","Key quotes");
  const mr=miniRel(w);if(mr)h+=secH("Relationships")+mr;
  if(an)h+=`<details class="fold"><summary>Analysis</summary>${an.map(x=>`<p class="anp">${esc(x)}</p>`).join("")}</details>`;
  const W=encodeURIComponent(w),tools=[];if(MAINS.includes(w)){tools.push(["prof?who="+W,"Build their profile","prof"]);tools.push(["part?who="+W,"Learn their part","part"])}
  if(qs.length)tools.push(["quotes?who="+W,"All their quotes","quotes"]);if(exHas("map")&&EXT.some(x=>x[0]==="map"))tools.push(["explore:map","Character map","map"]);if(EXT.some(x=>x[0]==="contrast"))tools.push(["explore:contrast","Contrast pairs","contrast"]);
  return h+secH("More on "+esc(title(w)))+`<div class="ttools">${tools.map(([s,l,i])=>`<button class="ttool" type="button" data-to="study:${esc(s)}${s.includes("?")?"&":"?"}tp=people"><svg class="tic" viewBox="0 0 24 24" aria-hidden="true">${TIC[i]}</svg><span>${l}</span></button>`).join("")}</div>`}
function themeHTML(k){const [nm,desc]=QUOTES.themes[k],[a,b]=thLearnt(k),cr=(EX.critics||{})[k];
  let h=`<div class="thead">${tbanner(TEMB[temb(k)])}${ringEmb(TEMB[temb(k)],a/Math.max(1,b),"big")}<div><h2>${esc(nm)}</h2><p>${esc(desc)}</p><small>${a} of ${b} quotes learnt</small></div></div>`;
  const pa=ACTS.map(a=>QUOTES.quotes.filter(q=>q.themes.includes(k)&&sceneOf(q.id).act===a).length),pm=Math.max(1,...pa);
  h+=secH("Through the play")+`<div class="thrib49">${ACTS.map((a,j)=>`<button type="button" data-thact="${k}:${a}" style="--h:${(pa[j]/pm).toFixed(2)}"${pa[j]?"":" disabled"} aria-label="${AN(a)}: ${pa[j]} key quotes"><i></i><b>${pa[j]||""}</b><small>${a?R[a]:"Ind."}</small></button>`).join("")}</div>`;
  h+=`<ol class="road">${themePlan(k).map(([t,s,qs],i)=>`<li><div class="rstop">${folioSeal(["I","II","III"][i],"","rn")}<b>${t}</b><small>${s}</small></div>${qs.length?deckHTML(qs.map(qCard),"",t):`<p class="muted">No key quote for this theme here.</p>`}</li>`).join("")}</ol>`;
  if(cr&&cr.length)h+=`<details class="fold"><summary>What critics say</summary>${cr.map(critHTML).join("")}</details>`;
  const tools=[["themes?th="+k,"Trace it and copy a plan","themes"],["quotes?th="+k,"All its quotes","quotes"],["plan","Plan an essay","plan"]];if(toolOK("explore:motifs"))tools.push(["explore:motifs","Motifs and symbols","motifs"]);if(toolOK("explore:bigq"))tools.push(["explore:bigq","Big questions","bigq"]);
  return h+secH("Go further")+`<div class="ttools">${tools.map(([s,l,i])=>`<button class="ttool" type="button" data-to="study:${s}${s.includes("?")?"&":"?"}tp=themes"><svg class="tic" viewBox="0 0 24 24" aria-hidden="true">${TIC[i]}</svg><span>${l}</span></button>`).join("")}</div>`}
function renderSPage(){const {k,x}=SV;SLAST=false;
  if(k==="who"&&!whoAll().includes(x)){SV={k:"topic",x:"people"};return renderSPage()}
  if(k==="theme"&&!QUOTES.themes[x]){SV={k:"topic",x:"themes"};return renderSPage()}
  if(k==="topic"&&!TOPICS.some(t=>t[0]===x))SV.x="story";
  const tp=k==="topic"?SV.x:k==="who"?"people":"themes";TP=tp;$("study").dataset.tp=tp;
  if(k==="topic"){sHead("study","Study","");$("sbody").innerHTML=topicHTML(tp)}
  else if(k==="who"){sHead("study:topic:people","People",title(x));$("sbody").innerHTML=whoHTML(x)}
  else{sHead("study:topic:themes","Themes",QUOTES.themes[x][0]);$("sbody").innerHTML=themeHTML(x)}}
/* "Related" footer under every Study section: links to the sections that follow on from it (kept in step by an observer, as sections re-render themselves) */
function relList(){const T=k=>(TABS.find(x=>x[0]===k)||[,k])[1],W=w=>esc(title(w)),R=[],add=(sp,l)=>R.push([sp,l]);
  const who=w=>{if(!w)return;if(MAINS.includes(w))add("study:prof?who="+w,"Profile: "+W(w));if(whoQ(w))add("study:quotes?who="+w,"Key quotes: "+W(w));if(EX.analysis&&EX.analysis[w])add("study:explore:analysis?an="+w,"Analysis: "+W(w));if(MAINS.includes(w))add("study:part?who="+w,"Learn "+W(w)+"'s part")};
  const t=S.stab;
  if(t==="quotes"){add("study:cards","Learn them as flashcards");if(qf.th)add("study:themes?th="+qf.th,"Theme: "+esc(QUOTES.themes[qf.th][0]));else add("study:themes","Quotes by theme");who(qf.who);add("study:plan","Use them in an essay plan")}
  else if(t==="themes"){add("study:quotes?th="+thSel,"All key quotes: "+esc(QUOTES.themes[thSel][0]));add("study:plan","Plan an essay on it");if(exHas("motifs"))add("study:explore:motifs","Motifs and symbols");if(EX.critics&&EX.critics[thSel])add("study:explore:critics","What critics say")}
  else if(t==="prof"){who(profSel);R.splice(0,1);if(exHas("map"))add("study:explore:map","Character map")}
  else if(t==="part"){who(pt.who);add("study:cards","Flashcards")}
  else if(t==="acts"){add("study:quiz","Scene quizzes");if(exHas("timeline"))add("study:explore:timeline","Timeline");add("study:revise","Revision sheet")}
  else if(t==="cards"){add("study:review","Daily review");add("study:quotes","All key quotes");add("study:drill",T("drill"))}
  else if(t==="review"){add("study:cards","Flashcards");add("study:quiz","Scene quizzes");add("study:acts","Act summaries")}
  else if(t==="drill"){add("study:quotes","Key quotes");add("study:cards","Flashcards")}
  else if(t==="quiz"){add("study:acts","Act summaries");add("study:review","Daily review")}
  else if(t==="plan"){add("study:extract",T("extract"));add("study:para",T("para"));add("study:themes","Themes");add("study:quotes","Key quotes")}
  else if(t==="extract"){add("study:plan","Essay planner");add("study:para",T("para"));if(exHas("devices"))add("study:explore:devices","Language devices")}
  else if(t==="para"){add("study:plan","Essay planner");if(exHas("critics"))add("study:explore:critics","Critics");add("study:quotes","Key quotes")}
  else if(t==="revise"){add("study:acts","Act summaries");add("you","Your notes and bookmarks")}
  else if(t==="explore"){const x=exSel;
    if(x==="analysis")who(anSel);
    else if(x==="glossary"){add("study:cards","Flashcards");if(exHas("insults"))add("study:explore:insults","Insults")}
    else if(x==="map"||x==="arcs")add("study:prof","Character profiles");
    else if(x==="timeline"||x==="iago")add("study:acts","Act summaries");
    else if(x==="devices"||x==="verse")add("study:extract",T("extract"));
    else if(x==="critics"||x==="context")add("study:para",T("para"));
    if(x)add("study:explore","All of Explore");else{add("study:acts","Act summaries");add("study:themes","Themes")}}
  add("read","Back to reading");return R}
/* 4.9 footer: one slim "Up next" row, the rest in a More sheet, and a way back to the scene you were reading */
let RELM=[];
function renderRel(){const el=$("srel");if(!el)return;if(SH||SV||view!=="study"){el.innerHTML="";return}
  const hid=x=>folioSimple()&&EXAMT.some(t=>x[0]==="study:"+t||x[0].startsWith("study:"+t+"?")),L=relList().filter(x=>x[0]!=="read"&&!hid(x));if(!L.length)L.push(["study","Study home"]);const [n,...m]=L;RELM=m;const ps=pos&&sIdx(pos.s)>=0?scenes[sIdx(pos.s)]:null;
  el.innerHTML=`<div class="upn48"><button class="upn" type="button" data-to="${esc(n[0])}"><small>Up next</small><b>${n[1]}</b><i aria-hidden="true">›</i></button>${m.length?`<button class="upm" type="button" data-relmore>More <span>${m.length}</span></button>`:""}</div>${ps?`<button class="upback" type="button" data-to="scene:${ps.id}"><span aria-hidden="true">‹</span> Back to ${esc(sName(ps))}</button>`:`<button class="upback" type="button" data-to="read"><span aria-hidden="true">‹</span> Back to reading</button>`}`}
document.addEventListener("click",e=>{if(e.target.closest("[data-relmore]"))openSheet("More from here",`<div class="relm48">${RELM.map(([sp,l])=>`<button class="tlr" type="button" data-to="${esc(sp)}">${tic(sp.replace(/^study:/,"").split("?")[0])}<span><b>${l}</b></span><i aria-hidden="true">›</i></button>`).join("")}</div>`)});
const focusNow=()=>{const sb=$("sbody");$("study").classList.toggle("inround",view==="study"&&!!sb.querySelector(".pfr")&&!sb.querySelector(".wreath,.dend"))};
try{new MutationObserver(()=>{renderRel();focusNow()}).observe($("sbody"),{childList:true})}catch(e){}
let SBACK=null;
function renderStudy(){
  if(!TABS.some(t=>t[0]===S.stab))S.stab="quotes";
  INTROS.length=0;$("study").classList.toggle("shome",SH);$("study").classList.toggle("stool",!SH&&!SV);$("study").classList.toggle("sprac",!SH&&!SV&&["drill","quiz","review","part","cards"].includes(S.stab));
  if(SH){renderStudyHome();return}
  if(SV){renderSPage();return}
  const tn=toolNow(),tp=SBACK?(SBACK.k==="topic"?SBACK.x:SBACK.k==="who"?"people":"themes"):topicOf(tn);TP=tp;SLAST=true;$("study").dataset.tp=tp;
  if(SBACK&&SBACK.k!=="topic")sHead("study:"+SBACK.k+":"+encodeURIComponent(SBACK.x),SBACK.k==="who"?title(SBACK.x):QUOTES.themes[SBACK.x][0],toolName(tn));
  else sHead("study:topic:"+tp,topicK(tp)[1],toolName(tn));
  ({part:studyPart,review:studyReview,drill:studyDrill,plan:studyPlan,extract:studyExtract,para:studyPara,prof:studyProf,acts:studyActs,explore:studyExplore,quotes:studyQuotes,cards:studyCards,themes:studyThemes,quiz:studyQuiz,revise:studyRevise})[S.stab]();
}
/* intros: one line shows; the full how-to opens from a ? (the first one in the header) */
const INTROS=[];
function shortIntros(){const b=$("sbody");if(!b)return;const all=b.querySelectorAll(".intro:not(.i1)");if(!all.length)return;const q=$("sgq");
  all.forEach(el=>{el.classList.add("i1");if(el.querySelector("button,a,input,select,textarea"))return;const full=el.innerHTML,t=el.textContent.trim().replace(/\s+/g," ");
    const m=t.match(/^(.+?[.!?])["”’)]?(?=\s+["“‘(]?[A-Z0-9])/);let sh=m?m[0]:t;
    if(m&&sh.length<30){const m2=t.slice(sh.length).match(/^\s*(.+?[.!?])["”’)]?(?=\s+["“‘(]?[A-Z0-9]|$)/);if(m2)sh=sh+" "+m2[0].trim()}
    if(sh.length>=t.length-1)return;
    const i=INTROS.push(full)-1,top=q&&b.querySelector(".intro")===el;el.textContent=sh;
    if(top){q.hidden=false;q.dataset.iq=i}else el.insertAdjacentHTML("beforeend",` <button class="iq" type="button" data-iq="${i}" aria-label="More about this">?</button>`)})}
try{new MutationObserver(shortIntros).observe($("sbody"),{childList:true,subtree:true})}catch(e){}
document.addEventListener("click",e=>{const b=e.target.closest("[data-iq]");if(!b||INTROS[+b.dataset.iq]==null)return;const t=document.querySelector("#sgroups .sgname");openSheet(t?t.textContent:"How it works",`<p class="intro i1 ifull">${INTROS[+b.dataset.iq]}</p>`)});
$("s-search").onclick=$("y-search").onclick=()=>openSearch("");
function quoteHTML(q){const sp=speech[q.id];return `<div class="qt" style="--c:${COLORS[sp.who]||"var(--ink)"}"><blockquote>“${esc(q.text)}”</blockquote>
  <div class="meta"><b>${esc(title(sp.who))}</b>${chip(q.id)}</div>
  <p>${q.themes.map(t=>`<span class="th">${esc(QUOTES.themes[t][0])}</span>`).join("")}<br>${esc(q.note)}</p></div>`}
let qf={who:"",th:""};
/* cards or a list, for Key quotes and Act summaries (folio-deckview) */
let DV=LS.get("folio-deckview")==="list"?"list":"deck";
const dvToggle=()=>`<div class="dview noprint" role="group" aria-label="Show as"><button type="button" data-dv="deck" aria-pressed="${DV==="deck"}">Cards</button><button type="button" data-dv="list" aria-pressed="${DV==="list"}">List</button></div>`;
function studyQuotes(){
  const whos=[...new Set(QUOTES.quotes.map(q=>speech[q.id].who))];
  const list=QUOTES.quotes.filter(q=>(!qf.who||speech[q.id].who===qf.who)&&(!qf.th||q.themes.includes(qf.th)));
  $("sbody").innerHTML=`<p class="intro">The play's most quoted lines, in order. Swipe through them as cards or switch to a list; tap a speaker or pick a theme to filter.</p>
   <div class="wstrip noprint" role="group" aria-label="Speaker"><button type="button" class="wall" data-qwho="" aria-pressed="${!qf.who}"><span class="wa">All</span><small>Everyone</small></button>${whos.map(w=>`<button type="button" data-qwho="${esc(w)}" aria-pressed="${qf.who===w}">${folioMedal(w,COLORS[w])}<small>${esc(title(w))}</small></button>`).join("")}</div>
   <div class="qbar noprint"><select data-qf="th" aria-label="Theme"><option value="">All themes</option>${Object.entries(QUOTES.themes).map(([k,v])=>`<option value="${k}"${qf.th===k?" selected":""}>${esc(v[0])}</option>`).join("")}</select>${dvToggle()}</div>
   <p class="muted cnt">${list.length} quote${list.length===1?"":"s"}${qf.who?" · "+esc(title(qf.who)):""}</p>${DV==="deck"?deckHTML(list.map(qCard),"","Key quotes"):list.map(quoteHTML).join("")}`;
}
/* explore: timeline, maps, plan, context, critics, imagery, symbols, contrasts, insults, pronouns, glossary */
let exSel="";
let cmp=[0,1];
const EXK={facts:"keyfacts",analysis:"analysis",motifs:"motifs",bigq:"bigq"};
const exHas=k=>!EXK[k]||Object.keys(EX[EXK[k]]||{}).length>0;let anSel="";
const spLine=id=>{const sp=speech[id];return sp?`<div class="o2">${esc(sp.lines.join(" ").replace(/~/g,"").slice(0,160))}${sp.lines.join(" ").length>160?"…":""}</div><small>${chip(id)}</small>`:""};
/* ---------- 4.8 links to the text: every Study item points at its lines. chip(id,j) = scene chip, evHTML(ids) = evidence rows
   (EX.ev, tools/newplay/evidence.js), rich(t) links quoted phrases and "Act 3, Scene 2" mentions; all open openPv() first,
   a preview slip (original + modern), whose "Open in play" leaves PVBACK so the reader's Back pill returns to the item. */
const LR=["","i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii","xiii","xiv","xv"];
const scShort=p=>(p.act?R[p.act]:"Ind")+"."+p.scene.toLowerCase();
const kqj=id=>{for(let j=0;j<(speech[id]||{lines:[]}).lines.length;j++)if(KQL[id+":"+j])return j;return 0};
function chip(id,j){const sp=speech[id];if(!sp)return "";const p=sceneOf(id);
  return `<button class="schip" type="button" data-pv="${id}${j!=null?":"+j:""}" aria-label="${esc(sName(p)+", "+title(sp.who))}: preview in the play"><span class="sca">${scShort(p)}</span><span class="scw">${esc(title(sp.who))}</span><span class="scr" aria-hidden="true">›</span></button>`}
const clip=(s,n)=>s.length>n?s.slice(0,n).replace(/\s+\S*$/,"")+"…":s;
function evHTML(ids,lab){ids=(ids||[]).filter(id=>speech[id]);if(!ids.length)return "";
  return `<div class="evr"><div class="evl">${lab||"In the play"}</div>${ids.map(id=>{const sp=speech[id],j=kqj(id),p=sceneOf(id);
    return `<button class="evb" type="button" data-pv="${id}:${j}" style="--c:${COLORS[sp.who]||"var(--accent)"}"><q>${esc(clip(sp.lines[j].replace(/^~/,"").replace(/\[[^\]]*\]\s*/g,""),110))}</q><small><span class="sca">${scShort(p)}</span>${esc(title(sp.who))}</small></button>`}).join("")}</div>`}
/* quoted phrases (3+ words) found in the play's lines, and act/scene mentions, become links */
let NZT=null;const nzq=s=>s.toLowerCase().replace(/&\w+;/g," ").replace(/[’']/g,"").replace(/[^a-z ]+/g," ").replace(/\s+/g," ").trim();
function findPhrase(t){const f=nzq(t);if(f.split(" ").length<3)return null;
  if(!NZT)NZT=Object.keys(speech).map(id=>[id,speech[id].lines.map(l=>nzq(l))]);
  for(const [id,ls] of NZT){const all=ls.join(" ");if(!all.includes(f))continue;const w=f.split(" ").slice(0,3).join(" ");let j=ls.findIndex(l=>l.includes(w));return [id,j<0?0:j]}return null}
function rich(t){let s=esc(t);
  s=s.replace(/(“|&quot;|‘|(?:^|(?<=[\s(—–]))')([^“”‘’"<>]{8,}?)(”|&quot;|’|'(?=[\s.,;:!?)—–]|$))/g,(m,a,b,c)=>{const h=findPhrase(b);return h?`<button class="qlnk" type="button" data-pv="${h[0]}:${h[1]}">${m}</button>`:m});
  return s.replace(/\b(Act ([1-5]|[IV]+)),? (?:Scene|scene|sc\.) ([0-9]+|[ivxIVX]+)\b/g,(m,x,a,sc)=>{const an=/^\d$/.test(a)?+a:roman[a],sn=/^\d+$/.test(sc)?LR[+sc]:sc.toLowerCase();
    const p=scenes.find(z=>z.act===an&&z.scene.toLowerCase()===sn);return p?`<button class="qlnk sclnk" type="button" data-go2="${p.id}">${m}</button>`:m})}
/* 4.10 graphics helpers: the symbol heat strip's cells, a glossary word in its first line */
let HEAT=[];
function glLine(k,id){const sp=speech[id],w=k.replace(/^'/,"").toLowerCase(),j=Math.max(0,sp.lines.findIndex(l=>l.toLowerCase().includes(w))),l=sp.lines[j].replace(/^~/,"").replace(/\[[^\]]*\]\s*/g,"");
  const at=l.toLowerCase().indexOf(w),hl=at<0?esc(l):esc(l.slice(0,at))+`<mark>${esc(l.slice(at,at+w.length))}</mark>`+esc(l.slice(at+w.length));
  return `<button class="gline" type="button" data-pv="${id}:${j}"><q>${hl}</q><small><span class="sca">${scShort(sceneOf(id))}</span>${esc(title(sp.who))} · first use</small></button>`}
/* the preview slip */
let PVBACK=null;
function openPv(v){const [id,jj]=String(v).split(":"),sp=speech[id];if(!sp)return;const p=sceneOf(id),n=sp.lines.length,j=Math.min(n-1,Math.max(0,jj==null?kqj(id):+jj));
  const a=n<=9?0:Math.max(0,Math.min(n-9,j-3)),b=n<=9?n:a+9,pr=partsOf(sp).find(([x,y])=>j>=x&&j<=y)||[0,n-1,sp.m];
  const kq=QUOTES.quotes.find(q=>String(q.id)===String(id));PVBACK={h:location.hash,k:v,y:scrollY,from:view};
  openSheet(sName(p),`<div class="pvs" style="--c:${COLORS[sp.who]||"var(--accent)"}"><div class="pvh">${typeof folioMedal==="function"?folioMedal(sp.who,COLORS[sp.who],"pvm"):""}<div><b>${esc(title(sp.who))}</b><small>${esc(shortLoc(p))}</small></div></div>
   ${kq?`<div class="pvk">❦ Key quote · ${kq.themes.map(t=>esc(QUOTES.themes[t][0])).join(", ")}</div>`:""}
   <div class="pvo">${a>0?`<div class="pvx">…</div>`:""}${sp.lines.slice(a,b).map((l,i)=>`<div class="pvl${a+i===j?" hl":""}${l.startsWith("~")?" song":""}">${esc(l.replace(/^~/,""))}</div>`).join("")}${b<n?`<div class="pvx">…</div>`:""}</div>
   <div class="pvm2"><div class="evl">In modern English${pr[1]>pr[0]&&n>1?` · lines ${pr[0]+1}–${pr[1]+1} of ${n}`:""}</div><p>${esc(pr[2]||sp.m)}</p></div>
   <div class="row"><button class="btn primary" type="button" data-pvopen="${id}">Open in play ›</button><button class="btn" type="button" data-pvclose>Close</button></div></div>`)}
function pvOpen(id){PVBACK=PVBACK&&PVBACK.from==="study"?Object.assign(PVBACK,{y:scrollY}):null;goSpeech(id);pvPill()}
function pvPill(){let b=$("pvback");if(!PVBACK){if(b)b.hidden=true;return}
  if(!b){b=document.createElement("button");b.id="pvback";b.type="button";b.className="pvback";b.onclick=()=>history.back();document.body.appendChild(b)}
  b.innerHTML=`<span aria-hidden="true">‹</span> Back to Study`;b.hidden=false}
/* back in Study: the item that was opened is put back in view, its drawer open */
/* route() can run twice for one Back (hashchange + popstate), so PVBACK is kept a moment */
let pvT=0;function pvRestore(){const P=PVBACK;if(!P||P.h!==location.hash||P.from!=="study")return;clearTimeout(pvT);pvT=setTimeout(()=>{if(PVBACK===P){PVBACK=null;pvPill()}},600);
  const el=document.querySelector(`#sbody [data-pv="${CSS.escape(String(P.k))}"]`);if(el){let d=el.closest("details");while(d){d.open=true;d=d.parentElement.closest("details")}
    el.scrollIntoView({block:"center"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1600)}else scrollTo(0,P.y)}
/* character maps: medallions joined by curved, coloured arrows; a medallion opens that character's page */
const RELC={love:"#d4559a",trust:"var(--ok)",hate:"var(--bad)",deceive:"var(--accent)"},RELD={love:"",trust:"",hate:"7 5",deceive:"2 5"};
const f1=v=>(+v).toFixed(1);
const relMk=pre=>Object.keys(RELC).map(k=>`<marker id="${pre}-${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto"><path d="M0 0L10 5L0 10z" fill="${RELC[k]}"/></marker>`).join("");
function relEdge(p1,p2,s,e,bend,k,pre){const dx=p2[0]-p1[0],dy=p2[1]-p1[1],l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,sx=p1[0]+ux*s,sy=p1[1]+uy*s,ex=p2[0]-ux*e,ey=p2[1]-uy*e,mx=(sx+ex)/2-uy*bend,my=(sy+ey)/2+ux*bend;
  return `<path d="M${f1(sx)} ${f1(sy)}Q${f1(mx)} ${f1(my)} ${f1(ex)} ${f1(ey)}" fill="none" stroke="${RELC[k]||"var(--muted)"}" stroke-width="3" stroke-dasharray="${RELD[k]||""}" stroke-linecap="round"${RELC[k]?` marker-end="url(#${pre}-${k})"`:""}/>`}
const medalAt=(n,x,y,s)=>folioMedal(n,COLORS[n]).replace('<svg class="medal"',`<svg x="${f1(x-s/2)}" y="${f1(y-s/2)}" width="${s}" height="${s}" class="medal"`);
const relNode=(n,x,y,s,wa)=>{const lk=wa.includes(n);return `<g class="rnode${lk?" lk":""}"${lk?` data-to="study:who:${esc(encodeURIComponent(n))}"`:""}>${lk?`<title>${esc(title(n))}</title>`:""}${medalAt(n,x,y,s)}<text class="rlab" x="${f1(x)}" y="${f1(y+s/2+17)}" text-anchor="middle">${esc(title(n))}</text></g>`};
const relLegend=()=>`<div class="legend">${Object.entries({love:"Loves",trust:"Trusts",hate:"Hates / harms",deceive:"Deceives"}).map(([k,l])=>`<span><i style="background:${RELC[k]}"></i>${l}</span>`).join("")}</div>`;
function relSVG(act){const E=EX.rel[act],N=[...new Set(E.flatMap(e=>[e[0],e[1]]))],W=400,H=400,cx=200,cy=192,r=N.length>7?148:136,S=N.length>9?42:50,P={},wa=whoAll();
  N.forEach((n,i)=>{const a=-Math.PI/2+i*2*Math.PI/N.length;P[n]=[cx+r*Math.cos(a),cy+r*Math.sin(a)]});
  const ed=E.map(([a,b,k])=>relEdge(P[a],P[b],S/2+3,S/2+7,E.some(e=>e[0]===b&&e[1]===a)?26:12,k,"ar")).join("");
  return `<div class="mapf"><svg class="chart rmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="Character map for ${AN(+act)}"><defs>${relMk("ar")}</defs>${ed}${N.map(n=>relNode(n,P[n][0],P[n][1],S,wa)).join("")}</svg></div>
   ${relLegend()}<p class="muted" style="font-size:.875rem">Arrows point from the character who feels it to the one it is aimed at. Tap a medallion to open that character's page.</p>`}
/* a character's own relationships across the play, them in the middle */
function miniRel(w){if(!EX.rel)return "";const M=new Map();Object.values(EX.rel).forEach(es=>(es||[]).forEach(([a,b,k])=>{if(a===b||(a!==w&&b!==w))return;const o=a===w?b:a,key=o+"|"+(a===w?1:0);if(!M.has(key))M.set(key,[o,k,a===w])}));
  const O=[...new Set([...M.values()].map(e=>e[0]))].slice(0,8);if(!O.length)return "";
  const E=[...M.values()].filter(e=>O.includes(e[0])),W=400,H=380,cx=200,cy=184,r=134,S=50,C=[cx,cy],P={},wa=whoAll();
  O.forEach((n,i)=>{const a=-Math.PI/2+(i+.5)*2*Math.PI/O.length;P[n]=[cx+r*Math.cos(a),cy+r*Math.sin(a)]});
  const ed=E.map(([o,k,out])=>{const two=E.some(e=>e[0]===o&&e[2]!==out),[p1,p2]=out?[C,P[o]]:[P[o],C];return relEdge(p1,p2,out?44:S/2+3,out?S/2+7:48,two?22:0,k,"mr")}).join("");
  return `<div class="mapf"><svg class="chart rmap" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title(w))}'s relationships">${`<defs>${relMk("mr")}</defs>`}${ed}${O.map(n=>relNode(n,P[n][0],P[n][1],S,wa)).join("")}${medalAt(w,cx,cy,80)}</svg></div>${relLegend()}`}
/* a critic as a scroll card: the source, the year as a badge, the reading */
const crYear=w=>+(String(w).match(/\b(1[5-9]\d\d|20\d\d)(?!\d)/)||[])[1]||0;
/* 4.10 critics on a timeline: one dot per dated critic, coloured by theme; tap = jump to the card */
function critLine(){const D=Object.entries(EX.critics).flatMap(([k,v])=>v.map((c,i)=>[crYear(c[0]),k,i,c[0]])).filter(x=>x[0]);if(D.length<2)return "";
  const a=Math.floor(Math.min(...D.map(d=>d[0]))/50)*50,b=Math.ceil(Math.max(...D.map(d=>d[0]))/50)*50,W=340,x=v=>14+(v-a)*(W-28)/Math.max(1,b-a),th=Object.keys(EX.critics);
  const lane={};D.sort((p,q)=>p[0]-q[0]);const pos=D.map(d=>{let l=0;while((lane[l]||-99)>x(d[0])-12)l++;lane[l]=x(d[0]);return l});const H=40+Math.max(...pos)*14;
  const ticks=[];for(let t=a;t<=b;t+=b-a>200?100:50)ticks.push(t);
  return `<div class="mapf crl"><svg class="chart" viewBox="0 0 ${W} ${H+16}" role="img" aria-label="Critics by year"><path d="M14 ${H}H${W-14}" stroke="var(--rule-strong)"/>${ticks.map(t=>`<path d="M${f1(x(t))} ${H-4}v8" stroke="var(--rule-strong)"/><text x="${f1(x(t))}" y="${H+14}" text-anchor="middle">${t}</text>`).join("")}${D.map((d,j)=>`<circle class="crd" data-crj="${esc(d[1])}:${d[2]}" tabindex="0" role="link" cx="${f1(x(d[0]))}" cy="${H-10-pos[j]*14}" r="6" fill="var(--t-${["story","people","themes","quotes","words","practise","write","revise"][th.indexOf(d[1])%8]})"><title>${esc(d[3])}</title></circle>`).join("")}</svg></div><p class="hcap">Each dot is a critic, coloured by theme. Tap one to read it.</p>`}
function critHTML([w,x],k,i){const y=(String(w).match(/\b(1[5-9]\d\d|20\d\d)\b/)||[])[1],ev=k!=null?(((EX.ev||{}).cr||{})[k]||[])[i]:null;
  return `<div class="crit"${k!=null?` id="cr-${esc(k)}-${i}"`:""}>${y?`<span class="cry">${y}</span>`:""}<small>${embSVG(TEMB.quill,"crq")}${esc(w)}</small><p>${rich(x)}</p>${ev?evHTML(ev,"Test it on"):""}</div>`}
/* 4.18 character map: step act by act; under the map, what changed since the act before */
function mapStep(MA){const i=MA.indexOf(mapAct),pv=MA[i-1],nx=MA[i+1];
  return `<div class="mstep"><button class="btn sm" type="button" data-mapact="${pv}"${pv==null?" disabled":""} aria-label="Previous act">‹</button><div class="mstx"><b>${AN(mapAct)}</b><span class="mdots" aria-hidden="true">${MA.map(a=>`<i class="${a===mapAct?"on":""}"></i>`).join("")}</span></div><button class="btn sm" type="button" data-mapact="${nx}"${nx==null?" disabled":""} aria-label="Next act">›</button></div>`}
function mapDiff(MA){const i=MA.indexOf(mapAct);if(i<1)return `<p class="muted mdiff">Step through the acts to watch the relationships change.</p>`;
  const key=e=>e[0]+"|"+e[1],A=new Map(EX.rel[MA[i-1]].map(e=>[key(e),e])),B=new Map(EX.rel[mapAct].map(e=>[key(e),e])),row=(e,t)=>`<li>${esc(title(e[0]))} → ${esc(title(e[1]))}: ${t}</li>`;
  const add=[...B.values()].filter(e=>!A.has(key(e))).map(e=>row(e,`<b>${esc(e[2])}</b>`)),gone=[...A.values()].filter(e=>!B.has(key(e))).map(e=>row(e,`<s>${esc(e[2])}</s>`)),ch=[...B.values()].filter(e=>A.has(key(e))&&A.get(key(e))[2]!==e[2]).map(e=>row(e,`${esc(A.get(key(e))[2])} → <b>${esc(e[2])}</b>`));
  if(!add.length&&!gone.length&&!ch.length)return `<p class="muted mdiff">No change since ${AN(MA[i-1])}.</p>`;
  return `<div class="box mdiff"><h3>Since ${AN(MA[i-1])}</h3>${ch.length?`<div class="evl">Changed</div><ul>${ch.join("")}</ul>`:""}${add.length?`<div class="evl">New</div><ul>${add.join("")}</ul>`:""}${gone.length?`<div class="evl">Gone</div><ul>${gone.join("")}</ul>`:""}</div>`}
let mapAct=1;
function arcSVG(){const W=360,H=214,L=30,T=12,B=36,n=scenes.length,x=i=>L+i*(W-L-10)/Math.max(1,n-1),y=v=>T+(10-v)*(H-T-B)/10,cols=["var(--t-story)","var(--t-practise)"];
  const pts=v=>v.map((a,i)=>f1(x(i))+","+f1(y(a))).join(" ");
  const ls=Object.entries(EX.arc).map(([k,v],j)=>`<polygon class="afill" points="${f1(x(0))},${f1(y(0))} ${pts(v)} ${f1(x(v.length-1))},${f1(y(0))}" fill="${cols[j]}"/><polyline points="${pts(v)}" fill="none" stroke="${cols[j]}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>`+v.map((a,i)=>{const d=scenes[i]&&prog.done[scenes[i].id];return `<circle cx="${f1(x(i))}" cy="${f1(y(a))}" r="${d?3.8:2.8}" fill="${d?cols[j]:"var(--card)"}" stroke="${cols[j]}" stroke-width="1.6"/>`}).join("")).join("");
  const st=scenes.map((p,i)=>p.sc===1?i:-1).filter(i=>i>=0),near=(a,b)=>b!=null&&a!=null&&x(b)-x(a)<52;
  const bands=st.map((i,k)=>{if(!(k%2))return "";const a=i?(x(i)+x(i-1))/2:L,b=k<st.length-1?(x(st[k+1])+x(st[k+1]-1))/2:W-10;return `<rect class="aband" x="${f1(a)}" y="${T}" width="${f1(b-a)}" height="${H-T-B}"/>`}).join("");
  /* act labels: shorten to the numeral, then drop, when one-scene acts put them too close to the previous label */
  let lastR=-1e9;
  const ax=st.map((i,k)=>{const an=i===n-1||near(i,st[k+1])?"end":near(st[k-1],i)?"start":"middle",tx=x(i)+(an==="end"?3:an==="start"?-3:0),a=scenes[i].act;
   const span=t=>{const w=t.length*7.8;return an==="end"?[tx-w,tx]:an==="start"?[tx,tx+w]:[tx-w/2,tx+w/2]};
   let t=a?"Act "+R[a]:"Ind.";if(span(t)[0]<lastR+4)t=a?R[a]:"Ind.";if(span(t)[0]<lastR+4)t="";if(t)lastR=span(t)[1];
   return `<line x1="${x(i)}" y1="${T}" x2="${x(i)}" y2="${H-B}" stroke="var(--rule)"/>${t?`<text x="${tx}" y="${H-B+20}" text-anchor="${an}">${t}</text>`:""}`}).join("");
  const V=Object.values(EX.arc),hit=scenes.map((p,i)=>{const ys=V.map(v=>v[i]).filter(v=>v!=null);if(!ys.length)return "";const lo=Math.min(...ys.map(y)),hi=Math.max(...ys.map(y));
    return `<rect class="ahit" data-go2="${p.id}" tabindex="0" role="link" aria-label="${esc(sName(p))}: ${Object.keys(EX.arc).map((k,j)=>esc(k)+" "+V[j][i]).join(", ")}" x="${f1(x(i)-7)}" y="${f1(lo-9)}" width="14" height="${f1(hi-lo+18)}" rx="7"><title>${esc(sName(p))}</title></rect>`}).join("");
  return `<div class="mapf"><svg class="chart arc" viewBox="0 0 ${W} ${H}" role="img" aria-label="${CFG.chartLabel}">${bands}<path class="agrid" d="M${L} ${f1(y(5))}H${W-10}"/>${ax}<text x="2" y="${y(10)+5}">10</text><text x="8" y="${y(0)+5}">0</text>${ls}${hit}</svg></div><p class="hcap">Tap a point to open that scene.</p>
   <div class="legend">${Object.keys(EX.arc).map((k,j)=>`<span><i style="background:${cols[j]};height:4px"></i>${esc(k)}</span>`).join("")}</div><p class="muted" style="font-size:.875rem">Filled dots mark scenes you have read.</p><p class="intro">${esc(EX.arcnote)}</p>`}
let GLOSSUSE=null;
function glossUse(){if(GLOSSUSE)return GLOSSUSE;GLOSSUSE={};for(const id in speech)speech[id].lines.join(" ").replace(gre,(m,pre,w)=>{const k=gmap[w.toLowerCase()];if(k&&!GLOSSUSE[k])GLOSSUSE[k]=id;return m});return GLOSSUSE}
function studyExplore(){
  if(!exSel){$("sbody").innerHTML=`<p class="intro">Ways into the play beyond the text: plot, characters, context and language.</p><div class="exgrid">${EXT.filter(([k])=>exHas(k)).map(([k,tl,d])=>`<button data-ex="${k}"><b>${tl}</b><span>${d}</span></button>`).join("")}</div>`;return}
  const [,tl]=EXT.find(x=>x[0]===exSel);let h="";
  const hereK=pos&&sIdx(pos.s)>=0?sIdx(pos.s):-1;
  if(exSel==="timeline"){let la=null;h=`<ol class="troad">`+EX.timeline.map((e,i)=>{const p=scenes[sIdx(e.s)],gate=p&&p.act!==la?(la=p.act,`<li class="tgate">${folioPlate(LAT[p.act],p.act?R[p.act]:"",AN(p.act),"tgp")}</li>`):"";
    return gate+`<li class="tev">${folioSeal(String(i+1),p&&prog.done[p.id]?"":"e","tsl")}<small>${p?sName(p):""}</small><b>${esc(e.t)}</b>${spLine(e.id)}</li>`}).join("")+`</ol>`}
  if(exSel==="map"){const MA=ACTS.filter(a=>EX.rel[a]);if(!MA.includes(mapAct))mapAct=MA[0];h=mapStep(MA)+relSVG(mapAct)+mapDiff(MA)}
  if(exSel==="iago")h=`<p class="intro">Steps are ticked once you've read past that scene.</p>`+EX.iago.map(([s,st],i)=>{const k=sIdx(s),done=prog.done[s]||k<hereK;return `<div class="exitem"><span class="tick">${done?"✓":"○"}</span> <small>${sName(scenes[k])}</small><p style="margin-top:2px;color:var(--ink)">${i+1}. ${esc(st)}</p><div class="xrow">${toLink("scene:"+s,"Read "+sName(scenes[k]))}</div></div>`}).join("");
  if(exSel==="arcs")h=arcSVG();
  if(exSel==="verse")h=verseExplore();
  if(exSel==="director")h=dirExplore();
  if(exSel==="context")h=`<p class="intro">The world the play was written in. Open a drawer of the cabinet to read it.</p><div class="cabinet">${EX.context.map(([a,b],i)=>`<details class="cab"><summary>${embSVG(TEMB[pickI(CTXI,a+" "+b,"quill")],"cabi")}<b>${esc(a)}</b><small class="cabp">${esc(clip(b,64))}</small><span class="evn">${((EX.ev||{}).ctx||[])[i]?EX.ev.ctx[i].length:""}</span></summary><p class="dc1">${rich(b)}</p>${evHTML(((EX.ev||{}).ctx||[])[i],"Where the play shows it")}</details>`).join("")}</div>`;
  if(exSel==="critics")h=`<p class="intro">Use one of these in an essay to show you know other readings. "Paraphrased" means it is a summary, not their exact words.</p>`+critLine()+Object.entries(EX.critics).map(([k,v])=>`<div class="crhead">${embSVG(TEMB[temb(k)],"crem")}<h3>${esc((QUOTES.themes[k]||[k])[0])}</h3></div>`+v.map((c,i)=>critHTML(c,k,i)).join("")).join("");
  if(exSel==="devices")h=Object.entries(EX.devices).map(([k,nm])=>{const its=Object.entries(EX.dev).flatMap(([id,arr])=>arr.filter(a=>a[0]===k).map(a=>[id,a]));return its.length?`<div class="stage3"><h3>${esc(nm)}</h3><small>${its.length}</small></div>`+its.map(([id,a])=>`<div class="exitem"><p style="color:var(--ink)">“${esc(a[2])}”: ${esc(a[1])}</p><small>${chip(id)}</small></div>`).join(""):""}).join("");
  if(exSel==="symbols"){const SYM=Object.entries(EX.symbols).map(([nm,re])=>{const rx=new RegExp(re,"i");return [nm,ACTS.map(a=>Object.keys(speech).filter(id=>sceneOf(id).act===a&&rx.test(speech[id].lines.join(" "))))]}),mx=Math.max(1,...SYM.flatMap(x=>x[1].map(a=>a.length)));
    HEAT=SYM;h=`<div class="heat49" style="--na:${ACTS.length}" role="table" aria-label="Mentions by act"><div class="hrow hh" role="row"><span role="columnheader"></span>${ACTS.map(a=>`<span role="columnheader">${a?R[a]:"Ind."}</span>`).join("")}</div>${SYM.map(([nm,per],i)=>`<div class="hrow" role="row"><b role="rowheader">${esc(nm)}</b>${per.map((ids,j)=>`<button type="button" role="cell" class="hc${ids.length/mx>=.5?" dk":""}" data-heat="${i}:${j}" style="--h:${(ids.length/mx).toFixed(2)}" aria-label="${esc(nm)}, ${AN(ACTS[j])}: ${ids.length}"${ids.length?"":" disabled"}>${ids.length||""}</button>`).join("")}</div>`).join("")}</div><p class="hcap">Darker = more mentions. Tap a cell for the lines.</p>`+Object.entries(EX.symbols).map(([nm,re])=>{const rx=new RegExp(re,"i"),ids=Object.keys(speech).filter(id=>rx.test(speech[id].lines.join(" ")));
    const per=[1,2,3,4,5].map(a=>ids.filter(id=>sceneOf(id).act===a).length);
    return `<details class="exitem"><summary><b>${esc(nm)}</b> <small>${ids.length} speeches</small></summary>${ids.slice(0,60).map(id=>{const sp=speech[id],l=sp.lines.find(x=>rx.test(x))||sp.lines[0];return `<div class="exitem"><div class="o2">${esc(l.replace(/^~/,""))}</div><small>${chip(id)}</small></div>`}).join("")}</details>`}).join("")}
  if(exSel==="contrast")h=EX.contrast.map(c=>`<div class="exitem"><b>${esc(c.t)}</b><ul>${c.pts.map(x=>`<li>${rich(x)}</li>`).join("")}</ul>${c.ids.map(spLine).join("")}</div>`).join("");
  if(exSel==="insults")h=`<p class="intro">${CFG.insultsIntro}</p>`+EX.insults.map(x=>`<div class="exitem"><b>“${esc(x.f.replace(/^#\d+$/,"Devil!"))}”</b> <small>${esc(x.who)}</small><p>${rich(x.n)}</p><small>${chip(x.id)}</small></div>`).join("");
  if(exSel==="pronouns")h=`<p class="intro">"Thou" and "thee" are used to close friends, children and inferiors, or as an insult. "You" is polite and respectful. A switch from one to the other usually means a change in feeling.</p>`+EX.pronouns.map(x=>`<div class="exitem"><b>“${esc(x.f)}”</b><p>${esc(x.n)}</p>${spLine(x.id)}</div>`).join("");
  if(exSel==="glossary"){const u=glossUse(),ks=Object.keys(G).sort((a,b)=>a.toLowerCase().replace(/^'/,"").localeCompare(b.toLowerCase().replace(/^'/,"")));
    const L=[...new Set(ks.map(k=>k.replace(/^'/,"")[0].toUpperCase()))];
    let gl="";h=`<div class="az">${L.map(l=>`<button data-az="${l}">${l}</button>`).join("")}</div>`+ks.map(k=>{const l=k.replace(/^'/,"")[0].toUpperCase(),ini=l!==gl?(gl=l,`<div class="gini" data-letter="${l}" aria-hidden="true"><span>${l}</span></div>`):"";return ini+`<div class="exitem" data-gw="${esc(k)}" data-letter="${k.replace(/^'/,"")[0].toUpperCase()}"><b>${esc(k)}</b><p>${esc(G[k])}</p>${u[k]?glLine(k,u[k]):""}</div>`}).join("")}
  if(exSel==="compare")h=compareHTML();
  if(exSel==="facts")h=`<div class="playbill"><div class="pbh">${typeof emblemSVG==="function"?`<span class="pbe">${emblemSVG(PLAY,"emb")}</span>`:""}<small>${esc(CFG.pre||"")}</small><h3>${esc(CFG.h1||CFG.title)}</h3><small>${esc(CFG.post||"")}</small></div><div class="orn" aria-hidden="true">❦</div>
    <dl class="pbl">${EX.keyfacts.map(([a,b])=>`<div class="pbr">${embSVG(FICON[pickI(FACTI,a,"fleuron")],"pbi")}<dt>${esc(a)}</dt><dd>${rich(b)}</dd></div>`).join("")}</dl></div>`;
  if(exSel==="analysis"){const ks=Object.keys(EX.analysis);if(!ks.includes(anSel))anSel=ks[0];
    h=`<div class="chips" style="margin-bottom:10px">${ks.map(k=>`<button class="chip" data-an="${esc(k)}" aria-pressed="${anSel===k}">${esc(title(k))}</button>`).join("")}</div>`+
      EX.analysis[anSel].map(x=>`<p class="anp">${rich(x)}</p>`).join("")+(()=>{const qs=QUOTES.quotes.filter(q=>speech[q.id].who===anSel);return qs.length?`<div class="stage3"><h3>Their key quotes</h3><small>${qs.length}</small></div>`+qs.map(quoteHTML).join(""):""})()}
  if(exSel==="motifs")h=`<p class="intro">A motif is an idea or image that keeps coming back. A symbol is an object that stands for something bigger.</p>`+EX.motifs.map(([n,x,qi])=>`<div class="exitem"><b>${esc(n)}</b><p>${rich(x)}</p>${(qi||[]).map(i=>QUOTES.quotes[i]?quoteHTML(QUOTES.quotes[i]):"").join("")}</div>`).join("")+
      ((EX.symbols2||[]).length?`<div class="stage3"><h3>Symbols</h3></div>`+EX.symbols2.map(([n,x])=>`<div class="exitem"><b>${esc(n)}</b><p>${rich(x)}</p></div>`).join("")+`<p><button class="link" data-ex="symbols">Find every mention in the Symbol tracker ›</button></p>`:"");
  if(exSel==="bigq")h=`<p class="intro">Questions with no single right answer. Take a side, then use the points and quotes as evidence.</p>`+EX.bigq.map(([q,pts,qi])=>{const qs=(qi||[]).map(i=>QUOTES.quotes[i]).filter(Boolean);return `<details class="exitem bq"><summary><b>${esc(q)}</b><span class="evn">${qs.length||""}</span></summary><ul>${pts.map(x=>`<li>${rich(x)}</li>`).join("")}</ul>${evHTML(qs.map(q=>q.id),"Evidence")}</details>`}).join("");
  $("sbody").innerHTML=`<div class="exh"><button class="btn sm" data-ex="">‹ All topics</button><h2>${tl}</h2></div>${h}`;
}
/* practise: gap fill, memory ladder, explain a line, who said it, order events */
let dr={k:""};
/* ---------- language and verse: verse lab, word detective, untangle, pun hunt, tone and stress ---------- */
function sylW(w){w=w.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z'èé]/g,"");if(!w)return 0;
  w=w.replace(/[èé]/g,"e").replace(/'(d|st|s|ll|t)$/,"").replace(/^'|'$/g,"").replace(/'/g,"");
  if(!w)return 0;if(/^(isle|aisle|isles)$/.test(w))return 1;if(w.length<=3)return 1;
  const sib=/(s|z|x|ch|sh|ce|ge)es$/.test(w),cle=/[^aeiouy]les?$/.test(w);let x=cle?w.replace(/les?$/,""):sib?w:w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/,"");x=x.replace(/^y/,"").replace(/([gq])ue$/,"$1").replace(/ieu|eau/g,"u");
  let n=(x.match(/[aeiouy]{1,2}/g)||[]).length;
  if(cle)n++;
  if(/(ted|ded)$/.test(w))n=Math.max(n,(w.replace(/ed$/,"").match(/[aeiouy]{1,2}/g)||[]).length+1);
  return Math.max(1,n)}
const lineOf=l=>l.replace(/^~/,"");
const sylL=l=>lineOf(l).split(/[\s—–-]+/).reduce((a,w)=>a+sylW(w),0);
function isProse(sp){if(sp.id in PROSE)return PROSE[sp.id];const L=sp.lines.map(lineOf);let p=null;
  if(L.length>1)p=L.slice(1).some(l=>/^[a-z]/.test(l))||L.every(l=>sylL(l)>=14);
  else if(sylL(L[0])>=15)p=true;
  else{const its=sceneOf(sp.id).items.filter(it=>it.t==="sp"),k=its.indexOf(sp),nb=[its[k-1],its[k+1]].filter(x=>x&&x.lines.length>1);p=nb.length>0&&nb.every(x=>{const M=x.lines.map(lineOf);return M.slice(1).some(l=>/^[a-z]/.test(l))||M.every(l=>sylL(l)>=14)})}
  return PROSE[sp.id]=p}
const endW=l=>(lineOf(l).toLowerCase().match(/([a-z']+)[^a-z']*$/)||[])[1]||"";
const rhymes=(a,b)=>{a=endW(a).replace(/'/g,"");b=endW(b).replace(/'/g,"");if(!a||!b||a===b)return false;const t=w=>(w.match(/[aeiouy]+[^aeiouy]*e?$/)||[w])[0];return t(a)===t(b)&&t(a).length>=2};
function sharedWith(sp){const its=sceneOf(sp.id).items.filter(it=>it.t==="sp"),k=its.indexOf(sp),out=[];
  const pv=its[k-1],nx=its[k+1],f=sylL(sp.lines[0]),l=sylL(sp.lines[sp.lines.length-1]);
  if(pv&&!isProse(pv)&&!isProse(sp)){const s=sylL(pv.lines[pv.lines.length-1]);if(f<=7&&s<=7&&f+s>=9&&f+s<=12)out.push(["before",pv])}
  if(nx&&!isProse(nx)&&!isProse(sp)){const s=sylL(nx.lines[0]);if(l<=7&&s<=7&&l+s>=9&&l+s<=12)out.push(["after",nx])}
  return out}
function vlNote(n){return n>=12?"long: some words probably run together (elision)":n===11?"one extra beat, often a soft (feminine) ending":n>=9?"a regular line, about ten beats":n<=7?"short: a pause, a shared line or a sudden break":"slightly short"}
function verseLabHTML(sp,a,z){a=a||0;z=z==null?sp.lines.length-1:z;const L=sp.lines.slice(a,z+1).map(lineOf);
  if(isProse(sp))return `<p><b>Prose.</b> This speech is not in verse: no regular beat, and the lines run on like ordinary sentences. Shakespeare often uses prose for comedy, servants, letters, madness and private talk; when a verse speaker switches to prose (or back), ask why.</p>`+punctWalk(L);
  const n=L.map(sylL),reg=n.filter(x=>x>=9&&x<=11).length,sh=sharedWith(sp),cp=L.length>1&&rhymes(L[L.length-2],L[L.length-1]);
  return `<p><b>Verse.</b> ${reg} of ${L.length} line${L.length===1?"":"s"} have about ten syllables: blank verse (iambic pentameter), five beats of <i>da DUM</i>. The counts are a guide: say the line aloud to check.</p>
   <ol class="vlab">${L.map((l,i)=>`<li><span class="vn${n[i]>=9&&n[i]<=11?"":" off"}" title="${esc(vlNote(n[i]))}">${n[i]}</span><span>${esc(l)}${n[i]<9||n[i]>11?`<small>${esc(vlNote(n[i]))}</small>`:""}</span></li>`).join("")}</ol>
   ${sh.map(([w,o])=>`<p class="muted">Shares a line with ${esc(title(o.who))} ${w==="before"?"before it":"after it"}: the speakers complete each other's beat, so the cue is picked up fast.</p>`).join("")}
   ${cp?`<p class="muted">Ends with a rhyming couplet: a sense of closing, often at the end of a scene or a decision.</p>`:""}`+punctWalk(L)}
function punctWalk(L){const t=L.join(" ").replace(/\s+/g," "),segs=t.split(/(?<=[,;:.!?—])\s+/).filter(Boolean);
  return `<details class="pwalk"><summary>Punctuation walk (${segs.length} step${segs.length===1?"":"s"})</summary><p class="muted">Read aloud and change direction at every mark, as actors do. Many short steps suggest a troubled or racing mind; long ones, control.</p><ol>${segs.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></details>`}
/* Explore: verse and prose */
let vlSel=null;
function verseExplore(){const all=Object.values(speech),lines=sp=>sp.lines.length;let V=0,P=0;const by={};
  all.forEach(sp=>{const p=isProse(sp);if(p)P+=lines(sp);else V+=lines(sp);const b=by[sp.who]=by[sp.who]||[0,0];b[p?1:0]+=lines(sp)});
  const top=Object.entries(by).sort((a,b)=>b[1][0]+b[1][1]-a[1][0]-a[1][1]).slice(0,8);
  const sw=[];scenes.forEach(s=>{const w={};s.items.filter(it=>it.t==="sp"&&it.lines.length>1).forEach(sp=>{const x=w[sp.who]=w[sp.who]||[null,null];x[isProse(sp)?1:0]=x[isProse(sp)?1:0]||sp});Object.entries(w).forEach(([who,[v,p]])=>{if(v&&p)sw.push([s,who,p])})});
  const shared=all.filter(sp=>sharedWith(sp).some(x=>x[0]==="after")),cps=scenes.map(s=>{const sps=s.items.filter(it=>it.t==="sp"),l=sps[sps.length-1];return l&&!isProse(l)&&l.lines.length>1&&rhymes(l.lines[l.lines.length-2],l.lines[l.lines.length-1])?l:null}).filter(Boolean);
  const kq=[...new Set(QUOTES.quotes.map(q=>q.id))];if(vlSel==null||!speech[vlSel])vlSel=kq[0];
  const pct=(a,b)=>Math.round(a/Math.max(1,a+b)*100);
  return `<p class="intro">Shakespeare mostly writes in blank verse: unrhymed lines of about ten syllables with five beats. Prose, rhyme, short lines and shared lines are choices. Counts here are automatic estimates.</p>
   <div class="box"><h3>The whole play</h3><p><b>${pct(V,P)}%</b> verse, <b>${100-pct(V,P)}%</b> prose by lines.</p>${top.map(([w,[v,p]])=>`<div class="vbar"><span>${esc(title(w))}</span><i><b style="width:${pct(v,p)}%"></b></i><small>${pct(v,p)}% verse</small></div>`).join("")}</div>
   <div class="box"><h3>Try the verse lab</h3><label class="lbl" for="vl-s">Key speech</label><select class="sinput" id="vl-s">${kq.map(id=>`<option value="${id}"${+id===+vlSel?" selected":""}>${esc(title(speech[id].who))} · ${esc(lineOf(speech[id].lines[0]).slice(0,48))}</option>`).join("")}</select>${verseLabHTML(speech[vlSel])}<p class="muted">In the reader, every speech's tools have this lab too.</p></div>
   ${sw.length?`<div class="box"><h3>Switching between verse and prose</h3><p class="intro">These characters speak both in the same scene. A switch often marks a change of mood, company or control.</p>${sw.slice(0,12).map(([s,who,p])=>`<div class="exitem"><small>${sName(s)}</small><p style="color:var(--ink)">${esc(title(who))} <button class="link" data-speech="${p.id}">See the prose</button></p></div>`).join("")}</div>`:""}
   ${shared.length?`<div class="box"><h3>Shared lines (${shared.length})</h3><p class="intro">One speaker ends a line and the next finishes it: a fast, close exchange.</p>${shared.slice(0,8).map(sp=>{const nx=sharedWith(sp).find(x=>x[0]==="after")[1];return `<div class="exitem"><p style="color:var(--ink)">${esc(title(sp.who))}: “${esc(lineOf(sp.lines[sp.lines.length-1]))}” / ${esc(title(nx.who))}: “${esc(lineOf(nx.lines[0]))}”</p><small>${sName(sceneOf(sp.id))} · ${chip(sp.id)}</small></div>`}).join("")}</div>`:""}
   ${cps.length?`<div class="box"><h3>Scenes that end in a rhyme (${cps.length})</h3>${cps.slice(0,8).map(sp=>`<div class="exitem"><p style="color:var(--ink)">“${esc(lineOf(sp.lines[sp.lines.length-2]))} / ${esc(lineOf(sp.lines[sp.lines.length-1]))}”</p><small>${chip(sp.id)}</small></div>`).join("")}</div>`:""}`}
/* language drills */
const LANG=EX.lang||{un:[],pun:[],st:[]};
const wtok=l=>l.split(/\s+/).filter(Boolean);
const clean=w=>w.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z']/g,"").replace(/^'+|'+$/g,"");
/* ---------- performance: director's choices, thought track, cut the scene, two-line scenes ---------- */
let DIRC={};try{DIRC=JSON.parse(LS.get(PFX+"dir")||"{}")}catch(e){}
const saveDir=()=>LS.set(PFX+"dir",JSON.stringify(DIRC));
const DIRS=EX.dir||[];
function dirCard(i){const [id,line,q,opts]=DIRS[i],sp=speech[id],c=DIRC[i]||{},ch=c.c;
  return `<div class="exitem dirc"><small>${esc(where(sp))}</small><h3>${esc(q)}</h3><p class="dline">“${esc(line)}”</p>
   <div class="opts">${opts.map((o,j)=>`<button data-dc="${i}:${j}" class="${ch===j?"right":""}" aria-pressed="${ch===j}"><b>${esc(o[0])}</b>${ch!=null?`<span>${esc(o[1])}</span>`:""}</button>`).join("")}</div>
   ${ch!=null?`<label class="lbl" for="dw-${i}">Why this choice? Say what the audience should feel.</label><textarea class="sinput" id="dw-${i}" data-dw="${i}" placeholder="I would stage it this way because…">${esc(c.w||"")}</textarea>`:""}
   <div class="row">${chip(id)}</div></div>`}
function dirExplore(){const n=Object.values(DIRC).filter(x=>x&&x.c!=null).length;
  return `<p class="intro">You are the director. Each moment can be staged more than one way, and each choice changes what the audience feel. Examiners reward "an actor might…" or "a director could…" when you explain the effect. Every option is defensible: the effects appear once you choose. ${n} of ${DIRS.length} decided.</p>`+DIRS.map((_,i)=>dirCard(i)).join("")}
function dirTools(id){const ix=DIRS.map((d,i)=>[d,i]).filter(([d])=>+d[0]===+id);if(!ix.length)return "";
  return ix.map(([d,i])=>`<details class="about"><summary>Director's choice: ${esc(d[2])}</summary><ul>${d[3].map((o,j)=>`<li><b>${esc(o[0])}</b>: ${esc(o[1])}${(DIRC[i]||{}).c===j?" <small>(your choice)</small>":""}</li>`).join("")}</ul><button class="btn sm" data-dirgo="1">Decide in Study</button></details>`).join("")}
function thoughtHTML(sp){return `<details class="about tthink"><summary>Thought track: what is ${esc(title(sp.who))} really thinking?</summary><p class="muted">Actors play the thought under the words. Write it in the first person, then add it to your note.</p><label for="tt" class="sr">Thought track</label><textarea id="tt" placeholder="I…"></textarea><div class="acts"><button class="btn sm" id="tt-add">Add to my note</button></div></details>`}
function wirePerf(id){const tt=$("tt-add");if(tt)tt.onclick=()=>{const v=$("tt").value.trim();if(!v){toast("Write the thought first");return}const cur=(marks[id]||{}).note||"",n=(cur.trim()?cur.trim()+"\n":"")+"Thought track: "+v;saveMark(id,{note:n});if($("tn"))$("tn").value=n;$("tt").value="";toast("Added to your note")};
  document.querySelectorAll(".tool [data-dirgo]").forEach(b=>b.onclick=()=>{closeSheet();closePanel();exSel="director";goStudy("explore")})}
/* ---------- 4.16 practice frame: every drill runs as a round under one frame (pips, score, streak) and ends on a wreath
   with the best score and the lines missed. Quote misses join Daily review (gap → fin, who → who). Bests: <prefix>drb. ---------- */
const DRILLS=[["sprint","Sprint","Answer as many quick quote questions as you can in 60 seconds"],["gap","Fill the gap","Type the missing words in 8 key quotes"],["ladder","Memory ladder","Learn a quote by heart: full, half hidden, first letters, from memory"],["explain","Explain this line","Put 5 passages in your own words, then compare"],["who","Who said it?","Match 8 quotes to their speakers"],["scene","Which scene?","Place 8 key quotes in their scene"],["next","Who speaks next?","Read a cue and name the next speaker, 8 times"],["time","Quote timeline","Three rounds: put 4 key quotes in the order they are spoken"],["odd","Odd one out","Three quotes share a theme: find the one that doesn't"],["order","Put it in order","Three rounds: sort 5 plot events into the order they happen"],["word","Word detective","Guess what 8 old words mean from the line around them"],...(EX.lang?[["untangle","Untangle","Put Shakespeare's word order into everyday order"],["pun","Pun hunt","Find the word doing double duty"],["stress","Tone and stress","Lean on different words and hear the meaning change"]]:[]),["cut","Cut the scene","Keep half the lines and still tell the story"],["two","Two-line scene","Sum up 3 scenes as one line for each of two characters"]];
const rnd=a=>a[Math.floor(Math.random()*a.length)],shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
let DRB={};try{DRB=JSON.parse(LS.get(PFX+"drb")||"{}")||{}}catch(e){}if(typeof DRB!=="object"||Array.isArray(DRB))DRB={};
if(!DRB.lad||typeof DRB.lad!=="object"||Array.isArray(DRB.lad))DRB.lad={};
const saveDrb=()=>LS.set(PFX+"drb",JSON.stringify(DRB));
const drBest=k=>{if(k==="ladder"){const n=Object.keys(DRB.lad).filter(i=>QUOTES.quotes[i]).length;return n?[n,QUOTES.quotes.length,0,n]:null}const b=DRB[k];return Array.isArray(b)&&isFinite(b[0])&&isFinite(b[1])&&b[1]>0?b:null};
/* the frame: label · i of n, pips (a bar past 24 items), right so far and the current streak */
function pipFrame(lab,res,i,n,right,streak,rw){const pips=n<=24?`<span class="pips" aria-hidden="true">${Array.from({length:n},(_,j)=>`<i class="${res[j]===true?"ok":res[j]===false?"no":j===i?"cur":""}"></i>`).join("")}</span>`:`<span class="pbar" aria-hidden="true"><b style="width:${(100*Math.min(i,n)/Math.max(1,n)).toFixed(1)}%"></b></span>`;
  return `<div class="dfr pfr"><span class="dfl">${lab?esc(lab)+" · ":""}${Math.min(i+1,n)} of ${n}</span>${pips}<span class="dfs">${right} ${rw||"right"}${streak>1?` · <b class="stk">${streak} in a row</b>`:""}</span></div>`}
const DRN={gap:8,who:8,word:8,order:3,time:3,scene:8,next:8,odd:6,explain:5,two:3,untangle:6,pun:6,stress:5};
const gapCand=q=>{const ws=q.text.split(/\s+/),nw=ws.map(w=>w.replace(/[^A-Za-z']/g,"").toLowerCase().replace(/^'+|'+$/g,"").replace(/'(s|d|ll)$/,""));return ws.map((w,i)=>[nw[i],i]).filter(x=>x[0].length>3&&nw.indexOf(x[0])===nw.lastIndexOf(x[0]))};
const gw=w=>w.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g,"");
const gnorm=w=>w.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z']/g,"");
const dQ=it=>QUOTES.quotes[it.qi];
const selfRate=(a,b)=>`<div class="srate"><span class="muted">How close were you?</span><button class="btn" data-dans="0">${a}</button><button class="btn primary" data-dans="1">${b}</button></div>`;
const nextBtn=()=>{const R=dr.R;return `<button class="btn primary" id="dr-next">${R.i+1<R.items.length?"Next ›":"See score ›"}</button>`};
/* ordering drills (Put it in order, Quote timeline): it.e = entries in the right order, it.show = the order they're dealt */
const ordItem=e=>({e,show:shuf(e.map((_,i)=>i))});
function ordView(it,st,done,intro){const P=st.pk=st.pk||[],full=P.length===it.e.length,E=it.e,sc=x=>x.s&&sIdx(x.s)>=0?scenes[sIdx(x.s)]:null;
  if(done){const n=P.filter((i,j)=>i===j).length;
    return `<div class="qz"><p class="dres ${st.right?"ok":"no"}">${n} of ${E.length} in the right place.</p><ol class="otl">${E.map((x,j)=>{const u=P.indexOf(j),p=sc(x);return `<li class="${u===j?"ok":"no"}"><i aria-hidden="true">${u===j?"✓":u+1}</i><div><b>${esc(x.t)}</b>${p?`<small>${x.who?esc(title(x.who))+" · ":""}${sName(p)}</small>`:""}${u!==j?`<small class="ow">You put it ${u+1}${["st","nd","rd","th","th","th"][u]}</small>`:""}</div>${x.id!=null&&speech[x.id]?chip(x.id):""}</li>`}).join("")}</ol><div class="row">${nextBtn()}</div></div>`}
  return `<div class="qz ord16"><p class="intro">${intro} Drag a placed one to move it; tap it to take it back.</p>
   <div class="opool">${it.show.map(i=>P.includes(i)?"":`<button data-opk="${i}">${esc(E[i].t)}</button>`).join("")||`<p class="muted">All placed. Check your order, or drag to change it.</p>`}</div>
   <ol class="oslots">${E.map((_,j)=>P[j]!=null?`<li class="ofill" data-osl="${j}"><i aria-hidden="true">${j+1}</i><span>${esc(E[P[j]].t)}</span><b class="ogrip" aria-hidden="true">⋮⋮</b></li>`:`<li class="oempty"><i aria-hidden="true">${j+1}</i><span></span></li>`).join("")}</ol>
   <div class="row"><button class="btn primary" id="ord-chk"${full?"":" disabled"}>Check</button>${P.length?`<button class="link" id="ord-clr">Clear</button>`:""}</div></div>`}
function ordWire(it,st){const P=st.pk;$("sbody").querySelectorAll("[data-opk]").forEach(b=>b.onclick=()=>{P.push(+b.dataset.opk);studyDrill()});
  if($("ord-clr"))$("ord-clr").onclick=()=>{P.length=0;studyDrill()};
  if($("ord-chk"))$("ord-chk").onclick=()=>{st.right=P.every((i,j)=>i===j);drAns(st.right)};
  /* drag a placed entry to a new slot (pointer events, so it works with touch); a tap sends it back to the pool */
  $("sbody").querySelectorAll("[data-osl]").forEach(li=>{li.onpointerdown=e=>{if(e.button>0)return;const j=+li.dataset.osl,y0=e.clientY,h=li.offsetHeight+6;let moved=false;li.setPointerCapture(e.pointerId);
    li.onpointermove=m=>{const dy=m.clientY-y0;if(Math.abs(dy)>6){moved=true;li.classList.add("drag");li.style.transform=`translateY(${dy}px)`}};
    li.onpointerup=li.onpointercancel=u=>{li.onpointermove=li.onpointerup=li.onpointercancel=null;if(!moved){if(u.type==="pointerup")P.splice(j,1);studyDrill();return}
      const to=Math.max(0,Math.min(P.length-1,j+Math.round((u.clientY-y0)/h)));const [x]=P.splice(j,1);P.splice(to,0,x);studyDrill()}}})}
/* each drill: make(n) → items; view(it,st,done) → html; ids(it) → speeches for Look again; key(it) → Daily review key */
const DK={
  gap:{make:n=>shuf(QUOTES.quotes.filter(q=>gapCand(q).length)).slice(0,n).map(q=>({qi:q.i,pick:shuf(gapCand(q)).slice(0,2).map(x=>x[1]).sort((a,b)=>a-b)})),
    ids:it=>[dQ(it).id],key:it=>"fin:"+it.qi,
    view(it,st,done){const q=dQ(it),ws=q.text.split(/\s+/),sp=speech[q.id];st.v=st.v||{};st.ok=st.ok||{};
      return `<div class="qz gap16"><div class="gapq">“${ws.map((w,i)=>{if(!it.pick.includes(i))return esc(w);const core=gw(w),pre=w.slice(0,w.indexOf(core)),post=w.slice(w.indexOf(core)+core.length);
        if(done||st.ok[i])return esc(pre)+`<b class="gw ${st.ok[i]?"ok":"no"}">${esc(core)}</b>`+esc(post);
        return esc(pre)+`<input class="gin${st.bad&&st.bad[i]?" bad":""}" data-gap="${i}" style="--n:${core.length}" maxlength="${core.length+3}" value="${esc(st.v[i]||"")}" aria-label="Missing word, ${core.length} letters" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">`+esc(post)}).join(" ")}”</div>
       <p class="gsrc">${folioMedal(sp.who,COLORS[sp.who],"gmed")}<span>${esc(title(sp.who))} · ${sName(sceneOf(q.id))}</span></p>
       ${done?`<p class="dres ${st.right?"ok":"no"}">${st.right?(st.tries?"Right on the second try.":"Right."):"The missing words are in bold."}</p><p class="muted">${esc(q.note)}</p><div class="row">${nextBtn()}${chip(q.id)}</div>`
        :`${st.tries?`<p class="dres no">Not quite: one more try. The right words stay.</p>`:""}<div class="row"><button class="btn primary" id="gap-chk">Check</button>${st.hint?"":`<button class="btn" id="gap-hint">First letters</button>`}<button class="link" id="gap-show">Show answer</button></div>`}</div>`},
    wire(it,st){const ins=[...$("sbody").querySelectorAll("[data-gap]")],q=dQ(it),ws=q.text.split(/\s+/);
      ins.forEach(el=>{el.oninput=()=>{st.v[el.dataset.gap]=el.value};el.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();const nx=ins[ins.indexOf(el)+1];if(nx)nx.focus();else $("gap-chk").click()}}});
      const chk=()=>{st.bad={};let all=true;it.pick.forEach(i=>{if(st.ok[i])return;const r=gnorm(st.v[i]||"")===gnorm(gw(ws[i]));if(r)st.ok[i]=1;else{st.bad[i]=1;all=false}});
        if(all){st.right=true;drAns(true);return}if(st.tries){drAns(false);return}st.tries=1;studyDrill();const f=$("sbody").querySelector(".gin.bad");if(f)f.focus()};
      if($("gap-chk"))$("gap-chk").onclick=chk;
      if($("gap-hint"))$("gap-hint").onclick=()=>{st.hint=1;it.pick.forEach(i=>{if(!st.ok[i]&&!(st.v[i]||"").trim())st.v[i]=gw(ws[i])[0]});studyDrill();const f=$("sbody").querySelector(".gin");if(f){f.focus();f.setSelectionRange(f.value.length,f.value.length)}};
      if($("gap-show"))$("gap-show").onclick=()=>drAns(false);
      if(!st.tries&&!st.hint&&ins[0]&&!matchMedia("(pointer:coarse)").matches)ins[0].focus({preventScroll:true})}},
  who:{make:n=>{const pool=[...new Set([...(CFG.drillCast||[]),...QUOTES.quotes.map(x=>speech[x.id].who)])];
      return shuf(QUOTES.quotes.filter(q=>!q.text.toLowerCase().includes(speech[q.id].who.toLowerCase()))).slice(0,n).map(q=>{const w=speech[q.id].who;return {qi:q.i,o:shuf([w,...shuf(pool.filter(x=>x!==w)).slice(0,3)])}})},
    ids:it=>[dQ(it).id],key:it=>"who:"+it.qi,
    view(it,st,done){const q=dQ(it),w=speech[q.id].who,p=sceneOf(q.id);
      return `<div class="qz who16"><h3 class="dq">“${esc(q.text)}”</h3><div class="wopts">${it.o.map(o=>`<button data-dpick="${esc(o)}"${done?" disabled":""} class="${done?(o===w?"right":o===st.pick?"wrong":""):""}" style="--c:${esc(COLORS[o]||"var(--ink)")}">${folioMedal(o,COLORS[o],"wom")}<b>${esc(title(o))}</b></button>`).join("")}</div>
       ${done?`<p class="muted">${esc(title(w))}, ${sName(p)}. ${esc(q.note)}</p><div class="row">${nextBtn()}${chip(q.id)}</div>`:""}</div>`},
    pick:(it,v)=>v===speech[dQ(it).id].who},
  word:{make:n=>{const use=glossUse(),ks=shuf(Object.keys(use).filter(k=>speech[use[k]]&&G[k].length<90));return ks.slice(0,n).map(k=>({k,id:use[k],o:shuf([k,...shuf(ks.filter(x=>x!==k&&G[x]!==G[k])).slice(0,3)])}))},
    ids:it=>[it.id],
    view(it,st,done){const sp=speech[it.id],rx=it.k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),ln=sp.lines.map(lineOf).find(l=>new RegExp("(^|[^A-Za-z'])"+rx+"(?![A-Za-z])","i").test(l))||lineOf(sp.lines[0]);
      const hl=esc(ln).replace(new RegExp("(^|[^A-Za-z'])("+esc(it.k).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")(?![A-Za-z])","i"),"$1<mark>$2</mark>");
      return `<div class="qz"><p class="intro">Use the rest of the line to guess what the marked word means here.</p><h3 class="dq">${hl}</h3><p class="muted">${esc(where(sp))}</p>
       <div class="opts">${it.o.map(o=>`<button data-dpick="${esc(o)}"${done?" disabled":""} class="${done?(o===it.k?"right":o===st.pick?"wrong":""):""}">${esc(G[o])}</button>`).join("")}</div>
       ${done?`<p class="muted"><b>${esc(it.k)}</b>: ${esc(G[it.k])}</p><div class="row">${nextBtn()}${chip(it.id)}</div>`:""}</div>`},
    pick:(it,v)=>v===it.k},
  order:{make:n=>{const T=(EX.timeline||[]).map(e=>({t:e.t,s:e.s,id:e.id}));if(T.length<5)return [];return Array.from({length:n},()=>ordItem(shuf(T.map((_,i)=>i)).slice(0,5).sort((a,b)=>a-b).map(i=>T[i])))},
    ids:it=>it.e.map(e=>e.id).filter(x=>x!=null),view:(it,st,done)=>ordView(it,st,done,"Tap the events in the order they happen."),wire:ordWire},
  time:{make:n=>{const Q=QUOTES.quotes.filter(q=>speech[q.id]);if(Q.length<8)return [];return Array.from({length:n},()=>{const pick=[];const sc=new Set();for(const q of shuf(Q)){const p=speech[q.id].page;if(!sc.has(p)){sc.add(p);pick.push(q)}if(pick.length===4)break}
      return ordItem(pick.sort((a,b)=>+a.id-+b.id).map(q=>({t:"“"+q.text+"”",s:speech[q.id].page,id:q.id,who:speech[q.id].who})))})},
    ids:it=>it.e.map(e=>e.id),view:(it,st,done)=>ordView(it,st,done,"Tap the quotes in the order they're spoken in the play."),wire:ordWire},
  scene:{make:n=>{const sc=scenes.filter(p=>QUOTES.quotes.some(q=>speech[q.id].page===p.id));return shuf(QUOTES.quotes).slice(0,n).map(q=>{const p=sceneOf(q.id),k=sIdx(p.id),near=shuf(scenes.filter(x=>x.id!==p.id&&Math.abs(sIdx(x.id)-k)<=4)),far=shuf(sc.filter(x=>x.id!==p.id));
      const o=[p.id];for(const x of [...near.slice(0,2),...far])if(!o.includes(x.id)&&o.length<4)o.push(x.id);return {qi:q.i,o:shuf(o)}})},
    ids:it=>[dQ(it).id],key:it=>"act:"+it.qi,
    view(it,st,done){const q=dQ(it),sp=speech[q.id],p=sceneOf(q.id);
      return `<div class="qz"><p class="intro">Which scene is this from?</p><h3 class="dq">“${esc(q.text)}”</h3><p class="gsrc">${folioMedal(sp.who,COLORS[sp.who],"gmed")}<span>${esc(title(sp.who))}</span></p>
       <div class="opts sopts">${it.o.map(id=>{const x=scenes[sIdx(id)];return `<button data-dpick="${id}"${done?" disabled":""} class="${done?(id===p.id?"right":id===st.pick?"wrong":""):""}"><b>${sName(x)}</b><small>${esc(shortLoc(x))}</small></button>`}).join("")}</div>
       ${done?`<p class="muted">${esc(q.note)}</p><div class="row">${nextBtn()}${chip(q.id)}</div>`:""}</div>`},
    pick:(it,v)=>v===sceneOf(dQ(it).id).id},
  next:{make:n=>{const C=[];scenes.forEach(p=>{const sps=p.items.filter(x=>x.t==="sp"),cast=[...new Set(sps.map(x=>x.who))];if(cast.length<3)return;
      for(let j=0;j+1<sps.length;j++){const a=sps[j],b=sps[j+1];if(a.who!==b.who&&a.lines.length>=2&&b.who.length<30)C.push({id:a.id,nx:b.id,cast})}});
      return shuf(C).slice(0,n).map(c=>{const w=speech[c.nx].who;return {id:c.id,nx:c.nx,o:shuf([w,...shuf(c.cast.filter(x=>x!==w&&x!==speech[c.id].who)).slice(0,3)])}})},
    ids:it=>[it.nx],
    view(it,st,done){const a=speech[it.id],b=speech[it.nx],L=a.lines.map(lineOf),t=L.slice(-3);
      return `<div class="qz"><p class="intro">Who speaks next? Read the cue, then pick the speaker.</p><p class="muted">${sName(sceneOf(it.id))} · ${esc(shortLoc(sceneOf(it.id)))}</p>
       <div class="cuebx" style="--c:${esc(COLORS[a.who]||"var(--ink)")}"><small>${esc(title(a.who))}</small>${L.length>3?`<span class="muted">…</span>`:""}${t.map(l=>`<span>${esc(l)}</span>`).join("")}</div>
       <div class="wopts">${it.o.map(o=>`<button data-dpick="${esc(o)}"${done?" disabled":""} class="${done?(o===b.who?"right":o===st.pick?"wrong":""):""}" style="--c:${esc(COLORS[o]||"var(--ink)")}">${folioMedal(o,COLORS[o],"wom")}<b>${esc(title(o))}</b></button>`).join("")}</div>
       ${done?`<div class="cuebx ans" style="--c:${esc(COLORS[b.who]||"var(--ink)")}"><small>${esc(title(b.who))}</small>${b.lines.slice(0,3).map(l=>`<span>${esc(lineOf(l))}</span>`).join("")}${b.lines.length>3?`<span class="muted">…</span>`:""}</div><div class="row">${nextBtn()}${chip(it.nx)}</div>`:""}</div>`},
    pick:(it,v)=>v===speech[it.nx].who},
  odd:{make:n=>{const T=Object.keys(QUOTES.themes),out=[];for(let g=0;g<200&&out.length<n;g++){const t=rnd(T),inn=shuf(QUOTES.quotes.filter(q=>q.themes.includes(t))),outq=shuf(QUOTES.quotes.filter(q=>!q.themes.includes(t)));
      if(inn.length<3||!outq.length)continue;const odd=outq[0],qs=[...inn.slice(0,3),odd];if(out.some(x=>x.odd===odd.i))continue;out.push({t,odd:odd.i,o:shuf(qs.map(q=>q.i))})}return out},
    ids:it=>[QUOTES.quotes[it.odd].id],key:it=>"th:"+it.odd,
    view(it,st,done){const [nm]=QUOTES.themes[it.t];
      return `<div class="qz"><p class="intro">Three of these quotes share a theme. Tap the odd one out.</p>
       <div class="oddl">${it.o.map(i=>{const q=QUOTES.quotes[i],sp=speech[q.id];return `<button data-dpick="${i}"${done?" disabled":""} class="${done?(i===it.odd?"right":String(i)===st.pick?"wrong":"in"):""}" style="--c:${esc(COLORS[sp.who]||"var(--ink)")}"><span>“${esc(q.text)}”</span><small>${esc(title(sp.who))}${done?` · ${q.themes.map(t=>esc(QUOTES.themes[t][0])).join(", ")}`:""}</small></button>`}).join("")}</div>
       ${done?`<p class="dres ok">The three share <b>${esc(nm)}</b>.</p><div class="row">${nextBtn()}${chip(QUOTES.quotes[it.odd].id)}</div>`:""}</div>`},
    pick:(it,v)=>+v===it.odd},
  explain:{make:n=>shuf(Object.keys(PARTS).filter(id=>speech[id])).slice(0,n).map(id=>({id,pi:Math.floor(Math.random()*PARTS[id].length)})),
    ids:it=>[it.id],
    view(it,st,done){const sp=speech[it.id],q=partsOf(sp)[it.pi]||partsOf(sp)[0];
      return `<div class="qz"><p class="muted">${esc(where(sp))}</p>${(()=>{const L=sp.lines.slice(q[0],q[1]+1),long=L.length>6&&!st.all&&!done;return `<div class="tool"><div class="porig${long?" clamp19":""}">${L.map(l=>`<span>${esc(l.replace(/^~/,""))}</span>`).join("")}</div>${long?`<button type="button" class="link" id="ex-all">Show all ${L.length} lines</button>`:""}</div>`})()}
       <label class="lbl" for="ex-a" style="display:block;margin-top:12px">In your own words</label><textarea class="sinput" id="ex-a" style="min-height:90px" placeholder="What is being said here?">${esc(st.mine||"")}</textarea>
       ${st.show?`<div class="tool"><div class="pmod"><div class="ptag">Modern English</div><p>${esc(q[2])}</p></div></div>${done?`<div class="row">${nextBtn()}${chip(it.id)}</div>`:selfRate("Missed the point","Got the main point")}`:`<div class="row"><button class="btn primary" id="ex-show">Compare</button></div>`}</div>`},
    wire(it,st){if($("ex-a"))$("ex-a").oninput=e=>st.mine=e.target.value;if($("ex-all"))$("ex-all").onclick=()=>{st.all=1;studyDrill()};if($("ex-show"))$("ex-show").onclick=()=>{st.show=1;studyDrill()}}},
  two:{make:n=>shuf(scenes.map((s,i)=>[s,i]).filter(([s])=>new Set(s.items.filter(it=>it.t==="sp").map(x=>x.who)).size>=2)).slice(0,n).map(x=>({k:x[1]})),
    ids:it=>{const s=scenes[it.k],kq=QUOTES.quotes.find(q=>speech[q.id].page===s.id);return kq?[kq.id]:[]},
    view(it,st,done){const s=scenes[it.k],by={};s.items.filter(x=>x.t==="sp").forEach(x=>by[x.who]=(by[x.who]||0)+x.lines.length);const [w1,w2]=Object.entries(by).sort((a,b)=>b[1]-a[1]).map(x=>x[0]),S0=STUDY.scenes[s.id]||{},kq=QUOTES.quotes.find(q=>speech[q.id].page===s.id);
      return `<div class="qz"><p class="intro">Shrink the scene into two lines: one for each main character, in your own words.</p><div class="qn">${sName(s)} · ${esc(shortLoc(s))}</div>
       <label class="lbl" for="two-a">${esc(title(w1))}</label><input class="sinput" id="two-a" value="${esc(st.a||"")}" placeholder="What ${esc(title(w1))} wants or says, in one line">
       <label class="lbl" for="two-b" style="margin-top:8px">${esc(title(w2))}</label><input class="sinput" id="two-b" value="${esc(st.b||"")}" placeholder="How ${esc(title(w2))} answers">
       ${st.show?`<div class="box">${S0.sum?`<p><b>The scene:</b> ${esc(S0.sum)}</p>`:""}${kq?quoteHTML(kq):""}</div>${done?`<div class="row">${nextBtn()}<button class="btn" data-go2="${s.id}">Read the scene</button></div>`:selfRate("Missed the conflict","Caught the conflict")}`:`<div class="row"><button class="btn primary" id="two-show">Compare</button><button class="btn" data-go2="${s.id}">Read the scene</button></div>`}</div>`},
    wire(it,st){if($("two-a")){$("two-a").oninput=e=>st.a=e.target.value;$("two-b").oninput=e=>st.b=e.target.value}if($("two-show"))$("two-show").onclick=()=>{st.show=1;studyDrill()}}},
  untangle:{make:n=>shuf(LANG.un.map((_,i)=>i)).slice(0,n).map(u=>({u})),ids:it=>[LANG.un[it.u][0]],
    view(it,st,done){const [id,orig,mod]=LANG.un[it.u],ws=wtok(mod),ord=st.ord||(st.ord=shuf(ws.map((_,i)=>i))),pk=st.pk=st.pk||[],built=pk.map(i=>ws[i]).join(" ");
      return `<div class="qz"><p class="muted">${esc(where(speech[id]))}</p><p class="intro">Tap the words to put the line into everyday order.</p><h3 class="dq">“${esc(orig)}”</h3>
       <div class="ord words">${ord.map(i=>`<button data-uw="${i}"${pk.includes(i)||done?" disabled":""}>${esc(ws[i].replace(/[,.;:!?]+$/,""))}</button>`).join("")}</div>
       <p class="ubuilt ${done?(st.right?"ok":"no"):""}">${esc(built.replace(/[,.;:!?](?=\s|$)/g,""))||"<span class='muted'>Your order appears here</span>"}</p>
       ${done?`<p>${st.right?"<b>Right.</b>":"<b>Not quite.</b> One everyday order:"} ${esc(mod)}</p><p class="muted">Which word did Shakespeare's order push to the front or the end? That is usually the word he wants stressed.</p><div class="row">${nextBtn()}${chip(id)}</div>`
        :`<div class="row">${pk.length?`<button class="link" id="un-undo">Undo</button>`:""}</div>`}</div>`},
    wire(it,st){const ws=wtok(LANG.un[it.u][2]);$("sbody").querySelectorAll("[data-uw]").forEach(b=>b.onclick=()=>{st.pk.push(+b.dataset.uw);if(st.pk.length===ws.length){st.right=st.pk.map(i=>clean(ws[i])).join(" ")===ws.map(clean).join(" ");drAns(st.right)}else studyDrill()});
      if($("un-undo"))$("un-undo").onclick=()=>{st.pk.pop();studyDrill()}}},
  pun:{make:n=>shuf(LANG.pun.map((_,i)=>i)).slice(0,n).map(u=>({u})),ids:it=>[LANG.pun[it.u][0]],
    view(it,st,done){const [id,line,word,kind,ex]=LANG.pun[it.u],tw=wtok(word).map(clean),ws=wtok(line);
      const lab={pun:"Pun: one word, two meanings",shift:"Functional shift: a word used as a different part of speech",malapropism:"Malapropism: the wrong word that sounds like the right one",wordplay:"Wordplay"}[kind]||"Wordplay";
      return `<div class="qz"><p class="muted">${esc(where(speech[id]))}</p><p class="intro">${kind==="shift"?"Which word is doing a job it doesn't usually do?":kind==="malapropism"?"Which word is the wrong one?":"Which word is doing double duty?"} Tap it.</p>
       <div class="punl">${ws.map((w,i)=>{const hit=tw.includes(clean(w));return `<button data-pw="${i}"${done?" disabled":""} class="${done?(hit?"right":+st.pick===i?"wrong":""):""}">${esc(w)}</button>`}).join(" ")}</div>
       ${done?`<div class="snote"><b>${esc(lab)}</b><br>${esc(ex)}</div><div class="row">${nextBtn()}${chip(id)}</div>`:""}</div>`},
    wire(it,st){const [,line,word]=LANG.pun[it.u],tw=wtok(word).map(clean),ws=wtok(line);$("sbody").querySelectorAll("[data-pw]").forEach(b=>b.onclick=()=>{st.pick=b.dataset.pw;drAns(tw.includes(clean(ws[+st.pick])))})}},
  stress:{make:n=>shuf(LANG.st.map((_,i)=>i)).slice(0,n).map(u=>({u})),ids:()=>[],
    view(it,st,done){const [id,line,opts]=LANG.st[it.u],ws=wtok(line),seen=st.seen=st.seen||[],on=seen[seen.length-1];
      return `<div class="qz"><p class="muted">${esc(where(speech[id]))}</p><p class="intro">Say the line aloud, leaning on a different word each time. Tap each word you could stress to hear what it does.</p>
       <h3 class="stl">${(used=>ws.map(w=>{const k=opts.findIndex(o=>clean(o[0])===clean(w));if(k>=0&&used.has(k))return esc(w);used.add(k);return k<0?esc(w):`<button class="stw${seen.includes(k)?" seen":""}${on===k?" on":""}" data-sw="${k}">${esc(w)}</button>`}).join(" "))(new Set())}</h3>
       ${seen.map(k=>`<div class="snote"><b>Stress “${esc(opts[k][0])}”</b><br>${esc(opts[k][1])}</div>`).join("")}
       ${done?`<p class="muted">No single right answer: actors choose. Use it in an essay as "an actor might stress…".</p><div class="row">${nextBtn()}${chip(id)}</div>`:`<p class="muted">${seen.length} of ${opts.length} readings heard.</p>`}</div>`},
    wire(it,st){const opts=LANG.st[it.u][2];$("sbody").querySelectorAll("[data-sw]").forEach(b=>b.onclick=()=>{const k=+b.dataset.sw,i=st.seen.indexOf(k);if(i>=0)st.seen.splice(i,1);st.seen.push(k);if(st.seen.length>=opts.length&&dr.R.res[dr.R.i]==null)drAns(true);else studyDrill()})}}
};
const DRL={stress:"heard"};
/* 4.19 Sprint: 60 seconds of mixed quick-pick questions (who, scene, odd, word); best = most right */
const SPRK=["who","scene","odd","word"];let SPT=null;
const sprintFrame=(R,ok)=>{const left=Math.max(0,60-Math.floor((Date.now()-(R.t0||Date.now()))/1e3));return `<div class="dfr pfr spr"><span class="dfl">Sprint · <b id="spt">${left}</b> s</span><span class="pbar" aria-hidden="true"><b id="spb" style="width:${(left/60*100).toFixed(1)}%"></b></span><span class="dfs">${ok} right${R.streak>1?` · <b class="stk">${R.streak} in a row</b>`:""}</span></div>`};
function sprintTick(){const R=dr.R;if(!R.t0)R.t0=Date.now();clearInterval(SPT);SPT=setInterval(()=>{const el=$("spt");if(!el||dr.k!=="sprint"||dr.R!==R){clearInterval(SPT);return}
  const left=Math.max(0,60-Math.floor((Date.now()-R.t0)/1e3));el.textContent=left;const b=$("spb");if(b)b.style.width=(left/60*100).toFixed(1)+"%";
  if(left<=0){clearInterval(SPT);R.items=R.items.slice(0,R.res[R.i]!=null?R.i+1:R.i);R.res.length=R.items.length;R.i=R.items.length;studyDrill();scrollTo(0,0)}},250)}
DK.sprint={make:()=>{const per={};SPRK.forEach(k=>per[k]=DK[k].make(12));const out=[];for(let i=0;i<12;i++)SPRK.forEach(k=>{const it=per[k][i];if(it)out.push({t:k,it})});return shuf(out)},
  ids:x=>DK[x.t].ids(x.it),key:x=>DK[x.t].key?DK[x.t].key(x.it):null,view:(x,st,done)=>`<div class="sprk">${DRILLS.find(d=>d[0]===x.t)[1]}</div>`+DK[x.t].view(x.it,st,done),pick:(x,v)=>DK[x.t].pick(x.it,v)};
/* haptics on phones (no-op elsewhere) */
const buzz=ok=>{try{if(navigator.vibrate&&matchMedia("(pointer:coarse)").matches&&!matchMedia("(prefers-reduced-motion:reduce)").matches)navigator.vibrate(ok?12:[25,40,25])}catch(e){}};
/* history: rounds finished per day, <prefix>drlog = {"YYYY-MM-DD":n}, last 60 days kept */
let DRLOG={};try{DRLOG=JSON.parse(LS.get(PFX+"drlog")||"{}")||{}}catch(e){}if(typeof DRLOG!=="object"||Array.isArray(DRLOG))DRLOG={};
function drLog(){const t=today();DRLOG[t]=(+DRLOG[t]||0)+1;const ks=Object.keys(DRLOG).sort();ks.slice(0,Math.max(0,ks.length-60)).forEach(k=>delete DRLOG[k]);LS.set(PFX+"drlog",JSON.stringify(DRLOG))}
/* minutes per drill, shelves, and the Next up pick */
const DMIN={gap:3,ladder:4,who:3,scene:3,next:3,time:3,odd:3,order:3,explain:6,word:3,untangle:3,pun:2,stress:3,cut:8,two:5,sprint:1};
const DSHELF=[["Quotes",["sprint","gap","who","scene","time","odd","ladder"]],["Plot and people",["order","next","two"]],["Language",["word","explain","untangle","pun","stress"]],["On stage",["cut"]]];
function nextUp(){const L=drillsNow().filter(k=>DK[k]&&k!=="stress"&&k!=="sprint");const un=L.find(k=>!drBest(k));if(un)return [un,"Not tried yet"];
  const sc=L.map(k=>{const b=drBest(k);return [k,b[0]/b[1],b[2]]}).sort((a,b)=>a[1]-b[1]||a[2]-b[2])[0];return sc?[sc[0],`Your lowest best: ${drBest(sc[0])[0]} of ${drBest(sc[0])[1]}`]:null}
function rulePrev(){const D=DK[dr.k];if(!D||dr.k==="stress")return "";try{if(!dr.sm)dr.sm=D.make(1)[0];if(!dr.sm)return "";const R0=dr.R;dr.R={items:[dr.sm],i:0,res:[],st:{}};const h=D.view(dr.sm,{},false);dr.R=R0;
  return `<div class="rprev" aria-hidden="true" inert><small>Looks like this</small><div class="rpv">${h}</div></div>`}catch(e){return ""}}
function drStart(){const D=DK[dr.k];dr.R={items:D.make(DRN[dr.k]||8).filter(Boolean),i:0,res:[],st:{},streak:0}}
function drAns(ok){const R=dr.R;if(!R||R.res[R.i]!=null)return;const it=R.items[R.i],D=DK[dr.k];R.res[R.i]=!!ok;R.streak=ok?R.streak+1:0;R.fx=ok?"ok":"no";buzz(ok);
  const key=D.key&&D.key(it);if(key&&(QUOTES.quotes[+key.split(":")[1]])){if(!ok)grade(key,false,false);else if(isDue(key))grade(key,true,false)}
  studyDrill()}
const drillsNow=()=>["drill:sprint"].concat(topicK("practise")[2]).concat(topicK("words")[2]).filter(s=>s.startsWith("drill:")&&toolOK(s)).map(s=>s.slice(6)).filter((k,i,a)=>a.indexOf(k)===i);
function nextDrill(k){const L=drillsNow().filter(x=>DK[x]||x==="ladder"),i=L.indexOf(k);return L.length>1?DRILLS.find(d=>d[0]===L[(i+1)%L.length]):null}
function drEnd(){const R=dr.R,D0=DRILLS.find(d=>d[0]===dr.k),n=R.items.length,ok=R.res.filter(x=>x===true).length,old=drBest(dr.k);
  if(!R.saved){R.saved=1;drLog();R.nb=!!ok&&(!old||(dr.k==="sprint"?ok>old[0]:ok/n>old[0]/old[1]));const pl=((old&&old[3])||0)+1;DRB[dr.k]=R.nb||!old?[ok,n,Date.now(),pl]:[old[0],old[1],old[2],pl];saveDrb()}
  const b=drBest(dr.k),ids=[...new Set(R.items.filter((_,j)=>R.res[j]===false).flatMap(it=>DK[dr.k].ids(it)).filter(x=>x!=null&&speech[x]))],nx=nextDrill(dr.k);
  clearInterval(SPT);return (dr.k==="sprint"?"":pipFrame("",R.res,n,n,ok,0))+`<div class="qz dend">${dr.k==="sprint"?`<div class="wreath${ok>=10?" full":""}">${laurelSVG("wl")}<div class="wrs"><b>${ok}</b> <small>in 60 s</small></div></div>`:wreathHTML(ok,n)}<p class="dmsg">${dr.k==="sprint"?`${ok} right of ${n} answered.`:ok===n?"Full marks.":ok>=n*.7?"A strong round.":"Look again at the lines below, then go again."}</p>
    ${R.nb?`<p class="nbest">${folioSeal("❦","g","nbs")}New best</p>`:b?`<p class="muted">Your best: ${b[0]}${dr.k==="sprint"?"":" of "+b[1]} · played ${b[3]} time${b[3]===1?"":"s"}</p>`:""}
    <div class="row" style="justify-content:center"><button class="btn primary" id="dr-again">Play again</button>${nx?`<button class="btn" type="button" data-to="study:drill:${nx[0]}?tp=practise">Next: ${esc(nx[1])} ›</button>`:""}</div>
    ${R.res.some(x=>x===false)&&DK[dr.k].key?`<p class="muted" style="text-align:center">Missed quotes join Daily review.</p>`:""}</div>${ids.length?`<div class="box miss49"><h3>Look again · ${ids.length}</h3>${evHTML(ids,"Lines")}</div>`:""}`}
/* memory ladder: choose a quote from a searchable list, climb four steps, then type it from memory */
function ladderHTML(){
  if(dr.i==null){const f=(dr.f||"").toLowerCase(),L=QUOTES.quotes.filter(q=>!f||q.text.toLowerCase().includes(f)||title(speech[q.id].who).toLowerCase().includes(f));
    return `<p class="intro">Choose a quote to learn by heart. A seal marks quotes you have typed word for word.</p><label class="sr" for="ld-f">Search quotes</label><input class="sinput" id="ld-f" type="search" placeholder="Search by word or speaker" value="${esc(dr.f||"")}" autocomplete="off">
     <div class="lql">${L.map(q=>{const sp=speech[q.id];return `<button type="button" data-ldq="${q.i}" style="--c:${esc(COLORS[sp.who]||"var(--ink)")}">${DRB.lad[q.i]?folioSeal("❦","g","lqs"):prog.cards[q.i]?folioSeal("✓","","lqs"):`<i class="lqn" aria-hidden="true"></i>`}<span><b>“${esc(clip(q.text,90))}”</b><small>${esc(title(sp.who))} · ${sName(sceneOf(q.id))}</small></span></button>`}).join("")||`<p class="muted">No quote matches.</p>`}</div>`}
  const q=QUOTES.quotes[dr.i],ws=q.text.split(/\s+/),sp=speech[q.id],l=dr.l||0;
  const view=l===0?esc(q.text):l===1?ws.map((w,i)=>i%2?`<span class="lh">${esc(w.replace(/[A-Za-z]/g,"_"))}</span>`:esc(w)).join(" "):l===2?ws.map(w=>esc(w.replace(/([A-Za-z])[A-Za-z']*/,"$1"))).join(" "):"";
  return pipFrame("Memory ladder",[0,1,2,3].map(j=>j<l?true:j===3&&dr.res!=null?dr.res:undefined),l,4,l,0,"climbed")+`<div class="qz lad16" style="--c:${esc(COLORS[sp.who]||"var(--ink)")}"><div class="qn">Step ${l+1}: ${["Read it aloud","Every other word hidden","First letters only","From memory"][l]}</div>
    <div class="ladder">${l<3?view:`<textarea class="sinput" id="ld-a" placeholder="Type the whole quote from memory">${esc(dr.a||"")}</textarea>`}</div><p class="gsrc">${folioMedal(sp.who,COLORS[sp.who],"gmed")}<span>${esc(title(sp.who))} · ${sName(sceneOf(q.id))}</span></p>
    <div id="ld-res">${dr.res!=null?dr.rh:""}</div>
    <div class="row">${l>0&&dr.res==null?`<button class="btn" id="ld-prev">‹ Easier</button>`:""}${l<3?`<button class="btn primary" id="ld-next">Harder ›</button>`:dr.res==null?`<button class="btn primary" id="ld-chk">Check</button>`:`<button class="btn primary" id="ld-nq">Next quote ›</button><button class="btn" id="ld-re">Try again</button>`}<button class="link" id="ld-pick">Choose another</button></div></div>`}
function wireLadder(){const on=(id,f)=>{const el=$(id);if(el)el.onclick=f};
  if($("ld-f"))$("ld-f").oninput=e=>{dr.f=e.target.value;const p=e.target.selectionStart;studyDrill();const f=$("ld-f");f.focus();f.setSelectionRange(p,p)};
  $("sbody").querySelectorAll("[data-ldq]").forEach(b=>b.onclick=()=>{dr.i=+b.dataset.ldq;dr.l=0;dr.res=null;dr.a="";studyDrill();scrollTo(0,0)});
  on("ld-next",()=>{dr.l++;studyDrill()});on("ld-prev",()=>{dr.l--;studyDrill()});on("ld-pick",()=>{dr.i=null;studyDrill()});on("ld-re",()=>{dr.l=0;dr.res=null;dr.a="";studyDrill()});
  on("ld-nq",()=>{const L=QUOTES.quotes.filter(q=>!DRB.lad[q.i]&&q.i!==dr.i);dr.i=(L.find(q=>q.i>dr.i)||L[0]||QUOTES.quotes[0]).i;dr.l=0;dr.res=null;dr.a="";studyDrill();scrollTo(0,0)});
  if($("ld-a"))$("ld-a").oninput=e=>dr.a=e.target.value;
  on("ld-chk",()=>{const a=(dr.a||"").toLowerCase().replace(/[^a-z' ]/g,"").split(/\s+/).filter(Boolean),q=QUOTES.quotes[dr.i],b=q.text.toLowerCase().replace(/[^a-z' ]/g,"").split(/\s+/).filter(Boolean);
    const L=Array(b.length+1).fill(0).map(()=>Array(a.length+1).fill(0));for(let i=1;i<=b.length;i++)for(let j=1;j<=a.length;j++)L[i][j]=b[i-1]===a[j-1]?L[i-1][j-1]+1:Math.max(L[i-1][j],L[i][j-1]);
    const hit=L[b.length][a.length],ok=hit===b.length&&a.length===b.length;dr.res=ok;dr.rh=`<p class="dres ${ok?"ok":"no"}"><b>${hit} of ${b.length} words right.</b> ${ok?"Word perfect: it's yours.":"Answer: "+esc(q.text)}</p>`;
    if(ok){DRB.lad[dr.i]=Date.now();saveDrb()}const k="fin:"+dr.i;if(!ok)grade(k,false,false);else if(isDue(k))grade(k,true,false);studyDrill()})}
/* cut the scene (one task, no round) */
function cutHTML(){if(!dr.c){const ok=scenes.map((s,i)=>[s,i]).filter(([s])=>s.items.filter(it=>it.t==="sp").length>=10),here=pos&&sIdx(pos.s)>=0&&ok.find(x=>x[1]===sIdx(pos.s));dr.c={k:(here||rnd(ok))[1],cut:{},chk:false}}
  const C=dr.c,s=scenes[C.k],sps=s.items.filter(it=>it.t==="sp"),tot=sps.reduce((a,x)=>a+x.lines.length,0),kept=sps.filter(x=>!C.cut[x.id]).reduce((a,x)=>a+x.lines.length,0),pc=Math.round(kept/tot*100);
  const lost=C.chk?sps.filter(x=>C.cut[x.id]&&(QBY[x.id]||EX.irony[x.id]||STUDY.notes[x.id])):[];
  return `<p class="intro">Directors often cut Shakespeare. Cut this scene to half its lines or less, and keep the story clear. Tap a speech to cut it; tap again to keep it.</p>
   <div class="lbl">Scene · ${sName(s)} · ${esc(shortLoc(s))}</div><div class="cutsc" role="group" aria-label="Choose a scene">${scenes.map((x,i)=>x.items.filter(it=>it.t==="sp").length>=10?`<button type="button" data-cuts="${i}" aria-pressed="${i===C.k}" aria-label="${esc(sName(x))}">${x.act?R[x.act]:"Ind"}.${esc(x.scene.toLowerCase())}</button>`:"").join("")}</div>
   <div class="cutbar"><b>${kept}</b> of ${tot} lines kept (${pc}%)<i><b style="width:${pc}%;background:${pc<=50?"var(--ok)":"var(--tc,var(--accent))"}"></b><em style="left:50%" aria-hidden="true"></em></i></div>
   <div class="cutmap" role="group" aria-label="The scene at a glance: one block per speech, sized by its lines">${sps.map(x=>`<button type="button" data-cut="${x.id}" class="${C.cut[x.id]?"cut":""}${QBY[x.id]?" kq":""}" style="flex-grow:${x.lines.length};--c:${esc(COLORS[x.who]||"var(--muted)")}" title="${esc(title(x.who))} · ${x.lines.length} line${x.lines.length===1?"":"s"}" aria-label="${esc(title(x.who))}, ${x.lines.length} line${x.lines.length===1?"":"s"}${C.cut[x.id]?", cut":""}"></button>`).join("")}</div>
   <div class="cutkey">${[...new Set(sps.map(x=>x.who))].map(w=>`<span style="--c:${esc(COLORS[w]||"var(--muted)")}"><i></i>${esc(title(w))}</span>`).join("")}<span class="kqk"><i></i>Key quote</span></div>
   <div class="cuts">${(()=>{const G=[];let g={h:"Opening",sp:[]};s.items.forEach(it=>{if(it.t==="sd"&&/\b(Enter|Exit|Exeunt|Re-enter)\b/i.test(it.text)&&g.sp.length){G.push(g);g={h:it.text,sp:[]}}else if(it.t==="sd"&&!g.sp.length&&g.h==="Opening")g.h=it.text;if(it.t==="sp")g.sp.push(it)});if(g.sp.length)G.push(g);
     return G.map((g,gi)=>{const ln=g.sp.reduce((a,x)=>a+x.lines.length,0),allc=g.sp.every(x=>C.cut[x.id]);return `<div class="cutg"><div class="cutgh"><b>Beat ${gi+1}</b><span>${esc(clip(g.h,60))}</span><small>${ln} line${ln===1?"":"s"}</small><button type="button" class="link" data-cutg="${g.sp.map(x=>x.id).join(",")}" data-on="${allc?0:1}">${allc?"Keep all":"Cut all"}</button></div>${g.sp.map(x=>`<button data-cut="${x.id}" class="${C.cut[x.id]?"cut":""}" aria-pressed="${!!C.cut[x.id]}"><small>${esc(title(x.who))} · ${x.lines.length} line${x.lines.length===1?"":"s"}${QBY[x.id]&&C.chk?" · key quote":""}</small><span>${esc(lineOf(x.lines[0]).slice(0,90))}${x.lines.length>1||lineOf(x.lines[0]).length>90?"…":""}</span></button>`).join("")}</div>`}).join("")})()}</div>
   <div class="row"><button class="btn primary" id="cut-chk">${C.chk?"Check again":"Check my cut"}</button><button class="btn" id="cut-reset">Start again</button></div>
   ${C.chk?`<div class="box"><h3>${pc<=50?"Within the target.":"Still over half: keep cutting."}</h3>${lost.length?`<p>You cut ${lost.length} speech${lost.length===1?"":"es"} the notes flag as important:</p><ul>${lost.map(x=>`<li>${esc(title(x.who))}: “${esc(lineOf(x.lines[0]).slice(0,70))}…”${QBY[x.id]?" (key quote)":EX.irony[x.id]?" (dramatic irony)":" (study note)"}</li>`).join("")}</ul>`:"<p>You kept every speech the notes flag as important.</p>"}
    ${(STUDY.scenes[s.id]||{}).key?`<p class="muted">Does your cut still tell these points?</p><ul>${STUDY.scenes[s.id].key.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}<p class="muted">There is no single right cut. What did you lose: plot, character, or atmosphere?</p></div>`:""}`}
function wireCut(){$("sbody").querySelectorAll("[data-cuts]").forEach(b=>b.onclick=()=>{dr.c={k:+b.dataset.cuts,cut:{},chk:false};studyDrill()});
  {const sel=$("sbody").querySelector('.cutsc [aria-pressed="true"]');if(sel){const r=sel.parentElement;r.scrollLeft=sel.offsetLeft-r.clientWidth/2+sel.offsetWidth/2}}
  $("sbody").querySelectorAll("[data-cutg]").forEach(b=>b.onclick=()=>{const on=b.dataset.on==="1";b.dataset.cutg.split(",").forEach(i=>{if(on)dr.c.cut[i]=1;else delete dr.c.cut[i]});const y=scrollY;studyDrill();scrollTo(0,y)});
  $("sbody").querySelectorAll("[data-cut]").forEach(b=>b.onclick=()=>{const i=b.dataset.cut;if(dr.c.cut[i])delete dr.c.cut[i];else dr.c.cut[i]=1;const y=scrollY;studyDrill();scrollTo(0,y)});
  const on=(id,f)=>{const el=$(id);if(el)el.onclick=f};on("cut-chk",()=>{dr.c.chk=true;studyDrill()});on("cut-reset",()=>{dr.c={k:dr.c.k,cut:{},chk:false};studyDrill()})}
function studyDrill(){
  const back=`<div class="exh"><button class="btn sm" data-drill="">‹ All drills</button><h2>${dr.k?esc((DRILLS.find(d=>d[0]===dr.k)||[,""])[1]):""}</h2></div>`;
  if(!dr.k||!DRILLS.some(d=>d[0]===dr.k)){dr={k:""};$("sbody").innerHTML=`<p class="intro">Short exercises for remembering quotes and understanding the language.</p><div class="drills">${DRILLS.map(([k,a,b])=>`<button data-drill="${k}">${tic("drill:"+k)}<b>${a}</b><span>${b}</span></button>`).join("")}</div>`;return}
  /* the rule, one line, on a card before the drill starts, with the best score so far */
  const D0=DRILLS.find(d=>d[0]===dr.k),B=drBest(dr.k);
  if(!dr.go){$("sbody").innerHTML=back+`<div class="rulec">${folioSeal("❦","g","rcs")}<div class="rct">${tic("drill:"+dr.k)}</div><h3>${esc(D0[1])}</h3><p>${esc(D0[2])}.</p><p class="rmeta">${dr.k==="sprint"?"60 seconds · mixed quote questions":DRN[dr.k]?`${DRN[dr.k]} items · about ${DMIN[dr.k]||3} min`:`about ${DMIN[dr.k]||3} min`}</p>${B?`<p class="rbest">${dr.k==="ladder"?`${B[0]} of ${B[1]} quotes word perfect`:dr.k==="sprint"?`Best ${B[0]} · played ${B[3]} time${B[3]===1?"":"s"}`:`Best ${B[0]} of ${B[1]} · played ${B[3]} time${B[3]===1?"":"s"}`}</p>`:""}<button class="btn primary" type="button" id="dr-go">Begin</button>${rulePrev()}</div>`;$("dr-go").onclick=()=>{dr.go=1;studyDrill();scrollTo(0,0)};return}
  if(dr.k==="ladder"){$("sbody").innerHTML=back+ladderHTML();wireLadder();return}
  if(dr.k==="cut"){$("sbody").innerHTML=back+cutHTML();wireCut();return}
  const D=DK[dr.k];if(!dr.R)drStart();const R=dr.R;
  if(!R.items.length){$("sbody").innerHTML=back+`<div class="empty46"><p>Nothing to practise here for this play.</p></div>`;return}
  if(R.i>=R.items.length){$("sbody").innerHTML=back+drEnd();$("dr-again").onclick=()=>{drStart();studyDrill();scrollTo(0,0)};return}
  const it=R.items[R.i],st=R.st,done=R.res[R.i]!=null,ok=R.res.filter(x=>x===true).length;
  if(dr.k==="sprint"){$("sbody").innerHTML=back+sprintFrame(R,ok)+D.view(it,st,done);sprintTick()}else $("sbody").innerHTML=back+pipFrame("",R.res,R.i,R.items.length,ok,R.streak,DRL[dr.k])+D.view(it,st,done);
  if(R.fx){const c=$("sbody").querySelector(".qz");if(c)c.classList.add("fx-"+R.fx);R.fx=null}
  if(dr.k==="sprint"&&done){const i0=R.i;setTimeout(()=>{if(dr.R===R&&R.i===i0&&dr.k==="sprint"&&R.i<R.items.length){R.i++;R.st={};studyDrill()}},650)}
  if(D.pick)$("sbody").querySelectorAll("[data-dpick]").forEach(b=>b.onclick=()=>{st.pick=b.dataset.dpick;drAns(D.pick(it,st.pick))});
  $("sbody").querySelectorAll("[data-dans]").forEach(b=>b.onclick=()=>drAns(b.dataset.dans==="1"));
  if($("dr-next"))$("dr-next").onclick=()=>{R.i++;R.st={};studyDrill();scrollTo(0,0)};
  if(!done&&D.wire)D.wire(it,st);
  else if(done&&D.wire&&dr.k==="stress")D.wire(it,st);
}
/* essay planner with exam questions, 45-minute timer and self-marking checklist */
let PLAN={};try{PLAN=JSON.parse(LS.get(PFX+"plan")||"{}")}catch(e){}
const savePlan=()=>LS.set(PFX+"plan",JSON.stringify(PLAN));
let tmr=null;
let plStep=null;const PLN=12;
function wizNav(attr,st,n,last){return `<div class="wnav noprint">${st>0?`<button class="btn" type="button" ${attr}="${st-1}">‹ Back</button>`:"<span></span>"}${st<n-1?`<button class="btn primary" type="button" ${attr}="${st+1}">${st===n-2?esc(last):"Next ›"}</button>`:""}</div>`}
const wizBar=(st,n,lab)=>`<div class="wiz-top"><div class="wseals" aria-hidden="true">${Array.from({length:n},(_,i)=>`<i class="${i<st?"d":i===st?"c":""}"></i>`).join("")}</div><small>Step ${st+1} of ${n}${lab?" · "+esc(lab):""}</small></div>`;
function studyPlan(){
  const qi=PLAN.cur??0,P=PLAN[qi]=PLAN[qi]||{th:"",pts:[{},{},{}],chk:{}},Q=EX.examq[qi],sug=Q[1];
  const qopt=i=>`<option value="">Choose a quote…</option>`+[...sug.map(j=>[j,true]),...QUOTES.quotes.map(q=>[q.i,false]).filter(x=>!sug.includes(x[0]))].map(([j,s])=>`<option value="${j}"${String(i)===String(j)?" selected":""}>${s?"★ ":""}${esc(QUOTES.quotes[j].text.slice(0,55))}</option>`).join("");
  const run=PLAN.t0&&Date.now()-PLAN.t0<45*6e4;if(plStep==null)plStep=planHas(P)?PLN-1:0;const st=Math.max(0,Math.min(PLN-1,plStep));
  const ev=pt=>pt.q!==undefined&&pt.q!==""&&QUOTES.quotes[pt.q]?QUOTES.quotes[pt.q]:null;
  let body="",lab="";
  if(st===0){lab="Question";body=`<label for="pl-q" class="wq">Which question?</label><select id="pl-q">${EX.examq.map((x,i)=>`<option value="${i}"${i===qi?" selected":""}>${esc(x[0])}</option>`).join("")}</select><p class="muted">The quotes that fit it best are starred in the evidence steps.</p>`}
  else if(st===1){lab="Argument";body=`<p class="wqq">${esc(Q[0])}</p><label for="pl-th" class="wq">Your argument in one sentence</label><textarea id="pl-th" data-pf="th" placeholder="Shakespeare presents … as …">${esc(P.th||"")}</textarea>`}
  else if(st<PLN-1){const i=Math.floor((st-2)/3),k=["p","q","a"][(st-2)%3],pt=P.pts[i];lab=`Point ${i+1}`;
    const prev=k!=="p"&&pt.p?`<p class="wqq">${esc(pt.p)}</p>`:`<p class="wqq">${esc(Q[0])}</p>`;
    if(k==="p")body=prev+`<label class="wq" for="pp">Point ${i+1}: your topic sentence</label><textarea id="pp" data-pp="${i}:p" placeholder="Topic sentence">${esc(pt.p||"")}</textarea>`;
    if(k==="q")body=prev+`<label class="wq" for="pp">Point ${i+1}: your evidence</label><select id="pp" data-pp="${i}:q">${qopt(pt.q)}</select>${ev(pt)?quoteHTML(ev(pt)):""}`;
    if(k==="a")body=prev+(ev(pt)?`<blockquote class="wquote">“${esc(ev(pt).text)}”</blockquote>`:"")+`<label class="wq" for="pp">Point ${i+1}: your analysis</label><textarea id="pp" data-pp="${i}:a" placeholder="Zoom in on a word or image. Link to context or another moment.">${esc(pt.a||"")}</textarea>`}
  else{lab="Your outline";const row=(n,l,v)=>`<button class="olr" type="button" data-plstep="${n}"><small>${l}</small><span>${v?esc(v):"<em>Not written yet</em>"}</span></button>`;
    body=`<div class="outline folp"><div class="olrh" aria-hidden="true"><span>${esc(CFG.short)}</span><span>Essay plan</span></div>${row(0,"Question",Q[0])}${row(1,"Argument",P.th)}${P.pts.map((pt,i)=>`<div class="olp"><h4>Point ${i+1}</h4>${row(2+i*3,"Point",pt.p)}${row(3+i*3,"Evidence",ev(pt)?"“"+ev(pt).text+"”":"")}${row(4+i*3,"Analysis",pt.a)}</div>`).join("")}</div>
     <div class="row noprint"><button class="btn primary" id="pl-copy">Copy outline</button><button class="btn" id="pl-dl">Download</button><button class="btn" id="pl-print">Print</button>${run?"":`<button class="btn" id="tm-go">Start 45-minute timed essay</button>`}</div>
     <details class="fold"><summary>Quote bank for this question</summary>${sug.map(j=>quoteHTML(QUOTES.quotes[j])).join("")}</details>
     <div class="box chk"><h3>Self-marking checklist</h3><p class="intro">After writing, tick what your answer does.</p>${EX.check.map((c,i)=>`<label><input type="checkbox" data-ck="${i}"${P.chk[i]?" checked":""}> ${esc(c)}</label>`).join("")}<p class="muted" id="ck-n">${Object.values(P.chk).filter(Boolean).length} of ${EX.check.length}</p></div><div class="box chk ao" id="aobox"></div>`}
  $("sbody").innerHTML=`${run?`<div class="timer"><span>Timed essay</span><b id="tm">45:00</b><button class="btn sm" id="tm-stop" style="color:var(--page);border-color:var(--page)">Stop</button></div>`:""}
   <div class="plan wiz"><p class="intro">Plan an answer to a typical exam question, one step at a time. Everything saves as you type; the whole outline appears at the end, ready to copy or print.</p>${wizBar(st,PLN,lab)}${body}${wizNav("data-plstep",st,PLN,"See your outline ›")}</div>`;
  if(st===PLN-1)aoMount(P,savePlan);
  if($("pl-q"))$("pl-q").onchange=e=>{PLAN.cur=+e.target.value;savePlan();plStep=0;studyPlan()};
  $("sbody").querySelectorAll("[data-pf]").forEach(el=>el.oninput=()=>{P.th=el.value;savePlan()});
  $("sbody").querySelectorAll("[data-pp]").forEach(el=>{const [i,f]=el.dataset.pp.split(":");const h=()=>{P.pts[i][f]=el.value;savePlan()};el.oninput=h;el.onchange=f==="q"?()=>{h();studyPlan()}:h});
  $("sbody").querySelectorAll("[data-ck]").forEach(el=>el.onchange=()=>{P.chk[el.dataset.ck]=el.checked;savePlan();$("ck-n").textContent=`${Object.values(P.chk).filter(Boolean).length} of ${EX.check.length}`});
  $("sbody").querySelectorAll("[data-plstep]").forEach(b=>b.onclick=()=>{plStep=+b.dataset.plstep;studyPlan();scrollTo(0,0);const t=$("sbody").querySelector(".wiz textarea,.wiz select");if(t&&!matchMedia("(pointer:coarse)").matches)t.focus({preventScroll:true})});
  const txt=()=>`ESSAY PLAN\n${Q[0]}\n\nArgument: ${P.th||""}\n`+P.pts.map((pt,i)=>`\nPoint ${i+1}: ${pt.p||""}\nEvidence: ${ev(pt)?`"${ev(pt).text}" (${title(speech[ev(pt).id].who)}, ${sName(sceneOf(ev(pt).id))})`:""}\nAnalysis: ${pt.a||""}\n`).join("");
  if($("pl-copy")){$("pl-copy").onclick=()=>copyText(txt());$("pl-dl").onclick=()=>download(CFG.file+"-essay-plan.txt",txt(),"text/plain");$("pl-print").onclick=()=>window.print()}
  if($("tm-go"))$("tm-go").onclick=()=>{PLAN.t0=Date.now();savePlan();studyPlan()};
  if($("tm-stop"))$("tm-stop").onclick=()=>{PLAN.t0=0;savePlan();clearInterval(tmr);studyPlan()};
  clearInterval(tmr);if(run){const tick=()=>{const left=45*6e4-(Date.now()-PLAN.t0),el=$("tm");if(!el){clearInterval(tmr);return}if(left<=0){clearInterval(tmr);el.textContent="Time!";toast("45 minutes are up");return}
    el.textContent=String(Math.floor(left/6e4)).padStart(2,"0")+":"+String(Math.floor(left%6e4/1e3)).padStart(2,"0")};tick();tmr=setInterval(tick,1000)}
}
/* ---------- exam writing: extract practice, paragraph builder, AO marking ---------- */
const AOSETS={g:[["AO1","Argument and evidence",12,["Answered the question in a clear opening sentence","Kept one argument going through the answer","Backed each point with a short, embedded quote","Ranged across the whole play, not just one scene"]],
  ["AO2","Language, form and structure",12,["Named a method: a word, image, device or structure","Zoomed in on a single word or image","Explained the effect on the audience","Used terms precisely and explored more than one meaning"]],
  ["AO3","Context",6,["Mentioned a relevant context","Tied the context to the point you were making","Considered an audience then and now"]],
  ["AO4","Accuracy",4,["Spelled names and terms correctly","Punctuated and paragraphed accurately","Used varied, precise vocabulary"]]],
 a:[["AO1","Argument and expression",7,["Answered the question with a clear thesis","Built a coherent argument across the answer","Wrote accurately in a critical style","Used literary terms precisely"]],
  ["AO2","Methods",6,["Analysed language closely","Analysed form or structure: verse, prose, scene order","Explored the effect on an audience"]],
  ["AO3","Contexts",6,["Brought in a relevant context","Explained how the context shapes meaning","Considered performance or how audiences have received the play"]],
  ["AO4","Connections",3,["Linked to another moment in the play","Compared with another text or with the genre"]],
  ["AO5","Interpretations",3,["Mentioned another reading or critic","Weighed the readings and gave your own view"]]]};
const AOLV={g:["Simple","Supported","Clear","Thoughtful","Thoughtful and developed","Convincing and critical"],a:["Basic","Straightforward","Relevant and clear","Coherent and developed","Perceptive and assured"]};
const AODRILL={AO1:["Plan an argument in the Essay planner","plan"],AO2:["Spot methods in Explore: Language devices","explore:devices"],AO3:["Read Explore: Context","explore:context"],AO4g:["Practise names and quotes with Flashcards","cards"],AO4a:["Compare moments in Explore: Contrasts","explore:contrast"],AO5:["Read other views in Explore: Critics","explore:critics"]};
const aoLevel=()=>LS.get("folio-level")==="a"?"a":"g";
function aoInner(o){const L=aoLevel(),set=AOSETS[L];if(!o.ao||o.ao.L!==L)o.ao={L};const a=o.ao;let tot=0,max=0,worst=null,wv=2,any=false;
  const rows=set.map(([k,n,w,cr])=>{const t=a[k]=a[k]||[],got=cr.filter((_,i)=>t[i]).length,sc=Math.round(got/cr.length*w);if(got)any=true;tot+=sc;max+=w;if(got/cr.length<wv){wv=got/cr.length;worst=k}
    return `<div class="aorow"><div class="aoh"><b>${k}</b><span>${n}</span><em>${sc} / ${w}</em></div>${cr.map((c,i)=>`<label><input type="checkbox" data-ao="${k}:${i}"${t[i]?" checked":""}> ${esc(c)}</label>`).join("")}</div>`}).join("");
  const lv=AOLV[L],band=Math.max(1,Math.ceil(tot/max*lv.length)),dk=worst==="AO4"?"AO4"+L:worst,dr=AODRILL[dk],[dt,dx]=dr||[],ok=dr&&(!dx.includes(":")||exHas(dx.split(":")[1]));
  return `<h3>Mark it: ${L==="a"?"A-level":"GCSE"} assessment objectives</h3><p class="intro">Tick only what your answer really does. Weights are a typical split; check your own exam board.${L==="g"?" Studying A-level? Switch in Settings.":""}</p>${rows}
   <div class="aoband">${any?`<b>${tot} / ${max}</b><span>Roughly ${L==="a"?"band":"level"} ${band} of ${lv.length}: ${lv[band-1]}</span>${wv<1&&ok?`<span>Weakest: ${worst}. Next: <button class="link" data-gotab="${dx}">${dt}</button></span>`:""}`:`<span>Tick what your answer does to see an estimate.</span>`}</div>`}
function aoMount(o,save){const el=$("aobox");if(!el)return;el.innerHTML=aoInner(o);el.querySelectorAll("[data-ao]").forEach(c=>c.onchange=()=>{const [k,i]=c.dataset.ao.split(":");o.ao[k][+i]=c.checked;save();aoMount(o,save)})}
const lc1=s=>s.charAt(0).toLowerCase()+s.slice(1);
const qAsk=q=>`“${esc(q.text)}” <small class="muted">${esc(title(speech[q.id].who))}, ${sName(sceneOf(q.id))}</small>`;

/* extract practice */
let XT={};try{XT=JSON.parse(LS.get(PFX+"xt")||"{}")}catch(e){}
const saveXT=()=>LS.set(PFX+"xt",JSON.stringify(XT));
let xsel="",xhint=false,xtmr=null;
const XTAGS=["Metaphor","Simile","Imagery","Personification","Repetition","Contrast","Question","Exclamation","Command","Pun","Irony","Short line","Rhyme","Prose"];
function xtBuild(qi){const Q=EX.examq[qi],M=(EX.models||[])[qi],q=QUOTES.quotes[M?M[0]:Q[1][0]],sp=speech[q.id],sps=sceneOf(q.id).items.filter(it=>it.t==="sp"),k=sps.indexOf(sp);
  const nm=t=>t.toLowerCase().replace(/[^a-z ]/g,"").replace(/\s+/g," ").trim(),w=nm(q.text).split(" ").slice(0,3).join(" ");
  let ql=sp.lines.findIndex(l=>nm(l).includes(w));if(ql<0)ql=0;
  const segs=[sp.lines.length>22?[sp,Math.max(0,ql-8),Math.min(sp.lines.length,Math.max(0,ql-8)+22)]:[sp,0,sp.lines.length]];
  let n=segs[0][2]-segs[0][1],b=k-1,f=k+1;
  while(n<16&&(b>=0||f<sps.length)){
    if(b>=0){if(n+sps[b].lines.length<=24){segs.unshift([sps[b],0,sps[b].lines.length]);n+=sps[b].lines.length;b--}else b=-1}
    if(n<16&&f<sps.length){if(n+sps[f].lines.length<=24){segs.push([sps[f],0,sps[f].lines.length]);n+=sps[f].lines.length;f++}else f=sps.length}}
  return {q,segs,ql,n}}
function studyExtract(){
  const qi=Math.min(XT.cur||0,EX.examq.length-1),Q=EX.examq[qi],X=xtBuild(qi),A=(XT.a=XT.a||{})[qi]=XT.a[qi]||{},W=XT.w=XT.w||{},Mk=(XT.m=XT.m||{})[qi]=XT.m[qi]||{};
  const ids=X.segs.map(s=>s[0].id),run=XT.t0&&Date.now()-XT.t0<15*6e4,tags=[...XTAGS,...Object.values(EX.devices||{})];
  const xbar=`<div class="xtbar"><small>Tag this line</small><div class="chips">${tags.map(t=>`<button class="chip" data-xtag="${esc(t)}" aria-pressed="${(A[xsel]||[]).includes(t)}">${esc(t)}</button>`).join("")}</div></div>`;
  const nt=Object.values(A).reduce((s,v)=>s+v.length,0);
  const lines=X.segs.map(([sp,a,z])=>`<div class="xsp"><div class="xwho" style="--c:${COLORS[sp.who]||"var(--ink)"}">${esc(title(sp.who))}</div>${sp.lines.slice(a,z).map((l,j0)=>{const j=a+j0,key=sp.id+":"+j,tg=A[key]||[];
    return `<button class="xl${xsel===key?" on":""}${sp.id===X.q.id&&j===X.ql?" key":""}" data-xl="${key}"><span>${esc(l)}</span>${tg.length?`<small>${tg.map(esc).join(" · ")}</small>`:""}</button>`+(xsel===key?xbar:"")}).join("")}</div>`).join("");
  const hints=ids.flatMap(id=>(EX.dev[id]||[]).map(d=>`<li><b>${esc((EX.devices||{})[d[0]]||d[0])}</b>: “${esc(d[2])}”. ${esc(d[1])}</li>`));
  const qk=QBY[X.q.id]||[],other=Q[1].map(i=>QUOTES.quotes[i]).filter(q=>!ids.includes(q.id));
  $("sbody").innerHTML=`${run?`<div class="timer"><span>Extract answer</span><b id="xtm">15:00</b><button class="btn sm" id="xt-stop" style="color:var(--page);border-color:var(--page)">Stop</button></div>`:""}
   <div class="plan"><p class="intro">Practise the extract question: read the passage, tag the methods you notice, then write about the extract and the play as a whole.</p>
   <label for="xt-q">Question</label><select id="xt-q">${EX.examq.map((x,i)=>`<option value="${i}"${i===qi?" selected":""}>${esc(x[0])}</option>`).join("")}</select>
   <div class="box xq"><p><b>Starting with this extract, ${esc(lc1(Q[0]))}</b></p><p>Write about:</p><ul><li>how Shakespeare presents this in the extract</li><li>how Shakespeare presents this in the play as a whole.</li></ul><small class="muted">${sName(sceneOf(X.q.id))} · ${X.n} lines · the key line is marked</small></div>
   <div class="xt">${lines}</div>
   <p class="muted" style="font-size:.875rem">${xsel?"Tap a tag under the line, or tap the line again to close.":"Tap a line to tag a method in it."} ${nt} tag${nt===1?"":"s"} so far.</p>
   <div class="row noprint">${hints.length?`<button class="btn" id="xt-hint">${xhint?"Hide":"Check against"} the app's notes</button>`:""}<button class="btn" id="xt-clear">Clear tags</button>${run?"":`<button class="btn" id="xt-go">Start 15-minute timer</button>`}</div>
   ${xhint&&hints.length?`<div class="box"><h3>Methods the notes point out</h3><ul>${hints.join("")}</ul></div>`:""}
   ${qk.length?`<div class="box"><h3>The key line</h3>${qk.map(quoteHTML).join("")}</div>`:""}
   ${other.length?`<div class="box"><h3>Elsewhere in the play</h3><p class="intro">For the "play as a whole" half, link the extract to one or two of these.</p>${other.map(quoteHTML).join("")}</div>`:""}
   <label for="xt-w">Your answer</label><textarea id="xt-w" style="min-height:180px" placeholder="In this extract Shakespeare presents … as …">${esc(W[qi]||"")}</textarea>
   <div class="row noprint"><button class="btn" id="xt-copy">Copy answer</button></div>
   <div class="box chk ao" id="aobox"></div></div>`;
  $("xt-q").onchange=e=>{XT.cur=+e.target.value;xsel="";xhint=false;saveXT();studyExtract()};
  $("sbody").querySelectorAll("[data-xl]").forEach(b=>b.onclick=()=>{xsel=xsel===b.dataset.xl?"":b.dataset.xl;const y=scrollY;studyExtract();scrollTo(0,y)});
  $("sbody").querySelectorAll("[data-xtag]").forEach(b=>b.onclick=()=>{const t=b.dataset.xtag,c=(A[xsel]||[]).slice(),i=c.indexOf(t);if(i<0)c.push(t);else c.splice(i,1);if(c.length)A[xsel]=c;else delete A[xsel];saveXT();const y=scrollY;studyExtract();scrollTo(0,y)});
  if($("xt-hint"))$("xt-hint").onclick=()=>{xhint=!xhint;const y=scrollY;studyExtract();scrollTo(0,y)};
  $("xt-clear").onclick=()=>{XT.a[qi]={};xsel="";saveXT();studyExtract()};
  $("xt-w").oninput=e=>{W[qi]=e.target.value;saveXT()};
  $("xt-copy").onclick=()=>copyText(`EXTRACT QUESTION\nStarting with this extract, ${lc1(Q[0])}\n\n${W[qi]||""}`);
  if($("xt-go"))$("xt-go").onclick=()=>{XT.t0=Date.now();saveXT();studyExtract()};
  if($("xt-stop"))$("xt-stop").onclick=()=>{XT.t0=0;saveXT();clearInterval(xtmr);studyExtract()};
  aoMount(Mk,saveXT);
  clearInterval(xtmr);if(run){const tick=()=>{const left=15*6e4-(Date.now()-XT.t0),el=$("xtm");if(!el){clearInterval(xtmr);return}if(left<=0){clearInterval(xtmr);el.textContent="Time!";toast("15 minutes are up");return}
    el.textContent=String(Math.floor(left/6e4)).padStart(2,"0")+":"+String(Math.floor(left%6e4/1e3)).padStart(2,"0")};tick();xtmr=setInterval(tick,1000)}
}

/* paragraph builder: model, faded, your own */
let PA={};try{PA=JSON.parse(LS.get(PFX+"para")||"{}")}catch(e){}
const savePA=()=>LS.set(PFX+"para",JSON.stringify(PA));
let paW=0;
const PSTEPS=[["p","Point","Answer the question in one sentence."],["e","Evidence","A short quote, built into your sentence."],["m","Method","Name the technique and the key word."],["f","Effect","What it makes the audience think or feel."],["c","Context","Why it mattered then, or matters now."],["a","Other reading","How else could it be read?"]];
function paraModel(M,q,hide){const v={p:M[1],m:M[2],f:M[3],c:M[4],a:M[5]};
  return PSTEPS.map(([k,l])=>`<div class="pl pl-${k}"><b>${l}</b>${k==="e"?`<p>${qAsk(q)}</p>`:hide&&hide.includes(k)?`<textarea data-paf="${k}" placeholder="Your ${l.toLowerCase()}…"></textarea>`:`<p>${esc(v[k])}</p>`}</div>`).join("")}
function studyPara(){
  const ms=EX.models||[];if(!ms.length){$("sbody").innerHTML=`<p class="intro">Model paragraphs are not available for this play yet.</p>`;return}
  const qi=Math.min(PA.cur||0,ms.length-1),Q=EX.examq[qi],M=ms[qi],step=PA.step||0,fi=(qi+1)%ms.length,FM=ms[fi],F=((PA.f=PA.f||{})[qi]=PA.f[qi]||{}),O=((PA.o=PA.o||{})[qi]=PA.o[qi]||{}),Mk=((PA.m=PA.m||{})[qi]=PA.m[qi]||{});
  const own=Q[1].filter(i=>i!==M[0]);if(O.q==null||!Q[1].includes(+O.q))O.q=own.length?own[0]:M[0];
  const stepT=["1. Read a model","2. Finish one","3. Write your own"];
  let body="";
  if(step===0)body=`<p class="intro">A strong analytical paragraph does six jobs. Read how this one does each, then try it yourself.</p>${paraModel(M,QUOTES.quotes[M[0]])}<div class="row"><button class="btn primary" data-pstep="1">Next: finish one</button></div>`;
  if(step===1)body=`<p class="intro">This paragraph answers <b>${esc(EX.examq[fi][0])}</b> Write the method and the effect, then compare.</p>${paraModel(FM,QUOTES.quotes[FM[0]],["m","f"])}
    <div class="row"><button class="btn" id="pa-cmp">${PA.cmp?"Hide":"Compare with"} the model</button><button class="btn primary" data-pstep="2">Next: write your own</button></div>
    ${PA.cmp?`<div class="box"><h3>Model method and effect</h3><p><b>Method:</b> ${esc(FM[2])}</p><p><b>Effect:</b> ${esc(FM[3])}</p><p class="muted">Yours doesn't need to match. Did you name a technique and say what it does to the audience?</p></div>`:""}`;
  const PW=[["q","Your quote","Pick a different quote from the model's."],...PSTEPS.filter(x=>x[0]!=="e")],pn=PW.length+1,pw=Math.max(0,Math.min(pn-1,paW));
  if(step===2){const q=QUOTES.quotes[+O.q];
    if(pw===0)body=`${wizBar(pw,pn,"Your quote")}<label for="pa-oq" class="wq">Your quote</label><select id="pa-oq">${Q[1].map(i=>`<option value="${i}"${+O.q===i?" selected":""}>${i===M[0]?"(model's) ":""}${esc(QUOTES.quotes[i].text.slice(0,60))}</option>`).join("")}</select>${quoteHTML(q)}`;
    else if(pw<pn-1){const [k,l,h]=PW[pw];body=`${wizBar(pw,pn,l)}<p class="wqq">${qAsk(q)}</p><div class="pl pl-${k}"><b>${l}</b><textarea data-pao="${k}" placeholder="${h}">${esc(O[k]||"")}</textarea></div>`}
    else body=`${wizBar(pw,pn,"Your paragraph")}<div class="outline">${PSTEPS.map(([k,l],i)=>`<button class="olr pl-${k}" type="button" data-pwz="${k==="e"?0:PW.findIndex(x=>x[0]===k)}"><small>${l}</small><span>${k==="e"?"“"+esc(q.text)+"”":O[k]?esc(O[k]):"<em>Not written yet</em>"}</span></button>`).join("")}</div>
      <div class="row noprint"><button class="btn primary" id="pa-copy">Copy paragraph</button></div><div class="box chk ao" id="aobox"></div>`;
    body=`<div class="wiz">${body}${wizNav("data-pwz",pw,pn,"See your paragraph ›")}</div>`}
  $("sbody").innerHTML=`<div class="plan"><label for="pa-q">Question</label><select id="pa-q">${EX.examq.map((x,i)=>`<option value="${i}"${i===qi?" selected":""}>${esc(x[0])}</option>`).join("")}</select>
    <div class="chips psteps" role="tablist">${stepT.map((t,i)=>`<button class="chip" data-pstep="${i}" aria-pressed="${i===step}">${t}</button>`).join("")}</div>${body}</div>`;
  $("pa-q").onchange=e=>{PA.cur=+e.target.value;PA.cmp=false;savePA();studyPara()};
  $("sbody").querySelectorAll("[data-pstep]").forEach(b=>b.onclick=()=>{PA.step=+b.dataset.pstep;PA.cmp=false;savePA();studyPara();scrollTo(0,0)});
  $("sbody").querySelectorAll("[data-paf]").forEach(t=>{const k=t.dataset.paf;t.value=F[k]||"";t.oninput=()=>{F[k]=t.value;savePA()}});
  if($("pa-cmp"))$("pa-cmp").onclick=()=>{PA.cmp=!PA.cmp;savePA();const y=scrollY;studyPara();scrollTo(0,y)};
  if($("pa-oq"))$("pa-oq").onchange=e=>{O.q=+e.target.value;savePA();studyPara()};
  $("sbody").querySelectorAll("[data-pao]").forEach(t=>t.oninput=()=>{O[t.dataset.pao]=t.value;savePA()});
  $("sbody").querySelectorAll("[data-pwz]").forEach(b=>b.onclick=()=>{paW=+b.dataset.pwz;studyPara();scrollTo(0,0)});
  if($("pa-copy"))$("pa-copy").onclick=()=>{const q=QUOTES.quotes[+O.q];copyText(`${Q[0]}\n\n`+[O.p,`"${q.text}"`,O.m,O.f,O.c,O.a].filter(Boolean).join(" "))};
  if(step===2&&pw===pn-1)aoMount(Mk,savePA);
}
/* character profiles */
let PROF={};try{PROF=JSON.parse(LS.get(PFX+"prof")||"{}")}catch(e){}
let profSel=CFG.profDefault;
let prStep=null;
function studyProf(){const P=PROF[profSel]=PROF[profSel]||{tr:["","",""],q:["","",""],sum:""},own=QUOTES.quotes.filter(q=>speech[q.id].who===profSel),c=CH[profSel];
  const qo=v=>`<option value="">Choose a quote…</option>`+[...own,...QUOTES.quotes.filter(q=>!own.includes(q))].map(q=>`<option value="${q.i}"${String(v)===String(q.i)?" selected":""}>${own.includes(q)?"★ ":""}${esc(q.text.slice(0,55))}</option>`).join("");
  const n=5;if(prStep==null)prStep=profStarted(profSel)?n-1:0;const st=Math.max(0,Math.min(n-1,prStep)),save=()=>LS.set(PFX+"prof",JSON.stringify(PROF)),qq=i=>P.q[i]!==""&&P.q[i]!=null&&QUOTES.quotes[P.q[i]]?QUOTES.quotes[P.q[i]]:null;
  let body="";
  if(st<3)body=`${wizBar(st,n,"Trait "+(st+1))}<label class="wq" for="pr-t">Trait ${st+1}: one word for them</label><input id="pr-t" data-pr="tr:${st}" value="${esc(P.tr[st]||"")}" placeholder="e.g. trusting, proud, cunning"><label class="wq" for="pr-q">A quote that shows it</label><select id="pr-q" data-pr="q:${st}">${qo(P.q[st])}</select>${qq(st)?quoteHTML(qq(st)):""}`;
  else if(st===3)body=`${wizBar(st,n,"Change")}<label class="wq" for="pr-sum">How do they change across the play?</label><textarea id="pr-sum" data-pr="sum">${esc(P.sum||"")}</textarea>`;
  else body=`${wizBar(st,n,"Profile")}<div class="outline">${[0,1,2].map(i=>`<button class="olr" type="button" data-prstep="${i}"><small>Trait ${i+1}</small><span>${P.tr[i]?`<b>${esc(P.tr[i])}</b>`:"<em>Not written yet</em>"}${qq(i)?`<br>“${esc(qq(i).text)}”`:""}</span></button>`).join("")}<button class="olr" type="button" data-prstep="3"><small>Change</small><span>${P.sum?esc(P.sum):"<em>Not written yet</em>"}</span></button></div>
    <div class="row noprint"><button class="btn primary" id="pr-copy">Copy all profiles</button></div>`;
  $("sbody").innerHTML=`<div class="plan wiz"><p class="intro">Build a profile for each character: three traits, each backed by a quote, then how they change. ★ quotes are spoken by them.</p>
   <div class="wstrip noprint" role="group" aria-label="Character">${MAINS.map(w=>`<button type="button" data-prof="${esc(w)}" aria-pressed="${w===profSel}">${folioMedal(w,COLORS[w])}<small>${esc(title(w))}</small></button>`).join("")}</div>
   ${c?`<p class="wdesc"><i>${esc(c.desc)}</i></p>`:""}${body}${wizNav("data-prstep",st,n,"See the profile ›")}</div>`;
  $("sbody").querySelectorAll("[data-pr]").forEach(el=>{const [f,i]=el.dataset.pr.split(":"),h=()=>{if(f==="sum")P.sum=el.value;else P[f][i]=el.value;save()};el.oninput=h;el.onchange=f==="q"?()=>{h();studyProf()}:h});
  $("sbody").querySelectorAll("[data-prof]").forEach(b=>b.onclick=()=>{profSel=b.dataset.prof;prStep=null;studyProf()});
  $("sbody").querySelectorAll("[data-prstep]").forEach(b=>b.onclick=()=>{prStep=+b.dataset.prstep;studyProf();scrollTo(0,0)});
  if($("pr-copy"))$("pr-copy").onclick=()=>copyText(Object.entries(PROF).map(([w,p])=>`${title(w).toUpperCase()}\n`+p.tr.map((x,i)=>x||p.q[i]!==""?`- ${x}${p.q[i]!==""&&p.q[i]!=null?`: "${QUOTES.quotes[p.q[i]].text}"`:""}`:"").filter(Boolean).join("\n")+(p.sum?`\nChange: ${p.sum}`:"")).join("\n\n"));
}
/* act summaries (4.15 "Act at a glance"): one act per screen under a sticky act ribbon; each scene = slim header (woodcut thumb,
   seal, cast medallions), lead line + numbered timeline (sumSents() splits the summary's own sentences, wording unchanged),
   "Why it matters" notes (key points), the scene's key quotes as evidence rows. Outline = lead lines only (folio-actview).
   Print shows every act. */
function actText(a){return `${AN(a).toUpperCase()}\n`+scenes.filter(p=>p.act===a).map(p=>{const s=STUDY.scenes[p.id]||{};return `\n${sName(p)} (${shortLoc(p)})\n${s.sum||""}\n`+(s.key||[]).map(k=>`  - ${k}`).join("\n")}).join("\n")+`\n\nKey quotes:\n`+QUOTES.quotes.filter(q=>sceneOf(q.id).act===a).map(q=>`  "${q.text}" (${title(speech[q.id].who)})`).join("\n")}
/* the summary's own sentences; never splits inside a quotation or after Mr./St. (join(" ") gives the text back) */
function sumSents(t){const out=[];let d=0,s=0,dq=0;t=t||"";
  for(let i=0;i<t.length;i++){const c=t[i],pv=t[i-1]||" ",nx=t[i+1]||" ";
    if(c==="“")dq++;else if(c==="”")dq=Math.max(0,dq-1);else if(c==='"')dq=dq?0:1;
    else if((c==="'"||c==="‘")&&/[\s(—–]/.test(pv)&&/\S/.test(nx))d++;
    else if((c==="'"||c==="’")&&d&&/[\s.,;:!?)—–]/.test(nx)&&!/\s/.test(pv))d--;
    if(/[.!?]/.test(c)&&!d&&!dq){let j=i+1;while(/['’"”)]/.test(t[j]||""))j++;
      if(/\s/.test(t[j]||"")&&/[A-Z‘'"“(]/.test(t[j+1]||"")&&!/\b(Mr|Mrs|Dr|St|Mt|Ld|i\.e|e\.g)\.$/.test(t.slice(s,i+1))){out.push(t.slice(s,j).trim());s=j+1;i=j}}}
  if(s<t.length)out.push(t.slice(s).trim());return out.filter(Boolean)}
let AV=LS.get("folio-actview")==="outline"?"outline":"full",acSel=null;
const actsOf=()=>ACTS.filter(a=>scenes.some(p=>p.act===a));
const actRead=a=>{const ps=scenes.filter(p=>p.act===a);return [ps.filter(p=>prog.done[p.id]).length,ps.length]};
function scSeal(p,cls){const o=prog.qst[p.id]||{};return prog.done[p.id]?folioSeal(p.scene,o.g?"g":"",cls):folioSeal(p.scene,"e",cls)}
function castRow(p){const ws=onStageWho(p),n=6,sh=ws.slice(0,n);
  return `<div class="cast50" aria-label="On stage: ${esc(ws.map(title).join(", "))}">${sh.map(w=>`<span class="cm50" title="${esc(title(w))}">${folioMedal(w,COLORS[w])}</span>`).join("")}${ws.length>n?`<span class="cmore">+${ws.length-n}</span>`:""}</div>`}
function scene50(p){const s=STUDY.scenes[p.id]||{},ss=sumSents(s.sum),kq=QUOTES.quotes.filter(q=>speech[q.id].page===p.id),key=s.key||[];
  const head=`<header class="sch50"><div class="sth50" aria-hidden="true">${woodcut(p)}</div><div class="sci50"><h3>${sName(p)}</h3><small>${esc(shortLoc(p))}</small>${castRow(p)}</div>${scSeal(p,"scs50")}</header>`;
  if(AV==="outline")return `<article class="sc50 ol50" id="sc-${p.id}"><header class="sch50">${scSeal(p,"scs50")}<div class="sci50"><h3>${sName(p)}</h3><small>${esc(shortLoc(p))}</small></div></header>${ss[0]?`<p class="lead50">${rich(ss[0])}</p>`:""}<button class="golink noprint" type="button" data-acfull="${p.id}">${ss.length>1?`${ss.length-1} more step${ss.length>2?"s":""}`:"Open"}${key.length?` · ${key.length} note${key.length>1?"s":""}`:""} <span aria-hidden="true">›</span></button></article>`;
  return `<article class="sc50" id="sc-${p.id}">${head}<div class="scg50"><div class="scm50">${ss[0]?`<p class="lead50">${rich(ss[0])}</p>`:""}${ss.length>1?`<ol class="tl50">${ss.slice(1).map((x,i)=>`<li><span class="tn50" aria-hidden="true">${i+1}</span><span>${rich(x)}</span></li>`).join("")}</ol>`:""}</div>
   ${key.length?`<aside class="why50"><h4>Why it matters</h4><ul>${key.map(k=>`<li>${rich(k)}</li>`).join("")}</ul></aside>`:""}</div>
   ${kq.length?evHTML(kq.map(q=>q.id),"Key quotes"):""}
   <div class="xrow noprint"><button class="golink" type="button" data-go2="${p.id}">Read the scene <span aria-hidden="true">›</span></button>${s.quiz?`<button class="golink" type="button" data-quiz2="${p.id}">Quiz <span aria-hidden="true">›</span></button>`:""}</div></article>`}
function studyActs(){const AS=actsOf();if(acSel==null||!AS.includes(acSel)){const ps=pos&&sIdx(pos.s)>=0?scenes[sIdx(pos.s)].act:AS[0];acSel=AS.includes(ps)?ps:AS[0]}
  const rib=`<nav class="acrib50 noprint" aria-label="Acts">${AS.map(a=>{const [r,n]=actRead(a);return `<button type="button" data-actj="${a}" aria-pressed="${a===acSel}" aria-label="${AN(a)}, ${r} of ${n} scenes read"><b>${a?R[a]:"Ind"}</b><i style="--f:${n?r/n:0}"></i></button>`}).join("")}</nav>`;
  const bar=`<div class="acbar50 noprint"><div class="dview" role="group" aria-label="Show as"><button type="button" data-av="full" aria-pressed="${AV==="full"}">Full</button><button type="button" data-av="outline" aria-pressed="${AV==="outline"}">Outline</button></div>${navigator.share?`<button class="btn sm" id="as-share" type="button" title="Send all act summaries as text: Notes, Mail, Copy, Print">Share</button>`:`<button class="btn sm" id="as-copy" type="button" title="Copy all act summaries as plain text">Copy all</button>`}${canPrint()?`<button class="btn sm" id="as-print" type="button" title="Print every act">Print</button>`:""}</div>`;
  $("sbody").innerHTML=`<p class="intro noprint">Each scene in brief: its gist, then the story step by step. Below come why it matters and its key quotes; tap a quote or a quoted phrase to see it in the play. Outline shows only the gist of each scene.</p>${rib}${bar}`+
  AS.map((a,i)=>{const ps=scenes.filter(p=>p.act===a),[r,n]=actRead(a),nx=AS[i+1],pv=AS[i-1];
    return `<section class="act50${a===acSel?"":" off"}${AV==="outline"?" isol":""}" id="act-${a}"><header class="ach50"><span class="acl50">${LAT[a]}</span><h2>${AN(a)}</h2><small>${n} scene${n>1?"s":""} · ${r} read</small></header>
     <ol class="acst50 noprint" aria-label="Scenes of ${AN(a)}">${ps.map(p=>`<li><button type="button" data-acs="${p.id}" aria-label="${esc(sName(p)+", "+shortLoc(p))}" title="${esc(shortLoc(p))}">${scSeal(p,"ass50")}<span class="asn50">${p.scene.toLowerCase()}</span><small>${esc(shortLoc(p))}</small><i class="sky50 ${skyOf(p)}" aria-hidden="true"></i></button></li>`).join("")}</ol>
     ${ps.map(scene50).join("")}
     <nav class="acnx50 noprint">${pv!=null?`<button class="btn" type="button" data-actj="${pv}"><span aria-hidden="true">‹ </span>${AN(pv)}</button>`:"<span></span>"}${nx!=null?`<button class="btn primary" type="button" data-actj="${nx}">Next: ${AN(nx)} <span aria-hidden="true">›</span></button>`:""}</nav></section>`}).join("");
  const g=document.querySelector("#study .sgroups");$("sbody").style.setProperty("--sgh",(g?g.offsetHeight:0)+"px");
  const txt=()=>`${CFG.short}: act summaries\n\n`+AS.map(actText).join("\n\n");
  if($("as-print"))$("as-print").onclick=()=>window.print();if($("as-copy"))$("as-copy").onclick=()=>copyText(txt());
  if($("as-share"))$("as-share").onclick=()=>shareText(CFG.short+": act summaries",txt())}
function acScroll(id,smooth){const el=$("sc-"+id);if(!el)return;const sb=$("sbody");if(sb.classList.contains("sin")&&sb.getAnimations&&sb.getAnimations().length){sb.addEventListener("animationend",()=>acScroll(id,smooth),{once:true});return}const g=document.querySelector("#study .sgroups"),r=document.querySelector("#sbody .acrib50"),h=(g?g.offsetHeight:0)+(r?r.offsetHeight:0)+8;
  scrollTo({top:el.getBoundingClientRect().top+scrollY-h,behavior:smooth&&!matchMedia("(prefers-reduced-motion: reduce)").matches?"smooth":"auto"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1600)}
function actGo(a){acSel=a;studyActs();const r=document.querySelector("#sbody .acrib50");if(r){const y=r.getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle($("sbody")).getPropertyValue("--sgh"))||0);if(scrollY>y)scrollTo(0,y)}}
/* ---------- spaced practice: one scheduler for flashcards and Daily review ----------
   Keys: "who:<quote>" (stored in prog.srs[<quote>], the original flashcards), "fin:<quote>" finish the quote,
   "th:<quote>" pick its theme, "act:<quote>" which act, "qz:<scene>:<n>" a scene-quiz question (scenes you have read).
   Entries {b: box 0-5, d: due time, k: days answered right, ld: last day right}. A quote counts as learnt
   once you have known it on 3 different days (successive relearning); intervals shrink as the exam date nears. */
let REV={it:{},cal:[]};try{const r=JSON.parse(LS.get(PFX+"rev")||"{}");if(r&&typeof r==="object"){if(r.it&&typeof r.it==="object"&&!Array.isArray(r.it))REV.it=r.it;if(Array.isArray(r.cal))REV.cal=r.cal.filter(Array.isArray).slice(-20)}}catch(e){}
for(const k in REV.it){const s=REV.it[k];if(!s||typeof s!=="object"||!isFinite(s.d))delete REV.it[k]}
const saveRev=()=>LS.set(PFX+"rev",JSON.stringify(REV));
prog.miss.s=prog.miss.s&&typeof prog.miss.s==="object"?prog.miss.s:{};
const INT=[0,1,3,7,14,30];
const examLeft=()=>{if(!prog.exam)return 0;const d=Math.ceil((new Date(prog.exam+"T09:00")-Date.now())/864e5);return d>0?d:0};
const ivDays=b=>{let iv=INT[b];const L=examLeft();if(L>2)iv=Math.min(iv,Math.max(1,Math.round(L*.3)));return iv};
const kq=k=>QUOTES.quotes[+k.split(":")[1]];
function getS(k){if(k.startsWith("who:"))return prog.srs[k.slice(4)];return REV.it[k]}
function setS(k,s){if(k.startsWith("who:"))prog.srs[k.slice(4)]=s;else REV.it[k]=s}
function grade(k,ok,sure){const s=Object.assign({b:0,d:0,k:0},getS(k)||{}),t=today();
  if(ok){s.b=Math.min(5,s.b+1);if(s.ld!==t){s.k=(s.k||0)+1;s.ld=t}s.d=Date.now()+ivDays(s.b)*864e5-36e5}else{s.b=0;s.d=Date.now()}
  setS(k,s);
  if(k.startsWith("who:")){const i=k.slice(4);if(ok){if(s.k>=3||s.b>=5)prog.cards[i]=prog.cards[i]||Date.now();if(prog.miss.c[i])prog.miss.c[i]=0}
    else{delete prog.cards[i];prog.miss.c[i]=(prog.miss.c[i]||0)+1}}
  if(!ok&&sure)prog.miss.s[k]=(prog.miss.s[k]||0)+1;else if(ok&&prog.miss.s[k])delete prog.miss.s[k];
  if(k.startsWith("qz:")){const q=kQuiz(k),M=prog.miss.q,ix=q?M.findIndex(m=>m.q===q.q):-1;if(q){if(ok&&ix>=0)M.splice(ix,1);else if(!ok&&ix<0)M.push({q:q.q,o:q.o,a:q.a,s:k.split(":")[1]})}}
  saveProg();saveRev()}
function kQuiz(k){const [,sid,n]=k.split(":");const q=((STUDY.scenes[sid]||{}).quiz||[])[+n];return q?Object.assign({s:sid},q):null}
const isDue=k=>{const s=getS(k);return s&&s.d<=Date.now()};
const validKey=k=>k.startsWith("qz:")?!!kQuiz(k):k.startsWith("pt:")?!!(speech[k.split(":")[1]]&&partsOf(speech[k.split(":")[1]])[+k.split(":")[2]]):!!kq(k);
const allScheduled=()=>[...Object.keys(prog.srs).filter(i=>QUOTES.quotes[i]).map(i=>"who:"+i),...Object.keys(REV.it).filter(validKey)];
const dueKeys=()=>allScheduled().filter(isDue);
const dueList=()=>QUOTES.quotes.map(q=>q.i).filter(i=>{const s=prog.srs[i];return !s||s.d<=Date.now()});
const firstWords=t=>{const w=t.split(/\s+/),n=Math.max(2,Math.min(5,Math.ceil(w.length/3)));return {a:w.slice(0,n).join(" "),b:w.slice(n).join(" ")}};

/* one practice item, drawn the same way in Flashcards and Daily review. it={k,stage:"ask"|"shown",sure,pick} */
/* a card turns over (3D flip) the first time its answer shows */
function itemHTML(it){let h=itemHTML0(it);if(it.stage==="shown"&&!it.fl){it.fl=1;h=h.replace(/^<div class="card"/,'<div class="card flipin"')}return h}
function itemHTML0(it){const k=it.k,ty=k.split(":")[0];
  if(ty==="qz"){const q=it.q||(it.q=(()=>{const x=kQuiz(k),ix=shuf(x.o.map((_,i)=>i));return Object.assign({},x,{o:ix.map(i=>x.o[i]),a:ix.indexOf(x.a)})})());
    return `<div class="qz"><div class="qn">Quiz · ${sName(scenes[sIdx(q.s)])}</div><h3>${esc(q.q)}</h3><div class="opts">${q.o.map((o,i)=>`<button data-pick="${i}"${it.stage==="shown"?" disabled":""} class="${it.stage==="shown"?(i===q.a?"right":i===it.pick?"wrong":""):""}">${esc(o)}</button>`).join("")}</div></div>`}
  if(ty==="pt"){const [,id,pi]=k.split(":"),sp=speech[id],ps=partsOf(sp),q=ps[+pi],p=sceneOf(id),cue=+pi>0?{txt:partLines(sp,ps[pi-1]).join(" ").split(/\s+/).slice(-3).join(" ")}:cueOf(p,+id);
    return `<div class="card" style="--c:${COLORS[sp.who]||"var(--ink)"}"><p class="qn">Learn a part · ${esc(title(sp.who))} · ${sName(p)}</p><p class="muted">${cue?`Cue: <b>… ${esc(cue.txt)}</b>`:"You speak first"}</p>${it.stage==="shown"?`<div class="ptxt">${partLines(sp,q).map(l=>`<span>${esc(l)}</span>`).join("")}</div>`:`<p>Say your line aloud.</p>`}</div>`}
  const q=kq(k),sp=speech[q.id],p=sceneOf(q.id),c=COLORS[sp.who]||"var(--ink)";
  const j=kqj(q.id),pr=partsOf(sp).find(([a,b])=>j>=a&&j<=b)||[0,0,sp.m];
  const ans=`<div class="ans">${folioMedal(sp.who,COLORS[sp.who],"cmed")}<b>${esc(title(sp.who))}</b><span>${sName(p)} · ${esc(shortLoc(p))}</span><div class="cmod"><small>In modern English</small><p>${esc(clip(pr[2]||sp.m,220))}</p></div><p>${esc(q.note)}</p></div>`;
  if(ty==="who")return `<div class="card" style="--c:${c}">${it.stage==="shown"?"":`<span class="cmyst" aria-hidden="true">?</span>`}<p class="qn">Who said it, and when?</p><blockquote>“${esc(q.text)}”</blockquote>${it.stage==="shown"?ans:""}</div>`;
  if(ty==="fin"){const f=firstWords(q.text);return `<div class="card" style="--c:${c}">${it.stage==="shown"?"":folioMedal(sp.who,COLORS[sp.who],"cmed")}<p class="qn">Finish the quote · ${esc(title(sp.who))}</p><blockquote>“${esc(f.a)} ${it.stage==="shown"?`<span class="fin">${esc(f.b)}</span>”`:"…”"}</blockquote>${it.stage==="shown"?ans:""}</div>`}
  if(ty==="th"){const o=it.o||(it.o=shuf([rnd(q.themes),...shuf(Object.keys(QUOTES.themes).filter(t=>!q.themes.includes(t))).slice(0,3)]));
    return `<div class="qz"><div class="qn">Which theme is this quote about?</div><h3 style="font:400 1.3rem/1.45 var(--f-old)">“${esc(q.text)}”</h3><div class="opts">${o.map(t=>`<button data-pick="${t}"${it.stage==="shown"?" disabled":""} class="${it.stage==="shown"?(q.themes.includes(t)?"right":t===it.pick?"wrong":""):""}">${esc(QUOTES.themes[t][0])}</button>`).join("")}</div>${it.stage==="shown"?`<p class="muted">${esc(title(sp.who))}, ${sName(p)}. Themes: ${q.themes.map(t=>esc(QUOTES.themes[t][0])).join(", ")}.</p>`:""}</div>`}
  if(ty==="act"){const a=p.act;return `<div class="qz"><div class="qn">Which act is this from?</div><h3 style="font:400 1.3rem/1.45 var(--f-old)">“${esc(q.text)}”</h3><div class="opts acts5">${ACTS.map(n=>`<button data-pick="${n}"${it.stage==="shown"?" disabled":""} class="${it.stage==="shown"?(n===a?"right":n===+it.pick?"wrong":""):""}">${AN(n)}</button>`).join("")}</div>${it.stage==="shown"?`<p class="muted">${esc(title(sp.who))}, ${sName(p)}.</p>`:""}</div>`}
  return ""}
/* self-graded items (who, fin) ask for confidence first; picked items grade themselves */
const selfGraded=k=>/^(who|fin|pt):/.test(k);
function itemButtons(it){if(!selfGraded(it.k))return it.stage==="shown"?`<button class="btn primary" data-it="next">Next</button>${it.k.startsWith("qz:")?(it.q?`<button class="link" data-go2="${it.q.s}">Read the scene</button>`:""):`${chip(kq(it.k).id)}`}`:"";
  if(it.stage==="ask")return `<button class="btn primary" data-it="sure">I'm sure · turn</button><button class="btn" data-it="unsure">Not sure · turn</button>`;
  return `<button class="btn" data-it="no">Not yet</button><button class="btn primary" data-it="yes">I knew it</button>${it.k.startsWith("qz:")?"":`${chip(it.k.startsWith("pt:")?it.k.split(":")[1]:kq(it.k).id)}`}`}
function pickOk(it,v){const ty=it.k.split(":")[0];if(ty==="qz")return +v===it.q.a;const q=kq(it.k);if(ty==="th")return q.themes.includes(v);if(ty==="act")return +v===sceneOf(q.id).act;return false}

/* flashcards: two directions, quotes not yet learnt come first, shuffled */
let deck=null,cardIt=null,cdir=LS.get(PFX+"cdir")==="fin"?"fin":"who";
function newDeck(){const pre=cdir+":",due=QUOTES.quotes.map(q=>pre+q.i).filter(k=>{const s=getS(k);return !s||s.d<=Date.now()});
  deck=[...shuf(due.filter(k=>getS(k))),...shuf(due.filter(k=>!getS(k))).slice(0,12)];cardIt=null}
function studyCards(){
  if(!deck||!deck.length||!deck[0].startsWith(cdir+":"))newDeck();
  const dirs=`<div class="chips cdir" role="group" aria-label="Card type">${[["who","Who said it?"],["fin","Finish the quote"]].map(([k,l])=>`<button class="chip" data-cdir="${k}" aria-pressed="${cdir===k}">${l}</button>`).join("")}</div>`;
  const known=Object.keys(prog.cards).length;
  if(!deck.length){const nx=Math.min(...QUOTES.quotes.map(q=>(getS(cdir+":"+q.i)||{}).d).filter(isFinite));
    $("sbody").innerHTML=`${dirs}<p class="intro">Nothing due right now. Well done.</p><div class="card"><blockquote>All caught up</blockquote><p class="muted">Next card due ${isFinite(nx)?new Date(nx).toLocaleDateString():"soon"}.</p></div><div class="cardbtns"><button class="btn" id="c-extra">Practise anyway</button></div>`;
    $("c-extra").onclick=()=>{deck=shuf(QUOTES.quotes.map(q=>cdir+":"+q.i)).slice(0,10);cardIt=null;studyCards()};return}
  if(!cardIt||cardIt.k!==deck[0])cardIt={k:deck[0],stage:"ask"};
  const s=getS(cardIt.k),L=examLeft();
  $("sbody").innerHTML=`${dirs}<p class="intro">${cdir==="who"?"Who said it, and when?":"Say the rest of the quote, aloud if you can."} Decide how sure you are, then turn the card.</p>
   <div class="cstack s${Math.max(0,Math.min(3,deck.length-1))}">${itemHTML(cardIt)}</div><div class="cardbtns">${itemButtons(cardIt)}</div>
   <div class="deck19">${(()=>{const N=QUOTES.quotes.length,c={l:0,m:0,d:0,n:0};QUOTES.quotes.forEach(q=>{const x=getS(cdir+":"+q.i);c[!x?"n":x.d<=Date.now()?"d":prog.cards[q.i]?"l":"m"]++});const lr=c.l,mid=c.m,due=c.d,nw=c.n;
     return `<div class="dbar" role="img" aria-label="${lr} learnt, ${due} due, ${nw} new of ${N}"><i class="l" style="flex-grow:${lr}"></i><i class="m" style="flex-grow:${mid}"></i><i class="d" style="flex-grow:${due}"></i><i class="n" style="flex-grow:${nw}"></i></div><div class="dkey"><span class="l"><i></i>${lr} learnt</span><span class="m"><i></i>${mid} learning</span><span class="d"><i></i>${due} due</span><span class="n"><i></i>${nw} new</span></div>`})()}
    <p class="dnow">${deck.length} left in this round${s?` · this card: box ${esc(s.b)} of 5 · right on ${esc(s.k||0)} of 3 days`:" · this card is new"} · <button class="link" id="c-reset">Start over</button></p></div>
   <details class="fold"><summary>How cards come back</summary><p class="muted">A quote is learnt once you know it on 3 different days. Cards you know come back after 1, 3, 7, 14, then 30 days${L>2?`, sooner as your exam gets close (${L} days left)`:""}. Cards you miss come back today.</p></details>`;
  let armed=false;$("c-reset").onclick=e=>{if(!armed){armed=true;e.target.textContent="Tap again to reset all cards";return}prog.cards={};prog.srs={};Object.keys(REV.it).forEach(k=>{if(/^(fin|th|act):/.test(k))delete REV.it[k]});saveProg();saveRev();newDeck();studyCards()};
}
function cardAct(a){const it=cardIt;if(!it)return;
  if(a==="sure"||a==="unsure"){it.sure=a==="sure";it.stage="shown";studyCards();return}
  if(a==="yes"||a==="no"){grade(it.k,a==="yes",it.sure);if(a==="yes")deck.shift();else deck.push(deck.shift());cardIt=null;if(!deck.length)toast("Round finished");studyCards()}}

/* ---------- Learn a part: cue scripts ----------
   Shakespeare's actors learned from a "part": only their own lines, each with a cue of the last few words
   spoken before it. Here you see the cue, say your lines aloud, then check, one whole-thought part at a time.
   Hints go from meaning (modern English) to first letters to the full text. Parts you miss join Daily review. */
const cueOf=(p,id)=>{const its=p.items,i=its.findIndex(x=>x.id===id);for(let j=i-1;j>=0;j--)if(its[j].t==="sp"){const w=its[j].lines.join(" ").replace(/~/g,"").replace(/\[[^\]]*\]/g,"").trim().split(/\s+/);return {who:its[j].who,txt:w.slice(-3).join(" ")}}return null};
const partLines=(sp,q)=>sp.lines.slice(q[0],q[1]+1).map(l=>l.replace(/^~/,""));
const firstLet=l=>l.split(/\s+/).map(w=>w.replace(/([A-Za-z])[A-Za-z']*/,"$1")).join(" ");
REV.pp=REV.pp&&typeof REV.pp==="object"&&!Array.isArray(REV.pp)?REV.pp:{};
let pt={who:"",sid:"",showWho:LS.get(PFX+"ptwho")==="1"};
function partScenes(who){return scenes.filter(p=>p.items.some(x=>x.t==="sp"&&x.who===who))}
function studyPart(){
  if(!pt.who){const cast=MAINS.filter(w=>partScenes(w).length);
    $("sbody").innerHTML=`<p class="intro">Learn lines the way Shakespeare's actors did. A cue script shows only your character's lines and the last few words before each one. You hear the cue, say your lines aloud, then check. Saying lines aloud, and thinking about what you want, helps them stick.</p>
     <div class="lbl">Choose a part</div><div class="pcast19">${cast.map(w=>{const n=Object.values(speech).filter(s=>s.who===w).length,sc=partScenes(w),ok=sc.filter(p=>{const b=REV.pp[w+"|"+p.id];return b&&b[0]===b[1]}).length,tr=sc.filter(p=>REV.pp[w+"|"+p.id]).length;
      return `<button type="button" data-ptwho="${esc(w)}" style="--c:${esc(COLORS[w]||"var(--ink)")}">${hring(ok/sc.length,folioMedal(w,COLORS[w],"pcm"))}<b>${esc(title(w))}</b><small>${n} speeches · ${sc.length} scenes</small><small class="pst">${ok?`${ok} word perfect`:tr?`${tr} tried`:"Not started"}</small></button>`}).join("")}</div>`;return}
  const back=`<div class="exh"><button class="btn sm" data-ptback="${pt.sid?"scene":"who"}">‹ ${pt.sid?"Scenes":"All parts"}</button><h2>${esc(title(pt.who))}</h2></div>`;
  if(!pt.sid){const sc=partScenes(pt.who);
    $("sbody").innerHTML=back+`<p class="intro">Pick a scene. Your best score for each is kept.</p><div class="qlist">${sc.map(p=>{const n=p.items.filter(x=>x.t==="sp"&&x.who===pt.who).length,b=REV.pp[pt.who+"|"+p.id];return `<button class="${b&&b[0]===b[1]?"done":""}" data-ptsid="${p.id}"><b>${sName(p)}</b><span>${n} speech${n===1?"":"es"}${b?` · best ${esc(b[0])} of ${esc(b[1])}`:""}</span></button>`}).join("")}</div>
     <label class="ptsw"><input type="checkbox" id="pt-sw"${pt.showWho?" checked":""}> Show who gives each cue <small class="muted">(original cue scripts didn't)</small></label>`;
    $("pt-sw").onchange=e=>{pt.showWho=e.target.checked;LS.set(PFX+"ptwho",pt.showWho?"1":"0")};return}
  const p=scenes[sIdx(pt.sid)];
  if(!pt.run){const steps=[];p.items.forEach(x=>{if(x.t==="sp"&&x.who===pt.who)partsOf(x).forEach((q,pi)=>steps.push({id:x.id,pi}))});pt.run={steps,i:0,h:0,shown:false,ok:0,miss:[]}}
  const R0=pt.run;
  if(R0.i>=R0.steps.length){const k=pt.who+"|"+pt.sid,b=REV.pp[k];if(!R0.saved){R0.saved=1;if(!b||R0.ok>=b[0])REV.pp[k]=[R0.ok,R0.steps.length,Date.now()];saveRev()}
    $("sbody").innerHTML=back+`<div class="qz" style="text-align:center"><div class="qn">${sName(p)}</div>${wreathHTML(R0.ok,R0.steps.length)}<p>${R0.ok===R0.steps.length?"Every line, word for word. Try it again tomorrow to make it stick.":`${R0.miss.length} part${R0.miss.length===1?"":"s"} to work on. They're added to Daily review.`}</p>
     <div class="row" style="justify-content:center"><button class="btn primary" id="pt-again">Run the scene again</button><button class="btn" data-ptback="scene">Other scenes</button></div><div class="xrow" style="justify-content:center">${toLink("scene:"+p.id,"Read the scene")}</div></div>`;
    $("pt-again").onclick=()=>{pt.run=null;studyPart()};return}
  const st=R0.steps[R0.i],sp=speech[st.id],ps=partsOf(sp),q=ps[st.pi],L=partLines(sp,q);
  const cue=st.pi>0?{who:sp.who,txt:partLines(sp,ps[st.pi-1]).join(" ").split(/\s+/).slice(-3).join(" "),self:1}:cueOf(p,st.id);
  const hint=R0.shown?`<div class="ptxt">${L.map(l=>`<span>${esc(l)}</span>`).join("")}</div>`:R0.h===2?`<div class="ptxt fl">${L.map(l=>`<span>${esc(firstLet(l))}</span>`).join("")}</div>`:R0.h===1?`<div class="ptmean"><div class="ptag">What you want to say</div><p>${esc(q[2])}</p></div>`:`<div class="ptblank">${L.map(()=>`<i></i>`).join("")}</div>`;
  R0.res=R0.res||[];$("sbody").innerHTML=back+pipFrame(sName(p),R0.res,R0.i,R0.steps.length,R0.ok,0)+`<div class="qz cue">
   <div class="cueline"><small>${cue?(cue.self?"Your previous line ends":(pt.showWho?esc(title(cue.who))+" ends":"Cue")):"Start of the scene"}</small>${cue?`<b>… ${esc(cue.txt)}</b>`:"<b>You speak first</b>"}</div>
   <div class="ptme" style="--c:${COLORS[pt.who]||"var(--ink)"}"><div class="ptwho">${esc(title(pt.who))}${ps.length>1?` <small>(${st.pi+1} of ${ps.length} in this speech)</small>`:""}</div>${hint}</div>
   <div class="cardbtns">${R0.shown?`<button class="btn" data-pt="miss">Missed</button><button class="btn" data-pt="near">Nearly</button><button class="btn primary" data-pt="got">Word perfect</button>`
     :`${R0.h<2?`<button class="btn" data-pt="hint">${R0.h===0?"Hint: the meaning":"Hint: first letters"}</button>`:""}<button class="btn primary" data-pt="show">I've said it · check</button>`}</div>
   <p class="muted" style="text-align:center;font-size:.875rem">${R0.shown?"Be strict: word perfect means every word.":"Say the lines out loud before you check."}</p></div>`;
}
function partAct(a){const R0=pt.run;if(!R0)return;const st=R0.steps[R0.i];
  if(a==="hint"){R0.h++;studyPart();return}
  if(a==="show"){R0.shown=true;studyPart();return}
  const k=`pt:${st.id}:${st.pi}`,ok=a==="got"&&R0.h===0;if(ok)R0.ok++;else R0.miss.push(st);(R0.res=R0.res||[])[R0.i]=ok;
  if(ok&&!getS(k)){}else grade(k,ok,false);
  R0.i++;R0.h=0;R0.shown=false;studyPart();scrollTo(0,0)}

/* Daily review: everything due, mixed across kinds (interleaved), plus a few new items; predict your score first */
let rv=null;
function reviewPool(){const due=shuf(dueKeys()),seen=new Set(allScheduled()),fresh=[];
  QUOTES.quotes.forEach(q=>{const w="who:"+q.i;if(!seen.has(w))fresh.push(w);else["fin","th","act"].forEach(t=>{if(!seen.has(t+":"+q.i))fresh.push(t+":"+q.i)})});
  scenes.forEach(p=>{if(prog.done[p.id])((STUDY.scenes[p.id]||{}).quiz||[]).forEach((_,n)=>{const k=`qz:${p.id}:${n}`;if(!seen.has(k))fresh.push(k)})});
  return {due,fresh:shuf(fresh)}}
function startReview(){const P=reviewPool(),items=[...P.due.slice(0,15),...P.fresh.slice(0,Math.max(3,15-P.due.length)).slice(0,5)];
  rv={items:shuf(items).map(k=>({k,stage:"ask"})),i:0,ok:0,pred:null};}
/* 4.11 session mode: 10 mixed items (who said it, finish, theme, act, scene quiz), due ones first, one of each kind in turn */
function startSession(){const due=shuf(dueKeys()),used=new Set(),items=[],kinds=["who","th","fin","act","qz"],read=scenes.filter(p=>prog.done[p.id]);
  due.slice(0,5).forEach(k=>{items.push(k);used.add(k)});let g=0;
  while(items.length<10&&g++<200){const t=kinds[items.length%kinds.length];let k;
    if(t==="qz"){const p=rnd(read.length?read:scenes),n=((STUDY.scenes[p.id]||{}).quiz||[]).length;if(!n)continue;k=`qz:${p.id}:${Math.floor(Math.random()*n)}`}else k=t+":"+rnd(QUOTES.quotes).i;
    if(!used.has(k)&&(t!=="qz"||kQuiz(k))){used.add(k);items.push(k)}}
  rv={items:shuf(items).map(k=>({k,stage:"ask"})),i:0,ok:0,pred:-1,ses:1}}
/* the shared frame: progress pips, right so far */
const rvFrame=()=>{let k=0;const res=rv.items.map((x,j)=>j<rv.i||x.stage==="shown"&&j===rv.i?x.ok:undefined);for(let j=rv.i-(rv.items[rv.i]&&rv.items[rv.i].ok!=null?0:1);j>=0&&res[j]===true;j--)k++;return pipFrame(rv.ses?"Session":"Review",res,rv.i,rv.items.length,rv.ok,k)};
/* every missed item, linked to its lines */
function missedHTML(){const M=rv.items.filter(x=>x.ok===false);if(!M.length)return `<p class="muted">Nothing missed.</p>`;
  const qs=[...new Set(M.filter(x=>!x.k.startsWith("qz:")).map(x=>kq(x.k).id))],qz=M.filter(x=>x.k.startsWith("qz:")).map(x=>kQuiz(x.k)).filter(Boolean);
  return `<div class="box miss49"><h3>Look again · ${M.length}</h3>${qs.length?evHTML(qs,"Quotes"):""}${qz.length?`<div class="evl">Quiz questions</div>${qz.map(q=>`<div class="mq"><p>${esc(q.q)}</p><p class="muted">Answer: ${esc(q.o[q.a])}</p>${toLink("scene:"+q.s,"Read "+sName(scenes[sIdx(q.s)]))}</div>`).join("")}`:""}</div>`}
function studyReview(){
  if(!rv||rv.done&&!rv.show){const P=reviewPool(),n=Math.min(15,P.due.length)+Math.min(P.fresh.length,Math.max(3,15-P.due.length),5),cal=REV.cal.slice(-5);
    const dn=(()=>{const t=today();return [...Object.values(REV.it),...Object.values(prog.srs)].filter(s=>s&&s.ld===t).length})();
    $("sbody").innerHTML=`<p class="intro">A few minutes a day beats one long session. Review mixes everything that is due: who said it, finishing quotes, themes, acts and quiz questions from scenes you have read, plus a few new items.</p>
     <div class="rvh19"><div class="rvt19">${ringAround(`<span class="rvc"><b>${dn}</b><small>today</small></span>`,dn/Math.max(1,dn+P.due.length),"rvring")}<div><h3>Today</h3><p><b>${P.due.length}</b> due${P.fresh.length?` · ${Math.min(P.fresh.length,5)} new`:""}${dn?` · ${dn} done`:""}</p></div></div>
      <div class="rva19">${n?`<button class="btn primary" id="rv-go">Start review · ${n} item${n===1?"":"s"}</button>`:`<p class="muted">Nothing to review yet. Learn some flashcards or finish a scene first.</p>`}<button class="btn" type="button" id="rv-ses">Session · 10 mixed · 5 min</button></div>${days14()}</div>
     ${planHTML(n)}
     ${cal.length?`<div class="box"><h3>How well you predict your score</h3><p class="intro">Students often think they know more than they do. Predicting first, then checking, makes you a better judge of what to revise.</p><ul class="cal">${cal.map(([p,g,t,n])=>`<li>${esc(new Date(t).toLocaleDateString())}: predicted ${esc(p)}, got ${esc(g)}${n?` of ${esc(n)}`:""}</li>`).join("")}</ul></div>`:""}
     ${examLeft()>2?`<p class="muted">Your exam is in ${examLeft()} days, so items come back sooner.</p>`:""}`;
    if($("rv-go"))$("rv-go").onclick=()=>{startReview();studyReview();scrollTo(0,0)};$("rv-ses").onclick=()=>{startSession();studyReview();scrollTo(0,0)};return}
  if(rv.pred==null){const n=rv.items.length;
    $("sbody").innerHTML=`<div class="qz"><div class="qn">Before you start</div><h3>How many of these ${n} do you think you'll get right?</h3>
     <input type="range" id="rv-p" min="0" max="${n}" value="${Math.round(n*.7)}" class="srange" aria-label="Predicted score"><p class="big" id="rv-pv">${Math.round(n*.7)}</p>
     <div class="row"><button class="btn primary" id="rv-start">Start</button><button class="link" id="rv-skip">Skip</button></div></div>`;
    $("rv-p").oninput=e=>$("rv-pv").textContent=e.target.value;
    $("rv-start").onclick=()=>{rv.pred=+$("rv-p").value;studyReview()};$("rv-skip").onclick=()=>{rv.pred=-1;studyReview()};return}
  if(rv.i<rv.items.length){const it=rv.items[rv.i];
    $("sbody").innerHTML=`${rvFrame()}<div class="cstack s${Math.max(0,Math.min(3,rv.items.length-rv.i-1))}">${itemHTML(it)}</div><div class="cardbtns">${itemButtons(it)}</div><div class="row"><button class="link" id="rv-quit">Stop review</button></div>`;
    $("rv-quit").onclick=()=>{rv=null;studyReview()};return}
  if(!rv.done){rv.done=true;rv.show=true;if(rv.pred>=0){REV.cal.push([rv.pred,rv.ok,Date.now(),rv.items.length]);REV.cal=REV.cal.slice(-20);saveRev()}}
  const n=rv.items.length,d=rv.pred>=0?rv.ok-rv.pred:null;
  $("sbody").innerHTML=`<div class="qz" style="text-align:center"><div class="qn">${rv.ses?"Session":"Review"} finished</div>${wreathHTML(rv.ok,n)}
   ${d!=null?`<p>${d===0?"You predicted exactly right.":d>0?`You did ${d} better than you predicted.`:`You predicted ${-d} more than you got. Worth a second look at the ones you missed.`}</p>`:""}
   <p class="muted">Items you missed come back later today; the rest come back in a few days.</p></div>${missedHTML()}<div class="qz" style="text-align:center">${reflHTML()}<div class="row" style="justify-content:center"><button class="btn primary" id="rv-home">Done</button><button class="btn" id="rv-again">Another session</button></div></div>`;
  wireRefl();$("rv-home").onclick=()=>{rv=null;studyReview()};$("rv-again").onclick=()=>{startSession();studyReview();scrollTo(0,0)};
}
function reviewAct(a,v){const it=rv&&rv.items[rv.i];if(!it)return;
  if(a==="pick"){if(it.stage!=="ask")return;it.pick=v;const ok=pickOk(it,v);it.stage="shown";it.ok=ok;if(ok)rv.ok++;grade(it.k,ok,false);studyReview();return}
  if(a==="sure"||a==="unsure"){it.sure=a==="sure";it.stage="shown";studyReview();return}
  if(a==="yes"||a==="no"){it.ok=a==="yes";if(a==="yes")rv.ok++;grade(it.k,a==="yes",it.sure);rv.i++;studyReview();scrollTo(0,0);return}
  if(a==="next"){rv.i++;studyReview();scrollTo(0,0)}}
/* ---------- recall prompts: test yourself on a Learn page before rereading it ----------
   Retrieval beats rereading: the page blurs, you write what you remember, then compare. Answers kept per page (REV.rc). */
REV.rc=REV.rc&&typeof REV.rc==="object"&&!Array.isArray(REV.rc)?REV.rc:{};
REV.refl=REV.refl&&typeof REV.refl==="object"&&!Array.isArray(REV.refl)?REV.refl:{};
let rcOn="";
/* the last 14 days as seals: a red seal for each day you read or studied */
function days14(){const C=new Set(REV.cal.map(c=>today(new Date(c[2])))),its=[...Object.values(REV.it),...Object.values(prog.srs)],out=[];let on=0;
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=today(d),a=!!LOG[k]||C.has(k)||its.some(s=>s&&s.ld===k);if(a)on++;
    out.push(`<span class="dd">${folioSeal(String(d.getDate()),a?"":i?"e":"n")}<small>${"SMTWTFS"[d.getDay()]}</small></span>`)}
  return `<div class="d14h"><small>Last 14 days · ${on} day${on===1?"":"s"} of study</small></div><div class="d14" role="img" aria-label="${on} of the last 14 days with study">${out.join("")}</div>`}
const EYE=`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M4 4l16 16"/></svg>`;
/* "Test yourself first" lives in the header as a covered eye; tapped, the page blurs and the box opens */
function addRecall(key,prompt){const sb=$("sbody"),g=$("sgroups");if(!sb)return;const o=$("sgr");if(o)o.remove();if(sb.querySelector(".recall"))return;const on=rcOn===key;
  if(!on){sb.classList.remove("recalling");if(g&&!g.hidden){const b=document.createElement("button");b.type="button";b.id="sgr";b.className="sgr noprint";b.title="Test yourself first: hide this page and write what you remember";b.setAttribute("aria-label","Test yourself first");b.innerHTML=EYE+"<span>Test</span>";
    b.onclick=()=>{rcOn=key;b.remove();addRecall(key,prompt);scrollTo(0,0)};g.insertBefore(b,$("sgq"))}return}
  const d=document.createElement("div");d.className="recall noprint";
  d.innerHTML=on?`<div class="box"><h3>From memory</h3><p class="intro">${esc(prompt)}</p><textarea class="sinput" id="rc-a" placeholder="Write what you remember, then compare">${esc(REV.rc[key]||"")}</textarea><div class="row"><button class="btn primary" id="rc-chk">Compare with the page</button></div></div>`
    :`<button class="btn sm" id="rc-go">Test yourself first</button><span class="muted">Hide this page and write what you remember. It works better than rereading.</span>`;
  sb.prepend(d);sb.classList.toggle("recalling",on);
  if(on){$("rc-a").oninput=e=>{REV.rc[key]=e.target.value.slice(0,4000);saveRev()};$("rc-chk").onclick=()=>{rcOn="";sb.classList.remove("recalling");d.innerHTML=`<div class="box"><h3>Your answer</h3><div class="mynote">${esc(REV.rc[key]||"(nothing written)")}</div><p class="muted">Check it against the page below. Anything you missed is worth a flashcard or a note.</p></div>`}}
  else $("rc-go").onclick=()=>{rcOn=key;sb.classList.remove("recalling");d.remove();addRecall(key,prompt);scrollTo(0,0)}}
{const T=studyThemes,P=studyProf,A=studyActs,E=studyExplore;
  studyThemes=function(){T();const n=QUOTES.themes[thSel][0];addRecall("th:"+thSel,`How does ${n.toLowerCase()} develop at the beginning, the turning point and the end? Give a quote for each if you can.`)};
  studyProf=function(){P();addRecall("prof:"+profSel,`Three things about ${title(profSel)}, each with a quote, and how they change in the play.`)};
  studyActs=function(){A();addRecall("acts","Pick an act and write what happens in it, in order. Then the key quote from each scene you can remember.")};
  studyExplore=function(){E();if(["facts","analysis","motifs","context","critics","bigq","timeline","devices","contrast"].includes(exSel))addRecall("ex:"+exSel+(exSel==="analysis"?":"+anSel:""),"Write down the most important points on this page, from memory.");else{const r=$("sgr");if(r)r.remove()}}}
/* scene pre-question: one quiz question shown at the top of a scene, to read for; answered by the end-of-scene quiz */
const preQ=p=>{const qs=(STUDY.scenes[p.id]||{}).quiz||[];return qs.length?qs[(p.act*7+p.sc)%qs.length].q:""};
/* today's plan on the Review page: due items, the next scenes for the exam plan, one shaky scene; reflection after a session */
function planHTML(n){const L=examLeft(),un=scenes.filter(p=>!prog.done[p.id]),per=L>2?Math.ceil(un.length/Math.max(1,L-2)):0,
  shaky=scenes.filter(p=>prog.conf[p.id]==="r"),weak=shaky.length?shaky[0]:scenes.filter(p=>prog.done[p.id]&&!prog.quiz[p.id])[0],last=Object.keys(REV.refl).sort().pop();
  const steps=[];if(n)steps.push(`Daily review: ${n} item${n===1?"":"s"} (about ${Math.max(2,Math.round(n*.5))} minutes)`);
  if(per&&un.length)steps.push(`Read ${per} scene${per===1?"":"s"}: next is ${sName(un[0])} <button class="link" data-go2="${un[0].id}">Read</button>`);
  if(weak)steps.push(`${prog.conf[weak.id]==="r"?"You marked this scene shaky":"Not quizzed yet"}: ${sName(weak)} <button class="link" data-quiz2="${weak.id}">Quiz</button>`);
  if(!steps.length)return "";
  return `<div class="box"><h3>Today's plan</h3><ol class="plan3">${steps.map(s=>`<li>${s}</li>`).join("")}</ol>${last&&REV.refl[last].fix?`<p class="muted">Last time (${esc(new Date(last+"T12:00").toLocaleDateString())}) you said you'd work on: <b>${esc(REV.refl[last].fix)}</b></p>`:""}</div>`}
function reflHTML(){const t=today(),r=REV.refl[t]||{};return `<div class="box refl" style="text-align:left"><h3>Look back</h3><label class="lbl" for="rf-w">What went well?</label><input class="sinput" id="rf-w" value="${esc(r.well||"")}" maxlength="200">
  <label class="lbl" for="rf-f">One thing to work on next time</label><input class="sinput" id="rf-f" value="${esc(r.fix||"")}" maxlength="200"></div>`}
function wireRefl(){const t=today(),sv=()=>{const w=$("rf-w").value.trim(),f=$("rf-f").value.trim();if(w||f)REV.refl[t]={well:w,fix:f};else delete REV.refl[t];const ks=Object.keys(REV.refl).sort();while(ks.length>30)delete REV.refl[ks.shift()];saveRev()};
  if($("rf-w")){$("rf-w").oninput=sv;$("rf-f").oninput=sv}}

/* essay helper: a theme traced from beginning to end */
let thSel=Object.keys(QUOTES.themes)[0];
function themePlan(k){
  const qs=QUOTES.quotes.filter(q=>q.themes.includes(k));
  const stage=(lo,hi)=>qs.filter(q=>{const a=sceneOf(q.id).act;return a>=lo&&a<=hi});
  return [["Beginning","Acts I–II",stage(1,2)],["Turning point","Act III",stage(3,3)],["Ending","Acts IV–V",stage(4,5)]];
}
function studyThemes(){
  const [name,desc]=QUOTES.themes[thSel];
  $("sbody").innerHTML=`<p class="intro">Pick a theme to see how it develops from beginning to end, with quotes you can use as evidence.</p>
   <div class="filt"><div class="chips" data-f="theme">${Object.entries(QUOTES.themes).map(([k,v])=>`<button class="chip" aria-pressed="${thSel===k}" data-v="${k}">${esc(v[0])}</button>`).join("")}</div></div>
   ${coverageHTML()}
   <h2 style="font:400 1.9rem var(--f-old);margin:6px 0 4px">${esc(name)}</h2><p class="intro">${esc(desc)}</p>
   ${themePlan(thSel).map(([h,s,qs])=>`<div class="stage3"><h3>${h}</h3><small>${s}</small></div>${qs.length?qs.map(quoteHTML).join(""):`<p class="muted">No key quote for this theme here. The scene summaries on the Contents page cover this part of the play.</p>`}`).join("")}
   ${(()=>{const mine=Object.keys(marks).filter(k=>speech[k]&&(marks[k].th||[]).includes(thSel)).sort((a,b)=>a-b);return mine.length?`<div class="stage3"><h3>Your tagged lines</h3><small>${mine.length}</small></div>`+mine.map(k=>`<div class="exitem">${spLine(k)}${marks[k].note?`<div class="mynote">${esc(marks[k].note)}</div>`:""}</div>`).join(""):`<p class="muted">Lines you tag with this theme (press and hold a speech, then "Tag themes") will appear here.</p>`})()}
   <div class="row"><button class="btn" id="th-copy">Copy as an essay plan</button></div>`;
  $("th-copy").onclick=()=>{let t=`ESSAY PLAN: ${name}\n${desc}\n`;themePlan(thSel).forEach(([h,s,qs])=>{t+=`\n${h} (${s})\n`;qs.forEach(q=>{t+=`- "${q.text}" (${title(speech[q.id].who)}, ${sName(sceneOf(q.id))}): ${q.note}\n`})});copyText(t)};
}
/* mistakes: missed quiz questions, quotes you didn't know, lines you marked confusing */
function missHTML(){const nq=prog.miss.q.length,cs=Object.keys(prog.miss.c||{}).filter(i=>prog.miss.c[i]>0),cf=Object.keys(marks).filter(k=>marks[k].hl==="cf"&&speech[k]),
  sm=Object.keys(prog.miss.s).filter(k=>!k.startsWith("pt:")&&validKey(k));
  if(!nq&&!cs.length&&!cf.length&&!sm.length)return "";
  const smHTML=sm.length?`<details style="margin-top:8px" open><summary>Sure but wrong (${sm.length}): fix these first</summary><p class="muted" style="font-size:.875rem">Mistakes you were confident about are the ones most worth correcting: they stick once you see the right answer.</p>${sm.map(k=>k.startsWith("qz:")?`<div class="exitem"><b>${esc(kQuiz(k).q)}</b><p>${esc(kQuiz(k).o[kQuiz(k).a])}</p></div>`:quoteHTML(kq(k))).join("")}</details>`:"";
  return `<div class="box" style="margin:0 0 16px;border:0;padding:0"><h3>Mistakes review</h3><p class="intro">${nq} missed question${nq===1?"":"s"} · ${cs.length} quote${cs.length===1?"":"s"} you didn't know · ${cf.length} line${cf.length===1?"":"s"} marked confusing</p>
   ${nq?`<button class="btn primary" id="qz-miss">Retry missed questions</button>`:""}${smHTML}
   ${cs.length?`<details style="margin-top:8px"><summary>Quotes to revisit</summary>${cs.map(i=>quoteHTML(QUOTES.quotes[i])).join("")}</details>`:""}
   ${cf.length?`<details style="margin-top:8px"><summary>Lines you found confusing</summary>${cf.map(k=>`<div class="exitem">${spLine(k)}</div>`).join("")}</details>`:""}</div>`}
function coverageHTML(){return `<div class="lbl">Your coverage: quotes learnt and notes made, by theme</div><div class="cov">${Object.entries(QUOTES.themes).map(([k,v])=>{const qs=QUOTES.quotes.filter(q=>q.themes.includes(k)),kn=qs.filter(q=>prog.cards[q.i]).length,
  nt=Object.keys(marks).filter(id=>speech[id]&&((marks[id].th||[]).includes(k)||(QBY[id]||[]).some(q=>q.themes.includes(k)))).length;
  return `<span>${esc(v[0])}</span><div class="cbar"><i style="width:${qs.length?kn/qs.length*100:0}%"></i></div><small>${kn}/${qs.length} · ${nt} note${nt===1?"":"s"}</small>`}).join("")}</div>`}
/* quizzes: one question at a time */
let qz=null;
function startQuiz(kind){
  let qs=[];
  if(kind==="all"){scenes.forEach(p=>((STUDY.scenes[p.id]||{}).quiz||[]).forEach(q=>qs.push(Object.assign({s:p.id},q))));qs=qs.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]).slice(0,20)}
  else if(kind==="miss")qs=prog.miss.q.map(q=>Object.assign({},q));
  else qs=((STUDY.scenes[kind]||{}).quiz||[]).map(q=>Object.assign({s:kind},q));
  qs=qs.map(q=>{const ix=shuf(q.o.map((_,i)=>i));return Object.assign({},q,{o:ix.map(i=>q.o[i]),a:ix.indexOf(q.a)})});
  qz={kind,qs,i:0,ok:0,ans:null,pred:kind==="miss"||qs.length<3?-1:null};studyQuiz();scrollTo(0,0);
}
function studyQuiz(){
  if(qz&&qz.pred==null){const n=qz.qs.length,v=Math.round(n*.7);
    $("sbody").innerHTML=`<div class="qz"><div class="qn">Before you start</div><h3>How many of these ${n} questions do you think you'll get right?</h3><input type="range" id="qp" min="0" max="${n}" value="${v}" class="srange" aria-label="Predicted score"><p class="big" id="qpv">${v}</p><div class="row"><button class="btn primary" id="qp-go">Start</button><button class="link" id="qp-skip">Skip</button></div></div>`;
    $("qp").oninput=e=>$("qpv").textContent=e.target.value;$("qp-go").onclick=()=>{qz.pred=+$("qp").value;studyQuiz()};$("qp-skip").onclick=()=>{qz.pred=-1;studyQuiz()};return}
  if(qz&&qz.i<qz.qs.length){const q=qz.qs[qz.i],p=scenes[sIdx(q.s)];
    qz.res=qz.res||[];let qk=0;for(let j=qz.i-(qz.ans!=null?0:1);j>=0&&qz.res[j]===true;j--)qk++;
    $("sbody").innerHTML=`${pipFrame(qz.kind==="all"?"Whole play":qz.kind==="miss"?"Mistakes review":sName(p),qz.res,qz.i,qz.qs.length,qz.ok,qk)}<div class="qz"><h3>${esc(q.q)}</h3>
      <div class="opts">${q.o.map((o,i)=>`<button data-i="${i}"${qz.ans!=null?" disabled":""} class="${qz.ans!=null?(i===q.a?"right":i===qz.ans?"wrong":""):""}">${esc(o)}</button>`).join("")}</div>
      <div class="row">${qz.ans!=null?`<button class="btn primary" id="qz-next">${qz.i+1<qz.qs.length?"Next question":"See score"}</button>`:""}<button class="link" id="qz-quit">Stop quiz</button>${qz.kind==="all"?`<span class="muted" style="font-size:.875rem">from ${sName(p)}</span>`:""}</div>${qz.ans!=null?`<div class="xrow">${toLink("scene:"+q.s,qz.ans===q.a?"Read the scene":"Check it in the scene")}${(STUDY.scenes[q.s]||{}).sum?toLink("study:acts?a="+p.act+"&s="+q.s,"Scene summary"):""}</div>`:""}</div>`;
    $("sbody").querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{qz.ans=+b.dataset.i;qz.res[qz.i]=qz.ans===q.a;const M=prog.miss.q,ix=M.findIndex(m=>m.q===q.q);
      if(qz.ans===q.a){qz.ok++;if(ix>=0)M.splice(ix,1)}else if(ix<0)M.push({q:q.q,o:q.o,a:q.a,s:q.s});saveProg();studyQuiz()});
    if($("qz-next"))$("qz-next").onclick=()=>{qz.i++;qz.ans=null;studyQuiz()};
    $("qz-quit").onclick=()=>{qz=null;studyQuiz()};return}
  if(qz){const k=qz.kind,old=prog.quiz[k];if(qz.pred>=0&&!qz.logged){qz.logged=1;REV.cal.push([qz.pred,qz.ok,Date.now(),qz.qs.length]);REV.cal=REV.cal.slice(-20);saveRev()}if(k!=="miss"&&(k==="all"||!old||qz.ok>=old[0])){prog.quiz[k]=[qz.ok,qz.qs.length];saveProg()}
    $("sbody").innerHTML=`<div class="qz" style="text-align:center"><div class="qn">${k==="all"?"Whole play":k==="miss"?"Mistakes review":sName(scenes[sIdx(k)])}</div>${wreathHTML(qz.ok,qz.qs.length)}${qz.pred>=0?`<p>${qz.ok===qz.pred?"You predicted exactly right.":qz.ok>qz.pred?`${qz.ok-qz.pred} better than you predicted.`:`You predicted ${qz.pred-qz.ok} more than you got.`}</p>`:""}<p class="muted">${qz.ok===qz.qs.length?"Perfect score.":"The right answers were shown as you went."}</p><div class="row" style="justify-content:center"><button class="btn primary" id="qz-again">Try again</button><button class="btn" id="qz-list">All quizzes</button></div>${sIdx(k)>=0?`<div class="xrow" style="justify-content:center">${toLink("scene:"+k,"Read the scene again")}${toLink("study:acts?a="+scenes[sIdx(k)].act,"Act summary")}</div>`:""}</div>`;
    $("qz-again").onclick=()=>startQuiz(k);$("qz-list").onclick=()=>{qz=null;studyQuiz()};return}
  const all=prog.quiz.all;
  $("sbody").innerHTML=`<p class="intro">Test yourself scene by scene, or take 20 random questions from the whole play.</p>
   ${missHTML()}
   <button class="go qall" id="qz-all">${laurelSVG("qal")}${laurelSVG("qar")}<small>Practice test${all?` · last score ${esc(all[0])} of ${esc(all[1])}`:""}</small><b>Whole-play quiz · 20 questions</b></button>
   <div class="qacts19">${ACTS.map(a=>{const ps=scenes.filter(p=>p.act===a),won=ps.length&&ps.every(p=>{const b=prog.quiz[p.id];return b&&b[0]>=b[1]}),qd=ps.filter(p=>prog.quiz[p.id]),sc=qd.reduce((x,p)=>[x[0]+prog.quiz[p.id][0],x[1]+prog.quiz[p.id][1]],[0,0]),nx=ps.find(p=>!prog.quiz[p.id]&&qzN(p))||ps.find(p=>{const b=prog.quiz[p.id];return b&&b[0]<b[1]});
     return ps.length?`<section class="qact19${won?" won":""}"><header>${hring(qd.length/ps.length,`<b class="rn">${a?R[a]:"Ind."}</b>`)}<div><h3>${LAT[a]}</h3><small>${qd.length} of ${ps.length} scenes quizzed${sc[1]?` · ${Math.round(100*sc[0]/sc[1])}%`:""}${won?" · all full marks":""}</small></div>${won?folioLaurel("qlau"):""}</header><div class="qseals">${scenes.filter(p=>p.act===a).map(p=>{const b=prog.quiz[p.id],f=b?b[0]/Math.max(1,b[1]):0,nq=((STUDY.scenes[p.id]||{}).quiz||[]).length;return `<button type="button" class="qsl${b?(f>=1?" gilt":" done"):""}" data-q="${p.id}" aria-label="Scene ${esc(p.scene)}: ${b?`best ${esc(b[0])} of ${esc(b[1])}`:`${nq} questions`}">${ringAround(folioSeal(p.scene,b?(f>=1?"g":""):"e"),f)}<small>${b?`${esc(b[0])} / ${esc(b[1])}`:`${nq} to try`}</small></button>`}).join("")}</div>${nx?`<button type="button" class="btn sm qnx19" data-q="${nx.id}">${prog.quiz[nx.id]?"Retry":"Next"}: Scene ${esc(nx.scene.toLowerCase())} ›</button>`:""}</section>`:""}).join("")}</div>`;
  $("qz-all").onclick=()=>startQuiz("all");if($("qz-miss"))$("qz-miss").onclick=()=>startQuiz("miss");
  $("sbody").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>startQuiz(b.dataset.q));
}
/* revision sheet + backup */
function revisionText(){
  let t=`${CFG.title.toUpperCase()}: REVISION SHEET\n${new Date().toLocaleDateString()}\n\n`;
  const ids=Object.keys(marks).filter(k=>speech[k]).sort((a,b)=>a-b);
  t+=`MY MARKED SPEECHES AND NOTES (${ids.length})\n`;
  if(!ids.length)t+="None yet. While reading, press and hold a speaker’s name to mark the whole speech or add a note.\n";
  let ls="";ids.forEach(k=>{const sp=speech[k],m=marks[k],p=sceneOf(k);if(p.id!==ls){t+=`\n${sName(p)} (${shortLoc(p)})\n`;ls=p.id}
    t+=`  ${title(sp.who)}${inkOf(m)?" ["+inkName(inkOf(m))+"]":""}: ${sp.lines.map(l=>l.replace(/^~/,"")).join(" / ")}\n`;if(m.note)t+=`    My note: ${m.note.replace(/\n/g," ")}\n`});
  const qs=Object.entries(prog.quiz).filter(([k])=>k!=="all"&&sIdx(k)>=0).sort((a,b)=>sIdx(a[0])-sIdx(b[0]));
  t+=`\nQUIZ SCORES\n`+(qs.length?qs.map(([k,v])=>`  ${sName(scenes[sIdx(k)])}: ${v[0]}/${v[1]}`).join("\n"):"  None yet")+(prog.quiz.all?`\n  Whole-play quiz (last): ${prog.quiz.all[0]}/${prog.quiz.all[1]}`:"")+"\n";
  const kn=QUOTES.quotes.filter(q=>prog.cards[q.i]),un=QUOTES.quotes.filter(q=>!prog.cards[q.i]);
  t+=`\nQUOTES STILL TO LEARN (${un.length})\n`+un.map(q=>`  "${q.text}" (${title(speech[q.id].who)}, ${sName(sceneOf(q.id))})`).join("\n")+"\n";
  t+=`\nQUOTES LEARNT (${kn.length})\n`+(kn.map(q=>`  "${q.text}" (${title(speech[q.id].who)})`).join("\n")||"  None yet")+"\n";
  const fv=FAV.filter(f=>speech[f.id]);t+=`\nMARKED WORDS (${fv.length})\n`+(fv.map(f=>`  [${inkName(fcOk(f.c))}] "${favText(f.id,f.a,f.b)||f.txt||""}" (${title(speech[f.id].who)}, ${sName(sceneOf(f.id))})${f.note?`\n    My note: ${f.note.replace(/\n/g," ")}`:""}`).join("\n")||"  None yet")+"\n";
  return t}
function download(name,text,type){try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){}
  toast("Downloading. If nothing appears, use Copy instead.")}
function restore(txt){if(!String(txt||"").trim()){toast("Paste a backup first, or choose the file");return false}let d;try{d=JSON.parse(String(txt).trim())}catch(e){toast("That isn't a valid backup");return false}
  if(!d||d.app!==CFG.app){toast(`That isn't ${CFG.an} ${CFG.short} backup`);return false}
  Object.entries(d.marks||{}).forEach(([k,v])=>{if(!v||typeof v!=="object")return;if(!marks[k]||(v.t||0)>(marks[k].t||0)){marks[k]=v}});LS.set(PFX+"marks",JSON.stringify(marks));
  const p=d.prog||{};Object.assign(prog.done,p.done||{});Object.assign(prog.cards,p.cards||{});Object.assign(prog.srs,p.srs||{});Object.assign(prog.conf,p.conf||{});if(p.exam)prog.exam=p.exam;
  Object.entries(p.quiz||{}).forEach(([k,v])=>{if(!prog.quiz[k]||v[0]>prog.quiz[k][0])prog.quiz[k]=v});saveProg();
  (Array.isArray(d.bm)?d.bm:[]).forEach(b=>{if(b&&sIdx(b.s)>=0&&!BM.some(x=>x.s===b.s&&x.key===b.key))BM.push(b)});saveBM();
  (Array.isArray(d.fav)?d.fav:[]).forEach(f=>{if(!f||!speech[f.id]||!Array.isArray(f.a)||!Array.isArray(f.b))return;const a=f.a.map(Number),b=f.b.map(Number);if(a.some(isNaN)||b.some(isNaN))return;
    if(!FAV.some(x=>x.id===+f.id&&x.a+""===a+""&&x.b+""===b+""))FAV.push({id:+f.id,a,b,txt:String(f.txt||favText(+f.id,a,b)),note:String(f.note||""),c:fcOk(f.c),t:+f.t||Date.now()})});favSort();saveFav();refreshMarks();
  Object.entries(d.plan||{}).forEach(([k,v])=>{if(!(k in PLAN))PLAN[k]=v});savePlan();
  Object.entries(d.prof||{}).forEach(([k,v])=>{if(!(k in PROF))PROF[k]=v});LS.set(PFX+"prof",JSON.stringify(PROF));
  Object.entries(d.log||{}).forEach(([k,v])=>{if(!LOG[k]||v.s>LOG[k].s)LOG[k]=v});LS.set(PFX+"log",JSON.stringify(LOG));
  toast(`Imported ${Object.keys(d.marks||{}).length} notes and your progress`);return true}
/* backups: one Folio backup on the shelf covers every play; old single-play backup files can still be imported here */
const FOLIO_BK="../?shelf#you";
function backupHTML(){return `<div class="box"><h3>Backup</h3><p class="intro">Notes, highlights, bookmarks and progress are saved on this device. One Folio backup saves them for every play.</p>
  <div class="row"><a class="btn primary" href="${FOLIO_BK}">Open Folio backup</a></div>
  <details class="about"><summary>Import an older ${esc(CFG.short)} backup</summary>
  <label for="bk-in" class="lbl" style="display:block;margin-top:12px">Paste the backup, or choose the file. Importing adds to what is already there.</label><textarea id="bk-in" placeholder='It starts with {"app":"${CFG.app}"'></textarea>
  <div class="row"><button class="btn primary" id="bk-go">Import pasted backup</button><label class="btn" for="bk-file" style="cursor:pointer">Choose backup file</label><input type="file" id="bk-file" accept=".json,application/json,text/plain" hidden></div></details></div>`}
function wireBackup(after){
  $("bk-go").onclick=()=>{if(restore($("bk-in").value)){$("bk-in").value="";after&&after()}};
  $("bk-file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{if(restore(r.result))after&&after()};r.readAsText(f)};
}
/* the revision sheet as a printed folio page: running head, rubricated headings */
const revHTML=t=>`<div class="olrh" aria-hidden="true"><span>${esc(CFG.short)}</span><span>Revision sheet</span></div>`+t.split("\n").map((l,i)=>{const s=l.trim();if(!i)return `<h3 class="rvh">${esc(s)}</h3>`;
  if(s&&!/^\s/.test(l)&&/^[A-Z][A-Z0-9 ,:;'’()&.\-/]+$/.test(s)&&/[A-Z]{3}/.test(s))return `<h4>${esc(s)}</h4>`;return `<div class="rl${/^\s{4}/.test(l)?" n2":/^\s{2}/.test(l)?" n1":""}">${s?esc(s.replace(/(^|[\s(])"/g,"$1“").replace(/"/g,"”")):"&nbsp;"}</div>`}).join("");
function studyRevise(){
  const t=revisionText();
  $("sbody").innerHTML=`<p class="intro">Everything you've marked, your quiz scores and the quotes you still need to learn, on one sheet.</p>
   <div class="row"><button class="btn primary" id="rv-copy">Copy revision sheet</button><button class="btn" id="rv-dl">Download as text</button></div>
   <div class="rev folp">${revHTML(t)}</div>${backupHTML()}`;
  $("rv-copy").onclick=()=>copyText(t);$("rv-dl").onclick=()=>download(CFG.file+"-revision.txt",t,"text/plain");
  wireBackup(studyRevise);
}
$("sbody").addEventListener("click",e=>{
  const pv=e.target.closest("[data-pv]");if(pv){e.preventDefault();openPv(pv.dataset.pv);return}
  const ht=e.target.closest("[data-heat]");if(ht){const [i,j]=ht.dataset.heat.split(":").map(Number),[nm,per]=HEAT[i]||[];if(nm)openSheet(`${nm} · ${AN(ACTS[j])}`,`<p class="intro">${per[j].length} speech${per[j].length===1?"":"es"} mention it.</p>${evHTML(per[j],"In the play")}`);return}
  const cj=e.target.closest("[data-crj]");if(cj){const [k,i]=cj.dataset.crj.split(":"),el=document.getElementById(`cr-${k}-${i}`);if(el){el.scrollIntoView({block:"center",behavior:"smooth"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1600)}return}
  const ta=e.target.closest("[data-thact]");if(ta){const [k,a]=ta.dataset.thact.split(":"),qs=QUOTES.quotes.filter(q=>q.themes.includes(k)&&sceneOf(q.id).act===+a);openSheet(`${QUOTES.themes[k][0]} · ${AN(+a)}`,evHTML(qs.map(q=>q.id),"Key quotes"));return}
  const qw=e.target.closest("[data-qwho]");if(qw){qf.who=qw.dataset.qwho;const y=scrollY;studyQuotes();scrollTo(0,y);return}
  const dv=e.target.closest("[data-dv]");if(dv){DV=dv.dataset.dv;LS.set("folio-deckview",DV);const y=scrollY;renderStudy();scrollTo(0,y);return}
  const aj=e.target.closest("[data-actj]");if(aj){actGo(+aj.dataset.actj);return}
  const av=e.target.closest("[data-av]");if(av){AV=av.dataset.av;LS.set("folio-actview",AV);const y=scrollY;renderStudy();scrollTo(0,y);return}
  const as=e.target.closest("[data-acs],[data-acfull]");if(as){const id=as.dataset.acs||as.dataset.acfull;if(as.dataset.acfull){AV="full";LS.set("folio-actview",AV);renderStudy()}
    acScroll(id,!as.dataset.acfull);return}
  const dc=e.target.closest("[data-dc]");if(dc){const [i,j]=dc.dataset.dc.split(":").map(Number);DIRC[i]=Object.assign({},DIRC[i],{c:j});saveDir();const y=scrollY;studyExplore();scrollTo(0,y);return}
  const ib=e.target.closest("[data-it]");if(ib){if(S.stab==="review")reviewAct(ib.dataset.it);else cardAct(ib.dataset.it);return}
  const pk=e.target.closest("[data-pick]");if(pk&&!pk.disabled){reviewAct("pick",pk.dataset.pick);return}
  const g2=e.target.closest("[data-go2]");if(g2){goScene(sIdx(g2.dataset.go2),{page:0});return}
  const gt=e.target.closest("[data-gotab]");if(gt){const [t,x]=gt.dataset.gotab.split(":");if(t==="explore")exSel=x||"";goStudy(t,x);return}
  const q2=e.target.closest("[data-quiz2]");if(q2){goStudy("quiz");startQuiz(q2.dataset.quiz2);return}
  const pa=e.target.closest("[data-pt]");if(pa){partAct(pa.dataset.pt);return}
  const pw=e.target.closest("[data-ptwho]");if(pw){pt.who=pw.dataset.ptwho;pt.sid="";pt.run=null;studyPart();scrollTo(0,0);return}
  const ps=e.target.closest("[data-ptsid]");if(ps){pt.sid=ps.dataset.ptsid;pt.run=null;studyPart();scrollTo(0,0);return}
  const pb=e.target.closest("[data-ptback]");if(pb){if(pb.dataset.ptback==="scene"){pt.sid="";pt.run=null}else pt.who="";studyPart();scrollTo(0,0);return}
  const cd=e.target.closest("[data-cdir]");if(cd){cdir=cd.dataset.cdir;LS.set(PFX+"cdir",cdir);newDeck();studyCards();return}
  const dk=e.target.closest("[data-drill]");if(dk){dr={k:dk.dataset.drill};renderStudy();scrollTo(0,0);return}
  const ex=e.target.closest("[data-ex]");if(ex){exSel=ex.dataset.ex;goStudy("explore",exSel);return}
  const an=e.target.closest("[data-an]");if(an){anSel=an.dataset.an;studyExplore();return}
  const ma=e.target.closest("[data-mapact]");if(ma){mapAct=+ma.dataset.mapact;studyExplore();return}
  const az=e.target.closest("[data-az]");if(az){const el=document.querySelector(`[data-letter="${az.dataset.az}"]`);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return}
  const s=e.target.closest("[data-speech]");if(s){openPv(s.dataset.speech);return}
  const c=e.target.closest(".chips .chip");if(c){const f=c.parentNode.dataset.f,v=c.dataset.v;
    if(f==="who")qf.who=v;else if(f==="th")qf.th=v;else if(f==="theme")thSel=v;renderStudy()}});
$("sbody").addEventListener("input",e=>{const t=e.target.closest("[data-dw]");if(t){const i=t.dataset.dw;DIRC[i]=Object.assign({},DIRC[i],{w:t.value.slice(0,4000)});saveDir()}});
$("sbody").addEventListener("change",e=>{if(e.target.id==="vl-s"){vlSel=+e.target.value;studyExplore();return}const c=e.target.closest("[data-cmp]");if(c){cmp[+c.dataset.cmp]=+c.value;studyExplore();return}const s=e.target.closest("[data-qf]");if(s){qf[s.dataset.qf]=s.value;renderStudy()}});

/* ---------- sheets ---------- */
const sheet=$("sheet");let lastFocus=null;
function openSheet(t,html){clearSel();if(spread()&&view==="reader"&&document.body.classList.contains("chrome"))toggleChrome(false);if(sheet.hidden)lastFocus=document.activeElement;$("sheet-title").textContent=t;$("sheet-body").innerHTML=html;sheet.hidden=false;sheet.classList.remove("full");
  if(wide()&&view==="reader"){document.body.classList.add("sside");if(!$("panel").classList.contains("open"))fitPanel(true)}const b=sheet.querySelector(".sbox");b.scrollTop=0;b.focus({preventScroll:true})}
function closeSheet(){if(sheet.hidden)return;sheet.hidden=true;if(document.body.classList.contains("sside")){document.body.classList.remove("sside");if(!$("panel").classList.contains("open"))fitPanel(false)}if(!wide())closePanel();if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
$("sheet-close").onclick=closeSheet;
{const g=sheet.querySelector(".grab");if(g)g.addEventListener("click",()=>{if(!wide())sheet.classList.toggle("full")})}
/* pull the sheet down (from the grab bar, the header, or anywhere once scrolled to the top) to close it */
{const sb=sheet.querySelector(".sbox");let sd=null;
  sb.addEventListener("touchstart",e=>{if(e.touches.length!==1||e.target.closest("input,textarea,select"))return;const head=e.target.closest(".grab,.head");if(!head&&sb.scrollTop>0)return;sd={y:e.touches[0].clientY,t:Date.now(),dy:0,on:false}},{passive:true});
  sb.addEventListener("touchmove",e=>{if(!sd)return;const dy=e.touches[0].clientY-sd.y;if(!sd.on){if(dy<-4){sd=null;return}if(dy<8)return;sd.on=true;sb.style.transition="none"}
    e.preventDefault();sd.dy=Math.max(0,dy);sb.style.transform=`translateY(${sd.dy}px)`},{passive:false});
  const end=()=>{if(!sd)return;const d=sd;sd=null;if(!d.on)return;sb.style.transition="transform .2s ease";
    if(d.dy>110||d.dy>40&&d.dy/(Date.now()-d.t)>.5){sb.style.transform="translateY(100%)";setTimeout(()=>{closeSheet();sb.style.transition=sb.style.transform=""},180)}else{sb.style.transform="";setTimeout(()=>{sb.style.transition=""},220)}};
  sb.addEventListener("touchend",end);sb.addEventListener("touchcancel",end)}
sheet.addEventListener("click",e=>{if(e.target===sheet)return closeSheet();
  const ct=e.target.closest("[data-ctab]");if(ct){openContents(ct.dataset.ctab);return}
  const fw=e.target.closest("[data-follow]");if(fw){follow(fw.dataset.follow);return}
  const bd=e.target.closest("[data-bmdel]");if(bd){BM.splice(+bd.dataset.bmdel,1);saveBM();bmState();openNotes();return}
  const md=e.target.closest("[data-mkdel]");if(md){const id=+md.dataset.mkdel,snap=selSnap(id);delete marks[id];LS.set(PFX+"marks",JSON.stringify(marks));refreshMarks();openNotes();undoToast("Removed",snap);return}
  const fd=e.target.closest("[data-fpdel]");if(fd){const f=FAV.find(x=>String(x.t)===fd.dataset.fpdel),snap=selSnap(f?f.id:-1);FAV=FAV.filter(x=>x!==f);saveFav();refreshMarks();openNotes();undoToast("Removed",snap);return}
  const fh=e.target.closest("[data-fph]");if(fh){const f=FAV.find(x=>String(x.t)===fh.dataset.fph);if(f)goSpeech(f.id);return}
  const bk=e.target.closest("[data-bm]");if(bk){const b=BM[+bk.dataset.bm];closeSheet();setHash(b.s);show("reader");openScene(sIdx(b.s),{key:b.key});return}
  const rc=e.target.closest("[data-recent]");if(rc){const [id,pi]=rc.dataset.recent.split(":").map(Number);goSpeech(id);setTimeout(()=>{showPartPage(id,pi);openPart(id,pi,false)},250);return}
  const po=e.target.closest("[data-pvopen]");if(po){pvOpen(po.dataset.pvopen);return}
  if(e.target.closest("[data-pvclose]")){PVBACK=null;closeSheet();return}
  const pv=e.target.closest("[data-pv]");if(pv){openPv(pv.dataset.pv);return}
  const g=e.target.closest("[data-speech]");if(g){goSpeech(g.dataset.speech);return}
  const p=e.target.closest("[data-go]");if(p){closeSheet();goScene(sIdx(p.dataset.go))}});
sheet.addEventListener("keydown",e=>{if(e.key==="Enter"){const g=e.target.closest("[data-speech],[data-go],[data-bm],[data-fph]");if(g&&!e.target.closest("button"))g.click()}});
const where=sp=>`${sName(sceneOf(sp.id))} · ${title(sp.who)}`;
function snippet(t,q){const i=t.toLowerCase().indexOf(q.toLowerCase()),a=Math.max(0,i-50),b=Math.min(t.length,i+q.length+80);
  return (a>0?"…":"")+esc(t.slice(a,i))+"<mark>"+esc(t.slice(i,i+q.length))+"</mark>"+esc(t.slice(i+q.length,b))+(b<t.length?"…":"")}
function searchResults(q){q=q.trim();if(q.length<2)return `<p class="muted">Type at least two letters. Searches the original and the modern English.</p>`;
  const res=[];for(const id in speech){const sp=speech[id],o=sp.lines.join(" ").replace(/~/g,"");
    if(o.toLowerCase().includes(q.toLowerCase()))res.push(`<div class="item" data-speech="${id}" tabindex="0"><small>${esc(where(sp))}</small>${snippet(o,q)}</div>`);
    else if(sp.m.toLowerCase().includes(q.toLowerCase()))res.push(`<div class="item" data-speech="${id}" tabindex="0"><small>${esc(where(sp))} · modern</small>${snippet(sp.m,q)}</div>`)}
  return `<p class="muted">${res.length} match${res.length===1?"":"es"}</p>`+res.slice(0,300).join("")}
function openSearch(q){openSheet("Search",`<label for="sq" class="sr">Search</label><input class="sinput" id="sq" type="search" placeholder="A word or phrase…" value="${esc(q||"")}" autocomplete="off"><a class="link allplays" id="sq-all" href="../?shelf#search">Search every play instead ›</a><div id="sres" style="margin-top:8px"></div>`);
  const sq=$("sq"),run=()=>{$("sres").innerHTML=searchResults(sq.value);$("sq-all").href="../?shelf#search="+encodeURIComponent(sq.value.trim())};let t;sq.addEventListener("input",()=>{clearTimeout(t);t=setTimeout(run,200)});run();setTimeout(()=>sq.focus(),30)}
setInterval(()=>{if(/timed$/.test(S.theme))applySettings()},600000);
/* bookmarks: whole pages, this device (and in backups) */
let BM=[];try{BM=JSON.parse(LS.get(PFX+"bm")||"[]")}catch(e){}if(!Array.isArray(BM))BM=[];BM=BM.filter(b=>b&&sIdx(b.s)>=0);
const saveBM=()=>LS.set(PFX+"bm",JSON.stringify(BM));
const bmHere=()=>pos?BM.findIndex(b=>b.s===pos.s&&b.key===pos.key):-1;
function bmState(){const b=$("b-bm");if(!b)return;const on=bmHere()>=0;pg.classList.toggle("bmk",on);b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.setAttribute("aria-label",on?"Remove bookmark":"Bookmark this page")}
function keyText(s,key){const [id,ln]=String(key).split(":"),sp=speech[id];return sp?(sp.lines[+ln||0]||sp.lines[0]).replace(/^~/,""):sName(scenes[sIdx(s)])}
function toggleBM(){if(!pos)return;const i=bmHere();if(i>=0){BM.splice(i,1);toast("Bookmark removed")}else{BM.push({s:pos.s,key:pos.key,t:Date.now(),txt:keyText(pos.s,pos.key)});BM.sort((a,b)=>sIdx(a.s)-sIdx(b.s)||String(a.key).localeCompare(String(b.key),void 0,{numeric:true}));toast("Page bookmarked. Find it in My notes.")}saveBM();bmState()}
/* my notes (4.12): speech marks and marked words in one list in play order; ink chips with counts, search, theme and character filters, print, share */
let nf={q:"",th:"",who:"",c:""};
function notesRows(){const rows=[];Object.keys(marks).forEach(k=>{if(speech[k])rows.push({s:+k,o:-1,m:marks[k]})});FAV.forEach(f=>{if(speech[f.id])rows.push({s:f.id,o:f.a[0]*1e4+f.a[1],f})});return rows.sort((x,y)=>x.s-y.s||x.o-y.o)}
const rowInk=r=>r.f?fcOk(r.f.c):inkOf(r.m),rowNote=r=>String((r.f?r.f.note:r.m.note)||"").trim(),rowTxt=r=>r.f?(favText(r.f.id,r.f.a,r.f.b)||r.f.txt||""):speech[r.s].lines.join(" ").replace(/~/g,"");
function notesFilter(rows,c){const q=nf.q.trim().toLowerCase();
  return rows.filter(r=>{const sp=speech[r.s],m=marks[r.s]||{};
    if(nf.who&&sp.who!==nf.who)return false;
    if(nf.th&&!((m.th||[]).includes(nf.th)||(QBY[r.s]||[]).some(x=>x.themes.includes(nf.th))))return false;
    if(c==="note"&&!rowNote(r))return false;if(c&&c!=="note"&&rowInk(r)!==c)return false;
    if(q&&!(rowNote(r).toLowerCase().includes(q)||rowTxt(r).toLowerCase().includes(q)||!r.f&&sp.m.toLowerCase().includes(q)))return false;return true})}
const notesShown=()=>notesFilter(notesRows(),nf.c);
function notesChips(){const rs=notesFilter(notesRows(),""),n=k=>rs.filter(r=>rowInk(r)===k).length,nn=rs.filter(rowNote).length;
  return `<button type="button" class="chip" data-nfc="" aria-pressed="${!nf.c}">All <small>${rs.length}</small></button>${INK.map(k=>n(k)||nf.c===k?`<button type="button" class="chip mkchip fc-${k}" data-nfc="${k}" aria-pressed="${nf.c===k}"><i class="hlk fc-${k}"></i>${esc(inkName(k))} <small>${n(k)}</small></button>`:"").join("")}${nn||nf.c==="note"?`<button type="button" class="chip" data-nfc="note" aria-pressed="${nf.c==="note"}">✎ Has note <small>${nn}</small></button>`:""}`}
function notesList(){const rows=notesShown();let h=`<p class="muted">${rows.length} of ${notesRows().length} shown</p>`,la=0;
  rows.forEach(r=>{const sp=speech[r.s],m=marks[r.s]||{},p=sceneOf(r.s),ik=rowInk(r),t=rowTxt(r),nt=rowNote(r);
    if(p.act!==la){h+=`<div class="eyebrow" style="margin:14px 0 0">${LAT[p.act]}</div>`;la=p.act}
    const lab=`${ik?`<i class="hlk fc-${ik}"></i><b class="mkn">${esc(inkName(ik))}</b> · `:""}${esc(where(sp))}`,band=x=>ik?`<mark class="mkb fc-${ik}">${x}</mark>`:x;
    h+=r.f?`<div class="item mkr" data-fph="${esc(r.f.t)}" tabindex="0"><small>${lab} · <button class="link" data-fpdel="${esc(r.f.t)}">Remove</button></small><span class="mkt">${band("“"+esc(t)+"”")}</span>${nt?`<div class="mynote">${esc(nt)}</div>`:""}</div>`
      :`<div class="item mkr" data-speech="${r.s}" tabindex="0"><small>${lab}${thOf(m).length?" · "+thOf(m).map(x=>esc(QUOTES.themes[x][0])).join(", "):""} · <button class="link" data-mkdel="${r.s}">Remove</button></small>${!ik&&!nt&&thOf(m).length?`<span class="mkwhy">Theme tag from Speech tools</span>`:""}<span class="mkt">${band(esc(t.slice(0,160))+(t.length>160?"…":""))}</span>${nt?`<div class="mynote">${esc(nt)}</div>`:""}</div>`});
  return h}
function openNotes(){
  const rows=notesRows(),whos=[...new Set(rows.map(r=>speech[r.s].who))].sort();
  let h=`<p class="muted">Saved on this device. Tap one to go to it.</p>`;
  if(BM.length)h+=`<div class="eyebrow" style="margin:10px 0 0">Bookmarks</div>`+BM.map((b,i)=>`<div class="item" data-bm="${i}" tabindex="0"><small>${esc(sName(scenes[sIdx(b.s)]))} · <button class="link" data-bmdel="${i}">Remove</button></small><span style="font-family:var(--f-old)">${esc(b.txt||"")}</span></div>`).join("");
  if(!rows.length)h+=`<div class="empty46"><svg viewBox="0 0 120 90" aria-hidden="true"><path class="eq" d="M86 8c-14 6-30 22-42 44l-6 14 12-9c18-14 32-30 36-49z"/><path class="eq2" d="M44 52l-8 18M50 46c6-2 14-8 20-16"/><path class="er" d="M18 20h10v58l-5-6-5 6z"/><path class="el" d="M8 84h104"/></svg></div><p class="emptyp">No marks yet. While reading, press and hold a word, then tap an ink to mark it. Press and hold a speaker’s name to mark the whole speech. Use the bookmark button in the top bar to save a page.</p>`;
  else h+=`<div class="eyebrow" style="margin:14px 0 0">Marks and notes</div><div class="mkchips" id="nchips" role="group" aria-label="Filter by ink">${notesChips()}</div><div class="nfilt"><label class="sr" for="nf-q">Search notes</label><input type="search" id="nf-q" placeholder="Search your marks and notes…" value="${esc(nf.q)}" style="grid-column:1/-1">
    <label class="sr" for="nf-th">Theme</label><select id="nf-th"><option value="">Any theme</option>${Object.entries(QUOTES.themes).map(([k,v])=>`<option value="${k}"${nf.th===k?" selected":""}>${esc(v[0])}</option>`).join("")}</select>
    <label class="sr" for="nf-who">Character</label><select id="nf-who"><option value="">Any character</option>${whos.map(w=>`<option value="${esc(w)}"${nf.who===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select></div>
    <div class="row"><button class="btn sm" id="nf-print">Print</button><button class="btn sm" id="nf-copy">Copy</button><button class="btn sm" id="nf-share">Share as a link</button></div><div id="nlist">${notesList()}</div>`;
  openSheet("My notes",h);if(!rows.length)return;
  const re=()=>{$("nlist").innerHTML=notesList();$("nchips").innerHTML=notesChips()};
  let tm;$("nf-q").oninput=e=>{nf.q=e.target.value;clearTimeout(tm);tm=setTimeout(re,150)};
  ["th","who"].forEach(f=>$("nf-"+f).onchange=e=>{nf[f]=e.target.value;re()});
  $("nchips").onclick=e=>{const b=e.target.closest("[data-nfc]");if(!b)return;nf.c=b.dataset.nfc;re()};
  const lines=r=>r.f?"“"+rowTxt(r)+"”":speech[r.s].lines.map(l=>l.replace(/^~/,"")).join("\n"),ink=r=>rowInk(r)?`[${inkName(rowInk(r))}] `:"";
  const txt=()=>notesShown().map(r=>`${ink(r)}${where(speech[r.s])}\n${lines(r)}${rowNote(r)?`\nNote: ${rowNote(r)}`:""}`).join("\n\n");
  $("nf-copy").onclick=()=>copyText("MY "+CFG.short.toUpperCase()+" NOTES\n\n"+txt());
  $("nf-print").onclick=()=>printArea("My "+CFG.short+" notes",notesShown().map(r=>{const m=marks[r.s]||{};return `<div class="pi"><small>${esc(ink(r)+where(speech[r.s]))}${!r.f&&thOf(m).length?" · "+thOf(m).map(x=>esc(QUOTES.themes[x][0])).join(", "):""}</small><div>${esc(lines(r)).replace(/\n/g,"<br>")}</div>${rowNote(r)?`<i>${esc(rowNote(r))}</i>`:""}</div>`}).join(""));
  $("nf-share").onclick=()=>shareIds([...new Set(notesShown().map(r=>r.s))]);
}
function printArea(tl,html){let pa=$("printarea");if(!pa){pa=document.createElement("div");pa.id="printarea";document.body.appendChild(pa)}
  pa.innerHTML=`<h1>${esc(tl)}</h1>${html}`;document.body.classList.add("printing");const done=()=>{document.body.classList.remove("printing");removeEventListener("afterprint",done)};addEventListener("afterprint",done);
  try{window.print()}catch(e){toast("Printing isn’t available here. Use Copy instead.")}setTimeout(done,60000)}
function shareIds(ids){if(!ids.length){toast("Nothing to share");return}const url=location.href.split("#")[0]+"#share="+ids.slice(0,200).join(".");
  if(navigator.share)navigator.share({title:CFG.short+" quotes",text:"My "+CFG.short+" quotes",url}).catch(()=>{});else copyText(url)}
function openShared(ids){if(!ids.length){toast("That link has no quotes in it");return}
  openSheet("Shared quotes",`<p class="intro">Someone shared ${ids.length} line${ids.length===1?"":"s"} with you. Tap one to read it in context.</p><div class="row"><button class="btn primary" id="sh-save">Add all to my notes</button></div>`+ids.map(k=>{const sp=speech[k];return `<div class="item" data-speech="${k}" tabindex="0"><small>${esc(where(sp))}</small><span style="font-family:var(--f-old)">${sp.lines.map(l=>esc(l.replace(/^~/,""))).join("<br>")}</span></div>`}).join(""));
  $("sh-save").onclick=()=>{ids.forEach(k=>{if(!(marks[k]&&marks[k].hl))saveMark(k,{hl:"fav"})});toast(`Added ${ids.length} as favourites`);$("sh-save").disabled=true}}
/* quote image card */
function quoteImage(paras,who,ref){const W=1080,H=1350,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  x.fillStyle="#f7f2e7";x.fillRect(0,0,W,H);x.strokeStyle="#1a1a1a";x.lineWidth=3;x.strokeRect(44,44,W-88,H-88);x.fillStyle="#1a1a1a";x.textAlign="center";
  const F=s=>`${s}px Georgia, "Times New Roman", serif`;
  const wrap=(fs)=>{x.font=F(fs);const L=[];paras.forEach((p,pi)=>{let l="";const t=(pi===0?"“":"")+p+(pi===paras.length-1?"”":"");t.split(/\s+/).forEach(w=>{const tt=l?l+" "+w:w;if(x.measureText(tt).width>W-240&&l){L.push(l);l=w}else l=tt});if(l)L.push(l)});return L};
  let fs=58,L=wrap(fs);while(fs>26&&L.length*fs*1.4>H-560){fs-=4;L=wrap(fs)}
  const lh=fs*1.4;let y=(H-L.length*lh)/2-40+fs;x.font=F(fs);L.forEach(l=>{x.fillText(l,W/2,y);y+=lh});
  y+=40;x.font="600 "+F(38);x.fillText("— "+who,W/2,y);x.font=F(30);x.fillStyle="#555";x.fillText(ref,W/2,y+50);
  x.font="italic "+F(28);x.fillText(CFG.title+" · William Shakespeare",W/2,H-100);return c}
function openImage(paras,who,ref){const c=quoteImage(paras,who,ref),url=c.toDataURL("image/png");
  openSheet("Quote image",`<img class="qimg" src="${url}" alt="${esc(paras.join(" "))}, ${esc(who)}"><p class="muted">Press and hold the image to save it, or use the buttons.</p><div class="row"><button class="btn primary" id="qi-dl">Download</button>${navigator.share?`<button class="btn" id="qi-sh">Share</button>`:""}</div>`);
  $("qi-dl").onclick=()=>{try{const a=document.createElement("a");a.href=url;a.download=CFG.file+"-quote.png";document.body.appendChild(a);a.click();a.remove()}catch(e){}toast("Downloading. If nothing appears, press and hold the image.")};
  if($("qi-sh"))$("qi-sh").onclick=()=>c.toBlob(b=>{const f=new File([b],CFG.file+"-quote.png",{type:"image/png"});const d={files:[f],title:CFG.short+" quote"};(navigator.canShare&&navigator.canShare(d)?navigator.share(d):navigator.share({title:CFG.short+" quote",text:`“${paras.join(" ")}” — ${who}, ${ref}`})).catch(()=>{})})}
/* compare two key quotes */
function compareHTML(){const Q=QUOTES.quotes,a=Q[cmp[0]],b=Q[cmp[1]];
  const sel=i=>`<label class="sr" for="cmp${i}">Quote ${i+1}</label><select id="cmp${i}" data-cmp="${i}">${Q.map(q=>`<option value="${q.i}"${q.i===cmp[i]?" selected":""}>${esc(title(speech[q.id].who))}: ${esc(q.text.slice(0,50))}</option>`).join("")}</select>`;
  const card=(q,i)=>{const sp=speech[q.id];return `<div>${sel(i)}<blockquote>“${esc(q.text)}”</blockquote><small>${esc(where(sp))}</small><p>${esc(q.note)}</p>${EX.why[q.i]?`<p><b>Why it matters:</b> ${esc(EX.why[q.i])}</p>`:""}<p class="muted">${q.themes.map(t=>esc(QUOTES.themes[t][0])).join(" · ")}</p>${chip(q.id)}</div>`};
  const sa=speech[a.id],sb=speech[b.id],pa=sceneOf(a.id),pb=sceneOf(b.id),sh=a.themes.filter(t=>b.themes.includes(t)).map(t=>QUOTES.themes[t][0]);
  const pr=[];if(sa.who===sb.who)pr.push(`Both are spoken by ${title(sa.who)}. What has changed in them between ${sName(pa)} and ${sName(pb)}, and what caused it?`);
  else pr.push(`How do ${title(sa.who)} and ${title(sb.who)} see things differently here? Whose view does the audience trust, and why?`);
  if(sh.length)pr.push(`Both are about ${sh.join(" and ").toLowerCase()}. How does Shakespeare's presentation of this differ between the two?`);else pr.push(`They share no main theme. Is there a link in imagery, tone or situation you could use to connect them?`);
  pr.push(`Compare the language: look at the imagery, the length of the sentences and whether each speaker uses verse or prose.`);
  return `<p class="intro">Pick any two key quotes. Comparing them is a quick way to build an essay paragraph.</p><div class="cmp">${card(a,0)}${card(b,1)}</div><div class="exitem"><b>Shared themes</b><p>${sh.length?esc(sh.join(", ")):"None"}</p></div><div class="exitem"><b>Questions to answer</b><ul>${pr.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`}
function jumpLine(v){const m=String(v).trim().match(/^(\d)\D+(\d)\D+(\d+)$/);if(!m){toast("Type act, scene and line, like 3.3.165");return}
  const p=scenes.find(x=>x.act===+m[1]&&x.sc===+m[2]);if(!p){toast("No such scene");return}const ln=+m[3];
  const sp=p.items.find(i=>i.t==="sp"&&ln>=i.start&&ln<i.start+i.lines.length)||p.items.filter(i=>i.t==="sp").pop();
  closeSheet();const li=Math.max(0,Math.min(sp.lines.length-1,ln-sp.start));goScene(sIdx(p.id),{key:sp.id+":"+li});
  setTimeout(()=>{const pi=partsOf(sp).findIndex(q=>li>=q[0]&&li<=q[1]);const el=pg.querySelector(`.sp[data-id="${sp.id}"] .pt[data-p="${pi}"]`);if(el){el.classList.add("pulse");setTimeout(()=>el.classList.remove("pulse"),3400)}},300)}
/* Settings › How to read: one short line per gesture, in four groups (same guidance as before 3.1.1, split up) */
const HOWTO=[["Turning pages",[["⇆","Swipe left or right","turn the page (arrow keys or scroll wheel on a computer)"],["☰","Tap empty space","show or hide the menus"],["⟷","Drag the page slider","preview pages (bottom menu)"]]],
  ["Understanding",[["¶","Tap a line","its modern English opens underneath; tap again to fold it"],["⋯","Whole speech","long speeches come in parts; this shows the rest"],["<u>a</u>","Tap an underlined word","its meaning"],["Aa","Tap a character’s name","who they are, with links to Study"],["❦","Tap ❦ or “note”","the key quote or study note for that line"]]],
  ["Marking",[["✎","Press and hold a word","selects it; keep dragging, or drag the ink-drop handles, to take in more words"],["◐","Tap an ink","marks the words at once (Undo in the message); the same ink again removes the mark"],["¶","Press and hold a name","selects the whole speech (right-click on a computer)"],["✐","Press and hold an ink","rename it, for every play"],["⋯","Note, Copy, More","in the same pill; More opens Speech tools"]]],
  ["Text size",[["⤢","Pinch with two fingers","change the text size (or use Text size above)"]]]];
/* 4.3 settings icons, picked by each option's label */
const SETI=[['<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',/./],
  ['<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',/App mode/],
  ['<path d="M12 6.5C10 5 7.2 4.5 3.5 4.8v13.4c3.7-.3 6.5.2 8.5 1.8 2-1.6 4.8-2.1 8.5-1.8V4.8C16.8 4.5 14 5 12 6.5zM12 6.5V20"/>',/On the page/],
  ['<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',/Theme/],['<path d="M4 19 9 5l5 14M6 14h6M15 19l3-8 3 8M16 16.5h4"/>',/Text size/],
  ['<path d="M4 6h12M4 12h16M4 18h10M20 4v4M18 6h4"/>',/spacing/],['<path d="M5 5h14v14H5z"/><path d="M9 9h6"/>',/Clean/],['<path d="M8 11V5a2 2 0 0 1 4 0v5l5 1a2 2 0 0 1 1.6 2.3L18 20H9l-4-5a1.8 1.8 0 0 1 2.6-2.4z"/>',/One-hand/],
  ['<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/>',/Page turn/],['<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',/Dim/],['<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.5c1.5 1.5 3.4 2.3 5.5 2.3s4-.8 5.5-2.3V11"/>',/Exam/],
  ['<path d="M14.5 4.5l5 5-8.5 8.5H6v-5z"/><path d="M4 20h8"/>',/^Marks/],['<path d="M4 20c4-1 4-6 8-7s4-6 8-7"/><circle cx="4" cy="20" r="1.6"/><circle cx="20" cy="6" r="1.6"/>',/beats/i],['<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/>',/Argument/],['<circle cx="9" cy="8" r="3.5"/><path d="M3 20c1-4 3-6 6-6s5 2 6 6M17 8h4M19 6v4"/>',/Follow/],
  ['<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17v.5"/>',/How to/],['<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>',/[Bb]ackup/],['<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',/Progress/]];
let SETTAB="page";
/* 4.5 Fit verse: the largest size (≥14px) at which about 90% of this play's verse lines fit on one line of the page */
function openSettings(){
  const segs=(name,opts,val)=>`<div class="segs" data-set="${name}">`+opts.map(([v,l])=>`<button data-v="${v}" aria-pressed="${String(val)===String(v)}">${l}</button>`).join("")+`</div>`;
  const whoOpts=[...whoSet].sort((a,b)=>{const o=Object.keys(COLORS),ia=o.indexOf(a),ib=o.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b)});
  openSheet("Settings",`
    <div class="spv" aria-hidden="true"><div class="spvp"><span class="spvn">${esc(title([...whoSet][0]||""))}</span><span class="spvl">${esc(((scenes[0].items.find(x=>x.t==="sp")||{lines:[""]}).lines[0]||"").replace(/^~/,""))}</span><span class="spvm">Live preview of your page</span></div></div>
    <div class="opt"><div class="lbl">App mode, for every play</div>${segs("appmode",[["simple","Simple"],["full","Full"]],folioMode())}<small>Simple: three tabs, a journey map, quests and a calmer page. Full: every tool, four tabs, line numbers and study notes.</small></div>
    <div class="opt"><div class="lbl">On the page</div>${segs("mode",[["orig","Shakespeare only"],["both","Both"],["mod","Modern only"]],S.mode)}<small>With Shakespeare only, tap any line and its modern English opens underneath. On a tablet, Both puts the two side by side.</small></div>
    <div class="opt"><div class="lbl">Theme, for every play</div><div class="ttiles" id="s-tiles"></div><button class="tog" id="s-night" role="switch" type="button"><span>Night after 8pm<small>Switches to Night from 8pm to 7am</small></span><i></i></button><small>Paper is a warm, matte page like an e-reader. Night is warm and dim for reading in bed.</small></div>
    <div class="opt"><div class="lbl">Text size, for every play</div><div class="size"><span style="font-size:15px">A</span><label class="sr" for="s-size">Text size</label><input type="range" id="s-size" min="0" max="3" step="1"><span style="font-size:26px">A</span></div><p class="sprev" id="s-prev"></p></div>
    <div class="opt"><div class="lbl">Fit verse lines</div>${segs("fit",[["true","On"],["false","Off"]],S.fit)}<small>Sets Shakespeare's verse just small enough that most lines fit on one line (never under 14px), so the rhythm stays visible. Prose follows the same size.</small></div>
    <div class="opt"><div class="lbl">Line spacing</div>${segs("lh",[["1.4","Compact"],["1.55","Normal"],["1.8","Airy"]],S.lh)}</div>
    <div class="opt"><div class="lbl">Clean page</div>${segs("clean",[["false","Off"],["true","On"]],S.clean)}<small>Hides line numbers, tags and underlines for pure reading. Tapping still works.</small></div>
    <div class="opt"><div class="lbl">Marks on the page, for every play</div>${segs("mkview",[["full","Full"],["ticks","Ticks only"],["off","Off"]],S.mkview)}<small>Full: a soft ink band behind marked words and a tick in the margin. Ticks only: just the tick. Off: a clean page; your marks stay in My notes.</small></div>
    <div class="opt"><div class="lbl">One-hand page turns</div>${segs("onehand",[["false","Off"],["true","On"]],S.onehand)}<small>Tap the bottom-left or bottom-right corner to turn pages.</small></div>
    <div class="opt"><div class="lbl">Page turn</div>${segs("turn",[["curl","Curl"],["slide","Slide"],["instant","Instant"]],S.turn)}<small>Curl: hold the page near its outer edge or a corner and drag; it bends and turns like paper. Taps and swipes curl too. Instant changes pages with no motion, like an e-reader (Slide is also instant in Paper themes).</small></div>
    <div class="opt"><label for="focsel" class="lbl">Dim everyone except</label><select id="focsel"><option value="">Nobody (show all normally)</option>${whoOpts.map(w=>`<option value="${esc(w)}"${S.focus===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select><small>Other speakers stay on the page but fade, so you can follow one voice.</small></div>
    <div class="opt"><div class="lbl">Exam level</div>${segs("level",[["g","GCSE"],["a","A-level"]],aoLevel())}<small>Sets the assessment objectives used to mark your writing in Study. A-level adds connections (AO4) and interpretations (AO5). Applies to every play.</small></div>
    <div class="opt"><div class="lbl">Story beats</div>${segs("beats",[["true","On"],["false","Off"]],S.beats)}<small>A thin rule with a one-line note where the action turns, so you always know what is happening. Also listed under Contents › Beats. Hidden on a clean page.</small></div>
    <div class="opt"><div class="lbl">The Argument at the end of each scene</div>${segs("sum",[["true","Show"],["false","Hide"]],S.sum)}</div>
    <div class="opt"><label for="whosel" class="lbl">Follow one character</label><select id="whosel"><option value="">Everyone</option>${whoOpts.map(w=>`<option value="${esc(w)}"${S.who===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select></div>
    <div class="opt howto"><div class="lbl">How to read</div>${HOWTO.map(([g,rows],gi)=>`<details${gi?"":" open"}><summary>${g}</summary><ul>${rows.map(([ic,b,t])=>`<li><span class="hic" aria-hidden="true">${ic}</span><span><b>${b}</b>${t}</span></li>`).join("")}</ul></details>`).join("")}</div>
    ${backupHTML()}
    <div class="opt"><div class="lbl">Progress</div><button class="btn" id="resetprog">Reset reading progress, quiz scores and flashcards</button><small id="resetmsg"></small></div>`);
  $("sheet-body").querySelectorAll("[data-set] button").forEach(b=>b.onclick=()=>{const k=b.parentNode.dataset.set;let v=b.dataset.v;if(k==="appmode"){folioSetMode(v);$("sheet-body").querySelectorAll(`[data-set="appmode"] button`).forEach(x=>x.setAttribute("aria-pressed",x===b));show(view);if(view==="study")renderStudy();if(view==="you")renderYou();if(view==="map")renderMap();cur.sig="";repaginate();toast(v==="simple"?"Simple mode":"Full mode");return}
    if(k==="level"){LS.set("folio-level",v);$("sheet-body").querySelectorAll(`[data-set="level"] button`).forEach(x=>x.setAttribute("aria-pressed",x===b));if(view==="study")renderStudy();toast(v==="a"?"Marking: A-level":"Marking: GCSE");return}
    if(k==="scale"||k==="lh")v=parseFloat(v);if(k==="sum"||k==="clean"||k==="onehand"||k==="beats"||k==="fit")v=v==="true";S[k]=v;applySettings();$("sheet-body").querySelectorAll(`[data-set="${k}"] button`).forEach(x=>x.setAttribute("aria-pressed",x===b));repaginate()});
  /* 4.5: Settings in four tabs, the live preview pinned on top */
  {const sb=$("sheet-body"),TABS=[["page","Page"],["type","Type"],["theme","Theme"],["app","App"]],TOF=[["theme",/^Theme/],["type",/^Text size|^Line spacing|^One-hand|^Page turn/],["page",/^On the page|^Marks|^Clean|^Dim|^Story beats|^The Argument|^Follow/]];
    sb.querySelectorAll(":scope>.opt,:scope>.box").forEach(o=>{const l=o.querySelector(".lbl,h3"),t=l?l.textContent.trim():"",f=TOF.find(x=>x[1].test(t));o.dataset.stab=f?f[0]:"app"});
    sb.querySelector(".spv").insertAdjacentHTML("afterend",`<div class="stabs" role="tablist">${TABS.map(([k,l])=>`<button type="button" role="tab" data-stb="${k}" aria-selected="${k===SETTAB}">${l}</button>`).join("")}</div>`);
    const showT=k=>{SETTAB=k;sb.dataset.st=k;sb.querySelectorAll("[data-stb]").forEach(b=>b.setAttribute("aria-selected",b.dataset.stb===k))};showT(SETTAB);
    sb.querySelectorAll("[data-stb]").forEach(b=>b.onclick=()=>showT(b.dataset.stb))}
  $("sheet-body").querySelectorAll(".opt>.lbl").forEach(l=>{const t=l.textContent,k=SETI.slice(1).find(x=>x[1].test(t));l.insertAdjacentHTML("afterbegin",`<svg class="seti" viewBox="0 0 24 24" aria-hidden="true">${k?k[0]:SETI[0][0]}</svg>`)});
  const TN={paper:"Paper",light:"Light",dark:"Dark",night:"Night"},SZN=["Small","Normal","Large","Extra large"];
  const paint=()=>{const c=folioThemeChosen(),th=c==="auto"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):c;
    $("s-tiles").innerHTML=FOLIO_THEMES.map(t=>`<button class="tt tt-${t}" type="button" data-th="${t}" aria-pressed="${t===th}"><span class="sw2">A<em>a</em></span><span class="tl">${TN[t]}</span></button>`).join("");
    $("s-night").setAttribute("aria-checked",folioNightAuto());
    let bi=0;SIZES.forEach((z,i)=>{if(Math.abs(z-S.scale)<Math.abs(SIZES[bi]-S.scale))bi=i});$("s-size").value=bi;$("s-size").setAttribute("aria-valuetext",SZN[bi]);$("s-prev").innerHTML=`<b>${SZN[bi]}.</b> Now is the winter of our discontent`};
  paint();
  $("s-tiles").onclick=e=>{const b=e.target.closest("[data-th]");if(!b)return;S.theme=b.dataset.th;applySettings();paint()};
  $("s-night").onclick=()=>{LS.set("folio-nightauto",folioNightAuto()?"0":"1");applySettings();paint()};
  $("s-size").oninput=e=>{S.scale=SIZES[+e.target.value];applySettings();paint();repaginate()};
  $("whosel").onchange=e=>{S.who=e.target.value;repaginate()};
  $("focsel").onchange=e=>{S.focus=e.target.value;applySettings();refreshMarks()};
  wireBackup(()=>{if(view==="you")renderYou();refreshMarks()});
  let armed=false;$("resetprog").onclick=()=>{if(!armed){armed=true;$("resetmsg").textContent="Tap again to confirm. Your notes are kept.";return}prog={done:{},quiz:{},cards:{},srs:{},miss:{q:[],c:{},s:{}},conf:{},exam:prog.exam};saveProg();REV={it:{},cal:[]};saveRev();$("resetmsg").textContent="Progress reset.";armed=false;if(view==="you")renderYou()};
}
$("b-home").onclick=()=>folioSimple()?goMap():openContents();$("b-where").onclick=()=>openContents("scenes");$("b-search").onclick=()=>openSearch("");$("b-set").onclick=openSettings;$("b-bm").onclick=toggleBM;

/* ---------- 4.0: seals, levels, quests, the journey map, first-scene tips ---------- */
/* seals: a red seal for each scene read, a gilt one when all of a scene's quests are done. The level counts seals across every play
   (this play from prog, the others from the sl field each play keeps in its folio-stat-<id>; the shelf refreshes those). */
const goal=()=>{const g=LS.get("folio-goal");return g==="enjoy"||g==="exam"?g:"both"};
const ownSeals=()=>folioSealsOf(prog);
function allSeals(){let n=ownSeals();try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||!k.startsWith("folio-stat-")||k==="folio-stat-"+PLAY)continue;let v=null;try{v=JSON.parse(localStorage.getItem(k))}catch(e){}if(v&&+v.sl>0)n+=Math.floor(+v.sl)}}catch(e){}return n}
function syncSeals(before){try{const st=JSON.parse(LS.get("folio-stat-"+PLAY)||"null");if(st){st.sl=ownSeals();LS.set("folio-stat-"+PLAY,JSON.stringify(st))}}catch(e){}
  if(before!=null){const a=folioLevel(before),b=folioLevel(allSeals());if(b.i>a.i)setTimeout(()=>toast("New level: "+b.name),900)}}
/* quests (prog.qst[scene] = {r, q:[right,of], k, g}): Recap, a three-question Check, Key quotes; whichever the scene has content for */
const QL={r:["Recap","What happened, in a minute","❧"],q:["Check","Three quick questions","?"],k:["Key quotes","The lines to know","❦"]};
function questsOf(s){const x=STUDY.scenes[s]||{},Q=[];if(x.sum)Q.push("r");if((x.quiz||[]).length)Q.push("q");if(QUOTES.quotes.some(q=>speech[q.id].page===s))Q.push("k");return Q}
function questDone(s,k,v){if(sIdx(s)<0||!QL[k])return;const b4=allSeals(),o=prog.qst[s]=prog.qst[s]||{};o[k]=v||1;const all=questsOf(s).every(q=>o[q]),fresh=all&&!o.g;if(all)o.g=1;saveProg();syncSeals(b4);
  if(fresh)toast("All quests done · a gilt seal for "+sName(scenes[sIdx(s)]));if(view==="map")renderMap();else if(view==="study"&&SH)renderStudy();else if(view==="you")renderYou();else refreshMarks()}
function questsHTML(s){const o=prog.qst[s]||{},Q=questsOf(s);if(!Q.length)return "";
  return `<div class="quests">${Q.map(k=>`<button class="qst${o[k]?" done":""}" type="button" data-quest="${k}:${s}"><span class="qi" aria-hidden="true">${o[k]?"✓":QL[k][2]}</span><span class="qx"><b>${QL[k][0]}</b><small>${k==="q"&&Array.isArray(o.q)?`${esc(o.q[0])} of ${esc(o.q[1])} right`:QL[k][1]}</small></span></button>`).join("")}</div>`}
function openQuest(k,s){const p=scenes[sIdx(s)];if(!p)return;const x=STUDY.scenes[s]||{};
  if(k==="q"){openCheck(s);return}
  if(k==="r"){openSheet("Recap",`<p class="eyebrow">${sName(p)} · ${esc(shortLoc(p))}</p><p class="recap">${esc(x.sum||"")}</p>${(x.key||[]).length?`<ul>${x.key.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>`:""}<div class="row"><button class="btn primary" data-qdone="r:${s}">Got it ✓</button></div><div class="xrow">${toLink("study:acts?a="+p.act+"&s="+s,"Act summary")}${toLink("scene:"+s,"Read the scene again")}</div>`);return}
  if(k==="k"){const qs=QUOTES.quotes.filter(q=>speech[q.id].page===s);openSheet("Key quotes",`<p class="eyebrow">${sName(p)}</p>${qs.map(quoteHTML).join("")}<div class="row"><button class="btn primary" data-qdone="k:${s}">I know these ✓</button></div><div class="xrow">${toLink("study:cards","Practise as flashcards")}</div>`)}}
/* the three-question check, in a sheet (questions from the scene quiz) */
let ck=null;
function openCheck(s){const all=((STUDY.scenes[s]||{}).quiz||[]).map(q=>Object.assign({s},q));if(!all.length)return;
  ck={s,qs:shuf(all).slice(0,3).map(q=>{const ix=shuf(q.o.map((_,i)=>i));return Object.assign({},q,{o:ix.map(i=>q.o[i]),a:ix.indexOf(q.a)})}),i:0,ok:0,ans:null,saved:false};renderCheck()}
function renderCheck(){const p=scenes[sIdx(ck.s)],n=ck.qs.length;
  if(ck.i<n){const q=ck.qs[ck.i];
    openSheet("Check yourself",`<div class="qz ck"><div class="qn">${sName(p)} · question ${ck.i+1} of ${n}</div><h3>${esc(q.q)}</h3><div class="opts">${q.o.map((o,i)=>`<button type="button" data-ck="${i}"${ck.ans!=null?" disabled":""} class="${ck.ans!=null?(i===q.a?"right":i===ck.ans?"wrong":""):""}">${esc(o)}</button>`).join("")}</div>
      ${ck.ans!=null?`<p class="ckfb">${ck.ans===q.a?"Right.":"Not quite: the right answer is marked."}</p><div class="row"><button class="btn primary" data-cknext="1">${ck.i+1<n?"Next question":"See your result"}</button></div>`:""}</div>`);return}
  if(!ck.saved){ck.saved=true;questDone(ck.s,"q",[ck.ok,n])}
  const nx=scenes[sIdx(ck.s)+1],o=prog.qst[ck.s]||{};
  openSheet("Check yourself",`<div class="ckres">${folioSeal(p.scene,o.g?"g":"","bigseal stamp")}<div class="big">${ck.ok} of ${n}</div><p>${ck.ok===n?"All right. Well read.":ck.ok?"Good. The ones you missed are saved for Review in Study.":"These are saved for Review in Study. The scene summary will help."}</p>
    <div class="row">${nx?`<button class="btn primary" data-go="${nx.id}">Next: ${sName(nx)} ›</button>`:""}<button class="btn" data-ckagain="1">Try again</button></div><div class="xrow">${toLink("study:quiz?s="+ck.s,"Whole scene quiz")}${o.r?"":toLink("study","Other quests")}</div></div>`)}
sheet.addEventListener("click",e=>{
  const c=e.target.closest("[data-ck]");if(c&&ck&&ck.ans==null){const q=ck.qs[ck.i];ck.ans=+c.dataset.ck;const M=prog.miss.q,ix=M.findIndex(m=>m.q===q.q);
    if(ck.ans===q.a){ck.ok++;if(ix>=0)M.splice(ix,1)}else if(ix<0)M.push({q:q.q,o:q.o,a:q.a,s:q.s});saveProg();renderCheck();return}
  if(e.target.closest("[data-cknext]")&&ck){ck.i++;ck.ans=null;renderCheck();return}
  if(e.target.closest("[data-ckagain]")&&ck){openCheck(ck.s);return}
  const d=e.target.closest("[data-qdone]");if(d){const [k,s]=d.dataset.qdone.split(":");closeSheet();questDone(s,k);toast(QL[k][0]+" done");return}
  const q=e.target.closest("[data-quest]");if(q){const [k,s]=q.dataset.quest.split(":");openQuest(k,s);return}
  const st=e.target.closest("[data-stop]");if(st)openStop(st.dataset.stop)});
document.addEventListener("click",e=>{const q=e.target.closest("#sbody [data-quest],#mapbody [data-quest],#contcard [data-quest]");if(q){const [k,s]=q.dataset.quest.split(":");openQuest(k,s)}});
/* the journey map: the play as a road of scenes, act plates as gates, a seal at every scene read */
const MAPX=[50,72,84,70,46,24,14,28];
/* 4.3 journey map: each act a region of landscape (tint + terrain drawing), act plates set between gate pillars, a pin where you are */
const TERR=[
  '<svg class="terr" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 120V84Q40 58 80 80T160 72Q200 50 240 74T300 70V120Z"/><path class="t2" d="M0 120V100Q50 86 100 98T200 94Q250 84 300 96V120Z"/><g class="tl"><path d="M40 78v-14M34 70l6-8 6 8M232 74v-14M226 66l6-8 6 8"/></g></svg>',
  '<svg class="terr" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="tl"><path d="M20 112l12-30 12 30zM44 112l10-24 10 24zM250 112l12-32 12 32zM272 112l9-22 9 22zM32 112v6M54 112v6M262 112v6M281 112v6"/></g><path class="t2" d="M0 120V112H300V120Z"/></svg>',
  '<svg class="terr" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g class="tl"><path d="M0 96q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0M0 108q10-6 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0 20 0"/><path d="M226 88l18-2-2-20-14 14zM244 66v22M232 92h28l-4 6h-20z"/></g></svg>',
  '<svg class="terr" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path class="t2" d="M0 120V108H300V120Z"/><g class="tl"><path d="M14 108V70h8v-6h6v6h8v-6h6v6h8v38zM28 108V94a4 4 0 0 1 8 0v14M246 108V60h10v-8h6v8h10v48zM256 76h6v8h-6z"/></g></svg>',
  '<svg class="terr" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><path d="M0 120V96L30 70 56 90 90 54 128 92 150 80 170 94H300V120Z"/><g class="tl"><path d="M90 54l-8 10 8-3 8 3zM250 94c0-10 8-16 16-16s16 6 16 16"/></g></svg>'];
const GATE='<svg class="gpil" viewBox="0 0 20 80" aria-hidden="true"><path class="gp1" d="M3 78V14h14v64zM1 14h18v-4H1zM4 10q6-10 12 0"/><path class="gp2" d="M6 20v52M14 20v52"/><circle class="gp3" cx="10" cy="5" r="3"/></svg>';
const PIN='<svg class="mpin" viewBox="0 0 30 40" aria-hidden="true"><path class="pn1" d="M15 39C6 26 2 20 2 14a13 13 0 0 1 26 0c0 6-4 12-13 25z"/><circle class="pn2" cx="15" cy="14" r="5.5"/></svg>';
/* 4.4: seals earned since the map was last drawn (this visit) stamp in */
let MAPSEEN=null;
function renderMap(){const here=pos&&sIdx(pos.s)>=0?sIdx(pos.s):-1,lp=here>=0?scenes[here]:scenes[0],done=scenes.filter(p=>prog.done[p.id]).length,all=allSeals(),L=folioLevel(all),gl=goal();
  $("map").querySelector(".sbar h1").textContent=folioSimple()?"Play":"Journey";
  let h=`<div class="minfo"><div class="mhead"><span class="memb enr">${typeof emblemSVG==="function"?emblemSVG(PLAY,"emb"):""}</span><div><p class="eyebrow">${esc(CFG.pre||"")}</p><h2>${esc(CFG.h1||CFG.title)}</h2>${CFG.post?`<p class="mpost">${esc(CFG.post)}</p>`:""}</div></div>
    <button class="go mgo" type="button" data-to="read"><small>${pos?"Continue reading":"Begin the play"}</small><b>${sName(lp)}</b><span>${esc(shortLoc(lp))}</span></button>
    <div class="mprog"><span><b>${done}</b> of ${scenes.length} scenes sealed</span><button class="mlv" type="button" data-to="you">${folioLevelBadge(all)}<span>${esc(L.name)}</span></button></div><div class="mbar" aria-hidden="true"><i style="width:${done/scenes.length*100}%"></i></div>
    <div class="xrow mlinks">${toLink("study",folioSimple()?"Quests &amp; study":"Study")}${toLink("contents","Contents")}</div>
    </div><div class="mapw" id="mapw"><svg class="mpath" id="mpath" aria-hidden="true"></svg>`;
  let j=0,ri=0;
  for(const a of ACTS){const ps=scenes.filter(p=>p.act===a);if(!ps.length)continue;const rk=ri++%5;
    h+=`<section class="mreg rg${rk}">${TERR[rk]}<div class="mgate">${GATE}${folioPlate(LAT[a],a?R[a]:"",`${AN(a)} · ${ps.filter(p=>prog.done[p.id]).length} of ${ps.length} sealed`,"mplate")}${GATE}</div>`;
    h+=`<ol class="stops">`+ps.map(p=>{const k=sIdx(p.id),d=prog.done[p.id],o=prog.qst[p.id]||{},Q=questsOf(p.id),x=MAPX[j++%MAPX.length];
      const pips=d&&Q.length&&gl!=="enjoy"?`<span class="pips" title="Quests">${Q.map(q=>`<i class="${o[q]?"on":""}"></i>`).join("")}<em>${Q.filter(q=>o[q]).length} of ${Q.length} quests</em></span>`:"";
      return `<li style="--x:${x}"${x>60?` class="r"`:""}><button class="stop${d?" done":""}${k===here?" here":""}" type="button" data-stop="${p.id}">${k===here?PIN:""}${d?folioSeal(p.scene,o.g?"g":"",MAPSEEN&&!MAPSEEN.has(p.id+(o.g?"g":""))?"stamp":""):folioSeal(p.scene,k===here?"n":"e")}<span class="sl"><b>Scene ${p.scene.toLowerCase()}${k===here?`<em>You are here</em>`:""}</b><small>${esc(shortLoc(p))}</small>${pips}</span></button></li>`}).join("")+`</ol></section>`}
  h+=`<div class="mend">${folioSeal("❦",done===scenes.length?"g":"e","mfin")}<b>Finis</b></div></div>`;
  $("mapbody").innerHTML=h;MAPSEEN=new Set(scenes.filter(p=>prog.done[p.id]).map(p=>p.id+((prog.qst[p.id]||{}).g?"g":"")));requestAnimationFrame(drawPath)}
function drawPath(){const w=$("mapw"),sv=$("mpath");if(!w||!sv||view!=="map")return;const b=w.getBoundingClientRect();
  const nodes=[...w.querySelectorAll(".stop .seal,.mfin")],pts=nodes.map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.left+r.width/2-b.left),Math.round(r.top+r.height/2-b.top)]});
  const last=nodes.reduce((m,e,i)=>e.closest(".stop.done")?i:m,-1);
  const path=ps=>ps.length<2?"":"M"+ps[0].join(" ")+ps.slice(1).map((p,i)=>{const a=ps[i],my=(a[1]+p[1])/2;return `C${a[0]} ${my} ${p[0]} ${my} ${p[0]} ${p[1]}`}).join("");
  sv.setAttribute("viewBox",`0 0 ${Math.round(b.width)} ${Math.round(b.height)}`);sv.setAttribute("width",Math.round(b.width));sv.setAttribute("height",Math.round(b.height));
  sv.innerHTML=`<path class="road" d="${path(pts)}"/>${last>0?`<path class="walked" d="${path(pts.slice(0,last+1))}"/>`:""}`}
addEventListener("resize",()=>{if(view==="map")requestAnimationFrame(drawPath)});
$("mapbody").addEventListener("click",e=>{const s=e.target.closest("[data-stop]");if(s)openStop(s.dataset.stop)});
$("m-search").onclick=()=>openSearch("");
/* a stop on the map: the scene's stage, who is in it, read it, and its quests once read */
function openStop(id){const p=scenes[sIdx(id)];if(!p)return;const d=prog.done[id],k=stageType(p),here=pos&&pos.s===id;
  openSheet(sName(p),`${folioStage(PICS[k],(EX.place[p.id]?EX.place[p.id]+" · ":"")+(EX.stage[k]||""),"stopstage",skyOf(p))}<p class="hcap">${esc(p.loc)}</p>${!d&&preQ(p)?`<div class="preq"><b>Read to find out</b>${esc(preQ(p))}</div>`:""}
    <h3 class="lbl">On stage</h3>${onStage(p)}<div class="row">${here?`<button class="btn primary" type="button" data-to="read">Carry on reading</button>`:`<button class="btn primary" type="button" data-go="${id}">${d?"Read it again":"Read this scene"}</button>`}</div>
    ${d?`<h3 class="lbl">Quests</h3>${questsHTML(id)||`<p class="muted">No quests for this scene.</p>`}`:`<p class="muted">Read the scene to seal it and unlock its quests.</p>`}`)}
/* first scene, Simple mode: four tips, one at a time, each done when you do it (folio-tips = tips seen; once per app) */
const COACH=[["Tap any line","Its modern English opens underneath. Tap it again to fold it away."],["Tap an underlined word","A short meaning pops up."],["Swipe to turn the page","Or tap near the right-hand edge."],["Tap the middle of the page","The menus appear: Contents, Search, Settings and the Play tab."]];
let coachN=Math.max(0,+LS.get("folio-tips")||0);
function coachSave(){LS.set("folio-tips",String(coachN));if(coachN>=COACH.length)LS.set("folio-hint","1")}
function coach(){const old=$("coach");if(old)old.remove();if(!folioSimple()||coachN>=COACH.length||view!=="reader")return;const c=COACH[coachN],d=document.createElement("div");d.id="coach";d.className="coach";d.setAttribute("role","status");
  d.innerHTML=`<span class="cn">Tip ${coachN+1} of ${COACH.length}</span><b>${c[0]}</b><span class="ct">${c[1]}</span><div class="cb"><button class="link" type="button" data-c="skip">No more tips</button><button class="btn primary" type="button" data-c="ok">Got it</button></div>`;
  $("reader").appendChild(d);["pointerdown","pointerup"].forEach(ev=>d.addEventListener(ev,e=>e.stopPropagation()));
  d.onclick=e=>{const b=e.target.closest("[data-c]");if(!b)return;coachN=b.dataset.c==="skip"?COACH.length:coachN+1;coachSave();coach()}}
function coachDid(n){if(coachN===n&&folioSimple()&&view==="reader"){coachN++;coachSave();const o=$("coach");if(o)o.remove();setTimeout(coach,900)}}
/* the level card (You / Me) */
function levelHTML(){const all=allSeals(),L=folioLevel(all);
  return `<div class="lvcard"><span class="lvm2">${folioLaurel()}${folioLevelBadge(all,"lvbig")}</span><div class="lvt"><small>Your level · every play</small><b>${esc(L.name)}</b><span>${esc(L.line)}</span><span class="meter"><i style="width:${Math.round(L.frac*100)}%"></i></span><em>${all} seal${all===1?"":"s"}${L.next?` · ${L.need} more to ${esc(L.next)}`:""}</em>${YTIME}</div></div>
    <div class="ystrip" aria-label="Seals in this play">${ACTS.map(a=>`<div><small>${AN(a)}</small><span>${scenes.filter(p=>p.act===a).map(p=>`<button type="button" data-stop="${p.id}" aria-label="${sName(p)}">${folioSeal(p.scene,prog.done[p.id]?((prog.qst[p.id]||{}).g?"g":""):"e","mini")}</button>`).join("")}</span></div>`).join("")}</div>`}
$("you").addEventListener("click",e=>{const s=e.target.closest("[data-stop]");if(s)openStop(s.dataset.stop)});

/* ---------- first-run hint ---------- */
/* once per app (folio-hint), not once per play: three short steps, Folio style */
function hint(){if(folioSimple()){coach();return}if(LS.get("folio-hint")||LS.get(PFX+"hint4")||view!=="reader")return;const d=document.createElement("div");d.className="hint";d.setAttribute("role","dialog");d.setAttribute("aria-label","How to read");
  d.innerHTML=`<p class="eyebrow">How to read</p><ol><li><b>Swipe</b> or tap the page edge to turn the page.</li><li><b>Tap a line</b> and its modern English opens under it. Tap a dotted word for its meaning.</li><li><b>Tap empty space</b> for the menus. Press and hold a word to mark it.</li></ol><button class="btn primary">Begin</button>`;
  $("reader").appendChild(d);d.addEventListener("pointerup",e=>e.stopPropagation());d.querySelector("button").onclick=()=>{d.remove();LS.set("folio-hint","1")}}

/* ---------- start ---------- */
applySettings();
route();
