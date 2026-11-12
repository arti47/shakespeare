# CLAUDE.md — Shakespeare Folio

Rules for every Claude session working on `arti47/shakespeare`. Read fully before changing anything.

## What this is

Static PWA on GitHub Pages: https://arti47.github.io/shakespeare/ (served from `main`, root, `.nojekyll`).
No framework, no npm deps. Node 20 only for `tools/build.js`.

## Layout

| Path | Role | Edit? |
|---|---|---|
| `index.html` | Folio shelf. `const PLAYS=[...]` is the play registry (id, prefix, log, group, title…). | Hand-edit |
| `<slug>/play.js` | **Source of truth** for a play: `CFG` (id, prefix, titles, backup id, per-play wording) + content consts (`DATA`, `STUDY`, `PARTS`, `QUOTES`, `EX`, `EXT`, `MAINS`, `COLORS`, `PICS`, `BEATS`). | Hand-edit, or regenerate via `tools/newplay/` |
| `reader.js` | Shared reader + study code for every play, driven by `CFG`. | Hand-edit |
| `tools/play.html` | Page shell for play pages. | Hand-edit |
| `<slug>/index.html` | **Generated** from `tools/play.html` + `CFG`; loads `play.js` then `../reader.js`. | Never by hand |
| `<slug>/sw.js` | Legacy stub: unregisters old per-play SWs. Do not extend. | No |
| `reader.css` | Shared reader styles for all plays. | Hand-edit |
| `fonts.css`, `fonts/*.woff2` | Self-hosted fonts. | Rarely |
| `update.js` | Registers root `sw.js`, update checks, "Folio updated" toast. | Hand-edit |
| `manifest.webmanifest`, icons | Single app manifest, scope `./`. | Rarely |
| `tools/build.js` | Generates play pages, search index, `sw.js`, `version.json`. | Hand-edit |
| `tools/newplay/` | Content pipeline for a new play: `parse.js` (Gutenberg → speeches), `dump.js`, `merge.js` (modern English batches), `assemble.js` (validate + write `play.js`), `template.js` (shipped play → work folder). How-to and data shapes: `tools/newplay/README.md`. Not precached, not deployed as app files. | Hand-edit |
| `sw.js` | **Generated.** Service worker, cache `folio-<build>`. | Never by hand |
| `version.json` | **Generated** `build` hash (+ `version`, see Versioning). | `build`: never by hand |
| `search/<slug>.json` | **Generated** search index `[id, who, "act.scene", original, modern]` from each play's `DATA`. | Never by hand |
| `CHANGELOG.md` | Release history. | Every PR |
| `.github/workflows/build-check.yml` | CI: `node tools/build.js --check`. | Rarely |

Plays (slug → localStorage prefix): `othello` `oth-`, `antony-and-cleopatra` `ant-`, `king-lear` `lear-`, `twelfth-night` `tn-`, `much-ado` `ado-`, `tempest` `tem-`, `richard-ii` `rii-`, `midsummer` `mnd-`, `hamlet` `ham-`, `macbeth` `mac-`, `julius-caesar` `jc-`, `as-you-like-it` `ayl-`, `romeo-and-juliet` `rom-`, `two-gentlemen` `tgv-`, `alls-well` `aww-`, `merchant-of-venice` `mov-`, `loves-labours-lost` `lll-`, `taming-of-the-shrew` `tos-`, `comedy-of-errors` `err-`, `measure-for-measure` `mfm-`, `merry-wives` `wiv-`, `winters-tale` `wt-`, `titus-andronicus` `ta-`, `troilus-and-cressida` `tc-`, `timon-of-athens` `tim-`, `coriolanus` `cor-`, `cymbeline` `cym-`, `king-john` `kj-`, `henry-iv-part-1` `1h4-`, `henry-v` `h5-`, `henry-iv-part-2` `2h4-`, `henry-vi-part-1` `1h6-`, `henry-vi-part-3` `3h6-`, `henry-viii` `h8-`, `richard-iii` `riii-`.

