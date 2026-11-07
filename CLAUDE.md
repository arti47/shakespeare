# CLAUDE.md — Shakespeare Folio

Rules for every Claude session working on `arti47/shakespeare`. Read fully before changing anything.

## What this is

Static PWA on GitHub Pages: https://arti47.github.io/shakespeare/ (served from `main`, root, `.nojekyll`).
No framework, no npm deps. Node 20 only for `tools/build.js`.

## Layout

| Path | Role | Edit? |
|---|---|---|
| `index.html` | Folio shelf. `const PLAYS=[...]` is the play registry (id, prefix, log, group, title…). | Hand-edit |
| `<slug>/index.html` | One play: reader JS + all data inlined as JS consts (`DATA`, `ALIGN`, `PARTS`, `EX`, `STUDY`, `QUOTES`…). Self-contained. | Hand-edit |
| `<slug>/sw.js` | Legacy stub: unregisters old per-play SWs. Do not extend. | No |
| `reader.css` | Shared reader styles for all plays. | Hand-edit |
| `fonts.css`, `fonts/*.woff2` | Self-hosted fonts. | Rarely |
| `update.js` | Registers root `sw.js`, update checks, "Folio updated" toast. | Hand-edit |
| `manifest.webmanifest`, icons | Single app manifest, scope `./`. | Rarely |
| `tools/build.js` | Generates derived files (below). | Hand-edit |
| `sw.js` | **Generated.** Service worker, cache `folio-<build>`. | Never by hand |
| `version.json` | **Generated** `build` hash (+ `version`, see Versioning). | `build`: never by hand |
| `search/<slug>.json` | **Generated** search index `[id, who, "act.scene", original, modern]` from each play's `DATA`. | Never by hand |
| `CHANGELOG.md` | Release history. | Every PR |
| `.github/workflows/build-check.yml` | CI: `node tools/build.js --check`. | Rarely |

Plays (slug → localStorage prefix): `othello` `oth-`, `antony-and-cleopatra` `ant-`, `king-lear` `lear-`, `twelfth-night` `tn-`, `much-ado` `ado-`, `tempest` `tem-`.

## Build / release

1. Make edits.
2. `node tools/build.js` — rewrites `search/*.json`, `sw.js`, `version.json`. Build hash = sha256 of every precached file, so it changes only when content does.
3. Commit generated files in the same commit as the source change.
4. CI fails if outputs are stale (`node tools/build.js --check`). Never hand-patch `sw.js`/`version.json` to pass it.
5. Merge to `main` = deploy. Installed apps pick up the new `sw.js` (update check on load, foreground, every 30 min) and show the toast.

Local preview: `python3 -m http.server` in repo root → `http://localhost:8000/`.

Adding a play: create `<slug>/index.html` (copy the newest play as template), add an entry to `PLAYS` in `index.html` with a new unique prefix **and** to the duplicate play list in the launch-redirect script near the top of `index.html` (`ok=[...]`, ~line 18), add the legacy `<slug>/sw.js` stub only if needed, run build, update README play list.

## Versioning

- Semver, baseline **1.0.0** = app as of PR #22 (6 plays, build script).
- Bump in every PR that changes what users get:
  - **major**: breaking change to saved data (localStorage keys/format, backup format) or app structure.
  - **minor**: new play, new feature, new Study content set.
  - **patch**: fixes, text corrections, styling.
  - Docs/CI-only PRs: no bump; add a line under `## [Unreleased]` in `CHANGELOG.md`, folded into the next release.
- `build` hash is cache-busting only; it is not the version.
- Each bump: new `## [x.y.z] — YYYY-MM-DD` section at top of `CHANGELOG.md` (Added / Changed / Fixed / Removed), one line per user-visible change, PR number at end.

## Coding conventions

- **localStorage**: play-specific keys use the play's prefix (`oth-bm`, `tem-lastbk`). Shared settings use `folio-` (`folio-theme`, `folio-size`, `folio-genre`, `folio-tab`, `folio-last`, `folio-lastbk`, `folio-stat-<id>`). Plays route shared keys via `LS.key()`. Never rename or reformat an existing key without a migration (= major bump). New prefix must be unique and added to `PLAYS`.
- Shelf backup/restore covers keys matching `folio-` or a `PLAYS[].prefix` (`mine()` in `index.html`) — new keys must fit those prefixes or backups lose them.
- **Service worker**: one SW at repo root, scope `./`, registered only by `update.js` (`../update.js` from plays). Plays must not register their own SW. Any new top-level asset a page needs offline must be added to the precache list in `tools/build.js`.
- Play pages link `../manifest.webmanifest`, `../reader.css`, `../fonts.css`, `../update.js`, and a `‹ Folio` link to `../?shelf`.
- **Self-contained plays**: until the reader merge lands (see Pending), each play keeps its own inline reader JS. A reader fix must be applied to every play that has the bug; check all 6. Do not introduce a shared reader JS file outside that work.
- No external CDNs, trackers or network calls; everything must work offline.
- Text floor 14px; keep theme parity (light/dark/sepia) between shelf and plays; test tablet portrait beside the side panel.
- Keep JSON consts valid JSON (`build.js` parses `PLAYS` and `DATA` with `JSON.parse`).
- Speech parts (`PARTS`) must stay in sync with modern text; never merge/split parts without re-checking alignment.

## Content rules

- Modern English and Study content (key facts, character analysis, motifs, questions) are written fresh from the play text. Counts/facts are derived from the text itself.
- Published study guides may be consulted only to fact-check. Never copy or paraphrase them.
- Original text follows the edition already used in the play page; don't silently modernise spelling.

## Testing before merge (all required)

1. `node tools/build.js --check` passes.
2. Headless Chromium (preinstalled Playwright) against local server: load `/` and every touched play; zero console errors; root SW registers with the new `folio-<build>` cache; search returns results; offline reload (context offline) still renders.
3. UI changes: screenshots at phone (e.g. iPhone 13) and tablet portrait (e.g. iPad Mini) of affected screens, attached/linked in the PR.

## Git / PR rules

- Work on the session's designated branch; branch from latest `main`.
- One topic per PR. PR title = imperative user-facing summary (it becomes the squash commit, e.g. `Add The Tempest: … (#17)`).
- PR body: Changes, Version (old → new), Testing (commands + results, screenshots), Pending/follow-ups.
- **Always squash-merge into `main`** once CI and the tests above pass. No waiting for manual review.
- Never force-push `main`, never rewrite others' branches, never skip/disable the CI check.
- Commit generated files with their source change; no separate "rebuild" commits unless the build itself changed.

## Working with TY

- Terse, technical output. No narration; report on completion with result + PR link.
- Questions: one at a time, as multiple-choice decision cards with a recommended option.

## Pending (update when done)

- **Reader merge** (in progress, separate thread): play pages' forked reader JS to be unified into a shared reader. After it lands, update "Self-contained plays" above and the Layout table.
- **Version wiring**: add `"version"` to `version.json` via `tools/build.js` (source of truth: top of `CHANGELOG.md`), show `Folio vX.Y.Z` in shelf footer, toast text `Updated to vX.Y.Z · tap to reload`.
- Original generator for play pages (and `partsfix.json`) is not in the repo; play pages are now hand-edited sources.
