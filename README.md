# Shakespeare Folio 

One installable app (PWA) holding reading apps for Shakespeare plays: original text with modern English beside it, notes, study tools.

Live site: https://arti47.github.io/shakespeare/

- `index.html` — Folio shelf (progress per play, one backup for all plays). Installed app reopens at the last page read.
- `manifest.webmanifest`, `sw.js` — the single app manifest and service worker; caches every play for offline use.
- `othello/` — Othello.
- `antony-and-cleopatra/` — Antony and Cleopatra (prefix `ant-`).
- `king-lear/` — King Lear (prefix `lear-`).
- `twelfth-night/` — Twelfth Night (prefix `tn-`).
- `much-ado/` — Much Ado About Nothing (prefix `ado-`).
- `tempest/` — The Tempest (prefix `tem-`).

Conventions for play folders: per-play localStorage prefix (`oth-`); shared settings under `folio-`; play writes `folio-last` and `folio-stat-<id>`; play links `../manifest.webmanifest`, registers `../sw.js`, and has a `‹ Folio` link to `../?shelf`. Add the play to `PLAYS` in the Folio build script and rebuild `index.html`/`sw.js`.
