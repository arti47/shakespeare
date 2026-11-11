// Step 1. Gutenberg text -> <wip>/data0.json (speeches with ids, scenes, stage directions).
// Usage: node tools/newplay/parse.js <wip>
//   Reads <wip>/pg.txt (raw Gutenberg .txt) or, if present, <wip>/body.txt (already trimmed to start at "ACT I").
//   Optional <wip>/parse.config.js: module.exports={ sdStart: RegExp, song: RegExp, songWho: "BOY", induction: true, post(out){…} }
//     sdStart  unbracketed stage-direction openers (default below). Add play-specific ones ("Aaron alone", "Here a cry").
//     song     line that opens a song block (default /^SONG\.?$/), songWho its singer (else "?" is flagged); following lines until a blank line get a leading "~".
//     induction  treat "INDUCTION" / "SCENE I." before ACT I as act 0 (The Taming of the Shrew).
//     post(out)  fix-ups on the item list, e.g. replace Gutenberg's "The same." locations with standard editorial ones.
// Check the printout: "who ?" must be 0, "empty" []; every speaker in the tally must be a real character.
const fs = require("fs"), path = require("path");
const W = path.resolve(process.argv[2] || ".");
const C = fs.existsSync(W + "/parse.config.js") ? require(W + "/parse.config.js") : {};
let src;
if (fs.existsSync(W + "/body.txt")) src = fs.readFileSync(W + "/body.txt", "utf8").split(/\r?\n/);
else {
  const pg = fs.readFileSync(W + "/pg.txt", "utf8").split(/\r?\n/);
  const end = pg.findIndex(l => /^\*\*\* END OF THE PROJECT GUTENBERG/.test(l));
  const firstScene = pg.findIndex(l => (C.induction ? /^(INDUCTION|SCENE I\.)/ : /^SCENE I\./).test(l));
  let start = firstScene; while (start > 0 && !/^(ACT I|INDUCTION)$/.test(pg[start])) start--;
  if (firstScene < 0) throw new Error("no 'SCENE I.' line found; trim to body.txt by hand");
  src = pg.slice(start < 0 ? firstScene : start, end < 0 ? pg.length : end);
  fs.writeFileSync(W + "/body.txt", src.join("\n"));
}
const ROM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const SDSTART = C.sdStart || /^(Enter|Re-enter|Flourish|Sound|Alarum|Alarums|Trumpets|Drums|Music|Thunder|Exeunt|Exit)\b/;
const fix = s => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/_/g, "")
  .replace(/\[\s*([^\]]*?)\s*\.?\s*\]\.?/g, (m, a) => "[" + a.replace(/\.$/, "").trim() + "]").replace(/\s{2,}/g, " ").trim();
const D = []; let id = 0, act = null, cur = null, prevBlank = true, inSong = false;
const sd = t => { t = fix(t).replace(/^\[|\]$/g, "").trim(); if (!/[.!?]$/.test(t)) t += "."; D.push({ t: "sd", text: t, id: id++ }); };
function addLine(t) { if (!cur || cur.closed) { const who = cur ? cur.who : "?"; cur = { t: "sp", who, cont: 1, lines: [], id: id++ }; D.push(cur); } cur.lines.push(t); }
for (let i = 0; i < src.length; i++) {
  const L = src[i].replace(/’/g, "'"); let m; const T = L.trim();
  if (C.induction && /^INDUCTION\.?$/.test(T)) { act = 0; cur = null; continue; }
  if (m = T.match(/^ACT ([IVX]+)\.?$/)) { act = ROM.indexOf(m[1]) + 1; cur = null; continue; }
  if (m = T.match(/^SCENE ([IVX]+)\.\s*(.*)$/)) {
    let loc = m[2]; while (src[i + 1] && src[i + 1].trim() && !/^[A-Z][A-Z' ,]+\.$/.test(src[i + 1].trim())) loc += " " + src[++i].trim();
    D.push({ t: "scene", act, scene: m[1], loc: fix(loc).replace(/\.$/, "") + ".", id: id++ }); cur = null; prevBlank = true; continue;
  }
  if (act === null) continue;
  if (T === "") { prevBlank = true; if (inSong && cur) cur.closed = true; inSong = false; continue; }
  const pb = prevBlank; prevBlank = false;
  if ((C.song || /^SONG\.?$/).test(T)) { cur = { t: "sp", who: C.songWho || "?", lines: [], id: id++ }; D.push(cur); inSong = true; continue; }
  if (inSong) { cur.lines.push("~" + fix(T)); continue; }
  if (pb && (m = T.match(/^([A-Z][A-Z' ,]+?(?: and [A-Z][A-Z' ]+)?)\.?$/)) && !/^(ACT|SCENE)\b/.test(T)) { cur = { t: "sp", who: m[1].toUpperCase().replace(/, /g, " AND "), lines: [], id: id++ }; D.push(cur); continue; }
  if (/^\[[^\]]*\]$/.test(T)) { sd(T); if (cur) cur.closed = true; continue; }
  if (/^\[[^\]]*$/.test(T)) { let t = T; while (!/\]/.test(t) && i + 1 < src.length) t += " " + src[++i].trim(); sd(t); if (cur) cur.closed = true; continue; }
  if (pb && SDSTART.test(T)) { let t = T; while (src[i + 1] && src[i + 1].trim()) t += " " + src[++i].trim(); sd(t); if (cur) cur.closed = true; continue; }
  addLine(fix(T));
}
let out = D.map(d => d.t !== "sp" ? d : Object.assign({ t: "sp", who: d.who }, d.cont ? { cont: 1 } : {}, { lines: d.lines, id: d.id }));
if (C.post) out = C.post(out) || out;
fs.writeFileSync(W + "/data0.json", JSON.stringify(out));
const sp = out.filter(d => d.t == "sp");
console.log("items", out.length, "speeches", sp.length, "lines", sp.reduce((a, d) => a + d.lines.length, 0), "scenes", out.filter(d => d.t == "scene").length, "sd", out.filter(d => d.t == "sd").length);
console.log("who ?", sp.filter(d => d.who === "?").length, "empty", sp.filter(d => !d.lines.length).map(d => d.id), "long (>=10 lines, need PARTS)", sp.filter(d => d.lines.length >= 10).length, "cont", sp.filter(d => d.cont).length);
const w = {}; sp.forEach(d => w[d.who] = (w[d.who] || 0) + 1); console.log(w);
out.filter(d => d.t == "scene").forEach(d => console.log(d.act, d.scene, d.loc, d.id));
