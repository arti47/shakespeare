#!/usr/bin/env node
/* Evidence speeches for Study items that do not quote one line themselves (4.8).
   node tools/newplay/evidence.js [slug ...]   (no slug = every play)
   Writes EX.ev into <slug>/play.js:
     ev.ctx[i]        = speech ids for EX.context[i]
     ev.cr[theme][i]  = speech ids for EX.critics[theme][i]
   Picks, in order: speeches whose text contains a phrase the item quotes ('…' or "…", 3+ words); then the key quotes
   that share the most rare words with the item (their line, note, theme names and modern English; for critics,
   key quotes of the critic's theme weigh more; other speeches only as a fallback), at most one per scene, 3 per item. Ids already in ev
   that still exist are kept when --keep is given, so hand corrections survive a rerun. A draft only: check every pick
   against the text and correct it by hand (the 4.8 picks for all 36 plays were). */
const fs=require("fs"),path=require("path"),vm=require("vm");
const ROOT=path.join(__dirname,"..","..");
const args=process.argv.slice(2),KEEP=args.includes("--keep");
let slugs=args.filter(a=>!a.startsWith("--"));
if(!slugs.length)slugs=fs.readdirSync(ROOT).filter(d=>fs.existsSync(path.join(ROOT,d,"play.js")));
const STOP=new Set(("a an and are as at be been but by can could did do does doing done for from had has have he her hers him his how i if in into is it its just like may me might more most much must my no nor not now of off on once one only or other our out over own same shall she should so some such than that the their them then there these they this those though through to too under up upon very was we were what when where which while who whom why will with would yet you your thee thou thy thine hath doth art o oh let make made makes get gets go goes come comes say says said see sees well good man men one two also even ever every own upon whose shows show play plays scene act shakespeare audience audiences character characters way things thing being often many ").split(" "));
const norm=s=>s.toLowerCase().replace(/[’']/g,"'").replace(/[^a-z' ]+/g," ").replace(/\s+/g," ").trim();
const stem=w=>w.replace(/'s$/,"").replace(/(ies)$/,"y").replace(/(ing|ed|es|s)$/,"").replace(/'/g,"");
const toks=s=>norm(s).split(" ").filter(w=>w.length>2&&!STOP.has(w)).map(stem).filter(w=>w.length>2&&!STOP.has(w));
function load(slug){const src=fs.readFileSync(path.join(ROOT,slug,"play.js"),"utf8");const c={};vm.createContext(c);vm.runInContext(src.replace(/^const /gm,"var "),c);return {src,c}}
function run(slug){
  const {src,c}=load(slug),EX=c.EX,Q=c.QUOTES.quotes;
  const sps=c.DATA.filter(x=>x.t==="sp");let sc=null;const scOf={};
  for(const x of c.DATA){if(x.t==="scene")sc=x.id;else if(x.t==="sp")scOf[x.id]=sc}
  const df={},doc={};
  for(const sp of sps){const t=toks(sp.lines.join(" ")+" "+(sp.m||""));doc[sp.id]=t;new Set(t).forEach(w=>df[w]=(df[w]||0)+1)}
  const N=sps.length,idf=w=>Math.log((N+1)/((df[w]||0)+1));
  const kq={},kth={};Q.forEach(q=>{kq[q.id]=1;(kth[q.id]=kth[q.id]||new Set());q.themes.forEach(t=>kth[q.id].add(t))});
  const flat=sps.map(sp=>[sp.id,norm(sp.lines.join(" ").replace(/~/g,""))]);
  const quoted=text=>{const out=[];const re=/['"‘“]([^'"’”]{8,}?)['"’”]/g;let m;while((m=re.exec(text))){const f=norm(m[1]);if(f.split(" ").length<3)continue;const hit=flat.find(([,t])=>t.includes(f));if(hit)out.push(String(hit[0]))}return out};
  /* candidates: the key quotes (their line, note, theme names and the speech's modern English); other speeches only
     when no key quote shares a rare word with the item */
  const QD=Q.map(q=>({id:String(q.id),th:q.themes,d:new Set(toks(q.text+" "+q.note+" "+q.themes.map(t=>(c.QUOTES.themes[t]||[t])[0]).join(" ")+" "+(sps.find(x=>String(x.id)===String(q.id))||{}).m))}));
  function pick(text,n,theme){
    const got=[],used=new Set();const add=id=>{id=String(id);if(got.includes(id)||got.length>=n)return;got.push(id);used.add(scOf[id])};
    quoted(text).forEach(add);
    const qs=new Set(toks(text));if(!qs.size)return got;
    const sc=(d,bonus)=>{let s=0;qs.forEach(w=>{if(d.has(w))s+=idf(w)});return s/Math.sqrt(Math.max(10,d.size))*bonus};
    let scored=QD.map(q=>[q.id,sc(q.d,theme&&q.th.includes(theme)?1.8:1)]).filter(x=>x[1]>0.35);
    if(scored.length<n)scored=scored.concat(sps.filter(sp=>doc[sp.id].length>=6).map(sp=>[String(sp.id),sc(new Set(doc[sp.id]),.6)]).filter(x=>x[1]>0.5));
    scored.sort((a,b)=>b[1]-a[1]);
    for(const [id] of scored){if(got.length>=n)break;if(used.has(scOf[id]))continue;add(id)}
    return got}
  const old=EX.ev||{},keep=(o,i)=>KEEP&&o&&o[i]&&o[i].length?o[i].filter(id=>doc[id]):null;
  const ev={ctx:EX.context.map(([a,b],i)=>keep(old.ctx,i)||pick(a+". "+b,3)),
    cr:Object.fromEntries(Object.entries(EX.critics).map(([th,v])=>[th,v.map(([w,x],i)=>keep((old.cr||{})[th],i)||pick(x.replace(/^Paraphrased:\s*/,""),3,th))]))};
  EX.ev=ev;
  const lines=src.split("\n"),k=lines.findIndex(l=>l.startsWith("const EX="));
  lines[k]="const EX="+JSON.stringify(EX)+";";
  fs.writeFileSync(path.join(ROOT,slug,"play.js"),lines.join("\n"));
  const n=ev.ctx.flat().length+Object.values(ev.cr).flat(2).length,empty=ev.ctx.filter(x=>!x.length).length+Object.values(ev.cr).flat().filter(x=>!x.length).length;
  console.log(slug.padEnd(22),"links",n,"empty",empty)}
slugs.forEach(run);
