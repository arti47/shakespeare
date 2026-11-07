/* Folio reader: shared by every play. Each play page loads <play>/play.js first (CFG + content consts:
   DATA, STUDY, ALIGN, PARTS, QUOTES, EX, EXT, MAINS, COLORS, PICS), then this file. */
const partsOf=it=>PARTS[it.id]||[[0,it.lines.length-1,it.m]];
const SOLO=EX.solo;
const roman={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12,XIII:13,XIV:14,XV:15}, R=["","I","II","III","IV","V"];
const LAT=["","Actus Primus","Actus Secundus","Actus Tertius","Actus Quartus","Actus Quintus"],SL={I:"Scena Prima",II:"Scena Secunda",III:"Scena Tertia",IV:"Scena Quarta",V:"Scena Quinta",VI:"Scena Sexta",VII:"Scena Septima",VIII:"Scena Octava",IX:"Scena Nona",X:"Scena Decima",XI:"Scena Undecima",XII:"Scena Duodecima",XIII:"Scena Tertia Decima",XIV:"Scena Quarta Decima",XV:"Scena Quinta Decima"};
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const title=w=>String(w||"").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const $=id=>document.getElementById(id);
const PLAY=CFG.id,PFX=CFG.prefix,FSH={};["lh","clean","onehand","show","size","theme","sumon"].forEach(k=>FSH[PFX+k]=1);
const LS={key(k){return FSH[k]?"folio-"+k.slice(4):k},get(k){try{const v=localStorage.getItem(LS.key(k));return v!==null?v:localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(LS.key(k),v)}catch(e){}}};
LS.set("folio-last",PLAY);
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
const sName=p=>`Act ${R[p.act]}, Scene ${p.scene.toLowerCase()}`;
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

/* ---------- saved state: marks + progress (account db, browser fallback) ---------- */
let marks={},prog={done:{},quiz:{},cards:{}},store=null,progDoc=null;
try{marks=JSON.parse(LS.get(PFX+"marks")||"{}")}catch(e){}
/* favourite phrases: a run of words in one speech's original lines, this device (and in backups).
   {id, a:[line,word], b:[line,word], txt, note, t}; line = index into the speech's lines, word = index of a non-space run */
let FAV=[];try{FAV=JSON.parse(LS.get(PFX+"fav")||"[]")}catch(e){}if(!Array.isArray(FAV))FAV=[];
const saveFav=()=>LS.set(PFX+"fav",JSON.stringify(FAV));
const favSort=()=>FAV.sort((x,y)=>x.id-y.id||x.a[0]-y.a[0]||x.a[1]-y.a[1]||x.b[0]-y.b[0]||x.b[1]-y.b[1]);
const lineWords=l=>String(l).replace(/^~/,"").split(/\s+/).filter(Boolean);
function favText(id,a,b){const sp=speech[id];if(!sp)return "";const out=[];for(let l=a[0];l<=b[0];l++){const w=lineWords(sp.lines[l]||"");out.push(w.slice(l===a[0]?a[1]:0,l===b[0]?b[1]+1:w.length).join(" "))}return out.filter(Boolean).join(" / ")}
try{prog=Object.assign(prog,JSON.parse(LS.get(PFX+"prog")||"{}"));prog.cards=prog.cards||{}}catch(e){}
prog.srs=prog.srs||{};prog.miss=prog.miss||{q:[],c:{}};prog.conf=prog.conf||{};prog.exam=prog.exam||"";
async function initStore(){
  try{
    if(!window.claude||!claude.use)return;
    const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);if(!db||!user)return;
    const uid=await user.id();if(!uid)return;
    store=db.collection("data/users/"+uid+"/marks");progDoc=db.doc("data/users/"+uid+"/meta/progress");
    let first=true;
    store.onSnapshot(snap=>{const m={};snap.docs.forEach(d=>{const v=d.data();if(v)m[d.id]=v});
      if(first&&snap.empty&&Object.keys(marks).length)Object.entries(marks).forEach(([k,v])=>store.doc(k).set(v).catch(()=>{}));
      else{marks=m;LS.set(PFX+"marks",JSON.stringify(marks));refreshMarks()}first=false},()=>{});
    progDoc.onSnapshot(sn=>{if(sn.exists){const v=sn.data();prog=Object.assign({done:{},quiz:{},cards:{},srs:{},miss:{q:[],c:{}},conf:{},exam:""},JSON.parse(JSON.stringify(v)));LS.set(PFX+"prog",JSON.stringify(prog));if(view==="home")renderHome()}
      else if(Object.keys(prog.done).length||Object.keys(prog.quiz).length)progDoc.set(JSON.parse(JSON.stringify(prog))).catch(()=>{})},()=>{});
  }catch(e){}
}
async function saveMark(id,patch){
  const v=Object.assign({},marks[id]||{},patch,{t:Date.now()}),empty=!v.hl&&!(v.note&&v.note.trim())&&!(v.th&&v.th.length);
  if(empty)delete marks[id];else marks[id]=v;LS.set(PFX+"marks",JSON.stringify(marks));refreshMarks();
  if(store){try{empty?await store.doc(String(id)).delete():await store.doc(String(id)).set(v)}catch(e){}}
}
async function saveProg(){LS.set(PFX+"prog",JSON.stringify(prog));if(progDoc){try{await progDoc.set(JSON.parse(JSON.stringify(prog)))}catch(e){}}}

