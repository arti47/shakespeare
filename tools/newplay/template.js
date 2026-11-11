// Split an existing play.js into a work folder (data0.json, m/*.txt, s1-s4.js), as a worked example or to edit a shipped play
// with the same pipeline. Usage: node tools/newplay/template.js <slug> <wip>
// Then: node tools/newplay/assemble.js <wip>  (OUT=/tmp/x to write elsewhere) reproduces <slug>/play.js.
const fs = require("fs"), path = require("path");
const R = path.resolve(__dirname, "../.."); const [slug, wipArg] = process.argv.slice(2); const W = path.resolve(wipArg);
const src = fs.readFileSync(R + "/" + slug + "/play.js", "utf8"); const g = {};
for (const l of src.split("\n")) { const m = /^const (\w+)=([\s\S]*?);?\s*$/.exec(l); if (m && m[1] !== "CFG") g[m[1]] = JSON.parse(m[2]); }
g.CFG = JSON.parse(/const CFG=(\{[\s\S]*?\n\});/.exec(src)[1]);
const gut = (/Gutenberg eBook #(\d+)/.exec(src) || [])[1];
fs.mkdirSync(W + "/m", { recursive: true });
const D0 = g.DATA.map(d => { if (d.t !== "sp") return d; const o = Object.assign({}, d); delete o.m; return o; });
fs.writeFileSync(W + "/data0.json", JSON.stringify(D0));
const sp = g.DATA.filter(d => d.t === "sp"); const P = g.PARTS || {};
for (let i = 0, n = 1; i < sp.length; i += 80, n++) {
  const txt = sp.slice(i, i + 80).map(d => "#" + d.id + "\n" + (P[d.id] ? P[d.id].map(([a, b, t]) => a + "-" + b + " " + t).join("\n") : d.m)).join("\n");
  fs.writeFileSync(W + "/m/" + String(n).padStart(2, "0") + ".txt", txt + "\n");
}
const J = v => JSON.stringify(v, null, 1);
fs.writeFileSync(W + "/s1.js", `// CFG, MAINS, COLORS, characters, scene summaries + quizzes, Gutenberg number, stage pictures\nmodule.exports={\nCFG:${J(g.CFG)},\nMAINS:${J(g.MAINS)},\nCOLORS:${J(g.COLORS)},\nchars:${J(g.STUDY.chars)},\nscenes:${J(g.STUDY.scenes)},\ngutenberg:${J(gut)},\nPICS:${J(g.PICS)}\n};\n`);
fs.writeFileSync(W + "/s2.js", `// notes (speech id → note) and glossary\nmodule.exports={\nnotes:${J(g.STUDY.notes)},\ngloss:${J(g.STUDY.gloss)}\n};\n`);
fs.writeFileSync(W + "/s3.js", `// key quotes by theme\nmodule.exports={QUOTES:${J(g.QUOTES)}};\n`);
fs.writeFileSync(W + "/s4.js", `// Study extras (EX), Study tab list (EXT) and story beats\nmodule.exports={\nEX:${J(g.EX)},\nEXT:${J(g.EXT)},\nBEATS:${J(g.BEATS || {})}\n};\n`);
console.log("wrote", W, "speeches", sp.length);
