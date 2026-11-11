/* Folio reader: shared by every play. Each play page loads <play>/play.js first (CFG + content consts:
   DATA, STUDY, PARTS, QUOTES, EX, EXT, MAINS, COLORS, PICS), then this file. */
const partsOf=it=>PARTS[it.id]||[[0,it.lines.length-1,it.m]];
const SOLO=EX.solo;
const roman={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12,XIII:13,XIV:14,XV:15}, R=["","I","II","III","IV","V"];
const LAT=["Inductio","Actus Primus","Actus Secundus","Actus Tertius","Actus Quartus","Actus Quintus"],SL={I:"Scena Prima",II:"Scena Secunda",III:"Scena Tertia",IV:"Scena Quarta",V:"Scena Quinta",VI:"Scena Sexta",VII:"Scena Septima",VIII:"Scena Octava",IX:"Scena Nona",X:"Scena Decima",XI:"Scena Undecima",XII:"Scena Duodecima",XIII:"Scena Tertia Decima",XIV:"Scena Quarta Decima",XV:"Scena Quinta Decima"};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const title=w=>String(w||"").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/(.) (Of|And|The) /g,(m,a,b)=>a+" "+b.toLowerCase()+" ");
const $=id=>document.getElementById(id);
const PLAY=CFG.id,PFX=CFG.prefix,FSH={};["lh","clean","onehand","show","size","theme","sumon","turn","beats"].forEach(k=>FSH[PFX+k]=1);
const LS={key(k){return FSH[k]?"folio-"+k.slice(PFX.length):k},get(k){try{const v=localStorage.getItem(LS.key(k));return v!==null?v:localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(LS.key(k),v)}catch(e){}}};
LS.set("folio-last",PLAY);
/* before 2.9.0 shared settings from plays whose prefix isn't 4 characters (lear-, tn-) were saved under a wrong key ("folio--theme", "folio-heme"): move them over once */
if(PFX.length!==4)try{for(const k in FSH){const bad="folio-"+k.slice(4),good=LS.key(k),v=localStorage.getItem(bad);if(v!==null&&bad!==good){if(localStorage.getItem(good)===null)localStorage.setItem(good,v);localStorage.removeItem(bad)}}}catch(e){}
const wide=()=>innerWidth>=760;
function toast(t){const el=$("toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2200)}

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
const sceneOf=id=>scenes[sIdx(speech[id].page)];
const pageWords=p=>p.items.reduce((n,it)=>n+(it.t==="sp"?it.lines.join(" ").split(/\s+/).length:0),0);

/* ---------- saved state: marks + progress (this device, and in backups) ---------- */
let marks={},prog={done:{},quiz:{},cards:{}};
try{marks=JSON.parse(LS.get(PFX+"marks")||"{}")}catch(e){}if(!marks||typeof marks!=="object"||Array.isArray(marks))marks={};
for(const k in marks){const v=marks[k];if(!v||typeof v!=="object")delete marks[k];else if(v.note!=null&&typeof v.note!=="string")v.note=String(v.note)}
/* favourite phrases: a run of words in one speech's original lines, this device (and in backups).
   {id, a:[line,word], b:[line,word], txt, note, t}; line = index into the speech's lines, word = index of a non-space run */
let FAV=[];try{FAV=JSON.parse(LS.get(PFX+"fav")||"[]")}catch(e){}if(!Array.isArray(FAV))FAV=[];
FAV=FAV.filter(f=>f&&Array.isArray(f.a)&&Array.isArray(f.b)&&f.a.length===2&&f.b.length===2&&[...f.a,...f.b].every(Number.isInteger));
const saveFav=()=>LS.set(PFX+"fav",JSON.stringify(FAV));
const favSort=()=>FAV.sort((x,y)=>x.id-y.id||x.a[0]-y.a[0]||x.a[1]-y.a[1]||x.b[0]-y.b[0]||x.b[1]-y.b[1]);
const FC=[["r","Rose"],["y","Yellow"],["g","Green"],["b","Blue"],["v","Violet"]],fcOk=c=>FC.some(x=>x[0]===c)?c:"r";
let SEL=null;/* phrase being selected on the page: {id,a,b,anc,drag,edit,c,note} */
const lineWords=l=>String(l).replace(/^~/,"").split(/\s+/).filter(Boolean);
function favText(id,a,b){const sp=speech[id];if(!sp)return "";const out=[];for(let l=a[0];l<=b[0];l++){const w=lineWords(sp.lines[l]||"");out.push(w.slice(l===a[0]?a[1]:0,l===b[0]?b[1]+1:w.length).join(" "))}return out.filter(Boolean).join(" / ")}
try{prog=Object.assign(prog,JSON.parse(LS.get(PFX+"prog")||"{}"));prog.cards=prog.cards||{}}catch(e){}
prog.srs=prog.srs||{};prog.miss=prog.miss||{q:[],c:{}};prog.conf=prog.conf||{};prog.exam=prog.exam||"";
function saveMark(id,patch){
  const v=Object.assign({},marks[id]||{},patch,{t:Date.now()}),empty=!v.hl&&!(v.note&&v.note.trim())&&!(v.th&&v.th.length);
  if(empty)delete marks[id];else marks[id]=v;LS.set(PFX+"marks",JSON.stringify(marks));refreshMarks();}
const saveProg=()=>LS.set(PFX+"prog",JSON.stringify(prog));

/* ---------- settings ---------- */
const S={lh:parseFloat(LS.get(PFX+"lh"))||1.55,focus:LS.get(PFX+"focus")||"",clean:LS.get(PFX+"clean")==="1",onehand:LS.get(PFX+"onehand")==="1",mode:LS.get(PFX+"show")||"orig",scale:parseFloat(LS.get(PFX+"size"))||1.3,theme:LS.get(PFX+"theme")||"auto",sum:LS.get(PFX+"sumon")!=="0",beats:LS.get(PFX+"beats")!=="0",turn:["slide","instant"].includes(LS.get(PFX+"turn"))?LS.get(PFX+"turn"):"curl",who:"",stab:LS.get(PFX+"stab")||"quotes"};
function applySettings(){
  const b=document.body.classList;b.remove("mode-orig","mode-mod","mode-both");b.add("mode-"+S.mode);
  document.documentElement.style.setProperty("--scale",S.scale);
  let th=S.theme;if(th==="timed"){const h=new Date().getHours();th=h>=20||h<7?"night":"auto"}if(th==="papertimed"){const h=new Date().getHours();th=h>=20||h<7?"papernight":"paper"}
  if(th==="auto")document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme",th);
  const pc=th==="auto"?"":getComputedStyle(document.documentElement).getPropertyValue("--page").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>{if(!m.dataset.c)m.dataset.c=m.content;m.content=pc||m.dataset.c});
  document.documentElement.style.setProperty("--lh",S.lh);b.toggle("focusing",!!S.focus);b.toggle("clean",S.clean);
  LS.set(PFX+"lh",S.lh);LS.set(PFX+"focus",S.focus);LS.set(PFX+"clean",S.clean?"1":"0");LS.set(PFX+"onehand",S.onehand?"1":"0");
  LS.set(PFX+"show",S.mode);LS.set(PFX+"size",S.scale);LS.set(PFX+"theme",S.theme);LS.set(PFX+"sumon",S.sum?"1":"0");LS.set(PFX+"beats",S.beats?"1":"0");LS.set(PFX+"turn",S.turn);
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
function setHash(h){if(location.hash.slice(1)!==h){try{history.replaceState(null,"","#"+h)}catch(e){}}}
document.addEventListener("touchstart",e=>{const x=e.touches[0].clientX;if((x<24||x>innerWidth-24)&&!e.target.closest("button,a,input,select,textarea,label,summary"))e.preventDefault()},{passive:false});
/* one app shell: Read / Study / You views share the Folio's bottom nav (Library goes back to the shelf) */
function show(v){view=v;$("you").hidden=v!=="you";$("reader").hidden=v!=="reader";$("study").hidden=v!=="study";closePanel();
  document.body.classList.remove("v-reader","v-study","v-you");document.body.classList.add("v-"+v);
  document.querySelectorAll("#fnav [data-nav]").forEach(b=>{if(b.dataset.nav===v)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  document.body.style.overflow=v==="reader"?"hidden":"";if(v!=="reader")document.body.classList.remove("chrome");else setTimeout(hint,400)}
function route(){
  const h=location.hash.slice(1);
  if(h.startsWith("share=")){const ids=h.slice(6).split(".").filter(i=>speech[i]);setHash("you");show("you");renderYou();openShared(ids);return}
  if(h.startsWith("sp=")){const id=h.slice(3),k=scenes.findIndex(s=>s.items.some(x=>String(x.id)===id));if(k>=0){setHash(scenes[k].id);show("reader");openScene(k,{key:id+":0",flash:true,speech:id});return}}
  if(h==="you"){show("you");renderYou();scrollTo(0,0);return}
  /* old play home (#home) and the shelf's Contents link: open the page with the Contents sheet */
  if(h==="home"||h==="contents"){goRead();setTimeout(()=>openContents("scenes"),60);return}
  if(h==="study"){show("study");renderStudy();scrollTo(0,0);return}
  if(h.startsWith("study=")){const t=h.slice(6);if(TABS.some(x=>x[0]===t)){S.stab=t;LS.set(PFX+"stab",t)}setHash("study");show("study");renderStudy();scrollTo(0,0);return}
  const k=sIdx(h);
  if(k>=0){show("reader");openScene(k,pos&&pos.s===h?{key:pos.key,keep:true}:{page:0});return}
  if(pos&&sIdx(pos.s)>=0){setHash(pos.s,false);show("reader");openScene(sIdx(pos.s),{key:pos.key,keep:true});setTimeout(pulseLast,500);return}
  goScene(0,{page:0});
}
addEventListener("hashchange",route);addEventListener("popstate",route);
function goScene(k,opts){setHash(scenes[k].id,true);show("reader");openScene(k,opts||{page:0})}
function goSpeech(id){const sp=speech[id];if(!sp)return;if(S.who&&sp.who!==S.who)S.who="";closeSheet();goScene(sIdx(sp.page),{speech:+id,flash:true})}
function goStudy(tab){if(tab){S.stab=tab;LS.set(PFX+"stab",tab)}setHash("study",true);show("study");renderStudy();scrollTo(0,0)}
function goYou(){setHash("you",true);show("you");renderYou();scrollTo(0,0)}
function goRead(){if(pos&&sIdx(pos.s)>=0)goScene(sIdx(pos.s),{key:pos.key,keep:true});else goScene(0)}
$("fnav").addEventListener("click",e=>{const b=e.target.closest("button[data-nav]");if(!b)return;const v=b.dataset.nav;
  if(v==="reader"){if(view==="reader")toggleChrome(false);else goRead()}else if(v==="study"){if(view!=="study")goStudy();else scrollTo({top:0,behavior:"smooth"})}else if(v==="you"){if(view!=="you")goYou();else scrollTo({top:0,behavior:"smooth"})}});

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
function renderYou(){
  const lp=pos&&sIdx(pos.s)>=0?scenes[sIdx(pos.s)]:scenes[0];
  const done=scenes.filter(p=>prog.done[p.id]).length;
  const qs=Object.entries(prog.quiz).filter(([k])=>k!=="all").map(x=>x[1]);const qc=qs.reduce((a,q)=>a+q[0],0),qt=qs.reduce((a,q)=>a+q[1],0);
  $("contcard").innerHTML=`<button class="go" id="contbtn"><small>${pos?"Continue reading":"Begin reading"}</small><b>${sName(lp)} · ${esc(shortLoc(lp))}</b></button>
    <div class="meter"><i style="width:${done/scenes.length*100}%"></i></div>
    <div class="stats"><span><b>${done}</b> of ${scenes.length} scenes read</span><span>quizzes <b>${qt?Math.round(qc/qt*100)+"%":"–"}</b></span><span><b>${Object.keys(prog.cards).length}</b> of ${QUOTES.quotes.length} quotes learnt</span></div>
    ${(()=>{const s=streak(),w=weekStats(),td=Math.round(((LOG[today()]||{}).s||0)/60);return `<div class="stats"><span>🔥 <b>${s}</b> day${s===1?"":"s"} in a row</span><span><b>${td}</b> min today</span><span>This week: <b>${w.min}</b> min · <b>${w.p}</b> pages · <b>${w.sc}</b> scene${w.sc===1?"":"s"}</span></div>`})()}`;
  $("contcard").insertAdjacentHTML("beforeend",examHTML()+bkRemHTML());if($("ex-set"))$("ex-set").onclick=openExamDate;
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
    h+=`<div class="jump"><label for="jl" class="sr">Go to line</label><input class="sinput" id="jl" inputmode="decimal" placeholder="Go to line, e.g. 3.3.165"><button class="btn" id="jl-go">Go</button></div>`;
    const rc=RECENT.filter(r=>speech[r.id]);if(rc.length)h+=`<div class="eyebrow" style="margin:6px 0 2px">Recently viewed</div>`+rc.slice(0,3).map(r=>{const sp=speech[r.id],q=partsOf(sp)[r.pi]||partsOf(sp)[0];
      return `<div class="item" data-recent="${esc(r.id)}:${esc(r.pi)}" tabindex="0"><small>${esc(where(sp))}</small><span style="font-family:var(--f-old)">${esc(sp.lines[q[0]].replace(/^~/,""))}…</span></div>`}).join("");
    h+=`<div class="acts-map">`;
    for(const a of ACTS){const ps=scenes.filter(p=>p.act===a);if(!ps.length)continue;const ad=ps.filter(p=>prog.done[p.id]).length;
      h+=`<details class="actd"${a===lp.act?" open":""}><summary><span>${LAT[a]}</span><small>${AN(a)} · ${ad}/${ps.length} read</small></summary><div class="srows">`+
        ps.map(p=>{const q=prog.quiz[p.id];const s=STUDY.scenes[p.id]||{};
          return `<button class="srow${prog.done[p.id]?" done":""}${here>=0&&p.id===pos.s?" here":""}" data-go="${p.id}"><span class="n">${prog.conf[p.id]?`<i class="dot ${esc(prog.conf[p.id])}"></i>`:""}${p.scene.toLowerCase()}</span><span class="loc">${esc(shortLoc(p))}</span><span class="st">${prog.done[p.id]?"✓ read":""}${q?` · quiz ${esc(q[0])}/${esc(q[1])}`:""}</span><span class="sum">${esc(firstSentence(s.sum))}</span></button>`}).join("")+`</div></details>`}
    h+=`</div>`}
  else if(ctab==="beats"){h+=`<p class="hcap">What happens, beat by beat. Tap one to read from there.</p><div class="acts-map">`;
    for(const a of ACTS){const ps=scenes.filter(p=>p.act===a&&BEATS[p.id]);if(!ps.length)continue;
      h+=`<details class="actd"${a===lp.act?" open":""}><summary><span>${LAT[a]}</span><small>${AN(a)}</small></summary>`+ps.map(p=>`<div class="bscene${here>=0&&p.id===pos.s?" here":""}"><div class="eyebrow">${sName(p)} · ${esc(shortLoc(p))}</div><ol class="beats">${BEATS[p.id].map(([id,t])=>`<li><button data-speech="${id}">${beatTxt(t)}</button></li>`).join("")}</ol></div>`).join("")+`</details>`}
    h+=`</div>`}
  else if(ctab==="cast"){h+=`<p class="hcap">The Names of the Actors, as the 1623 Folio lists them</p><div class="cast">`+STUDY.chars.map(c=>{const key=c.name.toUpperCase().replace(/^THE /,"").replace(" OF VENICE","");const has=whoSet.has(key);
      return `<div class="castc" style="--c:${COLORS[key]||"var(--ink)"}"><b>${esc(c.name)}</b>${has?`<button class="link" data-follow="${esc(key)}">Follow their lines</button>`:"<span></span>"}<p>${esc(c.desc)}</p></div>`}).join("")+`</div>`}
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
  if(!S.who)b.push({t:"head",key:"h"});
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
function lineHTML(l,num,id,j){const song=l.startsWith("~"),t=song?l.slice(1):l;return `<span class="l${song?" song":""}"${num%5===0?` data-n="${num}"`:""}${id!=null?` data-j="${j}"`:""}>${favLine(t,id,j)}</span>`}
/* saved phrases (and the one being selected, drawn last so it wins) are wrapped in <mark class="fph fc-…"> */
function favLine(t,id,j){if(id==null||!FAV.length&&!SEL)return gloss(t);const ws=[];t.replace(/\S+/g,(m,i)=>{ws.push([i,i+m.length]);return m});if(!ws.length)return gloss(t);const cov=[];
  const add=(a,b,k,c,sel)=>{if(j<a[0]||j>b[0])return;const s=j===a[0]?a[1]:0,e=Math.min(ws.length-1,j===b[0]?b[1]:ws.length-1);if(s>=ws.length||e<s)return;cov.push({s:ws[s][0],e:ws[e][1],k,c:fcOk(c),sel})};
  FAV.forEach(f=>{if(f.id===id&&!(SEL&&SEL.edit===f.t))add(f.a,f.b,f.t,f.c,false)});if(SEL&&SEL.id===id)add(SEL.a,SEL.b,SEL.edit||"",SEL.c,true);
  if(!cov.length)return gloss(t);const P=[...new Set([0,t.length,...cov.flatMap(c=>[c.s,c.e])])].sort((a,b)=>a-b);let h="",g=null,buf="";
  const flush=()=>{if(!buf)return;h+=g?`<mark class="fph fc-${g.c}${g.sel?" fsel":""}"${g.k!==""?` data-fp="${esc(g.k)}"`:""}>${gloss(buf)}</mark>`:gloss(buf);buf=""};
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];let top=null;cov.forEach(c=>{if(c.s<=a&&c.e>=b)top=c});if(top!==g){flush();g=top}buf+=t.slice(a,b)}flush();return h}
/* long speeches are grouped into whole-thought parts (tap a part for its modern English) */
function linesHTML(it,a,b){let h="";const ps=partsOf(it);ps.forEach((p,i)=>{const s=Math.max(a,p[0]),e=Math.min(b,p[1]);if(s>e)return;let x="";for(let j=s;j<=e;j++)x+=lineHTML(it.lines[j],it.start+j,it.id,j);
  const op=S.mode==="orig"&&OPEN.has(it.id+":"+i)&&e===p[1];h+=`<div class="pt${op?" open":""}" data-p="${i}">${x}</div>`;
  if(op)h+=`<div class="mx" data-mx="${it.id}:${i}"><div class="mxt">${paras(p[2])}</div><div class="mxa">${ps.length>1?`<button data-mxa="whole:${it.id}:${i}">Whole speech <small>${i+1}/${ps.length}</small></button>`:""}<button data-mxa="tools:${it.id}:${i}">Meanings &amp; notes</button></div></div>`});return h}
function unfold(id,pi){const k=id+":"+pi,sp=speech[id],on=!OPEN.has(k);if(on)OPEN.add(k);else OPEN.delete(k);OPENV++;hideGloss();
  const top=cur.pages[cur.i].find(b=>b.t==="sp"),before=cur.i;
  openScene(cur.k,{key:on?id+":"+partsOf(sp)[pi][0]:top?top.key:pos&&pos.key,keep:true});
  if(on){addRecent(id,pi);if(cur.i!==before)toast("Turned to the next page so the part fits")}}
function paras(t){const ss=String(t||"").match(/[^.!?]+[.!?]+["'’”)]*\s*|[^.!?]+$/g)||[t];const out=[];let curp="",n=0;
  ss.forEach(x=>{curp+=x;n++;if(n>=2||curp.length>200){out.push(curp.trim());curp="";n=0}});if(curp.trim())out.push(curp.trim());
  return out.map(p=>`<p>${esc(p)}</p>`).join("")}
function stageType(p){const l=p.loc.toLowerCase();const r=EX.stagerules.find(([re])=>new RegExp(re).test(l));return r?r[1]:"street"}
function stagePic(p){const k=stageType(p);return `<div class="stagepic"><svg viewBox="0 0 40 40" aria-hidden="true">${PICS[k]}</svg>${EX.place[p.id]?esc(EX.place[p.id])+" · ":""}${EX.stage[k]}</div>`}
function recapHTML(id){const k=sIdx(id);if(k===0)return `<ul>${EX.intro.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
  const pv=scenes[k-1],s=STUDY.scenes[pv.id]||{};return `<p class="muted" style="margin-top:0">At the end of ${sName(pv)}:</p><ul>${(s.key||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="muted">${esc(s.sum||"")}</p>`}
/* "Before you read": the setting, the story so far and (folded, as it gives the scene away) The Argument */
function openBefore(id){const p=scenes[sIdx(id)],s=STUDY.scenes[id]||{};
  openSheet("Before you read",`<h3 class="lbl">Setting</h3>${stagePic(p)}<h3 class="lbl">Story so far</h3>${recapHTML(id)}${s.sum?`<details class="about"><summary>The Argument: what happens in this scene</summary><p>${esc(s.sum)}</p></details>`:""}`)}
const FIRSTSP={};scenes.forEach(p=>p.items.forEach(it=>{if(it.t==="sp"&&CH[it.who]&&!FIRSTSP[it.who])FIRSTSP[it.who]=it.id}));
let PRED={};try{PRED=JSON.parse(LS.get(PFX+"pred")||"{}")}catch(e){}
function endExtras(p){const c=prog.conf[p.id];
  return `<div class="endbtns"><button data-endact="quiz:${p.id}">${preQ(p)?"Did you find out? Quick quiz":"Quick quiz on this scene"}</button><button data-endact="quotes:${p.id}">Key quotes from this scene</button></div>
   <div class="conf">How well do you know this scene? ${[["r","Shaky"],["a","OK"],["g","Confident"]].map(([k,l])=>`<button data-endact="conf:${p.id}:${k}" aria-pressed="${c===k}"><i class="dot ${k}"></i>${l}</button>`).join("")}</div>`}
function endAct(v){const [a,s,k]=v.split(":");
  if(a==="quiz"){goStudy("quiz");startQuiz(s);return}
  if(a==="quotes"){const qs=QUOTES.quotes.filter(q=>speech[q.id].page===s);openSheet("Key quotes",qs.length?qs.map(quoteHTML).join(""):`<p class="muted">No key quotes are listed for this scene. Try the Key quotes tab in Study.</p>`);return}
  if(a==="conf"){prog.conf[s]=prog.conf[s]===k?"":k;saveProg();refreshMarks();toast("Saved")}}
function onStage(p){const ws=[];p.items.forEach(i=>{if(i.t==="sp"&&i.who&&!ws.includes(i.who))ws.push(i.who)});
  return `<div class="onstage">On stage: ${ws.map(w=>`<span style="--c:${COLORS[w]||"var(--ink)"}">${esc(title(w))}</span>`).join(" · ")}</div>`}
/* verse or prose */
const PROSE={};for(const id in speech){const L=speech[id].lines.map(l=>l.replace(/^~/,"").replace(/\[[^\]]*\]\s*/g,""));if(L.length<2)continue;
  const low=L.slice(1).filter(l=>/^[a-z]/.test(l)).length,long=L.filter(l=>l.length>62).length;PROSE[id]=low/(L.length-1)>=.5||long>=Math.max(1,L.length/3)}
function blockHTML(bk,p){
  if(bk.t==="head"){const s=STUDY.scenes[p.id]||{};
    return `<div class="blk shead"><div class="eyebrow">${LAT[p.act]}. ${SL[p.scene]||""}.</div><h1>${sName(p)}</h1><div class="loc"><svg viewBox="0 0 40 40" aria-hidden="true">${PICS[stageType(p)]}</svg>${esc(p.loc)}</div>${onStage(p)}<div class="sopen">${preQ(p)?`<div class="preq"><b>Read to find out</b>${esc(preQ(p))}</div>`:""}<button class="recapb" data-recap="${p.id}">Before you read<span aria-hidden="true"> ›</span></button></div></div>`}
  if(bk.t==="sd")return `<div class="blk sd">${esc(bk.it.text)}</div>`;
  if(bk.t==="end"){const k=sIdx(p.id),n=scenes[k+1];
    const po=EX.predict[p.id],g=PRED[p.id];
    return `<div class="blk endblk"><div class="orn">❧</div><b>End of ${sName(p)}</b>${n?`<span>Turn the page for ${sName(n)} · ${esc(shortLoc(n))}</span>`:`<span>Finis</span>`}${S.sum&&(STUDY.scenes[p.id]||{}).sum?`<div class="sum endsum"><b>The Argument</b>${esc(STUDY.scenes[p.id].sum)}</div>`:""}
      ${po?`<div class="pred"><p>${g!=null?`Your guess: ${esc(po[g])}. Turn the page to find out.`:"What do you think happens next?"}</p><div class="chips">${po.map((o,i)=>`<button class="chip" data-pred="${p.id}:${i}" aria-pressed="${g===i}">${esc(o)}</button>`).join("")}</div></div>`:""}${endExtras(p)}</div>`}
  const it=bk.it,c=COLORS[it.who],cont=bk.u0>0||it.cont,aside=it.lines.some(l=>/\[Aside/.test(l)),solo=SOLO[it.id];
  let prevSp=null;for(const x of p.items){if(x===it)break;if(x.t==="sp"&&x.who===it.who)prevSp=x}
  const sw=PROSE[it.id]&&prevSp&&!PROSE[prevSp.id];
  const tag=(solo?`<span class="tag">Soliloquy</span>`:aside?`<span class="tag">Aside</span>`:"")+(EX.irony[it.id]&&!bk.u0?`<span class="tag pop irony" data-pop="Dramatic irony" data-text="${esc(EX.irony[it.id])}">◔ Irony</span>`:"")+((EX.dev[it.id]||[]).filter(()=>!bk.u0).map(([k,n])=>`<span class="tag pop" data-pop="${esc(EX.devices[k])}" data-text="${esc(n)}">✦ ${esc(EX.devices[k])}</span>`).join(""))+(PROSE[it.id]&&!bk.u0?`<span class="tag pr">${sw?"Switches to prose":"Prose"}</span>`:"");
  const m=marks[it.id]||{},flags=(STUDY.notes[it.id]||QBY[it.id]?`<span class="flag" title="Has a study note">◆</span>`:"")+(m.note?`<span class="flag" title="Your note">✎</span>`:"");
  const us=bk.units.slice(bk.u0,bk.u1),whole=bk.u0===0&&bk.u1===bk.units.length;
  let body;
  if(S.mode==="orig")body=`<div class="o">${linesHTML(it,us[0][0],us[us.length-1][1])}</div>`;
  else if(whole&&partsOf(it).length<2)body=`<div class="o">${linesHTML(it,0,it.lines.length-1)}</div><div class="m">${paras(it.m)}</div>`;
  else body=us.map(u=>`<div class="chunk"><div class="o">${linesHTML(it,u[0],u[1])}</div><div class="m">${paras(u[2])}</div></div>`).join("");
  const hl=hlOf(m),hc=hl?" hl hl-"+hl:"";
  const beat=S.beats&&!bk.u0&&!S.who&&BEAT[it.id]?`<div class="beat" aria-label="Story beat"><span>${beatTxt(BEAT[it.id])}</span></div>`:"";
  const ch=CH[it.who],intro=ch&&!bk.u0&&!S.who&&FIRSTSP[it.who]===it.id?`<div class="who1">${esc(firstSentence(ch.desc))}</div>`:"";
  return `<article class="blk sp${hc}${solo?" solo":aside?" aside":PROSE[it.id]?" prose":""}${PROSE[it.id]?"":" vs"}${S.focus&&it.who===S.focus?" fwho":""}" data-id="${it.id}" data-key="${it.id}:${bk.u0}">${beat}<div class="hd"><span class="nm${cont?" cont":""}"${ch?` data-who="${esc(it.who)}"`:""} style="${c?`--c:${c}`:""}">${esc(title(it.who))}${cont?" (cont.)":""}</span>${tag}${flags}</div>${intro}<div class="body">${body}</div></article>`;
}
/* ---------- pagination: fill each screen, split long speeches between pages ---------- */
let cur={k:-1,pages:[],i:0,words:0,sig:""};
function paginate(p){
  const blocks=sceneBlocks(p);
  measure.className="pg";measure.style.width=pg.clientWidth+"px";measure.style.maxWidth="none";
  const H=pg.clientHeight-2,pages=[];let page=[];measure.innerHTML="";
  const fits=()=>measure.scrollHeight<=H;
  const flush=()=>{if(page.length)pages.push(page);page=[];measure.innerHTML=""};
  const add=bk=>{measure.insertAdjacentHTML("beforeend",blockHTML(bk,p));return measure.lastElementChild};
  for(const bk0 of blocks){
    let bk=bk0,guard=0;
    while(guard++<500){
      const el=add(bk);
      if(fits()){page.push(bk);break}
      el.remove();
      if(bk.t==="sp"&&bk.u1-bk.u0>1){
        let best=0;
        for(const pass of [1,0]){ // split between parts if possible, else between lines
          for(let u=bk.u1-1;u>bk.u0;u--){if(pass&&!bk.starts.has(bk.units[u][0]))continue;const e=add(Object.assign({},bk,{u1:u}));const ok=fits();e.remove();if(ok){best=u;break}}
          if(best)break}
        if(best){const part=Object.assign({},bk,{u1:best});add(part);page.push(part);flush();bk=Object.assign({},bk,{u0:best,key:bk.it.id+":"+bk.units[best][0]});continue}
      }
      if(page.length){flush();continue}
      add(bk);page.push(bk);flush();break; // taller than a whole page on its own
    }
  }
  flush();measure.innerHTML="";
  return pages.length?pages:[[]];
}
const sig=()=>[S.lh,S.mode,S.scale,S.who,S.sum,S.beats,OPENV,pg.clientWidth,pg.clientHeight].join("|");
function openScene(k,opts){
  opts=opts||{};const p=scenes[k];if(cur.k!==k&&OPEN.size){OPEN.clear();OPENV++}
  if(!(cur.k===k&&cur.sig===sig()))cur={k,pages:paginate(p),i:0,words:pageWords(p),sig:sig()};
  let i=0;
  if(opts.page==="last")i=cur.pages.length-1;
  else if(typeof opts.page==="number")i=Math.max(0,Math.min(cur.pages.length-1,opts.page));
  if(opts.key!=null){const f=findKey(opts.key);if(f>=0)i=f}
  if(opts.speech!=null){const f=cur.pages.findIndex(pb=>pb.some(b=>b.t==="sp"&&b.it.id===opts.speech));if(f>=0)i=f}
  $("w-title").textContent=sName(p);
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
function renderPage(i,dir,keep){if(SEL){SEL=null;const d=$("fsbar");if(d)d.hidden=true}
  const p=scenes[cur.k];cur.i=i;
  const html=cur.pages[i].map(b=>blockHTML(b,p)).join("");
  const reduce=noMotion()||noSlide;
  const put=()=>{pg.innerHTML=html;pg.scrollTop=0;pg.style.overflowY=pg.scrollHeight>pg.clientHeight+2?"auto":"hidden"};
  if(dir&&!reduce){pg.classList.add(dir>0?"turnL":"turnR");setTimeout(()=>{put();pg.classList.remove("turnL","turnR")},110)}else put();
  const first=cur.pages[i].find(b=>b.t==="sp")||cur.pages[i][0];
  if(!keep){pos={s:p.id,key:first?first.key:"h"};LS.set(PFX+"pos",JSON.stringify(pos));const st={pct:Math.round((cur.k+(i+1)/cur.pages.length)/scenes.length*1000)/10,where:sName(p),t:Date.now()};LS.set("folio-stat-"+PLAY,JSON.stringify(st));
    setTimeout(()=>{const sp=pg.querySelector(".sp[data-id]");if(!sp)return;const l=sp.querySelector(".o .l")||sp.querySelector(".o");st.who=first&&first.t==="sp"?title(first.it.who):"";st.line=l?l.textContent.replace(/^\s*\d+\s*/,"").trim().slice(0,140):"";LS.set("folio-stat-"+PLAY,JSON.stringify(st))},250)}
  if(i===cur.pages.length-1&&!prog.done[p.id]){prog.done[p.id]=Date.now();saveProg()}
  const n=cur.pages.length,mins=Math.ceil(cur.words*(n-1-i)/Math.max(1,n)/140);
  $("pgfoot").textContent=`${sName(p)} · ${i+1} / ${n}`;$("pgbar").style.width=((i+1)/n*100)+"%";if(!keep)logRead();
  $("p-num").textContent=`p. ${i+1} of ${n}${mins>0?` · ${mins} min left`:""}`;
  $("w-sub").textContent=shortLoc(p).toUpperCase()+(S.who?` · ${title(S.who).toUpperCase()} ONLY`:"");
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
  if(d>0){if(cur.i<cur.pages.length-1)renderPage(cur.i+1,1);else if(cur.k<scenes.length-1){setHash(scenes[cur.k+1].id,false);openScene(cur.k+1,{page:0})}else toast("The end of the play")}
  else{if(cur.i>0)renderPage(cur.i-1,-1);else if(cur.k>0){setHash(scenes[cur.k-1].id,false);openScene(cur.k-1,{page:"last"})}}
}
/* ---------- page curl: the sheet folds along the perpendicular bisector of its corner and the finger ----------
   layers in #curl: under (the page being revealed), cast shadow, sheet front (clipped), sheet back (reflected, faint show-through) */
let CU=null,noSlide=false;
function curlOn(){return S.turn==="curl"&&!reducedMotion()}
function peekPage(d){
  if(d>0){if(cur.i<cur.pages.length-1)return {k:cur.k,pages:cur.pages,i:cur.i+1};if(cur.k<scenes.length-1)return {k:cur.k+1,pages:paginate(scenes[cur.k+1]),i:0};return null}
  if(cur.i>0)return {k:cur.k,pages:cur.pages,i:cur.i-1};if(cur.k>0){const ps=paginate(scenes[cur.k-1]);return {k:cur.k-1,pages:ps,i:ps.length-1}}return null}
function curlPage(html,foot,cls){const w=document.createElement("div");w.className="cpage "+(cls||"");
  const v=document.createElement("div");v.className=vp.className;const g=document.createElement("div");g.className="pg";g.innerHTML=html;v.appendChild(g);w.appendChild(v);
  const f=document.createElement("div");f.className="pgfoot";f.textContent=foot;w.appendChild(f);return w}
function curlBegin(d,cy){if(CU)curlEnd(true);const pk=peekPage(d);if(!pk)return null;
  const box=$("curl"),W=vp.clientWidth,H=vp.clientHeight;
  const nowH=pg.innerHTML,nowF=$("pgfoot").textContent,pkH=pk.pages[pk.i].map(b=>blockHTML(b,scenes[pk.k])).join(""),pkF=`${sName(scenes[pk.k])} · ${pk.i+1} / ${pk.pages.length}`;
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
function refreshMarks(){if(view==="reader"&&cur.k>=0){pg.innerHTML=cur.pages[cur.i].map(b=>blockHTML(b,scenes[cur.k])).join("");if(partSel)markPart();else if(toolsId!=null)pg.querySelectorAll(`.sp[data-id="${toolsId}"]`).forEach(x=>x.classList.add("active"))}}

/* ---------- reader: gestures (tap edges / swipe to turn, tap middle for menus, long-press for tools) ---------- */
let press=null,swallow=false;
vp.addEventListener("pointerdown",e=>{if(e.button)return;
  const sp=e.target.closest(".sp");press={x:e.clientX,y:e.clientY,t:Date.now(),sp,tgt:e.target,timer:null,moved:false};
  {const r=vp.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width;press.edge=fx>.82?1:fx<.18?-1:0}
  if(sp){press.pt=setTimeout(()=>{if(press&&press.sp===sp&&!press.moved)sp.classList.add("pressing")},160);
    press.timer=setTimeout(()=>{if(press&&press.sp===sp&&!press.moved){sp.classList.remove("pressing");swallow=true;try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}const h=wordAt(press.x,press.y);if(h&&h.id===+sp.dataset.id)startSel(h);else openTools(+sp.dataset.id,partAt(press.tgt,sp))}},480)}});
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
  const nm=P.tgt.closest&&P.tgt.closest(".nm[data-who]");if(nm){const c=CH[nm.dataset.who];if(c){showPop(nm,title(nm.dataset.who),c.desc);return}}
  if(P.sp&&S.mode==="orig"){const pt=P.tgt.closest(".pt");if(pt){if(toolsId!=null)closePanel();unfold(+P.sp.dataset.id,+pt.dataset.p);return}}
  if(P.sp){const pt=P.tgt.closest(".pt")||(P.tgt.closest(".chunk")||P.sp).querySelector(".pt");
    if(pt){const id=+P.sp.dataset.id,pi=+pt.dataset.p;if(partSel&&partSel.id===id&&partSel.pi===pi&&toolsId!=null){closePanel();return}openPart(id,pi,false);return}}
  if(toolsId!=null&&wide()){closePanel();return}
  toggleChrome()}
vp.addEventListener("pointerup",e=>{if(SEL)SEL.drag=false;endPress(e,false)});
vp.addEventListener("pointercancel",e=>{if(SEL)SEL.drag=false;endPress(e,true)});
/* iOS: claim the touch for a page drag before Safari takes it as a pan (which would fire pointercancel) */
vp.addEventListener("touchmove",e=>{if(SEL&&SEL.drag||CU&&CU.drag||press&&press.edge&&e.touches.length===1&&curlOn()&&pg.scrollHeight<=pg.clientHeight+2)e.preventDefault()},{passive:false});
vp.addEventListener("contextmenu",e=>{e.preventDefault();const sp=e.target.closest(".sp");if(!sp)return;if(press){clearTimeout(press.timer);clearTimeout(press.pt);swallow=true}openTools(+sp.dataset.id,partAt(e.target,sp))});
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
function armChrome(){clearTimeout(chromeT);chromeT=setTimeout(()=>{const a=document.activeElement;if(view==="reader"&&sheet.hidden&&!(a&&a.closest&&a.closest("#bar,#bbar")&&a.matches("input,select")))document.body.classList.remove("chrome")},4000)}
function toggleChrome(on){document.body.classList.toggle("chrome",on);if(document.body.classList.contains("chrome"))armChrome();else clearTimeout(chromeT)}
["pointerdown","input","keydown"].forEach(ev=>["bar","bbar"].forEach(id=>$(id).addEventListener(ev,()=>{if(document.body.classList.contains("chrome"))armChrome()})));
$("p-prev").onclick=()=>turn(-1,1);$("p-next").onclick=()=>turn(1,1);
function pagePreview(i){const b=cur.pages[i]||[];const f=b.find(x=>x.t==="sp");if(!f)return b.some(x=>x.t==="head")?"Scene opening":"End of scene";
  return `<i style="font-style:normal;color:var(--muted)">${esc(title(f.it.who))}:</i> ${esc(f.it.lines[f.units[f.u0][0]].replace(/^~/,"").slice(0,70))}…`}
$("p-range").addEventListener("input",e=>{const i=+e.target.value-1;let d=document.querySelector(".scrub");if(!d){d=document.createElement("div");d.className="scrub";document.body.appendChild(d)}
  d.innerHTML=`<b>Page ${i+1} of ${cur.pages.length}</b><span>${pagePreview(i)}</span>`});
$("p-range").addEventListener("change",e=>{const d=document.querySelector(".scrub");if(d)d.remove();renderPage(+e.target.value-1,0)});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&SEL&&!e.target.closest("#fsbar textarea")){clearSel();return}
  if(e.key==="Escape"&&gpop){hideGloss();return}
  if(e.key==="Escape"){if(!$("sheet").hidden)closeSheet();else if(toolsId!=null)closePanel();else toggleChrome(false);return}
  if(view!=="reader"||!$("sheet").hidden||e.target.closest("input,textarea,select"))return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();turn(1)}
  if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();turn(-1)}});

/* ---------- select a phrase on the page: long-press a word, drag to extend, tap a word to move the nearer end ---------- */
const wlt=(x,y)=>x[0]<y[0]||x[0]===y[0]&&x[1]<y[1];
const wlin=(id,w)=>{const sp=speech[id];let n=0;for(let l=0;l<w[0];l++)n+=lineWords(sp.lines[l]).length;return n+w[1]};
function wordAt(x,y){const el=document.elementFromPoint(x,y),l=el&&el.closest&&el.closest(".o .l[data-j]");if(!l)return null;const sp=l.closest(".sp[data-id]");if(!sp)return null;
  let node=null,off=0;if(document.caretPositionFromPoint){const c=document.caretPositionFromPoint(x,y);if(c){node=c.offsetNode;off=c.offset}}else if(document.caretRangeFromPoint){const r=document.caretRangeFromPoint(x,y);if(r){node=r.startContainer;off=r.startOffset}}
  if(!node||!l.contains(node))return null;const r=document.createRange();r.setStart(l,0);r.setEnd(node,off);const n=r.toString().length;
  const ws=[];l.textContent.replace(/\S+/g,(m,i)=>{ws.push([i,i+m.length]);return m});if(!ws.length)return null;let i=ws.findIndex(w=>n<w[1]);if(i<0)i=ws.length-1;
  return {id:+sp.dataset.id,w:[+l.dataset.j,i]}}
function startSel(h,drag=true){if(toolsId!=null)closePanel();hideGloss();SEL={id:h.id,a:h.w,b:h.w,anc:h.w,drag,edit:0,c:fcOk(LS.get(PFX+"fc")),note:""};selPaint(true)}
function editSel(f){hideGloss();if(toolsId!=null)closePanel();SEL={id:f.id,a:f.a.slice(),b:f.b.slice(),anc:f.a.slice(),drag:false,edit:f.t,c:fcOk(f.c),note:f.note||""};selPaint(true)}
function selMove(w){if(wlt(w,SEL.a))SEL.a=w;else if(wlt(SEL.b,w))SEL.b=w;else if(wlin(SEL.id,w)-wlin(SEL.id,SEL.a)<=wlin(SEL.id,SEL.b)-wlin(SEL.id,w))SEL.a=w;else SEL.b=w;SEL.anc=SEL.a;selPaint()}
function clearSel(){if(!SEL)return;SEL=null;const d=$("fsbar");if(d)d.hidden=true;refreshMarks()}
function selPaint(build){refreshMarks();let d=$("fsbar");
  if(build||!d||d.hidden){if(!d){d=document.createElement("div");d.id="fsbar";d.className="fsbar";d.setAttribute("role","dialog");d.setAttribute("aria-label","Favourite phrase");$("reader").appendChild(d);d.addEventListener("pointerup",e=>e.stopPropagation());d.addEventListener("pointerdown",e=>e.stopPropagation())}
    d.innerHTML=`<div class="fs-txt" id="fs-txt"></div>
      <div class="fs-row"><span class="fs-sw" role="group" aria-label="Highlight colour">${FC.map(([k,l])=>`<button class="sw fc-${k}${SEL.c===k?" on":""}" data-fc="${k}" aria-label="${l}" aria-pressed="${SEL.c===k}"></button>`).join("")}</span><button class="btn sm" id="fs-nt" aria-expanded="${!!SEL.note}">Note</button></div>
      <div id="fs-nw"${SEL.note?"":" hidden"}><label class="sr" for="fs-note">Note</label><textarea id="fs-note" rows="2" placeholder="Why this phrase? (optional)">${esc(SEL.note)}</textarea></div>
      <div class="fs-row"><button class="btn sm primary" id="fs-save">${SEL.edit?"Save":"Save favourite"}</button>${SEL.edit?`<button class="btn sm" id="fs-del">Remove</button>`:""}<button class="btn sm" id="fs-tools">Speech tools</button><button class="btn sm" id="fs-x" aria-label="Cancel">✕</button></div>`;
    d.hidden=false;
    d.querySelectorAll("[data-fc]").forEach(b=>b.onclick=()=>{SEL.c=b.dataset.fc;d.querySelectorAll("[data-fc]").forEach(x=>{const on=x===b;x.classList.toggle("on",on);x.setAttribute("aria-pressed",on)});refreshMarks()});
    $("fs-nt").onclick=()=>{const w=$("fs-nw");w.hidden=!w.hidden;$("fs-nt").setAttribute("aria-expanded",!w.hidden);if(!w.hidden)$("fs-note").focus()};
    $("fs-note").oninput=e=>SEL.note=e.target.value;
    $("fs-save").onclick=saveSel;$("fs-x").onclick=clearSel;
    if($("fs-del"))$("fs-del").onclick=()=>{const t=SEL.edit;FAV=FAV.filter(f=>f.t!==t);saveFav();clearSel();toast("Phrase removed")};
    $("fs-tools").onclick=()=>{const id=SEL.id,sp=speech[id],ps=partsOf(sp),l=SEL.a[0],pi=Math.max(0,ps.findIndex(q=>l>=q[0]&&l<=q[1]));clearSel();openTools(id,pi)}}
  $("fs-txt").textContent="“"+favText(SEL.id,SEL.a,SEL.b)+"”";
  /* keep the bar off the selected words: move it to the top when they sit low on the screen */
  const mk=pg.querySelectorAll("mark.fsel");if(mk.length){const t=mk[0].getBoundingClientRect().top,b=mk[mk.length-1].getBoundingClientRect().bottom,bh=d.offsetHeight+28,low=b>innerHeight-bh,high=t<bh;
    if(d.classList.contains("top")){if(high&&!low)d.classList.remove("top")}else if(low&&!high)d.classList.add("top")}}
function saveSel(){if(!SEL)return;const {id,a,b,c}=SEL,note=(SEL.note||"").trim(),txt=favText(id,a,b);
  let f=SEL.edit?FAV.find(x=>x.t===SEL.edit):FAV.find(x=>x.id===id&&x.a+""===a+""&&x.b+""===b+"");
  if(f)Object.assign(f,{a,b,txt,note,c});else FAV.push({id,a,b,txt,note,c,t:Date.now()});
  LS.set(PFX+"fc",c);favSort();saveFav();const ed=SEL.edit;clearSel();toast(ed?"Phrase updated":"Phrase saved. Find it in My notes.")}

/* ---------- speech tools: side panel (wide) or sheet (phone) ---------- */
let toolsId=null;
const HLC=[["ev","Evidence"],["fav","Favourite"],["cf","Confusing"]];
/* stored values come from this device or an imported backup: only known highlight keys and theme ids reach the page */
const hlOf=m=>{const h=m.hl===true?"ev":m.hl;return HLC.some(x=>x[0]===h)?h:""};
const thOf=m=>(Array.isArray(m.th)?m.th:[]).filter(x=>QUOTES.themes[x]);
function pairHTML(sp,q,cur){const og=sp.lines.slice(q[0],q[1]+1).map(l=>`<span>${esc(l.replace(/^~/,""))}</span>`).join("");
  return `<div class="pair${cur?" cur":""}"><div class="ptag">Shakespeare</div><div class="porig">${og}</div><div class="pmod"><div class="ptag">Modern English</div><p>${esc(q[2])}</p></div></div>`}
const partAt=(el,sp)=>{const pt=el&&el.closest&&(el.closest(".pt")||(el.closest(".chunk")||sp).querySelector(".pt"));return pt?+pt.dataset.p:0};
function toolsHTML(id,pi){
  const sp=speech[id],p=sceneOf(id),m=marks[id]||{},ps=partsOf(sp),q=ps[pi]||ps[0],gl=glossList({lines:sp.lines.slice(q[0],q[1]+1)}),sn=STUDY.notes[id],c=CH[sp.who],qs=QBY[id]||[],nf=FAV.filter(f=>f.id===id).length,th=thOf(m);
  return `<div class="tool">
    <div class="ref">${sName(p)} · lines ${sp.start+q[0]}–${sp.start+q[1]}${ps.length>1?` · part ${(pi||0)+1} of ${ps.length}`:""}</div>
    <div class="modern">${pairHTML(sp,q)}</div>
    ${gl.length?`<h3 class="lbl">Word meanings</h3><dl>${gl.map(k=>`<dt>${esc(k)}</dt><dd>${esc(G[k])}</dd>`).join("")}</dl>`:""}
    ${sn?`<h3 class="lbl">Study note</h3><div class="snote">${esc(sn)}</div>`:""}
    ${qs.map(q=>`<h3 class="lbl">Key quote</h3><div class="snote"><i>“${esc(q.text)}”</i><br>${esc(q.note)}${EX.why[q.i]?`<br><b>Why it matters:</b> ${esc(EX.why[q.i])}`:""}<br><small class="muted">${q.themes.map(t=>QUOTES.themes[t][0]).join(" · ")}</small></div>`).join("")}
    ${EX.irony[id]?`<h3 class="lbl">Dramatic irony</h3><div class="snote">${esc(EX.irony[id])}</div>`:""}
    ${(EX.dev[id]||[]).map(([k,n])=>`<h3 class="lbl">${esc(EX.devices[k])}</h3><div class="snote">${esc(n)}</div>`).join("")}
    <div class="trow" role="group" aria-label="Mark and share">
      <div class="hlset" role="group" aria-label="Highlight">${HLC.map(([k,l])=>`<button class="tb hlb${hlOf(m)===k?" on":""}" data-hl="${k}" aria-pressed="${hlOf(m)===k}"><i class="hlk ${k}"></i><small>${l}</small></button>`).join("")}</div>
      <button class="tb" id="t-fph"><span>♥</span><small>Phrase${nf?` (${nf})`:""}</small></button>
      <button class="tb" id="t-focus" aria-pressed="${S.focus===sp.who}"><span>◎</span><small>${S.focus===sp.who?"Undim":"Dim others"}</small></button>
      <button class="tb" id="t-follow" aria-pressed="${S.who===sp.who}"><span>◐</span><small>${S.who===sp.who?"Everyone":"Only "+esc(title(sp.who))}</small></button>
      <button class="tb" id="t-copy"><span>⧉</span><small>Copy</small></button>
      <button class="tb" id="t-img"><span>▣</span><small>Image</small></button>
    </div>
    <h3 class="lbl">My note</h3><label for="tn" class="sr">My note</label><textarea id="tn" placeholder="Your thoughts on these lines…">${esc(m.note||"")}</textarea>
    <div class="acts"><button class="btn sm" id="t-save">Save note</button></div>
    ${c?`<details class="about"><summary>About ${esc(title(sp.who))}</summary><p>${esc(c.desc)}</p></details>`:""}
    <details class="about"><summary>Tag themes${th.length?` (${th.length})`:""}</summary><div class="tchips">${Object.entries(QUOTES.themes).map(([k,v])=>`<button class="chip" data-tth="${k}" aria-pressed="${th.includes(k)}">${esc(v[0])}</button>`).join("")}</div></details>
    <details class="about vlabd"><summary>Verse lab: beats, shared lines, punctuation</summary>${verseLabHTML(sp,q[0],q[1])}</details>
    ${dirTools(id)}${thoughtHTML(sp)}
  </div>`}
function wireTools(id,pi){
  const sp=speech[id],ps=partsOf(sp),q=ps[pi]||ps[0];
  wirePerf(id);
  $("t-save").onclick=()=>{const v=$("tn").value;saveMark(id,{note:v});toast(v.trim()?"Note saved":"Note removed")};
  document.querySelectorAll(".tool [data-hl]").forEach(b=>b.onclick=()=>{const k=b.dataset.hl,on=hlOf(marks[id]||{})!==k;saveMark(id,{hl:on?k:false});
    document.querySelectorAll(".tool [data-hl]").forEach(x=>{const a=on&&x===b;x.classList.toggle("on",a);x.setAttribute("aria-pressed",a)});markPart();toast(on?"Marked: "+HLC.find(x=>x[0]===k)[1]:"Highlight removed")});
  $("t-focus").onclick=()=>{S.focus=S.focus===sp.who?"":sp.who;applySettings();refreshMarks();markPart();$("t-focus").innerHTML=`<span>◎</span><small>${S.focus===sp.who?"Undim":"Dim others"}</small>`;$("t-focus").setAttribute("aria-pressed",S.focus===sp.who);toast(S.focus?"Dimming everyone except "+title(S.focus):"Showing everyone normally")};
  $("t-follow").onclick=()=>{S.who=S.who===sp.who?"":sp.who;closePanel();closeSheet();cur.sig="";openScene(sIdx(sp.page),{speech:id});toast(S.who?"Showing only "+title(S.who):"Showing everyone")};
  document.querySelectorAll(".tool [data-tth]").forEach(b=>b.onclick=()=>{const k=b.dataset.tth,th=((marks[id]||{}).th||[]).slice(),i=th.indexOf(k);if(i<0)th.push(k);else th.splice(i,1);saveMark(id,{th});b.setAttribute("aria-pressed",i<0);toast(i<0?"Tagged: "+QUOTES.themes[k][0]:"Tag removed")});
  $("t-img").onclick=()=>{const kq=(QBY[id]||[])[0];openImage(kq?[kq.text]:sp.lines.slice(q[0],q[1]+1).map(l=>l.replace(/^~/,"")),title(sp.who),sName(sceneOf(id))+", lines "+(sp.start+q[0])+"–"+(sp.start+q[1]))};
  $("t-fph").onclick=()=>{const w=[q[0],0];closeSheet();closePanel();showPartPage(id,pi);startSel({id,w},false);toast("Tap a word to extend the phrase")};
  $("t-copy").onclick=()=>copyText(sp.lines.slice(q[0],q[1]+1).map(l=>l.replace(/^~/,"")).join("\n")+`\n— ${title(sp.who)}, ${sName(sceneOf(id))}`);
}
/* tap an underlined word: small pop-up with its meaning (wins over the part tap) */
let gpop=null;
function showGloss(el){const w=el.textContent,k=gmap[w.toLowerCase()];if(!k)return;
  const d=document.createElement("div");d.className="gpop";d.innerHTML=`<b>${esc(k)}</b><span>${esc(G[k])}</span>`;
  document.body.appendChild(d);const r=el.getBoundingClientRect(),bw=d.offsetWidth,bh=d.offsetHeight;
  let x=Math.max(10,Math.min(innerWidth-bw-10,r.left+r.width/2-bw/2)),y=r.top-bh-10;if(y<10)y=r.bottom+10;
  d.style.left=x+"px";d.style.top=y+"px";el.classList.add("on");d._el=el;gpop=d;
  d.addEventListener("pointerup",e=>e.stopPropagation())}
document.addEventListener("pointerdown",e=>{if(gpop&&!e.target.closest(".gpop,#vp"))hideGloss()},true);
function showPop(el,h,txt){hideGloss();const d=document.createElement("div");d.className="gpop";d.innerHTML=`<small>${esc(h)}</small><span>${esc(txt)}</span>`;
  document.body.appendChild(d);const r=el.getBoundingClientRect(),bw=d.offsetWidth,bh=d.offsetHeight;
  let x=Math.max(10,Math.min(innerWidth-bw-10,r.left+r.width/2-bw/2)),y=r.bottom+8;if(y+bh>innerHeight-10)y=r.top-bh-8;
  d.style.left=x+"px";d.style.top=y+"px";gpop=d;d.addEventListener("pointerup",e=>e.stopPropagation())}
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
function fitPanel(on,id,pi){const b=document.body.classList;if(on&&!(innerWidth<1100&&view==="reader"&&cur.k>=0))on=false;if(on===b.contains("tight"))return;
  b.toggle("tight",on);const key=id!=null?partKey(id,pi):null;if(view==="reader"&&cur.k>=0){openScene(cur.k,key?{key,keep:true}:{key:pos&&pos.key,keep:true});markPart()}}
function closePanel(){const was=partSel||(toolsId!=null?{id:toolsId,pi:0}:null);$("panel").classList.remove("open");if(document.body.classList.contains("tight")){partSel=null;fitPanel(false,was&&was.id,was&&was.pi)}document.body.classList.remove("tools");toolsId=null;partSel=null;pg.querySelectorAll(".pt.cur").forEach(x=>x.classList.remove("cur"));pg.querySelectorAll(".sp.active").forEach(x=>x.classList.remove("active"))}
$("panel-close").onclick=closePanel;
async function copyText(t){try{await navigator.clipboard.writeText(t);toast("Copied")}catch(e){const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand("copy")}catch(_){}ta.remove();toast(ok?"Copied":"Copy didn’t work here. Select the text and copy it yourself.")}}

/* ---------- study ---------- */
const TABS=[["review","Review"],["explore","Explore"],["quotes","Key quotes"],["cards","Flashcards"],["part","Learn a part"],["drill","Practise"],["quiz","Quizzes"],["themes","Themes"],["plan","Essay planner"],["extract","Extract"],["para","Paragraphs"],["prof","Profiles"],["acts","Act summaries"],["revise","Revision sheet"]];
/* Study in four groups; the last tool used in each group is kept for this visit */
const SGROUPS=[["learn","Learn",["explore","acts","prof","themes","quotes"]],["practise","Practise",["review","cards","part","drill","quiz"]],["write","Write",["plan","extract","para"]],["revise","Revise",["revise"]]];
const sgOf=k=>SGROUPS.find(g=>g[2].includes(k))||SGROUPS[0],sgLast={};
function renderStudy(){
  if(!TABS.some(t=>t[0]===S.stab))S.stab="quotes";
  const g=sgOf(S.stab);sgLast[g[0]]=S.stab;
  $("sgroups").innerHTML=SGROUPS.map(([k,l])=>`<button role="tab" aria-selected="${g[0]===k}" data-sg="${k}">${l}</button>`).join("");
  $("stabs").hidden=g[2].length<2;
  $("stabs").innerHTML=g[2].map(k=>`<button role="tab" aria-selected="${S.stab===k}" data-tab="${k}">${TABS.find(t=>t[0]===k)[1]}</button>`).join("");
  ({part:studyPart,review:studyReview,drill:studyDrill,plan:studyPlan,extract:studyExtract,para:studyPara,prof:studyProf,acts:studyActs,explore:studyExplore,quotes:studyQuotes,cards:studyCards,themes:studyThemes,quiz:studyQuiz,revise:studyRevise})[S.stab]();
}
$("stabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b){S.stab=b.dataset.tab;LS.set(PFX+"stab",S.stab);renderStudy()}});
$("sgroups").addEventListener("click",e=>{const b=e.target.closest("[data-sg]");if(!b)return;const g=SGROUPS.find(x=>x[0]===b.dataset.sg);S.stab=sgLast[g[0]]||g[2][0];LS.set(PFX+"stab",S.stab);renderStudy()});
$("s-search").onclick=$("y-search").onclick=()=>openSearch("");
function quoteHTML(q){const sp=speech[q.id];return `<div class="qt" style="--c:${COLORS[sp.who]||"var(--ink)"}"><blockquote>“${esc(q.text)}”</blockquote>
  <div class="meta"><b>${esc(title(sp.who))}</b><span>${sName(sceneOf(q.id))}</span><button class="link" data-speech="${q.id}">Read in context</button></div>
  <p>${q.themes.map(t=>`<span class="th">${esc(QUOTES.themes[t][0])}</span>`).join("")}<br>${esc(q.note)}</p></div>`}
let qf={who:"",th:""};
function studyQuotes(){
  const whos=[...new Set(QUOTES.quotes.map(q=>speech[q.id].who))];
  const list=QUOTES.quotes.filter(q=>(!qf.who||speech[q.id].who===qf.who)&&(!qf.th||q.themes.includes(qf.th)));
  $("sbody").innerHTML=`<p class="intro">The play's most quoted lines, in order. Filter by character or theme.</p>
   <div class="qsel"><label><span>Character</span><select data-qf="who"><option value="">All characters</option>${whos.map(w=>`<option value="${esc(w)}"${qf.who===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select></label>
   <label><span>Theme</span><select data-qf="th"><option value="">All themes</option>${Object.entries(QUOTES.themes).map(([k,v])=>`<option value="${k}"${qf.th===k?" selected":""}>${esc(v[0])}</option>`).join("")}</select></label></div>
   <p class="muted" style="font-size:.875rem">${list.length} quote${list.length===1?"":"s"}</p>${list.map(quoteHTML).join("")}`;
}
/* explore: timeline, maps, plan, context, critics, imagery, symbols, contrasts, insults, pronouns, glossary */
let exSel="";
let cmp=[0,1];
const EXK={facts:"keyfacts",analysis:"analysis",motifs:"motifs",bigq:"bigq"};
const exHas=k=>!EXK[k]||Object.keys(EX[EXK[k]]||{}).length>0;let anSel="";
const spLine=id=>{const sp=speech[id];return sp?`<div class="o2">${esc(sp.lines.join(" ").replace(/~/g,"").slice(0,160))}${sp.lines.join(" ").length>160?"…":""}</div><small>${esc(where(sp))} · <button class="link" data-speech="${id}">Read in context</button></small>`:""};
function relSVG(act){const E=EX.rel[act],N=[...new Set(E.flatMap(e=>[e[0],e[1]]))],W=360,H=320,cx=W/2,cy=H/2,r=120;
  const P={};N.forEach((n,i)=>{const a=-Math.PI/2+i*2*Math.PI/N.length;P[n]=[cx+r*Math.cos(a),cy+r*Math.sin(a)]});
  const C={love:"#d4559a",trust:"var(--ok)",hate:"var(--bad)",deceive:"var(--accent)"},D={love:"",trust:"",hate:"6 4",deceive:"2 4"};
  const ed=E.map(([a,b,k],i)=>{const [x1,y1]=P[a],[x2,y2]=P[b],dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),o=E.some(e=>e[0]===b&&e[1]===a)?8:0,nx=-dy/l*o,ny=dx/l*o;
    return `<line x1="${x1+dx*.18+nx}" y1="${y1+dy*.18+ny}" x2="${x2-dx*.18+nx}" y2="${y2-dy*.18+ny}" stroke="${C[k]}" stroke-width="2.4" stroke-dasharray="${D[k]}" marker-end="url(#ar-${k})"/>`}).join("");
  const mk=Object.keys(C).map(k=>`<marker id="ar-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="${C[k]}"/></marker>`).join("");
  const nd=N.map(n=>`<circle cx="${P[n][0]}" cy="${P[n][1]}" r="5" fill="${COLORS[n]||"var(--muted)"}"/><text x="${P[n][0]}" y="${P[n][1]+(P[n][1]<cy?-10:18)}" text-anchor="middle" style="font:600 12px var(--f-ui);fill:var(--ink)">${esc(title(n))}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Character map for ${AN(+act)}"><defs>${mk}</defs>${ed}${nd}</svg>
   <div class="legend">${Object.entries({love:"Loves",trust:"Trusts",hate:"Hates / harms",deceive:"Deceives"}).map(([k,l])=>`<span><i style="background:${C[k]}"></i>${l}</span>`).join("")}</div>
   <p class="muted" style="font-size:.875rem">Arrows point from the character who feels it to the one it is aimed at.</p>`}
let mapAct=1;
function arcSVG(){const W=360,H=200,L=30,T=12,B=30,n=scenes.length,x=i=>L+i*(W-L-10)/(n-1),y=v=>T+(10-v)*(H-T-B)/10,cols=["var(--accent)","var(--bad)"];
  const ls=Object.entries(EX.arc).map(([k,v],j)=>`<polyline points="${v.map((a,i)=>x(i)+","+y(a)).join(" ")}" fill="none" stroke="${cols[j]}" stroke-width="2.4"/>`+v.map((a,i)=>`<circle cx="${x(i)}" cy="${y(a)}" r="2.6" fill="${cols[j]}"/>`).join("")).join("");
  const st=scenes.map((p,i)=>p.sc===1?i:-1).filter(i=>i>=0),near=(a,b)=>b!=null&&a!=null&&x(b)-x(a)<40;
  const ax=st.map((i,k)=>{const an=i===n-1||near(i,st[k+1])?"end":near(st[k-1],i)?"start":"middle";return `<line x1="${x(i)}" y1="${T}" x2="${x(i)}" y2="${H-B}" stroke="var(--rule)"/><text x="${x(i)+(an==="end"?3:an==="start"?-3:0)}" y="${H-B+16}" text-anchor="${an}">${scenes[i].act?"Act "+R[scenes[i].act]:"Ind."}</text>`}).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${CFG.chartLabel}">${ax}<text x="4" y="${y(10)+4}">10</text><text x="4" y="${y(0)+4}">0</text>${ls}</svg>
   <div class="legend">${Object.keys(EX.arc).map((k,j)=>`<span><i style="background:${cols[j]}"></i>${esc(k)}</span>`).join("")}</div><p class="intro">${esc(EX.arcnote)}</p>`}
let GLOSSUSE=null;
function glossUse(){if(GLOSSUSE)return GLOSSUSE;GLOSSUSE={};for(const id in speech)speech[id].lines.join(" ").replace(gre,(m,pre,w)=>{const k=gmap[w.toLowerCase()];if(k&&!GLOSSUSE[k])GLOSSUSE[k]=id;return m});return GLOSSUSE}
function studyExplore(){
  if(!exSel){$("sbody").innerHTML=`<p class="intro">Ways into the play beyond the text: plot, characters, context and language.</p><div class="exgrid">${EXT.filter(([k])=>exHas(k)).map(([k,tl,d])=>`<button data-ex="${k}"><b>${tl}</b><span>${d}</span></button>`).join("")}</div>`;return}
  const [,tl]=EXT.find(x=>x[0]===exSel);let h="";
  const hereK=pos&&sIdx(pos.s)>=0?sIdx(pos.s):-1;
  if(exSel==="timeline")h=EX.timeline.map((e,i)=>`<div class="exitem"><small>${i+1} · ${sName(scenes[sIdx(e.s)])}</small><br><b>${esc(e.t)}</b>${spLine(e.id)}</div>`).join("");
  if(exSel==="map")h=`<div class="chips" style="margin-bottom:6px">${ACTS.filter(a=>EX.rel[a]).map(a=>`<button class="chip" data-mapact="${a}" aria-pressed="${mapAct===a}">${AN(a)}</button>`).join("")}</div>${relSVG(mapAct)}`;
  if(exSel==="iago")h=`<p class="intro">Steps are ticked once you've read past that scene.</p>`+EX.iago.map(([s,st],i)=>{const k=sIdx(s),done=prog.done[s]||k<hereK;return `<div class="exitem"><span class="tick">${done?"✓":"○"}</span> <small>${sName(scenes[k])}</small><p style="margin-top:2px;color:var(--ink)">${i+1}. ${esc(st)}</p></div>`}).join("");
  if(exSel==="arcs")h=arcSVG();
  if(exSel==="verse")h=verseExplore();
  if(exSel==="director")h=dirExplore();
  if(exSel==="context")h=EX.context.map(([a,b])=>`<div class="exitem"><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join("");
  if(exSel==="critics")h=`<p class="intro">Use one of these in an essay to show you know other readings. "Paraphrased" means it is a summary, not their exact words.</p>`+Object.entries(EX.critics).map(([k,v])=>`<div class="stage3"><h3>${esc(QUOTES.themes[k][0])}</h3></div>`+v.map(([w,x])=>`<div class="exitem"><small>${esc(w)}</small><p>${esc(x)}</p></div>`).join("")).join("");
  if(exSel==="devices")h=Object.entries(EX.devices).map(([k,nm])=>{const its=Object.entries(EX.dev).flatMap(([id,arr])=>arr.filter(a=>a[0]===k).map(a=>[id,a]));return its.length?`<div class="stage3"><h3>${esc(nm)}</h3><small>${its.length}</small></div>`+its.map(([id,a])=>`<div class="exitem"><p style="color:var(--ink)">“${esc(a[2])}”: ${esc(a[1])}</p><small>${esc(where(speech[id]))} · <button class="link" data-speech="${id}">Read in context</button></small></div>`).join(""):""}).join("");
  if(exSel==="symbols"){h=Object.entries(EX.symbols).map(([nm,re])=>{const rx=new RegExp(re,"i"),ids=Object.keys(speech).filter(id=>rx.test(speech[id].lines.join(" ")));
    const per=[1,2,3,4,5].map(a=>ids.filter(id=>sceneOf(id).act===a).length);
    return `<details class="exitem"><summary><b>${esc(nm)}</b> <small>${ids.length} speeches · by act: ${per.join(" / ")}</small></summary>${ids.slice(0,60).map(id=>{const sp=speech[id],l=sp.lines.find(x=>rx.test(x))||sp.lines[0];return `<div class="exitem"><div class="o2">${esc(l.replace(/^~/,""))}</div><small>${esc(where(sp))} · <button class="link" data-speech="${id}">Read</button></small></div>`}).join("")}</details>`}).join("")}
  if(exSel==="contrast")h=EX.contrast.map(c=>`<div class="exitem"><b>${esc(c.t)}</b><ul>${c.pts.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>${c.ids.map(spLine).join("")}</div>`).join("");
  if(exSel==="insults")h=`<p class="intro">${CFG.insultsIntro}</p>`+EX.insults.map(x=>`<div class="exitem"><b>“${esc(x.f.replace(/^#\d+$/,"Devil!"))}”</b> <small>${esc(x.who)}</small><p>${esc(x.n)}</p><small>${esc(where(speech[x.id]))} · <button class="link" data-speech="${x.id}">Read in context</button></small></div>`).join("");
  if(exSel==="pronouns")h=`<p class="intro">"Thou" and "thee" are used to close friends, children and inferiors, or as an insult. "You" is polite and respectful. A switch from one to the other usually means a change in feeling.</p>`+EX.pronouns.map(x=>`<div class="exitem"><b>“${esc(x.f)}”</b><p>${esc(x.n)}</p>${spLine(x.id)}</div>`).join("");
  if(exSel==="glossary"){const u=glossUse(),ks=Object.keys(G).sort((a,b)=>a.toLowerCase().replace(/^'/,"").localeCompare(b.toLowerCase().replace(/^'/,"")));
    const L=[...new Set(ks.map(k=>k.replace(/^'/,"")[0].toUpperCase()))];
    h=`<div class="az">${L.map(l=>`<button data-az="${l}">${l}</button>`).join("")}</div>`+ks.map(k=>`<div class="exitem" data-letter="${k.replace(/^'/,"")[0].toUpperCase()}"><b>${esc(k)}</b><p>${esc(G[k])}</p>${u[k]?`<small>First used: ${esc(where(speech[u[k]]))} · <button class="link" data-speech="${u[k]}">Read</button></small>`:""}</div>`).join("")}
  if(exSel==="compare")h=compareHTML();
  if(exSel==="facts")h=`<dl class="facts">${EX.keyfacts.map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>`;
  if(exSel==="analysis"){const ks=Object.keys(EX.analysis);if(!ks.includes(anSel))anSel=ks[0];
    h=`<div class="chips" style="margin-bottom:10px">${ks.map(k=>`<button class="chip" data-an="${esc(k)}" aria-pressed="${anSel===k}">${esc(title(k))}</button>`).join("")}</div>`+
      EX.analysis[anSel].map(x=>`<p class="anp">${esc(x)}</p>`).join("")+(()=>{const qs=QUOTES.quotes.filter(q=>speech[q.id].who===anSel);return qs.length?`<div class="stage3"><h3>Their key quotes</h3><small>${qs.length}</small></div>`+qs.map(quoteHTML).join(""):""})()}
  if(exSel==="motifs")h=`<p class="intro">A motif is an idea or image that keeps coming back. A symbol is an object that stands for something bigger.</p>`+EX.motifs.map(([n,x,qi])=>`<div class="exitem"><b>${esc(n)}</b><p>${esc(x)}</p>${(qi||[]).map(i=>QUOTES.quotes[i]?quoteHTML(QUOTES.quotes[i]):"").join("")}</div>`).join("")+
      ((EX.symbols2||[]).length?`<div class="stage3"><h3>Symbols</h3></div>`+EX.symbols2.map(([n,x])=>`<div class="exitem"><b>${esc(n)}</b><p>${esc(x)}</p></div>`).join("")+`<p><button class="link" data-ex="symbols">Find every mention in the Symbol tracker ›</button></p>`:"");
  if(exSel==="bigq")h=`<p class="intro">Questions with no single right answer. Take a side, then use the points and quotes as evidence.</p>`+EX.bigq.map(([q,pts,qi])=>`<details class="exitem"><summary><b>${esc(q)}</b></summary><ul>${pts.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>${(qi||[]).map(i=>QUOTES.quotes[i]?quoteHTML(QUOTES.quotes[i]):"").join("")}</details>`).join("");
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
   ${shared.length?`<div class="box"><h3>Shared lines (${shared.length})</h3><p class="intro">One speaker ends a line and the next finishes it: a fast, close exchange.</p>${shared.slice(0,8).map(sp=>{const nx=sharedWith(sp).find(x=>x[0]==="after")[1];return `<div class="exitem"><p style="color:var(--ink)">${esc(title(sp.who))}: “${esc(lineOf(sp.lines[sp.lines.length-1]))}” / ${esc(title(nx.who))}: “${esc(lineOf(nx.lines[0]))}”</p><small>${sName(sceneOf(sp.id))} · <button class="link" data-speech="${sp.id}">Read in context</button></small></div>`}).join("")}</div>`:""}
   ${cps.length?`<div class="box"><h3>Scenes that end in a rhyme (${cps.length})</h3>${cps.slice(0,8).map(sp=>`<div class="exitem"><p style="color:var(--ink)">“${esc(lineOf(sp.lines[sp.lines.length-2]))} / ${esc(lineOf(sp.lines[sp.lines.length-1]))}”</p><small>${esc(where(sp))} · <button class="link" data-speech="${sp.id}">Read in context</button></small></div>`).join("")}</div>`:""}`}
/* language drills */
const LANG=EX.lang||{un:[],pun:[],st:[]};
const wtok=l=>l.split(/\s+/).filter(Boolean);
const clean=w=>w.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z']/g,"").replace(/^'+|'+$/g,"");
function langDrill(back){let h="";
  if(dr.k==="word"){if(!dr.g){const use=glossUse(),ks=Object.keys(use).filter(k=>speech[use[k]]&&G[k].length<90),k=rnd(ks),others=shuf(ks.filter(x=>x!==k&&G[x]!==G[k])).slice(0,3);dr.g={k,id:use[k],o:shuf([k,...others]),ans:null,n:(dr.g0||0)+1,ok:dr.gok||0}}
    const g=dr.g,sp=speech[g.id],ln=sp.lines.map(lineOf).find(l=>new RegExp("(^|[^A-Za-z'])"+g.k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?![A-Za-z])","i").test(l))||lineOf(sp.lines[0]);
    const hl=esc(ln).replace(new RegExp("(^|[^A-Za-z'])("+esc(g.k).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+")(?![A-Za-z])","i"),"$1<mark>$2</mark>");
    h=`<div class="qz"><div class="qn">Word ${g.n} · ${g.ok} right · ${esc(where(sp))}</div><p class="intro">Use the rest of the line to guess what the marked word means here.</p><h3 style="font:400 1.3rem/1.45 var(--f-old)">${hl}</h3>
     <div class="opts">${g.o.map(o=>`<button data-wd="${esc(o)}"${g.ans?" disabled":""} class="${g.ans?(o===g.k?"right":o===g.ans?"wrong":""):""}">${esc(G[o])}</button>`).join("")}</div>
     ${g.ans?`<p class="muted"><b>${esc(g.k)}</b>: ${esc(G[g.k])}</p><div class="row"><button class="btn primary" id="wd-next">Next word</button><button class="btn" data-speech="${g.id}">Read in context</button></div>`:""}</div>`}
  if(dr.k==="untangle"){const U=LANG.un;if(dr.u==null||!U[dr.u.i])dr.u={i:0,pk:[],res:null};const u=dr.u,[id,orig,mod]=U[u.i],ws=wtok(mod),ord=u.ord||(u.ord=shuf(ws.map((_,i)=>i)));
    const built=u.pk.map(i=>ws[i]).join(" "),done=u.pk.length===ws.length,ok=done&&u.pk.map(i=>clean(ws[i])).join(" ")===ws.map(clean).join(" ");
    h=`<div class="qz"><div class="qn">Line ${u.i+1} of ${U.length} · ${esc(where(speech[id]))}</div><p class="intro">Shakespeare often moves words around to fit the beat or to stress a word. Tap the words to put the line into everyday order.</p>
     <h3 style="font:400 1.3rem/1.45 var(--f-old)">“${esc(orig)}”</h3><div class="ord words">${ord.map(i=>`<button data-uw="${i}"${u.pk.includes(i)?" disabled":""}>${esc(ws[i].replace(/[,.;:!?]+$/,""))}</button>`).join("")}</div>
     <p class="ubuilt" style="color:${done?(ok?"var(--ok)":"var(--bad)"):"var(--ink)"}">${esc(built.replace(/[,.;:!?](?=\s|$)/g,""))||"<span class='muted'>Your order appears here</span>"}</p>
     ${done?`<p>${ok?"<b>Right.</b>":"<b>Not quite.</b> One everyday order:"} ${esc(mod)}</p><p class="muted">Which word did Shakespeare's order push to the front or the end? That is usually the word he wants stressed.</p>`:""}
     <div class="row">${u.pk.length&&!done?`<button class="link" id="un-undo">Undo</button>`:""}${done?`<button class="btn primary" id="un-next">${u.i+1<U.length?"Next line":"Start again"}</button>`:""}<button class="btn" data-speech="${id}">Read in context</button></div></div>`}
  if(dr.k==="pun"){const Pn=LANG.pun;if(dr.pn==null||!Pn[dr.pn.i])dr.pn={i:0,pick:null};const pn=dr.pn,[id,line,word,kind,ex]=Pn[pn.i],tw=wtok(word).map(clean),ws=wtok(line);
    const lab={pun:"Pun: one word, two meanings",shift:"Functional shift: a word used as a different part of speech",malapropism:"Malapropism: the wrong word that sounds like the right one",wordplay:"Wordplay"}[kind]||"Wordplay";
    h=`<div class="qz"><div class="qn">${pn.i+1} of ${Pn.length} · ${esc(where(speech[id]))}</div><p class="intro">${kind==="shift"?"Which word is doing a job it doesn't usually do?":kind==="malapropism"?"Which word is the wrong one?":"Which word is doing double duty?"} Tap it.</p>
     <div class="punl">${ws.map((w,i)=>{const hit=tw.includes(clean(w));return `<button data-pw="${i}"${pn.pick!=null?" disabled":""} class="${pn.pick!=null?(hit?"right":+pn.pick===i?"wrong":""):""}">${esc(w)}</button>`}).join(" ")}</div>
     ${pn.pick!=null?`<div class="snote"><b>${esc(lab)}</b><br>${esc(ex)}</div><div class="row"><button class="btn primary" id="pn-next">${pn.i+1<Pn.length?"Next":"Start again"}</button><button class="btn" data-speech="${id}">Read in context</button></div>`:""}</div>`}
  if(dr.k==="stress"){const St=LANG.st;if(dr.st==null||!St[dr.st.i])dr.st={i:0,seen:[]};const s=dr.st,[id,line,opts]=St[s.i],ws=wtok(line);
    const on=s.seen[s.seen.length-1];
    h=`<div class="qz"><div class="qn">${s.i+1} of ${St.length} · ${esc(where(speech[id]))}</div><p class="intro">Say the line aloud three times, leaning on a different word each time. Tap the word you'd stress to see what it does.</p>
     <h3 class="stl">${(used=>ws.map(w=>{const k=opts.findIndex(o=>clean(o[0])===clean(w));if(k>=0&&used.has(k))return esc(w);used.add(k);return k<0?esc(w):`<button class="stw${s.seen.includes(k)?" seen":""}${on===k?" on":""}" data-sw="${k}">${esc(w)}</button>`}).join(" "))(new Set())}</h3>
     ${s.seen.map(k=>`<div class="snote"><b>Stress “${esc(opts[k][0])}”</b><br>${esc(opts[k][1])}</div>`).join("")}
     ${s.seen.length>=opts.length?`<p class="muted">No single right answer: actors choose. Which reading fits your view of the character? Use it in an essay as "an actor might stress…".</p>`:""}
     <div class="row"><button class="btn primary" id="st-next">${s.i+1<St.length?"Next line":"Start again"}</button><button class="btn" data-speech="${id}">Read in context</button></div></div>`}
  $("sbody").innerHTML=back+h;const on=(id,f)=>{const el=$(id);if(el)el.onclick=f};
  $("sbody").querySelectorAll("[data-wd]").forEach(b=>b.onclick=()=>{const g=dr.g;g.ans=b.dataset.wd;if(g.ans===g.k)g.ok++;dr.gok=g.ok;studyDrill()});
  on("wd-next",()=>{dr.g0=dr.g.n;dr.g=null;studyDrill()});
  $("sbody").querySelectorAll("[data-uw]").forEach(b=>b.onclick=()=>{dr.u.pk.push(+b.dataset.uw);studyDrill()});
  on("un-undo",()=>{dr.u.pk.pop();studyDrill()});on("un-next",()=>{dr.u={i:(dr.u.i+1)%LANG.un.length,pk:[]};studyDrill()});
  $("sbody").querySelectorAll("[data-pw]").forEach(b=>b.onclick=()=>{dr.pn.pick=b.dataset.pw;studyDrill()});
  on("pn-next",()=>{dr.pn={i:(dr.pn.i+1)%LANG.pun.length,pick:null};studyDrill()});
  $("sbody").querySelectorAll("[data-sw]").forEach(b=>b.onclick=()=>{const k=+b.dataset.sw,S2=dr.st.seen,i=S2.indexOf(k);if(i>=0)S2.splice(i,1);S2.push(k);studyDrill()});
  on("st-next",()=>{dr.st={i:(dr.st.i+1)%LANG.st.length,seen:[]};studyDrill()});
}
/* ---------- performance: director's choices, thought track, cut the scene, two-line scenes ---------- */
let DIRC={};try{DIRC=JSON.parse(LS.get(PFX+"dir")||"{}")}catch(e){}
const saveDir=()=>LS.set(PFX+"dir",JSON.stringify(DIRC));
const DIRS=EX.dir||[];
function dirCard(i){const [id,line,q,opts]=DIRS[i],sp=speech[id],c=DIRC[i]||{},ch=c.c;
  return `<div class="exitem dirc"><small>${esc(where(sp))}</small><h3>${esc(q)}</h3><p class="dline">“${esc(line)}”</p>
   <div class="opts">${opts.map((o,j)=>`<button data-dc="${i}:${j}" class="${ch===j?"right":""}" aria-pressed="${ch===j}"><b>${esc(o[0])}</b>${ch!=null?`<span>${esc(o[1])}</span>`:""}</button>`).join("")}</div>
   ${ch!=null?`<label class="lbl" for="dw-${i}">Why this choice? Say what the audience should feel.</label><textarea class="sinput" id="dw-${i}" data-dw="${i}" placeholder="I would stage it this way because…">${esc(c.w||"")}</textarea>`:`<p class="muted">Pick how you would stage it. Every option is defensible: the effects appear once you choose.</p>`}
   <div class="row"><button class="link" data-speech="${id}">Read in context</button></div></div>`}
function dirExplore(){const n=Object.values(DIRC).filter(x=>x&&x.c!=null).length;
  return `<p class="intro">You are the director. Each moment can be staged more than one way, and each choice changes what the audience feel. Examiners reward "an actor might…" or "a director could…" when you explain the effect. ${n} of ${DIRS.length} decided.</p>`+DIRS.map((_,i)=>dirCard(i)).join("")}
function dirTools(id){const ix=DIRS.map((d,i)=>[d,i]).filter(([d])=>+d[0]===+id);if(!ix.length)return "";
  return ix.map(([d,i])=>`<details class="about"><summary>Director's choice: ${esc(d[2])}</summary><ul>${d[3].map((o,j)=>`<li><b>${esc(o[0])}</b>: ${esc(o[1])}${(DIRC[i]||{}).c===j?" <small>(your choice)</small>":""}</li>`).join("")}</ul><button class="btn sm" data-dirgo="1">Decide in Study</button></details>`).join("")}
function thoughtHTML(sp){return `<details class="about tthink"><summary>Thought track: what is ${esc(title(sp.who))} really thinking?</summary><p class="muted">Actors play the thought under the words. Write it in the first person, then add it to your note.</p><label for="tt" class="sr">Thought track</label><textarea id="tt" placeholder="I…"></textarea><div class="acts"><button class="btn sm" id="tt-add">Add to my note</button></div></details>`}
function wirePerf(id){const tt=$("tt-add");if(tt)tt.onclick=()=>{const v=$("tt").value.trim();if(!v){toast("Write the thought first");return}const cur=(marks[id]||{}).note||"",n=(cur.trim()?cur.trim()+"\n":"")+"Thought track: "+v;saveMark(id,{note:n});if($("tn"))$("tn").value=n;$("tt").value="";toast("Added to your note")};
  document.querySelectorAll(".tool [data-dirgo]").forEach(b=>b.onclick=()=>{closeSheet();closePanel();exSel="director";goStudy("explore")})}
/* drills */
function perfDrill(back){let h="";
  if(dr.k==="cut"){if(!dr.c){const ok=scenes.map((s,i)=>[s,i]).filter(([s])=>s.items.filter(it=>it.t==="sp").length>=10),here=pos&&sIdx(pos.s)>=0&&ok.find(x=>x[1]===sIdx(pos.s));dr.c={k:(here||rnd(ok))[1],cut:{},chk:false}}
    const C=dr.c,s=scenes[C.k],sps=s.items.filter(it=>it.t==="sp"),tot=sps.reduce((a,x)=>a+x.lines.length,0),kept=sps.filter(x=>!C.cut[x.id]).reduce((a,x)=>a+x.lines.length,0),pc=Math.round(kept/tot*100);
    const lost=C.chk?sps.filter(x=>C.cut[x.id]&&(QBY[x.id]||EX.irony[x.id]||STUDY.notes[x.id])):[];
    h=`<p class="intro">Directors often cut Shakespeare. Cut this scene to half its lines or less, and keep the story clear. Tap a speech to cut it; tap again to keep it.</p>
     <label class="lbl" for="cut-s">Scene</label><select class="sinput" id="cut-s">${scenes.map((x,i)=>x.items.filter(it=>it.t==="sp").length>=10?`<option value="${i}"${i===C.k?" selected":""}>${sName(x)} · ${esc(shortLoc(x))}</option>`:"").join("")}</select>
     <div class="cutbar"><b>${kept}</b> of ${tot} lines kept (${pc}%)<i><b style="width:${pc}%;background:${pc<=50?"var(--ok)":"var(--accent)"}"></b></i></div>
     <div class="cuts">${sps.map(x=>`<button data-cut="${x.id}" class="${C.cut[x.id]?"cut":""}" aria-pressed="${!!C.cut[x.id]}"><small>${esc(title(x.who))} · ${x.lines.length} line${x.lines.length===1?"":"s"}${QBY[x.id]&&C.chk?" · key quote":""}</small><span>${esc(lineOf(x.lines[0]).slice(0,90))}${x.lines.length>1||lineOf(x.lines[0]).length>90?"…":""}</span></button>`).join("")}</div>
     <div class="row"><button class="btn primary" id="cut-chk">${C.chk?"Check again":"Check my cut"}</button><button class="btn" id="cut-reset">Start again</button></div>
     ${C.chk?`<div class="box"><h3>${pc<=50?"Within the target.":"Still over half: keep cutting."}</h3>${lost.length?`<p>You cut ${lost.length} speech${lost.length===1?"":"es"} the notes flag as important:</p><ul>${lost.map(x=>`<li>${esc(title(x.who))}: “${esc(lineOf(x.lines[0]).slice(0,70))}…”${QBY[x.id]?" (key quote)":EX.irony[x.id]?" (dramatic irony)":" (study note)"}</li>`).join("")}</ul>`:`<p>You kept every speech the notes flag as important.</p>`}
      ${(STUDY.scenes[s.id]||{}).key?`<p class="muted">Does your cut still tell these points?</p><ul>${STUDY.scenes[s.id].key.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}<p class="muted">There is no single right cut. What did you lose: plot, character, or atmosphere?</p></div>`:""}`}
  if(dr.k==="two"){if(!dr.t){const ok=scenes.map((s,i)=>[s,i]).filter(([s])=>new Set(s.items.filter(it=>it.t==="sp").map(x=>x.who)).size>=2);dr.t={k:rnd(ok)[1],a:"",b:"",show:false}}
    const T=dr.t,s=scenes[T.k],by={};s.items.filter(it=>it.t==="sp").forEach(x=>by[x.who]=(by[x.who]||0)+x.lines.length);const [w1,w2]=Object.entries(by).sort((a,b)=>b[1]-a[1]).map(x=>x[0]),st=STUDY.scenes[s.id]||{},kq=QUOTES.quotes.filter(q=>speech[q.id].page===s.id)[0];
    h=`<p class="intro">Shrink a whole scene into two lines: one for each main character, in your own words. It forces you to find what the scene is really about.</p>
     <div class="qz"><div class="qn">${sName(s)} · ${esc(shortLoc(s))}</div>
     <label class="lbl" for="two-a">${esc(title(w1))}</label><input class="sinput" id="two-a" value="${esc(T.a)}" placeholder="What ${esc(title(w1))} wants or says, in one line">
     <label class="lbl" for="two-b" style="margin-top:8px">${esc(title(w2))}</label><input class="sinput" id="two-b" value="${esc(T.b)}" placeholder="How ${esc(title(w2))} answers">
     <div class="row"><button class="btn primary" id="two-show">${T.show?"Hide":"Compare"}</button><button class="btn" id="two-next">Another scene</button><button class="btn" data-go2="${s.id}">Read the scene</button></div>
     ${T.show?`<div class="box">${st.sum?`<p><b>The scene:</b> ${esc(st.sum)}</p>`:""}${kq?quoteHTML(kq):""}<p class="muted">Did your two lines catch the conflict? Act them out loud with a friend.</p></div>`:""}</div>`}
  $("sbody").innerHTML=back+h;const on=(id,f)=>{const el=$(id);if(el)el.onclick=f};
  if($("cut-s"))$("cut-s").onchange=e=>{dr.c={k:+e.target.value,cut:{},chk:false};studyDrill()};
  $("sbody").querySelectorAll("[data-cut]").forEach(b=>b.onclick=()=>{const i=b.dataset.cut;if(dr.c.cut[i])delete dr.c.cut[i];else dr.c.cut[i]=1;const y=scrollY;studyDrill();scrollTo(0,y)});
  on("cut-chk",()=>{dr.c.chk=true;studyDrill()});on("cut-reset",()=>{dr.c={k:dr.c.k,cut:{},chk:false};studyDrill()});
  if($("two-a")){$("two-a").oninput=e=>dr.t.a=e.target.value;$("two-b").oninput=e=>dr.t.b=e.target.value}
  on("two-show",()=>{dr.t.show=!dr.t.show;studyDrill()});on("two-next",()=>{dr.t=null;studyDrill()});
}
const DRILLS=[["gap","Fill the gap","Type the missing words in a key quote"],["ladder","Memory ladder","Learn a quote: full, then half hidden, then first letters, then from memory"],["explain","Explain this line","Put a passage in your own words, then compare"],["who","Who said it?","Match 8 quotes to their speakers"],["order","Put it in order","Sort 6 plot events into the right sequence"],["word","Word detective","Guess what an old word means from the line around it"],...(EX.lang?[["untangle","Untangle","Put Shakespeare's word order into everyday order"],["pun","Pun hunt","Find the word doing double duty"],["stress","Tone and stress","Lean on different words and hear the meaning change"]]:[]),["cut","Cut the scene","Keep half the lines and still tell the story"],["two","Two-line scene","Sum up a scene as one line for each of two characters"]];
const rnd=a=>a[Math.floor(Math.random()*a.length)],shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
function studyDrill(){
  const back=`<div class="exh"><button class="btn sm" data-drill="">‹ All drills</button><h2>${dr.k?DRILLS.find(d=>d[0]===dr.k)[1]:""}</h2></div>`;
  if(!dr.k){$("sbody").innerHTML=`<p class="intro">Short exercises for remembering quotes and understanding the language.</p><div class="drills">${DRILLS.map(([k,a,b])=>`<button data-drill="${k}"><b>${a}</b><span>${b}</span></button>`).join("")}</div>`;return}
  if(["word","untangle","pun","stress"].includes(dr.k))return langDrill(back);
  if(["cut","two"].includes(dr.k))return perfDrill(back);
  let h="";
  if(dr.k==="gap"){if(!dr.q){const gc=q=>{const ws=q.text.split(/\s+/),nw=ws.map(w=>w.replace(/[^A-Za-z']/g,"").toLowerCase().replace(/^'+|'+$/g,"").replace(/'(s|d|ll)$/,""));return ws.map((w,i)=>[nw[i],i]).filter(x=>x[0].length>3&&nw.indexOf(x[0])===nw.lastIndexOf(x[0]))};
    const gq=QUOTES.quotes.filter(x=>gc(x).length),q=rnd(gq.length?gq:QUOTES.quotes),ws=q.text.split(/\s+/),cand=gc(q);const pick=shuf(cand).slice(0,Math.min(2,cand.length)).map(x=>x[1]);dr.q={q,ws,pick,res:null}}
    const {q,ws,pick,res}=dr.q;h=`<div class="qz"><div class="gapq">“${ws.map((w,i)=>pick.includes(i)?(res?`<b style="color:${res[i]?"var(--ok)":"var(--bad)"}">${esc(w)}</b>`:`<input data-gap="${i}" aria-label="Missing word" autocomplete="off" autocapitalize="off">`)+esc(w.replace(/[A-Za-z']+/,"").slice(0)):esc(w)).join(" ")}”</div>
      <p class="muted">${esc(title(speech[q.id].who))} · ${sName(sceneOf(q.id))}</p><div class="row">${res?`<button class="btn primary" id="dr-next">Next quote</button>`:`<button class="btn primary" id="dr-check">Check</button><button class="link" id="dr-show">Show answer</button>`}</div></div>`}
  if(dr.k==="ladder"){if(dr.i==null)dr.i=0;if(dr.l==null)dr.l=0;const q=QUOTES.quotes[dr.i],ws=q.text.split(/\s+/);
    const view=dr.l===0?esc(q.text):dr.l===1?ws.map((w,i)=>i%2?w.replace(/[A-Za-z]/g,"_"):w).map(esc).join(" "):dr.l===2?ws.map(w=>w.replace(/([A-Za-z])[A-Za-z']*/,"$1")).map(esc).join(" "):"";
    h=`<label class="lbl" for="ld-q">Quote</label><select class="sinput" id="ld-q">${QUOTES.quotes.map((x,i)=>`<option value="${i}"${i===dr.i?" selected":""}>${i+1}. ${esc(title(speech[x.id].who))} · ${sName(sceneOf(x.id))}</option>`).join("")}</select>
     <div class="qz" style="margin-top:10px"><div class="qn">Step ${dr.l+1} of 4: ${["Read it","Every other word hidden","First letters only","From memory"][dr.l]}</div><div class="ladder">${dr.l<3?view:`<textarea class="sinput" id="ld-a" placeholder="Type the whole quote from memory"></textarea>`}</div>
     <div class="row">${dr.l>0?`<button class="btn" id="ld-prev">‹ Easier</button>`:""}${dr.l<3?`<button class="btn primary" id="ld-next">Harder ›</button>`:`<button class="btn primary" id="ld-chk">Check</button>`}</div><div id="ld-res"></div></div>`}
  if(dr.k==="explain"){if(!dr.p){const ids=Object.keys(PARTS);const id=rnd(ids),ps=PARTS[id],pi=Math.floor(Math.random()*ps.length);dr.p={id,pi,show:false}}
    const sp=speech[dr.p.id],q=partsOf(sp)[dr.p.pi];h=`<div class="qz"><div class="qn">${esc(where(sp))}</div><div class="tool"><div class="porig">${sp.lines.slice(q[0],q[1]+1).map(l=>`<span>${esc(l.replace(/^~/,""))}</span>`).join("")}</div></div>
     <label class="lbl" for="ex-a" style="display:block;margin-top:12px">In your own words</label><textarea class="sinput" id="ex-a" style="min-height:90px" placeholder="What is being said here?">${esc(dr.p.mine||"")}</textarea>
     ${dr.p.show?`<div class="tool"><div class="pmod"><div class="ptag">Modern English</div><p>${esc(q[2])}</p></div></div><p class="muted">Did you catch the main point? Compare word choices too.</p>`:""}
     <div class="row">${dr.p.show?`<button class="btn primary" id="ex-next">Another passage</button>`:`<button class="btn primary" id="ex-show">Compare</button>`}</div></div>`}
  if(dr.k==="who"){if(!dr.w){const qs=shuf(QUOTES.quotes.filter(q=>!q.text.toLowerCase().includes(speech[q.id].who.toLowerCase()))).slice(0,8);dr.w={qs,i:0,ok:0,ans:null}}const W=dr.w;
    if(W.i<W.qs.length){const q=W.qs[W.i],who=speech[q.id].who,pool=[...new Set([...CFG.drillCast,...QUOTES.quotes.map(x=>speech[x.id].who)])],opts=shuf([who,...shuf(pool.filter(x=>x!==who)).slice(0,3)]);
      h=`<div class="qz"><div class="qn">Quote ${W.i+1} of ${W.qs.length} · score ${W.ok}</div><h3 style="font:400 1.35rem/1.45 var(--f-old)">“${esc(q.text)}”</h3><div class="opts">${opts.map(o=>`<button data-who="${o}"${W.ans?" disabled":""} class="${W.ans?(o===who?"right":o===W.ans?"wrong":""):""}">${esc(title(o))}</button>`).join("")}</div>
       ${W.ans?`<p class="muted">${sName(sceneOf(q.id))}. ${esc(q.note)}</p><div class="row"><button class="btn primary" id="who-next">Next</button></div>`:""}</div>`}
    else h=`<div class="qz" style="text-align:center"><div class="big">${W.ok} of ${W.qs.length}</div><button class="btn primary" id="who-again">Play again</button></div>`}
  if(dr.k==="order"){if(!dr.o){const ev=shuf(EX.timeline.map((e,i)=>i)).slice(0,6).sort((a,b)=>a-b);dr.o={ev,show:shuf(ev),picked:[]}}const O=dr.o,done=O.picked.length===O.ev.length;
    h=`<p class="intro">Tap the events in the order they happen.</p><div class="ord">${O.show.map(i=>`<button data-ord="${i}"${O.picked.includes(i)?" disabled":""}>${esc(EX.timeline[i].t)}</button>`).join("")}</div>
     <h3 class="lbl" style="margin-top:14px">Your order</h3><ol>${O.picked.map((i,n)=>`<li style="color:${done?(i===O.ev[n]?"var(--ok)":"var(--bad)"):"inherit"}">${esc(EX.timeline[i].t)}${done&&i!==O.ev[n]?` <small class="muted">(should be: ${esc(EX.timeline[O.ev[n]].t)})</small>`:""}</li>`).join("")}</ol>
     ${done?`<p><b>${O.picked.filter((i,n)=>i===O.ev[n]).length} of 6 in the right place.</b></p><button class="btn primary" id="ord-again">New set</button>`:`<button class="link" id="ord-undo">Undo</button>`}`}
  $("sbody").innerHTML=back+h;
  const on=(id,f)=>{const el=$(id);if(el)el.onclick=f};
  on("dr-check",()=>{const r={};dr.q.pick.forEach(i=>{const v=(document.querySelector(`[data-gap="${i}"]`).value||"").toLowerCase().replace(/[^a-z']/g,"");r[i]=v===dr.q.ws[i].toLowerCase().replace(/[^a-z']/g,"")});dr.q.res=r;studyDrill()});
  on("dr-show",()=>{dr.q.res=Object.fromEntries(dr.q.pick.map(i=>[i,false]));studyDrill()});on("dr-next",()=>{dr.q=null;studyDrill()});
  if($("ld-q"))$("ld-q").onchange=e=>{dr.i=+e.target.value;dr.l=0;studyDrill()};on("ld-next",()=>{dr.l++;studyDrill()});on("ld-prev",()=>{dr.l--;studyDrill()});
  on("ld-chk",()=>{const a=$("ld-a").value.toLowerCase().replace(/[^a-z' ]/g,"").split(/\s+/).filter(Boolean),b=QUOTES.quotes[dr.i].text.toLowerCase().replace(/[^a-z' ]/g,"").split(/\s+/).filter(Boolean);
    const L=Array(b.length+1).fill(0).map(()=>Array(a.length+1).fill(0));for(let i=1;i<=b.length;i++)for(let j=1;j<=a.length;j++)L[i][j]=b[i-1]===a[j-1]?L[i-1][j-1]+1:Math.max(L[i-1][j],L[i][j-1]);const hit=L[b.length][a.length];$("ld-res").innerHTML=`<p><b>${hit} of ${b.length} words right.</b> ${hit===b.length?"Perfect.":"Answer: "+esc(QUOTES.quotes[dr.i].text)}</p>`});
  on("ex-show",()=>{dr.p.mine=$("ex-a").value;dr.p.show=true;studyDrill()});on("ex-next",()=>{dr.p=null;studyDrill()});
  $("sbody").querySelectorAll("[data-who]").forEach(b=>b.onclick=()=>{const W=dr.w,q=W.qs[W.i];W.ans=b.dataset.who;if(W.ans===speech[q.id].who)W.ok++;studyDrill()});
  on("who-next",()=>{dr.w.i++;dr.w.ans=null;studyDrill()});on("who-again",()=>{dr.w=null;studyDrill()});
  $("sbody").querySelectorAll("[data-ord]").forEach(b=>b.onclick=()=>{dr.o.picked.push(+b.dataset.ord);studyDrill()});on("ord-undo",()=>{dr.o.picked.pop();studyDrill()});on("ord-again",()=>{dr.o=null;studyDrill()});
}
/* essay planner with exam questions, 45-minute timer and self-marking checklist */
let PLAN={};try{PLAN=JSON.parse(LS.get(PFX+"plan")||"{}")}catch(e){}
const savePlan=()=>LS.set(PFX+"plan",JSON.stringify(PLAN));
let tmr=null;
function studyPlan(){
  const qi=PLAN.cur??0,P=PLAN[qi]=PLAN[qi]||{th:"",pts:[{},{},{}],chk:{}},Q=EX.examq[qi],sug=Q[1];
  const qopt=i=>`<option value="">Choose a quote…</option>`+[...sug.map(j=>[j,true]),...QUOTES.quotes.map(q=>[q.i,false]).filter(x=>!sug.includes(x[0]))].map(([j,s])=>`<option value="${j}"${String(i)===String(j)?" selected":""}>${s?"★ ":""}${esc(QUOTES.quotes[j].text.slice(0,55))}</option>`).join("");
  const run=PLAN.t0&&Date.now()-PLAN.t0<45*6e4;
  $("sbody").innerHTML=`${run?`<div class="timer"><span>Timed essay</span><b id="tm">45:00</b><button class="btn sm" id="tm-stop" style="color:var(--page);border-color:var(--page)">Stop</button></div>`:""}
   <div class="plan"><p class="intro">Plan an answer to a typical exam question. ★ quotes are the best fit. Everything saves as you type.</p>
   <label for="pl-q">Question</label><select id="pl-q">${EX.examq.map((x,i)=>`<option value="${i}"${i===qi?" selected":""}>${esc(x[0])}</option>`).join("")}</select>
   <label for="pl-th">Your argument in one sentence</label><textarea id="pl-th" data-pf="th" placeholder="Shakespeare presents … as …">${esc(P.th||"")}</textarea>
   ${P.pts.map((pt,i)=>`<div class="pt3"><h4>Point ${i+1}</h4><label>Point</label><textarea data-pp="${i}:p" placeholder="Topic sentence">${esc(pt.p||"")}</textarea>
     <label>Evidence</label><select data-pp="${i}:q">${qopt(pt.q)}</select><label>Analysis</label><textarea data-pp="${i}:a" placeholder="Zoom in on a word or image. Link to context or another moment.">${esc(pt.a||"")}</textarea></div>`).join("")}
   <div class="row noprint"><button class="btn primary" id="pl-copy">Copy outline</button><button class="btn" id="pl-dl">Download outline</button><button class="btn" id="pl-print">Print</button>${run?"":`<button class="btn" id="tm-go">Start 45-minute timed essay</button>`}</div>
   <div class="box"><h3>Quote bank for this question</h3>${sug.map(j=>quoteHTML(QUOTES.quotes[j])).join("")}</div>
   <div class="box chk"><h3>Self-marking checklist</h3><p class="intro">After writing, tick what your answer does.</p>${EX.check.map((c,i)=>`<label><input type="checkbox" data-ck="${i}"${P.chk[i]?" checked":""}> ${esc(c)}</label>`).join("")}<p class="muted" id="ck-n">${Object.values(P.chk).filter(Boolean).length} of ${EX.check.length}</p></div><div class="box chk ao" id="aobox"></div></div>`;
  aoMount(P,savePlan);
  $("pl-q").onchange=e=>{PLAN.cur=+e.target.value;savePlan();studyPlan()};
  $("sbody").querySelectorAll("[data-pf]").forEach(el=>el.oninput=()=>{P.th=el.value;savePlan()});
  $("sbody").querySelectorAll("[data-pp]").forEach(el=>{const [i,f]=el.dataset.pp.split(":");const h=()=>{P.pts[i][f]=el.value;savePlan()};el.oninput=h;el.onchange=h});
  $("sbody").querySelectorAll("[data-ck]").forEach(el=>el.onchange=()=>{P.chk[el.dataset.ck]=el.checked;savePlan();$("ck-n").textContent=`${Object.values(P.chk).filter(Boolean).length} of ${EX.check.length}`});
  const txt=()=>`ESSAY PLAN\n${Q[0]}\n\nArgument: ${P.th||""}\n`+P.pts.map((pt,i)=>`\nPoint ${i+1}: ${pt.p||""}\nEvidence: ${pt.q!==undefined&&pt.q!==""?`"${QUOTES.quotes[pt.q].text}" (${title(speech[QUOTES.quotes[pt.q].id].who)}, ${sName(sceneOf(QUOTES.quotes[pt.q].id))})`:""}\nAnalysis: ${pt.a||""}\n`).join("");
  $("pl-copy").onclick=()=>copyText(txt());$("pl-dl").onclick=()=>download(CFG.file+"-essay-plan.txt",txt(),"text/plain");$("pl-print").onclick=()=>window.print();
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
  if(step===2)body=`<p class="intro">Now write a paragraph of your own on the same question, using a different quote.</p>
    <label for="pa-oq">Your quote</label><select id="pa-oq">${Q[1].map(i=>`<option value="${i}"${+O.q===i?" selected":""}>${i===M[0]?"(model's) ":""}${esc(QUOTES.quotes[i].text.slice(0,60))}</option>`).join("")}</select>
    ${PSTEPS.map(([k,l,h])=>`<div class="pl pl-${k}"><b>${l}</b>${k==="e"?`<p>${qAsk(QUOTES.quotes[+O.q])}</p>`:`<textarea data-pao="${k}" placeholder="${h}">${esc(O[k]||"")}</textarea>`}</div>`).join("")}
    <div class="row noprint"><button class="btn" id="pa-copy">Copy paragraph</button></div><div class="box chk ao" id="aobox"></div>`;
  $("sbody").innerHTML=`<div class="plan"><label for="pa-q">Question</label><select id="pa-q">${EX.examq.map((x,i)=>`<option value="${i}"${i===qi?" selected":""}>${esc(x[0])}</option>`).join("")}</select>
    <div class="chips psteps" role="tablist">${stepT.map((t,i)=>`<button class="chip" data-pstep="${i}" aria-pressed="${i===step}">${t}</button>`).join("")}</div>${body}</div>`;
  $("pa-q").onchange=e=>{PA.cur=+e.target.value;PA.cmp=false;savePA();studyPara()};
  $("sbody").querySelectorAll("[data-pstep]").forEach(b=>b.onclick=()=>{PA.step=+b.dataset.pstep;PA.cmp=false;savePA();studyPara();scrollTo(0,0)});
  $("sbody").querySelectorAll("[data-paf]").forEach(t=>{const k=t.dataset.paf;t.value=F[k]||"";t.oninput=()=>{F[k]=t.value;savePA()}});
  if($("pa-cmp"))$("pa-cmp").onclick=()=>{PA.cmp=!PA.cmp;savePA();const y=scrollY;studyPara();scrollTo(0,y)};
  if($("pa-oq"))$("pa-oq").onchange=e=>{O.q=+e.target.value;savePA();studyPara()};
  $("sbody").querySelectorAll("[data-pao]").forEach(t=>t.oninput=()=>{O[t.dataset.pao]=t.value;savePA()});
  if($("pa-copy"))$("pa-copy").onclick=()=>{const q=QUOTES.quotes[+O.q];copyText(`${Q[0]}\n\n`+[O.p,`"${q.text}"`,O.m,O.f,O.c,O.a].filter(Boolean).join(" "))};
  if(step===2)aoMount(Mk,savePA);
}
/* character profiles */
let PROF={};try{PROF=JSON.parse(LS.get(PFX+"prof")||"{}")}catch(e){}
let profSel=CFG.profDefault;
function studyProf(){const P=PROF[profSel]=PROF[profSel]||{tr:["","",""],q:["","",""],sum:""},own=QUOTES.quotes.filter(q=>speech[q.id].who===profSel),c=CH[profSel];
  const qo=v=>`<option value="">Choose a quote…</option>`+[...own,...QUOTES.quotes.filter(q=>!own.includes(q))].map(q=>`<option value="${q.i}"${String(v)===String(q.i)?" selected":""}>${own.includes(q)?"★ ":""}${esc(q.text.slice(0,55))}</option>`).join("");
  $("sbody").innerHTML=`<div class="plan"><p class="intro">Build a profile for each character: three traits, each backed by a quote. ★ quotes are spoken by them.</p>
   <div class="chips" style="margin-bottom:8px">${MAINS.map(w=>`<button class="chip" data-prof="${w}" aria-pressed="${w===profSel}">${esc(title(w))}</button>`).join("")}</div>
   ${c?`<p class="intro"><i>${esc(c.desc)}</i></p>`:""}
   ${[0,1,2].map(i=>`<div class="pt3"><h4>Trait ${i+1}</h4><label>Trait</label><input data-pr="tr:${i}" value="${esc(P.tr[i]||"")}" placeholder="e.g. trusting, proud, cunning"><label>Quote</label><select data-pr="q:${i}">${qo(P.q[i])}</select></div>`).join("")}
   <label for="pr-sum">How they change across the play</label><textarea id="pr-sum" data-pr="sum">${esc(P.sum||"")}</textarea>
   <div class="row noprint"><button class="btn primary" id="pr-copy">Copy all profiles</button></div></div>`;
  $("sbody").querySelectorAll("[data-pr]").forEach(el=>{const h=()=>{const [f,i]=el.dataset.pr.split(":");if(f==="sum")P.sum=el.value;else P[f][i]=el.value;LS.set(PFX+"prof",JSON.stringify(PROF))};el.oninput=h;el.onchange=h});
  $("sbody").querySelectorAll("[data-prof]").forEach(b=>b.onclick=()=>{profSel=b.dataset.prof;studyProf()});
  $("pr-copy").onclick=()=>copyText(Object.entries(PROF).map(([w,p])=>`${title(w).toUpperCase()}\n`+p.tr.map((x,i)=>x||p.q[i]!==""?`- ${x}${p.q[i]!==""&&p.q[i]!=null?`: "${QUOTES.quotes[p.q[i]].text}"`:""}`:"").filter(Boolean).join("\n")+(p.sum?`\nChange: ${p.sum}`:"")).join("\n\n"));
}
/* act summaries (printable) */
function actText(a){return `${AN(a).toUpperCase()}\n`+scenes.filter(p=>p.act===a).map(p=>{const s=STUDY.scenes[p.id]||{};return `\n${sName(p)} (${shortLoc(p)})\n${s.sum||""}\n`+(s.key||[]).map(k=>`  - ${k}`).join("\n")}).join("\n")+`\n\nKey quotes:\n`+QUOTES.quotes.filter(q=>sceneOf(q.id).act===a).map(q=>`  "${q.text}" (${title(speech[q.id].who)})`).join("\n")}
function studyActs(){$("sbody").innerHTML=`<p class="intro noprint">One page per act: what happens, the key points and the key quotes. Print or copy them for revision.</p>
  <div class="row noprint"><button class="btn primary" id="as-print">Print all</button><button class="btn" id="as-copy">Copy all</button></div>
  ${ACTS.map(a=>`<div class="box" style="break-after:page"><h3>${LAT[a]} · ${AN(a)}</h3>${scenes.filter(p=>p.act===a).map(p=>{const s=STUDY.scenes[p.id]||{};return `<div class="exitem"><b>${sName(p)}</b> <small>${esc(shortLoc(p))}</small><p>${esc(s.sum||"")}</p><ul>${(s.key||[]).map(k=>`<li>${esc(k)}</li>`).join("")}</ul></div>`}).join("")}
   <div class="lbl" style="margin-top:10px">Key quotes</div>${QUOTES.quotes.filter(q=>sceneOf(q.id).act===a).map(q=>`<p style="margin:4px 0;font-family:var(--f-old);font-size:1.05rem">“${esc(q.text)}” <small class="muted">${esc(title(speech[q.id].who))}</small></p>`).join("")}</div>`).join("")}`;
  $("as-print").onclick=()=>window.print();$("as-copy").onclick=()=>copyText([1,2,3,4,5].map(actText).join("\n\n"))}
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
function itemHTML(it){const k=it.k,ty=k.split(":")[0];
  if(ty==="qz"){const q=it.q||(it.q=(()=>{const x=kQuiz(k),ix=shuf(x.o.map((_,i)=>i));return Object.assign({},x,{o:ix.map(i=>x.o[i]),a:ix.indexOf(x.a)})})());
    return `<div class="qz"><div class="qn">Quiz · ${sName(scenes[sIdx(q.s)])}</div><h3>${esc(q.q)}</h3><div class="opts">${q.o.map((o,i)=>`<button data-pick="${i}"${it.stage==="shown"?" disabled":""} class="${it.stage==="shown"?(i===q.a?"right":i===it.pick?"wrong":""):""}">${esc(o)}</button>`).join("")}</div></div>`}
  if(ty==="pt"){const [,id,pi]=k.split(":"),sp=speech[id],ps=partsOf(sp),q=ps[+pi],p=sceneOf(id),cue=+pi>0?{txt:partLines(sp,ps[pi-1]).join(" ").split(/\s+/).slice(-3).join(" ")}:cueOf(p,+id);
    return `<div class="card" style="--c:${COLORS[sp.who]||"var(--ink)"}"><p class="qn">Learn a part · ${esc(title(sp.who))} · ${sName(p)}</p><p class="muted">${cue?`Cue: <b>… ${esc(cue.txt)}</b>`:"You speak first"}</p>${it.stage==="shown"?`<div class="ptxt">${partLines(sp,q).map(l=>`<span>${esc(l)}</span>`).join("")}</div>`:`<p>Say your line aloud.</p>`}</div>`}
  const q=kq(k),sp=speech[q.id],p=sceneOf(q.id),c=COLORS[sp.who]||"var(--ink)";
  const ans=`<div class="ans"><b>${esc(title(sp.who))}</b><span>${sName(p)} · ${esc(shortLoc(p))}</span><p>${esc(q.note)}</p></div>`;
  if(ty==="who")return `<div class="card" style="--c:${c}"><p class="qn">Who said it, and when?</p><blockquote>“${esc(q.text)}”</blockquote>${it.stage==="shown"?ans:""}</div>`;
  if(ty==="fin"){const f=firstWords(q.text);return `<div class="card" style="--c:${c}"><p class="qn">Finish the quote · ${esc(title(sp.who))}</p><blockquote>“${esc(f.a)} ${it.stage==="shown"?`<span class="fin">${esc(f.b)}</span>”`:"…”"}</blockquote>${it.stage==="shown"?ans:""}</div>`}
  if(ty==="th"){const o=it.o||(it.o=shuf([rnd(q.themes),...shuf(Object.keys(QUOTES.themes).filter(t=>!q.themes.includes(t))).slice(0,3)]));
    return `<div class="qz"><div class="qn">Which theme is this quote about?</div><h3 style="font:400 1.3rem/1.45 var(--f-old)">“${esc(q.text)}”</h3><div class="opts">${o.map(t=>`<button data-pick="${t}"${it.stage==="shown"?" disabled":""} class="${it.stage==="shown"?(q.themes.includes(t)?"right":t===it.pick?"wrong":""):""}">${esc(QUOTES.themes[t][0])}</button>`).join("")}</div>${it.stage==="shown"?`<p class="muted">${esc(title(sp.who))}, ${sName(p)}. Themes: ${q.themes.map(t=>esc(QUOTES.themes[t][0])).join(", ")}.</p>`:""}</div>`}
  if(ty==="act"){const a=p.act;return `<div class="qz"><div class="qn">Which act is this from?</div><h3 style="font:400 1.3rem/1.45 var(--f-old)">“${esc(q.text)}”</h3><div class="opts acts5">${ACTS.map(n=>`<button data-pick="${n}"${it.stage==="shown"?" disabled":""} class="${it.stage==="shown"?(n===a?"right":n===+it.pick?"wrong":""):""}">${AN(n)}</button>`).join("")}</div>${it.stage==="shown"?`<p class="muted">${esc(title(sp.who))}, ${sName(p)}.</p>`:""}</div>`}
  return ""}
/* self-graded items (who, fin) ask for confidence first; picked items grade themselves */
const selfGraded=k=>/^(who|fin|pt):/.test(k);
function itemButtons(it){if(!selfGraded(it.k))return it.stage==="shown"?`<button class="btn primary" data-it="next">Next</button>`:"";
  if(it.stage==="ask")return `<button class="btn primary" data-it="sure">I'm sure · turn</button><button class="btn" data-it="unsure">Not sure · turn</button>`;
  return `<button class="btn" data-it="no">Not yet</button><button class="btn primary" data-it="yes">I knew it</button>${it.k.startsWith("qz:")?"":`<button class="link" data-speech="${it.k.startsWith("pt:")?it.k.split(":")[1]:kq(it.k).id}">Read in context</button>`}`}
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
   ${itemHTML(cardIt)}<div class="cardbtns">${itemButtons(cardIt)}</div>
   <div class="cardstat">${known} of ${QUOTES.quotes.length} learnt · <b>${QUOTES.quotes.filter(q=>{const x=getS(cdir+":"+q.i);return !x||x.d<=Date.now()}).length}</b> due today · ${deck.length} left in this round${s?` · box ${esc(s.b)} of 5 · right on ${esc(s.k||0)} of 3 days`:" · new"} · <button class="link" id="c-reset">Start over</button></div>
   <p class="muted" style="text-align:center;font-size:.875rem">A quote is learnt once you know it on 3 different days. Cards you know come back after 1, 3, 7, 14, then 30 days${L>2?`, sooner as your exam gets close (${L} days left)`:""}. Cards you miss come back today.</p>`;
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
     <div class="lbl">Choose a part</div><div class="drills">${cast.map(w=>{const n=Object.values(speech).filter(s=>s.who===w).length;return `<button data-ptwho="${esc(w)}"><b>${esc(title(w))}</b><span>${n} speeches in ${partScenes(w).length} scenes</span></button>`}).join("")}</div>`;return}
  const back=`<div class="exh"><button class="btn sm" data-ptback="${pt.sid?"scene":"who"}">‹ ${pt.sid?"Scenes":"All parts"}</button><h2>${esc(title(pt.who))}</h2></div>`;
  if(!pt.sid){const sc=partScenes(pt.who);
    $("sbody").innerHTML=back+`<p class="intro">Pick a scene. Your best score for each is kept.</p><div class="qlist">${sc.map(p=>{const n=p.items.filter(x=>x.t==="sp"&&x.who===pt.who).length,b=REV.pp[pt.who+"|"+p.id];return `<button class="${b&&b[0]===b[1]?"done":""}" data-ptsid="${p.id}"><b>${sName(p)}</b><span>${n} speech${n===1?"":"es"}${b?` · best ${esc(b[0])} of ${esc(b[1])}`:""}</span></button>`}).join("")}</div>
     <label class="ptsw"><input type="checkbox" id="pt-sw"${pt.showWho?" checked":""}> Show who gives each cue <small class="muted">(original cue scripts didn't)</small></label>`;
    $("pt-sw").onchange=e=>{pt.showWho=e.target.checked;LS.set(PFX+"ptwho",pt.showWho?"1":"0")};return}
  const p=scenes[sIdx(pt.sid)];
  if(!pt.run){const steps=[];p.items.forEach(x=>{if(x.t==="sp"&&x.who===pt.who)partsOf(x).forEach((q,pi)=>steps.push({id:x.id,pi}))});pt.run={steps,i:0,h:0,shown:false,ok:0,miss:[]}}
  const R0=pt.run;
  if(R0.i>=R0.steps.length){const k=pt.who+"|"+pt.sid,b=REV.pp[k];if(!R0.saved){R0.saved=1;if(!b||R0.ok>=b[0])REV.pp[k]=[R0.ok,R0.steps.length,Date.now()];saveRev()}
    $("sbody").innerHTML=back+`<div class="qz" style="text-align:center"><div class="qn">${sName(p)}</div><div class="big">${R0.ok} of ${R0.steps.length}</div><p>${R0.ok===R0.steps.length?"Every line, word for word. Try it again tomorrow to make it stick.":`${R0.miss.length} part${R0.miss.length===1?"":"s"} to work on. They're added to Daily review.`}</p>
     <div class="row" style="justify-content:center"><button class="btn primary" id="pt-again">Run the scene again</button><button class="btn" data-ptback="scene">Other scenes</button></div></div>`;
    $("pt-again").onclick=()=>{pt.run=null;studyPart()};return}
  const st=R0.steps[R0.i],sp=speech[st.id],ps=partsOf(sp),q=ps[st.pi],L=partLines(sp,q);
  const cue=st.pi>0?{who:sp.who,txt:partLines(sp,ps[st.pi-1]).join(" ").split(/\s+/).slice(-3).join(" "),self:1}:cueOf(p,st.id);
  const hint=R0.shown?`<div class="ptxt">${L.map(l=>`<span>${esc(l)}</span>`).join("")}</div>`:R0.h===2?`<div class="ptxt fl">${L.map(l=>`<span>${esc(firstLet(l))}</span>`).join("")}</div>`:R0.h===1?`<div class="ptmean"><div class="ptag">What you want to say</div><p>${esc(q[2])}</p></div>`:`<div class="ptblank">${L.map(()=>`<i></i>`).join("")}</div>`;
  $("sbody").innerHTML=back+`<div class="qz cue"><div class="qn">${sName(p)} · part ${R0.i+1} of ${R0.steps.length} · ${R0.ok} right</div>
   <div class="cueline"><small>${cue?(cue.self?"Your previous line ends":(pt.showWho?esc(title(cue.who))+" ends":"Cue")):"Start of the scene"}</small>${cue?`<b>… ${esc(cue.txt)}</b>`:"<b>You speak first</b>"}</div>
   <div class="ptme" style="--c:${COLORS[pt.who]||"var(--ink)"}"><div class="ptwho">${esc(title(pt.who))}${ps.length>1?` <small>(${st.pi+1} of ${ps.length} in this speech)</small>`:""}</div>${hint}</div>
   <div class="cardbtns">${R0.shown?`<button class="btn" data-pt="miss">Missed</button><button class="btn" data-pt="near">Nearly</button><button class="btn primary" data-pt="got">Word perfect</button>`
     :`${R0.h<2?`<button class="btn" data-pt="hint">${R0.h===0?"Hint: the meaning":"Hint: first letters"}</button>`:""}<button class="btn primary" data-pt="show">I've said it · check</button>`}</div>
   <p class="muted" style="text-align:center;font-size:.875rem">${R0.shown?"Be strict: word perfect means every word.":"Say the lines out loud before you check."}</p></div>`;
}
function partAct(a){const R0=pt.run;if(!R0)return;const st=R0.steps[R0.i];
  if(a==="hint"){R0.h++;studyPart();return}
  if(a==="show"){R0.shown=true;studyPart();return}
  const k=`pt:${st.id}:${st.pi}`,ok=a==="got"&&R0.h===0;if(ok)R0.ok++;else R0.miss.push(st);
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
function studyReview(){
  if(!rv||rv.done&&!rv.show){const P=reviewPool(),n=Math.min(15,P.due.length)+Math.min(P.fresh.length,Math.max(3,15-P.due.length),5),cal=REV.cal.slice(-5);
    $("sbody").innerHTML=`<p class="intro">A few minutes a day beats one long session. Review mixes everything that is due: who said it, finishing quotes, themes, acts and quiz questions from scenes you have read, plus a few new items.</p>
     ${planHTML(n)}<div class="box"><h3>Today</h3><p><b>${P.due.length}</b> due${P.fresh.length?` · ${Math.min(P.fresh.length,5)} new`:""}</p>${n?`<button class="btn primary" id="rv-go">Start review · ${n} item${n===1?"":"s"}</button>`:`<p class="muted">Nothing to review yet. Learn some flashcards or finish a scene first.</p>`}</div>
     ${cal.length?`<div class="box"><h3>How well you predict your score</h3><p class="intro">Students often think they know more than they do. Predicting first, then checking, makes you a better judge of what to revise.</p><ul class="cal">${cal.map(([p,g,t,n])=>`<li>${esc(new Date(t).toLocaleDateString())}: predicted ${esc(p)}, got ${esc(g)}${n?` of ${esc(n)}`:""}</li>`).join("")}</ul></div>`:""}
     ${examLeft()>2?`<p class="muted">Your exam is in ${examLeft()} days, so items come back sooner.</p>`:""}`;
    if($("rv-go"))$("rv-go").onclick=()=>{startReview();studyReview();scrollTo(0,0)};return}
  if(rv.pred==null){const n=rv.items.length;
    $("sbody").innerHTML=`<div class="qz"><div class="qn">Before you start</div><h3>How many of these ${n} do you think you'll get right?</h3>
     <input type="range" id="rv-p" min="0" max="${n}" value="${Math.round(n*.7)}" class="srange" aria-label="Predicted score"><p class="big" id="rv-pv">${Math.round(n*.7)}</p>
     <div class="row"><button class="btn primary" id="rv-start">Start</button><button class="link" id="rv-skip">Skip</button></div></div>`;
    $("rv-p").oninput=e=>$("rv-pv").textContent=e.target.value;
    $("rv-start").onclick=()=>{rv.pred=+$("rv-p").value;studyReview()};$("rv-skip").onclick=()=>{rv.pred=-1;studyReview()};return}
  if(rv.i<rv.items.length){const it=rv.items[rv.i];
    $("sbody").innerHTML=`<div class="qn rvn">Review · ${rv.i+1} of ${rv.items.length} · ${rv.ok} right${getS(it.k)?"":" · new"}</div>${itemHTML(it)}<div class="cardbtns">${itemButtons(it)}</div><div class="row"><button class="link" id="rv-quit">Stop review</button></div>`;
    $("rv-quit").onclick=()=>{rv=null;studyReview()};return}
  if(!rv.done){rv.done=true;rv.show=true;if(rv.pred>=0){REV.cal.push([rv.pred,rv.ok,Date.now(),rv.items.length]);REV.cal=REV.cal.slice(-20);saveRev()}}
  const n=rv.items.length,d=rv.pred>=0?rv.ok-rv.pred:null;
  $("sbody").innerHTML=`<div class="qz" style="text-align:center"><div class="qn">Review finished</div><div class="big">${rv.ok} of ${n}</div>
   ${d!=null?`<p>${d===0?"You predicted exactly right.":d>0?`You did ${d} better than you predicted.`:`You predicted ${-d} more than you got. Worth a second look at the ones you missed.`}</p>`:""}
   <p class="muted">Items you missed come back later today; the rest come back in a few days.</p>${reflHTML()}<div class="row" style="justify-content:center"><button class="btn primary" id="rv-home">Done</button></div></div>`;
  wireRefl();$("rv-home").onclick=()=>{rv=null;studyReview()};
}
function reviewAct(a,v){const it=rv&&rv.items[rv.i];if(!it)return;
  if(a==="pick"){if(it.stage!=="ask")return;it.pick=v;const ok=pickOk(it,v);it.stage="shown";if(ok)rv.ok++;grade(it.k,ok,false);studyReview();return}
  if(a==="sure"||a==="unsure"){it.sure=a==="sure";it.stage="shown";studyReview();return}
  if(a==="yes"||a==="no"){if(a==="yes")rv.ok++;grade(it.k,a==="yes",it.sure);rv.i++;studyReview();scrollTo(0,0);return}
  if(a==="next"){rv.i++;studyReview();scrollTo(0,0)}}
/* ---------- recall prompts: test yourself on a Learn page before rereading it ----------
   Retrieval beats rereading: the page blurs, you write what you remember, then compare. Answers kept per page (REV.rc). */
REV.rc=REV.rc&&typeof REV.rc==="object"&&!Array.isArray(REV.rc)?REV.rc:{};
REV.refl=REV.refl&&typeof REV.refl==="object"&&!Array.isArray(REV.refl)?REV.refl:{};
let rcOn="";
function addRecall(key,prompt){const sb=$("sbody");if(!sb||sb.querySelector(".recall"))return;const on=rcOn===key;
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
  studyExplore=function(){E();if(["facts","analysis","motifs","context","critics","bigq","timeline","devices","contrast"].includes(exSel))addRecall("ex:"+exSel+(exSel==="analysis"?":"+anSel:""),"Write down the most important points on this page, from memory.")}}
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
  return `<span>${esc(v[0])}</span><div class="bar"><i style="width:${qs.length?kn/qs.length*100:0}%"></i></div><small>${kn}/${qs.length} · ${nt} note${nt===1?"":"s"}</small>`}).join("")}</div>`}
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
    $("sbody").innerHTML=`<div class="qz"><div class="qn">${qz.kind==="all"?"Whole play":qz.kind==="miss"?"Mistakes review":sName(p)} · question ${qz.i+1} of ${qz.qs.length}</div><h3>${esc(q.q)}</h3>
      <div class="opts">${q.o.map((o,i)=>`<button data-i="${i}"${qz.ans!=null?" disabled":""} class="${qz.ans!=null?(i===q.a?"right":i===qz.ans?"wrong":""):""}">${esc(o)}</button>`).join("")}</div>
      <div class="row">${qz.ans!=null?`<button class="btn primary" id="qz-next">${qz.i+1<qz.qs.length?"Next question":"See score"}</button>`:""}<button class="link" id="qz-quit">Stop quiz</button>${qz.kind==="all"?`<span class="muted" style="font-size:.875rem">from ${sName(p)}</span>`:""}</div></div>`;
    $("sbody").querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{qz.ans=+b.dataset.i;const M=prog.miss.q,ix=M.findIndex(m=>m.q===q.q);
      if(qz.ans===q.a){qz.ok++;if(ix>=0)M.splice(ix,1)}else if(ix<0)M.push({q:q.q,o:q.o,a:q.a,s:q.s});saveProg();studyQuiz()});
    if($("qz-next"))$("qz-next").onclick=()=>{qz.i++;qz.ans=null;studyQuiz()};
    $("qz-quit").onclick=()=>{qz=null;studyQuiz()};return}
  if(qz){const k=qz.kind,old=prog.quiz[k];if(qz.pred>=0&&!qz.logged){qz.logged=1;REV.cal.push([qz.pred,qz.ok,Date.now(),qz.qs.length]);REV.cal=REV.cal.slice(-20);saveRev()}if(k!=="miss"&&(k==="all"||!old||qz.ok>=old[0])){prog.quiz[k]=[qz.ok,qz.qs.length];saveProg()}
    $("sbody").innerHTML=`<div class="qz" style="text-align:center"><div class="qn">${k==="all"?"Whole play":k==="miss"?"Mistakes review":sName(scenes[sIdx(k)])}</div><div class="big">${qz.ok} of ${qz.qs.length}</div>${qz.pred>=0?`<p>${qz.ok===qz.pred?"You predicted exactly right.":qz.ok>qz.pred?`${qz.ok-qz.pred} better than you predicted.`:`You predicted ${qz.pred-qz.ok} more than you got.`}</p>`:""}<p class="muted">${qz.ok===qz.qs.length?"Perfect score.":"The right answers were shown as you went."}</p><div class="row" style="justify-content:center"><button class="btn primary" id="qz-again">Try again</button><button class="btn" id="qz-list">All quizzes</button></div></div>`;
    $("qz-again").onclick=()=>startQuiz(k);$("qz-list").onclick=()=>{qz=null;studyQuiz()};return}
  const all=prog.quiz.all;
  $("sbody").innerHTML=`<p class="intro">Test yourself scene by scene, or take 20 random questions from the whole play.</p>
   ${missHTML()}
   <button class="go" id="qz-all" style="width:100%"><small>Practice test${all?` · last score ${esc(all[0])} of ${esc(all[1])}`:""}</small><b>Whole-play quiz · 20 questions</b></button>
   ${ACTS.map(a=>`<div class="stage3"><h3>${LAT[a]}</h3><small>${AN(a)}</small></div><div class="qlist">${scenes.filter(p=>p.act===a).map(p=>{const b=prog.quiz[p.id];return `<button class="${b?"done":""}" data-q="${p.id}"><b>Scene ${p.scene.toLowerCase()}</b><span>${b?`Best: ${esc(b[0])} of ${esc(b[1])}`:`${((STUDY.scenes[p.id]||{}).quiz||[]).length} questions`}</span></button>`}).join("")}</div>`).join("")}`;
  $("qz-all").onclick=()=>startQuiz("all");if($("qz-miss"))$("qz-miss").onclick=()=>startQuiz("miss");
  $("sbody").querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>startQuiz(b.dataset.q));
}
/* revision sheet + backup */
function revisionText(){
  let t=`${CFG.title.toUpperCase()}: REVISION SHEET\n${new Date().toLocaleDateString()}\n\n`;
  const ids=Object.keys(marks).filter(k=>speech[k]).sort((a,b)=>a-b);
  t+=`MY HIGHLIGHTS AND NOTES (${ids.length})\n`;
  if(!ids.length)t+="None yet. While reading, press and hold a speech to highlight it or add a note.\n";
  let ls="";ids.forEach(k=>{const sp=speech[k],m=marks[k],p=sceneOf(k);if(p.id!==ls){t+=`\n${sName(p)} (${shortLoc(p)})\n`;ls=p.id}
    t+=`  ${title(sp.who)}${m.hl?" ★":""}: ${sp.lines.map(l=>l.replace(/^~/,"")).join(" / ")}\n`;if(m.note)t+=`    My note: ${m.note.replace(/\n/g," ")}\n`});
  const qs=Object.entries(prog.quiz).filter(([k])=>k!=="all"&&sIdx(k)>=0).sort((a,b)=>sIdx(a[0])-sIdx(b[0]));
  t+=`\nQUIZ SCORES\n`+(qs.length?qs.map(([k,v])=>`  ${sName(scenes[sIdx(k)])}: ${v[0]}/${v[1]}`).join("\n"):"  None yet")+(prog.quiz.all?`\n  Whole-play quiz (last): ${prog.quiz.all[0]}/${prog.quiz.all[1]}`:"")+"\n";
  const kn=QUOTES.quotes.filter(q=>prog.cards[q.i]),un=QUOTES.quotes.filter(q=>!prog.cards[q.i]);
  t+=`\nQUOTES STILL TO LEARN (${un.length})\n`+un.map(q=>`  "${q.text}" (${title(speech[q.id].who)}, ${sName(sceneOf(q.id))})`).join("\n")+"\n";
  t+=`\nQUOTES LEARNT (${kn.length})\n`+(kn.map(q=>`  "${q.text}" (${title(speech[q.id].who)})`).join("\n")||"  None yet")+"\n";
  const fv=FAV.filter(f=>speech[f.id]);t+=`\nFAVOURITE PHRASES (${fv.length})\n`+(fv.map(f=>`  "${f.txt}" (${title(speech[f.id].who)}, ${sName(sceneOf(f.id))})${f.note?`\n    My note: ${f.note.replace(/\n/g," ")}`:""}`).join("\n")||"  None yet")+"\n";
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
function studyRevise(){
  const t=revisionText();
  $("sbody").innerHTML=`<p class="intro">Everything you've marked, your quiz scores and the quotes you still need to learn, on one sheet.</p>
   <div class="row"><button class="btn primary" id="rv-copy">Copy revision sheet</button><button class="btn" id="rv-dl">Download as text</button></div>
   <div class="rev">${esc(t)}</div>${backupHTML()}`;
  $("rv-copy").onclick=()=>copyText(t);$("rv-dl").onclick=()=>download(CFG.file+"-revision.txt",t,"text/plain");
  wireBackup(studyRevise);
}
$("sbody").addEventListener("click",e=>{
  const dc=e.target.closest("[data-dc]");if(dc){const [i,j]=dc.dataset.dc.split(":").map(Number);DIRC[i]=Object.assign({},DIRC[i],{c:j});saveDir();const y=scrollY;studyExplore();scrollTo(0,y);return}
  const ib=e.target.closest("[data-it]");if(ib){if(S.stab==="review")reviewAct(ib.dataset.it);else cardAct(ib.dataset.it);return}
  const pk=e.target.closest("[data-pick]");if(pk&&!pk.disabled){reviewAct("pick",pk.dataset.pick);return}
  const g2=e.target.closest("[data-go2]");if(g2){goScene(sIdx(g2.dataset.go2),{page:0});return}
  const gt=e.target.closest("[data-gotab]");if(gt){const [t,x]=gt.dataset.gotab.split(":");if(t==="explore")exSel=x||"";S.stab=t;LS.set(PFX+"stab",t);renderStudy();scrollTo(0,0);return}
  const q2=e.target.closest("[data-quiz2]");if(q2){S.stab="quiz";renderStudy();startQuiz(q2.dataset.quiz2);return}
  const pa=e.target.closest("[data-pt]");if(pa){partAct(pa.dataset.pt);return}
  const pw=e.target.closest("[data-ptwho]");if(pw){pt.who=pw.dataset.ptwho;pt.sid="";pt.run=null;studyPart();scrollTo(0,0);return}
  const ps=e.target.closest("[data-ptsid]");if(ps){pt.sid=ps.dataset.ptsid;pt.run=null;studyPart();scrollTo(0,0);return}
  const pb=e.target.closest("[data-ptback]");if(pb){if(pb.dataset.ptback==="scene"){pt.sid="";pt.run=null}else pt.who="";studyPart();scrollTo(0,0);return}
  const cd=e.target.closest("[data-cdir]");if(cd){cdir=cd.dataset.cdir;LS.set(PFX+"cdir",cdir);newDeck();studyCards();return}
  const dk=e.target.closest("[data-drill]");if(dk){dr={k:dk.dataset.drill};studyDrill();scrollTo(0,0);return}
  const ex=e.target.closest("[data-ex]");if(ex){exSel=ex.dataset.ex;studyExplore();scrollTo(0,0);return}
  const an=e.target.closest("[data-an]");if(an){anSel=an.dataset.an;studyExplore();return}
  const ma=e.target.closest("[data-mapact]");if(ma){mapAct=+ma.dataset.mapact;studyExplore();return}
  const az=e.target.closest("[data-az]");if(az){const el=document.querySelector(`[data-letter="${az.dataset.az}"]`);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return}
  const s=e.target.closest("[data-speech]");if(s){goSpeech(s.dataset.speech);return}
  const c=e.target.closest(".chips .chip");if(c){const f=c.parentNode.dataset.f,v=c.dataset.v;
    if(f==="who")qf.who=v;else if(f==="th")qf.th=v;else if(f==="theme")thSel=v;renderStudy()}});
$("sbody").addEventListener("input",e=>{const t=e.target.closest("[data-dw]");if(t){const i=t.dataset.dw;DIRC[i]=Object.assign({},DIRC[i],{w:t.value.slice(0,4000)});saveDir()}});
$("sbody").addEventListener("change",e=>{if(e.target.id==="vl-s"){vlSel=+e.target.value;studyExplore();return}const c=e.target.closest("[data-cmp]");if(c){cmp[+c.dataset.cmp]=+c.value;studyExplore();return}const s=e.target.closest("[data-qf]");if(s){qf[s.dataset.qf]=s.value;renderStudy()}});

/* ---------- sheets ---------- */
const sheet=$("sheet");let lastFocus=null;
function openSheet(t,html){if(sheet.hidden)lastFocus=document.activeElement;$("sheet-title").textContent=t;$("sheet-body").innerHTML=html;sheet.hidden=false;const b=sheet.querySelector(".sbox");b.scrollTop=0;b.focus({preventScroll:true})}
function closeSheet(){if(sheet.hidden)return;sheet.hidden=true;if(!wide())closePanel();if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
$("sheet-close").onclick=closeSheet;
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
  const fd=e.target.closest("[data-fpdel]");if(fd){FAV=FAV.filter(f=>String(f.t)!==fd.dataset.fpdel);saveFav();refreshMarks();openNotes();toast("Phrase removed");return}
  const fh=e.target.closest("[data-fph]");if(fh){const f=FAV.find(x=>String(x.t)===fh.dataset.fph);if(f)goSpeech(f.id);return}
  const bk=e.target.closest("[data-bm]");if(bk){const b=BM[+bk.dataset.bm];closeSheet();setHash(b.s);show("reader");openScene(sIdx(b.s),{key:b.key});return}
  const rc=e.target.closest("[data-recent]");if(rc){const [id,pi]=rc.dataset.recent.split(":").map(Number);goSpeech(id);setTimeout(()=>{showPartPage(id,pi);openPart(id,pi,false)},250);return}
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
function bmState(){const b=$("b-bm");if(!b)return;const on=bmHere()>=0;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.setAttribute("aria-label",on?"Remove bookmark":"Bookmark this page")}
function keyText(s,key){const [id,ln]=String(key).split(":"),sp=speech[id];return sp?(sp.lines[+ln||0]||sp.lines[0]).replace(/^~/,""):sName(scenes[sIdx(s)])}
function toggleBM(){if(!pos)return;const i=bmHere();if(i>=0){BM.splice(i,1);toast("Bookmark removed")}else{BM.push({s:pos.s,key:pos.key,t:Date.now(),txt:keyText(pos.s,pos.key)});BM.sort((a,b)=>sIdx(a.s)-sIdx(b.s)||String(a.key).localeCompare(String(b.key),void 0,{numeric:true}));toast("Page bookmarked. Find it in My notes.")}saveBM();bmState()}
/* my notes: search, filters, print, share */
let nf={q:"",th:"",who:"",c:""};
function notesIds(){const q=nf.q.trim().toLowerCase();
  return Object.keys(marks).filter(k=>speech[k]).sort((a,b)=>a-b).filter(k=>{const sp=speech[k],m=marks[k];
    if(nf.who&&sp.who!==nf.who)return false;
    if(nf.th&&!((m.th||[]).includes(nf.th)||(QBY[k]||[]).some(x=>x.themes.includes(nf.th))))return false;
    if(nf.c==="note"&&!(m.note&&m.note.trim()))return false;if(nf.c&&nf.c!=="note"&&hlOf(m)!==nf.c)return false;
    if(q&&!((m.note||"").toLowerCase().includes(q)||sp.lines.join(" ").toLowerCase().includes(q)||sp.m.toLowerCase().includes(q)))return false;return true})}
function notesList(){const ids=notesIds();let h=`<p class="muted">${ids.length} of ${Object.keys(marks).filter(k=>speech[k]).length} shown</p>`,la=0;
  ids.forEach(k=>{const sp=speech[k],m=marks[k],p=sceneOf(k),hl=hlOf(m);
    if(p.act!==la){h+=`<div class="eyebrow" style="margin:14px 0 0">${LAT[p.act]}</div>`;la=p.act}
    const o=sp.lines.join(" ").replace(/~/g,"");
    h+=`<div class="item" data-speech="${k}" tabindex="0"><small>${hl?`<i class="hlk ${hl}"></i> `:""}${esc(where(sp))}${thOf(m).length?" · "+thOf(m).map(x=>esc(QUOTES.themes[x][0])).join(", "):""}</small><span style="font-family:var(--f-old)">${esc(o.slice(0,140))}${o.length>140?"…":""}</span>${m.note?`<div class="mynote">${esc(m.note)}</div>`:""}</div>`});
  return h}
function openNotes(){
  const all=Object.keys(marks).filter(k=>speech[k]),whos=[...new Set(all.map(k=>speech[k].who))].sort();
  let h=`<p class="muted">Saved on this device. Tap one to go to it.</p>`;
  if(BM.length)h+=`<div class="eyebrow" style="margin:10px 0 0">Bookmarks</div>`+BM.map((b,i)=>`<div class="item" data-bm="${i}" tabindex="0"><small>${esc(sName(scenes[sIdx(b.s)]))} · <button class="link" data-bmdel="${i}">Remove</button></small><span style="font-family:var(--f-old)">${esc(b.txt||"")}</span></div>`).join("");
  const fv=FAV.filter(f=>speech[f.id]);if(fv.length)h+=`<div class="eyebrow" style="margin:14px 0 0">Favourite phrases</div>`+fv.map(f=>`<div class="item" data-fph="${esc(f.t)}" tabindex="0"><small><i class="hlk fc-${fcOk(f.c)}"></i> ${esc(where(speech[f.id]))} · <button class="link" data-fpdel="${esc(f.t)}">Remove</button></small><span style="font-family:var(--f-old)">“${esc(f.txt)}”</span>${f.note?`<div class="mynote">${esc(f.note)}</div>`:""}</div>`).join("");
  if(!all.length)h+=`<p>No notes yet. While reading, press and hold a word to save a favourite phrase, or open Speech tools from that bar to highlight a speech, tag a theme or add a note. Use the bookmark button in the top bar to save a page.</p>`;
  else h+=`<div class="eyebrow" style="margin:14px 0 0">Notes and highlights</div><div class="nfilt"><label class="sr" for="nf-q">Search notes</label><input type="search" id="nf-q" placeholder="Search your notes and lines…" value="${esc(nf.q)}">
    <label class="sr" for="nf-c">Colour</label><select id="nf-c"><option value="">Any colour</option>${HLC.map(([k,l])=>`<option value="${k}"${nf.c===k?" selected":""}>${l}</option>`).join("")}<option value="note"${nf.c==="note"?" selected":""}>With a written note</option></select>
    <label class="sr" for="nf-th">Theme</label><select id="nf-th"><option value="">Any theme</option>${Object.entries(QUOTES.themes).map(([k,v])=>`<option value="${k}"${nf.th===k?" selected":""}>${esc(v[0])}</option>`).join("")}</select>
    <label class="sr" for="nf-who">Character</label><select id="nf-who" style="grid-column:1/-1"><option value="">Any character</option>${whos.map(w=>`<option value="${esc(w)}"${nf.who===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select></div>
    <div class="row"><button class="btn sm" id="nf-print">Print</button><button class="btn sm" id="nf-copy">Copy</button><button class="btn sm" id="nf-share">Share as a link</button></div><div id="nlist">${notesList()}</div>`;
  openSheet("My notes",h);if(!all.length)return;
  let tm;$("nf-q").oninput=e=>{nf.q=e.target.value;clearTimeout(tm);tm=setTimeout(()=>$("nlist").innerHTML=notesList(),150)};
  ["c","th","who"].forEach(f=>$("nf-"+f).onchange=e=>{nf[f]=e.target.value;$("nlist").innerHTML=notesList()});
  const txt=()=>notesIds().map(k=>{const sp=speech[k],m=marks[k];return `${where(sp)}\n${sp.lines.map(l=>l.replace(/^~/,"")).join("\n")}${m.note?`\nNote: ${m.note}`:""}`}).join("\n\n");
  $("nf-copy").onclick=()=>copyText("MY "+CFG.short.toUpperCase()+" NOTES\n\n"+txt());
  $("nf-print").onclick=()=>printArea("My "+CFG.short+" notes",notesIds().map(k=>{const sp=speech[k],m=marks[k];return `<div class="pi"><small>${esc(where(sp))}${thOf(m).length?" · "+thOf(m).map(x=>esc(QUOTES.themes[x][0])).join(", "):""}</small><div>${sp.lines.map(l=>esc(l.replace(/^~/,""))).join("<br>")}</div>${m.note?`<i>${esc(m.note)}</i>`:""}</div>`}).join(""));
  $("nf-share").onclick=()=>shareIds(notesIds());
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
  const card=(q,i)=>{const sp=speech[q.id];return `<div>${sel(i)}<blockquote>“${esc(q.text)}”</blockquote><small>${esc(where(sp))}</small><p>${esc(q.note)}</p>${EX.why[q.i]?`<p><b>Why it matters:</b> ${esc(EX.why[q.i])}</p>`:""}<p class="muted">${q.themes.map(t=>esc(QUOTES.themes[t][0])).join(" · ")}</p><button class="link" data-speech="${q.id}">Read in context</button></div>`};
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
function openSettings(){
  const segs=(name,opts,val)=>`<div class="segs" data-set="${name}">`+opts.map(([v,l])=>`<button data-v="${v}" aria-pressed="${String(val)===String(v)}">${l}</button>`).join("")+`</div>`;
  const whoOpts=[...whoSet].sort((a,b)=>{const o=Object.keys(COLORS),ia=o.indexOf(a),ib=o.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b)});
  openSheet("Settings",`
    <div class="opt"><div class="lbl">On the page</div>${segs("mode",[["orig","Shakespeare only"],["both","Both"],["mod","Modern only"]],S.mode)}<small>With Shakespeare only, tap any line and its modern English opens underneath. On a tablet, Both puts the two side by side.</small></div>
    <div class="opt"><div class="lbl">Text size</div>${segs("scale",[["1.15","Small"],["1.3","Normal"],["1.5","Large"],["1.75","Extra large"]],S.scale)}</div>
    <div class="opt"><div class="lbl">Theme</div>${segs("theme",[["paper","Paper"],["papernight","Paper night"],["papertimed","Paper, night after 8pm"]],S.theme)}${segs("theme",[["auto","Auto"],["light","Light"],["dark","Dark"],["night","Night"],["timed","Night after 8pm"]],S.theme)}<small>Paper looks like an e-reader: a matte, warm page with crisp black text. Night is a warm, dim scheme for reading in bed. The "after 8pm" options switch to the night version until 7am.</small></div>
    <div class="opt"><div class="lbl">Line spacing</div>${segs("lh",[["1.4","Compact"],["1.55","Normal"],["1.8","Airy"]],S.lh)}</div>
    <div class="opt"><div class="lbl">Clean page</div>${segs("clean",[["false","Off"],["true","On"]],S.clean)}<small>Hides line numbers, tags and underlines for pure reading. Tapping still works.</small></div>
    <div class="opt"><div class="lbl">One-hand page turns</div>${segs("onehand",[["false","Off"],["true","On"]],S.onehand)}<small>Tap the bottom-left or bottom-right corner to turn pages.</small></div>
    <div class="opt"><div class="lbl">Page turn</div>${segs("turn",[["curl","Curl"],["slide","Slide"],["instant","Instant"]],S.turn)}<small>Curl: hold the page near its outer edge or a corner and drag; it bends and turns like paper. Taps and swipes curl too. Instant changes pages with no motion, like an e-reader (Slide is also instant in Paper themes).</small></div>
    <div class="opt"><label for="focsel" class="lbl">Dim everyone except</label><select id="focsel"><option value="">Nobody (show all normally)</option>${whoOpts.map(w=>`<option value="${esc(w)}"${S.focus===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select><small>Other speakers stay on the page but fade, so you can follow one voice.</small></div>
    <div class="opt"><div class="lbl">Exam level</div>${segs("level",[["g","GCSE"],["a","A-level"]],aoLevel())}<small>Sets the assessment objectives used to mark your writing in Study. A-level adds connections (AO4) and interpretations (AO5). Applies to every play.</small></div>
    <div class="opt"><div class="lbl">Story beats</div>${segs("beats",[["true","On"],["false","Off"]],S.beats)}<small>A thin rule with a one-line note where the action turns, so you always know what is happening. Also listed under Contents › Beats. Hidden on a clean page.</small></div>
    <div class="opt"><div class="lbl">The Argument at the end of each scene</div>${segs("sum",[["true","Show"],["false","Hide"]],S.sum)}</div>
    <div class="opt"><label for="whosel" class="lbl">Follow one character</label><select id="whosel"><option value="">Everyone</option>${whoOpts.map(w=>`<option value="${esc(w)}"${S.who===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select></div>
    <div class="opt"><div class="lbl">How to read</div><small style="margin:0">Swipe left or right to turn pages (arrow keys or the scroll wheel on a computer). Tap an underlined word for its meaning. Tap any other part of the lines and their modern English opens underneath (tap again to fold it); long speeches are split into parts, and "Whole speech" shows the rest. Tap a character’s name for who they are. Tap empty space to show or hide the menus. Press and hold a word to select a phrase; drag to extend it, tap another word to move the nearer end, then pick a colour and save it as a favourite. The bar that appears also has Speech tools (word meanings, notes and highlights); on a computer, right-click a speech for them. Pinch with two fingers to change the text size. Drag the page slider in the bottom menu to preview pages.</small></div>
    ${backupHTML()}
    <div class="opt"><div class="lbl">Progress</div><button class="btn" id="resetprog">Reset reading progress, quiz scores and flashcards</button><small id="resetmsg"></small></div>`);
  $("sheet-body").querySelectorAll("[data-set] button").forEach(b=>b.onclick=()=>{const k=b.parentNode.dataset.set;let v=b.dataset.v;if(k==="level"){LS.set("folio-level",v);$("sheet-body").querySelectorAll(`[data-set="level"] button`).forEach(x=>x.setAttribute("aria-pressed",x===b));if(view==="study")renderStudy();toast(v==="a"?"Marking: A-level":"Marking: GCSE");return}
    if(k==="scale"||k==="lh")v=parseFloat(v);if(k==="sum"||k==="clean"||k==="onehand"||k==="beats")v=v==="true";S[k]=v;applySettings();$("sheet-body").querySelectorAll(`[data-set="${k}"] button`).forEach(x=>x.setAttribute("aria-pressed",x===b));repaginate()});
  $("whosel").onchange=e=>{S.who=e.target.value;repaginate()};
  $("focsel").onchange=e=>{S.focus=e.target.value;applySettings();refreshMarks()};
  wireBackup(()=>{if(view==="you")renderYou();refreshMarks()});
  let armed=false;$("resetprog").onclick=()=>{if(!armed){armed=true;$("resetmsg").textContent="Tap again to confirm. Your notes are kept.";return}prog={done:{},quiz:{},cards:{},srs:{},miss:{q:[],c:{},s:{}},conf:{},exam:prog.exam};saveProg();REV={it:{},cal:[]};saveRev();$("resetmsg").textContent="Progress reset.";armed=false;if(view==="you")renderYou()};
}
$("b-home").onclick=()=>openContents();$("b-where").onclick=()=>openContents("scenes");$("b-search").onclick=()=>openSearch("");$("b-set").onclick=openSettings;$("b-bm").onclick=toggleBM;

/* ---------- first-run hint ---------- */
function hint(){if(LS.get(PFX+"hint4")||view!=="reader")return;const d=document.createElement("div");d.className="hint";d.innerHTML=`<b>How to read</b><ul><li>Swipe left or right to turn the page.</li><li>Tap an underlined word for its meaning.</li><li>Tap any other part of the lines: the modern English opens right under them. Tap again to fold it away.</li><li>Tap a character’s name to find out who they are.</li><li>Tap empty space to show the menus.</li><li>Press and hold a word to select a phrase and save it as a favourite. Speech tools (meanings, notes) are in the bar that appears.</li></ul><button>Got it</button>`;
  $("reader").appendChild(d);d.addEventListener("pointerup",e=>e.stopPropagation());d.querySelector("button").onclick=()=>{d.remove();LS.set(PFX+"hint4","1")}}

/* ---------- start ---------- */
applySettings();
route();