/* ---------- settings ---------- */
const S={lh:parseFloat(LS.get(PFX+"lh"))||1.55,focus:LS.get(PFX+"focus")||"",clean:LS.get(PFX+"clean")==="1",onehand:LS.get(PFX+"onehand")==="1",mode:LS.get(PFX+"show")||"orig",scale:parseFloat(LS.get(PFX+"size"))||1.3,theme:LS.get(PFX+"theme")||"auto",sum:LS.get(PFX+"sumon")!=="0",who:"",stab:LS.get(PFX+"stab")||"quotes"};
function applySettings(){
  const b=document.body.classList;b.remove("mode-orig","mode-mod","mode-both");b.add("mode-"+S.mode);
  document.documentElement.style.setProperty("--scale",S.scale);
  let th=S.theme;if(th==="timed"){const h=new Date().getHours();th=h>=20||h<7?"night":"auto"}if(th==="papertimed"){const h=new Date().getHours();th=h>=20||h<7?"papernight":"paper"}
  if(th==="auto")document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme",th);
  document.documentElement.style.setProperty("--lh",S.lh);b.toggle("focusing",!!S.focus);b.toggle("clean",S.clean);
  LS.set(PFX+"lh",S.lh);LS.set(PFX+"focus",S.focus);LS.set(PFX+"clean",S.clean?"1":"0");LS.set(PFX+"onehand",S.onehand?"1":"0");
  LS.set(PFX+"show",S.mode);LS.set(PFX+"size",S.scale);LS.set(PFX+"theme",S.theme);LS.set(PFX+"sumon",S.sum?"1":"0");
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
let view="home";
if(location.pathname.replace(/index\.html$/,"").endsWith("/"+PLAY+"/")&&location.protocol.startsWith("http")){$("tofolio").hidden=false;$("b-folio").hidden=false}
let pos=null;try{pos=JSON.parse(LS.get(PFX+"pos")||"null")}catch(e){}
/* no history entries: Safari's edge back-swipe then has nothing in the app to slide back to */
function setHash(h){if(location.hash.slice(1)!==h){try{history.replaceState(null,"","#"+h)}catch(e){}}}
document.addEventListener("touchstart",e=>{const x=e.touches[0].clientX;if((x<24||x>innerWidth-24)&&!e.target.closest("button,a,input,select,textarea,label,summary"))e.preventDefault()},{passive:false});
function show(v){view=v;$("home").hidden=v!=="home";$("reader").hidden=v!=="reader";$("study").hidden=v!=="study";closePanel();
  document.body.style.overflow=v==="reader"?"hidden":"";if(v!=="reader")document.body.classList.remove("chrome");else setTimeout(hint,400)}
function route(){
  const h=location.hash.slice(1);
  if(h.startsWith("share=")){const ids=h.slice(6).split(".").filter(i=>speech[i]);setHash("home");show("home");renderHome();openShared(ids);return}
  if(h.startsWith("sp=")){const id=h.slice(3),k=scenes.findIndex(s=>s.items.some(x=>String(x.id)===id));if(k>=0){setHash(scenes[k].id);show("reader");openScene(k,{key:id+":0",flash:true,speech:id});return}}
  if(h==="home"){show("home");renderHome();scrollTo(0,0);return}
  if(h==="study"){show("study");renderStudy();scrollTo(0,0);return}
  const k=sIdx(h);
  if(k>=0){show("reader");openScene(k,pos&&pos.s===h?{key:pos.key,keep:true}:{page:0});return}
  if(pos&&sIdx(pos.s)>=0){setHash(pos.s,false);show("reader");openScene(sIdx(pos.s),{key:pos.key,keep:true});setTimeout(pulseLast,500);return}
  show("home");renderHome();
}
addEventListener("hashchange",route);addEventListener("popstate",route);
function goScene(k,opts){setHash(scenes[k].id,true);show("reader");openScene(k,opts||{page:0})}
function goSpeech(id){const sp=speech[id];if(!sp)return;if(S.who&&sp.who!==S.who)S.who="";closeSheet();goScene(sIdx(sp.page),{speech:+id,flash:true})}
function goStudy(tab){if(tab){S.stab=tab;LS.set(PFX+"stab",tab)}setHash("study",true);show("study");renderStudy();scrollTo(0,0)}
function goHome(){setHash("home",true);show("home");renderHome();scrollTo(0,0)}

/* ---------- home ---------- */
function bkRemHTML(){const n=Object.keys(marks).length+BM.length+FAV.length;if(!n)return "";let f=+LS.get(PFX+"first")||0;if(!f){f=Date.now();LS.set(PFX+"first",String(f))}
  const lb=Math.max(+LS.get(PFX+"lastbk")||0,+LS.get("folio-lastbk")||0),since=Math.floor((Date.now()-Math.max(lb,f))/864e5);if(since<7)return "";
  return `<div class="examc">${lb?`It's been ${Math.floor((Date.now()-lb)/864e5)} days since you last backed up`:"You haven't backed up yet"}. Your ${n} note${n===1?"":"s"} and bookmarks live only on this device. <button class="link" id="bk-rem">Back up now</button></div>`}
function examHTML(){if(!prog.exam)return `<button class="link" id="ex-set" style="margin-top:6px">Set your exam date for a daily reading plan</button>`;
  const days=Math.ceil((new Date(prog.exam+"T09:00")-Date.now())/864e5);if(days<0)return `<div class="examc">Exam date passed. <button class="link" id="ex-set">Set a new date</button></div>`;
  const un=scenes.filter(p=>!prog.done[p.id]),per=Math.max(1,Math.ceil(un.length/Math.max(1,days-2)));
  return `<div class="examc"><b>${days} day${days===1?"":"s"}</b> to your exam · ${un.length} scene${un.length===1?"":"s"} left to read<br>${un.length?`Today: read ${un.slice(0,per).map(p=>`<button class="link" data-go="${p.id}">${sName(p)}</button>`).join(", ")}`:"All read. Today: flashcards and an essay plan."} · <button class="link" id="ex-set">Change date</button></div>`}
function openExamDate(){openSheet("Exam date",`<p class="intro">We'll spread the scenes you haven't read across the days left, leaving the last two days for revision.</p><input type="date" class="sinput" id="ex-d" value="${esc(prog.exam||"")}"><div class="row"><button class="btn primary" id="ex-ok">Save</button>${prog.exam?`<button class="btn" id="ex-clr">Remove date</button>`:""}</div>`);
  $("ex-ok").onclick=()=>{prog.exam=$("ex-d").value;saveProg();closeSheet();renderHome()};if($("ex-clr"))$("ex-clr").onclick=()=>{prog.exam="";saveProg();closeSheet();renderHome()}}
function renderHome(){
  const lp=pos&&sIdx(pos.s)>=0?scenes[sIdx(pos.s)]:scenes[0];
  const done=scenes.filter(p=>prog.done[p.id]).length;
  const qs=Object.entries(prog.quiz).filter(([k])=>k!=="all").map(x=>x[1]);const qc=qs.reduce((a,q)=>a+q[0],0),qt=qs.reduce((a,q)=>a+q[1],0);
  $("contcard").innerHTML=`<div class="row2"><button class="go" id="contbtn"><small>${pos?"Continue reading":"Begin reading"}</small><b>${sName(lp)} · ${esc(shortLoc(lp))}</b></button>
    <button class="go alt" id="studybtn"><small>Revise</small><b>Study</b></button></div>
    <div class="meter"><i style="width:${done/scenes.length*100}%"></i></div>
    <div class="stats"><span><b>${done}</b> of ${scenes.length} scenes read</span><span>quizzes <b>${qt?Math.round(qc/qt*100)+"%":"–"}</b></span><span><b>${Object.keys(marks).length}</b> notes</span><span><b>${Object.keys(prog.cards).length}</b> of ${QUOTES.quotes.length} quotes learnt</span></div>
    ${(()=>{const s=streak(),w=weekStats(),td=Math.round(((LOG[today()]||{}).s||0)/60);return `<div class="stats"><span>🔥 <b>${s}</b> day${s===1?"":"s"} in a row</span><span><b>${td}</b> min today</span><span>This week: <b>${w.min}</b> min · <b>${w.p}</b> pages · <b>${w.sc}</b> scene${w.sc===1?"":"s"}</span></div>`})()}`;
  $("contcard").insertAdjacentHTML("beforeend",examHTML()+bkRemHTML());if($("ex-set"))$("ex-set").onclick=openExamDate;
  if($("bk-rem"))$("bk-rem").onclick=()=>{openSheet("Back up",backupHTML());wireBackup(renderHome)};
  $("contbtn").onclick=()=>{const k=sIdx(lp.id);goScene(k,pos&&pos.s===lp.id?{key:pos.key}:{page:0})};
  $("studybtn").onclick=()=>goStudy();
  let h="";
  for(let a=1;a<=5;a++){const ps=scenes.filter(p=>p.act===a);const ad=ps.filter(p=>prog.done[p.id]).length;
    h+=`<details class="actd"${a===lp.act?" open":""}><summary><span>${LAT[a]}</span><small>Act ${R[a]} · ${ad}/${ps.length} read</small></summary><div class="srows">`+
      ps.map(p=>{const q=prog.quiz[p.id];const s=STUDY.scenes[p.id]||{};
        return `<button class="srow${prog.done[p.id]?" done":""}${pos&&p.id===pos.s?" here":""}" data-go="${p.id}"><span class="n">${prog.conf[p.id]?`<i class="dot ${esc(prog.conf[p.id])}"></i>`:""}${p.scene.toLowerCase()}</span><span class="loc">${esc(shortLoc(p))}</span><span class="st">${prog.done[p.id]?"✓ read":""}${q?` · quiz ${esc(q[0])}/${esc(q[1])}`:""}</span><span class="sum">${esc(firstSentence(s.sum))}</span></button>`}).join("")+`</div></details>`}
  $("actsmap").innerHTML=h;
  const here=pos&&sIdx(pos.s)>=0?sIdx(pos.s):-1;
  $("tstrip").innerHTML=EX.timeline.map(e=>`<button data-speech="${e.id}" class="${sIdx(e.s)<here?"past":""}"><small>${sName(scenes[sIdx(e.s)]).replace("Act ","").replace(", Scene ",".")}</small><span>${esc(e.t)}</span></button>`).join("");setHtab(LS.get(PFX+"htab")||"contents");
  $("cast").innerHTML=STUDY.chars.map(c=>{const key=c.name.toUpperCase().replace(/^THE /,"").replace(" OF VENICE","");const has=whoSet.has(key);
    return `<div class="castc" style="--c:${COLORS[key]||"var(--ink)"}"><b>${esc(c.name)}</b>${has?`<button class="link" data-follow="${esc(key)}">Follow their lines</button>`:"<span></span>"}<p>${esc(c.desc)}</p></div>`}).join("");
}
$("home").addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g)goScene(sIdx(g.dataset.go));
  const ts=e.target.closest("[data-speech]");if(ts)goSpeech(ts.dataset.speech);
  const f=e.target.closest("[data-follow]");if(f){S.who=f.dataset.follow;const k=scenes.findIndex(p=>p.items.some(i=>i.who===S.who));goScene(k);toast("Showing only "+title(S.who))}});