## Build / release

1. Make edits.
2. `node tools/build.js` — rewrites `<slug>/index.html`, `search/*.json`, `sw.js`, `version.json`. Build hash = sha256 of every precached file, so it changes only when content does.
3. Commit generated files in the same commit as the source change.
4. CI fails if outputs are stale (`node tools/build.js --check`). Never hand-patch `sw.js`/`version.json` to pass it.
5. Merge to `main` = deploy. Installed apps pick up the new `sw.js` (update check on load, foreground, every 30 min) and show the toast.

Local preview: `python3 -m http.server` in repo root → `http://localhost:8000/`.

## Adding a play (full checklist)

First Folio plays only (see Folio genres). Content steps, commands and data shapes: **`tools/newplay/README.md`**.

1. Ask the owner (decision cards, one at a time): slug, localStorage prefix (unique, short, e.g. `ta-`), the play's step tracker (`EX.iago`, e.g. "the revenge chain") and chart (`EX.arc`, two series, e.g. "Titus's suffering vs Tamora's power"), and whether a study guide is coming. Genre comes from the Folio list, not a question.
2. Text: Project Gutenberg plain text (www.gutenberg.org is allowed in the project's network settings; do not ask again. If a session's proxy still refuses it, the GITenberg mirror on GitHub works: `https://raw.githubusercontent.com/GITenberg/<Title>_<n>/master/<n>.txt`, e.g. `The-Tragedy-of-Coriolanus_1535`). `node tools/newplay/parse.js <wip>`; fix with `parse.config.js` until speakers, scenes and stage directions are clean. Work folder stays outside the repo.
3. Modern English for every speech in `<wip>/m/*.txt` batches (10+ line speeches in line ranges → `PARTS`); `merge.js` reports `errors 0 missing 0`.
4. Study content `s1.js`–`s4.js` (CFG, cast, colours, scene summaries + 4-option quizzes, notes, glossary, ~150 quotes in themes, `EX` extras, story `BEATS`): full parity with the latest play. All written fresh from the text.
5. If a guide was uploaded: check modern English, summaries and Study against it (Content rules). Record it under Pending → Guide checks.
6. `node tools/newplay/assemble.js <wip>` → `validation errors: 0`, writes `<slug>/play.js`.
7. `index.html`: add the play to `PLAYS` (append; `id`, `prefix`, `group` = Folio genre, title fields: copy a neighbour), its id to the launch-redirect list `ok=[…]` (~line 18, same order as `PLAYS`; `build.js` fails if they differ), its `QUOTES` to `LINES` and its gloss to `WORDS` (same line as `PLAYS`) for Line/Word of the day, and its id into `CHRON` in composition order (Oxford chronology). No per-play `sw.js`.
8. `node tools/build.js`; README play list; `CHANGELOG.md` minor bump (one Added line: text, speech count, glossary size, Study set, tracker, chart, CHRON position, guide checked); CLAUDE.md slug/prefix list above.
9. Tests (Testing before merge), PR, squash-merge on green CI.

Parallel play threads: whichever merges second takes the next minor version.

## Folio genres

The app holds only the 36 plays of the 1623 First Folio. Shelves (`PLAYS[].group`, `GENRES` in `index.html`) follow the 1623 First Folio's three groups only: `Comedies`, `Histories`, `Tragedies`. No Romance or Problem shelf; `build.js` fails on any other group. Study text may mention later labels ('romance', 'problem play') but a play's Key facts `Genre` line leads with its Folio genre.

