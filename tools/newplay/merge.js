// Step 3. Merge modern English batches <wip>/m/*.txt into the parsed text.
// Usage: node tools/newplay/merge.js <wip>        validate only
//        node tools/newplay/merge.js <wip> out    also write <wip>/data.json (DATA with .m) and <wip>/parts.json (PARTS)
// Batch format (one file per ~60-80 speeches, e.g. m/01.txt, m/02.txt …):
//   #<speech id>
//   <one-line modern English>                 for speeches under 10 lines
//   #<speech id>
//   0-4 <modern English for lines 0..4>       for speeches of 10+ lines: contiguous ranges covering every line,
//   5-9 <…>                                   0-based, inclusive; these become PARTS (reader aligns them to lines)
// Must end with "errors 0 missing 0". Every speech needs a translation; songs ("~" lines) too.
const fs = require("fs"), path = require("path");
const W = path.resolve(process.argv[2]);
const D = JSON.parse(fs.readFileSync(W + "/data0.json", "utf8")); const byId = {}; D.forEach(d => byId[d.id] = d);
const M = {}, P = {}; let errs = 0;
for (const f of fs.readdirSync(W + "/m").sort()) {
  if (!f.endsWith(".txt")) continue;
  let cur = null;
  for (const L of fs.readFileSync(W + "/m/" + f, "utf8").split(/\r?\n/)) {
    if (!L.trim()) continue; let m;
    if (m = L.match(/^#(\d+)\s*$/)) { cur = +m[1]; if (M[cur] || P[cur]) { console.log("DUP", cur, f); errs++; } continue; }
    if (m = L.match(/^(\d+)-(\d+) (.*)$/)) { (P[cur] = P[cur] || []).push([+m[1], +m[2], m[3].trim()]); continue; }
    if (M[cur]) { console.log("multi-line plain", cur, f); errs++; }
    M[cur] = L.trim();
  }
}
const missing = [];
for (const d of D.filter(d => d.t == "sp")) {
  const id = d.id;
  if (!M[id] && !P[id]) { missing.push(id); continue; }
  if (P[id]) {
    const ps = P[id]; let exp = 0;
    for (const [a, b] of ps) { if (a !== exp || b < a) { console.log("BAD RANGE", id, ps.map(p => p[0] + "-" + p[1]).join(",")); errs++; break; } exp = b + 1; }
    if (exp !== d.lines.length) { console.log("RANGE END", id, exp, d.lines.length); errs++; }
    if (M[id]) { console.log("both plain and ranges", id); errs++; }
  } else if (d.lines.length >= 10) { console.log("LONG needs parts", id, d.lines.length); errs++; }
}
for (const k of Object.keys(M).concat(Object.keys(P))) if (!byId[k] || byId[k].t !== "sp") { console.log("unknown id", k); errs++; }
console.log("errors", errs, "missing", missing.length, missing.length ? missing.slice(0, 8).join(",") + "…" : "");
if (process.argv[3] === "out") {
  if (errs) { console.log("not written: fix errors first"); process.exit(1); }
  const out = D.map(d => d.t !== "sp" ? d : Object.assign({}, d, { m: P[d.id] ? P[d.id].map(p => p[2]).join(" ") : M[d.id] }));
  fs.writeFileSync(W + "/data.json", JSON.stringify(out)); fs.writeFileSync(W + "/parts.json", JSON.stringify(P)); console.log("written data.json, parts.json");
}
module.exports = { M, P };
