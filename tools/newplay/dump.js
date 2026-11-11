// Print speeches <from>..<to> of <wip>/data0.json for writing modern English batches.
// Usage: node tools/newplay/dump.js <wip> <fromId> <toId>
// Speeches of 10+ lines print numbered lines and "PARTS n": translate them in ranges (see merge.js).
const path = require("path");
const W = path.resolve(process.argv[2]); const [a, b] = process.argv.slice(3).map(Number);
const D = require(W + "/data0.json");
for (const d of D) {
  if (d.id < a || d.id > b) continue;
  if (d.t === "scene") console.log(`=== ${d.act ? "Act " + d.act : "Induction"} ${d.scene}: ${d.loc}`);
  else if (d.t === "sd") console.log(`  [${d.text}]`);
  else { console.log(`#${d.id} ${d.who}${d.cont ? " (cont)" : ""}${d.lines.length >= 10 ? " PARTS " + d.lines.length : ""}`); d.lines.forEach((l, i) => console.log((d.lines.length >= 10 ? i + " " : "") + l)); }
}
