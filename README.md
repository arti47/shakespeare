# Shakespeare Folio 

One installable app (PWA) holding reading apps for Shakespeare plays: original text with modern English beside it, notes, study tools.

Live site: https://arti47.github.io/shakespeare/

- `index.html` — Folio shelf (progress per play, one backup for all plays). Installed app reopens at the last page read.
- `manifest.webmanifest`, `sw.js` — the single app manifest and service worker; caches every play for offline use.
- `reader.js` — the shared reader used by every play.
- `othello/` — Othello.
- `antony-and-cleopatra/` — Antony and Cleopatra (prefix `ant-`).
- `king-lear/` — King Lear (prefix `lear-`).
- `twelfth-night/` — Twelfth Night (prefix `tn-`).
- `much-ado/` — Much Ado About Nothing (prefix `ado-`).
- `tempest/` — The Tempest (prefix `tem-`).
- `richard-ii/` — King Richard II (prefix `rii-`).
- `midsummer/` — A Midsummer Night's Dream (prefix `mnd-`).
- `hamlet/` — Hamlet (prefix `ham-`).

Layout of a play folder `<id>/`:
- `play.js`: the play's source. It holds `CFG` (id, localStorage prefix, titles, backup id, per-play wording) and the content (`DATA`, `STUDY`, `PARTS`, `QUOTES`, `EX`, `EXT`, `MAINS`, `COLORS`, `PICS`). Edit content here.
- `index.html`: generated from `tools/play.html`. It loads `play.js`, then the shared `../reader.js`.

Navigation (2.0): one bottom nav, Library / Read / Study / You, on the shelf and in every play. Shared by every play: `reader.js` (all reader and study code), `reader.css`, `update.js`. Each play has its own localStorage prefix (`oth-`); shared settings live under `folio-`; the reader writes `folio-last` and `folio-stat-<id>`.

Adding a play: create `<id>/play.js` (copy one and replace the content), add the play to `PLAYS` in `index.html`, then run `node tools/build.js`.

## Build

`node tools/build.js` regenerates `<id>/index.html` (from `tools/play.html` and `CFG`), `search/<id>.json` (from `DATA`), `sw.js` (precache list and cache name) and `version.json`. The build hash is a content hash of every cached file, so it only changes when something does. Run it after any edit; CI runs `node tools/build.js --check` and fails if outputs are stale. Local preview: `python3 -m http.server` in the repo root.
