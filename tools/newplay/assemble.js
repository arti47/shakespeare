// Step 5. Merge, validate and write <repo>/<CFG.id>/play.js from the work folder.
// Usage: node tools/newplay/assemble.js <wip>        (then: node tools/build.js)
// Needs in <wip>: data0.json + m/*.txt (merge.js runs first), and four content modules (shapes: tools/newplay/README.md):
//   s1.js  module.exports={CFG, MAINS, COLORS, chars, scenes, gutenberg, PICS}
//   s2.js  module.exports={notes, gloss}
//   s3.js  module.exports={QUOTES}
//   s4.js  module.exports={EX, EXT, BEATS}
// PICS (stage pictures, keyed like EX.stage): each value is "<other-play-slug>:<pic key>" to reuse that play's
// SVG, or a raw SVG path string (40x40 viewBox, stroke only). s4.PICS may hold them instead of s1.
// Prints "validation errors: 0" when every id, phrase, quote and scene reference matches the text. Fix all before shipping.
const fs = require("fs"), path = require("path"), cp = require("child_process");
const W = path.resolve(process.argv[2]); const R = path.resolve(__dirname, "../..");
cp.execSync(`node "${__dirname}/merge.js" "${W}" out`, { stdio: "inherit" });
const DATA = JSON.parse(fs.readFileSync(W + "/data.json", "utf8")); const PARTS = JSON.parse(fs.readFileSync(W + "/parts.json", "utf8"));
const s1 = require(W + "/s1.js"), s2 = require(W + "/s2.js"), s3 = require(W + "/s3.js"), s4 = require(W + "/s4.js");
const STUDY = { chars: s1.chars, scenes: s1.scenes, notes: s2.notes, gloss: s2.gloss };
const { QUOTES } = s3, { EX, EXT } = s4, { CFG, MAINS, COLORS } = s1;
const picOf = (slug, k) => { const t = fs.readFileSync(R + "/" + slug + "/play.js", "utf8").split("\n").find(l => l.startsWith("const PICS=")); return t && JSON.parse(t.slice(11).replace(/;\s*$/, ""))[k]; };
const PICS = {}; for (const [k, v] of Object.entries(s1.PICS || s4.PICS || {})) { const m = /^([a-z0-9-]+):([a-z0-9]+)$/i.exec(v); PICS[k] = m ? picOf(m[1], m[2]) : v; }
const BEATS = Object.fromEntries(Object.entries(s4.BEATS || {}).map(([k, v]) => [k, v.map(([i, t]) => [+i, t])]));
// validation
const ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const sid = d => "a" + d.act + "s" + (ROM.indexOf(d.scene) + 1);
const by = {}; DATA.forEach(d => by[d.id] = d); const txt = id => by[id] && by[id].t === "sp" ? by[id].lines.join(" ") : null;
let E = 0; const bad = m => { console.log("✗", m); E++; };
for (const k in PICS) if (!PICS[k]) bad("pic " + k);
const scenes = DATA.filter(d => d.t === "scene").map(sid);
const sceneOf = id => { let s = null; for (const d of DATA) { if (d.t === "scene") s = sid(d); if (d.id == id) return s; } };
for (const k of ["id", "prefix", "app", "title", "short", "file"]) if (!CFG[k]) bad("CFG." + k);
for (const s of scenes) { if (!STUDY.scenes[s]) bad("scene summary " + s); if (!EX.predict[s] && s !== scenes[scenes.length - 1]) bad("predict " + s); if (!EX.place[s]) bad("place " + s); if (!BEATS[s]) bad("beats " + s); }
Object.values(EX.arc).forEach(a => { if (a.length !== scenes.length) bad("arc length " + a.length + " vs scenes " + scenes.length); });
QUOTES.quotes.forEach((q, i) => { const t = txt(q.id); if (!t || !t.includes(q.text)) bad("quote " + i + " not in speech " + q.id); (q.themes || []).forEach(th => { if (!QUOTES.themes[th]) bad("quote theme " + th); }); });
const nq = QUOTES.quotes.length; for (let i = 0; i < nq; i++) if (!EX.why[i]) bad("why " + i);
const qi = a => (a || []).forEach(i => { if (i >= nq) bad("quote index " + i); });
EX.motifs.forEach(m => qi(m[2])); EX.bigq.forEach(m => qi(m[2])); EX.examq.forEach(m => qi(m[1])); EX.models.forEach(m => qi([m[0]]));
EX.timeline.forEach(t => { if (!txt(t.id)) bad("timeline id " + t.id); else if (sceneOf(t.id) !== t.s) bad("timeline scene " + t.id + " " + t.s + " vs " + sceneOf(t.id)); });
for (const [s, bs] of Object.entries(BEATS)) bs.forEach(([id]) => { if (!txt(id)) bad("beat id " + id); else if (sceneOf(id) !== s) bad("beat scene " + id); });
for (const [id, arr] of Object.entries(EX.dev)) arr.forEach(([k, n, ph]) => { if (!EX.devices[k]) bad("dev key " + k); const t = txt(id); if (!t || !t.includes(ph)) bad("dev phrase " + id + " " + ph); });
for (const id of Object.keys(EX.irony)) if (!txt(id)) bad("irony " + id);
for (const id of Object.keys(STUDY.notes)) if (!by[id]) bad("note id " + id);
EX.insults.forEach(x => { const t = txt(x.id); if (!t || !t.includes(x.f)) bad("insult " + x.id + " " + x.f); });
EX.pronouns.forEach(x => { const t = txt(x.id); if (!t || !t.includes(x.f)) bad("pronoun " + x.id + " " + x.f); });
EX.dir.forEach(x => { const t = txt(x[0]); if (!t || !t.includes(x[1])) bad("director " + x[0]); });
["un", "pun", "st"].forEach(k => EX.lang[k].forEach(x => { const t = txt(x[0]); if (!t || !t.includes(x[1])) bad("lang " + k + " " + x[0] + " " + x[1]); }));
EX.lang.pun.forEach(x => { if (!x[1].includes(x[2])) bad("pun word " + x[2]); });
EX.lang.st.forEach(x => x[2].forEach(([w]) => { if (!x[1].includes(w)) bad("stress word " + w); }));
EX.contrast.forEach(c => c.ids.forEach(id => { if (!txt(id)) bad("contrast " + id); }));
Object.keys(EX.solo).forEach(id => { if (!txt(id)) bad("solo " + id); });
EX.iago.forEach(([s]) => { if (!scenes.includes(s)) bad("tracker scene " + s); });
Object.values(EX.rel).flat().forEach(([a, b]) => { if (!COLORS[a] || !COLORS[b]) bad("map pair " + a + "/" + b); });
Object.keys(EX.analysis).forEach(k => { if (!COLORS[k]) bad("analysis " + k); });
Object.keys(EX.critics).forEach(k => { if (!QUOTES.themes[k]) bad("critic theme " + k); });
DATA.filter(d => d.t === "scene").forEach(p => { const l = p.loc.toLowerCase(); const r = EX.stagerules.find(([re]) => new RegExp(re).test(l)); const k = r ? r[1] : "street"; if (!PICS[k] || !EX.stage[k]) bad("stage picture for " + p.loc + " -> " + k); });
new Set(DATA.filter(d => d.t === "sp").map(d => d.who)).forEach(w => { if (!COLORS[w]) bad("COLORS missing " + w); });
MAINS.forEach(w => { if (!COLORS[w]) bad("MAINS not in COLORS " + w); });
Object.values(STUDY.scenes).forEach(s => s.quiz.forEach(q => { if (q.o.length !== 4 || q.a < 0 || q.a > 3) bad("quiz shape"); }));
console.log("validation errors:", E);
const J = JSON.stringify;
const out = `// ${CFG.title}: config and content for the shared Folio reader (../reader.js). Source of truth: edit here, then run node tools/build.js.
// Text: Project Gutenberg eBook #${s1.gutenberg || "?"} (public domain). Modern English and Study content written fresh from the text.
const CFG=${JSON.stringify(CFG, null, 1)};
const DATA=${J(DATA)};
const STUDY=${J(STUDY)};
const PARTS=${J(PARTS)};
const QUOTES=${J(QUOTES)};
const EX=${J(EX)};
const EXT=${J(EXT)};
const MAINS=${J(MAINS)};
const COLORS=${J(COLORS)};
const PICS=${J(PICS)};
/* story beats: scene id → [[speech id, one-line beat], …] (written fresh from the text) */
const BEATS=${J(BEATS)};
`;
const dir = process.env.OUT || R + "/" + CFG.id; fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dir + "/play.js", out); console.log("wrote", path.relative(R, dir + "/play.js"), out.length, "bytes");
if (E) process.exitCode = 1;