function setHtab(k){document.querySelectorAll("[data-htab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.htab===k));$("hp-contents").hidden=k!=="contents";$("hp-cast").hidden=k!=="cast";LS.set(PFX+"htab",k)}
document.querySelectorAll("[data-htab]").forEach(b=>b.onclick=()=>setHtab(b.dataset.htab));
$("hsearch").addEventListener("submit",e=>{e.preventDefault();openSearch($("hq").value)});
$("h-notes").onclick=openNotes;$("h-set").onclick=openSettings;

/* ---------- reader: blocks ---------- */
const pg=$("pg"),measure=$("measure"),vp=$("vp");
// a scene is a list of blocks; long speeches split into units (single lines, or aligned chunks when modern text shows)
function sceneBlocks(p){
  const b=[];
  if(!S.who)b.push({t:"head",key:"h"});
  p.items.forEach((it,ix)=>{
    if(it.t==="sd"){if(!S.who)b.push({t:"sd",it,key:"d"+ix})}
    else if(!S.who||it.who===S.who){
      const ps=partsOf(it),units=S.mode==="orig"?it.lines.map((l,i)=>[i,i,null]):ps.map(c=>[c[0],c[1],c[2]]);
      b.push({t:"sp",it,units,starts:new Set(ps.map(c=>c[0])),u0:0,u1:units.length,key:it.id+":0"});
    }});
  b.push({t:"end",key:"e"});
  return b;
}
/* breathing space: long speeches get a small gap after each full sentence; modern English is split into short paragraphs */
const endsSentence=l=>/[.?!]["'’”)\]]*\s*$/.test(l.replace(/\s*\[[^\]]*\]\s*$/,""));
function lineHTML(l,num,cpl,id,j){const song=l.startsWith("~"),t=song?l.slice(1):l;return `<span class="l${song?" song":""}${cpl?" cpl":""}"${num%5===0?` data-n="${num}"`:""}>${favLine(t,id,j)}</span>`}
/* saved favourite phrases are wrapped in <mark class="fph"> (glossing each piece separately) */
function favLine(t,id,j){if(id==null||!FAV.length)return gloss(t);const ws=[];t.replace(/\S+/g,(m,i)=>{ws.push([i,i+m.length]);return m});const rs=[];
  FAV.forEach(f=>{if(f.id!==id||j<f.a[0]||j>f.b[0]||!ws.length)return;const s=j===f.a[0]?f.a[1]:0,e=Math.min(ws.length-1,j===f.b[0]?f.b[1]:ws.length-1);if(s>=ws.length||e<s)return;rs.push([ws[s][0],ws[e][1],f.t])});
  if(!rs.length)return gloss(t);rs.sort((x,y)=>x[0]-y[0]);let h="",p=0;
  rs.forEach(([s,e,k])=>{if(e<=p)return;s=Math.max(s,p);h+=gloss(t.slice(p,s))+`<mark class="fph" data-fp="${k}">${gloss(t.slice(s,e))}</mark>`;p=e});return h+gloss(t.slice(p))}
/* long speeches are grouped into whole-thought parts (tap a part for its modern English) */
function linesHTML(it,a,b){let h="";const cp=CPL[it.id];partsOf(it).forEach((p,i)=>{const s=Math.max(a,p[0]),e=Math.min(b,p[1]);if(s>e)return;let x="";for(let j=s;j<=e;j++)x+=lineHTML(it.lines[j],it.start+j,cp!=null&&j>=cp,it.id,j);h+=`<div class="pt" data-p="${i}">${x}</div>`});return h}
function paras(t){const ss=String(t||"").match(/[^.!?]+[.!?]+["'’”)]*\s*|[^.!?]+$/g)||[t];const out=[];let curp="",n=0;
  ss.forEach(x=>{curp+=x;n++;if(n>=2||curp.length>200){out.push(curp.trim());curp="";n=0}});if(curp.trim())out.push(curp.trim());
  return out.map(p=>`<p>${esc(p)}</p>`).join("")}
function stageType(p){const l=p.loc.toLowerCase();const r=EX.stagerules.find(([re])=>new RegExp(re).test(l));return r?r[1]:"street"}
function stagePic(p){const k=stageType(p);return `<div class="stagepic"><svg viewBox="0 0 40 40" aria-hidden="true">${PICS[k]}</svg>${EX.place[p.id]?esc(EX.place[p.id])+" · ":""}${EX.stage[k]}</div>`}
function recapHTML(id){const k=sIdx(id);if(k===0)return `<ul>${EX.intro.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
  const pv=scenes[k-1],s=STUDY.scenes[pv.id]||{};return `<p class="muted" style="margin-top:0">At the end of ${sName(pv)}:</p><ul>${(s.key||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="muted">${esc(s.sum||"")}</p>`}
let PRED={};try{PRED=JSON.parse(LS.get(PFX+"pred")||"{}")}catch(e){}
function endExtras(p){const c=prog.conf[p.id];
  return `<div class="endbtns"><button data-endact="quiz:${p.id}">Quick quiz on this scene</button><button data-endact="quotes:${p.id}">Key quotes from this scene</button></div>
   <div class="conf">How well do you know this scene? ${[["r","Shaky"],["a","OK"],["g","Confident"]].map(([k,l])=>`<button data-endact="conf:${p.id}:${k}" aria-pressed="${c===k}"><i class="dot ${k}"></i>${l}</button>`).join("")}</div>`}
function endAct(v){const [a,s,k]=v.split(":");
  if(a==="quiz"){goStudy("quiz");startQuiz(s);return}
  if(a==="quotes"){const qs=QUOTES.quotes.filter(q=>speech[q.id].page===s);openSheet("Key quotes",qs.length?qs.map(quoteHTML).join(""):`<p class="muted">No key quotes are listed for this scene. Try the Key quotes tab in Study.</p>`);return}
  if(a==="conf"){prog.conf[s]=prog.conf[s]===k?"":k;saveProg();refreshMarks();toast("Saved")}}
function onStage(p){const ws=[];p.items.forEach(i=>{if(i.t==="sp"&&i.who&&!ws.includes(i.who))ws.push(i.who)});
  return `<div class="onstage">On stage: ${ws.map(w=>`<span style="--c:${COLORS[w]||"var(--ink)"}">${esc(title(w))}</span>`).join(" · ")}</div>`}
/* verse or prose; rhyming couplets */
const PROSE={};for(const id in speech){const L=speech[id].lines.map(l=>l.replace(/^~/,"").replace(/\[[^\]]*\]\s*/g,""));if(L.length<2)continue;
  const low=L.slice(1).filter(l=>/^[a-z]/.test(l)).length,long=L.filter(l=>l.length>62).length;PROSE[id]=low/(L.length-1)>=.5||long>=Math.max(1,L.length/3)}
const lastWord=l=>(l.replace(/^~/,"").replace(/\[[^\]]*\]/g,"").toLowerCase().match(/([a-z']+)[^a-z']*$/)||[])[1]||"";
function rhymes(a,b){a=lastWord(a);b=lastWord(b);if(!a||!b||a===b||a.length<2||b.length<2)return false;const e=w=>w.replace(/'/g,"").slice(-3);
  if(e(a)===e(b))return true;const v=w=>(w.match(/[aeiouy]+[^aeiouy]*$/)||[""])[0];return v(a).length>=2&&v(a)===v(b)}
const CPL={};for(const id in speech){const L=speech[id].lines;if(L.length>=2&&!PROSE[id]&&rhymes(L[L.length-2],L[L.length-1]))CPL[id]=L.length-2}
function blockHTML(bk,p){
  if(bk.t==="head"){const s=STUDY.scenes[p.id]||{};
    return `<div class="blk shead"><div class="eyebrow">${LAT[p.act]}. ${SL[p.scene]||""}.</div><h1>${sName(p)}</h1><div class="loc">${esc(p.loc)}</div>${stagePic(p)}${onStage(p)}<button class="recapb" data-recap="${p.id}">Story so far</button>${S.sum&&s.sum?`<div class="sum"><b>The Argument</b>${esc(s.sum)}</div>`:""}</div>`}
  if(bk.t==="sd")return `<div class="blk sd">${esc(bk.it.text)}</div>`;
  if(bk.t==="end"){const k=sIdx(p.id),n=scenes[k+1];
    const po=EX.predict[p.id],g=PRED[p.id];
    return `<div class="blk endblk"><div class="orn">❧</div><b>End of ${sName(p)}</b>${n?`<span>Turn the page for ${sName(n)} · ${esc(shortLoc(n))}</span>`:`<span>Finis</span>`}
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
  const hc=m.hl?" hl hl-"+(m.hl===true?"ev":m.hl):"";
  return `<article class="blk sp${hc}${solo?" solo":aside?" aside":PROSE[it.id]?" prose":""}${S.focus&&it.who===S.focus?" fwho":""}" data-id="${it.id}" data-key="${it.id}:${bk.u0}"><div class="hd"><span class="nm${cont?" cont":""}" style="${c?`--c:${c}`:""}">${esc(title(it.who))}${cont?" (cont.)":""}</span>${tag}${flags}</div><div class="body">${body}</div></article>`;
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
const sig=()=>[S.lh,S.mode,S.scale,S.who,S.sum,pg.clientWidth,pg.clientHeight].join("|");
function openScene(k,opts){
  opts=opts||{};const p=scenes[k];
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
function renderPage(i,dir,keep){
  const p=scenes[cur.k];cur.i=i;
  const html=cur.pages[i].map(b=>blockHTML(b,p)).join("");
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches||/^paper/.test(document.documentElement.dataset.theme||"");
  const put=()=>{pg.innerHTML=html;pg.scrollTop=0;pg.style.overflowY=pg.scrollHeight>pg.clientHeight+2?"auto":"hidden"};
  if(dir&&!reduce){pg.classList.add(dir>0?"turnL":"turnR");setTimeout(()=>{put();pg.classList.remove("turnL","turnR")},110)}else put();
  const first=cur.pages[i].find(b=>b.t==="sp")||cur.pages[i][0];
  if(!keep){pos={s:p.id,key:first?first.key:"h"};LS.set(PFX+"pos",JSON.stringify(pos));const st={pct:Math.round((cur.k+(i+1)/cur.pages.length)/scenes.length*1000)/10,where:sName(p),t:Date.now()};LS.set("folio-stat-"+PLAY,JSON.stringify(st));
    setTimeout(()=>{const sp=pg.querySelector(".sp[data-id]");if(!sp)return;const l=sp.querySelector(".o .l")||sp.querySelector(".o");st.who=first&&first.t==="sp"?title(first.it.who):"";st.line=l?l.textContent.replace(/^\s*\d+\s*/,"").trim().slice(0,140):"";LS.set("folio-stat-"+PLAY,JSON.stringify(st))},250)}
  if(i===cur.pages.length-1&&!prog.done[p.id]){prog.done[p.id]=Date.now();saveProg()}
  const n=cur.pages.length,mins=Math.ceil(cur.words*(n-1-i)/Math.max(1,n)/140);
  $("pgfoot").textContent=`${sName(p)} · ${i+1} / ${n}`;$("pgbar").style.width=((i+1)/n*100)+"%";logRead();
  $("p-num").textContent=`p. ${i+1} of ${n}${mins>0?` · ${mins} min left`:""}`;
  $("w-sub").textContent=shortLoc(p).toUpperCase()+(S.who?` · ${title(S.who).toUpperCase()} ONLY`:"");
  const r=$("p-range");r.max=n;r.value=i+1;bmState();
}
function turn(d,fromBar){
  if(document.body.classList.contains("chrome")){if(fromBar)armChrome();else toggleChrome(false)}
  hideGloss();if(toolsId!=null)closePanel();
  if(d>0){if(cur.i<cur.pages.length-1)renderPage(cur.i+1,1);else if(cur.k<scenes.length-1){setHash(scenes[cur.k+1].id,false);openScene(cur.k+1,{page:0})}else toast("The end of the play")}
  else{if(cur.i>0)renderPage(cur.i-1,-1);else if(cur.k>0){setHash(scenes[cur.k-1].id,false);openScene(cur.k-1,{page:"last"})}}
}
function repaginate(){if(view!=="reader"||cur.k<0)return;const key=pos&&pos.key;cur.sig="";openScene(cur.k,{key,keep:true})}
let rz;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(repaginate,180)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>repaginate());
function refreshMarks(){if(view==="reader"&&cur.k>=0){pg.innerHTML=cur.pages[cur.i].map(b=>blockHTML(b,scenes[cur.k])).join("");if(partSel)markPart();else if(toolsId!=null)pg.querySelectorAll(`.sp[data-id="${toolsId}"]`).forEach(x=>x.classList.add("active"))}}

/* ---------- reader: gestures (tap edges / swipe to turn, tap middle for menus, long-press for tools) ---------- */
let press=null,swallow=false;
vp.addEventListener("pointerdown",e=>{if(e.button)return;
  const sp=e.target.closest(".sp");press={x:e.clientX,y:e.clientY,t:Date.now(),sp,tgt:e.target,timer:null,moved:false};
  if(sp){press.pt=setTimeout(()=>{if(press&&press.sp===sp&&!press.moved)sp.classList.add("pressing")},160);
    press.timer=setTimeout(()=>{if(press&&press.sp===sp&&!press.moved){sp.classList.remove("pressing");swallow=true;try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}openTools(+sp.dataset.id,partAt(press.tgt,sp))}},480)}});
vp.addEventListener("pointermove",e=>{if(!press)return;if(Math.abs(e.clientX-press.x)>10||Math.abs(e.clientY-press.y)>10){press.moved=true;clearTimeout(press.timer);clearTimeout(press.pt);if(press.sp)press.sp.classList.remove("pressing")}});
function endPress(e,cancel){if(!press||pinch)return;clearTimeout(press.timer);clearTimeout(press.pt);if(press.sp)press.sp.classList.remove("pressing");
  const P=press;press=null;if(cancel)return;
  if(swallow){swallow=false;return}
  const dx=e.clientX-P.x,dy=e.clientY-P.y;
  if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3){turn(dx<0?1:-1);return}
  if(P.moved||Date.now()-P.t>450)return;
  if(gpop){hideGloss();return}
  if(S.onehand&&P.y>innerHeight*.78&&(P.x<innerWidth*.3||P.x>innerWidth*.7)){turn(P.x<innerWidth*.3?-1:1);return}
  const ea=P.tgt.closest&&P.tgt.closest("[data-endact]");if(ea){endAct(ea.dataset.endact);return}
  const pp=P.tgt.closest&&P.tgt.closest("[data-pop]");if(pp){showPop(pp,pp.dataset.pop,pp.dataset.text);return}
  const rc=P.tgt.closest&&P.tgt.closest("[data-recap]");if(rc){openSheet("Story so far",recapHTML(rc.dataset.recap));return}
  const pr=P.tgt.closest&&P.tgt.closest("[data-pred]");if(pr){const [s,i]=pr.dataset.pred.split(":");PRED[s]=+i;LS.set(PFX+"pred",JSON.stringify(PRED));refreshMarks();toast("Guess saved. Turn the page to find out.");return}
  const fp=P.tgt.closest&&!P.tgt.closest("abbr.g")&&P.tgt.closest("mark.fph");if(fp){const f=FAV.find(x=>String(x.t)===fp.dataset.fp);if(f){showPop(fp,"♥ Favourite phrase"+(f.note?"":" · in My notes"),f.note||f.txt);return}}
  const gw=nearGloss(P.tgt,P.x,P.y);if(gw){showGloss(gw);return}
  if(P.sp){const pt=P.tgt.closest(".pt")||(P.tgt.closest(".chunk")||P.sp).querySelector(".pt");
    if(pt){const id=+P.sp.dataset.id,pi=+pt.dataset.p;if(partSel&&partSel.id===id&&partSel.pi===pi&&toolsId!=null){closePanel();return}openPart(id,pi,false);return}}
  if(toolsId!=null&&wide()){closePanel();return}
  toggleChrome()}
vp.addEventListener("pointerup",e=>endPress(e,false));
vp.addEventListener("pointercancel",e=>endPress(e,true));
vp.addEventListener("contextmenu",e=>{e.preventDefault();const sp=e.target.closest(".sp");if(!sp)return;if(press){clearTimeout(press.timer);clearTimeout(press.pt);swallow=true}openTools(+sp.dataset.id,partAt(e.target,sp))});
vp.addEventListener("wheel",e=>{const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(d)<25)return;const now=Date.now();if(now-(vp.lw||0)<450)return;vp.lw=now;turn(d>0?1:-1)},{passive:true});
/* a tap within a few pixels of an underlined word counts as tapping it */
function nearGloss(tgt,x,y){const d=tgt&&tgt.closest&&tgt.closest("abbr.g");if(d)return d;
  for(const [dx,dy] of [[0,-9],[0,9],[-12,0],[12,0],[-9,-7],[9,-7],[-9,7],[9,7],[0,-15],[0,15]]){const el=document.elementFromPoint(x+dx,y+dy);const g=el&&el.closest&&el.closest("abbr.g");if(g)return g}return null}
/* pinch with two fingers to change the text size */
let pinch=null;const SIZES=[1.15,1.3,1.5,1.75];
vp.addEventListener("touchstart",e=>{if(e.touches.length===2){const [a,b]=e.touches;pinch={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),r:1};press=null}},{passive:true});
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
  if(e.key==="Escape"&&gpop){hideGloss();return}
  if(e.key==="Escape"){if(!$("sheet").hidden)closeSheet();else if(toolsId!=null)closePanel();else toggleChrome(false);return}
  if(view!=="reader"||!$("sheet").hidden||e.target.closest("input,textarea,select"))return;
  if(["ArrowRight","PageDown"," "].includes(e.key)){e.preventDefault();turn(1)}
  if(["ArrowLeft","PageUp"].includes(e.key)){e.preventDefault();turn(-1)}});

/* ---------- speech tools: side panel (wide) or sheet (phone) ---------- */
let toolsId=null;
const HLC=[["ev","Evidence"],["fav","Favourite"],["cf","Confusing"]];
const hlOf=m=>m.hl===true?"ev":m.hl||"";
function pairHTML(sp,q,cur){const og=sp.lines.slice(q[0],q[1]+1).map(l=>`<span>${esc(l.replace(/^~/,""))}</span>`).join("");
  return `<div class="pair${cur?" cur":""}"><div class="ptag">Shakespeare</div><div class="porig">${og}</div><div class="pmod"><div class="ptag">Modern English</div><p>${esc(q[2])}</p></div></div>`}
const partAt=(el,sp)=>{const pt=el&&el.closest&&(el.closest(".pt")||(el.closest(".chunk")||sp).querySelector(".pt"));return pt?+pt.dataset.p:0};
function toolsHTML(id,pi){
  const sp=speech[id],p=sceneOf(id),m=marks[id]||{},ps=partsOf(sp),q=ps[pi]||ps[0],gl=glossList({lines:sp.lines.slice(q[0],q[1]+1)}),sn=STUDY.notes[id],c=CH[sp.who],qs=QBY[id]||[];
  return `<div class="tool">
    <div class="ref">${sName(p)} · lines ${sp.start+q[0]}–${sp.start+q[1]}${ps.length>1?` · part ${(pi||0)+1} of ${ps.length}`:""}</div>
    <div class="iconrow">${HLC.map(([k,l])=>`<button class="ib hlb${hlOf(m)===k?" on":""}" data-hl="${k}" aria-pressed="${hlOf(m)===k}"><i class="hlk ${k}"></i>${l}</button>`).join("")}<button class="ib" id="t-fph"><span>♥</span>Favourite a phrase${FAV.some(f=>f.id===id)?` (${FAV.filter(f=>f.id===id).length})`:""}</button></div>
    <div class="iconrow"><button class="ib" id="t-focus"><span>◎</span>${S.focus===sp.who?"Stop dimming":"Dim all but "+esc(title(sp.who))}</button><button class="ib" id="t-follow"><span>◐</span>${S.who===sp.who?"Show everyone":"Only "+esc(title(sp.who))}</button><button class="ib" id="t-copy"><span>⧉</span>Copy</button><button class="ib" id="t-img"><span>▣</span>Image</button></div>
    <h3 class="lbl">Tag themes</h3><div class="tchips">${Object.entries(QUOTES.themes).map(([k,v])=>`<button class="chip" data-tth="${k}" aria-pressed="${(m.th||[]).includes(k)}">${esc(v[0])}</button>`).join("")}</div>
    <div style="height:12px"></div><div class="modern">${pairHTML(sp,q)}</div>
    ${gl.length?`<h3 class="lbl">Word meanings</h3><dl>${gl.map(k=>`<dt>${esc(k)}</dt><dd>${esc(G[k])}</dd>`).join("")}</dl>`:""}
    ${sn?`<h3 class="lbl">Study note</h3><div class="snote">${esc(sn)}</div>`:""}
    ${qs.map(q=>`<h3 class="lbl">Key quote</h3><div class="snote"><i>“${esc(q.text)}”</i><br>${esc(q.note)}${EX.why[q.i]?`<br><b>Why it matters:</b> ${esc(EX.why[q.i])}`:""}<br><small class="muted">${q.themes.map(t=>QUOTES.themes[t][0]).join(" · ")}</small></div>`).join("")}
    ${EX.irony[id]?`<h3 class="lbl">Dramatic irony</h3><div class="snote">${esc(EX.irony[id])}</div>`:""}
    ${(EX.dev[id]||[]).map(([k,n])=>`<h3 class="lbl">${esc(EX.devices[k])}</h3><div class="snote">${esc(n)}</div>`).join("")}
    <h3 class="lbl">My note</h3><label for="tn" class="sr">My note</label><textarea id="tn" placeholder="Your thoughts on these lines…">${esc(m.note||"")}</textarea>
    <div class="acts"><button class="btn sm" id="t-save">Save note</button></div>
    ${c?`<details class="about"><summary>About ${esc(title(sp.who))}</summary><p>${esc(c.desc)}</p></details>`:""}
  </div>`}
function wireTools(id,pi){
  const sp=speech[id],ps=partsOf(sp),q=ps[pi]||ps[0];
  $("t-save").onclick=()=>{const v=$("tn").value;saveMark(id,{note:v});toast(v.trim()?"Note saved":"Note removed")};
  document.querySelectorAll(".tool [data-hl]").forEach(b=>b.onclick=()=>{const k=b.dataset.hl,on=hlOf(marks[id]||{})!==k;saveMark(id,{hl:on?k:false});
    document.querySelectorAll(".tool [data-hl]").forEach(x=>{const a=on&&x===b;x.classList.toggle("on",a);x.setAttribute("aria-pressed",a)});markPart();toast(on?"Marked: "+HLC.find(x=>x[0]===k)[1]:"Highlight removed")});
  $("t-focus").onclick=()=>{S.focus=S.focus===sp.who?"":sp.who;applySettings();refreshMarks();markPart();$("t-focus").innerHTML=`<span>◎</span>${S.focus===sp.who?"Stop dimming":"Dim all but "+esc(title(sp.who))}`;toast(S.focus?"Dimming everyone except "+title(S.focus):"Showing everyone normally")};
  $("t-follow").onclick=()=>{S.who=S.who===sp.who?"":sp.who;closePanel();closeSheet();cur.sig="";openScene(sIdx(sp.page),{speech:id});toast(S.who?"Showing only "+title(S.who):"Showing everyone")};
  document.querySelectorAll(".tool [data-tth]").forEach(b=>b.onclick=()=>{const k=b.dataset.tth,th=((marks[id]||{}).th||[]).slice(),i=th.indexOf(k);if(i<0)th.push(k);else th.splice(i,1);saveMark(id,{th});b.setAttribute("aria-pressed",i<0);toast(i<0?"Tagged: "+QUOTES.themes[k][0]:"Tag removed")});
  $("t-img").onclick=()=>{const kq=(QBY[id]||[])[0];openImage(kq?[kq.text]:sp.lines.slice(q[0],q[1]+1).map(l=>l.replace(/^~/,"")),title(sp.who),sName(sceneOf(id))+", lines "+(sp.start+q[0])+"–"+(sp.start+q[1]))};
  $("t-fph").onclick=()=>openPhrase(id,pi);
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
/* favourite a phrase: tap the first word, then the last (one speech, original text) */
function phraseHTML(id,pi){const sp=speech[id],ps=partsOf(sp),q=ps[pi]||ps[0],mine=FAV.filter(f=>f.id===id);
  const saved=(l,w)=>mine.some(f=>(l>f.a[0]||l===f.a[0]&&w>=f.a[1])&&(l<f.b[0]||l===f.b[0]&&w<=f.b[1]));
  return `<div class="tool"><div class="ref">${sName(sceneOf(id))} · lines ${sp.start}–${sp.start+sp.lines.length-1}</div>
    <h3 class="lbl">Favourite a phrase</h3><p class="muted fp-help" id="fp-help">Tap the first word, then the last word.</p>
    <div class="fpick" id="fp-pick">${sp.lines.map((l,li)=>`<div class="fl${li>=q[0]&&li<=q[1]?" inpt":""}" data-fl="${li}">${lineWords(l).map((w,wi)=>`<button type="button" class="fw${saved(li,wi)?" sv":""}" data-fw="${li}:${wi}">${esc(w)}</button>`).join(" ")}</div>`).join("")}</div>
    <div class="fp-sel" id="fp-sel" hidden></div>
    <label for="fp-note" class="lbl" style="display:block;margin:14px 0 8px">Note (optional)</label><textarea id="fp-note" placeholder="Why this phrase?"></textarea>
    <div class="acts"><button class="btn sm primary" id="fp-save" disabled>Save favourite</button><button class="btn sm" id="fp-back">‹ Back to speech tools</button></div>
    ${mine.length?`<h3 class="lbl">Saved from this speech</h3>`+mine.map(f=>`<div class="snote fp-item"><span style="font-family:var(--f-old)">“${esc(f.txt)}”</span>${f.note?`<div class="mynote">${esc(f.note)}</div>`:""}<button class="link" data-fpx="${esc(f.t)}">Remove</button></div>`).join(""):""}
  </div>`}
function openPhrase(id,pi){const sp=speech[id],h=phraseHTML(id,pi);
  if(wide()&&$("panel").classList.contains("open")){$("panel-title").textContent=title(sp.who);$("panel-body").innerHTML=h;$("panel-body").scrollTop=0}else openSheet(title(sp.who),h);
  const box=$("fp-pick"),first=box.querySelector(".fl.inpt");if(first&&pi)first.scrollIntoView({block:"nearest"});
  let a=null,b=null;const pos=el=>el.dataset.fw.split(":").map(Number),lt=(x,y)=>x[0]<y[0]||x[0]===y[0]&&x[1]<y[1];
  const paint=()=>{box.querySelectorAll(".fw").forEach(el=>{const p=pos(el),on=a&&!lt(p,a)&&!lt(b||a,p);el.classList.toggle("on",!!on);el.classList.toggle("end",!!a&&!b&&p[0]===a[0]&&p[1]===a[1])});
    const sel=$("fp-sel");if(a){sel.hidden=false;sel.textContent="“"+favText(id,a,b||a)+"”"}else sel.hidden=true;
    $("fp-help").textContent=!a?"Tap the first word, then the last word.":!b?"Now tap the last word (or save just this word).":"Save it, or tap a word to start again.";$("fp-save").disabled=!a};
  box.onclick=e=>{const w=e.target.closest(".fw");if(!w)return;const p=pos(w);if(!a||b){a=p;b=null}else{b=p;if(lt(b,a))[a,b]=[b,a]}paint()};
  $("fp-save").onclick=()=>{if(!a)return;const e=b||a;if(FAV.some(f=>f.id===id&&f.a+""===a+""&&f.b+""===e+"")){toast("Already saved");return}
    FAV.push({id,a,b:e,txt:favText(id,a,e),note:$("fp-note").value.trim(),t:Date.now()});favSort();saveFav();refreshMarks();markPart();toast("Phrase saved. Find it in My notes.");openPhrase(id,pi)};
  $("fp-back").onclick=()=>openTools(id,pi);
  document.querySelectorAll(".tool [data-fpx]").forEach(x=>x.onclick=()=>{FAV=FAV.filter(f=>String(f.t)!==x.dataset.fpx);saveFav();refreshMarks();markPart();toast("Phrase removed");openPhrase(id,pi)});
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
const TABS=[["explore","Explore"],["quotes","Key quotes"],["cards","Flashcards"],["drill","Practise"],["quiz","Quizzes"],["themes","Themes"],["plan","Essay planner"],["prof","Profiles"],["acts","Act summaries"],["revise","Revision sheet"]];
function renderStudy(){
  if(!TABS.some(t=>t[0]===S.stab))S.stab="quotes";
  $("stabs").innerHTML=TABS.map(([k,l])=>`<button role="tab" aria-selected="${S.stab===k}" data-tab="${k}">${l}</button>`).join("");
  ({drill:studyDrill,plan:studyPlan,prof:studyProf,acts:studyActs,explore:studyExplore,quotes:studyQuotes,cards:studyCards,themes:studyThemes,quiz:studyQuiz,revise:studyRevise})[S.stab]();
}
$("stabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(b){S.stab=b.dataset.tab;LS.set(PFX+"stab",S.stab);renderStudy()}});
$("s-back").onclick=()=>{if(pos&&sIdx(pos.s)>=0)goScene(sIdx(pos.s),{key:pos.key});else goScene(0)};
$("s-home").onclick=goHome;
function quoteHTML(q){const sp=speech[q.id];return `<div class="qt" style="--c:${COLORS[sp.who]||"var(--ink)"}"><blockquote>“${esc(q.text)}”</blockquote>
  <div class="meta"><b>${esc(title(sp.who))}</b><span>${sName(sceneOf(q.id))}</span><button class="link" data-speech="${q.id}">Read in context</button></div>
  <p>${q.themes.map(t=>`<span class="th">${esc(QUOTES.themes[t][0])}</span>`).join("")}<br>${esc(q.note)}</p></div>`}
let qf={who:"",th:""};
function studyQuotes(){
  const whos=[...new Set(QUOTES.quotes.map(q=>speech[q.id].who))];
  const list=QUOTES.quotes.filter(q=>(!qf.who||speech[q.id].who===qf.who)&&(!qf.th||q.themes.includes(qf.th)));
  $("sbody").innerHTML=`<p class="intro">The play's most quoted lines, in order. Filter by character or theme.</p>
   <div class="qsel"><label><span>Character</span><select data-qf="who"><option value="">All characters</option>${whos.map(w=>`<option value="${w}"${qf.who===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select></label>
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
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Character map for Act ${R[act]}"><defs>${mk}</defs>${ed}${nd}</svg>
   <div class="legend">${Object.entries({love:"Loves",trust:"Trusts",hate:"Hates / harms",deceive:"Deceives"}).map(([k,l])=>`<span><i style="background:${C[k]}"></i>${l}</span>`).join("")}</div>
   <p class="muted" style="font-size:.875rem">Arrows point from the character who feels it to the one it is aimed at.</p>`}
let mapAct=1;
function arcSVG(){const W=360,H=200,L=30,T=12,B=30,n=scenes.length,x=i=>L+i*(W-L-10)/(n-1),y=v=>T+(10-v)*(H-T-B)/10,cols=["var(--accent)","var(--bad)"];
  const ls=Object.entries(EX.arc).map(([k,v],j)=>`<polyline points="${v.map((a,i)=>x(i)+","+y(a)).join(" ")}" fill="none" stroke="${cols[j]}" stroke-width="2.4"/>`+v.map((a,i)=>`<circle cx="${x(i)}" cy="${y(a)}" r="2.6" fill="${cols[j]}"/>`).join("")).join("");
  const ax=scenes.map((p,i)=>p.sc===1?`<line x1="${x(i)}" y1="${T}" x2="${x(i)}" y2="${H-B}" stroke="var(--rule)"/><text x="${x(i)}" y="${H-B+16}" text-anchor="middle">Act ${R[p.act]}</text>`:"").join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${CFG.chartLabel}">${ax}<text x="4" y="${y(10)+4}">10</text><text x="4" y="${y(0)+4}">0</text>${ls}</svg>
   <div class="legend">${Object.keys(EX.arc).map((k,j)=>`<span><i style="background:${cols[j]}"></i>${esc(k)}</span>`).join("")}</div><p class="intro">${esc(EX.arcnote)}</p>`}
let GLOSSUSE=null;
function glossUse(){if(GLOSSUSE)return GLOSSUSE;GLOSSUSE={};for(const id in speech)speech[id].lines.join(" ").replace(gre,(m,pre,w)=>{const k=gmap[w.toLowerCase()];if(k&&!GLOSSUSE[k])GLOSSUSE[k]=id;return m});return GLOSSUSE}
function studyExplore(){
  if(!exSel){$("sbody").innerHTML=`<p class="intro">Ways into the play beyond the text: plot, characters, context and language.</p><div class="exgrid">${EXT.filter(([k])=>exHas(k)).map(([k,tl,d])=>`<button data-ex="${k}"><b>${tl}</b><span>${d}</span></button>`).join("")}</div>`;return}
  const [,tl]=EXT.find(x=>x[0]===exSel);let h="";
  const hereK=pos&&sIdx(pos.s)>=0?sIdx(pos.s):-1;
  if(exSel==="timeline")h=EX.timeline.map((e,i)=>`<div class="exitem"><small>${i+1} · ${sName(scenes[sIdx(e.s)])}</small><br><b>${esc(e.t)}</b>${spLine(e.id)}</div>`).join("");
  if(exSel==="map")h=`<div class="chips" style="margin-bottom:6px">${[1,2,3,4,5].map(a=>`<button class="chip" data-mapact="${a}" aria-pressed="${mapAct===a}">Act ${R[a]}</button>`).join("")}</div>${relSVG(mapAct)}`;
  if(exSel==="iago")h=`<p class="intro">Steps are ticked once you've read past that scene.</p>`+EX.iago.map(([s,st],i)=>{const k=sIdx(s),done=prog.done[s]||k<hereK;return `<div class="exitem"><span class="tick">${done?"✓":"○"}</span> <small>${sName(scenes[k])}</small><p style="margin-top:2px;color:var(--ink)">${i+1}. ${esc(st)}</p></div>`}).join("");
  if(exSel==="arcs")h=arcSVG();
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
const DRILLS=[["gap","Fill the gap","Type the missing words in a key quote"],["ladder","Memory ladder","Learn a quote: full, then half hidden, then first letters, then from memory"],["explain","Explain this line","Put a passage in your own words, then compare"],["who","Who said it?","Match 8 quotes to their speakers"],["order","Put it in order","Sort 6 plot events into the right sequence"]];
const rnd=a=>a[Math.floor(Math.random()*a.length)],shuf=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]);
function studyDrill(){
  const back=`<div class="exh"><button class="btn sm" data-drill="">‹ All drills</button><h2>${dr.k?DRILLS.find(d=>d[0]===dr.k)[1]:""}</h2></div>`;
  if(!dr.k){$("sbody").innerHTML=`<p class="intro">Short exercises for remembering quotes and understanding the language.</p><div class="drills">${DRILLS.map(([k,a,b])=>`<button data-drill="${k}"><b>${a}</b><span>${b}</span></button>`).join("")}</div>`;return}
  let h="";
  if(dr.k==="gap"){if(!dr.q){const q=rnd(QUOTES.quotes),ws=q.text.split(/\s+/),cand=ws.map((w,i)=>[w.replace(/[^A-Za-z']/g,""),i]).filter(x=>x[0].length>3);const pick=shuf(cand).slice(0,Math.min(2,cand.length)).map(x=>x[1]);dr.q={q,ws,pick,res:null}}
    const {q,ws,pick,res}=dr.q;h=`<div class="qz"><div class="gapq">“${ws.map((w,i)=>pick.includes(i)?(res?`<b style="color:${res[i]?"var(--ok)":"var(--bad)"}">${esc(w)}</b>`:`<input data-gap="${i}" aria-label="Missing word" autocomplete="off" autocapitalize="off">`)+esc(w.replace(/[A-Za-z']+/,"").slice(0)):esc(w)).join(" ")}”</div>
      <p class="muted">${esc(title(speech[q.id].who))} · ${sName(sceneOf(q.id))}</p><div class="row">${res?`<button class="btn primary" id="dr-next">Next quote</button>`:`<button class="btn primary" id="dr-check">Check</button><button class="link" id="dr-show">Show answer</button>`}</div></div>`}
  if(dr.k==="ladder"){if(dr.i==null)dr.i=0;if(dr.l==null)dr.l=0;const q=QUOTES.quotes[dr.i],ws=q.text.split(/\s+/);
    const view=dr.l===0?esc(q.text):dr.l===1?ws.map((w,i)=>i%2?w.replace(/[A-Za-z]/g,"_"):w).map(esc).join(" "):dr.l===2?ws.map(w=>w.replace(/([A-Za-z])[A-Za-z']*/,"$1")).map(esc).join(" "):"";
    h=`<label class="lbl" for="ld-q">Quote</label><select class="sinput" id="ld-q">${QUOTES.quotes.map((x,i)=>`<option value="${i}"${i===dr.i?" selected":""}>${esc(x.text.slice(0,60))}</option>`).join("")}</select>
     <div class="qz" style="margin-top:10px"><div class="qn">Step ${dr.l+1} of 4: ${["Read it","Every other word hidden","First letters only","From memory"][dr.l]}</div><div class="ladder">${dr.l<3?view:`<textarea class="sinput" id="ld-a" placeholder="Type the whole quote from memory"></textarea>`}</div>
     <div class="row">${dr.l>0?`<button class="btn" id="ld-prev">‹ Easier</button>`:""}${dr.l<3?`<button class="btn primary" id="ld-next">Harder ›</button>`:`<button class="btn primary" id="ld-chk">Check</button>`}</div><div id="ld-res"></div></div>`}
  if(dr.k==="explain"){if(!dr.p){const ids=Object.keys(PARTS);const id=rnd(ids),ps=PARTS[id],pi=Math.floor(Math.random()*ps.length);dr.p={id,pi,show:false}}
    const sp=speech[dr.p.id],q=partsOf(sp)[dr.p.pi];h=`<div class="qz"><div class="qn">${esc(where(sp))}</div><div class="tool"><div class="porig">${sp.lines.slice(q[0],q[1]+1).map(l=>`<span>${esc(l.replace(/^~/,""))}</span>`).join("")}</div></div>
     <label class="lbl" for="ex-a" style="display:block;margin-top:12px">In your own words</label><textarea class="sinput" id="ex-a" style="min-height:90px" placeholder="What is being said here?">${esc(dr.p.mine||"")}</textarea>
     ${dr.p.show?`<div class="tool"><div class="pmod"><div class="ptag">Modern English</div><p>${esc(q[2])}</p></div></div><p class="muted">Did you catch the main point? Compare word choices too.</p>`:""}
     <div class="row">${dr.p.show?`<button class="btn primary" id="ex-next">Another passage</button>`:`<button class="btn primary" id="ex-show">Compare</button>`}</div></div>`}
  if(dr.k==="who"){if(!dr.w){const qs=shuf(QUOTES.quotes).slice(0,8);dr.w={qs,i:0,ok:0,ans:null}}const W=dr.w;
    if(W.i<W.qs.length){const q=W.qs[W.i],who=speech[q.id].who,opts=shuf([who,...shuf(CFG.drillCast.filter(x=>x!==who)).slice(0,3)]);
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
   <div class="box chk"><h3>Self-marking checklist</h3><p class="intro">After writing, tick what your answer does.</p>${EX.check.map((c,i)=>`<label><input type="checkbox" data-ck="${i}"${P.chk[i]?" checked":""}> ${esc(c)}</label>`).join("")}<p class="muted" id="ck-n">${Object.values(P.chk).filter(Boolean).length} of ${EX.check.length}</p></div></div>`;
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
function actText(a){return `ACT ${R[a]}\n`+scenes.filter(p=>p.act===a).map(p=>{const s=STUDY.scenes[p.id]||{};return `\n${sName(p)} (${shortLoc(p)})\n${s.sum||""}\n`+(s.key||[]).map(k=>`  - ${k}`).join("\n")}).join("\n")+`\n\nKey quotes:\n`+QUOTES.quotes.filter(q=>sceneOf(q.id).act===a).map(q=>`  "${q.text}" (${title(speech[q.id].who)})`).join("\n")}
function studyActs(){$("sbody").innerHTML=`<p class="intro noprint">One page per act: what happens, the key points and the key quotes. Print or copy them for revision.</p>
  <div class="row noprint"><button class="btn primary" id="as-print">Print all</button><button class="btn" id="as-copy">Copy all</button></div>
  ${[1,2,3,4,5].map(a=>`<div class="box" style="break-after:page"><h3>${LAT[a]} · Act ${R[a]}</h3>${scenes.filter(p=>p.act===a).map(p=>{const s=STUDY.scenes[p.id]||{};return `<div class="exitem"><b>${sName(p)}</b> <small>${esc(shortLoc(p))}</small><p>${esc(s.sum||"")}</p><ul>${(s.key||[]).map(k=>`<li>${esc(k)}</li>`).join("")}</ul></div>`}).join("")}
   <div class="lbl" style="margin-top:10px">Key quotes</div>${QUOTES.quotes.filter(q=>sceneOf(q.id).act===a).map(q=>`<p style="margin:4px 0;font-family:var(--f-old);font-size:1.05rem">“${esc(q.text)}” <small class="muted">${esc(title(speech[q.id].who))}</small></p>`).join("")}</div>`).join("")}`;
  $("as-print").onclick=()=>window.print();$("as-copy").onclick=()=>copyText([1,2,3,4,5].map(actText).join("\n\n"))}
/* flashcards: quotes not yet learnt come first, shuffled */
let deck=null,flip=false;
const INT=[0,1,3,7,14,30];
const dueList=()=>{const now=Date.now();return QUOTES.quotes.map(q=>q.i).filter(i=>{const s=prog.srs[i];return !s||s.d<=now})};
function newDeck(){const now=Date.now(),sh=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);const due=dueList();
  deck=[...sh(due.filter(i=>prog.srs[i])),...sh(due.filter(i=>!prog.srs[i])).slice(0,12)];flip=false}
function studyCards(){
  if(!deck||!deck.length)newDeck();
  if(!deck.length){const nx=Math.min(...Object.values(prog.srs).map(s=>s.d));$("sbody").innerHTML=`<p class="intro">Nothing due right now. Well done.</p><div class="card"><blockquote>All caught up</blockquote><p class="muted">Next card due ${isFinite(nx)?new Date(nx).toLocaleDateString():"soon"}.</p></div><div class="cardbtns"><button class="btn" id="c-extra">Practise anyway</button></div>`;
    $("c-extra").onclick=()=>{deck=QUOTES.quotes.map(q=>q.i).sort(()=>Math.random()-.5).slice(0,10);studyCards()};return}
  const q=QUOTES.quotes[deck[0]],sp=speech[q.id],p=sceneOf(q.id),known=Object.keys(prog.cards).length;
  $("sbody").innerHTML=`<p class="intro">Who said it, and when? Think of your answer, then turn the card.</p>
   <div class="card" style="--c:${COLORS[sp.who]||"var(--ink)"}"><blockquote>“${esc(q.text)}”</blockquote>
   ${flip?`<div class="ans"><b>${esc(title(sp.who))}</b><span>${sName(p)} · ${esc(shortLoc(p))}</span><p>${esc(q.note)}</p></div>`:""}</div>
   <div class="cardbtns">${flip?`<button class="btn" id="c-again">Not yet</button><button class="btn primary" id="c-knew">I knew it</button><button class="link" data-speech="${q.id}">Read in context</button>`:`<button class="btn primary" id="c-flip">Turn the card</button>`}</div>
   <div class="cardstat">${known} of ${QUOTES.quotes.length} learnt · <b>${dueList().length}</b> due today · ${deck.length} left in this round${prog.srs[q.i]?` · box ${esc(prog.srs[q.i].b)} of 5`:" · new"} · <button class="link" id="c-reset">Start over</button></div>
   <p class="muted" style="text-align:center;font-size:.875rem">Cards you know come back after 1, 3, 7, 14, then 30 days. Cards you miss come back today.</p>`;
  if($("c-flip"))$("c-flip").onclick=()=>{flip=true;studyCards()};
  if($("c-knew"))$("c-knew").onclick=()=>{const s=prog.srs[q.i]||{b:0};s.b=Math.min(5,s.b+1);s.d=Date.now()+INT[s.b]*864e5-36e5;prog.srs[q.i]=s;if(s.b>=2)prog.cards[q.i]=Date.now();
    if(prog.miss.c[q.i])prog.miss.c[q.i]=0;saveProg();deck.shift();flip=false;if(!deck.length)toast("Round finished");studyCards()};
  if($("c-again"))$("c-again").onclick=()=>{prog.srs[q.i]={b:0,d:Date.now()};delete prog.cards[q.i];prog.miss.c[q.i]=(prog.miss.c[q.i]||0)+1;saveProg();deck.push(deck.shift());flip=false;studyCards()};
  $("c-reset").onclick=()=>{prog.cards={};prog.srs={};saveProg();newDeck();studyCards()};
}
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
function missHTML(){const nq=prog.miss.q.length,cs=Object.keys(prog.miss.c||{}).filter(i=>prog.miss.c[i]>0),cf=Object.keys(marks).filter(k=>marks[k].hl==="cf"&&speech[k]);
  if(!nq&&!cs.length&&!cf.length)return "";
  return `<div class="box" style="margin:0 0 16px;border:0;padding:0"><h3>Mistakes review</h3><p class="intro">${nq} missed question${nq===1?"":"s"} · ${cs.length} quote${cs.length===1?"":"s"} you didn't know · ${cf.length} line${cf.length===1?"":"s"} marked confusing</p>
   ${nq?`<button class="btn primary" id="qz-miss">Retry missed questions</button>`:""}
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
  qz={kind,qs,i:0,ok:0,ans:null};studyQuiz();scrollTo(0,0);
}
function studyQuiz(){
  if(qz&&qz.i<qz.qs.length){const q=qz.qs[qz.i],p=scenes[sIdx(q.s)];
    $("sbody").innerHTML=`<div class="qz"><div class="qn">${qz.kind==="all"?"Whole play":qz.kind==="miss"?"Mistakes review":sName(p)} · question ${qz.i+1} of ${qz.qs.length}</div><h3>${esc(q.q)}</h3>
      <div class="opts">${q.o.map((o,i)=>`<button data-i="${i}"${qz.ans!=null?" disabled":""} class="${qz.ans!=null?(i===q.a?"right":i===qz.ans?"wrong":""):""}">${esc(o)}</button>`).join("")}</div>
      <div class="row">${qz.ans!=null?`<button class="btn primary" id="qz-next">${qz.i+1<qz.qs.length?"Next question":"See score"}</button>`:""}<button class="link" id="qz-quit">Stop quiz</button>${qz.kind==="all"?`<span class="muted" style="font-size:.875rem">from ${sName(p)}</span>`:""}</div></div>`;
    $("sbody").querySelectorAll(".opts button").forEach(b=>b.onclick=()=>{qz.ans=+b.dataset.i;const M=prog.miss.q,ix=M.findIndex(m=>m.q===q.q);
      if(qz.ans===q.a){qz.ok++;if(ix>=0)M.splice(ix,1)}else if(ix<0)M.push({q:q.q,o:q.o,a:q.a,s:q.s});saveProg();studyQuiz()});
    if($("qz-next"))$("qz-next").onclick=()=>{qz.i++;qz.ans=null;studyQuiz()};
    $("qz-quit").onclick=()=>{qz=null;studyQuiz()};return}
  if(qz){const k=qz.kind,old=prog.quiz[k];if(k!=="miss"&&(k==="all"||!old||qz.ok>=old[0])){prog.quiz[k]=[qz.ok,qz.qs.length];saveProg()}
    $("sbody").innerHTML=`<div class="qz" style="text-align:center"><div class="qn">${k==="all"?"Whole play":k==="miss"?"Mistakes review":sName(scenes[sIdx(k)])}</div><div class="big">${qz.ok} of ${qz.qs.length}</div><p class="muted">${qz.ok===qz.qs.length?"Perfect score.":"The right answers were shown as you went."}</p><div class="row" style="justify-content:center"><button class="btn primary" id="qz-again">Try again</button><button class="btn" id="qz-list">All quizzes</button></div></div>`;
    $("qz-again").onclick=()=>startQuiz(k);$("qz-list").onclick=()=>{qz=null;studyQuiz()};return}
  const all=prog.quiz.all;
  $("sbody").innerHTML=`<p class="intro">Test yourself scene by scene, or take 20 random questions from the whole play.</p>
   ${missHTML()}
   <button class="go" id="qz-all" style="width:100%"><small>Practice test${all?` · last score ${esc(all[0])} of ${esc(all[1])}`:""}</small><b>Whole-play quiz · 20 questions</b></button>
   ${[1,2,3,4,5].map(a=>`<div class="stage3"><h3>${LAT[a]}</h3><small>Act ${R[a]}</small></div><div class="qlist">${scenes.filter(p=>p.act===a).map(p=>{const b=prog.quiz[p.id];return `<button class="${b?"done":""}" data-q="${p.id}"><b>Scene ${p.scene.toLowerCase()}</b><span>${b?`Best: ${esc(b[0])} of ${esc(b[1])}`:`${((STUDY.scenes[p.id]||{}).quiz||[]).length} questions`}</span></button>`}).join("")}</div>`).join("")}`;
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
function download(name,text,type){if(window.claude){copyText(text);setTimeout(()=>toast("Files can’t be saved here, so it was copied instead. The home-screen app can save files."),1300);return}try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){}
  toast("Downloading. If nothing appears, use Copy instead.")}
const backup=()=>JSON.stringify({app:CFG.app,v:2,saved:new Date().toISOString(),marks,prog,bm:BM,fav:FAV,plan:PLAN,prof:PROF,log:LOG});
function restore(txt){if(!String(txt||"").trim()){toast("Paste a backup first, or choose the file");return false}let d;try{d=JSON.parse(String(txt).trim())}catch(e){toast("That isn't a valid backup");return false}
  if(!d||d.app!==CFG.app){toast(`That isn't ${CFG.an} ${CFG.short} backup`);return false}
  Object.entries(d.marks||{}).forEach(([k,v])=>{if(!marks[k]||(v.t||0)>(marks[k].t||0)){marks[k]=v;if(store)store.doc(String(k)).set(v).catch(()=>{})}});LS.set(PFX+"marks",JSON.stringify(marks));
  const p=d.prog||{};Object.assign(prog.done,p.done||{});Object.assign(prog.cards,p.cards||{});Object.assign(prog.srs,p.srs||{});Object.assign(prog.conf,p.conf||{});if(p.exam)prog.exam=p.exam;
  Object.entries(p.quiz||{}).forEach(([k,v])=>{if(!prog.quiz[k]||v[0]>prog.quiz[k][0])prog.quiz[k]=v});saveProg();
  (d.bm||[]).forEach(b=>{if(!BM.some(x=>x.s===b.s&&x.key===b.key))BM.push(b)});saveBM();
  (Array.isArray(d.fav)?d.fav:[]).forEach(f=>{if(!f||!speech[f.id]||!Array.isArray(f.a)||!Array.isArray(f.b))return;const a=f.a.map(Number),b=f.b.map(Number);if(a.some(isNaN)||b.some(isNaN))return;
    if(!FAV.some(x=>x.id===+f.id&&x.a+""===a+""&&x.b+""===b+""))FAV.push({id:+f.id,a,b,txt:String(f.txt||favText(+f.id,a,b)),note:String(f.note||""),t:+f.t||Date.now()})});favSort();saveFav();refreshMarks();
  Object.entries(d.plan||{}).forEach(([k,v])=>{if(!(k in PLAN))PLAN[k]=v});savePlan();
  Object.entries(d.prof||{}).forEach(([k,v])=>{if(!(k in PROF))PROF[k]=v});LS.set(PFX+"prof",JSON.stringify(PROF));
  Object.entries(d.log||{}).forEach(([k,v])=>{if(!LOG[k]||v.s>LOG[k].s)LOG[k]=v});LS.set(PFX+"log",JSON.stringify(LOG));
  toast(`Imported ${Object.keys(d.marks||{}).length} notes and your progress`);return true}
function backupHTML(){return `<div class="box"><h3>Move to another device</h3><p class="intro">Notes, highlights and progress are saved on this device. To move them, export here and import on the other device. Importing adds to what is already there.</p>
  <div class="row"><button class="btn" id="bk-copy">Copy backup</button><button class="btn" id="bk-dl">Download backup file</button></div>
  <label for="bk-in" class="lbl" style="display:block;margin-top:12px">Import: paste a backup, or choose the file</label><textarea id="bk-in" placeholder='Paste the backup here. It starts with {"app":"${CFG.app}"'></textarea>
  <div class="row"><button class="btn primary" id="bk-go">Import pasted backup</button><label class="btn" for="bk-file" style="cursor:pointer">Choose backup file</label><input type="file" id="bk-file" accept=".json,application/json,text/plain" hidden></div></div>`}
function wireBackup(after){
  const mk=()=>LS.set(PFX+"lastbk",String(Date.now()));
  $("bk-copy").onclick=()=>{copyText(backup());mk()};
  $("bk-dl").onclick=()=>{download(CFG.file+"-backup.json",backup(),"application/json");mk()};
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
  const dk=e.target.closest("[data-drill]");if(dk){dr={k:dk.dataset.drill};studyDrill();scrollTo(0,0);return}
  const ex=e.target.closest("[data-ex]");if(ex){exSel=ex.dataset.ex;studyExplore();scrollTo(0,0);return}
  const an=e.target.closest("[data-an]");if(an){anSel=an.dataset.an;studyExplore();return}
  const ma=e.target.closest("[data-mapact]");if(ma){mapAct=+ma.dataset.mapact;studyExplore();return}
  const az=e.target.closest("[data-az]");if(az){const el=document.querySelector(`[data-letter="${az.dataset.az}"]`);if(el)el.scrollIntoView({behavior:"smooth",block:"start"});return}
  const s=e.target.closest("[data-speech]");if(s){goSpeech(s.dataset.speech);return}
  const c=e.target.closest(".chips .chip");if(c){const f=c.parentNode.dataset.f,v=c.dataset.v;
    if(f==="who")qf.who=v;else if(f==="th")qf.th=v;else if(f==="theme")thSel=v;renderStudy()}});
$("sbody").addEventListener("change",e=>{const c=e.target.closest("[data-cmp]");if(c){cmp[+c.dataset.cmp]=+c.value;studyExplore();return}const s=e.target.closest("[data-qf]");if(s){qf[s.dataset.qf]=s.value;renderStudy()}});

/* ---------- sheets ---------- */
const sheet=$("sheet");let lastFocus=null;
function openSheet(t,html){if(sheet.hidden)lastFocus=document.activeElement;$("sheet-title").textContent=t;$("sheet-body").innerHTML=html;sheet.hidden=false;const b=sheet.querySelector(".sbox");b.scrollTop=0;b.focus({preventScroll:true})}
function closeSheet(){if(sheet.hidden)return;sheet.hidden=true;if(!wide())closePanel();if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
$("sheet-close").onclick=closeSheet;
sheet.addEventListener("click",e=>{if(e.target===sheet)return closeSheet();
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
function openSearch(q){openSheet("Search",`<label for="sq" class="sr">Search</label><input class="sinput" id="sq" type="search" placeholder="A word or phrase…" value="${esc(q||"")}" autocomplete="off"><div id="sres" style="margin-top:8px"></div>`);
  const sq=$("sq"),run=()=>{$("sres").innerHTML=searchResults(sq.value)};let t;sq.addEventListener("input",()=>{clearTimeout(t);t=setTimeout(run,200)});run();setTimeout(()=>sq.focus(),30)}
setInterval(()=>{if(/timed$/.test(S.theme))applySettings()},600000);
/* bookmarks: whole pages, this device (and in backups) */
let BM=[];try{BM=JSON.parse(LS.get(PFX+"bm")||"[]")}catch(e){}
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
    h+=`<div class="item" data-speech="${k}" tabindex="0"><small>${hl?`<i class="hlk ${hl}"></i> `:""}${esc(where(sp))}${(m.th||[]).length?" · "+m.th.map(x=>esc(QUOTES.themes[x][0])).join(", "):""}</small><span style="font-family:var(--f-old)">${esc(o.slice(0,140))}${o.length>140?"…":""}</span>${m.note?`<div class="mynote">${esc(m.note)}</div>`:""}</div>`});
  return h}
function openNotes(){
  const all=Object.keys(marks).filter(k=>speech[k]),whos=[...new Set(all.map(k=>speech[k].who))].sort();
  let h=`<p class="muted">${store?"Saved to your account.":"Saved on this device."} Tap one to go to it.</p>`;
  if(BM.length)h+=`<div class="eyebrow" style="margin:10px 0 0">Bookmarks</div>`+BM.map((b,i)=>`<div class="item" data-bm="${i}" tabindex="0"><small>${esc(sName(scenes[sIdx(b.s)]))} · <button class="link" data-bmdel="${i}">Remove</button></small><span style="font-family:var(--f-old)">${esc(b.txt||"")}</span></div>`).join("");
  const fv=FAV.filter(f=>speech[f.id]);if(fv.length)h+=`<div class="eyebrow" style="margin:14px 0 0">Favourite phrases</div>`+fv.map(f=>`<div class="item" data-fph="${esc(f.t)}" tabindex="0"><small>${esc(where(speech[f.id]))} · <button class="link" data-fpdel="${esc(f.t)}">Remove</button></small><span style="font-family:var(--f-old)">“${esc(f.txt)}”</span>${f.note?`<div class="mynote">${esc(f.note)}</div>`:""}</div>`).join("");
  if(!all.length)h+=`<p>No notes yet. While reading, press and hold a speech to highlight it, favourite a phrase, tag a theme or add a note. Use the bookmark button in the top bar to save a page.</p>`;
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
  $("nf-print").onclick=()=>printArea("My "+CFG.short+" notes",notesIds().map(k=>{const sp=speech[k],m=marks[k];return `<div class="pi"><small>${esc(where(sp))}${(m.th||[]).length?" · "+m.th.map(x=>esc(QUOTES.themes[x][0])).join(", "):""}</small><div>${sp.lines.map(l=>esc(l.replace(/^~/,""))).join("<br>")}</div>${m.note?`<i>${esc(m.note)}</i>`:""}</div>`}).join(""));
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
function openPicker(){
  let h=`<div class="jump"><label for="jl" class="sr">Go to line</label><input class="sinput" id="jl" inputmode="decimal" placeholder="Go to line, e.g. 3.3.165"><button class="btn" id="jl-go">Go</button></div>`;
  const rc=RECENT.filter(r=>speech[r.id]);if(rc.length)h+=`<div class="eyebrow" style="margin:6px 0 2px">Recently viewed</div>`+rc.map(r=>{const sp=speech[r.id],q=partsOf(sp)[r.pi]||partsOf(sp)[0];
    return `<div class="item" data-recent="${esc(r.id)}:${esc(r.pi)}" tabindex="0"><small>${esc(where(sp))}</small><span style="font-family:var(--f-old)">${esc(sp.lines[q[0]].replace(/^~/,""))}…</span></div>`}).join("");for(let a=1;a<=5;a++){h+=`<div class="eyebrow" style="margin:10px 0 6px">${LAT[a]}</div><div class="pick">`+
    scenes.filter(p=>p.act===a).map(p=>`<button class="scard${view==="reader"&&cur.k===sIdx(p.id)?" here":""}" data-go="${p.id}"><span class="st">${prog.done[p.id]?"✓":""}</span><b>Scene ${p.scene.toLowerCase()}</b><span>${esc(shortLoc(p))}</span></button>`).join("")+`</div>`}
  openSheet("Go to scene",h);$("jl-go").onclick=()=>jumpLine($("jl").value);$("jl").onkeydown=e=>{if(e.key==="Enter")jumpLine($("jl").value)}}
function openSettings(){
  const segs=(name,opts,val)=>`<div class="segs" data-set="${name}">`+opts.map(([v,l])=>`<button data-v="${v}" aria-pressed="${String(val)===String(v)}">${l}</button>`).join("")+`</div>`;
  const whoOpts=[...whoSet].sort((a,b)=>{const o=Object.keys(COLORS),ia=o.indexOf(a),ib=o.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b)});
  openSheet("Settings",`
    <div class="opt"><div class="lbl">On the page</div>${segs("mode",[["orig","Shakespeare only"],["both","Both"],["mod","Modern only"]],S.mode)}<small>With Shakespeare only, tap any line to see its modern English.</small></div>
    <div class="opt"><div class="lbl">Text size</div>${segs("scale",[["1.15","Small"],["1.3","Normal"],["1.5","Large"],["1.75","Extra large"]],S.scale)}</div>
    <div class="opt"><div class="lbl">Theme</div>${segs("theme",[["paper","Paper"],["papernight","Paper night"],["papertimed","Paper, night after 8pm"]],S.theme)}${segs("theme",[["auto","Auto"],["light","Light"],["dark","Dark"],["night","Night"],["timed","Night after 8pm"]],S.theme)}<small>Paper looks like an e-reader: a matte, warm page with crisp black text, and pages that change without sliding. Night is a warm, dim scheme for reading in bed. The "after 8pm" options switch to the night version until 7am.</small></div>
    <div class="opt"><div class="lbl">Line spacing</div>${segs("lh",[["1.4","Compact"],["1.55","Normal"],["1.8","Airy"]],S.lh)}</div>
    <div class="opt"><div class="lbl">Clean page</div>${segs("clean",[["false","Off"],["true","On"]],S.clean)}<small>Hides line numbers, tags and underlines for pure reading. Tapping still works.</small></div>
    <div class="opt"><div class="lbl">One-hand page turns</div>${segs("onehand",[["false","Off"],["true","On"]],S.onehand)}<small>Tap the bottom-left or bottom-right corner to turn pages.</small></div>
    <div class="opt"><label for="focsel" class="lbl">Dim everyone except</label><select id="focsel"><option value="">Nobody (show all normally)</option>${whoOpts.map(w=>`<option value="${esc(w)}"${S.focus===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select><small>Other speakers stay on the page but fade, so you can follow one voice.</small></div>
    <div class="opt"><div class="lbl">Scene summary on the first page</div>${segs("sum",[["true","Show"],["false","Hide"]],S.sum)}</div>
    <div class="opt"><label for="whosel" class="lbl">Follow one character</label><select id="whosel"><option value="">Everyone</option>${whoOpts.map(w=>`<option value="${esc(w)}"${S.who===w?" selected":""}>${esc(title(w))}</option>`).join("")}</select></div>
    <div class="opt"><div class="lbl">How to read</div><small style="margin:0">Swipe left or right to turn pages (arrow keys or the scroll wheel on a computer). Tap an underlined word for its meaning. Tap any other part of the lines for their modern English; long speeches are split into parts, and you can expand to the whole speech. Tap empty space to show or hide the menus. Press and hold a speech (right-click on a computer) for word meanings, notes and highlights. Pinch with two fingers to change the text size. Drag the page slider in the bottom menu to preview pages.</small></div>
    ${backupHTML()}
    <div class="opt"><div class="lbl">Progress</div><button class="btn" id="resetprog">Reset reading progress, quiz scores and flashcards</button><small id="resetmsg"></small></div>`);
  $("sheet-body").querySelectorAll("[data-set] button").forEach(b=>b.onclick=()=>{const k=b.parentNode.dataset.set;let v=b.dataset.v;
    if(k==="scale"||k==="lh")v=parseFloat(v);if(k==="sum"||k==="clean"||k==="onehand")v=v==="true";S[k]=v;applySettings();$("sheet-body").querySelectorAll(`[data-set="${k}"] button`).forEach(x=>x.setAttribute("aria-pressed",x===b));repaginate()});
  $("whosel").onchange=e=>{S.who=e.target.value;repaginate()};
  $("focsel").onchange=e=>{S.focus=e.target.value;applySettings();refreshMarks()};
  wireBackup(()=>{if(view==="home")renderHome();refreshMarks()});
  let armed=false;$("resetprog").onclick=()=>{if(!armed){armed=true;$("resetmsg").textContent="Tap again to confirm. Your notes are kept.";return}prog={done:{},quiz:{},cards:{},srs:{},miss:{q:[],c:{}},conf:{},exam:prog.exam};saveProg();$("resetmsg").textContent="Progress reset.";armed=false;if(view==="home")renderHome()};
}
$("b-home").onclick=goHome;$("b-where").onclick=openPicker;$("b-search").onclick=()=>openSearch("");$("b-study").onclick=()=>goStudy();$("b-set").onclick=openSettings;$("b-bm").onclick=toggleBM;

/* ---------- first-run hint ---------- */
function hint(){if(LS.get(PFX+"hint3")||view!=="reader")return;const d=document.createElement("div");d.className="hint";d.innerHTML=`<b>How to read</b><ul><li>Swipe left or right to turn the page.</li><li>Tap an underlined word for its meaning.</li><li>Tap any other part of the lines to see them in modern English. Long speeches come in parts; expand to read the whole speech.</li><li>Tap empty space to show the menus.</li><li>Press and hold a speech for word meanings and notes.</li></ul><button>Got it</button>`;
  $("reader").appendChild(d);d.addEventListener("pointerup",e=>e.stopPropagation());d.querySelector("button").onclick=()=>{d.remove();LS.set(PFX+"hint3","1")}}

/* ---------- start ---------- */
applySettings();
route();
initStore();
