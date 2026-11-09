#!/usr/bin/env node
/* Folio build: regenerates every derived file from the sources.
   Sources:  <id>/play.js (CFG + content), reader.js (shared reader code), tools/play.html (page shell), index.html (shelf, PLAYS)
   Outputs:  <id>/index.html  play page: tools/play.html filled from CFG
     search/<id>.json  speech index, derived from each play's DATA
     sw.js             service worker: precache list + cache name from a content hash
     version.json      the same build hash
   Usage: node tools/build.js          write outputs
          node tools/build.js --check  exit 1 if any output is stale (for CI)
   Adding a play: add it to PLAYS in index.html, then run this script. No dependencies. */
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const stale = [];
function out(f, s) {
  const p = path.join(ROOT, f), cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  if (cur === s) return;
  stale.push(f);
  if (!CHECK) fs.writeFileSync(p, s);
}

/* Read a JSON literal assigned as `const NAME=` in an HTML page. */
function constJSON(html, name, file) {
  const k = html.indexOf("const " + name + "=");
  if (k < 0) throw new Error(`${file}: const ${name} not found`);
  let i = k + name.length + 7, d = 0, str = false;
  const s = i;
  for (; i < html.length; i++) {
    const c = html[i];
    if (str) { if (c === "\\") i++; else if (c === '"') str = false; continue; }
    if (c === '"') str = true;
    else if (c === "[" || c === "{") d++;
    else if (c === "]" || c === "}") { if (--d === 0) return JSON.parse(html.slice(s, i + 1)); }
  }
  throw new Error(`${file}: unterminated const ${name}`);
}

const index = rd("index.html");
const PLAYS = constJSON(index, "PLAYS", "index.html");
/* The launch redirect in <head> keeps its own id list (it runs before PLAYS exists): it must match. */
{ const m = index.match(/ok=(\[[^\]]*\])\.indexOf\(last\)/);
  if (!m) throw new Error("index.html: launch redirect ok=[...] not found");
  const ok = JSON.parse(m[1]), ids = PLAYS.map(p => p.id);
  if (ok.join() !== ids.join()) throw new Error(`index.html: launch redirect ok=${JSON.stringify(ok)} != PLAYS ids ${JSON.stringify(ids)}`); }

/* 1. Play pages. */
const SHELL = rd("tools/play.html");
for (const p of PLAYS) {
  const f = p.id + "/play.js", js = rd(f), CFG = constJSON(js, "CFG", f), EX = constJSON(js, "EX", f);
  if (CFG.id !== p.id) throw new Error(`${f}: CFG.id ${CFG.id} != ${p.id}`);
  const tp = (CFG.pre ? `    <div class="pre">${CFG.pre}</div>\n` : "") + `    <h1>${CFG.h1}</h1>\n    <div class="post">${CFG.post}</div>\n`;
  const v = { TITLE: CFG.title, CSS: CFG.css || "", TP: tp, EG: CFG.searchEg, N: String(EX.timeline.length) };
  out(p.id + "/index.html", SHELL.replace(/@(TITLE|CSS|TP|EG|N)@/g, (m, k) => v[k]));
}

/* 2. Search index: [id, speaker, "act.scene", original lines " / "-joined, modern]. */
const roman = r => { const v = { I: 1, V: 5, X: 10 }; let n = 0; for (let i = 0; i < r.length; i++) { const a = v[r[i]], b = v[r[i + 1]] || 0; n += a < b ? -a : a; } return n; };
const titleCase = s => s.toLowerCase().replace(/(^|[\s-])([a-z])/g, (m, a, c) => a + c.toUpperCase());
for (const p of PLAYS) {
  const f = p.id + "/play.js", DATA = constJSON(rd(f), "DATA", f);
  let sc = "";
  const rows = [];
  for (const b of DATA) {
    if (b.t === "scene") sc = b.act + "." + String(b.scene).toLowerCase();
    else if (b.t === "sp") rows.push([b.id, titleCase(b.who), sc, b.lines.map(l => l.replace(/^~/, "")).join(" / "), b.m]);
  }
  out("search/" + p.id + ".json", JSON.stringify(rows));
  /* Story beats: every scene has beats, each anchored to a speech in that scene, in order. */
  const BEATS = constJSON(rd(f), "BEATS", f), inScene = {};
  let cur = null;
  for (const b of DATA) {
    if (b.t === "scene") { cur = "a" + b.act + "s" + roman(b.scene); inScene[cur] = new Set(); }
    else if (b.t === "sp" && cur) inScene[cur].add(b.id);
  }
  for (const s in inScene) if (!BEATS[s] || !BEATS[s].length) throw new Error(`${f}: BEATS missing scene ${s}`);
  for (const s in BEATS) {
    if (!inScene[s]) throw new Error(`${f}: BEATS has unknown scene ${s}`);
    let last = -1;
    for (const [id, t] of BEATS[s]) {
      if (!inScene[s].has(id) || id <= last || typeof t !== "string" || !t) throw new Error(`${f}: bad beat ${s} ${id}`);
      last = id;
    }
  }
}

/* 3. Precache list. */
const fonts = fs.readdirSync(path.join(ROOT, "fonts")).filter(f => f.endsWith(".woff2")).sort().map(f => "fonts/" + f);
const F = ["./", "index.html", "fonts.css", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable.png", "apple-touch-icon.png",
  ...fonts, ...PLAYS.map(p => "search/" + p.id + ".json"), "reader.css", "reader.js",
  ...PLAYS.flatMap(p => [p.id + "/index.html", p.id + "/", p.id + "/play.js"]), "update.js"];
for (const f of F) if (!f.endsWith("/") && !fs.existsSync(path.join(ROOT, f)) && !stale.includes(f)) throw new Error("missing " + f);

/* 4. Build hash over everything precached (search files as just generated). */
const h = crypto.createHash("sha256");
for (const f of F) {
  if (f.endsWith("/")) continue;
  h.update(f + "\0");
  h.update(fs.readFileSync(path.join(ROOT, f)));
}
const B = h.digest("hex").slice(0, 8);

const sw = `// build ${B} (generated by tools/build.js; changes whenever a cached file changes, so installed apps update)
const C="folio-${B}",F=${JSON.stringify(F).replace(/","/g, '", "')};
const FRESH=u=>/(\\/|\\.html|\\.json|\\.js|\\.webmanifest|reader\\.css)$/.test(u.pathname);
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F.map(f=>new Request(f,{cache:"reload"})))))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("message",e=>{if(e.data==="skip")self.skipWaiting()});
self.addEventListener("fetch",e=>{const q=e.request;if(q.method!=="GET")return;const u=new URL(q.url);if(u.origin!==location.origin)return;
  const put=res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(q,cp))}return res};
  if(q.mode==="navigate"||FRESH(u)){
    e.respondWith(fetch(u.href,{cache:"no-cache",credentials:"same-origin"}).then(put).catch(()=>caches.match(q,{ignoreSearch:true}).then(r=>r||caches.match(u.pathname.endsWith("/")?u.pathname+"index.html":u.pathname,{ignoreSearch:true})).then(r=>r||caches.match("index.html"))));return}
  e.respondWith(caches.match(q,{ignoreSearch:true}).then(r=>r||fetch(q).then(put)))});
`;
out("sw.js", sw);
out("version.json", JSON.stringify({ build: B }));

if (CHECK && stale.length) { console.error("stale: " + stale.join(", ") + "\nrun: node tools/build.js"); process.exit(1); }
console.log((stale.length ? (CHECK ? "" : "wrote ") + stale.join(", ") : "up to date") + " · build " + B);