- Comedies: The Tempest, Two Gentlemen, Merry Wives, Measure for Measure, Comedy of Errors, Much Ado, Love's Labour's Lost, Midsummer, Merchant of Venice, As You Like It, Taming of the Shrew, All's Well, Twelfth Night, The Winter's Tale.
- Histories: King John, Richard II, 1 & 2 Henry IV, Henry V, 1–3 Henry VI, Richard III, Henry VIII.
- Tragedies: Troilus and Cressida (unpaginated, placed between histories and tragedies), Coriolanus, Titus Andronicus, Romeo and Juliet, Timon of Athens, Julius Caesar, Macbeth, Hamlet, King Lear, Othello, Antony and Cleopatra, Cymbeline.
- Not in the Folio, so never added (TY's rule: First Folio plays only): Pericles, The Two Noble Kinsmen, Edward III, Sir Thomas More.

## Versioning

- Semver, baseline **1.0.0** = app as of PR #23 (6 plays, build script, shared reader).
- Bump in every PR that changes what users get:
  - **major**: breaking change to saved data (localStorage keys/format, backup format) or app structure.
  - **minor**: new play, new feature, new Study content set.
  - **patch**: fixes, text corrections, styling.
  - Docs/CI-only PRs: no bump; add a line under `## [Unreleased]` in `CHANGELOG.md`, folded into the next release.
- `build` hash is cache-busting only; it is not the version.
- Each bump: new `## [x.y.z] — YYYY-MM-DD` section at top of `CHANGELOG.md` (Added / Changed / Fixed / Removed), one line per user-visible change, PR number at end.

## Coding conventions

- **localStorage**: play-specific keys use the play's prefix (`oth-bm`, `tem-lastbk`). Shared settings use `folio-` (`folio-theme`, `folio-size`, `folio-genre`, `folio-tab`, `folio-last`, `folio-lastbk`, `folio-stat-<id>`, `folio-sort`). `reader.js` routes shared keys via `LS.key()`. Never rename or reformat an existing key without a migration (= major bump). New prefix must be unique and added to `PLAYS`.
- Shelf backup/restore covers keys matching `folio-` or a `PLAYS[].prefix` (`mine()` in `index.html`) — new keys must fit those prefixes or backups lose them.
- **Service worker**: one SW at repo root, scope `./`, registered only by `update.js` (`../update.js` from plays). Plays must not register their own SW. Any new top-level asset a page needs offline must be added to the precache list in `tools/build.js`.
- Play page shell (`tools/play.html`) links `../manifest.webmanifest`, `../reader.css`, `../fonts.css`, `play.js`, `../reader.js`, `../update.js`.
- **App shell (2.0)**: shelf and plays share one bottom nav, Library / Read / Study / You (shelf `.tabs`, plays `#fnav`; keep both in step). Play views: `reader`, `study`, `you` (no play home; `#home`/`#contents` open the reader with the Contents sheet). Study tabs are grouped by `SGROUPS` in `reader.js`. Shelf search accepts `#search=<q>`. Inside a genre the shelf sorts by Recent / Date written / A–Z (`folio-sort`); date order comes from `CHRON` in `index.html` (Oxford chronology), so add each new play's id there in composition order. A play counts as begun while `folio-stat-<id>` exists; "Mark as not started" (`unstart()` in both `index.html` and `reader.js`, keep in step) removes it and `<prefix>pos`, empties `<prefix>prog.done`, and moves `folio-last` to the most recent other begun play.
- **Shared reader**: reader behaviour lives only in `reader.js`; play differences go in `CFG`/content in `play.js`, never in forks or per-play `id` checks where a `CFG` field would do. A reader change affects every play: smoke-test each.
- **Escaping**: stored, synced or imported user data (localStorage, backups) rendered as HTML must go through `esc()` in `reader.js`. Never interpolate raw user data into `innerHTML`.
- No external CDNs, trackers or network calls; everything must work offline.
- Text floor 14px; keep theme parity (light/dark/sepia) between shelf and plays; test tablet portrait beside the side panel.
- Keep `PLAYS`, `CFG` and `DATA` valid JSON literals (`build.js` parses them with `JSON.parse`).
- Speech parts (`PARTS`) must stay in sync with modern text; never merge/split parts without re-checking alignment.

## Content rules

- Modern English and Study content (key facts, character analysis, motifs, questions) are written fresh from the play text. Counts/facts are derived from the text itself.
- Study guides TY uploads (including commercial ones: SparkNotes, No Fear, CliffsNotes) are always checked against a play's modern English, summaries and Study sets. Fix factual errors and fill gaps by restating their factual points in our own words. Never copy their wording, translations or quiz items, and never reproduce their analysis section by section. Verify every guide claim against the play text before using it: guides can be wrong (e.g. one Dream guide puts Titania, not Oberon, as arriving from India).
- Original text follows the edition already used in `play.js`; don't silently modernise spelling. New plays: Project Gutenberg text (www.gutenberg.org), with curly quotes made straight, speaker names in capitals, stage directions without brackets, and sung or chanted lines marked with a leading `~` (shown as songs). A prologue or act chorus with no scene of its own opens the first scene of its act (Romeo and Juliet), so scene numbers match standard editions. An induction with scenes of its own (The Taming of the Shrew) is act `0` in `DATA` (scene ids `a0s1`, `a0s2`): `reader.js` names it "Induction" (`AN()`, `ACTS`) and lists it before Act 1, and `build.js` labels its search hits `Ind.i`; give `EX.rel` a `"0"` key if the Induction should get a character map. Where Gutenberg gives only "The same" for a scene's location (The Comedy of Errors), set the standard editorial locations in the parse step so stage pictures and `EX.stagerules` fit.

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

- Project rules that apply however the work is started (they were also set as project instructions): First Folio plays only and Folio genres only (see Folio genres; never Pericles, The Two Noble Kinsmen, Edward III or Sir Thomas More); always check content against any study guide TY uploads, paraphrase only, never copy wording, and the play text is the final word when a guide disagrees; **update this CLAUDE.md in the same PR whenever a change touches the code, structure, build or workflow of the repo**.

- Terse, technical output. No narration; report on completion with result + PR link.
- **Every task, before starting work: ask as many relevant questions as needed, one at a time** (wait for each answer before the next). Cover scope, versioning impact, UI/behaviour choices, content sources, and anything ambiguous. Skip only questions this file or the request already answers.
- Each question: a multiple-choice decision card with a recommended option. If TY asks to go back, re-ask the previous question.

## Pending (update when done)

- **Version wiring**: add `"version"` to `version.json` via `tools/build.js` (source of truth: top of `CHANGELOG.md`), show `Folio vX.Y.Z` in shelf footer, toast text `Updated to vX.Y.Z · tap to reload`.
- **Guide checks**: done for 34 plays (A&C, Tempest, Much Ado, Macbeth and Julius Caesar: SparkNotes and CliffsNotes; Othello, Hamlet and Midsummer: study guides, #53; Lear, Twelfth Night, As You Like It, Romeo and Juliet, Two Gentlemen, All's Well, The Merchant of Venice, Love's Labour's Lost, The Taming of the Shrew, The Comedy of Errors, Measure for Measure, The Merry Wives of Windsor, Titus Andronicus, Troilus and Cressida, Timon of Athens, Coriolanus, Cymbeline and King John: SparkNotes; Richard II: No Fear; 1 Henry IV: LitCharts; Henry V: SparkNotes; 2 Henry IV: SparkNotes; 1 Henry VI: SparkNotes; 3 Henry VI: SparkNotes; Henry VIII: SparkNotes; Richard III: SparkNotes). The Winter's Tale: no guide uploaded yet. Re-check any play when TY sends a new guide.
- `play.js` is the only content source in the repo. Per-play work folders (`m/*.txt`, `s1`–`s4.js`) were not committed; `node tools/newplay/template.js <slug> <wip>` recreates one from any shipped `play.js`.
